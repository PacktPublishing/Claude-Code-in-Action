# Before the relative-grading modification

Snapshot of the teacher report right after the teacher mode commands were first created.

At this stage, `/create-report` grades students on an absolute scale based on their average scores, so every student in the sample data lands in grade C. The book then modifies the command to use relative grading (top 20% A, 21-40% B, 41-70% C, bottom 30% D), which produces the version in the project root.

Files:
- `create-report.md` - the custom command before the modification
- `teacher-report.js` - the report generator with absolute grading
- `teacher_report.html` - the generated report (all students grade C)
