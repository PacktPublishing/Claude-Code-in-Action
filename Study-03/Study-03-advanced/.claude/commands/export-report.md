# export-report

Command that exports the HTML report to CSV format

## Run
```bash
node export-report.js
```

## Features
- Automatically finds the HTML report (selects the latest file)
- Generates a summary CSV (statistics and top 5 students)
- Generates a detailed CSV (full student list)
- Excel-compatible UTF-8 BOM encoding

## Generated Files
1. **Summary CSV** (`report_summary.csv`)
   - Overall statistics
   - Top 5 student info
   - Grading criteria description

2. **Detailed CSV** (`report_detailed.csv`)
   - Full student list
   - Average score per student
   - Relative-ranking grade
   - Number of quizzes taken

## CSV Structure

### Summary CSV
```
Generated, 8/31/2025, 2:41:06 PM
Total Students, 20
Overall Average, 64.3 pts
Highest Score, 76 pts
Lowest Score, 52 pts

Rank, Name, Class, Average Score, Grade
1, Grace King, Class 4, 76 pts, A
...
```

### Detailed CSV
```
Student ID, Name, Class, Average Score, Grade, Quiz Count
STU001, Ethan Miller, Class 1, 65, B, 8
...
```

## Example Usage
```bash
# 1. First generate the HTML report
node teacher-report.js

# 2. Export to CSV
node export-report.js

# 3. Open the CSV files in Excel
```

## Highlights
- Excel compatible (UTF-8 BOM)
- Automatic file discovery
- Multiple format support
- Sorted data output