/**
 * PDF Summarization API Integration Examples
 * Backend API integration code that can be used in a real server environment
 */

// OpenAI API integration example
class OpenAIIntegrationService {
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.baseURL = options.baseURL || 'https://api.openai.com/v1';
        this.model = options.model || 'gpt-3.5-turbo';
        this.maxTokens = options.maxTokens || 4000;
        this.temperature = options.temperature || 0.3;
    }

    /**
     * Text summarization using the OpenAI API
     * @param {string} text - Text to summarize
     * @param {Object} options - Summarization options
     * @returns {Promise<Object>} Summarization result
     */
    async summarizeText(text, options = {}) {
        const prompt = this.createSummaryPrompt(text, options);

        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional document summarization expert. Summarize the given text accurately and concisely, and respond in English.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: this.maxTokens,
                    temperature: this.temperature
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return this.parseOpenAIResponse(data);

        } catch (error) {
            throw new Error(`OpenAI API call failed: ${error.message}`);
        }
    }

    /**
     * Create summarization prompt
     * @param {string} text - Original text
     * @param {Object} options - Options
     * @returns {string} Prompt
     */
    createSummaryPrompt(text, options) {
        const summaryType = options.type || 'comprehensive';
        const language = options.language || 'english';
        const length = options.length || 'medium';

        let prompt = `Please summarize the following document in ${language}.\n\n`;

        switch (summaryType) {
            case 'bullet-points':
                prompt += 'Organize the main content as bullet points.\n';
                break;
            case 'executive':
                prompt += 'Write an executive summary for senior management.\n';
                break;
            case 'technical':
                prompt += 'Summarize with a focus on the technical content.\n';
                break;
            default:
                prompt += 'Summarize the overall content comprehensively.\n';
        }

        switch (length) {
            case 'short':
                prompt += 'Summary length: 2-3 sentences\n';
                break;
            case 'long':
                prompt += 'Summary length: include detailed explanations\n';
                break;
            default:
                prompt += 'Summary length: an appropriate length\n';
        }

        prompt += `\nDocument content:\n${text}`;

        return prompt;
    }

    /**
     * Parse OpenAI response
     * @param {Object} response - OpenAI API response
     * @returns {Object} Parsed result
     */
    parseOpenAIResponse(response) {
        const content = response.choices[0]?.message?.content || '';

        return {
            summary: content,
            model: response.model,
            usage: response.usage,
            finishReason: response.choices[0]?.finish_reason,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Parallel summarization of chunks in batches
     * @param {Array} chunks - Array of text chunks
     * @param {Object} options - Options
     * @returns {Promise<Array>} Array of summarization results
     */
    async summarizeChunks(chunks, options = {}) {
        const batchSize = options.batchSize || 3;
        const results = [];

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            const batchPromises = batch.map(chunk =>
                this.summarizeText(chunk.text, {
                    ...options,
                    type: 'comprehensive',
                    length: 'short'
                })
            );

            try {
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults);

                // Delay to respect API rate limits
                if (i + batchSize < chunks.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error(`Batch ${Math.floor(i / batchSize) + 1} processing failed:`, error);
            }
        }

        return results;
    }
}

// Claude API integration example (Anthropic)
class ClaudeIntegrationService {
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.baseURL = options.baseURL || 'https://api.anthropic.com/v1';
        this.model = options.model || 'claude-3-sonnet-20240229';
        this.maxTokens = options.maxTokens || 4000;
    }

    /**
     * Text summarization using the Claude API
     * @param {string} text - Text to summarize
     * @param {Object} options - Summarization options
     * @returns {Promise<Object>} Summarization result
     */
    async summarizeText(text, options = {}) {
        const prompt = this.createClaudePrompt(text, options);

        try {
            const response = await fetch(`${this.baseURL}/messages`, {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: this.maxTokens,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return this.parseClaudeResponse(data);

        } catch (error) {
            throw new Error(`Claude API call failed: ${error.message}`);
        }
    }

    /**
     * Create prompt for Claude
     * @param {string} text - Original text
     * @param {Object} options - Options
     * @returns {string} Prompt
     */
    createClaudePrompt(text, options) {
        return `Please analyze and summarize the following document.

Summary requirements:
- Include the main content and key points
- Write in clear and concise English
- Preserve the context and meaning of the original text

Document content:
${text}

Please provide a summary of the document above in English.`;
    }

    /**
     * Parse Claude response
     * @param {Object} response - Claude API response
     * @returns {Object} Parsed result
     */
    parseClaudeResponse(response) {
        const content = response.content[0]?.text || '';

        return {
            summary: content,
            model: response.model,
            usage: response.usage,
            generatedAt: new Date().toISOString()
        };
    }
}

// Universal AI service manager
class UniversalAIService {
    constructor() {
        this.providers = new Map();
        this.defaultProvider = null;
    }

    /**
     * Register an AI provider
     * @param {string} name - Provider name
     * @param {Object} service - Service instance
     * @param {boolean} isDefault - Whether this is the default provider
     */
    registerProvider(name, service, isDefault = false) {
        this.providers.set(name, service);
        if (isDefault || !this.defaultProvider) {
            this.defaultProvider = name;
        }
    }

    /**
     * Text summarization (automatic provider selection)
     * @param {string} text - Text to summarize
     * @param {Object} options - Options
     * @returns {Promise<Object>} Summarization result
     */
    async summarize(text, options = {}) {
        const provider = options.provider || this.defaultProvider;
        const service = this.providers.get(provider);

        if (!service) {
            throw new Error(`AI provider '${provider}' not found.`);
        }

        try {
            return await service.summarizeText(text, options);
        } catch (error) {
            // If a non-default provider fails, retry with the default provider
            if (provider !== this.defaultProvider) {
                console.warn(`${provider} failed, retrying with default provider:`, error.message);
                return await this.summarize(text, { ...options, provider: this.defaultProvider });
            }
            throw error;
        }
    }

    /**
     * Summarize with multiple providers simultaneously (return the fastest result)
     * @param {string} text - Text to summarize
     * @param {Array} providers - List of providers to use
     * @param {Object} options - Options
     * @returns {Promise<Object>} Summarization result
     */
    async summarizeRace(text, providers = [], options = {}) {
        if (providers.length === 0) {
            providers = Array.from(this.providers.keys());
        }

        const promises = providers.map(provider =>
            this.summarize(text, { ...options, provider })
                .then(result => ({ provider, result, success: true }))
                .catch(error => ({ provider, error, success: false }))
        );

        const results = await Promise.allSettled(promises);
        const successful = results
            .filter(r => r.status === 'fulfilled' && r.value.success)
            .map(r => r.value);

        if (successful.length === 0) {
            throw new Error('Summarization failed with all AI providers');
        }

        return successful[0].result;
    }
}

// Express.js server backend example
class PDFSummaryServer {
    constructor(options = {}) {
        this.aiService = new UniversalAIService();
        this.port = options.port || 3000;
        this.cors = options.cors !== false;

        this.setupAIProviders(options.ai || {});
    }

    /**
     * Configure AI providers
     * @param {Object} aiConfig - AI configuration
     */
    setupAIProviders(aiConfig) {
        if (aiConfig.openai && aiConfig.openai.apiKey) {
            const openaiService = new OpenAIIntegrationService(
                aiConfig.openai.apiKey,
                aiConfig.openai.options
            );
            this.aiService.registerProvider('openai', openaiService, true);
        }

        if (aiConfig.claude && aiConfig.claude.apiKey) {
            const claudeService = new ClaudeIntegrationService(
                aiConfig.claude.apiKey,
                aiConfig.claude.options
            );
            this.aiService.registerProvider('claude', claudeService);
        }
    }

    /**
     * Configure the Express app
     * @returns {Object} Express app
     */
    createApp() {
        const express = require('express');
        const multer = require('multer');
        const app = express();

        // Middleware configuration
        if (this.cors) {
            app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
                next();
            });
        }

        app.use(express.json({ limit: '50mb' }));
        app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // File upload configuration
        const upload = multer({
            storage: multer.memoryStorage(),
            limits: {
                fileSize: 50 * 1024 * 1024 // 50MB
            },
            fileFilter: (req, file, cb) => {
                if (file.mimetype === 'application/pdf') {
                    cb(null, true);
                } else {
                    cb(new Error('Only PDF files can be uploaded.'));
                }
            }
        });

        // Route configuration
        this.setupRoutes(app, upload);

        return app;
    }

    /**
     * Configure routes
     * @param {Object} app - Express app
     * @param {Object} upload - Multer middleware
     */
    setupRoutes(app, upload) {
        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                providers: Array.from(this.aiService.providers.keys())
            });
        });

        // PDF upload and text extraction endpoint
        app.post('/api/extract', upload.single('pdf'), async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ error: 'A PDF file is required.' });
                }

                // Implement the actual PDF text extraction logic here
                // Use the services from pdf-backend-services.js on the server side

                res.json({
                    success: true,
                    message: 'PDF text extraction completed',
                    // Return extraction results
                });

            } catch (error) {
                console.error('PDF extraction error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Text summarization endpoint
        app.post('/api/summarize', async (req, res) => {
            try {
                const { content, options = {} } = req.body;

                if (!content) {
                    return res.status(400).json({ error: 'Content to summarize is required.' });
                }

                let result;

                if (content.chunks && content.chunks.length > 0) {
                    // Summarize per chunk
                    const summaries = [];
                    for (const chunk of content.chunks) {
                        const summary = await this.aiService.summarize(chunk.text, options);
                        summaries.push({
                            chunkId: chunk.id,
                            summary: summary.summary
                        });
                    }

                    // Generate the overall summary
                    const combinedText = summaries.map(s => s.summary).join('\n\n');
                    const finalSummary = await this.aiService.summarize(combinedText, {
                        ...options,
                        type: 'comprehensive'
                    });

                    result = {
                        summary: finalSummary.summary,
                        chunkSummaries: summaries,
                        metadata: finalSummary
                    };
                } else {
                    // Summarize a single text
                    result = await this.aiService.summarize(content.fullText || content.text, options);
                }

                res.json({
                    success: true,
                    data: result,
                    processedAt: new Date().toISOString()
                });

            } catch (error) {
                console.error('Summarization error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Batch processing endpoint
        app.post('/api/batch-summarize', async (req, res) => {
            try {
                const { items, options = {} } = req.body;

                if (!Array.isArray(items) || items.length === 0) {
                    return res.status(400).json({ error: 'Items to process are required.' });
                }

                const results = [];
                for (const item of items) {
                    try {
                        const result = await this.aiService.summarize(item.text, options);
                        results.push({
                            id: item.id,
                            success: true,
                            summary: result.summary
                        });
                    } catch (error) {
                        results.push({
                            id: item.id,
                            success: false,
                            error: error.message
                        });
                    }
                }

                res.json({
                    success: true,
                    results,
                    processedAt: new Date().toISOString()
                });

            } catch (error) {
                console.error('Batch processing error:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }

    /**
     * Start the server
     */
    start() {
        const app = this.createApp();

        app.listen(this.port, () => {
            console.log(`PDF summarization server is running on port ${this.port}.`);
            console.log(`Health check: http://localhost:${this.port}/health`);
        });

        return app;
    }
}

// Usage example
function createPDFSummaryServer() {
    const server = new PDFSummaryServer({
        port: 3000,
        cors: true,
        ai: {
            openai: {
                apiKey: process.env.OPENAI_API_KEY,
                options: {
                    model: 'gpt-3.5-turbo',
                    maxTokens: 4000,
                    temperature: 0.3
                }
            },
            claude: {
                apiKey: process.env.CLAUDE_API_KEY,
                options: {
                    model: 'claude-3-sonnet-20240229',
                    maxTokens: 4000
                }
            }
        }
    });

    return server.start();
}

// Client-side API integration helper
class ClientAPIService {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
    }

    /**
     * Upload a PDF file and extract text
     * @param {File} file - PDF file
     * @returns {Promise<Object>} Extraction result
     */
    async extractPDF(file) {
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await fetch(`${this.baseURL}/api/extract`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Request text summarization
     * @param {Object} content - Content to summarize
     * @param {Object} options - Summarization options
     * @returns {Promise<Object>} Summarization result
     */
    async summarize(content, options = {}) {
        const response = await fetch(`${this.baseURL}/api/summarize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content, options })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Check server status
     * @returns {Promise<Object>} Server status
     */
    async checkHealth() {
        const response = await fetch(`${this.baseURL}/health`);
        return await response.json();
    }
}

// Register globally for use in browser environments
if (typeof window !== 'undefined') {
    window.APIIntegration = {
        OpenAIIntegrationService,
        ClaudeIntegrationService,
        UniversalAIService,
        ClientAPIService
    };
}

// Export module for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        OpenAIIntegrationService,
        ClaudeIntegrationService,
        UniversalAIService,
        PDFSummaryServer,
        ClientAPIService,
        createPDFSummaryServer
    };
}
