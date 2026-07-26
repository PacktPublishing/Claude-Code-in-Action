# teacher-mode

Integrated command that runs all teacher-mode features

## Run
```bash
node teacher-dashboard.js
```

## Execution Order
1. **generate-students** → Generate student data
2. **analyze-grades** → Analyze grades
3. **compare-students** → Compare students
4. **create-report** → Generate the HTML report
5. **export-report** → Export CSV files

## Features
- Runs 5 commands sequentially
- Measures execution time per step
- Error handling and abort management
- Summary report of results
- Verifies generated files

## Output
```
╔════════════════════════════════════╗
║     🎓 Teacher Dashboard Start     ║
║     Teacher Dashboard v1.0         ║
╚════════════════════════════════════╝

[1/5] Generate student data
✅ Done (0.08s)

[2/5] Analyze grades
✅ Done (0.07s)

[3/5] Compare students
✅ Done (0.07s)

[4/5] Generate HTML report
✅ Done (0.09s)

[5/5] Export CSV files
✅ Done (0.05s)

📊 Execution Summary
🔸 Completion: 5/5 (100%)
🔸 Generated files:
  ✅ student_data.json (108KB)
  ✅ teacher_report.html (16KB)
```

## Generated Files
- `student_data.json` - Student database
- `teacher_report.html` - HTML report
- `report_summary.csv` - Summary CSV
- `report_detailed.csv` - Detailed CSV

## Use Cases
- Daily/weekly grade management
- Preparing parent-teacher conference materials
- Writing reports for the school district
- Planning lessons