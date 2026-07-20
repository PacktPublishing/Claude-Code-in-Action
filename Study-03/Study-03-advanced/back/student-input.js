#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// File paths
const rosterPath = path.join(process.cwd(), 'student_roster.json');
const dataPath = path.join(process.cwd(), 'student_data.json');

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Load the student roster
function loadRoster() {
    if (fs.existsSync(rosterPath)) {
        return JSON.parse(fs.readFileSync(rosterPath, 'utf8'));
    }
    return [];
}

// Save the student roster
function saveRoster(roster) {
    fs.writeFileSync(rosterPath, JSON.stringify(roster, null, 2));
}

// Save the student data
function saveStudentData(roster) {
    const studentData = roster.map(student => ({
        ...student,
        averageScore: 0,
        grade: 'N/A',
        quizHistory: []
    }));
    fs.writeFileSync(dataPath, JSON.stringify(studentData, null, 2));
}

// Question helper
function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, answer => {
            resolve(answer);
        });
    });
}

// Show the main menu
function showMainMenu() {
    console.log('\n' + colors.cyan + '📚 Student Information Entry System' + colors.reset);
    console.log('=' .repeat(30));
    console.log('1. Add a new student');
    console.log('2. View student list');
    console.log('3. Edit student information');
    console.log('4. Delete a student');
    console.log('5. Reset everything');
    console.log('0. Save and exit');
    console.log('=' .repeat(30));
}

// Add a new student
async function addStudent(roster) {
    console.log('\n' + colors.yellow + '📝 Add a new student' + colors.reset);

    const name = await question('Student name: ');
    if (!name.trim()) {
        console.log(colors.red + '❌ Please enter a name.' + colors.reset);
        return roster;
    }

    const classNum = await question('Class number (1-10): ');
    if (!classNum || classNum < 1 || classNum > 10) {
        console.log(colors.red + '❌ Please enter a valid class number (1-10).' + colors.reset);
        return roster;
    }

    const studentId = await question('Student ID (4 digits): ');
    if (!studentId || studentId.length !== 4 || isNaN(studentId)) {
        console.log(colors.red + '❌ Please enter a 4-digit student ID.' + colors.reset);
        return roster;
    }

    // Duplicate check
    if (roster.some(s => s.studentId === studentId)) {
        console.log(colors.red + '❌ That student ID already exists.' + colors.reset);
        return roster;
    }

    // Same-name check
    if (roster.some(s => s.name === name)) {
        const confirm = await question(colors.yellow + '⚠️ A student with the same name exists. Continue? (y/n): ' + colors.reset);
        if (confirm.toLowerCase() !== 'y') {
            return roster;
        }
    }

    // Add the new student
    const newStudent = {
        id: `STU${String(roster.length + 1).padStart(3, '0')}`,
        studentId: studentId,
        name: name.trim(),
        class: `Class ${classNum}`,
        addedDate: new Date().toISOString().split('T')[0]
    };

    roster.push(newStudent);
    console.log(colors.green + `✅ Student ${name} (Class ${classNum}, ${studentId}) has been added.` + colors.reset);

    return roster;
}

// View the student list
function showStudentList(roster) {
    if (roster.length === 0) {
        console.log(colors.yellow + '\n⚠️ No students registered.' + colors.reset);
        return;
    }

    console.log('\n' + colors.cyan + '📋 Student List' + colors.reset);
    console.log('─'.repeat(60));
    console.log('No.  | ID     | Name       | Class | Added');
    console.log('─'.repeat(60));

    roster.forEach((student, index) => {
        console.log(
            `${String(index + 1).padStart(3)} | ` +
            `${student.studentId} | ` +
            `${student.name.padEnd(10)} | ` +
            `${student.class.padEnd(5)} | ` +
            `${student.addedDate}`
        );
    });
    console.log('─'.repeat(60));
    console.log(`Total: ${roster.length} students`);
}

// Edit student information
async function editStudent(roster) {
    if (roster.length === 0) {
        console.log(colors.yellow + '\n⚠️ No students registered.' + colors.reset);
        return roster;
    }

    showStudentList(roster);

    const index = await question('\nNumber of the student to edit: ');
    const studentIndex = parseInt(index) - 1;

    if (studentIndex < 0 || studentIndex >= roster.length) {
        console.log(colors.red + '❌ Invalid number.' + colors.reset);
        return roster;
    }

    const student = roster[studentIndex];
    console.log(`\nCurrent: ${student.name} (${student.class}, ${student.studentId})`);

    const newName = await question('New name (Enter: no change): ');
    const newClass = await question('New class number (Enter: no change): ');

    if (newName.trim()) {
        student.name = newName.trim();
    }
    if (newClass && newClass >= 1 && newClass <= 10) {
        student.class = `Class ${newClass}`;
    }

    console.log(colors.green + '✅ Student information updated.' + colors.reset);
    return roster;
}

// Delete a student
async function deleteStudent(roster) {
    if (roster.length === 0) {
        console.log(colors.yellow + '\n⚠️ No students registered.' + colors.reset);
        return roster;
    }

    showStudentList(roster);

    const index = await question('\nNumber of the student to delete: ');
    const studentIndex = parseInt(index) - 1;

    if (studentIndex < 0 || studentIndex >= roster.length) {
        console.log(colors.red + '❌ Invalid number.' + colors.reset);
        return roster;
    }

    const student = roster[studentIndex];
    const confirm = await question(colors.yellow + `Really delete student ${student.name}? (y/n): ` + colors.reset);

    if (confirm.toLowerCase() === 'y') {
        roster.splice(studentIndex, 1);
        // Reassign IDs
        roster.forEach((s, i) => {
            s.id = `STU${String(i + 1).padStart(3, '0')}`;
        });
        console.log(colors.green + '✅ Student deleted.' + colors.reset);
    }

    return roster;
}

// Reset everything
async function resetAll() {
    const confirm = await question(colors.red + '⚠️ All data will be deleted. Continue? (type yes): ' + colors.reset);

    if (confirm === 'yes') {
        if (fs.existsSync(rosterPath)) fs.unlinkSync(rosterPath);
        if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
        console.log(colors.green + '✅ All data has been reset.' + colors.reset);
        return [];
    }

    console.log('Reset cancelled.');
    return null;
}

// Main function
async function main() {
    let roster = loadRoster();
    const args = process.argv.slice(2);

    // Handle command-line options
    if (args.includes('--demo')) {
        console.log(colors.yellow + '⚠️ Demo mode: run student-data-generator.js instead.' + colors.reset);
        rl.close();
        return;
    }

    if (args.includes('--load')) {
        console.log(colors.cyan + `📂 Loaded existing roster: ${roster.length} students` + colors.reset);
        showStudentList(roster);
    }

    // Main loop
    let running = true;
    while (running) {
        showMainMenu();
        const choice = await question('\nChoice: ');

        switch (choice) {
            case '1':
                roster = await addStudent(roster);
                break;
            case '2':
                showStudentList(roster);
                break;
            case '3':
                roster = await editStudent(roster);
                break;
            case '4':
                roster = await deleteStudent(roster);
                break;
            case '5':
                const resetResult = await resetAll();
                if (resetResult !== null) {
                    roster = resetResult;
                }
                break;
            case '0':
                saveRoster(roster);
                saveStudentData(roster);
                console.log(colors.green + '\n✅ Data saved.' + colors.reset);
                console.log(`  • ${rosterPath}`);
                console.log(`  • ${dataPath}`);
                running = false;
                break;
            default:
                console.log(colors.red + '❌ Invalid choice.' + colors.reset);
        }
    }

    rl.close();
    console.log(colors.cyan + '\n👋 Exiting the program.' + colors.reset);
}

// Error handling
process.on('SIGINT', () => {
    console.log(colors.yellow + '\n\n⚠️ Program interrupted.' + colors.reset);
    rl.close();
    process.exit(0);
});

// Run
if (require.main === module) {
    console.log(colors.bright + colors.blue + '\n🎓 Student Information Management System v1.0' + colors.reset);
    console.log(colors.cyan + 'Enter and manage real student information.\n' + colors.reset);
    main().catch(err => {
        console.error(colors.red + 'Error:', err.message + colors.reset);
        rl.close();
        process.exit(1);
    });
}