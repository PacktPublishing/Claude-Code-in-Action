// Quiz validation script
const fs = require('fs');
const questionsContent = fs.readFileSync('questions.js', 'utf8');

// Extract quizQuestions from the file content
const quizQuestions = eval(questionsContent + '; quizQuestions');

console.log('📋 Quiz data validation results');
console.log('========================');
console.log('✅ Total questions:', quizQuestions.length);

// Tally by category
const categories = {};
quizQuestions.forEach(q => {
    if (!categories[q.category]) categories[q.category] = 0;
    categories[q.category]++;
});

console.log('\n📂 Questions per category:');
Object.entries(categories).forEach(([cat, count]) => {
    console.log('  -', cat + ':', count + ' questions');
});

// Duplicate ID check
const ids = quizQuestions.map(q => q.id);
const duplicateIds = ids.filter((id, idx) => ids.indexOf(id) !== idx);
if (duplicateIds.length > 0) {
    console.log('\n⚠️ Duplicate IDs found:', duplicateIds);
} else {
    console.log('\n✅ No duplicate IDs');
}

// Answer range check
const invalidAnswers = quizQuestions.filter(q =>
    q.correctAnswer < 0 || q.correctAnswer >= q.options.length
);
if (invalidAnswers.length > 0) {
    console.log('\n⚠️ Invalid answer indexes:', invalidAnswers.map(q => q.id));
} else {
    console.log('✅ All answer indexes are valid');
}

// Tally by difficulty
const difficulties = {easy: 0, medium: 0, hard: 0};
quizQuestions.forEach(q => {
    if (difficulties.hasOwnProperty(q.difficulty)) {
        difficulties[q.difficulty]++;
    }
});

console.log('\n📊 Questions per difficulty:');
Object.entries(difficulties).forEach(([diff, count]) => {
    const label = diff === 'easy' ? 'Easy' : diff === 'medium' ? 'Medium' : 'Hard';
    console.log('  -', label + ':', count + ' questions');
});