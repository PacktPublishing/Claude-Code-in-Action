# PDF Summarization Application Deployment Guide

## 📋 Overview

This guide explains how to deploy the PDF summarization web application, which uses the OpenRouter API and the gpt-oss-20b model.

## 🏗️ Architecture

### Client-Side Structure
```
pdf-summarizer-app/
├── pdf-summarizer-app.html     # Main application
├── openrouter-client.js        # OpenRouter API client
├── text-summarization-service.js # Summarization service
├── prompt-templates.js         # Prompt templates
├── error-handler.js           # Error handling
├── token-manager.js           # Token management
├── config.js                  # Configuration management
└── deployment-guide.md        # This file
```

## 🚀 Deployment Options

### 1. Static Website Deployment (Recommended)

#### Deploying to Netlify
```bash
# 1. Build the project (if needed)
npm run build

# 2. Install the Netlify CLI
npm install -g netlify-cli

# 3. Deploy
netlify deploy --prod --dir=./
```

#### Deploying to Vercel
```bash
# 1. Install the Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod
```

#### Deploying to GitHub Pages
1. Upload the code to a GitHub repository
2. Configure deployment under Settings > Pages
3. Set the branch to `main`

### 2. CDN Deployment

#### Including Directly in HTML
```html
<!DOCTYPE html>
<html>
<head>
    <title>PDF Summarization Service</title>
</head>
<body>
    <!-- Application content -->

    <!-- Load scripts -->
    <script src="https://your-cdn.com/openrouter-client.js"></script>
    <script src="https://your-cdn.com/text-summarization-service.js"></script>
    <!-- Other modules -->
</body>
</html>
```

### 3. Server-Side Proxy (Recommended for Security)

#### Express.js Proxy Server
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// API proxy endpoint
app.post('/api/summarize', async (req, res) => {
    try {
        const { text, mode, options } = req.body;

        // Call the OpenRouter API (API key used on the server)
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b:free',
                messages: [
                    { role: 'system', content: 'Summarization system prompt' },
                    { role: 'user', content: text }
                ]
            })
        });

        const result = await response.json();
        res.json(result);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000.');
});
```

## 🔒 Security Considerations

### 1. API Key Security

#### Client-Side (Current Implementation)
- ⚠️ The API key is exposed in the browser
- Suitable for development/testing environments only
- Usage limits should be configured

#### Server-Side (Recommended)
- ✅ The API key is used only on the server
- Managed via environment variables
- Implement a client authentication system

### 2. CORS Configuration

The OpenRouter API supports CORS, so it can be called directly from the client, but using a proxy server is recommended for security.

```javascript
// Example CORS header configuration
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://your-domain.com');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    next();
});
```

### 3. Input Validation and Sanitization

```javascript
// Server-side input validation
const validator = require('validator');

function validateInput(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input.');
    }

    if (text.length > 500000) { // 500KB limit
        throw new Error('Text is too large.');
    }

    // Prevent XSS
    return validator.escape(text);
}
```

## 🌍 Environment Configuration

### 1. Environment Variables (.env)
```env
# API settings
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Application settings
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-domain.com

# Security settings
RATE_LIMIT_REQUESTS_PER_MINUTE=60
MAX_FILE_SIZE=52428800  # 50MB
MAX_TEXT_LENGTH=500000  # 500K characters

# Monitoring
ENABLE_ANALYTICS=true
LOG_LEVEL=info
```

### 2. Configuration File (config/production.js)
```javascript
module.exports = {
    api: {
        baseUrl: process.env.OPENROUTER_BASE_URL,
        apiKey: process.env.OPENROUTER_API_KEY,
        timeout: 45000,
        maxRetries: 3
    },

    security: {
        corsOrigin: process.env.CORS_ORIGIN,
        rateLimitRpm: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE),
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE),
        maxTextLength: parseInt(process.env.MAX_TEXT_LENGTH)
    },

    monitoring: {
        enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
        logLevel: process.env.LOG_LEVEL || 'info'
    }
};
```

## 📊 Monitoring and Logging

### 1. Request Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Log API calls
app.use((req, res, next) => {
    logger.info({
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    next();
});
```

### 2. Error Tracking
```javascript
// Error-handling middleware
app.use((error, req, res, next) => {
    logger.error({
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    res.status(500).json({
        error: 'An internal server error occurred.',
        requestId: req.id
    });
});
```

### 3. Usage Monitoring
```javascript
// Usage tracking
let usageStats = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    errorCount: 0
};

// Update usage stats
function updateUsageStats(tokens, cost, hasError = false) {
    usageStats.totalRequests++;
    usageStats.totalTokens += tokens;
    usageStats.totalCost += cost;
    if (hasError) usageStats.errorCount++;
}

// Usage report endpoint
app.get('/api/stats', (req, res) => {
    res.json({
        ...usageStats,
        averageCostPerRequest: usageStats.totalCost / usageStats.totalRequests,
        errorRate: (usageStats.errorCount / usageStats.totalRequests * 100).toFixed(2) + '%'
    });
});
```

## 🔧 Optimization Tips

### 1. Performance Optimization

#### Enable Compression
```javascript
const compression = require('compression');
app.use(compression());
```

#### Configure Caching
```javascript
// Static file caching
app.use(express.static('public', {
    maxAge: '1d',  // Cache for 1 day
    etag: true
}));

// API response caching (using Redis)
const redis = require('redis');
const client = redis.createClient();

app.use('/api/summarize', async (req, res, next) => {
    const cacheKey = crypto.createHash('md5').update(JSON.stringify(req.body)).digest('hex');

    try {
        const cached = await client.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
    } catch (error) {
        console.warn('Cache read failed:', error);
    }

    next();
});
```

### 2. Cost Optimization

#### Monitor Token Usage
```javascript
// Check token usage
function checkTokenUsage(estimatedTokens) {
    const dailyLimit = 1000000; // Daily token limit
    const currentUsage = getCurrentDailyUsage();

    if (currentUsage + estimatedTokens > dailyLimit) {
        throw new Error('Daily token usage limit exceeded.');
    }
}
```

#### Optimize Requests
```javascript
// Prevent duplicate requests
const requestCache = new Map();

app.post('/api/summarize', (req, res) => {
    const requestHash = hashRequest(req.body);

    if (requestCache.has(requestHash)) {
        return res.json(requestCache.get(requestHash));
    }

    // Process the request...
});
```

## 🧪 Testing

### 1. Unit Tests
```javascript
// test/openrouter-client.test.js
const { OpenRouterClient } = require('../openrouter-client');

describe('OpenRouterClient', () => {
    test('validates API key', () => {
        expect(() => {
            new OpenRouterClient({ apiKey: 'invalid-key' });
        }).toThrow('Invalid OpenRouter API key format');
    });

    test('estimates tokens', () => {
        const client = new OpenRouterClient({ apiKey: 'sk-or-v1-test' });
        const tokens = client.estimateTokens('Hello world');
        expect(tokens).toBeGreaterThan(0);
    });
});
```

### 2. Integration Tests
```javascript
// test/integration.test.js
describe('Summarization integration tests', () => {
    test('summarizes short text', async () => {
        const text = 'This is a short test text.';
        const result = await summarizationService.summarize(text, 'brief');

        expect(result.summary).toBeDefined();
        expect(result.metadata.originalLength).toEqual(text.length);
    });
});
```

## 🚨 Troubleshooting

### 1. Common Issues

#### CORS Errors
```
Access to fetch at 'https://openrouter.ai/api/v1/chat/completions'
from origin 'https://your-domain.com' has been blocked by CORS policy
```

**Solution:**
- OpenRouter supports CORS, so verify that the headers are configured correctly
- Consider using a proxy server

#### API Key Errors
```
401 Unauthorized: Invalid API key
```

**Solution:**
- Check the API key format (it should start with `sk-or-v1-`)
- Verify the environment variable configuration
- Check your OpenRouter account and credits

#### Token Limit Errors
```
400 Bad Request: Token limit exceeded
```

**Solution:**
- Verify the text-chunking implementation
- Improve the token estimation logic
- Adjust the maximum token count

### 2. Debugging Tools

#### Log Analysis
```bash
# Monitor error logs
tail -f error.log | grep "ERROR"

# Analyze request volume
grep "POST /api/summarize" combined.log | wc -l
```

#### Performance Monitoring
```javascript
// Measure response time
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.url} - ${duration}ms`);
    });

    next();
});
```

## 📞 Support and Contact

- **OpenRouter documentation**: https://openrouter.ai/docs
- **gpt-oss model information**: https://openrouter.ai/models/openai/gpt-oss-20b:free
- **Technical support**: project issue tracker or contact the development team

## 📄 License

This project is distributed under the MIT license. See the LICENSE file for details.
