const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);

class TeacherDashboard {
    constructor() {
        this.commands = [
            { name: 'Generate student data', file: 'student-data-generator.js' },
            { name: 'Grade analysis', file: 'grade-analyzer.js' },
            { name: 'Student comparison', file: 'student-comparison.js' },
            { name: 'Generate HTML report', file: 'teacher-report.js' },
            { name: 'Export CSV files', file: 'export-report.js' }
        ];
        this.results = [];
        this.startTime = Date.now();
    }

    displayHeader() {
        console.log('\n╔════════════════════════════════════╗');
        console.log('║     🎓 Teacher Dashboard Start     ║');
        console.log('║     Teacher Dashboard v1.0         ║');
        console.log('╚════════════════════════════════════╝\n');
    }

    async executeCommand(command, index) {
        const stepStart = Date.now();
        console.log(`[${index + 1}/${this.commands.length}] ${command.name}`);

        try {
            const { stdout, stderr } = await execAsync(`node ${command.file}`);

            if (stderr && !stderr.includes('Warning')) {
                throw new Error(stderr);
            }

            const duration = ((Date.now() - stepStart) / 1000).toFixed(2);
            console.log(`✅ Done (${duration}s)\n`);

            this.results.push({
                name: command.name,
                status: 'success',
                duration: duration,
                output: stdout
            });

            return true;
        } catch (error) {
            const duration = ((Date.now() - stepStart) / 1000).toFixed(2);
            console.log(`❌ Failed (${duration}s)`);
            console.log(`  Error: ${error.message.split('\n')[0]}\n`);

            this.results.push({
                name: command.name,
                status: 'failed',
                duration: duration,
                error: error.message
            });

            return false;
        }
    }

    async checkGeneratedFiles() {
        const today = new Date().toISOString().split('T')[0];
        const files = [
            { name: 'student_data.json', required: true },
            { name: 'teacher_report.html', required: true },
            { name: 'report_summary.csv', required: false },
            { name: 'report_detailed.csv', required: false }
        ];

        const fileStatuses = [];

        for (const file of files) {
            try {
                const stats = await fs.stat(file.name);
                const size = (stats.size / 1024).toFixed(0);
                fileStatuses.push({
                    name: file.name,
                    exists: true,
                    size: `${size}KB`
                });
            } catch {
                if (file.required) {
                    fileStatuses.push({
                        name: file.name,
                        exists: false
                    });
                }
            }
        }

        return fileStatuses;
    }

    displaySummary() {
        const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(2);
        const successCount = this.results.filter(r => r.status === 'success').length;
        const completionRate = ((successCount / this.commands.length) * 100).toFixed(0);

        console.log('╔════════════════════════════════════╗');
        console.log('║       📊 Execution Summary         ║');
        console.log('╚════════════════════════════════════╝\n');

        console.log(`🔸 Completion rate: ${successCount}/${this.commands.length} (${completionRate}%)`);
        console.log(`🔸 Total run time: ${totalDuration}s`);

        if (successCount < this.commands.length) {
            console.log('\n❌ Failed tasks:');
            this.results
                .filter(r => r.status === 'failed')
                .forEach(r => {
                    console.log(`  - ${r.name}: ${r.error.split('\n')[0]}`);
                });
        }
    }

    async displayFileStatus() {
        const files = await this.checkGeneratedFiles();

        if (files.length > 0) {
            console.log('\n🔸 Generated files:');
            files.forEach(file => {
                if (file.exists) {
                    console.log(`  ✅ ${file.name} (${file.size})`);
                } else {
                    console.log(`  ❌ ${file.name} (not generated)`);
                }
            });
        }
    }

    extractKeyMetrics() {
        const metrics = {
            totalStudents: 0,
            avgScore: 0,
            topPerformers: 0,
            needsHelp: 0
        };

        try {
            const studentData = require('./student_data.json');
            metrics.totalStudents = studentData.students.length;

            const scores = studentData.students.map(s => s.totalScore);
            metrics.avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
            metrics.topPerformers = scores.filter(s => s >= 90).length;
            metrics.needsHelp = scores.filter(s => s < 70).length;
        } catch {
            // Keep defaults if the file is missing or unreadable
        }

        return metrics;
    }

    displayMetrics() {
        const metrics = this.extractKeyMetrics();

        if (metrics.totalStudents > 0) {
            console.log('\n📈 Key metrics:');
            console.log(`  • Total students: ${metrics.totalStudents}`);
            console.log(`  • Average score: ${metrics.avgScore} pts`);
            console.log(`  • Top performers: ${metrics.topPerformers} students (90 pts or higher)`);
            console.log(`  • Needs improvement: ${metrics.needsHelp} students (below 70 pts)`);
        }
    }

    async run() {
        this.displayHeader();

        let shouldContinue = true;

        for (let i = 0; i < this.commands.length && shouldContinue; i++) {
            const success = await this.executeCommand(this.commands[i], i);

            if (!success && this.commands[i].name.includes('student data')) {
                console.log('⚠️  Aborting because core data generation failed.\n');
                shouldContinue = false;
            }
        }

        this.displaySummary();
        await this.displayFileStatus();
        this.displayMetrics();

        console.log('\n✨ Teacher dashboard run complete\n');

        if (this.results.filter(r => r.status === 'success').length === this.commands.length) {
            console.log('💡 Tip: open the generated HTML report in a browser.');
            console.log('   You can open the CSV files in Excel for further analysis.\n');
        }
    }
}

async function main() {
    const dashboard = new TeacherDashboard();

    try {
        await dashboard.run();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ An unexpected error occurred:');
        console.error(error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = TeacherDashboard;