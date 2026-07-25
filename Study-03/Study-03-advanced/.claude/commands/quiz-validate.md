```js
// Quiz Validation Tool
// Usage: /quiz-validate [category]
// If a category is given, validate only that category; otherwise validate all questions

const fs = require('fs');
const path = require('path');

// Read the questions.js file
const questionsPath = path.join(process.cwd(), 'questions.js');
let questionsContent = '';

try {
    questionsContent = fs.readFileSync(questionsPath, 'utf8');
} catch (error) {
    console.error('Cannot read questions.js:', error.message);
    process.exit(1);
}

// Handle the category parameter
const category = '$ARGUMENTS'.trim();
const validateCategory = category || null;

// Ambiguous expression patterns
const ambiguousPatterns = [
    { pattern: /\bmost\b/gi, description: 'superlative expression', suggestions: ['State the measurement basis (e.g., by area, by population)'] },
    { pattern: /\bfirst\b/gi, description: 'temporal priority', suggestions: ['State the point in time (e.g., as of 2024)', 'State the geographic scope'] },
    { pattern: /\blargest\b/gi, description: 'maximum size', suggestions: ['State the unit of measurement', 'State the reference date'] },
    { pattern: /\bhighest\b/gi, description: 'highest level', suggestions: ['State the evaluation basis (e.g., authority, size, rank)'] },
    { pattern: /\bsmallest\b/gi, description: 'minimum size', suggestions: ['State the unit of measurement', 'State the scope of inclusion'] },
    { pattern: /\bgreatest\b/gi, description: 'greatest amount', suggestions: ['State the counting basis', 'State the point in time'] },
    { pattern: /\blongest\b/gi, description: 'greatest length', suggestions: ['State the measurement method', 'State the segment basis'] },
    { pattern: /\bshortest\b/gi, description: 'shortest length', suggestions: ['State the measurement method', 'State the conditions'] },
    { pattern: /\bbiggest\b/gi, description: 'size superlative', suggestions: ['State the size basis (e.g., area, volume, weight)'] },
    { pattern: /\btallest\b/gi, description: 'height superlative', suggestions: ['State the measurement basis (e.g., above sea level, from the ground)'] },
    { pattern: /\bdeepest\b/gi, description: 'depth superlative', suggestions: ['State the measurement basis (e.g., maximum depth, average depth)'] },
    { pattern: /\boldest\b/gi, description: 'age superlative', suggestions: ['State the dating basis', 'State the point in time'] },
    { pattern: /\bfastest\b/gi, description: 'speed superlative', suggestions: ['State the measurement basis (e.g., top speed, average speed)'] }
];

// Extract the questions array
let questions;
try {
    eval(questionsContent);
} catch (error) {
    console.error('Failed to parse questions.js:', error.message);
    process.exit(1);
}

// Store validation results
const validationResults = [];
let totalQuestions = 0;
let problematicQuestions = 0;

// Validate all questions or a single category
questions.forEach((q, index) => {
    // Category filtering
    if (validateCategory && q.category !== validateCategory) {
        return;
    }
    
    totalQuestions++;
    const lineNumber = questionsContent.split(q.question)[0].split('\n').length;
    const issues = [];
    
    // Check each pattern
    ambiguousPatterns.forEach(({ pattern, description, suggestions }) => {
        if (pattern.test(q.question)) {
            // Check whether a basis is already stated
            const hasCriteria = /\([^)]*by[^)]*\)/i.test(q.question) || 
                               /\([^)]*measurement[^)]*\)/i.test(q.question) ||
                               /\b\d{4}\b/.test(q.question);
            
            if (!hasCriteria) {
                issues.push({
                    type: description,
                    match: q.question.match(pattern)[0],
                    suggestions: suggestions
                });
            }
        }
    });
    
    if (issues.length > 0) {
        problematicQuestions++;
        validationResults.push({
            lineNumber: lineNumber,
            category: q.category,
            question: q.question,
            answer: q.answer,
            issues: issues
        });
    }
});

// Generate the report
console.log('# Quiz Question Validation Report\n');
console.log(`## Scope: ${validateCategory || 'all categories'}`);
console.log(`## Date: ${new Date().toISOString().split('T')[0]}\n`);

console.log('## 📊 Validation Statistics');
console.log(`- Questions checked: ${totalQuestions}`);
console.log(`- Questions needing revision: ${problematicQuestions} (${(problematicQuestions/totalQuestions*100).toFixed(1)}%)`);
console.log(`- Valid questions: ${totalQuestions - problematicQuestions}\n`);

if (validationResults.length > 0) {
    console.log('## ⚠️ Questions That Need a Stated Basis\n');
    
    validationResults.forEach((result, idx) => {
        console.log(`### ${idx + 1}. [${result.category}] ${result.question}`);
        console.log(`📍 Location: line ${result.lineNumber}`);
        console.log(`✅ Answer: ${result.answer}\n`);
        
        console.log('**Issues found:**');
        result.issues.forEach(issue => {
            console.log(`- "${issue.match}" - ${issue.type}`);
        });
        
        console.log('\n**Recommended fixes:**');
        const allSuggestions = [...new Set(result.issues.flatMap(i => i.suggestions))];
        allSuggestions.forEach(suggestion => {
            console.log(`- ${suggestion}`);
        });
        
        // Provide a revision example
        console.log('\n**Revision example:**');
        let modifiedQuestion = result.question;
        
        // Apply common revision patterns
        if (/largest|biggest/i.test(modifiedQuestion) && !/\(.*\)/.test(modifiedQuestion)) {
            modifiedQuestion += ' (by area)';
        } else if (/tallest|highest/i.test(modifiedQuestion) && !/\(.*\)/.test(modifiedQuestion)) {
            modifiedQuestion += ' (by elevation above sea level)';
        } else if (/deepest/i.test(modifiedQuestion) && !/\(.*\)/.test(modifiedQuestion)) {
            modifiedQuestion += ' (by maximum depth)';
        } else if (/most|greatest/i.test(modifiedQuestion) && !/\(.*\)/.test(modifiedQuestion)) {
            modifiedQuestion += ' (by volume)';
        } else if (/first/i.test(modifiedQuestion) && !/\(.*\)/.test(modifiedQuestion)) {
            modifiedQuestion += ' (in recorded history)';
        }
        
        console.log(`"${modifiedQuestion}"\n`);
        console.log('---\n');
    });
} else {
    console.log('## ✅ Validation Result\n');
    console.log('All questions have a clearly stated basis! 🎉\n');
}

console.log('## Validation Criteria\n');
console.log('Questions containing the following expressions were checked:');
console.log('- Superlative expressions: most, first, largest, highest, smallest, greatest, longest, shortest');
console.log('- Ambiguous comparisons: biggest, tallest, deepest, oldest, fastest\n');

console.log('---');
console.log('*This report follows the quiz question validation guidelines in CLAUDE.md.*');
```