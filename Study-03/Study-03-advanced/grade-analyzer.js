#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'student_data.json');

if (!fs.existsSync(dataPath)) {
    console.log('⚠️ Student data file not found. Run student-data-generator.js first.');
    process.exit(1);
}

const students = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('📊 Grade Analysis Report');
console.log('='.repeat(60));

// Overall statistics
const totalStudents = students.length;
const avgScore = students.reduce((sum, s) => sum + s.averageScore, 0) / totalStudents;

console.log('\n📈 Overall Statistics');
console.log(`  • Total students: ${totalStudents}`);
console.log(`  • Overall average score: ${avgScore.toFixed(1)} pts`);

// Grade distribution (relative ranking)
const gradeDistribution = { A: 0, B: 0, C: 0, D: 0 };
students.forEach(s => {
    if (s.grade && s.grade !== 'F') {
        gradeDistribution[s.grade]++;
    }
});

console.log('\n📊 Grade Distribution (Relative Ranking)');
const gradeInfo = {
    A: 'Top 20%',
    B: 'Top 21-40%',
    C: 'Top 41-70%',
    D: 'Bottom 30%'
};

Object.entries(gradeDistribution).forEach(([grade, count]) => {
    const percentage = (count / totalStudents * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(percentage / 2));
    console.log(`  ${grade} (${gradeInfo[grade]}): ${bar} ${count} students (${percentage}%)`);
});

// Per-class averages
const classStat = {};
students.forEach(s => {
    if (!classStat[s.class]) {
        classStat[s.class] = { total: 0, count: 0 };
    }
    classStat[s.class].total += s.averageScore;
    classStat[s.class].count++;
});

console.log('\n🏫 Average Score by Class');
Object.entries(classStat).forEach(([className, stat]) => {
    const classAvg = (stat.total / stat.count).toFixed(1);
    console.log(`  ${className}: ${classAvg} pts (${stat.count} students)`);
});

// Per-category averages
const categoryStats = {};
students.forEach(student => {
    student.quizHistory.forEach(quiz => {
        Object.entries(quiz.categoryScores).forEach(([cat, score]) => {
            if (!categoryStats[cat]) {
                categoryStats[cat] = { total: 0, count: 0 };
            }
            categoryStats[cat].total += score.percentage;
            categoryStats[cat].count++;
        });
    });
});

console.log('\n📚 Average Accuracy by Category');
Object.entries(categoryStats).forEach(([cat, stat]) => {
    const catAvg = (stat.total / stat.count).toFixed(1);
    const bar = '▪'.repeat(Math.floor(catAvg / 5));
    console.log(`  ${cat}: ${bar} ${catAvg}%`);
});

// Top / bottom students
const sortedStudents = [...students].sort((a, b) => b.averageScore - a.averageScore);

console.log('\n🏆 Top 5 Students');
sortedStudents.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} (${s.class}): ${s.averageScore} pts [${s.grade}]`);
});

console.log('\n📌 Bottom 5 Students (need improvement)');
sortedStudents.slice(-5).reverse().forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} (${s.class}): ${s.averageScore} pts [${s.grade}]`);
});

console.log('\n' + '='.repeat(60));