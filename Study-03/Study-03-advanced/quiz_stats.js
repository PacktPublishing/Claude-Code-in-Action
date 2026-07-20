// Quiz statistics script
const fs = require('fs');
const questionsContent = fs.readFileSync('questions.js', 'utf8');

// Extract quizQuestions from the file content
const quizQuestions = eval(questionsContent + '; quizQuestions');

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                    📊 Quiz Statistics Analysis               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Overall statistics
console.log('📈 Overall statistics');
console.log('─────────────');
console.log(`Total questions: ${quizQuestions.length}`);

// Statistics by category
const categories = {};
quizQuestions.forEach(q => {
    if (!categories[q.category]) {
        categories[q.category] = {
            total: 0,
            easy: 0,
            medium: 0,
            hard: 0,
            answers: [0, 0, 0, 0]
        };
    }
    categories[q.category].total++;
    categories[q.category][q.difficulty]++;
    categories[q.category].answers[q.correctAnswer]++;
});

console.log('\n📚 Detailed statistics by category');
console.log('─────────────────────');
Object.entries(categories).forEach(([cat, stats]) => {
    console.log(`\n${cat} (${stats.total} questions)`);
    console.log(`  Difficulty: Easy ${stats.easy} | Medium ${stats.medium} | Hard ${stats.hard}`);

    // Answer distribution
    const answerDist = stats.answers.map((count, idx) =>
        `#${idx+1}: ${count} (${Math.round(count/stats.total*100)}%)`
    ).join(' | ');
    console.log(`  Answer distribution: ${answerDist}`);
});

// Overall answer distribution
const totalAnswerDist = [0, 0, 0, 0];
quizQuestions.forEach(q => {
    totalAnswerDist[q.correctAnswer]++;
});

console.log('\n📊 Overall answer distribution');
console.log('───────────────');
const maxCount = Math.max(...totalAnswerDist);
totalAnswerDist.forEach((count, idx) => {
    const percent = Math.round(count / quizQuestions.length * 100);
    const bar = '█'.repeat(Math.round(count / maxCount * 30));
    const spaces = ' '.repeat(30 - bar.length);
    console.log(`  #${idx+1}: ${bar}${spaces} ${count} (${percent}%)`);
});

// Balance assessment
const minCount = Math.min(...totalAnswerDist);
const diff = maxCount - minCount;

console.log('\n🎯 Balance assessment');
console.log('───────────');
if (diff <= 2) {
    console.log('✅ The answer distribution is very well balanced!');
} else if (diff <= 4) {
    console.log('✅ The answer distribution is fairly balanced.');
} else {
    console.log('⚠️  The answer distribution is skewed.');
    const lessUsed = totalAnswerDist
        .map((count, idx) => ({ idx: idx + 1, count }))
        .filter(item => item.count === minCount)
        .map(item => item.idx);
    console.log(`   Consider adding questions whose correct answer is option ${lessUsed.join(', ')}.`);
}

// Distribution by difficulty
const difficultyStats = { easy: 0, medium: 0, hard: 0 };
quizQuestions.forEach(q => {
    difficultyStats[q.difficulty]++;
});

console.log('\n📐 Difficulty distribution');
console.log('─────────────');
Object.entries(difficultyStats).forEach(([diff, count]) => {
    const percent = Math.round(count / quizQuestions.length * 100);
    const label = diff === 'easy' ? 'Easy  ' : diff === 'medium' ? 'Medium' : 'Hard  ';
    const bar = '█'.repeat(Math.round(count / Math.max(...Object.values(difficultyStats)) * 30));
    const spaces = ' '.repeat(30 - bar.length);
    console.log(`  ${label}: ${bar}${spaces} ${count} (${percent}%)`);
});

// Difficulty balance per category
console.log('\n🔄 Difficulty balance per category');
console.log('────────────────────────');
Object.entries(categories).forEach(([cat, stats]) => {
    const easyPercent = Math.round(stats.easy / stats.total * 100);
    const mediumPercent = Math.round(stats.medium / stats.total * 100);
    const hardPercent = Math.round(stats.hard / stats.total * 100);
    console.log(`  ${cat}: Easy ${easyPercent}% | Medium ${mediumPercent}% | Hard ${hardPercent}%`);
});

console.log('\n════════════════════════════════════════════════════════════════');