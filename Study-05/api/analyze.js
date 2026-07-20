/**
 * Vercel Serverless Function for Empathy Diary Emotion Analysis
 * Uses OpenRouter API to analyze diary entries and provide empathetic responses
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
        const { diaryText } = req.body;

        if (!diaryText || diaryText.trim().length === 0) {
            return res.status(400).json({ error: 'Please enter your diary entry.' });
        }

        // Get API key from environment
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY not configured');
            return res.status(500).json({ error: 'API key is not configured.' });
        }

        // Limit text length
        const maxLength = 2000;
        let processedText = diaryText;
        if (processedText.length > maxLength) {
            processedText = processedText.substring(0, maxLength) + '...';
        }

        // Create emotion analysis prompt
        const prompt = `You are a warm and empathetic AI counselor. Read the following diary entry, analyze the emotion, and write an empathetic message. Respond in English.

Diary entry:
"${processedText}"

Respond in exactly the following format:

Emotion: one of [joy/sadness/anger/fear/surprise/calm/mixed]
Intensity: [a number between 1 and 10]
Empathy Message: [a warm, empathetic message of 2-3 sentences]

Response rules:
1. The emotion must be exactly one of the 7 options above
2. Intensity is a number from 1 (very weak) to 10 (very strong)
3. The empathy message should empathize without judging, written in a warm tone
4. Use a gentle, respectful tone throughout
5. Focus on emotional empathy rather than giving specific advice

Example:
Emotion: sadness
Intensity: 7
Empathy Message: It sounds like you had a hard day. Feeling this way is completely natural, and please remember that this very moment is still precious.`;

        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.referer || 'https://vibecoding-empathy-diary.vercel.app',
                'X-Title': 'Empathy Diary App'
            },
            body: JSON.stringify({
                model: 'google/gemma-4-26b-a4b-it:free',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
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
 * Parse API response to extract emotion, intensity, and message
 */
function parseApiResponse(responseText) {
    try {
        // Extract information using regex
        const emotionMatch = responseText.match(/Emotion:\s*([A-Za-z]+)/i);
        const intensityMatch = responseText.match(/Intensity:\s*(\d+)/i);
        const messageMatch = responseText.match(/Empathy Message:\s*(.+?)(?=\n\n|\nEmotion|\nIntensity|$)/is);

        if (!emotionMatch || !intensityMatch || !messageMatch) {
            throw new Error('The response format is invalid.');
        }

        const emotionLabel = emotionMatch[1].trim();
        const emotion = emotionLabel.toLowerCase();
        const emotionScore = parseInt(intensityMatch[1]);
        const empathyMessage = messageMatch[1].trim();

        // Normalize the emotion keyword and build a display label
        const emotionMapping = {
            'joy': 'Joy',
            'sadness': 'Sadness',
            'anger': 'Anger',
            'fear': 'Fear',
            'surprise': 'Surprise',
            'calm': 'Calm',
            'mixed': 'Mixed'
        };

        return {
            emotion: emotionMapping[emotion] ? emotion : 'mixed',
            emotionKorean: emotionMapping[emotion] || 'Mixed', // display label (field name kept for frontend compatibility)
            empathyMessage: empathyMessage,
            emotionScore: emotionScore
        };
    } catch (error) {
        console.error('Response parsing error:', error);
        // Return default response on parsing failure
        return {
            emotion: 'mixed',
            emotionKorean: 'Mixed',
            empathyMessage: 'Thank you for sharing your precious diary entry. I understand your feelings and experiences, and I am always here cheering for you.',
            emotionScore: 5
        };
    }
}
