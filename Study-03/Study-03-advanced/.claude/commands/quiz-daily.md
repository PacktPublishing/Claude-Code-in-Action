# quiz-daily

Command that performs daily quiz maintenance tasks

## Description

An automation script that manages the quiz database, adds new questions, and verifies data integrity.

## Steps

### 1. Analyze the quiz file structure
- Parse the structure of questions.js
- Determine whether it is an array or an object
- Identify the category structure

### 2. Assess the current question inventory
- Count the total number of questions
- Check the question distribution by category
- Check the distribution by difficulty

### 3. Per-category analysis
- Check the question count for each category
- Identify under-represented categories
- Check the difficulty balance

### 4. Duplicate detection
- Compare new questions against existing ones
- Check for duplicate question text
- Prevent duplicate IDs

### 5. Add questions and validate the format
- Add new questions in the correct format
- Validate required fields (question, options, correctAnswer, explanation)
- Verify the answer index range

### 6. Create a backup
- Back up the original file before changes
- Create date-stamped backup files
- Save in JSON format

### 7. Report the results
- Number of questions added
- Changes per category
- Validation results
- Backup file path

## Error Handling

If an error occurs at any step:
- Stop execution immediately
- Print a detailed error message
- Preserve the original file
- Keep the state rollback-able

## Example Usage

```bash
node quiz-daily.js
```

## Example Output

```
📋 Daily Quiz Maintenance Started
==================================================

1️⃣ Analyzing quiz file structure...
  ✅ File format: array
  ✅ Category field present
  
2️⃣ Checking current question inventory...
  📊 Total: 44 questions
  📂 By category:
    - History: 14 questions
    - World Geography: 10 questions
    - Science: 10 questions
    - Arts & Culture: 10 questions

3️⃣ Analyzing under-represented categories...
  ⚠️ World Geography: needs more questions
  ⚠️ Science: needs more questions

4️⃣ Checking for duplicates...
  ✅ No duplicates

5️⃣ Adding new questions...
  ✅ History: 1 question added
  ✅ World Geography: 1 question added
  
6️⃣ Creating backup...
  💾 backup_questions_2025-08-31.json

7️⃣ Results report
  ✨ Task complete
  📈 2 questions added in total
  ✅ All validations passed
```

## Notes

- The script must be updated if the questions.js file structure changes
- Backup files must be managed manually
- Duplicate detection is based on question text