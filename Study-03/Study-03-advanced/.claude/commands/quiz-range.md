```js
// Quiz Range Analyzer
// Usage: /quiz-range [startId] [endId]
// Example: /quiz-range 1 10

const fs = require('fs');
const path = require('path');

// Parse parameters
const args = process.argv.slice(2);
const startId = parseInt(args[0]) || 1;
const endId = parseInt(args[1]) || startId + 9;

// Read the questions.js file
const questionsPath = path.join(process.cwd(), 'questions.js');
let questionsContent = '';

try {
    questionsContent = fs.readFileSync(questionsPath, 'utf8');
} catch (error) {
    console.error('❌ Cannot read questions.js:', error.message);
    process.exit(1);
}

// Extract the questions array
let quizQuestions;
try {
    eval(questionsContent);
} catch (error) {
    console.error('❌ Failed to parse questions.js:', error.message);
    process.exit(1);
}

// Filter questions in the given range
const rangeQuestions = quizQuestions.filter(q => q.id >= startId && q.id <= endId);

if (rangeQuestions.length === 0) {
    console.error(`❌ No questions found in the range ${startId} to ${endId}.`);
    console.log(`   Full question range: 1 to ${quizQuestions.length}`);
    process.exit(1);
}

// Calculate statistics
const stats = {
    total: rangeQuestions.length,
    byCategory: {},
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    answerDistribution: { 0: 0, 1: 0, 2: 0, 3: 0 },
    averageExplanationLength: 0
};

// Analyze each question
rangeQuestions.forEach(q => {
    // Aggregate by category
    if (!stats.byCategory[q.category]) {
        stats.byCategory[q.category] = {
            count: 0,
            difficulty: { easy: 0, medium: 0, hard: 0 },
            answers: { 0: 0, 1: 0, 2: 0, 3: 0 }
        };
    }
    stats.byCategory[q.category].count++;
    stats.byCategory[q.category].difficulty[q.difficulty]++;
    stats.byCategory[q.category].answers[q.correctAnswer]++;
    
    // Aggregate overall difficulty
    stats.byDifficulty[q.difficulty]++;
    
    // Aggregate answer distribution
    stats.answerDistribution[q.correctAnswer]++;
    
    // Average explanation length
    stats.averageExplanationLength += q.explanation.length;
});

stats.averageExplanationLength = Math.round(stats.averageExplanationLength / stats.total);

// Print the report
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log(`║               📊 Quiz Range Analysis Report                   ║`);
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log(`📌 Analysis range: ${startId} to ${endId} (${stats.total} questions)\n`);

// Per-category analysis
console.log('## 📚 Distribution by Category');
console.log('┌─────────────────┬──────┬──────────────────────────────────┐');
console.log('│ Category        │Count │ Difficulty distribution          │');
console.log('├─────────────────┼──────┼──────────────────────────────────┤');

Object.entries(stats.byCategory).forEach(([category, data]) => {
    const diffStr = `easy:${data.difficulty.easy} medium:${data.difficulty.medium} hard:${data.difficulty.hard}`;
    console.log(`│ ${category.padEnd(15)} │ ${String(data.count).padStart(4)} │ ${diffStr.padEnd(32)} │`);
});
console.log('└─────────────────┴──────┴──────────────────────────────────┘\n');

// Overall difficulty distribution
console.log('## 🎯 Overall Difficulty Distribution');
const maxDiff = Math.max(...Object.values(stats.byDifficulty));
['easy', 'medium', 'hard'].forEach(level => {
    const count = stats.byDifficulty[level];
    const percent = (count / stats.total * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / maxDiff * 30));
    const label = level === 'easy' ? 'Easy  ' : level === 'medium' ? 'Medium' : 'Hard  ';
    console.log(`  ${label}: ${bar} ${count} (${percent}%)`);
});
console.log();

// Answer distribution analysis
console.log('## 🎲 Answer Option Distribution');
const optionLabels = ['First', 'Second', 'Third', 'Fourth'];
const maxAnswer = Math.max(...Object.values(stats.answerDistribution));

[0, 1, 2, 3].forEach(option => {
    const count = stats.answerDistribution[option];
    const percent = (count / stats.total * 100).toFixed(1);
    const bar = '▒'.repeat(Math.round(count / maxAnswer * 30));
    console.log(`  ${optionLabels[option]}: ${bar} ${count} (${percent}%)`);
});

// Balance assessment
console.log('\n## ⚖️ Balance Assessment');
const answerBalance = Object.values(stats.answerDistribution);
const maxAnswerCount = Math.max(...answerBalance);
const minAnswerCount = Math.min(...answerBalance);
const answerDiff = maxAnswerCount - minAnswerCount;

if (answerDiff <= 2) {
    console.log('✅ The answer distribution is balanced.');
} else if (answerDiff <= 4) {
    console.log('⚠️ The answer distribution is slightly skewed.');
} else {
    console.log('❌ The answer distribution is skewed. Adjustment may be needed.');
}

// Difficulty balance assessment
const difficultyValues = Object.values(stats.byDifficulty);
const maxDiffCount = Math.max(...difficultyValues);
const minDiffCount = Math.min(...difficultyValues.filter(v => v > 0));
const diffDiffRatio = minDiffCount ? maxDiffCount / minDiffCount : 999;

if (diffDiffRatio <= 2) {
    console.log('✅ The difficulty distribution is balanced.');
} else if (diffDiffRatio <= 3) {
    console.log('⚠️ The difficulty distribution is slightly skewed.');
} else {
    console.log('❌ The difficulty distribution is skewed. Adjustment may be needed.');
}

// Detailed question list
console.log('\n## 📝 Question List');
console.log('┌────┬─────────────────┬────────┬────────────────────────────────┬──────┐');
console.log('│ ID │ Category        │ Diff.  │ Question (first 30 chars)      │ Ans. │');
console.log('├────┼─────────────────┼────────┼────────────────────────────────┼──────┤');

rangeQuestions.forEach(q => {
    const questionPreview = q.question.length > 30 
        ? q.question.substring(0, 27) + '...' 
        : q.question.padEnd(30);
    const difficultyKor = q.difficulty === 'easy' ? 'Easy' : 
                          q.difficulty === 'medium' ? 'Medium' : 'Hard';
    
    console.log(`│ ${String(q.id).padStart(2)} │ ${q.category.padEnd(15)} │ ${difficultyKor.padEnd(6)} │ ${questionPreview} │  #${q.correctAnswer}  │`);
});
console.log('└────┴─────────────────┴────────┴────────────────────────────────┼──────┘');

// Additional statistics
console.log('\n## 📈 Additional Statistics');
console.log(`• Average explanation length: ${stats.averageExplanationLength} chars`);
console.log(`• Number of categories: ${Object.keys(stats.byCategory).length}`);

// Detailed answer distribution by category
if (Object.keys(stats.byCategory).length > 1) {
    console.log('\n## 🔍 Answer Distribution by Category');
    Object.entries(stats.byCategory).forEach(([category, data]) => {
        console.log(`\n[${category}]`);
        const answerStr = [0, 1, 2, 3].map(i => 
            `Option ${i+1}: ${data.answers[i]}`
        ).join(', ');
        console.log(`  Answer distribution: ${answerStr}`);
        
        // Per-category balance assessment
        const catAnswers = Object.values(data.answers);
        const catMaxAnswer = Math.max(...catAnswers);
        const catMinAnswer = Math.min(...catAnswers);
        
        if (catMaxAnswer - catMinAnswer > 2) {
            console.log(`  ⚠️ This category's answers are concentrated on certain options.`);
        }
    });
}

console.log('\n' + '═'.repeat(60));
console.log(`Analysis complete: ${new Date().toLocaleString('en-US')}`);
```