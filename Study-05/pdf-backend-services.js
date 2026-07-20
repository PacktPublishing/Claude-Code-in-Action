/**
 * Backend service module for the PDF document summary application
 * Contains all backend logic that runs on the client side
 */

// PDF file validation service
class PDFValidationService {
    constructor() {
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.allowedMimeTypes = ['application/pdf'];
        this.allowedExtensions = ['.pdf'];
    }

    /**
     * Validate a file
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        const errors = [];
        const warnings = [];

        // Check that a file exists
        if (!file) {
            errors.push('No file has been selected.');
            return { isValid: false, errors, warnings };
        }

        // Validate the file size
        if (file.size === 0) {
            errors.push('Empty files cannot be uploaded.');
        } else if (file.size > this.maxFileSize) {
            errors.push(`File is too large. The maximum upload size is ${this.formatFileSize(this.maxFileSize)}.`);
        } else if (file.size > 10 * 1024 * 1024) { // Warn for files over 10MB
            warnings.push('The file is large. Processing may take a while.');
        }

        // Validate the MIME type
        if (!this.allowedMimeTypes.includes(file.type)) {
            errors.push('Only PDF files can be uploaded.');
        }

        // Validate the file extension
        const fileName = file.name.toLowerCase();
        const hasValidExtension = this.allowedExtensions.some(ext => fileName.endsWith(ext));
        if (!hasValidExtension) {
            errors.push('Invalid file extension. Only PDF files can be uploaded.');
        }

        // Validate the file name
        if (file.name.length > 255) {
            warnings.push('The file name is too long.');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified)
            }
        };
    }

    /**
     * Format the file size
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// PDF text extraction service
class PDFExtractionService {
    constructor() {
        this.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        this.initializePDFJS();
    }

    /**
     * Initialize PDF.js
     */
    initializePDFJS() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = this.workerSrc;
        }
    }

    /**
     * Convert a file to an ArrayBuffer
     * @param {File} file - File to convert
     * @returns {Promise<ArrayBuffer>} ArrayBuffer
     */
    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('The file could not be read.'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Extract text from a PDF document
     * @param {File} file - PDF file
     * @param {Function} progressCallback - Progress callback
     * @returns {Promise<Object>} Extraction result
     */
    async extractTextFromPDF(file, progressCallback = () => {}) {
        try {
            progressCallback(0, 'Reading PDF file...');

            // Convert the file to an ArrayBuffer
            const arrayBuffer = await this.fileToArrayBuffer(file);
            progressCallback(20, 'Analyzing PDF document...');

            // Load the PDF document
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            progressCallback(40, 'Extracting text...');

            const extractionResult = {
                totalPages: pdf.numPages,
                pages: [],
                fullText: '',
                metadata: {
                    extractedAt: new Date().toISOString(),
                    fileName: file.name,
                    fileSize: file.size
                }
            };

            // Extract text from each page
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                try {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();

                    let pageText = '';
                    const textItems = [];

                    textContent.items.forEach(item => {
                        if (item.str && item.str.trim()) {
                            pageText += item.str + ' ';
                            textItems.push({
                                text: item.str,
                                x: item.transform[4],
                                y: item.transform[5],
                                width: item.width,
                                height: item.height
                            });
                        }
                    });

                    const pageResult = {
                        pageNumber: pageNum,
                        text: pageText.trim(),
                        items: textItems,
                        extractedAt: new Date().toISOString()
                    };

                    extractionResult.pages.push(pageResult);

                    if (pageText.trim()) {
                        extractionResult.fullText += `\n--- Page ${pageNum} ---\n${pageText.trim()}\n`;
                    }

                    // Update progress
                    const progress = 40 + (pageNum / pdf.numPages) * 40;
                    progressCallback(progress, `Processing page ${pageNum}/${pdf.numPages}...`);

                    // Brief pause for memory optimization
                    if (pageNum % 10 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }

                } catch (error) {
                    console.error(`Error while processing page ${pageNum}:`, error);
                    extractionResult.pages.push({
                        pageNumber: pageNum,
                        text: '',
                        error: error.message,
                        extractedAt: new Date().toISOString()
                    });
                }
            }

            progressCallback(80, 'Cleaning up text...');

            // Clean the text
            extractionResult.cleanedText = this.cleanText(extractionResult.fullText);

            progressCallback(100, 'Done!');

            return extractionResult;

        } catch (error) {
            throw new Error(`PDF text extraction failed: ${error.message}`);
        }
    }

    /**
     * Clean text
     * @param {string} text - Original text
     * @returns {string} Cleaned text
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')  // Remove consecutive whitespace
            .replace(/\n\s*\n/g, '\n')  // Remove consecutive blank lines
            .replace(/[^\w\s\uAC00-\uD7AF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF.,!?;:()\-"']/g, '') // Clean up special characters
            .trim();
    }

    /**
     * Extract metadata
     * @param {Object} pdf - PDF document object
     * @returns {Promise<Object>} Metadata
     */
    async extractMetadata(pdf) {
        try {
            const metadata = await pdf.getMetadata();
            return {
                title: metadata.info.Title || '',
                author: metadata.info.Author || '',
                subject: metadata.info.Subject || '',
                creator: metadata.info.Creator || '',
                producer: metadata.info.Producer || '',
                creationDate: metadata.info.CreationDate || null,
                modificationDate: metadata.info.ModDate || null,
                pdfVersion: metadata.info.PDFFormatVersion || ''
            };
        } catch (error) {
            console.error('Metadata extraction failed:', error);
            return {};
        }
    }
}

// Text chunking service
class TextChunkingService {
    constructor(options = {}) {
        this.maxChunkSize = options.maxChunkSize || 4000;
        this.overlapSize = options.overlapSize || 200;
        this.preserveContext = options.preserveContext !== false;
    }

    /**
     * Split text into chunks
     * @param {string} text - Text to split
     * @param {Object} options - Options
     * @returns {Array} Array of chunks
     */
    createChunks(text, options = {}) {
        const chunkSize = options.maxChunkSize || this.maxChunkSize;
        const overlap = options.overlapSize || this.overlapSize;

        if (!text || text.trim().length === 0) {
            return [];
        }

        // Try paragraph-based splitting
        const paragraphs = this.splitIntoParagraphs(text);
        if (paragraphs.length > 1) {
            return this.chunkByParagraphs(paragraphs, chunkSize, overlap);
        }

        // Sentence-based splitting
        const sentences = this.splitIntoSentences(text);
        if (sentences.length > 1) {
            return this.chunkBySentences(sentences, chunkSize, overlap);
        }

        // Word-based splitting
        return this.chunkByWords(text, chunkSize, overlap);
    }

    /**
     * Split into paragraphs
     * @param {string} text - Text
     * @returns {Array} Array of paragraphs
     */
    splitIntoParagraphs(text) {
        return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    }

    /**
     * Split into sentences
     * @param {string} text - Text
     * @returns {Array} Array of sentences
     */
    splitIntoSentences(text) {
        return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    }

    /**
     * Paragraph-based chunking
     * @param {Array} paragraphs - Array of paragraphs
     * @param {number} maxSize - Maximum size
     * @param {number} overlap - Overlap size
     * @returns {Array} Array of chunks
     */
    chunkByParagraphs(paragraphs, maxSize, overlap) {
        const chunks = [];
        let currentChunk = '';
        let currentParagraphs = [];

        for (const paragraph of paragraphs) {
            const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;

            if (potentialChunk.length <= maxSize) {
                currentChunk = potentialChunk;
                currentParagraphs.push(paragraph);
            } else {
                if (currentChunk) {
                    chunks.push(this.createChunkObject(currentChunk, chunks.length + 1, 'paragraph'));
                }

                if (paragraph.length > maxSize) {
                    // If the paragraph is too large, split it into sentences
                    const sentenceChunks = this.chunkBySentences(this.splitIntoSentences(paragraph), maxSize, overlap);
                    chunks.push(...sentenceChunks);
                    currentChunk = '';
                    currentParagraphs = [];
                } else {
                    currentChunk = paragraph;
                    currentParagraphs = [paragraph];
                }
            }
        }

        if (currentChunk) {
            chunks.push(this.createChunkObject(currentChunk, chunks.length + 1, 'paragraph'));
        }

        return this.addOverlap(chunks, overlap);
    }

    /**
     * Sentence-based chunking
     * @param {Array} sentences - Array of sentences
     * @param {number} maxSize - Maximum size
     * @param {number} overlap - Overlap size
     * @returns {Array} Array of chunks
     */
    chunkBySentences(sentences, maxSize, overlap) {
        const chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;

            const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + trimmedSentence;

            if (potentialChunk.length <= maxSize) {
                currentChunk = potentialChunk;
            } else {
                if (currentChunk) {
                    chunks.push(this.createChunkObject(currentChunk + '.', chunks.length + 1, 'sentence'));
                }

                if (trimmedSentence.length > maxSize) {
                    // If the sentence is too large, split it into words
                    const wordChunks = this.chunkByWords(trimmedSentence, maxSize, overlap);
                    chunks.push(...wordChunks);
                    currentChunk = '';
                } else {
                    currentChunk = trimmedSentence;
                }
            }
        }

        if (currentChunk) {
            chunks.push(this.createChunkObject(currentChunk + '.', chunks.length + 1, 'sentence'));
        }

        return this.addOverlap(chunks, overlap);
    }

    /**
     * Word-based chunking
     * @param {string} text - Text
     * @param {number} maxSize - Maximum size
     * @param {number} overlap - Overlap size
     * @returns {Array} Array of chunks
     */
    chunkByWords(text, maxSize, overlap) {
        const words = text.split(/\s+/).filter(w => w.trim().length > 0);
        const chunks = [];
        let currentChunk = '';

        for (const word of words) {
            const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + word;

            if (potentialChunk.length <= maxSize) {
                currentChunk = potentialChunk;
            } else {
                if (currentChunk) {
                    chunks.push(this.createChunkObject(currentChunk, chunks.length + 1, 'word'));
                }
                currentChunk = word;
            }
        }

        if (currentChunk) {
            chunks.push(this.createChunkObject(currentChunk, chunks.length + 1, 'word'));
        }

        return this.addOverlap(chunks, overlap);
    }

    /**
     * Create a chunk object
     * @param {string} text - Chunk text
     * @param {number} id - Chunk ID
     * @param {string} splitMethod - Split method
     * @returns {Object} Chunk object
     */
    createChunkObject(text, id, splitMethod) {
        return {
            id,
            text: text.trim(),
            length: text.trim().length,
            wordCount: text.trim().split(/\s+/).length,
            splitMethod,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Add overlap between chunks
     * @param {Array} chunks - Array of chunks
     * @param {number} overlapSize - Overlap size
     * @returns {Array} Array of chunks with overlap added
     */
    addOverlap(chunks, overlapSize) {
        if (!this.preserveContext || overlapSize <= 0 || chunks.length <= 1) {
            return chunks;
        }

        const overlappedChunks = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = { ...chunks[i] };

            // Append the end of the previous chunk
            if (i > 0 && overlapSize > 0) {
                const prevChunk = chunks[i - 1];
                const prevOverlap = prevChunk.text.slice(-overlapSize);
                chunk.text = prevOverlap + ' ' + chunk.text;
                chunk.hasOverlapBefore = true;
            }

            // Prepend the beginning of the next chunk
            if (i < chunks.length - 1 && overlapSize > 0) {
                const nextChunk = chunks[i + 1];
                const nextOverlap = nextChunk.text.slice(0, overlapSize);
                chunk.text = chunk.text + ' ' + nextOverlap;
                chunk.hasOverlapAfter = true;
            }

            chunk.length = chunk.text.length;
            overlappedChunks.push(chunk);
        }

        return overlappedChunks;
    }

    /**
     * Analyze chunk quality
     * @param {Array} chunks - Array of chunks
     * @returns {Object} Quality analysis result
     */
    analyzeChunkQuality(chunks) {
        if (!chunks || chunks.length === 0) {
            return { quality: 'empty', issues: ['No chunks provided'] };
        }

        const analysis = {
            totalChunks: chunks.length,
            averageLength: chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length,
            minLength: Math.min(...chunks.map(c => c.length)),
            maxLength: Math.max(...chunks.map(c => c.length)),
            lengthVariance: this.calculateVariance(chunks.map(c => c.length)),
            splitMethods: [...new Set(chunks.map(c => c.splitMethod))],
            issues: [],
            recommendations: []
        };

        // Analyze quality issues
        if (analysis.averageLength < this.maxChunkSize * 0.3) {
            analysis.issues.push('Chunk size is too small');
            analysis.recommendations.push('Reduce maxChunkSize or group the text into larger units');
        }

        if (analysis.lengthVariance > analysis.averageLength * 0.5) {
            analysis.issues.push('Chunk size variance is high');
            analysis.recommendations.push('Use a more consistent splitting strategy');
        }

        if (chunks.some(c => c.length > this.maxChunkSize)) {
            analysis.issues.push('Some chunks exceed the maximum size');
            analysis.recommendations.push('Check the maxChunkSize setting');
        }

        // Calculate a quality score
        analysis.quality = this.calculateQualityScore(analysis);

        return analysis;
    }

    /**
     * Calculate variance
     * @param {Array} numbers - Array of numbers
     * @returns {number} Variance
     */
    calculateVariance(numbers) {
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    }

    /**
     * Calculate a quality score
     * @param {Object} analysis - Analysis result
     * @returns {string} Quality score
     */
    calculateQualityScore(analysis) {
        let score = 100;

        // Deduct points for issues
        score -= analysis.issues.length * 15;

        // Deduct points for length variance
        if (analysis.lengthVariance > analysis.averageLength * 0.3) {
            score -= 20;
        }

        // Adjust the score based on chunk count
        if (analysis.totalChunks === 1) {
            score += 10; // No chunking needed
        } else if (analysis.totalChunks > 20) {
            score -= 10; // Too many chunks
        }

        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    }
}

// AI API integration service
class AIIntegrationService {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || '/api/summarize';
        this.timeout = options.timeout || 30000;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
    }

    /**
     * Prepare data for the AI API
     * @param {Object} extractionResult - Extraction result
     * @param {Array} chunks - Array of chunks
     * @param {Object} metadata - Additional metadata
     * @returns {Object} Data for the AI API
     */
    prepareDataForAI(extractionResult, chunks, metadata = {}) {
        return {
            document: {
                fileName: extractionResult.metadata.fileName,
                fileSize: extractionResult.metadata.fileSize,
                totalPages: extractionResult.totalPages,
                extractedAt: extractionResult.metadata.extractedAt
            },
            content: {
                fullText: extractionResult.cleanedText,
                totalChunks: chunks.length,
                chunks: chunks.map(chunk => ({
                    id: chunk.id,
                    text: chunk.text,
                    length: chunk.length,
                    wordCount: chunk.wordCount,
                    splitMethod: chunk.splitMethod
                }))
            },
            processing: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                ...metadata
            }
        };
    }

    /**
     * Call the AI API
     * @param {Object} data - Data to send
     * @param {Object} options - Options
     * @returns {Promise<Object>} API response
     */
    async callAI(data, options = {}) {
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(options.timeout || this.timeout)
        };

        let lastError;

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await fetch(this.apiEndpoint, requestOptions);

                if (!response.ok) {
                    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                return this.processAPIResponse(result, data);

            } catch (error) {
                lastError = error;
                console.error(`AI API call attempt ${attempt} failed:`, error);

                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }

        throw new Error(`AI API call failed (${this.retryAttempts} attempts): ${lastError.message}`);
    }

    /**
     * Process the API response
     * @param {Object} response - API response
     * @param {Object} originalData - Original data
     * @returns {Object} Processed response
     */
    processAPIResponse(response, originalData) {
        return {
            summary: response.summary || '',
            keyPoints: response.keyPoints || [],
            sentiment: response.sentiment || 'neutral',
            confidence: response.confidence || 0,
            metadata: {
                processedAt: new Date().toISOString(),
                originalDocument: originalData.document.fileName,
                processingTime: response.processingTime || 0,
                model: response.model || 'unknown'
            }
        };
    }

    /**
     * Delay function
     * @param {number} ms - Delay time (milliseconds)
     * @returns {Promise} Delay Promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Process chunks individually
     * @param {Array} chunks - Array of chunks
     * @param {Object} options - Options
     * @returns {Promise<Array>} Array of processing results
     */
    async processChunksIndividually(chunks, options = {}) {
        const results = [];
        const batchSize = options.batchSize || 5;

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            const batchPromises = batch.map(chunk =>
                this.callAI({ content: { text: chunk.text } }, options)
            );

            try {
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults);
            } catch (error) {
                console.error(`Batch ${Math.floor(i / batchSize) + 1} processing failed:`, error);
                results.push(...batch.map(() => ({ status: 'rejected', reason: error })));
            }
        }

        return results;
    }
}

// Memory management service
class MemoryManagementService {
    constructor() {
        this.memoryThresholds = {
            warning: 100 * 1024 * 1024,  // 100MB
            critical: 200 * 1024 * 1024  // 200MB
        };
        this.cleanupIntervals = new Set();
    }

    /**
     * Monitor memory usage
     * @returns {Object} Memory information
     */
    getMemoryInfo() {
        if ('memory' in performance) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                available: performance.memory.jsHeapSizeLimit - performance.memory.usedJSHeapSize
            };
        }
        return { available: 'unknown' };
    }

    /**
     * Clean up memory
     * @param {Object} context - Context to clean up
     */
    cleanup(context) {
        if (context.currentFile) {
            context.currentFile = null;
        }

        if (context.extractedText) {
            context.extractedText = '';
        }

        if (context.textChunks) {
            context.textChunks = [];
        }

        // Force garbage collection (if available)
        if (typeof window !== 'undefined' && window.gc) {
            window.gc();
        }
    }

    /**
     * Set up automatic cleanup
     * @param {number} interval - Cleanup interval (milliseconds)
     * @param {Function} cleanupFn - Cleanup function
     * @returns {number} Interval ID
     */
    scheduleCleanup(interval, cleanupFn) {
        const intervalId = setInterval(() => {
            const memoryInfo = this.getMemoryInfo();
            if (memoryInfo.used && memoryInfo.used > this.memoryThresholds.warning) {
                console.warn('Memory usage is high. Running cleanup.');
                cleanupFn();
            }
        }, interval);

        this.cleanupIntervals.add(intervalId);
        return intervalId;
    }

    /**
     * Stop all cleanup intervals
     */
    stopAllCleanup() {
        this.cleanupIntervals.forEach(intervalId => {
            clearInterval(intervalId);
        });
        this.cleanupIntervals.clear();
    }
}

// Error handling service
class ErrorHandlingService {
    constructor() {
        this.errorHistory = [];
        this.maxHistorySize = 100;
    }

    /**
     * Handle an error
     * @param {Error} error - Error object
     * @param {string} context - Context where the error occurred
     * @returns {Object} Processed error information
     */
    handleError(error, context = 'unknown') {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            type: error.constructor.name
        };

        this.addToHistory(errorInfo);

        // Generate a user-friendly message
        const userMessage = this.generateUserFriendlyMessage(error, context);

        return {
            userMessage,
            technical: errorInfo,
            suggestions: this.generateSuggestions(error, context)
        };
    }

    /**
     * Add to the error history
     * @param {Object} errorInfo - Error information
     */
    addToHistory(errorInfo) {
        this.errorHistory.unshift(errorInfo);
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
        }
    }

    /**
     * Generate a user-friendly message
     * @param {Error} error - Error object
     * @param {string} context - Context
     * @returns {string} User message
     */
    generateUserFriendlyMessage(error, context) {
        const errorPatterns = {
            'PDF parsing': 'The PDF file could not be analyzed.',
            'File reading': 'The file could not be read.',
            'Network': 'There is a problem with the network connection.',
            'Memory': 'Not enough memory.',
            'Timeout': 'Processing timed out.'
        };

        for (const [pattern, message] of Object.entries(errorPatterns)) {
            if (error.message.includes(pattern) || context.includes(pattern)) {
                return message;
            }
        }

        return 'An unexpected error occurred.';
    }

    /**
     * Generate suggestions for resolution
     * @param {Error} error - Error object
     * @param {string} context - Context
     * @returns {Array} Array of suggestions
     */
    generateSuggestions(error, context) {
        const suggestions = [];

        if (error.message.includes('size') || context.includes('size')) {
            suggestions.push('Try using a smaller file.');
        }

        if (error.message.includes('network') || error.message.includes('fetch')) {
            suggestions.push('Check your internet connection and try again.');
        }

        if (error.message.includes('PDF') || error.message.includes('parsing')) {
            suggestions.push('Try a different PDF file, or check that the file is not corrupted.');
        }

        if (error.message.includes('memory') || context.includes('memory')) {
            suggestions.push('Refresh the browser and try closing other tabs.');
        }

        if (suggestions.length === 0) {
            suggestions.push('Refresh the page and try again.');
        }

        return suggestions;
    }

    /**
     * Generate error statistics
     * @returns {Object} Error statistics
     */
    getErrorStatistics() {
        const stats = {
            total: this.errorHistory.length,
            byType: {},
            byContext: {},
            recent: this.errorHistory.slice(0, 10)
        };

        this.errorHistory.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.byContext[error.context] = (stats.byContext[error.context] || 0) + 1;
        });

        return stats;
    }
}

// Unified backend service manager
class PDFBackendServiceManager {
    constructor(options = {}) {
        this.validation = new PDFValidationService();
        this.extraction = new PDFExtractionService();
        this.chunking = new TextChunkingService(options.chunking);
        this.aiIntegration = new AIIntegrationService(options.ai);
        this.memoryManagement = new MemoryManagementService();
        this.errorHandling = new ErrorHandlingService();

        this.options = {
            autoCleanup: options.autoCleanup !== false,
            cleanupInterval: options.cleanupInterval || 60000,
            ...options
        };

        if (this.options.autoCleanup) {
            this.setupAutoCleanup();
        }
    }

    /**
     * Set up automatic cleanup
     */
    setupAutoCleanup() {
        this.memoryManagement.scheduleCleanup(
            this.options.cleanupInterval,
            () => this.memoryManagement.cleanup(this)
        );
    }

    /**
     * Full PDF processing pipeline
     * @param {File} file - PDF file
     * @param {Function} progressCallback - Progress callback
     * @param {Object} options - Options
     * @returns {Promise<Object>} Processing result
     */
    async processPDF(file, progressCallback = () => {}, options = {}) {
        try {
            // 1. Validate the file
            progressCallback(0, 'Validating file...');
            const validationResult = this.validation.validateFile(file);

            if (!validationResult.isValid) {
                throw new Error(validationResult.errors.join(', '));
            }

            // 2. Extract text
            progressCallback(10, 'Extracting text...');
            const extractionResult = await this.extraction.extractTextFromPDF(
                file,
                (progress, message) => progressCallback(10 + progress * 0.6, message)
            );

            // 3. Chunk the text
            progressCallback(80, 'Splitting text...');
            const chunks = this.chunking.createChunks(extractionResult.cleanedText, options.chunking);
            const chunkQuality = this.chunking.analyzeChunkQuality(chunks);

            // 4. Prepare data for the AI API
            progressCallback(90, 'Preparing AI integration data...');
            const aiData = this.aiIntegration.prepareDataForAI(extractionResult, chunks, options.metadata);

            progressCallback(100, 'Done!');

            return {
                validation: validationResult,
                extraction: extractionResult,
                chunks: {
                    items: chunks,
                    quality: chunkQuality
                },
                aiData,
                metadata: {
                    processedAt: new Date().toISOString(),
                    processingTime: Date.now() - (options.startTime || Date.now()),
                    memoryInfo: this.memoryManagement.getMemoryInfo()
                }
            };

        } catch (error) {
            const errorInfo = this.errorHandling.handleError(error, 'PDF processing');
            throw new Error(errorInfo.userMessage);
        }
    }

    /**
     * Process AI summarization
     * @param {Object} aiData - AI data
     * @param {Object} options - Options
     * @returns {Promise<Object>} Summary result
     */
    async processWithAI(aiData, options = {}) {
        try {
            return await this.aiIntegration.callAI(aiData, options);
        } catch (error) {
            const errorInfo = this.errorHandling.handleError(error, 'AI processing');
            throw new Error(errorInfo.userMessage);
        }
    }

    /**
     * Clean up services
     */
    cleanup() {
        this.memoryManagement.stopAllCleanup();
        this.memoryManagement.cleanup(this);
    }

    /**
     * Get service status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            memory: this.memoryManagement.getMemoryInfo(),
            errors: this.errorHandling.getErrorStatistics(),
            options: this.options
        };
    }
}

// Export the service managers globally
if (typeof window !== 'undefined') {
    window.PDFBackendServices = {
        PDFValidationService,
        PDFExtractionService,
        TextChunkingService,
        AIIntegrationService,
        MemoryManagementService,
        ErrorHandlingService,
        PDFBackendServiceManager
    };
}

// Exports for the Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PDFValidationService,
        PDFExtractionService,
        TextChunkingService,
        AIIntegrationService,
        MemoryManagementService,
        ErrorHandlingService,
        PDFBackendServiceManager
    };
}