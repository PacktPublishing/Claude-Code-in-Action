/**
 * FridgeChef backend
 * Generates recipes using the OpenRouter API
 */

class FridgeRecipeBackend {
    constructor() {
        // Use serverless functions - the API key is managed on the server
        this.useServerlessAPI = true;
        this.serverlessUrl = '/api/recipe';

        // For development/local testing - direct API calls are possible locally
        this.apiKey = this.getApiKey();
        this.baseUrl = 'https://openrouter.ai/api/v1';
        this.model = 'google/gemini-3-flash-preview';
    }

    /**
     * Get the API key (for local development)
     */
    getApiKey() {
        if (typeof localStorage !== 'undefined') {
            const storedKey = localStorage.getItem('openrouter_api_key');
            if (storedKey) {
                return storedKey;
            }
        }
        return null;
    }

    /**
     * Set the API key (for local development)
     */
    setApiKey(apiKey) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('openrouter_api_key', apiKey);
            this.apiKey = apiKey;
            console.log('API key has been set.');
        }
    }

    /**
     * Build the recipe generation prompt
     */
    createRecipePrompt(ingredients, hasImage) {
        if (hasImage) {
            return `You are a professional chef. Analyze the fridge ingredients visible in the image and recommend a delicious recipe.

${ingredients ? `Additional ingredients/requests: ${ingredients}` : ''}

Respond exactly in the following format:

Dish Name: [dish name]
Difficulty: [Easy/Medium/Hard]
Cooking Time: [e.g., 30 minutes]
Ingredients:
- [ingredient 1]
- [ingredient 2]
- [ingredient 3]

Cooking Instructions:
1. [step 1]
2. [step 2]
3. [step 3]

Tip: [cooking tip]

Response rules:
1. Make the most of the ingredients visible in the image
2. Recommend a recipe that is practical and easy to make
3. Recommend everyday dishes that home cooks will enjoy
4. Write clear and specific cooking instructions`;
        } else {
            return `You are a professional chef. Recommend a delicious recipe using the following ingredients.

Ingredients: ${ingredients}

Respond exactly in the following format:

Dish Name: [dish name]
Difficulty: [Easy/Medium/Hard]
Cooking Time: [e.g., 30 minutes]
Ingredients:
- [ingredient 1]
- [ingredient 2]
- [ingredient 3]

Cooking Instructions:
1. [step 1]
2. [step 2]
3. [step 3]

Tip: [cooking tip]

Response rules:
1. Make the most of the given ingredients
2. Recommend a recipe that is practical and easy to make
3. Recommend everyday dishes that home cooks will enjoy
4. Write clear and specific cooking instructions
5. If additional ingredients are needed, only use items commonly found at home`;
        }
    }

    /**
     * Parse the API response
     */
    parseRecipeResponse(responseText) {
        try {
            const dishMatch = responseText.match(/Dish Name:\s*(.+)/);
            const difficultyMatch = responseText.match(/Difficulty:\s*(.+)/);
            const timeMatch = responseText.match(/Cooking Time:\s*(.+)/);
            const ingredientsMatch = responseText.match(/Ingredients:\s*([\s\S]+?)(?=Cooking Instructions:|$)/);
            const stepsMatch = responseText.match(/Cooking Instructions:\s*([\s\S]+?)(?=Tip:|$)/);
            const tipMatch = responseText.match(/Tip:\s*(.+)/);

            // Parse the ingredients
            let ingredientsList = [];
            if (ingredientsMatch) {
                ingredientsList = ingredientsMatch[1]
                    .split('\n')
                    .filter(line => line.trim().startsWith('-'))
                    .map(line => line.trim().substring(1).trim());
            }

            // Parse the cooking instructions
            let stepsList = [];
            if (stepsMatch) {
                stepsList = stepsMatch[1]
                    .split('\n')
                    .filter(line => /^\d+\./.test(line.trim()))
                    .map(line => line.trim());
            }

            return {
                dishName: dishMatch ? dishMatch[1].trim() : 'A tasty dish',
                difficulty: difficultyMatch ? difficultyMatch[1].trim() : 'Medium',
                cookingTime: timeMatch ? timeMatch[1].trim() : '30 minutes',
                ingredients: ingredientsList.length > 0 ? ingredientsList : ['Ingredient information is unavailable'],
                steps: stepsList.length > 0 ? stepsList : ['1. Prepare the ingredients.', '2. Start cooking.'],
                tip: tipMatch ? tipMatch[1].trim() : 'Enjoy your meal!',
                fullText: responseText
            };
        } catch (error) {
            console.error('Recipe parsing error:', error);
            return {
                dishName: 'Recommended dish',
                difficulty: 'Medium',
                cookingTime: '30 minutes',
                ingredients: ['A parsing error occurred'],
                steps: ['1. Prepare the ingredients.'],
                tip: 'Please try again.',
                fullText: responseText
            };
        }
    }

    /**
     * Call the API (serverless or direct)
     */
    async callAPI(prompt, imageBase64 = null) {
        // Use the serverless API
        if (this.useServerlessAPI) {
            return await this.callServerlessAPI(prompt, imageBase64);
        }

        // Call the OpenRouter API directly (for local development)
        return await this.callOpenRouterAPI(prompt, imageBase64);
    }

    /**
     * Call the serverless function
     */
    async callServerlessAPI(prompt, imageBase64 = null) {
        try {
            const response = await fetch(this.serverlessUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    imageBase64: imageBase64
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server API error:', errorData);

                // Handle rate limit errors
                if (response.status === 429) {
                    throw new Error('The free AI server is currently experiencing heavy traffic. Please try again shortly.');
                }

                throw new Error(`Server error: ${response.status} - ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            console.log('=== Server response data ===', data);

            // Handle errors returned by the server when success is false
            if (data.success === false) {
                const errorMsg = data.error || 'The AI could not process the image.';
                console.warn('Server response:', errorMsg);
                throw new Error(errorMsg);
            }

            if (data.success) {
                // Handle the case where content is an empty string
                if (!data.content || data.content.trim() === '') {
                    console.warn('The AI response is empty. Image processing may have failed.');
                    throw new Error('The AI could not process the image. Try a different image.');
                }

                // Convert to the OpenRouter response format
                return {
                    choices: [
                        {
                            message: {
                                content: data.content
                            }
                        }
                    ]
                };
            } else {
                console.error('Response format error - data.success:', data.success, 'data.content:', data.content);
                throw new Error('The server response format is invalid.');
            }
        } catch (error) {
            console.error('Serverless API call failed:', error);
            throw error;
        }
    }

    /**
     * Call the OpenRouter API directly (for local development)
     */
    async callOpenRouterAPI(prompt, imageBase64 = null) {
        if (!this.apiKey) {
            throw new Error('API key is not set. Click the settings button and enter your API key.');
        }

        // If there is an image, build content as an array
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
            model: this.model,
            messages: [
                {
                    role: "user",
                    content: content
                }
            ],
            max_tokens: 2000,
            temperature: 0.7,
            top_p: 0.9
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Fridge Recipe App'
            },
            body: JSON.stringify(requestBody)
        };

        const url = `${this.baseUrl}/chat/completions`;
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error:', errorText);
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Recognize ingredients from an image
     */
    async recognizeIngredients(imageBase64) {
        if (!imageBase64) {
            throw new Error('An image is required.');
        }

        const prompt = `Analyze this fridge photo and find every food ingredient you can see.

Important rules:
1. Look at the image carefully and list every visible food ingredient
2. Include everything: eggs, vegetables, fruits, drinks, sauces, etc.
3. List them separated by commas (Example: eggs, milk, carrots, onions, tomatoes)
4. Write only the ingredient names, with no other explanation or formatting
5. Write in English

Response format: ingredient1, ingredient2, ingredient3, ...`;

        try {
            console.log('Recognizing ingredients...');
            const response = await this.callAPI(prompt, imageBase64);

            if (response.choices && response.choices[0] && response.choices[0].message) {
                const content = response.choices[0].message.content;
                console.log('=== Raw AI response ===');
                console.log(content);
                console.log('===================');

                // Try parsing in several ways
                let ingredientsList = [];

                // Method 1: comma-separated format
                if (content.includes(',')) {
                    ingredientsList = content
                        .split(',')
                        .map(item => item.trim())
                        .map(item => item.replace(/^[-•*]\s*/, '')) // Remove leading symbols
                        .map(item => item.replace(/\d+\.\s*/, '')) // Remove "number." prefixes
                        .filter(item => item.length > 0 && item.length < 50)
                        .filter(item => !item.match(/^(Example|Response|Rules|Important|Ingredient|Visible|Format|The following)/));
                }

                // Method 2: list format starting with -
                if (ingredientsList.length === 0 && content.includes('-')) {
                    ingredientsList = content
                        .split('\n')
                        .filter(line => line.trim().startsWith('-'))
                        .map(line => line.trim().substring(1).trim())
                        .filter(ing => ing.length > 0 && ing.length < 50);
                }

                // Method 3: numbered list format ("1. ...")
                if (ingredientsList.length === 0 && /\d+\./.test(content)) {
                    ingredientsList = content
                        .split('\n')
                        .filter(line => /^\d+\./.test(line.trim()))
                        .map(line => line.replace(/^\d+\.\s*/, '').trim())
                        .filter(ing => ing.length > 0 && ing.length < 50);
                }

                // Method 4: separated only by line breaks (no formatting)
                if (ingredientsList.length === 0) {
                    ingredientsList = content
                        .split('\n')
                        .map(item => item.trim())
                        .filter(item => item.length > 2 && item.length < 50)
                        .filter(item => !item.match(/^(Example|Response|Rules|Important|Ingredient|Visible|Format|The following|:|！)/));
                }

                // Remove duplicates
                ingredientsList = [...new Set(ingredientsList)];

                console.log('Parsed ingredient list:', ingredientsList);
                console.log('Ingredient count:', ingredientsList.length);
                return ingredientsList;
            } else {
                throw new Error('The API response format is invalid.');
            }
        } catch (error) {
            console.error('Ingredient recognition failed:', error);
            throw error;
        }
    }

    /**
     * Main recipe generation function
     */
    async generateRecipe(ingredients, imageBase64 = null) {
        if (!ingredients && !imageBase64) {
            throw new Error('Please enter ingredients or upload an image.');
        }

        const hasImage = !!imageBase64;
        const prompt = this.createRecipePrompt(ingredients || '', hasImage);

        try {
            console.log('Generating recipe...', hasImage ? '(with image)' : '');
            const response = await this.callAPI(prompt, imageBase64);

            if (response.choices && response.choices[0] && response.choices[0].message) {
                const result = this.parseRecipeResponse(response.choices[0].message.content);
                console.log('Recipe generated:', result);
                return result;
            } else {
                throw new Error('The API response format is invalid.');
            }
        } catch (error) {
            console.error('Recipe generation failed:', error);
            throw error;
        }
    }

    /**
     * Fallback recipe (when the API call fails)
     */
    getFallbackRecipe(ingredients) {
        return {
            dishName: 'Simple Fried Rice',
            difficulty: 'Easy',
            cookingTime: '15 minutes',
            ingredients: [
                '1 bowl of cooked rice',
                '2 eggs',
                '2 tablespoons of cooking oil',
                'A pinch of salt and pepper',
                `Available ingredients: ${ingredients}`
            ],
            steps: [
                '1. Heat the oil in a pan.',
                '2. Beat the eggs and scramble them.',
                '3. Add the rice and stir-fry together.',
                '4. Season with salt and pepper.',
                '5. If you have extra ingredients, stir-fry them in as well.'
            ],
            tip: 'Set an API key to get a wider variety of recipe recommendations!',
            fullText: 'This is the default recipe shown when the API is unavailable.'
        };
    }
}

// Create the global instance
const fridgeRecipeBackend = new FridgeRecipeBackend();

// Expose globally in browser environments
if (typeof window !== 'undefined') {
    window.FridgeRecipeBackend = FridgeRecipeBackend;
    window.fridgeRecipeBackend = fridgeRecipeBackend;
}

console.log('FridgeChef backend loaded.');
