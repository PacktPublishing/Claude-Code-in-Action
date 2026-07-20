#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find HTML files
const files = fs.readdirSync(process.cwd());
const htmlFiles = files.filter(f => f.startsWith('teacher_report_') && f.endsWith('.html'));

if (htmlFiles.length === 0) {
    console.log('⚠️ No teacher_report HTML file found.');
    console.log('   Run node teacher-report.js first.');
    process.exit(1);
}

// Pick the most recent file
const latestHtml = htmlFiles.sort().pop();
const htmlPath = path.join(process.cwd(), latestHtml);
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

console.log(`📄 Reading HTML file: ${latestHtml}`);

// Extract data from the HTML
const extractData = (html) => {
    const data = {
        date: '',
        totalStudents: 0,
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
        topStudents: []
    };

    // Extract the date
    const dateMatch = html.match(/Generated: ([^<]+)</);
    if (dateMatch) data.date = dateMatch[1];

    // Extract the statistics
    const statsMatch = html.match(/Total Students.*?(\d+).*?Overall Average.*?([\d.]+).*?Highest Score.*?(\d+).*?Lowest Score.*?(\d+)/s);
    if (statsMatch) {
        data.totalStudents = parseInt(statsMatch[1]);
        data.avgScore = parseFloat(statsMatch[2]);
        data.maxScore = parseInt(statsMatch[3]);
        data.minScore = parseInt(statsMatch[4]);
    }

    // Extract the top students
    const tableMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (tableMatch) {
        const rows = tableMatch[1].match(/<tr>[\s\S]*?<\/tr>/g) || [];
        rows.forEach(row => {
            const cells = row.match(/<td>([^<]*)<\/td>/g);
            if (cells && cells.length >= 5) {
                const student = {
                    rank: cells[0].replace(/<[^>]*>/g, ''),
                    name: cells[1].replace(/<[^>]*>/g, ''),
                    class: cells[2].replace(/<[^>]*>/g, ''),
                    score: cells[3].replace(/<[^>]*>/g, ''),
                    grade: cells[4].match(/>([A-D])</)?.[1] || ''
                };
                data.topStudents.push(student);
            }
        });
    }

    return data;
};

const data = extractData(htmlContent);

// Build the CSV
const createCSV = (data) => {
    let csv = 'Grade Report Summary\n';
    csv += `Generated,${data.date}\n`;
    csv += `Total Students,${data.totalStudents}\n`;
    csv += `Overall Average,${data.avgScore}\n`;
    csv += `Highest Score,${data.maxScore}\n`;
    csv += `Lowest Score,${data.minScore}\n`;
    csv += '\n';
    csv += 'Top 5 Students\n';
    csv += 'Rank,Name,Class,Average Score,Grade\n';

    data.topStudents.forEach(s => {
        csv += `${s.rank},${s.name},${s.class},${s.score},${s.grade}\n`;
    });

    csv += '\n';
    csv += 'Grading Criteria (Relative Ranking)\n';
    csv += 'Grade A,Top 20%\n';
    csv += 'Grade B,Top 21-40%\n';
    csv += 'Grade C,Top 41-70%\n';
    csv += 'Grade D,Bottom 30%\n';

    return csv;
};

// Detailed CSV that also includes every student's data
const createDetailedCSV = () => {
    const dataPath = path.join(process.cwd(), 'student_data.json');
    if (!fs.existsSync(dataPath)) {
        return null;
    }

    const students = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    let csv = 'Student ID,Name,Class,Average Score,Grade,Quiz Count\n';

    students.sort((a, b) => b.averageScore - a.averageScore);
    students.forEach(s => {
        csv += `${s.id},${s.name},${s.class},${s.averageScore},${s.grade},${s.quizHistory.length}\n`;
    });

    return csv;
};

// Save the CSV file
const csvContent = createCSV(data);
const csvPath = path.join(process.cwd(), `report_summary_${new Date().toISOString().split('T')[0]}.csv`);
fs.writeFileSync(csvPath, '\ufeff' + csvContent); // Add BOM (Excel compatibility)

console.log(`✅ Summary CSV saved: ${csvPath}`);

// Also create the detailed CSV
const detailedCSV = createDetailedCSV();
if (detailedCSV) {
    const detailPath = path.join(process.cwd(), `report_detailed_${new Date().toISOString().split('T')[0]}.csv`);
    fs.writeFileSync(detailPath, '\ufeff' + detailedCSV);
    console.log(`✅ Detailed CSV saved: ${detailPath}`);
}

console.log('\n📊 Export complete!');
console.log('   Open the CSV files in Excel.');