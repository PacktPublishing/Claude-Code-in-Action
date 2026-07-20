#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of student names
const studentNames = [
    "Ethan Miller", "Olivia Smith", "Liam Johnson", "Sophia Brown", "Emma Davis",
    "Noah Wilson", "Ava Moore", "Mason Taylor", "Isabella Clark", "Lucas Anderson",
    "Mia Thomas", "James White", "Charlotte Harris", "Benjamin Martin", "Amelia Lewis",
    "Henry Walker", "Harper Hall", "Daniel Young", "Grace King", "Chloe Wright"
];

// Generate grade data
function generateStudentData() {
    const students = [];

    studentNames.forEach((name, index) => {
        const student = {
            id: `STU${String(index + 1).padStart(3, '0')}`,
            name: name,
            class: "Class " + (Math.floor(index / 5) + 1),
            quizHistory: []
        };

        // Generate 5-10 quiz records per student
        const quizCount = Math.floor(Math.random() * 6) + 5;

        for (let i = 0; i < quizCount; i++) {
            const quizDate = new Date();
            quizDate.setDate(quizDate.getDate() - (quizCount - i) * 2);

            const totalQuestions = 10;
            const correctAnswers = Math.floor(Math.random() * (totalQuestions - 2)) + 3;

            const categories = ["History", "World Geography", "Science", "Arts & Culture"];
            const categoryScores = {};

            categories.forEach(cat => {
                const catQuestions = Math.floor(totalQuestions / categories.length);
                const catCorrect = Math.floor(Math.random() * (catQuestions + 1));
                categoryScores[cat] = {
                    total: catQuestions,
                    correct: catCorrect,
                    percentage: Math.round((catCorrect / catQuestions) * 100)
                };
            });

            student.quizHistory.push({
                date: quizDate.toISOString().split('T')[0],
                totalQuestions: totalQuestions,
                correctAnswers: correctAnswers,
                score: Math.round((correctAnswers / totalQuestions) * 100),
                timeSpent: Math.floor(Math.random() * 600) + 300,
                categoryScores: categoryScores,
                difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)]
            });
        }

        // Calculate the average score
        const avgScore = Math.round(
            student.quizHistory.reduce((sum, quiz) => sum + quiz.score, 0) / student.quizHistory.length
        );
        student.averageScore = avgScore;

        // Grades are assigned later by relative ranking
        student.grade = "TBD"; // To Be Determined

        students.push(student);
    });

    // Assign grades by relative ranking
    students.sort((a, b) => b.averageScore - a.averageScore);

    const totalStudents = students.length;
    students.forEach((student, index) => {
        const percentRank = ((index + 1) / totalStudents) * 100;

        if (percentRank <= 20) {
            student.grade = "A"; // Top 20%
        } else if (percentRank <= 40) {
            student.grade = "B"; // Top 21-40%
        } else if (percentRank <= 70) {
            student.grade = "C"; // Top 41-70%
        } else {
            student.grade = "D"; // Bottom 30%
        }
    });

    return students;
}

// Run
console.log('📚 Generating student data...\n');

const studentData = generateStudentData();
const dataPath = path.join(process.cwd(), 'student_data.json');

fs.writeFileSync(dataPath, JSON.stringify(studentData, null, 2));

console.log('✅ Student data generated');
console.log(`📊 Generated data for ${studentData.length} students`);
console.log(`💾 Saved to: ${dataPath}\n`);

// Print the grade distribution (relative ranking)
const gradeCount = { A: 0, B: 0, C: 0, D: 0 };
studentData.forEach(s => gradeCount[s.grade]++);

console.log('📈 Grade distribution (relative ranking):');
console.log(`  Grade A (top 20%): ${gradeCount.A} students`);
console.log(`  Grade B (top 21-40%): ${gradeCount.B} students`);
console.log(`  Grade C (top 41-70%): ${gradeCount.C} students`);
console.log(`  Grade D (bottom 30%): ${gradeCount.D} students`);

module.exports = { generateStudentData };