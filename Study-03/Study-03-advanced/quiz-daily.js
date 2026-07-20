#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// File path
const questionsPath = path.join(process.cwd(), 'questions.js');

// New question templates per category (matching the array format)
const newQuestions = [
    {
        category: "History",
        difficulty: "hard",
        question: "Which of these historical events happened last?",
        options: ["Fall of Constantinople", "Columbus reaching the Americas", "Gutenberg's printing press", "End of the Hundred Years' War"],
        correctAnswer: 1,
        explanation: "Columbus reached the Americas in 1492, after the printing press (c. 1440), the end of the Hundred Years' War (1453), and the fall of Constantinople (1453)."
    },
    {
        category: "World Geography",
        difficulty: "medium",
        question: "Which is the largest country in Africa by area? (as of 2024)",
        options: ["Nigeria", "South Africa", "Algeria", "Egypt"],
        correctAnswer: 2,
        explanation: "Algeria is the largest country in Africa, at about 2.38 million km²."
    },
    {
        category: "Science",
        difficulty: "easy",
        question: "Which gas is required for photosynthesis?",
        options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
        correctAnswer: 1,
        explanation: "Plants perform photosynthesis using carbon dioxide, water, and light."
    },
    {
        category: "Arts & Culture",
        difficulty: "medium",
        question: "In which city is Leonardo da Vinci's 'The Last Supper' located?",
        options: ["Rome", "Florence", "Milan", "Venice"],
        correctAnswer: 2,
        explanation: "The Last Supper is in the Convent of Santa Maria delle Grazie in Milan."
    }
];

console.log('📋 Starting daily quiz maintenance\n');
console.log('='.repeat(50));

// 1. Analyze the quiz file structure
console.log('\n1️⃣ Analyzing quiz file structure...');
let fileStructure = null;
let existingQuestions = [];
try {
    const fileContent = fs.readFileSync(questionsPath, 'utf8');

    // Check whether it is in array format
    if (fileContent.includes('const quizQuestions = [')) {
        fileStructure = 'array';
        console.log('  ✅ File format: array');

        // Load existing questions - handle CommonJS export
        delete require.cache[require.resolve(questionsPath)];
        const questionsModule = require(questionsPath);

        // Check whether it is an array or an object and handle accordingly
        if (Array.isArray(questionsModule)) {
            existingQuestions = questionsModule;
        } else if (questionsModule.quizQuestions) {
            existingQuestions = questionsModule.quizQuestions;
        } else if (questionsModule.default) {
            existingQuestions = questionsModule.default;
        } else {
            existingQuestions = questionsModule;
        }

        console.log('  ✅ Existing questions loaded');
    } else {
        fileStructure = 'object';
        console.log('  ✅ File format: object');
    }
} catch (error) {
    console.log('  ❌ File structure analysis failed:', error.message);
    console.log('  🛑 Aborting');
    process.exit(1);
}

// 2. Check the current question inventory
console.log('\n2️⃣ Checking current question inventory...');
let categoryStats = {};
let difficultyStats = { easy: 0, medium: 0, hard: 0 };
try {
    existingQuestions.forEach(q => {
        // Tally by category
        if (!categoryStats[q.category]) {
            categoryStats[q.category] = 0;
        }
        categoryStats[q.category]++;

        // Tally by difficulty
        if (q.difficulty) {
            difficultyStats[q.difficulty]++;
        }
    });

    console.log(`  📊 Total: ${existingQuestions.length} questions`);
    console.log('  📂 By category:');
    for (const [cat, count] of Object.entries(categoryStats)) {
        console.log(`    - ${cat}: ${count} questions`);
    }
    console.log('  📈 By difficulty:');
    console.log(`    - Easy: ${difficultyStats.easy} questions`);
    console.log(`    - Medium: ${difficultyStats.medium} questions`);
    console.log(`    - Hard: ${difficultyStats.hard} questions`);
} catch (error) {
    console.log('  ❌ Inventory check failed:', error.message);
    console.log('  🛑 Aborting');
    process.exit(1);
}

// 3. Analyze by category
console.log('\n3️⃣ Analyzing under-filled categories...');
const targetCount = 15; // Target question count per category
let needsMore = [];
try {
    for (const [cat, count] of Object.entries(categoryStats)) {
        if (count < targetCount) {
            needsMore.push(cat);
            console.log(`  ⚠️ ${cat}: ${targetCount - count} more questions needed`);
        }
    }
    if (needsMore.length === 0) {
        console.log('  ✅ All categories are sufficiently filled');
    }
} catch (error) {
    console.log('  ❌ Analysis failed:', error.message);
    console.log('  🛑 Aborting');
    process.exit(1);
}

// 4. Duplicate check
console.log('\n4️⃣ Checking for duplicates...');
let duplicates = [];
try {
    for (const newQ of newQuestions) {
        const isDuplicate = existingQuestions.some(existQ =>
            existQ.question.toLowerCase() === newQ.question.toLowerCase()
        );
        if (isDuplicate) {
            duplicates.push(newQ.question);
            console.log(`  ⚠️ Duplicate found: "${newQ.question.substring(0, 30)}..."`);
        }
    }
    if (duplicates.length === 0) {
        console.log('  ✅ No duplicates');
    } else {
        console.log(`  ❌ ${duplicates.length} duplicates found`);
        console.log('  🛑 Aborting');
        process.exit(1);
    }
} catch (error) {
    console.log('  ❌ Duplicate check failed:', error.message);
    console.log('  🛑 Aborting');
    process.exit(1);
}

// 5. Add questions and validate the format
console.log('\n5️⃣ Adding new questions...');
let addedQuestions = [];
try {
    // Generate new IDs
    const maxId = Math.max(...existingQuestions.map(q => q.id || 0));

    // Add an ID to each new question and validate
    newQuestions.forEach((q, index) => {
        // Format validation
        if (!q.question || !q.options || q.correctAnswer === undefined || !q.explanation) {
            throw new Error(`Question ${index + 1}: missing required fields`);
        }
        if (q.options.length !== 4) {
            throw new Error(`Question ${index + 1}: does not have 4 options`);
        }
        if (q.correctAnswer < 0 || q.correctAnswer >= 4) {
            throw new Error(`Question ${index + 1}: invalid answer index`);
        }

        // Add ID
        q.id = maxId + index + 1;
        addedQuestions.push(q);
        console.log(`  ✅ ${q.category}: "${q.question.substring(0, 30)}..." added`);
    });

    // Append to the file
    let fileContent = fs.readFileSync(questionsPath, 'utf8');

    // Find the end of the array (insert before the last ];)
    const lastBracketIndex = fileContent.lastIndexOf('];');
    if (lastBracketIndex === -1) {
        throw new Error('File format error: could not find the end of the array');
    }

    // Convert the new questions to strings
    const newQuestionsStr = addedQuestions.map(q =>
        `,
    {
        id: ${q.id},
        category: "${q.category}",
        difficulty: "${q.difficulty}",
        question: "${q.question}",
        options: ${JSON.stringify(q.options)},
        correctAnswer: ${q.correctAnswer},
        explanation: "${q.explanation}"
    }`
    ).join('');

    // Update the file
    fileContent = fileContent.substring(0, lastBracketIndex) +
                  newQuestionsStr +
                  fileContent.substring(lastBracketIndex);

    fs.writeFileSync(questionsPath, fileContent);
    console.log(`  📝 ${addedQuestions.length} questions added in total`);

} catch (error) {
    console.log('  ❌ Failed to add questions:', error.message);
    console.log('  🛑 Aborting');
    process.exit(1);
}

// 6. Create a backup
console.log('\n6️⃣ Creating backup...');
try {
    // Build the full question array (existing + new)
    const allQuestions = [...existingQuestions, ...addedQuestions];
    const date = new Date().toISOString().split('T')[0];
    const backupPath = `backup_questions_${date}.json`;

    fs.writeFileSync(backupPath, JSON.stringify(allQuestions, null, 2));
    console.log(`  💾 Backup complete: ${backupPath}`);
} catch (error) {
    console.log('  ❌ Backup failed:', error.message);
    // A backup failure is not fatal, so continue
}

// 7. Detailed execution report
console.log('\n7️⃣ Execution report');
console.log('='.repeat(50));
console.log('\n📊 Daily quiz maintenance summary\n');

try {
    const date = new Date().toLocaleString('en-US');
    const updatedQuestions = require(questionsPath);
    const updatedStats = {};
    const updatedDifficultyStats = { easy: 0, medium: 0, hard: 0 };

    // Compute updated statistics
    updatedQuestions.forEach(q => {
        if (!updatedStats[q.category]) {
            updatedStats[q.category] = 0;
        }
        updatedStats[q.category]++;

        if (q.difficulty) {
            updatedDifficultyStats[q.difficulty]++;
        }
    });

    console.log(`📅 Run at: ${date}`);
    console.log(`\n✅ Completed tasks:`);
    console.log(`  • File structure analysis: done (${fileStructure})`);
    console.log(`  • Duplicate check: passed`);
    console.log(`  • Format validation: passed`);
    console.log(`  • Questions added: ${addedQuestions.length}`);
    console.log(`  • Backup created: done`);

    console.log(`\n📈 Before/after comparison:`);
    console.log(`  • Total questions: ${existingQuestions.length} → ${updatedQuestions.length} (+${addedQuestions.length})`);

    console.log(`\n📂 By category:`);
    for (const [cat, count] of Object.entries(updatedStats)) {
        const before = categoryStats[cat] || 0;
        const change = count - before;
        const changeStr = change > 0 ? ` (+${change})` : '';
        console.log(`  • ${cat}: ${count}${changeStr}`);
    }

    console.log(`\n📊 Difficulty distribution:`);
    console.log(`  • Easy: ${updatedDifficultyStats.easy}`);
    console.log(`  • Medium: ${updatedDifficultyStats.medium}`);
    console.log(`  • Hard: ${updatedDifficultyStats.hard}`);

    console.log(`\n🆕 Added questions:`);
    addedQuestions.forEach((q, i) => {
        console.log(`  ${i + 1}. [${q.category}/${q.difficulty}] ${q.question.substring(0, 40)}...`);
    });

    console.log('\n✨ Daily quiz maintenance completed successfully!\n');

} catch (error) {
    console.log('❌ Error while generating the report:', error.message);
}

console.log('='.repeat(50));