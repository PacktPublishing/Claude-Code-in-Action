#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'student_data.json');

if (!fs.existsSync(dataPath)) {
    console.log('⚠️ Student data file not found.');
    process.exit(1);
}

const allStudents = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const sorted = [...allStudents].sort((a, b) => b.averageScore - a.averageScore);
const studentsToCompare = [...sorted.slice(0, 3), ...sorted.slice(-3)];

console.log('👥 Student Grade Comparison');
console.log('='.repeat(80));

// Basic information
console.log('\n📋 Basic information');
console.log('─'.repeat(80));
console.log('Name       | Class | Avg Score | Grade | Quizzes');
console.log('─'.repeat(80));

studentsToCompare.forEach(student => {
    console.log(
        `${student.name.padEnd(10)} | ` +
        `${student.class.padEnd(5)} | ` +
        `${String(student.averageScore).padStart(8)} | ` +
        `${student.grade.padStart(4)} | ` +
        `${String(student.quizHistory.length).padStart(8)}`
    );
});

// Comparison by category
const categories = ["History", "World Geography", "Science", "Arts & Culture"];
console.log('\n📊 Average accuracy by category');
console.log('─'.repeat(80));
console.log('Name       | ' + categories.map(c => c.padEnd(10)).join(' | '));
console.log('─'.repeat(80));

studentsToCompare.forEach(student => {
    const categoryAvg = {};
    categories.forEach(cat => {
        let total = 0, count = 0;
        student.quizHistory.forEach(quiz => {
            if (quiz.categoryScores[cat]) {
                total += quiz.categoryScores[cat].percentage;
                count++;
            }
        });
        categoryAvg[cat] = count > 0 ? Math.round(total / count) : 0;
    });

    console.log(
        `${student.name.padEnd(10)} | ` +
        categories.map(cat => `${categoryAvg[cat]}%`.padEnd(10)).join(' | ')
    );
});

// Strength/weakness analysis
console.log('\n💡 Individual strengths and weaknesses');
console.log('─'.repeat(80));

studentsToCompare.forEach(student => {
    const categoryAvg = {};
    categories.forEach(cat => {
        let total = 0, count = 0;
        student.quizHistory.forEach(quiz => {
            if (quiz.categoryScores[cat]) {
                total += quiz.categoryScores[cat].percentage;
                count++;
            }
        });
        categoryAvg[cat] = count > 0 ? total / count : 0;
    });

    const sorted = Object.entries(categoryAvg).sort((a, b) => b[1] - a[1]);
    const strength = sorted[0][0];
    const weakness = sorted[sorted.length - 1][0];

    console.log(`${student.name.padEnd(10)} | Strength: ${strength} | Weakness: ${weakness}`);
});

console.log('\n' + '='.repeat(80));