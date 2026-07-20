/**
 * Prompt Engineering Templates for Text Summarization
 *
 * This module contains carefully crafted prompt templates optimized for
 * DeepSeek V3.1 model to achieve high-quality text summarization results.
 *
 * Features:
 * - Multiple template variations for different content types
 * - English language optimization
 * - Domain-specific prompts (academic, business, legal, etc.)
 * - Chain-of-thought reasoning integration
 * - Quality enhancement techniques
 */

class PromptTemplates {
    constructor(config = {}) {
        this.config = {
            language: config.language || 'korean',
            defaultStyle: config.defaultStyle || 'professional',
            includeMetadata: config.includeMetadata !== false,
            ...config
        };

        // Initialize template collections
        this.systemPrompts = new Map();
        this.userPrompts = new Map();
        this.domainPrompts = new Map();
        this.chainOfThoughtPrompts = new Map();

        this.initializeTemplates();
    }

    /**
     * Initialize all prompt templates
     */
    initializeTemplates() {
        this.initializeSystemPrompts();
        this.initializeUserPrompts();
        this.initializeDomainPrompts();
        this.initializeChainOfThoughtPrompts();
    }

    /**
     * Initialize system prompts for different contexts
     */
    initializeSystemPrompts() {
        // Basic summarization prompt
        this.systemPrompts.set('basic_korean', `You are an expert text summarizer. Please follow these guidelines:

**Core Principles**:
1. Extract only the core message and important information from the source text
2. Preserve the logical flow and structure while expressing it concisely
3. Include only objective and accurate information; no speculation or interpretation
4. Write in clear and natural English; always respond in English
5. Adjust the summary length according to the requested mode

**Quality Standards**:
- Prioritize information by importance
- Remove duplicate content and focus on key points
- Use a writing style that is easy to read and understand
- Add brief explanations for technical terms when needed

**Prohibitions**:
- Do not add content that is not in the source text
- Do not include personal opinions or evaluations
- Do not lose meaning through excessive abbreviation`);

        // Academic paper summarization
        this.systemPrompts.set('academic_korean', `You are an expert academic paper summarizer. Follow these guidelines to write summaries of academic quality, and always respond in English:

**Academic Summarization Principles**:
1. Clearly distinguish the research objective, methodology, main results, and conclusions
2. Emphasize key contributions and new findings
3. Include the study's limitations and directions for future research
4. Use accurate academic terminology and explain concepts
5. Include data and figures selectively, only the important ones

**Structural Requirements**:
- Background and Objectives
- Research Methods
- Main Results
- Conclusions and Significance
- Limitations and Recommendations (if applicable)

**Quality Indicators**:
- Clearly convey the originality and contribution of the research
- Explain complex concepts in an accessible way
- Maintain logical consistency`);

        // Business document summarization
        this.systemPrompts.set('business_korean', `You are an expert business document summarizer. Write summaries that executives and practitioners can understand quickly, and always respond in English:

**Business Summarization Principles**:
1. Prioritize key business impact and actionable insights
2. Emphasize quantitative information such as figures, data, and KPIs
3. Clearly distinguish risks, opportunities, and recommendations
4. Prioritize the key information needed for decision-making
5. Use concise, action-oriented language

**Elements to Include**:
- Executive Summary
- Key findings and insights
- Business impact analysis
- Recommended action items
- Risks and considerations

**Business Perspective**:
- Prioritize information related to ROI, costs, and profitability
- Market trends and competitiveness analysis
- Operational efficiency improvement points`);

        // Legal document summarization
        this.systemPrompts.set('legal_korean', `You are an expert legal document summarizer. Summarize the key content while maintaining legal accuracy, and always respond in English:

**Legal Summarization Principles**:
1. Legal accuracy and completeness come first
2. Specify the key legal issues and the supporting provisions
3. Clearly distinguish rights, obligations, and liability relationships
4. Use legal terms accurately and explain them when necessary
5. Never omit important dates, deadlines, or conditions

**Structural Elements**:
- Key legal issues
- Relevant statutes and grounds
- Rights and obligations between the parties
- Important conditions and restrictions
- Legal risks and cautions

**Cautions**:
- Avoid content that amounts to legal interpretation or advice
- Distinguish between facts and legal judgments
- Note when professional legal consultation is needed`);

        // News article summarization
        this.systemPrompts.set('news_korean', `You are an expert news article summarizer. Write summaries that let readers quickly grasp the key information, and always respond in English:

**News Summarization Principles**:
1. Structure around the 5W1H (who, when, where, what, why, how)
2. Prioritize information by recency and importance
3. Maintain an objective and balanced perspective
4. Include key quotes or statements
5. Arrange information chronologically or by importance

**Elements to Include**:
- Summary of the key event/issue
- Main parties involved and their statements
- Background information and context
- Future outlook and impact
- Related data and figures

**News Values**:
- Timeliness, proximity, significance
- Human interest and social impact
- Consider readers' interest and comprehension`);
    }

    /**
     * Initialize user prompt templates
     */
    initializeUserPrompts() {
        // Standard summarization prompt
        this.userPrompts.set('standard', (text, mode, options = {}) => {
            return `Please summarize the following text in ${mode} mode. Respond in English.

**Summary Mode**: ${mode}
**Requirements**: ${this.getModeDescription(mode)}

---

${text}

---

Please summarize the content above according to the specified format.`;
        });

        // Structured summarization prompt
        this.userPrompts.set('structured', (text, mode, options = {}) => {
            const sections = options.sections || ['Main Content', 'Key Points', 'Conclusion'];
            return `Please write a structured summary of the following text in ${mode} mode. Respond in English.

**Summary Structure**:
${sections.map(section => `- ${section}`).join('\n')}

**Summary Mode**: ${mode}
**Detail Level**: ${this.getModeDescription(mode)}

---

${text}

---

Please follow the specified structure and clearly separate each section in your summary.`;
        });

        // Comparative summarization prompt
        this.userPrompts.set('comparative', (text, mode, options = {}) => {
            return `Please summarize the following text in ${mode} mode from a comparative analysis perspective. Respond in English.

**Analysis Perspective**:
- Key differences and commonalities
- Comparison of pros and cons
- Relative importance
- Conclusions and recommendations

**Text**:
${text}

---

Please write a structured summary centered on the elements that can be compared and analyzed.`;
        });

        // Timeline-based summarization prompt
        this.userPrompts.set('timeline', (text, mode, options = {}) => {
            return `Please summarize the following text in ${mode} mode in chronological order. Respond in English.

**Chronological Summary Requirements**:
- The temporal flow of major events/changes
- Key content at each point in time
- Cause-and-effect relationships
- Current situation and future outlook

**Text**:
${text}

---

Please make the chronological flow clear and summarize the key content of each stage.`;
        });
    }

    /**
     * Initialize domain-specific prompts
     */
    initializeDomainPrompts() {
        // Technology/IT domain
        this.domainPrompts.set('technology', {
            systemAddition: `
**Technical Document Guidelines**:
- Maintain technical accuracy and currency
- Explain complex technical concepts clearly
- Practical applications and implementation feasibility
- Analyze technology trends and future directions
- Considerations such as compatibility, scalability, and security`,

            userAddition: `
**Technical Summary Perspective**:
- Core technologies and innovations
- Technical advantages and limitations
- Implementation complexity and cost
- Differentiation from existing technologies
- Future development potential`
        });

        // Healthcare/Medical domain
        this.domainPrompts.set('medical', {
            systemAddition: `
**Medical Document Guidelines**:
- Medical accuracy and rigor come first
- Patient safety and ethical considerations
- Focus on evidence-based medical information
- Explain complex medical terminology appropriately
- Clearly distinguish diagnosis, treatment, and prognosis information`,

            userAddition: `
**Medical Summary Perspective**:
- Key medical findings and their significance
- Impact on patients
- Treatment options and recommendations
- Side effects and risk factors
- Need for further research`
        });

        // Financial/Economic domain
        this.domainPrompts.set('finance', {
            systemAddition: `
**Financial Document Guidelines**:
- Present accurate figures and financial indicators
- Specify risks and elements of uncertainty
- Consider market trends and economic context
- Analyze the impact of regulatory and policy changes
- Prioritize information relevant to investment decisions`,

            userAddition: `
**Financial Summary Perspective**:
- Key financial performance and indicators
- Market opportunities and risk factors
- Investment recommendations and rationale
- Impact of regulatory environment changes
- Future outlook and scenarios`
        });
    }

    /**
     * Initialize chain-of-thought prompts
     */
    initializeChainOfThoughtPrompts() {
        this.chainOfThoughtPrompts.set('analytical', (text, mode) => {
            return `Please summarize the following text in ${mode} mode, going through a step-by-step analysis process. Respond in English:

**Step 1: Text Structure Analysis**
- Identify main sections and arguments
- Distinguish core topics and subtopics
- Grasp the logical flow

**Step 2: Importance Evaluation**
- Rank each piece of content by importance
- Distinguish key messages from supporting information
- Identify secondary content that can be removed

**Step 3: Summary Composition**
- Reorganize the selected key content
- Arrange according to logical flow
- Compress to an appropriate length

**Text**:
${text}

---

Please go through the steps above and write the summary systematically.`;
        });

        this.chainOfThoughtPrompts.set('critical', (text, mode) => {
            return `Please summarize the following text in ${mode} mode, applying a critical thinking process. Respond in English:

**Critical Analysis Steps**:
1. **Distinguish Facts from Opinions**: Identify objective facts versus subjective opinions
2. **Verify Logic**: Evaluate the validity of arguments and the sufficiency of evidence
3. **Multiple Perspectives**: Consider possible interpretations from various viewpoints
4. **Recognize Limitations**: Identify the text's limitations or biases
5. **Core Value**: Select the most important and reliable information

**Text**:
${text}

---

Please write a reliable and balanced summary through critical analysis.`;
        });
    }

    /**
     * Get mode description
     */
    getModeDescription(mode) {
        const descriptions = {
            brief: 'Key points only, briefly (about 10% of the original)',
            standard: 'Main content in a balanced way (about 20% of the original)',
            detailed: 'Including detailed content (about 30% of the original)'
        };
        return descriptions[mode] || descriptions.standard;
    }

    /**
     * Generate system prompt
     */
    generateSystemPrompt(options = {}) {
        const {
            type = 'basic',
            domain = null,
            language = this.config.language,
            style = this.config.defaultStyle
        } = options;

        let basePrompt = this.systemPrompts.get(`${type}_${language}`) ||
                        this.systemPrompts.get(`basic_${language}`) ||
                        this.systemPrompts.get('basic_korean');

        // Add domain-specific additions
        if (domain && this.domainPrompts.has(domain)) {
            const domainPrompt = this.domainPrompts.get(domain);
            basePrompt += '\n\n' + domainPrompt.systemAddition;
        }

        // Add style modifications
        if (style === 'formal') {
            basePrompt += '\n\n**Style**: Write in a formal and professional tone';
        } else if (style === 'casual') {
            basePrompt += '\n\n**Style**: Write in a friendly and easy-to-understand tone';
        }

        return basePrompt;
    }

    /**
     * Generate user prompt
     */
    generateUserPrompt(text, options = {}) {
        const {
            mode = 'standard',
            type = 'standard',
            domain = null,
            chainOfThought = false,
            customInstructions = ''
        } = options;

        let promptGenerator;

        // Use chain-of-thought if requested
        if (chainOfThought) {
            const cotType = typeof chainOfThought === 'string' ? chainOfThought : 'analytical';
            promptGenerator = this.chainOfThoughtPrompts.get(cotType);
            if (promptGenerator) {
                return promptGenerator(text, mode);
            }
        }

        // Use standard prompt generator
        promptGenerator = this.userPrompts.get(type) || this.userPrompts.get('standard');
        let prompt = promptGenerator(text, mode, options);

        // Add domain-specific user additions
        if (domain && this.domainPrompts.has(domain)) {
            const domainPrompt = this.domainPrompts.get(domain);
            prompt += '\n\n' + domainPrompt.userAddition;
        }

        // Add custom instructions
        if (customInstructions) {
            prompt += '\n\n**Additional Requirements**:\n' + customInstructions;
        }

        return prompt;
    }

    /**
     * Get available templates
     */
    getAvailableTemplates() {
        return {
            systemPrompts: Array.from(this.systemPrompts.keys()),
            userPrompts: Array.from(this.userPrompts.keys()),
            domainPrompts: Array.from(this.domainPrompts.keys()),
            chainOfThoughtPrompts: Array.from(this.chainOfThoughtPrompts.keys())
        };
    }

    /**
     * Add custom prompt template
     */
    addCustomTemplate(category, name, template) {
        const templateMap = {
            system: this.systemPrompts,
            user: this.userPrompts,
            domain: this.domainPrompts,
            cot: this.chainOfThoughtPrompts
        };

        if (templateMap[category]) {
            templateMap[category].set(name, template);
            return true;
        }
        return false;
    }

    /**
     * Generate complete prompt set
     */
    generatePromptSet(text, options = {}) {
        const systemPrompt = this.generateSystemPrompt(options);
        const userPrompt = this.generateUserPrompt(text, options);

        return {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            metadata: {
                type: options.type || 'standard',
                mode: options.mode || 'standard',
                domain: options.domain || null,
                chainOfThought: options.chainOfThought || false,
                language: options.language || this.config.language,
                style: options.style || this.config.defaultStyle
            }
        };
    }

    /**
     * Optimize prompt for specific model
     */
    optimizeForModel(promptSet, modelName = 'deepseek') {
        // DeepSeek specific optimizations
        if (modelName.includes('deepseek')) {
            // DeepSeek responds well to structured instructions
            promptSet.messages[0].content = promptSet.messages[0].content
                .replace(/\*\*(.*?)\*\*/g, '【$1】'); // Use different emphasis markers

            // Add model-specific instructions
            promptSet.messages[0].content += '\n\n【Important】: Be sure to follow the specified format exactly, and write a summary that is both concise and comprehensive. Respond in English.';
        }

        return promptSet;
    }

    /**
     * A/B test different prompt variations
     */
    generateVariations(text, options = {}, variationCount = 2) {
        const variations = [];
        const baseOptions = { ...options };

        for (let i = 0; i < variationCount; i++) {
            const variantOptions = { ...baseOptions };

            // Create variations by modifying parameters
            if (i === 1) {
                variantOptions.chainOfThought = 'analytical';
            } else if (i === 2) {
                variantOptions.type = 'structured';
            }

            const promptSet = this.generatePromptSet(text, variantOptions);
            variations.push({
                id: `variant_${i + 1}`,
                promptSet: promptSet,
                options: variantOptions
            });
        }

        return variations;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptTemplates;
} else if (typeof window !== 'undefined') {
    window.PromptTemplates = PromptTemplates;
}
