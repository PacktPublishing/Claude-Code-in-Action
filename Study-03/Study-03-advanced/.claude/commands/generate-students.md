# generate-students

Command that generates student data

## Run
```bash
node student-data-generator.js
```

## Features
- Generates data for 20 fictional students
- 5-10 quiz records per student
- Records category scores and study time
- Automatically assigns A-F grades

## Output
- Creates the `student_data.json` file
- Prints the grade distribution to the console

## Data Structure
```json
{
  "id": "STU001",
  "name": "Ethan Miller",
  "class": "Class 1",
  "averageScore": 75,
  "grade": "C",
  "quizHistory": [...]
}
```