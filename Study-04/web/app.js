/**
 * FridgeChef frontend
 */

class FridgeRecipeApp {
    constructor() {
        this.currentImage = null;
        this.currentRecipe = null;
        this.recognizedIngredients = [];
        this.init();
    }

    init() {
        this.initSettingsModal();
        this.initImageUpload();
        this.initIngredientRecognition();
        this.initRecipeGeneration();
        this.updateUI();
    }

    /**
     * Initialize the settings modal
     */
    initSettingsModal() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiKeyStatus = document.getElementById('apiKeyStatus');
        const modalBackdrop = settingsModal?.querySelector('.modal-backdrop');

        // Load the saved API key
        const savedApiKey = localStorage.getItem('openrouter_api_key');
        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
        }

        const openModal = () => {
            settingsModal?.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        };

        const closeModal = () => {
            settingsModal?.classList.add('hidden');
            document.body.style.overflow = '';
            apiKeyStatus?.classList.add('hidden');
        };

        settingsBtn?.addEventListener('click', openModal);
        closeSettingsBtn?.addEventListener('click', closeModal);
        cancelSettingsBtn?.addEventListener('click', closeModal);
        modalBackdrop?.addEventListener('click', closeModal);

        saveApiKeyBtn?.addEventListener('click', () => {
            const apiKey = apiKeyInput.value.trim();

            if (!apiKey) {
                apiKeyStatus.textContent = '❌ Please enter an API key.';
                apiKeyStatus.style.color = '#ef4444';
                apiKeyStatus.classList.remove('hidden');
                return;
            }

            if (!apiKey.startsWith('sk-or-v1-')) {
                apiKeyStatus.textContent = '❌ This is not a valid OpenRouter API key format.';
                apiKeyStatus.style.color = '#ef4444';
                apiKeyStatus.classList.remove('hidden');
                return;
            }

            window.fridgeRecipeBackend.setApiKey(apiKey);
            apiKeyStatus.textContent = '✅ API key saved!';
            apiKeyStatus.style.color = '#10b981';
            apiKeyStatus.classList.remove('hidden');

            setTimeout(() => {
                closeModal();
            }, 1500);
        });

        apiKeyInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveApiKeyBtn?.click();
            }
        });
    }

    /**
     * Initialize image upload
     */
    initImageUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        const selectImageBtn = document.getElementById('selectImageBtn');
        const imagePreview = document.getElementById('imagePreview');
        const previewImage = document.getElementById('previewImage');
        const removeImageBtn = document.getElementById('removeImageBtn');
        const ingredientsText = document.getElementById('ingredientsText');
        const generateRecipeBtn = document.getElementById('generateRecipeBtn');

        // File select button
        selectImageBtn?.addEventListener('click', () => {
            imageInput?.click();
        });

        // Sample image buttons
        document.querySelectorAll('.sample-image-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sampleName = btn.dataset.sample;
                this.loadSampleImage(sampleName);
            });
        });

        // When a file is selected
        imageInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageFile(file);
            }
        });

        // Drag and drop
        uploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ff6b35';
        });

        uploadArea?.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#ddd';
        });

        uploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ddd';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageFile(file);
            }
        });

        // Remove image
        removeImageBtn?.addEventListener('click', () => {
            this.currentImage = null;
            this.recognizedIngredients = [];
            imageInput.value = '';
            document.querySelector('.upload-placeholder')?.classList.remove('hidden');
            imagePreview?.classList.add('hidden');
            document.getElementById('recognizedIngredientsSection')?.classList.add('hidden');
            this.updateGenerateButton();
        });

        // When ingredients are typed
        ingredientsText?.addEventListener('input', () => {
            this.updateGenerateButton();
        });
    }

    /**
     * Optimize the image (resizing and quality adjustment)
     */
    async optimizeImage(imageBase64, maxWidth = 1024, maxHeight = 1024, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize while keeping the aspect ratio
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                // Settings to improve image quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG format (reduces file size)
                const optimizedBase64 = canvas.toDataURL('image/jpeg', quality);
                console.log(`Image optimized: ${img.width}x${img.height} → ${width}x${height}`);
                console.log(`Size reduced: ${(imageBase64.length / 1024).toFixed(2)}KB → ${(optimizedBase64.length / 1024).toFixed(2)}KB`);
                resolve(optimizedBase64);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageBase64;
        });
    }

    /**
     * Load a sample image
     */
    async loadSampleImage(sampleName) {
        try {
            const response = await fetch(`samples/${sampleName}`);
            const blob = await response.blob();

            // Convert the Blob to base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                // Optimize the image
                const optimizedImage = await this.optimizeImage(e.target.result);
                this.currentImage = optimizedImage;
                this.recognizedIngredients = [];

                const previewImage = document.getElementById('previewImage');
                previewImage.src = this.currentImage;
                document.querySelector('.upload-placeholder')?.classList.add('hidden');
                document.getElementById('imagePreview')?.classList.remove('hidden');

                // Reset the ingredients input when a new image is uploaded
                const ingredientsText = document.getElementById('ingredientsText');
                ingredientsText.value = '';

                // Show the ingredient recognition section
                const recognizedSection = document.getElementById('recognizedIngredientsSection');
                recognizedSection?.classList.remove('hidden');

                // Show the ingredient recognition hint
                const recognizedContent = document.getElementById('recognizedIngredientsContent');
                recognizedContent.innerHTML = '<p class="recognized-hint">📸 Click the "Analyze Ingredients" button to recognize the ingredients in the image.</p>';

                this.updateGenerateButton();
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Failed to load sample image:', error);
            this.showToast('Could not load the sample image.', 'error');
        }
    }

    /**
     * Handle an image file
     */
    handleImageFile(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            // Optimize the image
            const optimizedImage = await this.optimizeImage(e.target.result);
            this.currentImage = optimizedImage;
            this.recognizedIngredients = [];

            const previewImage = document.getElementById('previewImage');
            previewImage.src = this.currentImage;
            document.querySelector('.upload-placeholder')?.classList.add('hidden');
            document.getElementById('imagePreview')?.classList.remove('hidden');

            // Reset the ingredients input when a new image is uploaded
            const ingredientsText = document.getElementById('ingredientsText');
            ingredientsText.value = '';

            // Show the ingredient recognition section
            const recognizedSection = document.getElementById('recognizedIngredientsSection');
            recognizedSection?.classList.remove('hidden');

            // Show the ingredient recognition hint
            const recognizedContent = document.getElementById('recognizedIngredientsContent');
            recognizedContent.innerHTML = '<p class="recognized-hint">📸 Click the "Analyze Ingredients" button to recognize the ingredients in the image.</p>';

            this.updateGenerateButton();
        };
        reader.readAsDataURL(file);
    }

    /**
     * Update the recipe generation button state
     */
    updateGenerateButton() {
        const ingredientsText = document.getElementById('ingredientsText');
        const generateRecipeBtn = document.getElementById('generateRecipeBtn');

        const hasImage = this.currentImage !== null;
        const hasText = ingredientsText?.value.trim().length > 0;
        const hasRecognized = this.recognizedIngredients.length > 0;

        generateRecipeBtn.disabled = !(hasImage || hasText || hasRecognized);
    }

    /**
     * Initialize ingredient recognition
     */
    initIngredientRecognition() {
        const analyzeImageBtn = document.getElementById('analyzeImageBtn');

        analyzeImageBtn?.addEventListener('click', () => {
            this.analyzeImage();
        });
    }

    /**
     * Analyze the image and recognize ingredients
     */
    async analyzeImage() {
        if (!this.currentImage) {
            this.showToast('Please upload an image first.', 'error');
            return;
        }

        const analyzeBtn = document.getElementById('analyzeImageBtn');
        const recognizedContent = document.getElementById('recognizedIngredientsContent');

        // Show the analyzing state
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';
        recognizedContent.innerHTML = '<div class="loading-mini"><div class="loading-spinner-small"></div><p>Recognizing ingredients...</p></div>';

        try {
            const ingredients = await window.fridgeRecipeBackend.recognizeIngredients(this.currentImage);
            this.recognizedIngredients = ingredients;

            if (ingredients.length > 0) {
                // Display the recognized ingredients
                const html = `
                    <div class="recognized-list">
                        ${ingredients.map((ing, index) => `
                            <div class="recognized-item">
                                <span class="recognized-number">${index + 1}</span>
                                <span class="recognized-name">${ing}</span>
                            </div>
                        `).join('')}
                    </div>
                    <p class="recognized-note">💡 Get a recipe recommendation with these ingredients, or add extra ingredients below.</p>
                `;
                recognizedContent.innerHTML = html;

                // Update the text input with the ingredients (always replace with the new ingredients)
                const ingredientsText = document.getElementById('ingredientsText');
                ingredientsText.value = ingredients.join(', ');

                this.showToast(`Recognized ${ingredients.length} ingredients!`, 'success');
            } else {
                recognizedContent.innerHTML = '<p class="recognized-error">❌ Could not recognize any ingredients. Try a different photo.</p>';
                this.showToast('Could not recognize any ingredients.', 'error');
            }
        } catch (error) {
            console.error('Ingredient recognition error:', error);

            // Analyze the error message
            let errorMessage = '❌ Ingredient recognition failed.';
            let toastMessage = 'Ingredient recognition failed.';

            if (error.message.includes('API key')) {
                errorMessage = '❌ Please set your API key.';
                toastMessage = '⚠️ Please set your API key.';
            } else if (error.message.includes('could not process')) {
                errorMessage = '❌ The AI could not process this image.<br/>💡 Try uploading a simpler, clearer photo of your fridge.';
                toastMessage = 'Could not process the image. Try a different photo.';
            } else if (error.message.includes('too large')) {
                errorMessage = '❌ The image is too large. Please use a smaller image.';
                toastMessage = 'The image is too large.';
            } else if (error.message.includes('heavy traffic')) {
                errorMessage = '❌ The free AI server is currently experiencing heavy traffic.<br/>⏰ Please try again shortly.';
                toastMessage = 'The server is busy. Please try again shortly.';
            } else {
                errorMessage += ' Please try again shortly.';
            }

            recognizedContent.innerHTML = `<p class="recognized-error">${errorMessage}</p>`;
            this.showToast(toastMessage, 'error');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<span class="btn-icon">🔍</span> Analyze Ingredients';
            this.updateGenerateButton();
        }
    }

    /**
     * Initialize recipe generation
     */
    initRecipeGeneration() {
        const generateRecipeBtn = document.getElementById('generateRecipeBtn');
        const newSearchBtn = document.getElementById('newSearchBtn');

        generateRecipeBtn?.addEventListener('click', () => {
            this.generateRecipe();
        });

        newSearchBtn?.addEventListener('click', () => {
            this.resetSearch();
        });
    }

    /**
     * Generate a recipe
     */
    async generateRecipe() {
        const ingredientsText = document.getElementById('ingredientsText');
        const ingredients = ingredientsText?.value.trim() || '';

        // Update the UI
        document.getElementById('loadingSection')?.classList.remove('hidden');
        document.getElementById('recipeResult')?.classList.add('hidden');

        try {
            // If there is an image, send it along
            const recipe = await window.fridgeRecipeBackend.generateRecipe(
                ingredients,
                this.currentImage
            );
            this.currentRecipe = {
                ...recipe,
                ingredients: ingredientsText?.value.trim() || 'fridge ingredients',
                timestamp: new Date().toISOString()
            };
            this.displayRecipe(this.currentRecipe);
        } catch (error) {
            console.error('Recipe generation error:', error);

            // If it is an API key error
            if (error.message.includes('API key')) {
                this.showToast('⚠️ Please set your API key. Click the settings button.', 'warning');
                // Show the fallback recipe
                const fallbackRecipe = window.fridgeRecipeBackend.getFallbackRecipe(ingredients || 'fridge ingredients');
                this.currentRecipe = {
                    ...fallbackRecipe,
                    ingredients: ingredients || 'fridge ingredients',
                    timestamp: new Date().toISOString()
                };
                this.displayRecipe(this.currentRecipe);
            } else {
                this.showToast('Recipe generation failed. Please try again.', 'error');
            }
        } finally {
            document.getElementById('loadingSection')?.classList.add('hidden');
        }
    }

    /**
     * Display the recipe
     */
    displayRecipe(recipe) {
        const recipeContent = document.getElementById('recipeContent');
        const recipeResult = document.getElementById('recipeResult');

        // Convert ingredients and steps to arrays
        const ingredients = Array.isArray(recipe.ingredients)
            ? recipe.ingredients
            : [recipe.ingredients];

        const steps = Array.isArray(recipe.steps)
            ? recipe.steps
            : [recipe.steps];

        const html = `
            <div class="recipe-header">
                <h3 class="recipe-dish-name">${recipe.dishName}</h3>
                <div class="recipe-meta">
                    <span class="recipe-badge">⏱️ ${recipe.cookingTime}</span>
                    <span class="recipe-badge">📊 ${recipe.difficulty}</span>
                </div>
            </div>

            <div class="recipe-section">
                <h4 class="recipe-section-title">
                    <span>🥬</span> Ingredients
                </h4>
                <ul class="recipe-ingredients-list">
                    ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
            </div>

            <div class="recipe-section">
                <h4 class="recipe-section-title">
                    <span>👨‍🍳</span> Cooking Instructions
                </h4>
                <ol class="recipe-steps-list">
                    ${steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>

            <div class="recipe-tip">
                <strong>💡 Tip:</strong> ${recipe.tip}
            </div>
        `;

        recipeContent.innerHTML = html;
        recipeResult?.classList.remove('hidden');

        // Scroll to the result
        recipeResult?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Reset the search
     */
    resetSearch() {
        this.currentImage = null;
        this.currentRecipe = null;

        document.getElementById('imageInput').value = '';
        document.getElementById('ingredientsText').value = '';
        document.querySelector('.upload-placeholder')?.classList.remove('hidden');
        document.getElementById('imagePreview')?.classList.add('hidden');
        document.getElementById('recipeResult')?.classList.add('hidden');
        document.getElementById('recognizedIngredientsSection')?.classList.add('hidden');

        this.updateGenerateButton();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Update the UI
     */
    updateUI() {
        this.updateGenerateButton();
    }

    /**
     * Show a toast message
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('successToast');
        const toastMessage = toast?.querySelector('.toast-message');

        if (toastMessage) {
            toastMessage.textContent = message;
        }

        toast?.classList.remove('hidden');

        setTimeout(() => {
            toast?.classList.add('hidden');
        }, 3000);
    }
}

// Initialize the app
let fridgeRecipeApp;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        fridgeRecipeApp = new FridgeRecipeApp();
        window.fridgeRecipeApp = fridgeRecipeApp;
    });
} else {
    fridgeRecipeApp = new FridgeRecipeApp();
    window.fridgeRecipeApp = fridgeRecipeApp;
}

console.log('FridgeChef app loaded.');
