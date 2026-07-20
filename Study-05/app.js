/**
 * Empathy AI Diary frontend application
 * User interface logic and localStorage management
 */

class EmpathyDiaryApp {
    constructor() {
        this.currentAnalysis = null;
        this.diaryEntries = [];
        this.isListVisible = false;
        this.deleteTargetId = null;

        // Per-emotion settings
        this.emotionConfig = {
            joy: {
                icon: '😊',
                color: '#ffd700',
                lightColor: '#fff8dc',
                korean: 'Joy'
            },
            sadness: {
                icon: '😢',
                color: '#87ceeb',
                lightColor: '#e6f3ff',
                korean: 'Sadness'
            },
            anger: {
                icon: '😠',
                color: '#ff6b6b',
                lightColor: '#ffe0e0',
                korean: 'Anger'
            },
            fear: {
                icon: '😨',
                color: '#dda0dd',
                lightColor: '#f3e5f3',
                korean: 'Fear'
            },
            surprise: {
                icon: '😮',
                color: '#ffb6c1',
                lightColor: '#ffe4e7',
                korean: 'Surprise'
            },
            calm: {
                icon: '😌',
                color: '#98fb98',
                lightColor: '#f0fff0',
                korean: 'Calm'
            },
            mixed: {
                icon: '🤔',
                color: '#d3d3d3',
                lightColor: '#f5f5f5',
                korean: 'Mixed'
            }
        };

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.initElements();
        this.bindEvents();
        this.loadDiaryEntries();
        this.updateTodayDate();
        this.updateDiaryList();

        console.log('Empathy AI Diary frontend initialized.');
    }

    /**
     * Initialize DOM elements
     */
    initElements() {
        // Main elements
        this.elements = {
            todayDate: document.getElementById('todayDate'),
            diaryInput: document.getElementById('diaryInput'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            loadingSection: document.getElementById('loadingSection'),
            analysisResult: document.getElementById('analysisResult'),
            emotionIcon: document.getElementById('emotionIcon'),
            emotionName: document.getElementById('emotionName'),
            intensityFill: document.getElementById('intensityFill'),
            intensityValue: document.getElementById('intensityValue'),
            empathyMessage: document.getElementById('empathyMessage'),
            saveBtn: document.getElementById('saveBtn'),

            // Diary list elements
            toggleListBtn: document.getElementById('toggleListBtn'),
            toggleIcon: document.getElementById('toggleIcon'),
            toggleText: document.getElementById('toggleText'),
            diaryList: document.getElementById('diaryList'),
            diaryListContent: document.getElementById('diaryListContent'),
            emptyState: document.getElementById('emptyState'),

            // Modal and toast
            confirmModal: document.getElementById('confirmModal'),
            confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
            cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
            successToast: document.getElementById('successToast')
        };
    }

    /**
     * Bind events
     */
    bindEvents() {
        // Emotion analysis button
        this.elements.analyzeBtn.addEventListener('click', () => this.handleAnalyze());

        // Save entry button
        this.elements.saveBtn.addEventListener('click', () => this.handleSave());

        // Toggle diary list
        this.elements.toggleListBtn.addEventListener('click', () => this.toggleDiaryList());

        // Modal events
        this.elements.confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
        this.elements.cancelDeleteBtn.addEventListener('click', () => this.hideModal());
        this.elements.confirmModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.hideModal();
            }
        });

        // Handle Enter key in the input field (Ctrl+Enter to analyze)
        this.elements.diaryInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.handleAnalyze();
            }
        });

        // Auto-resize the input field
        this.elements.diaryInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // Close modal with ESC key and other keyboard accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });

        // Modal focus trapping
        this.elements.confirmModal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.trapFocus(e);
            }
        });
    }

    /**
     * Update today's date
     */
    updateTodayDate() {
        const today = new Date();
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        };
        const dateString = today.toLocaleDateString('en-US', options);
        this.elements.todayDate.textContent = dateString;
    }

    /**
     * Auto-resize the textarea
     */
    autoResizeTextarea() {
        const textarea = this.elements.diaryInput;
        textarea.style.height = 'auto';
        // Cap the max height at 300px to keep the UI stable
        const maxHeight = 300;
        const newHeight = Math.min(Math.max(120, textarea.scrollHeight), maxHeight);
        textarea.style.height = newHeight + 'px';

        // Show a scrollbar once the max height is reached
        if (textarea.scrollHeight > maxHeight) {
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.overflowY = 'hidden';
        }
    }

    /**
     * Handle emotion analysis
     */
    async handleAnalyze() {
        const diaryText = this.elements.diaryInput.value.trim();

        if (!diaryText) {
            this.showToast('Please enter your diary entry.', 'warning');
            this.elements.diaryInput.focus();
            return;
        }

        try {
            this.showLoading();
            this.hideAnalysisResult();

            // Call the analyzeDiaryEntry function from backend.js
            const result = await analyzeDiaryEntry(diaryText);

            this.currentAnalysis = {
                text: diaryText,
                timestamp: new Date().toISOString(),
                ...result
            };

            this.hideLoading();
            this.showAnalysisResult(this.currentAnalysis);

        } catch (error) {
            console.error('Emotion analysis error:', error);
            this.hideLoading();
            this.showToast('An error occurred during emotion analysis. Please try again.', 'error');
        }
    }

    /**
     * Handle saving the diary entry
     */
    handleSave() {
        if (!this.currentAnalysis) {
            this.showToast('There is no analysis result to save.', 'warning');
            return;
        }

        try {
            const entry = {
                id: this.generateId(),
                text: this.currentAnalysis.text,
                emotion: this.currentAnalysis.emotion,
                emotionKorean: this.currentAnalysis.emotionKorean,
                emotionScore: this.currentAnalysis.emotionScore,
                empathyMessage: this.currentAnalysis.empathyMessage,
                timestamp: this.currentAnalysis.timestamp,
                savedAt: new Date().toISOString()
            };

            this.diaryEntries.unshift(entry); // Add newest first
            this.saveDiaryEntries();
            this.updateDiaryList();

            // Reset the UI
            this.elements.diaryInput.value = '';
            this.autoResizeTextarea();
            this.hideAnalysisResult();
            this.currentAnalysis = null;

            this.showToast('Your diary entry was saved successfully!', 'success');

            // Automatically open the diary list if it is closed
            if (!this.isListVisible && this.diaryEntries.length === 1) {
                setTimeout(() => this.toggleDiaryList(), 500);
            }

        } catch (error) {
            console.error('Diary save error:', error);
            this.showToast('An error occurred while saving your diary entry.', 'error');
        }
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        this.elements.loadingSection.classList.remove('hidden');
        this.elements.analyzeBtn.disabled = true;
        this.elements.analyzeBtn.textContent = 'Analyzing...';
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.elements.loadingSection.classList.add('hidden');
        this.elements.analyzeBtn.disabled = false;
        this.elements.analyzeBtn.innerHTML = '<span class="btn-icon">🔍</span>Analyze Emotion';
    }

    /**
     * Show the analysis result
     */
    showAnalysisResult(analysis) {
        const config = this.emotionConfig[analysis.emotion] || this.emotionConfig.mixed;

        // Emotion icon and name
        this.elements.emotionIcon.textContent = config.icon;
        this.elements.emotionName.textContent = analysis.emotionKorean || config.korean;
        this.elements.emotionName.style.color = config.color;

        // Emotion intensity
        const intensityPercent = (analysis.emotionScore / 10) * 100;
        this.elements.intensityFill.style.width = intensityPercent + '%';
        this.elements.intensityFill.style.backgroundColor = config.color;
        this.elements.intensityValue.textContent = `${analysis.emotionScore}/10`;

        // Empathy message
        this.elements.empathyMessage.textContent = analysis.empathyMessage;

        // Apply the emotion-specific background color
        const emotionDisplay = document.querySelector('.emotion-display');
        emotionDisplay.style.backgroundColor = config.lightColor;

        this.elements.analysisResult.classList.remove('hidden');

        // Scroll to the result
        setTimeout(() => {
            this.elements.analysisResult.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    }

    /**
     * Hide the analysis result
     */
    hideAnalysisResult() {
        this.elements.analysisResult.classList.add('hidden');
    }

    /**
     * Toggle the diary list
     */
    toggleDiaryList() {
        this.isListVisible = !this.isListVisible;

        if (this.isListVisible) {
            this.elements.diaryList.classList.remove('hidden');
            this.elements.toggleIcon.textContent = '📕';
            this.elements.toggleText.textContent = 'Collapse';
            this.elements.toggleListBtn.setAttribute('aria-expanded', 'true');
        } else {
            this.elements.diaryList.classList.add('hidden');
            this.elements.toggleIcon.textContent = '📖';
            this.elements.toggleText.textContent = 'Expand';
            this.elements.toggleListBtn.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Update the diary list
     */
    updateDiaryList() {
        if (this.diaryEntries.length === 0) {
            this.elements.diaryListContent.innerHTML = '';
            this.elements.emptyState.classList.remove('hidden');
            return;
        }

        this.elements.emptyState.classList.add('hidden');

        const listHTML = this.diaryEntries.map(entry => this.createDiaryEntryHTML(entry)).join('');
        this.elements.diaryListContent.innerHTML = listHTML;
    }

    /**
     * Create the HTML for a diary entry
     */
    createDiaryEntryHTML(entry) {
        const config = this.emotionConfig[entry.emotion] || this.emotionConfig.mixed;
        const date = new Date(entry.timestamp);
        const dateString = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="diary-entry" data-entry-id="${entry.id}">
                <div class="entry-header">
                    <div class="entry-date">${dateString}</div>
                    <div class="entry-actions">
                        <button class="btn btn-danger btn-small delete-btn" data-entry-id="${entry.id}">
                            <span class="btn-icon">🗑️</span>
                            Delete
                        </button>
                    </div>
                </div>
                <div class="entry-content">${this.escapeHtml(entry.text)}</div>
                <div class="entry-emotion">
                    <span class="entry-emotion-icon">${config.icon}</span>
                    <span class="entry-emotion-text">${entry.emotionKorean} (${entry.emotionScore}/10)</span>
                </div>
            </div>
        `;
    }

    /**
     * Bind delete button events (uses event delegation)
     */
    bindDeleteEvents() {
        // Remove existing listeners, then add a new event-delegation listener
        this.elements.diaryListContent.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                e.stopPropagation();
                const button = e.target.closest('.delete-btn');
                this.lastFocusedElement = button; // For restoring focus
                const entryId = button.dataset.entryId;
                this.showDeleteConfirm(entryId);
            }
        });
    }


    /**
     * Confirm deletion
     */
    confirmDelete() {
        if (!this.deleteTargetId) return;

        const entryIndex = this.diaryEntries.findIndex(entry => entry.id === this.deleteTargetId);
        if (entryIndex !== -1) {
            this.diaryEntries.splice(entryIndex, 1);
            this.saveDiaryEntries();
            this.updateDiaryList();
            this.showToast('The diary entry was deleted.', 'success');
        }

        this.hideModal();
    }

    /**
     * Load diary entries from localStorage
     */
    loadDiaryEntries() {
        try {
            const stored = localStorage.getItem('empathy_diary_entries');
            this.diaryEntries = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading diary entries:', error);
            this.diaryEntries = [];
        }
    }

    /**
     * Save diary entries to localStorage
     */
    saveDiaryEntries() {
        try {
            const dataToSave = JSON.stringify(this.diaryEntries);

            // Check storage size (rough check)
            if (dataToSave.length > 4.5 * 1024 * 1024) { // 4.5MB limit (localStorage is usually 5MB)
                console.warn('Storage is almost full. Consider cleaning up old data.');
                this.showToast('Storage space is running low. Please delete some old entries.', 'warning');

                // Automatically delete old entries (when over 100)
                if (this.diaryEntries.length > 100) {
                    this.diaryEntries = this.diaryEntries.slice(0, 100);
                    this.showToast('Old entries were automatically deleted to free up storage space.', 'warning');
                }
            }

            localStorage.setItem('empathy_diary_entries', JSON.stringify(this.diaryEntries));
        } catch (error) {
            console.error('Diary save error:', error);

            if (error.name === 'QuotaExceededError') {
                this.showToast('Storage space is full. Please delete some entries.', 'error');
            } else {
                this.showToast('An error occurred while saving your diary entry.', 'error');
            }
            throw error;
        }
    }

    /**
     * Generate a unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show a toast message
     */
    showToast(message, type = 'success') {
        const toast = this.elements.successToast;
        const messageElement = toast.querySelector('.toast-message');
        const iconElement = toast.querySelector('.toast-icon');

        messageElement.textContent = message;

        // Icon and color per toast type
        switch (type) {
            case 'success':
                iconElement.textContent = '✅';
                toast.style.backgroundColor = '#a8d5a8';
                break;
            case 'warning':
                iconElement.textContent = '⚠️';
                toast.style.backgroundColor = '#f0ad4e';
                break;
            case 'error':
                iconElement.textContent = '❌';
                toast.style.backgroundColor = '#e08080';
                break;
            default:
                iconElement.textContent = 'ℹ️';
                toast.style.backgroundColor = '#5bc0de';
        }

        toast.classList.remove('hidden');

        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    /**
     * Export data (for backup)
     */
    exportData() {
        const data = {
            entries: this.diaryEntries,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diary_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Your diary data was exported.', 'success');
    }

    /**
     * Import data (for restore)
     */
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.entries && Array.isArray(data.entries)) {
                        this.diaryEntries = data.entries;
                        this.saveDiaryEntries();
                        this.updateDiaryList();
                        this.showToast('Your diary data was imported successfully.', 'success');
                        resolve();
                    } else {
                        throw new Error('Invalid file format.');
                    }
                } catch (error) {
                    this.showToast('An error occurred while reading the file.', 'error');
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    /**
     * Get statistics
     */
    getStatistics() {
        if (this.diaryEntries.length === 0) {
            return {
                totalEntries: 0,
                emotions: {},
                averageIntensity: 0,
                dateRange: null
            };
        }

        const emotions = {};
        let totalIntensity = 0;

        this.diaryEntries.forEach(entry => {
            const emotion = entry.emotion;
            emotions[emotion] = (emotions[emotion] || 0) + 1;
            totalIntensity += entry.emotionScore;
        });

        const dates = this.diaryEntries.map(entry => new Date(entry.timestamp));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        return {
            totalEntries: this.diaryEntries.length,
            emotions,
            averageIntensity: (totalIntensity / this.diaryEntries.length).toFixed(1),
            dateRange: {
                start: minDate.toLocaleDateString('en-US'),
                end: maxDate.toLocaleDateString('en-US')
            }
        };
    }

    /**
     * Modal focus trapping (accessibility)
     */
    trapFocus(e) {
        const modal = this.elements.confirmModal;
        const focusableElements = modal.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Manage focus when opening the modal
     */
    showDeleteConfirm(entryId) {
        this.deleteTargetId = entryId;
        this.elements.confirmModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Move focus to the first button
        setTimeout(() => {
            this.elements.confirmDeleteBtn.focus();
        }, 100);
    }

    /**
     * Restore focus when closing the modal
     */
    hideModal() {
        this.elements.confirmModal.classList.add('hidden');
        document.body.style.overflow = '';
        this.deleteTargetId = null;

        // Restore focus to the last active element (usually the delete button)
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        }
    }
}

// Initialize the application once the DOM has loaded
document.addEventListener('DOMContentLoaded', () => {
    window.empathyDiaryApp = new EmpathyDiaryApp();
});

// Utility functions for the developer console
if (typeof window !== 'undefined') {
    window.exportDiaryData = () => window.empathyDiaryApp?.exportData();
    window.getDiaryStatistics = () => window.empathyDiaryApp?.getStatistics();
    window.clearAllDiaries = () => {
        if (confirm('Are you sure you want to delete all diary entries?')) {
            localStorage.removeItem('empathy_diary_entries');
            window.empathyDiaryApp?.loadDiaryEntries();
            window.empathyDiaryApp?.updateDiaryList();
            console.log('All diary entries were deleted.');
        }
    };

    // API key setup function
    window.setApiKey = (apiKey) => {
        if (window.empathyDiary) {
            window.empathyDiary.setApiKey(apiKey);
            console.log('API key set. You can now use AI emotion analysis.');
        } else {
            console.error('The backend has not been loaded.');
        }
    };

    // Settings modal control
    window.initSettingsModal = () => {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiKeyStatus = document.getElementById('apiKeyStatus');
        const modalBackdrop = settingsModal?.querySelector('.modal-backdrop');

        // Check for a saved API key
        const savedApiKey = localStorage.getItem('openrouter_api_key');
        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
        }

        // Open the modal
        const openModal = () => {
            settingsModal?.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        };

        // Close the modal
        const closeModal = () => {
            settingsModal?.classList.add('hidden');
            document.body.style.overflow = '';
            apiKeyStatus?.classList.add('hidden');
        };

        // Event listeners
        settingsBtn?.addEventListener('click', openModal);
        closeSettingsBtn?.addEventListener('click', closeModal);
        cancelSettingsBtn?.addEventListener('click', closeModal);
        modalBackdrop?.addEventListener('click', closeModal);

        // Save the API key
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

            // Save the API key
            window.setApiKey(apiKey);
            apiKeyStatus.textContent = '✅ API key saved!';
            apiKeyStatus.style.color = '#10b981';
            apiKeyStatus.classList.remove('hidden');

            setTimeout(() => {
                closeModal();
            }, 1500);
        });

        // Save with the Enter key
        apiKeyInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveApiKeyBtn?.click();
            }
        });
    };

    // Initialize the settings modal on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initSettingsModal);
    } else {
        window.initSettingsModal();
    }

    // Performance monitoring
    window.getPerformanceInfo = () => {
        if (window.performance) {
            return {
                loadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
                domReady: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
                memoryUsage: window.performance.memory ? {
                    used: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
                    total: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB'
                } : 'Not available'
            };
        }
        return 'Performance API not available';
    };
}

console.log('Empathy AI Diary frontend loaded.');
console.log('Developer console commands:');
console.log('- exportDiaryData(): export diary data');
console.log('- getDiaryStatistics(): view statistics');
console.log('- clearAllDiaries(): delete all diary entries');
console.log('- setApiKey("your-api-key"): set the API key');
console.log('- getPerformanceInfo(): check performance info');
