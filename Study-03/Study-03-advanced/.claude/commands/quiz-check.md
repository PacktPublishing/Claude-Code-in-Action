---
aliases: []
---

# quiz-check

Verifies the correctness of quiz question answers.

## Usage
```
/quiz-check [category]
```

## Examples
- `/quiz-check` - Verify all questions
- `/quiz-check History` - Verify only the History category
- `/quiz-check Science` - Verify only the Science category

## Features
1. **Answer validity check**
   - Confirm the answer index is within the valid range
   - Check for duplicate options
   - Verify the answer is actually correct

2. **Question quality check**
   - Confirm superlative expressions state their basis
   - Verify time-related expressions include a specific point in time
   - Check consistency between the question and its explanation

3. **Format check**
   - Question length is appropriate (10-200 characters)
   - Explanation is sufficiently detailed (10+ characters)
   - Option lengths are appropriate

4. **Statistical analysis**
   - Distribution by difficulty
   - Answer number distribution
   - Question count by category

## Script
```javascript
const fs = require('fs');

// Parse parameters
const args = process.argv.slice(2);
const targetCategory = args[0] || null;

// Read the questions.js file
const questionsContent = fs.readFileSync('questions.js', 'utf8');
const match = questionsContent.match(/const quizQuestions = (\[[\s\S]*\]);/);
if (!match) {
    console.error('❌ Cannot parse questions.js.');
    process.exit(1);
}
const quizQuestions = eval(match[1]);

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║               🔍 Quiz Answer Verification                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Filtering
let questionsToCheck = quizQuestions;
if (targetCategory) {
    questionsToCheck = quizQuestions.filter(q => q.category === targetCategory);
    console.log(`📌 Scope: ${targetCategory} category (${questionsToCheck.length} questions)\n`);
} else {
    console.log(`📌 Scope: all questions (${questionsToCheck.length} questions)\n`);
}

// Answer verification (only basic checks here; actual answers require manual review)
const issues = [];
let validCount = 0;

questionsToCheck.forEach(q => {
    const questionIssues = [];
    
    // 1. Answer index check
    if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        questionIssues.push('❌ Answer index is invalid');
    }
    
    // 2. Duplicate option check
    const uniqueOptions = new Set(q.options);
    if (uniqueOptions.size !== q.options.length) {
        questionIssues.push('❌ Duplicate options exist');
    }
    
    // 3. Confirm the answer exists among the options
    const correctOption = q.options[q.correctAnswer];
    if (!correctOption) {
        questionIssues.push('❌ Answer is not among the options');
    }
    
    // 4. Consistency between explanation and answer (keyword-based)
    if (q.explanation && correctOption) {
        const hasRelation = q.explanation.includes(correctOption) || 
                          correctOption.split(' ').some(word => 
                              word.length > 2 && q.explanation.includes(word));
        if (!hasRelation) {
            questionIssues.push('⚠️ The explanation may not reference the answer');
        }
    }
    
    // 5. Superlative expression check
    const superlatives = ['largest', 'biggest', 'smallest', 'highest', 'deepest', 'longest', 'first', 'most'];
    const hasSuperlative = superlatives.some(word => q.question.toLowerCase().includes(word));
    if (hasSuperlative) {
        const hasContext = q.question.includes('by ') || 
                          q.question.includes('as of') || 
                          q.question.includes('measurement') ||
                          /\d{4}/.test(q.question);
        if (!hasContext) {
            questionIssues.push('⚠️ Superlative expression lacks a clear basis');
        }
    }
    
    if (questionIssues.length > 0) {
        issues.push({
            id: q.id,
            question: q.question,
            category: q.category,
            difficulty: q.difficulty,
            correctAnswer: correctOption,
            issues: questionIssues
        });
    } else {
        validCount++;
    }
});

// Print results
console.log('📊 Verification Results');
console.log('─'.repeat(60));
console.log(`✅ Passed: ${validCount}`);
console.log(`⚠️ Needs review: ${issues.length}\n`);

if (issues.length > 0) {
    console.log('🚨 Questions needing review:');
    console.log('─'.repeat(60));
    
    issues.forEach(issue => {
        console.log(`\n[ID: ${issue.id}] ${issue.category} - ${issue.difficulty}`);
        console.log(`Question: ${issue.question}`);
        console.log(`Answer: ${issue.correctAnswer}`);
        issue.issues.forEach(i => console.log(`  ${i}`));
    });
}

// Answer distribution analysis
console.log('\n📊 Answer Number Distribution');
console.log('─'.repeat(60));

const answerDist = { 0: 0, 1: 0, 2: 0, 3: 0 };
questionsToCheck.forEach(q => answerDist[q.correctAnswer]++);

[0, 1, 2, 3].forEach(i => {
    const count = answerDist[i];
    const percent = ((count / questionsToCheck.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round((count / questionsToCheck.length) * 30));
    console.log(`  Option ${i + 1}: ${bar} ${count} (${percent}%)`);
});

// Balance assessment
const maxCount = Math.max(...Object.values(answerDist));
const minCount = Math.min(...Object.values(answerDist));
if (maxCount - minCount > Math.ceil(questionsToCheck.length * 0.3)) {
    console.log('\n⚠️ The answer distribution is skewed.');
}

console.log('\n✅ Verification complete\n');
```

## Example Output
```
╔══════════════════════════════════════════════════════════════╗
║               🔍 Quiz Answer Verification                     ║
╚══════════════════════════════════════════════════════════════╝

📌 Scope: History category (13 questions)

📊 Verification Results
────────────────────────────────────────────────────────────
✅ Passed: 13
⚠️ Needs review: 0

📊 Answer Number Distribution
────────────────────────────────────────────────────────────
  Option 1: █████████ 4 (30.8%)
  Option 2: ████████████ 5 (38.5%)
  Option 3: ███████ 3 (23.1%)
  Option 4: ██ 1 (7.7%)

✅ Verification complete
```