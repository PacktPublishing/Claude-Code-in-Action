// Script that adds a hard History question
const fs = require('fs');
const path = require('path');

// Read the questions.js file
const questionsPath = path.join(process.cwd(), 'questions.js');
const questionsContent = fs.readFileSync(questionsPath, 'utf8');

// Extract the questions array
let quizQuestions;
eval(questionsContent);

// New question to add (History, hard)
const newQuestion = {
    id: Math.max(...quizQuestions.map(q => q.id)) + 1,
    category: "History",
    difficulty: "hard",
    question: "Which of the following was NOT one of the Allied 'Big Three' leaders of World War II?",
    options: ["Winston Churchill", "Franklin D. Roosevelt", "Joseph Stalin", "Charles de Gaulle"],
    correctAnswer: 3,
    explanation: "The 'Big Three' were Churchill, Roosevelt, and Stalin. Charles de Gaulle led the Free French forces but was not part of the Big Three conferences."
};

// Add the new question to the existing set
quizQuestions.push(newQuestion);

// Group questions by category
const categorizedQuestions = {};
quizQuestions.forEach(q => {
    if (!categorizedQuestions[q.category]) {
        categorizedQuestions[q.category] = [];
    }
    categorizedQuestions[q.category].push(q);
});

// Rebuild the file content
let newContent = 'const quizQuestions = [\n';

Object.entries(categorizedQuestions).forEach(([cat, questions], catIdx) => {
    if (catIdx > 0) newContent += '\n';
    newContent += `    // ${cat} (${questions.length} questions)\n`;

    questions.forEach((q, idx) => {
        newContent += '    {\n';
        newContent += `        id: ${q.id},\n`;
        newContent += `        category: "${q.category}",\n`;
        newContent += `        difficulty: "${q.difficulty}",\n`;
        newContent += `        question: "${q.question.replace(/"/g, '\\"')}",\n`;
        newContent += `        options: [`;
        newContent += q.options.map(opt => `"${opt.replace(/"/g, '\\"')}"`).join(', ');
        newContent += '],\n';
        newContent += `        correctAnswer: ${q.correctAnswer},\n`;
        newContent += `        explanation: "${q.explanation.replace(/"/g, '\\"')}"\n`;
        newContent += '    }';

        // Add a comma unless this is the last question
        if (idx < questions.length - 1 || catIdx < Object.keys(categorizedQuestions).length - 1) {
            newContent += ',';
        }
        newContent += '\n';
    });
});

newContent += '];\n';

// Save the file
fs.writeFileSync(questionsPath, newContent, 'utf8');

console.log('✅ Hard History question added!');
console.log(`   Question ID: ${newQuestion.id}`);
console.log(`   Question: ${newQuestion.question}`);
console.log(`   Answer: ${newQuestion.options[newQuestion.correctAnswer]}`);