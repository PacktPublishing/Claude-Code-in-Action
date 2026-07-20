#!/usr/bin/env node

/**
 * Teacher mode integrated runner script
 * Runs all teacher mode commands in sequence
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Console color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Print the header
function printHeader() {
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.bright + colors.blue + '                    🎓 Teacher Mode' + colors.reset);
    console.log(colors.cyan + '                  Teacher Mode Execution' + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

// Run a step
function executeStep(stepNumber, totalSteps, name, command, description) {
    console.log(colors.yellow + `\n[${stepNumber}/${totalSteps}] ${name}` + colors.reset);
    console.log(colors.cyan + `📝 ${description}` + colors.reset);
    console.log('─'.repeat(60));

    const startTime = Date.now();

    try {
        execSync(command, { stdio: 'inherit' });
        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(colors.green + `\n✅ ${name} finished (${executionTime}s)` + colors.reset);
        return { success: true, time: executionTime };
    } catch (error) {
        console.error(colors.red + `\n❌ ${name} failed: ${error.message}` + colors.reset);
        return { success: false, error: error.message };
    }
}

// Main
function main() {
    printHeader();

    const steps = [
        {
            name: 'Generate student data',
            command: 'node student-data-generator.js',
            description: 'Generates quiz data for 20 virtual students'
        },
        {
            name: 'Grade analysis',
            command: 'node grade-analyzer.js',
            description: 'Runs a comprehensive analysis of all student grades'
        },
        {
            name: 'Student comparison',
            command: 'node student-comparison.js',
            description: 'Compares top and bottom students'
        },
        {
            name: 'Generate HTML report',
            command: 'node teacher-report.js',
            description: 'Generates a visual HTML report'
        }
    ];

    const results = [];
    let successCount = 0;

    // Run each step
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const result = executeStep(i + 1, steps.length, step.name, step.command, step.description);

        results.push({
            name: step.name,
            ...result
        });

        if (result.success) {
            successCount++;
        } else if (i === 0) {
            // Abort if the first step fails
            console.log(colors.red + '\n⚠️ Aborting because data generation failed.' + colors.reset);
            break;
        }
    }

    // Result summary
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.bright + '                   📊 Execution Summary' + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');

    // Per-step results
    console.log(colors.yellow + '🔸 Step results:' + colors.reset);
    results.forEach((result, index) => {
        const status = result.success
            ? colors.green + '✅ Success' + colors.reset
            : colors.red + '❌ Failed' + colors.reset;
        const time = result.time ? ` (${result.time}s)` : '';
        console.log(`  ${index + 1}. ${result.name}: ${status}${time}`);
    });

    // Completion rate
    const completionRate = Math.round(successCount / steps.length * 100);
    console.log(colors.yellow + `\n🔸 Completion rate: ${successCount}/${steps.length} (${completionRate}%)` + colors.reset);

    // Check generated files
    console.log(colors.yellow + '\n🔸 Generated files:' + colors.reset);
    const files = [
        'student_data.json',
        `teacher_report_${new Date().toISOString().split('T')[0]}.html`
    ];

    files.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const size = (stats.size / 1024).toFixed(2);
            console.log(colors.green + `  ✅ ${file} (${size} KB)` + colors.reset);
        } else {
            console.log(colors.yellow + `  ⚠️ ${file} (not generated)` + colors.reset);
        }
    });

    // Completion message
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);

    if (successCount === steps.length) {
        console.log(colors.green + colors.bright + '✨ Teacher mode run complete!' + colors.reset);
        console.log(colors.cyan + '\nYou can now:' + colors.reset);
        console.log('  1. Open the HTML report in a browser');
        console.log('  2. Run further analysis on student_data.json');
        console.log('  3. Run individual commands for detailed analysis');
    } else {
        console.log(colors.yellow + '⚠️ Some tasks did not finish.' + colors.reset);
        console.log(colors.cyan + '\nTroubleshooting:' + colors.reset);
        console.log('  1. Check the error messages');
        console.log('  2. Run the individual scripts directly');
        console.log('  3. Re-run run-teacher-mode.js');
    }

    console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

// Run the script
if (require.main === module) {
    main();
}