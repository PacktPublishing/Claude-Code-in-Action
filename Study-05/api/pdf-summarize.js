/**
 * Vercel Serverless Function for PDF Summarization
 * Uses OpenRouter API to summarize PDF text content
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, fileName, summaryMode = 'normal' } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Please provide the PDF text.' });
        }

        // Get API key from environment
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY not configured');
            return res.status(500).json({ error: 'API key is not configured.' });
        }

        // Limit text length
        const maxLength = 8000;
        let processedText = text;
        if (processedText.length > maxLength) {
            processedText = processedText.substring(0, maxLength) + '...';
        }

        // Prompt instructions for each summary mode
        const modeInstructions = {
            brief: 'Summarize the following text very briefly in 3-5 lines. Capture only the essentials in a clear, concise way, and provide exactly 3 key points.',
            normal: 'Summarize the following text at a moderate length. Include all of the main content while keeping it concise, and provide 5 key points.',
            detailed: 'Summarize the following text in detail. Include important details and context with sufficient explanation, and provide 7 or more key points.'
        };

        const modeInstruction = modeInstructions[summaryMode] || modeInstructions.normal;

        // Create summarization prompt
        const prompt = `You are a professional document summarization AI. ${modeInstruction} Respond in English.

Document title: ${fileName || 'Untitled'}

Document content:
"${processedText}"

Respond in exactly the following format:

Summary: [summary content]
Key Points:
- [key point 1]
- [key point 2]
- [key point 3]
${summaryMode === 'detailed' ? '- [key point 4]\n- [key point 5]\n- [key point 6]\n- [key point 7]' : summaryMode === 'normal' ? '- [key point 4]\n- [key point 5]' : ''}

Response rules:
1. The summary should cover the most important information in the document ${summaryMode === 'brief' ? 'very briefly' : summaryMode === 'detailed' ? 'in detail' : 'concisely'}
2. Write in clear, easy-to-understand English
3. Do not distort the meaning of the original text
4. Maintain an objective and factual tone`;

        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.referer || 'https://vibecoding-eng-ch07.vercel.app',
                'X-Title': 'PDF Summarizer App'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API error:', response.status, errorText);
            return res.status(response.status).json({
                error: `API call failed: ${response.statusText}`,
                details: errorText
            });
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid API response:', data);
            return res.status(500).json({ error: 'Invalid API response.' });
        }

        // Parse the response
        const responseText = data.choices[0].message.content;
        const result = parseApiResponse(responseText);

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'A server error occurred.',
            message: error.message
        });
    }
}

/**
 * Parse API response to extract summary and key points
 */
function parseApiResponse(responseText) {
    try {
        // Extract main content and key points
        const mainContentMatch = responseText.match(/Summary:\s*(.+?)(?=\nKey Points:|\n\n|$)/s);
        const keyPointsMatch = responseText.match(/Key Points:\s*([\s\S]+?)(?=\n\n|$)/);

        let mainContent = 'Could not extract the summary.';
        let keyPoints = [];

        if (mainContentMatch) {
            mainContent = mainContentMatch[1].trim();
        }

        if (keyPointsMatch) {
            const pointsText = keyPointsMatch[1];
            // Extract bullet points
            const points = pointsText.match(/[-•]\s*(.+?)(?=\n-|\n•|$)/g);
            if (points) {
                keyPoints = points.map(p => p.replace(/^[-•]\s*/, '').trim());
            }
        }

        return {
            mainContent,
            keyPoints,
            fullResponse: responseText
        };
    } catch (error) {
        console.error('Response parsing error:', error);
        // Return default response on parsing failure
        return {
            mainContent: 'An error occurred while summarizing the document.',
            keyPoints: ['Could not extract the summary.'],
            fullResponse: responseText
        };
    }
}
