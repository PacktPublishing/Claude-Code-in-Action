/**
 * Vercel serverless function - recipe generation
 * The API key is managed on the server side
 */

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Allow POST requests only
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt, imageBase64, type } = req.body;

        // Get the API key from environment variables
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: 'Server configuration error: API key not set'
            });
        }

        // Check the image size (rough estimate based on Base64 string length)
        if (imageBase64) {
            const imageSizeKB = (imageBase64.length * 0.75) / 1024; // Base64 is about 133% of the original
            console.log(`Image size (estimated): ${imageSizeKB.toFixed(2)} KB`);

            // 5MB limit (typical limit for OpenRouter/Gemma)
            if (imageSizeKB > 5120) {
                return res.status(400).json({
                    error: 'The image is too large. Please use an image under 5MB.',
                    size: `${imageSizeKB.toFixed(2)} KB`
                });
            }
        }

        // Call the OpenRouter API
        const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

        // Build the content
        let content;
        if (imageBase64) {
            content = [
                {
                    type: "text",
                    text: prompt
                },
                {
                    type: "image_url",
                    image_url: {
                        url: imageBase64
                    }
                }
            ];
        } else {
            content = prompt;
        }

        const requestBody = {
            model: 'openai/gpt-oss-20b:free',
            messages: [
                {
                    role: "user",
                    content: content
                }
            ],
            max_tokens: 2000,  // Increased token limit
            temperature: 0.7,
            top_p: 0.9,  // Increases response variety
            frequency_penalty: 0.0,
            presence_penalty: 0.0
        };

        console.log('Image included:', !!imageBase64);

        const response = await fetch(openRouterUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.referer || 'https://vibecoding-fridge.vercel.app',
                'X-Title': 'Fridge Recipe App'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API error:', errorText);
            return res.status(response.status).json({
                error: `AI API error: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        console.log('OpenRouter response:', JSON.stringify(data, null, 2));

        if (data.choices && data.choices[0] && data.choices[0].message) {
            const content = data.choices[0].message.content || '';

            // Check for an empty response
            if (!content || content.trim() === '') {
                console.warn('The AI returned an empty response.');
                return res.status(200).json({
                    success: false,
                    error: 'The AI could not process the image.',
                    content: ''
                });
            }

            return res.status(200).json({
                success: true,
                content: content
            });
        } else {
            console.error('Invalid response structure:', data);
            return res.status(500).json({
                error: 'Invalid response from AI API',
                responseData: data
            });
        }

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
