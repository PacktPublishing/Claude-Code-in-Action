---
command: quiz-add
description: Add a new question to the quiz
arguments:
  - name: category
    description: Question category (History/World Geography/Science/Arts & Culture)
    required: true
  - name: difficulty
    description: Difficulty (easy/medium/hard)
    required: true
---

```js
// Quiz Question Adder
// Usage: /quiz-add [category] [difficulty]
// Example: /quiz-add History medium

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse parameters
const args = process.argv.slice(2);
const category = args[0];
const difficulty = args[1];

// Check for valid category and difficulty
const validCategories = ['History', 'World Geography', 'Science', 'Arts & Culture'];
const validDifficulties = ['easy', 'medium', 'hard'];

if (!category || !validCategories.includes(category)) {
    console.error('❌ Invalid category.');
    console.log('   Available categories: ' + validCategories.join(', '));
    process.exit(1);
}

if (!difficulty || !validDifficulties.includes(difficulty)) {
    console.error('❌ Invalid difficulty.');
    console.log('   Available difficulties: easy, medium, hard');
    process.exit(1);
}

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

// Create the readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Prompt helper
const prompt = (question) => new Promise((resolve) => {
    rl.question(question, resolve);
});

// Show the validation guidelines
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║               📝 Add New Quiz Question                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('📌 Category: ' + category);
console.log('📌 Difficulty: ' + difficulty + '\n');

console.log('⚠️  Validation guidelines:');
console.log('1. Confirm there is exactly one correct answer');
console.log('2. State the basis for superlatives (e.g., by area, as of 2024)');
console.log('3. Make time frame and scope clear (state the point in time for changeable info)');
console.log('4. Check at least two sources for questionable information\n');

// Main function
async function addNewQuestion() {
    try {
        // Enter the question
        const question = await prompt('📝 Enter the question:\n> ');
        if (!question.trim()) {
            console.error('❌ The question is empty.');
            process.exit(1);
        }

        // Enter the options
        console.log('\n📋 Enter 4 answer options:');
        const options = [];
        for (let i = 1; i <= 4; i++) {
            const option = await prompt(`  Option ${i}: `);
            if (!option.trim()) {
                console.error('❌ The option is empty.');
                process.exit(1);
            }
            options.push(option.trim());
        }

        // Enter the correct answer
        const correctAnswerInput = await prompt('\n✅ Enter the correct answer number (1-4): ');
        const correctAnswer = parseInt(correctAnswerInput) - 1;
        
        if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer > 3) {
            console.error('❌ Invalid answer number.');
            process.exit(1);
        }

        // Enter the explanation
        const explanation = await prompt('\n💡 Enter the answer explanation:\n> ');
        if (!explanation.trim()) {
            console.error('❌ The explanation is empty.');
            process.exit(1);
        }

        // Compute the new question ID
        const newId = Math.max(...quizQuestions.map(q => q.id)) + 1;

        // Create the new question object
        const newQuestion = {
            id: newId,
            category: category,
            difficulty: difficulty,
            question: question.trim(),
            options: options,
            correctAnswer: correctAnswer,
            explanation: explanation.trim()
        };

        // Preview
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║                    📋 New Question Preview                    ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        
        console.log(`ID: ${newId}`);
        console.log(`Category: ${category}`);
        console.log(`Difficulty: ${difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Medium' : 'Hard'}`);
        console.log(`\nQuestion: ${question.trim()}`);
        console.log('\nOptions:');
        options.forEach((opt, idx) => {
            const marker = idx === correctAnswer ? '✅' : '  ';
            console.log(`${marker} ${idx + 1}. ${opt}`);
        });
        console.log(`\nExplanation: ${explanation.trim()}`);

        // Confirm
        const confirm = await prompt('\nAdd this question? (y/n): ');
        
        if (confirm.toLowerCase() !== 'y') {
            console.log('❌ Addition cancelled.');
            rl.close();
            return;
        }

        // Update the questions.js file
        // Group questions by category
        const categorizedQuestions = {};
        quizQuestions.forEach(q => {
            if (!categorizedQuestions[q.category]) {
                categorizedQuestions[q.category] = [];
            }
            categorizedQuestions[q.category].push(q);
        });

        // Add the new question to its category
        if (!categorizedQuestions[category]) {
            categorizedQuestions[category] = [];
        }
        categorizedQuestions[category].push(newQuestion);

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

        // Analyze the current answer distribution
        const updatedQuestions = [...quizQuestions, newQuestion];
        const answerDist = { 0: 0, 1: 0, 2: 0, 3: 0 };
        updatedQuestions.forEach(q => answerDist[q.correctAnswer]++);

        console.log('\n✅ Question added successfully!');
        console.log(`   Total questions: ${updatedQuestions.length}`);
        console.log(`   ${category} category: ${categorizedQuestions[category].length}\n`);
        
        // Show the answer distribution
        console.log('📊 Overall answer distribution:');
        [0, 1, 2, 3].forEach(i => {
            const count = answerDist[i];
            const percent = (count / updatedQuestions.length * 100).toFixed(1);
            const bar = '█'.repeat(Math.round(count / Math.max(...Object.values(answerDist)) * 20));
            console.log(`   Option ${i + 1}: ${bar} ${count} (${percent}%)`);
        });

        // Balance assessment
        const maxCount = Math.max(...Object.values(answerDist));
        const minCount = Math.min(...Object.values(answerDist));
        const diff = maxCount - minCount;

        if (diff > 4) {
            console.log('\n⚠️  The answer distribution is skewed. Consider rebalancing.');
            const lessUsed = Object.entries(answerDist)
                .filter(([k, v]) => v === minCount)
                .map(([k]) => parseInt(k) + 1);
            console.log(`   In particular, questions with option ${lessUsed.join(', ')} as the answer are needed.`);
        }

        rl.close();

    } catch (error) {
        console.error('❌ Error occurred:', error.message);
        rl.close();
        process.exit(1);
    }
}

// Run
addNewQuestion();
```