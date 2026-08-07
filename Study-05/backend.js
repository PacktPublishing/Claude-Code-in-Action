/**
 * Empathy AI Diary Backend
 * Uses the gpt-oss-20b model via the OpenRouter API for emotion analysis and empathetic message generation
 */

class EmpathyDiaryBackend {
    constructor() {
        // Get the API key from environment variables (important for security)
        this.apiKey = this.getApiKey();
        this.baseUrl = 'https://openrouter.ai/api/v1';
        this.model = 'openai/gpt-oss-20b:free';

        // CORS proxy options (used when needed)
        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://corsproxy.io/?'
        ];

        this.currentProxyIndex = -1; // -1 means direct calls
    }

    /**
     * Safely retrieve the API key
     */
    getApiKey() {
        // 1. Try environment variables first
        if (typeof process !== 'undefined' && process.env && process.env.OPENROUTER_API_KEY) {
            return process.env.OPENROUTER_API_KEY;
        }

        // 2. Try localStorage (if the user has set one)
        if (typeof localStorage !== 'undefined') {
            const storedKey = localStorage.getItem('openrouter_api_key');
            if (storedKey) {
                return storedKey;
            }
        }

        // 3. Default value (for demos) - must be removed before real deployment
        console.warn('No API key configured. Running in demo mode.');
        return '[OpenRouter API key]'; // For demo use
    }

    /**
     * Function that lets the user set an API key
     */
    setApiKey(apiKey) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('openrouter_api_key', apiKey);
            this.apiKey = apiKey;
            console.log('API key has been set.');
        } else {
            console.warn('localStorage is not available.');
        }
    }

    /**
     * Create the emotion analysis prompt for the gpt-oss model
     */
    createEmotionAnalysisPrompt(diaryText) {
        return `You are a warm and empathetic AI counselor. Read the following diary entry, analyze the emotion, and write an empathetic message. Respond in English.

Diary entry:
"${diaryText}"

Respond in exactly the following format:

Emotion: one of [Joy/Sadness/Anger/Fear/Surprise/Calm/Mixed]
Intensity: [a number between 1 and 10]
EmpathyMessage: [a warm, empathetic message of 2-3 sentences]

Response rules:
1. The emotion must be exactly one of the 7 options above
2. Intensity is a number from 1 (very weak) to 10 (very strong)
3. The empathy message should empathize without judging, written in a warm tone
4. Use polite, gentle phrasing such as "It sounds like..." or "You must have felt..."
5. Focus on empathizing with the emotion rather than giving specific advice

Example:
Emotion: Sadness
Intensity: 7
EmpathyMessage: It sounds like you had a hard day. Feeling this way is completely natural, and please remember that this very moment is still precious.`;
    }

    /**
     * Parse the API response
     */
    parseApiResponse(responseText) {
        try {
            // Use regular expressions to extract the needed information from the response
            const emotionMatch = responseText.match(/Emotion:\s*([A-Za-z]+)/);
            const intensityMatch = responseText.match(/Intensity:\s*(\d+)/);
            const messageMatch = responseText.match(/EmpathyMessage:\s*(.+?)(?=\n\n|\nEmotion|\nIntensity|$)/s);

            if (!emotionMatch || !intensityMatch || !messageMatch) {
                throw new Error('The response format is invalid.');
            }

            const emotion = emotionMatch[1].trim();
            const emotionScore = parseInt(intensityMatch[1]);
            const empathyMessage = messageMatch[1].trim();

            // Map the emotion label to an internal code (if needed)
            const emotionMapping = {
                'Joy': 'joy',
                'Sadness': 'sadness',
                'Anger': 'anger',
                'Fear': 'fear',
                'Surprise': 'surprise',
                'Calm': 'calm',
                'Mixed': 'mixed'
            };

            return {
                emotion: emotionMapping[emotion] || emotion.toLowerCase(),
                emotionLabel: emotion,
                empathyMessage: empathyMessage,
                emotionScore: emotionScore
            };
        } catch (error) {
            console.error('Response parsing error:', error);
            // Return default values if parsing fails
            return {
                emotion: 'mixed',
                emotionLabel: 'Mixed',
                empathyMessage: 'Thank you for sharing this precious diary entry. I understand your feelings and experiences, and I am always cheering for you.',
                emotionScore: 5
            };
        }
    }

    /**
     * Call the OpenRouter API
     */
    async callOpenRouterAPI(prompt, useProxy = false, proxyIndex = 0) {
        const requestBody = {
            model: this.model,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            // gpt-oss is a reasoning model: it spends part of the budget
            // thinking before it writes, so keep this generous.
            max_tokens: 1500,
            temperature: 0.7
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Empathy Diary App'
            },
            body: JSON.stringify(requestBody)
        };

        let url = `${this.baseUrl}/chat/completions`;

        if (useProxy) {
            url = this.corsProxies[proxyIndex] + encodeURIComponent(url);
            // When using a proxy, move the Authorization header into a URL parameter
            if (this.corsProxies[proxyIndex].includes('allorigins.win')) {
                requestOptions.headers = {
                    'Content-Type': 'application/json'
                };
                url += `&headers=${encodeURIComponent(JSON.stringify({
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }))}`;
            }
        }

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Main diary emotion analysis function
     */
    async analyzeDiaryEntry(diaryText) {
        if (!diaryText || diaryText.trim().length === 0) {
            throw new Error('Please enter a diary entry.');
        }

        // Validate text length (truncate if too long)
        const maxLength = 2000;
        if (diaryText.length > maxLength) {
            diaryText = diaryText.substring(0, maxLength) + '...';
            console.warn(`Text was too long and has been truncated to ${maxLength} characters.`);
        }

        // First try the Vercel serverless API (deployed environment)
        try {
            console.log('Trying the Vercel serverless API...');
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ diaryText })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('Emotion analysis complete (serverless):', data);
                    return {
                        emotion: data.emotion,
                        emotionLabel: data.emotionLabel,
                        empathyMessage: data.empathyMessage,
                        emotionScore: data.emotionScore
                    };
                }
            } else {
                console.warn('Serverless API call failed:', response.status);
            }
        } catch (error) {
            console.warn('Serverless API call error:', error.message);
        }

        // Local development environment: call the OpenRouter API directly
        const prompt = this.createEmotionAnalysisPrompt(diaryText);

        // Try a direct call
        try {
            console.log('Trying a direct API call...');
            const response = await this.callOpenRouterAPI(prompt, false);

            if (response.choices && response.choices[0] && response.choices[0].message) {
                const result = this.parseApiResponse(response.choices[0].message.content);
                console.log('Emotion analysis complete:', result);
                return result;
            }
        } catch (error) {
            console.warn('Direct call failed:', error.message);
            console.log('Trying calls through CORS proxies...');
        }

        // Try calling through CORS proxies
        for (let i = 0; i < this.corsProxies.length; i++) {
            try {
                console.log(`Trying proxy ${i + 1}: ${this.corsProxies[i]}`);
                const response = await this.callOpenRouterAPI(prompt, true, i);

                if (response.choices && response.choices[0] && response.choices[0].message) {
                    const result = this.parseApiResponse(response.choices[0].message.content);
                    console.log('Emotion analysis complete (via proxy):', result);
                    this.currentProxyIndex = i; // Remember the proxy that worked
                    return result;
                }
            } catch (error) {
                console.warn(`Proxy ${i + 1} failed:`, error.message);
                continue;
            }
        }

        // Every attempt failed. Say so plainly rather than quietly returning a
        // keyword guess dressed up as an AI analysis.
        throw new Error(
            'The emotion analysis service could not be reached. ' +
            'The free tier allows a limited number of requests per minute, ' +
            'so please wait a moment and try again.'
        );
    }

    /**
     * Fallback emotion analysis when API calls fail (local keyword-based)
     */
    fallbackAnalysis(diaryText) {
        const text = diaryText.toLowerCase();

        // Emotion keyword mapping
        const emotionKeywords = {
            joy: ['joy', 'happy', 'glad', 'fun', 'laugh', 'love', 'success', 'congrat', 'thank'],
            sadness: ['sad', 'depress', 'tear', 'hard', 'hurt', 'miss', 'lonely', 'disappoint'],
            anger: ['angry', 'annoy', 'rage', 'furious', 'mad', 'unfair', 'frustrat'],
            fear: ['scared', 'afraid', 'worry', 'anxious', 'trembl', 'nervous'],
            surprise: ['surpris', 'amaz', 'startl', 'unexpected', 'sudden'],
            calm: ['calm', 'quiet', 'peace', 'stable', 'relax']
        };

        let maxScore = 0;
        let detectedEmotion = 'mixed';

        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            const score = keywords.reduce((sum, keyword) => {
                return sum + (text.includes(keyword) ? 1 : 0);
            }, 0);

            if (score > maxScore) {
                maxScore = score;
                detectedEmotion = emotion;
            }
        }

        const emotionLabelMap = {
            joy: 'Joy',
            sadness: 'Sadness',
            anger: 'Anger',
            fear: 'Fear',
            surprise: 'Surprise',
            calm: 'Calm',
            mixed: 'Mixed'
        };

        const empathyMessages = {
            joy: 'Thank you for capturing this joyful moment in your diary. I hope this happy feeling stays with you for a long time.',
            sadness: 'It sounds like you are going through a difficult time. Sad feelings are also a precious part of your experience. I hope you recover slowly and gently.',
            anger: 'That must have been an upsetting situation. Feeling that way is completely natural. I hope your mind finds calm soon.',
            fear: 'It sounds like you are feeling anxious and afraid. Acknowledging and accepting those feelings is an important step.',
            surprise: 'What a surprising experience you had. Unexpected events can sometimes become new opportunities.',
            calm: 'It sounds like you had a peaceful day. These stable, quiet moments are truly precious.',
            mixed: 'It sounds like a day of many crossing emotions. Complicated feelings are also a precious part of your experience.'
        };

        return {
            emotion: detectedEmotion,
            emotionLabel: emotionLabelMap[detectedEmotion],
            empathyMessage: empathyMessages[detectedEmotion],
            emotionScore: Math.min(maxScore + 3, 10) // Adjusted to the 3-10 range
        };
    }

    /**
     * Connection test
     */
    async testConnection() {
        try {
            const testResult = await this.analyzeDiaryEntry('Today was an ordinary day.');
            console.log('Connection test succeeded:', testResult);
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
}

// Create a global instance
const empathyDiary = new EmpathyDiaryBackend();

// Main analysis function (callable from outside)
async function analyzeDiaryEntry(diaryText) {
    return await empathyDiary.analyzeDiaryEntry(diaryText);
}

// Module export (for Node.js environments)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EmpathyDiaryBackend,
        analyzeDiaryEntry
    };
}

// Expose as global functions in browser environments
if (typeof window !== 'undefined') {
    window.EmpathyDiaryBackend = EmpathyDiaryBackend;
    window.analyzeDiaryEntry = analyzeDiaryEntry;
    window.empathyDiary = empathyDiary;
}

// Usage example
console.log('Empathy AI Diary backend loaded.');
console.log('Usage: analyzeDiaryEntry("diary text").then(result => console.log(result))');
