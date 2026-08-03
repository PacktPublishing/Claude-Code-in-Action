# Claude Code in Action — Prompt Collection

Copy and paste the prompts for each chapter as you follow along with the book.

---

## 📖 Table of Contents

- [Chapter 1: My First Vibe Coding](#chapter-1-my-first-vibe-coding)
- [Chapter 2: Maximizing AI's Potential by 200% with Effective Prompts](#chapter-2-maximizing-ais-potential-by-200-with-effective-prompts)
- [Chapter 3: Getting Started with Claude Code](#chapter-3-getting-started-with-claude-code)
- [Chapter 4: Practical Use of Claude Code](#chapter-4-practical-use-of-claude-code)
- [Chapter 5: Systematic Development and Management Through Game Building](#chapter-5-systematic-development-and-management-through-game-building)
- [Chapter 6: Giving Claude Code Wings with APIs](#chapter-6-giving-claude-code-wings-with-apis)
- [Chapter 7: Building a Development Team with Claude Code AI Agents](#chapter-7-building-a-development-team-with-claude-code-ai-agents)
- [Chapter 8: Going Beyond Claude Code's Limits with MCP](#chapter-8-going-beyond-claude-codes-limits-with-mcp)

---

### Chapter 1: My First Vibe Coding

#### 01-2: Create My Own First Webpage

```
I want to create my own personal start homepage with today's date and time and a search bar.
```

Then answer the follow-up questions to complete your first artifact.

Editing the design:

```
Please modify this design to match the Google style.
```

---

### Chapter 2: Maximizing AI's Potential by 200% with Effective Prompts

#### 02-1: The Secrets of Prompts That Awaken AI

An example of a vague prompt (don't expect good results from this one):

```diff
- Create a cool, personalized homepage for me. (X)
```

An improved, specific version:

```
I want to create my own homepage with a clean, light-mode design that includes today's date and time, and a Google search bar.
```

The basic question template:

```
I'm trying to build [what]. The main feature is [specific feature description]. It's for [who], and it's needed to [why/solve a specific problem]. Please write a detailed PRD with technical guidance on how to implement it.
```

Writing the portfolio PRD:

```
I'm trying to build a portfolio webpage. The main feature is an impactful layout that allows recruiters to grasp my capabilities within 30 seconds. It is designed for a marketer preparing to transition into freelancing, and is essential for presenting myself as a competitive candidate. Please write a detailed PRD, including technical direction on how to implement it.
```

#### 02-2: Real-World Application: Completing Your Marketing Portfolio

```
Convert the given PRD into a 5-step prompt for use with Claude Code.
```

```
I'm going to proceed according to this PRD. First, please write an HTML document based on the PRD. Divide it into sections and assign a unique name to each section to make future edits easier. Don't implement any features yet; just show me the overall structure.
```

```
Please revise the [Number of Projects] item in the 'performance-metrics' section to be a list that specifically details the performance over the past three years.
```

```
Apply a modern and sophisticated design to the HTML document.
```

```
Move the [Before/After Metrics] from the 'case-studies' section to the 'hero-introduction' section and present them as a chart.
```

```
Here is my career portfolio. Please update it by section based on the following information.
I am a third-year performance/content marketing specialist.
- Key achievements: ROAS of 200%, 25 campaigns, and contributing $600K in annual revenue
- Position changes over 3 years: Junior (2023) → Performance Marketer (2024) → Manager + Consultant (2025)
- Skill Levels: Performance Marketing: 75%, Content Marketing: 70%, Data Analysis (GA4): 65%
Here are my key case studies.
- E-commerce: Monthly ad spend of $8K, ROAS of 200%
- Startup: Instagram followers increased from 2,000 to 8,000 (in 6 months)
- Local brand: Blog visitors increased from 500 to 3,000 (in 4 months)
```

```
Select one WordPress theme that best suits this portfolio and customize its design. Use different color tones for each section to make them easily distinguishable.
```

```
Please review whether every part of the portfolio webpage is properly implemented. Check that it was built according to the PRD and that each link works without any issues.
```

```
Address and fix the three areas for improvement that were identified, and complete a perfect portfolio for transitioning to freelance work.
```

---

### Chapter 3: Getting Started with Claude Code

#### 03-1: Installing Claude Code

Windows (PowerShell):

```
irm https://claude.ai/install.ps1 | iex
```

macOS / Linux:

```
curl -fsSL https://claude.ai/install.sh | bash
```

For macOS/Linux details, see the **[installation guide](install-guide/INSTALL.md)**.

Your first conversation with Claude Code:

```
Hello! Please describe what features you have.
```

#### 03-2: Building a Handwriting Recognition Program

```
Create and run code that recognizes numbers entered as handwriting. Please write all code and comments in English.
```

```
Make it so I can run the digit recognition program by clicking it in Windows Explorer.
```

#### 03-3: Expanding the Program with CLAUDE.md

```
# From now on, add the date and time as a comment in every file you create.
```

```
I want to develop the handwriting recognition program as both a web version and a desktop version. Please create the web_version and desktop_version folders, and generate a CLAUDE.md file for each folder.
```

```
Run the web version program in the browser.
```

---

### Chapter 4: Practical Use of Claude Code
#### 04-1 Learning Claude Code Commands with Step-by-Step Prompts
#### Requesting a PRD

```
I want to create a to-do management app. Please write a PRD for me.
It's a personal app to manage about 10-20 tasks per day. The main features are:
- Add, edit, and delete tasks
- Completion check feature
- Category classification (work/personal/study)
- View progress
I want it to run directly in the browser, and I'd like the data to persist even after refreshing. I want to build it with pure JavaScript without technical complexity.
```

#### Generating Step-by-Step Prompts

```
Convert this PRD into step-by-step prompts for use in Claude Code.
Summarize it into 5 key steps and create clear instructions for each step.
```

#### Step 1: Implement the basic structure and core features

```
Build the basic structure of the todo app.

Requirements:
1. Three files: index.html, style.css, script.js
2. HTML structure:
   - App title "My Tasks"
   - Task input (input field + add button)
   - A container to display the task list
3. JavaScript features:
   - Add tasks (support both Enter key and button click)
   - Delete tasks (an X button on each item)
   - Toggle complete/incomplete with a checkbox
   - Apply strikethrough styling to completed tasks
4. Save data to localStorage:
   - Auto-save on add/delete/completion changes
   - Persist data across page refreshes
5. Basic CSS styling:
   - Clean card-style layout
   - Centered, max width 600px
   - Hover effects and transitions

Store each task as { id, text, completed, createdAt }.
```

#### Step 2: Add category functionality and improve the UI

```
Add a category feature to the existing code and improve the UI.

Requirements:
1. Category feature:
   - Three categories: Work, Personal, Study
   - A category dropdown when adding a task
   - A colored category tag on each task item
   - Category filter buttons (All/Work/Personal/Study)
2. UI improvements:
   - Category colors: Work (blue #4A90E2), Personal (green #27AE60), Study (purple #8E44AD)
   - Place the filter buttons at the top
   - Highlight the selected filter button
   - Show the creation time on each task (e.g., "2 hours ago")
3. Data structure updates:
   - Add a category field
   - Save the filter state to localStorage as well

Automatically sort completed items to the bottom of the list.
```

#### Step 3: Add a progress dashboard

```
Add a progress dashboard and implement inline editing.

Requirements:
1. Progress dashboard:
   - Add a stats section at the top of the app
   - Overall progress: "5/10 done (50%)" format + a progress bar
   - Mini progress indicators per category (completed/total for each)
   - Show the number of tasks added today
2. Inline editing:
   - Double-click a task's text to enter edit mode
   - It becomes an input field so it can be edited
   - Enter saves, ESC cancels
   - A select box so the category can also be changed while editing
3. UI animations:
   - Smooth transitions for the progress bar
   - Fade animations when adding/deleting items
   - Slide animation when marking complete

The dashboard must update in real time.
```

#### Step 4: Dark Mode and Advanced Features

```
Implement dark mode and additional features.

Requirements:
1. Dark mode:
   - A dark/light mode toggle switch in the top right
   - Dark mode colors: background (#1A1A1A), cards (#2D2D2D), text (#E0E0E0)
   - Save the selected theme to localStorage
   - Smooth transition animation
2. Additional features:
   - "Clear all completed" button (with a confirmation dialog)
   - Task search (real-time filtering)
   - A badge showing the number of remaining tasks
   - Empty state message ("No tasks yet. Add one!")
3. Keyboard shortcuts:
   - Alt+N: focus the new task input
   - Alt+1,2,3,4: switch category filters
   - Alt+D: toggle dark mode
4. Responsive design:
   - Optimized for mobile (max-width: 480px)
   - Touch-friendly button sizes

Provide appropriate feedback for every interaction.
```

#### Step 5: Final completion and optimization

```
Finish the app and maximize its usability.

Requirements:
1. Data export/import:
   - Export data as JSON via a button
   - Import data via file upload
   - Confirm a backup of current data before importing
2. Sorting options:
   - Sort by creation date, category, or completion status
   - Persist the sort state
   - Manual reordering via drag and drop (sortable)
3. Performance optimization:
   - Smooth performance even with 100+ items
   - Apply debouncing (search, save)
   - Efficient DOM manipulation
4. Accessibility improvements:
   - Add ARIA labels
   - Focus management
   - Screen reader support
5. Extra improvements:
   - Warn about duplicate tasks
   - Undo for recently deleted items
   - Show a random daily quote
   - Encouraging messages based on the completion rate

Handle all edge cases and add error handling.
Add detailed comments to the code.
```

#### 04-2 Resuming Work and Boosting Efficiency

```
Please add a keyword-based automatic category classification feature to the current to-do management app.
```

#### 04-3 Improving Projects and Managing Your Work

```
[Image #1] The current design seems optimized for mobile. Please modify the design so that the UI can be viewed in full screen on a desktop environment. Save the revised design in a new folder called 'web_version'.
```

```
Find and explain the functions related to dark mode in the @script.js file.
```

```
Please analyze the files in the @web_version folder and check if the to-do app is optimized for the desktop environment.
```

---

### Chapter 5: Systematic Development and Management Through Game Building

#### 05-1 Creating reliable AI content

```
I want to build a general knowledge quiz game. Write a PRD.
Game rules:
- Four-option multiple choice quiz
- Categories: History, Science, Geography, Arts & Culture
- 10 questions per category, 40 questions total
- Instant feedback on correct/incorrect answers
- Final score and ranking records
```

```
Based on the PRD, organize the general knowledge quiz game into 3 step-by-step prompts I can implement with Claude Code.
```

#### Step 1: Core Quiz System

```
Step 1: Build the core quiz system
Goal
Implement an MVP (Minimum Viable Product) that supports basic quiz play
Scope
1.1 Initial project setup
- Set up the project structure (React or Vanilla JS)
- Build the basic HTML/CSS layout
- Design the state management structure
1.2 Question data structure and management
javascript// Example question data structure
{
  id: 1,
  category: "History",
  difficulty: "medium",
  question: "Who founded the Mongol Empire?",
  options: ["Genghis Khan", "Kublai Khan", "Ogedei Khan", "Tamerlane"],
  correctAnswer: 0,
  explanation: "Genghis Khan united the Mongol tribes and founded the Mongol Empire in 1206."
}

Hardcode 10 questions per category (40 total)
Question loading and management system
Filtering questions by category

1.3 Game flow logic
javascript// Key functions to implement
- initGame(): initialize the game
- loadQuestion(): load and display a question
- handleAnswer(): process an answer
- showFeedback(): show correct/incorrect feedback
- nextQuestion(): move to the next question
- endGame(): handle game over
1.4 Basic UI

Start screen (start button)
Quiz screen (question, 4 options, progress)
Instant feedback UI (correct/incorrect indicator)
Simple results screen (total score, number correct)

Test checklist

 Are all 40 questions presented in sequence?
 Is correct/incorrect judged accurately?
 Is feedback shown immediately?
 Are results displayed when the game ends?
```

#### Step 2: Scoring System and Game Modes

```
 Step 2: Scoring system and game mode expansion
Goal
Implement multiple game modes and a refined scoring system
Scope
2.1 Scoring system
javascript// Score calculation logic
class ScoreManager {
  calculateScore(isCorrect, timeSpent, consecutiveCorrect, hintUsed) {
    let score = 0;
    if (isCorrect) {
      score += 10; // base score
      if (timeSpent < 10) score += 3; // time bonus
      if (!hintUsed) score += 2; // no-hint bonus
      score += this.getConsecutiveBonus(consecutiveCorrect);
    }
    return score;
  }
}
2.2 Game modes
javascript// Game mode settings
const gameModes = {
  full: { questions: 40, timeLimit: null },
  category: { questions: 10, timeLimit: null },
  speed: { questions: 20, timeLimit: 15 } // 15 seconds per question
};

Full challenge mode (40 questions)
Per-category challenge mode
Speed quiz mode (time limit)

2.3 Advanced features

Hint system (remove 2 wrong options, 3 uses per game)
Pause feature
Per-question timer
Consecutive-correct combo system

2.4 Detailed result analysis
javascript// Result data structure
{
  totalScore: 350,
  correctAnswers: 32,
  totalQuestions: 40,
  accuracy: 80,
  categoryStats: {
    "History": { correct: 8, total: 10 },
    "Science": { correct: 7, total: 10 },
    // ...
  },
  averageResponseTime: 12.5,
  longestStreak: 7
}
Test checklist

 Is the score calculated correctly?
 Does each game mode work properly?
 Does the hint feature work correctly?
 Does the timer run accurately?
 Is the result analysis accurate?
```

#### Step 3: Data Persistence and Ranking System

```
Step 3: Data persistence and ranking system
Goal
Complete user record storage and the leaderboard feature
Scope
3.1 Using local storage
javascript// Local data management
class LocalDataManager {
  saveGameResult(result) {
    const history = this.getGameHistory();
    history.push({
      ...result,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('gameHistory', JSON.stringify(history));
  }
  
  getBestScore() {
    const history = this.getGameHistory();
    return Math.max(...history.map(h => h.totalScore));
  }
}
3.2 Ranking system
javascript// Leaderboard structure
const leaderboard = {
  daily: [],
  weekly: [],
  allTime: [],
  byCategory: {
    "History": [],
    "Science": [],
    // ...
  }
};

Local leaderboard (in the browser)
Ranking display (top 10)
Personal best tracking

3.3 Statistics and progress

Track play counts
Per-category accuracy statistics
Growth graph (score trend over time)
Personal dashboard

3.4 UI/UX improvements

Add CSS animations
Apply responsive design
Dark mode support
Mobile optimization
Accessibility improvements (keyboard navigation)

3.5 Additional features

Expand the question pool (20+ questions per category)
Difficulty options
Sound effects (optional)
Result sharing (copy to clipboard)

Test checklist

 Are game results saved?
 Are rankings calculated correctly?
 Are statistics displayed correctly?
 Does the responsive design work?
 Does the data persist after a browser refresh?
```

#### Quiz Verification and Improvement

```
Quiz Question Validation Guidelines
Checklist for every question you write
1. Is there exactly one correct answer?
- If other interpretations are possible, state the criteria (e.g., by area, as of 2024)
2. Do superlative expressions have a stated basis?
- Specify the measurement basis for "largest," "first," etc.
3. Are the time frame and scope clear?
- State the point in time for information that can change
- Limit the geographic and categorical scope
4. Has it been verified?
- Check at least two sources for questionable information
- For contested topics, follow mainstream scholarship
```

```
Show me the contents of this project's CLAUDE.md.
```

```
Review the questions created so far against the guidelines we just saved. If any quiz questions or answers don't meet the guidelines, fix them accordingly.
```

#### 05-2 Boosting development efficiency through automation

```
Create a custom commands folder for the current project.
Create the .claude/commands directory and show me the structure.
```

```
Create the file .claude/commands/quiz-validate.md.
Find any quiz questions containing superlative expressions such as 'most', 'first', or 'largest', and show them as a list.
```

```
Modify .claude/commands/quiz-validate.md as follows.
If the user specifies a category, validate only that category's questions;
if not, validate all questions.
Use the value passed in $ARGUMENTS as the category.
During validation, look for ambiguous expressions such as 'most', 'first', or 'largest'
and explain which criteria need to be stated.
```

```
Create .claude/commands/quiz-range.md.
Build a feature that reviews questions from number $1 to number $2.
Have it check question difficulty and answer distribution.
```

```
Create .claude/commands/quiz-add.md.
Build a command that adds a new quiz question.
Take $1 as the category and $2 as the difficulty.
Match the format of the existing questions, and make sure it strictly follows the verification guidelines.
```

#### 05-3 Maintenance strategies learned through the use of custom commands

```
Create .claude/commands/quiz-check.md.
It should verify the accuracy of every question's answer.
Create .claude/commands/quiz-stats.md.
It should manage the quiz game's statistics.
Create .claude/commands/quiz-leaderboard.md.
It should manage the ranking system.
```

```
Use /quiz-check to verify all questions, /quiz-stats to analyze statistics, and /quiz-leaderboard to update the leaderboard—all in a single request.
```

```
Create .claude/commands/quiz-daily.md and make it perform the following tasks in order.
1. Read and understand the structure of the file containing the quiz questions
2. Check the current question count and distribution
3. Identify gaps in each category
4. Check for duplicates before adding new questions
5. Validate the format after adding questions
6. Back up all data
7. Report the results in detail
Verify each step, and if any step fails, stop immediately and report the error.
```

```
Now I want to build a teacher mode that shows and compares the scores of multiple students who took the quiz at a glance.
Design and create the custom commands needed for this feature yourself.
Also create an integrated command that runs all of them together.
Every command must be saved as its own .md file inside the '.claude/commands/' folder.
When you're done, report the custom commands you created and what each one does.
```

```
Modify .claude/commands/create-report.md as follows.
Change the grade display to relative grading based on percentile, shown like this:
- Top 20%: A
- Top 40%: B
- Top 70%: C
- Bottom 30%: D
```

```
Create a new file, .claude/commands/export-report.md.
It should read teacher_report.html and save it as CSV or PDF,
and add this command to teacher-dashboard.md.
```

---

### Chapter 6: Giving Claude Code Wings with APIs

```
I've saved my OpenRouter API key in a .env file. Set things up so this key can be used safely.
```

```
Now test that the prepared API actually works.
Use the google/gemma-4-26b-a4b-it:free model for image recognition,
and the openai/gpt-oss-20b:free model for text.
Test both text and image recognition through the API and report the results.
```

#### Building the FridgeChef App (3 Steps)


```
Using the OpenRouter API we set up earlier, I want to build a web application that recognizes ingredients in a fridge photo and recommends recipes. Split it into 3 steps and write a PRD for each.
Step 1 takes an image as input and recognizes it using the google/gemma-4-26b-a4b-it:free model.
Step 2 generates recipes from the Step 1 results using the openai/gpt-oss-20b:free model.
Step 3 creates user profiles and saves recipes.
Save the steps as PRD_step1.md, PRD_step2.md, and PRD_step3.md.
```

```
Execute PRD_step1.md.
```

```
The app works, but it still looks like a default Streamlit page. Give all three steps one shared look.
Put the styling in a single ui.py module so every step imports the same theme.
Use a warm cooking palette: orange #FF6B35 for accents, a cream background, white cards with soft shadows, and rounded corners.
Add a gradient title, a three-step "how it works" strip so the first screen is not mostly empty,
and hide the Streamlit toolbar, Deploy button, and sidebar collapse arrow so screenshots show only the app.
Keep every screen compact enough to fit a wide browser window without scrolling:
one-line page header, tight spacing, a capped height on the photo preview,
and the recognized ingredients in a two-column grid rather than a stack of expanders.
```

```
Run the main application and test the Step 1 results.
```

```
Now execute PRD_step2.md.
```

```
Run the main application so I can test the Step 2 results.
```

```
Now execute PRD_step3.md.
```

```
Run the main application so I can test the Step 3 results.
```

---

### Chapter 7: Building a Development Team with Claude Code AI Agents

#### Creating AI Agents

**Code quality reviewer agent:**
```
Create a subagent called code-bug-analyzer that works only in this project. It is a code quality reviewer that checks for bugs, coding rule violations and performance problems. Give it read-only access only, and run it on opus. Save it as .claude/agents/code-bug-analyzer.md
```

```
Have code-bug-analyzer review the code of the 'Please Take Care of My Refrigerator' application.
```

**System optimization engineer agent:**
```
Create a second subagent called performance-optimizer. It is a performance engineer that speeds the app up and removes bottlenecks. Save it as .claude/agents/performance-optimizer.md
```

**User experience expert agent:**
```
Create a third subagent called ux-design-advisor. It is a user experience designer that reviews the layout and the interface and makes the app easier to use. Save it as .claude/agents/ux-design-advisor.md
```

#### Multi-Agent Collaboration

```
Have code-bug-analyzer review the entire 'Please Take Care of My Refrigerator' application code, then have performance-optimizer fix the identified issues and optimize performance, and finally have ux-design-advisor improve the user experience.
```

```
Run the improved app so I can check it in the browser
```

```
Back up the current state.
```

```
Restore from backup.
```

#### Creating the Five-Agent Team

```
Create five subagents in the .claude/agents/ folder. product-manager-prd writes the PRD and manages the schedule, backend-architect designs the server and the APIs, frontend-developer builds the interface, qa-engineer handles testing and code review, and ai-integration-specialist connects the OpenRouter API. Set the model to sonnet for each of them.
```

#### AI Empathy Diary

```
Please create an AI empathy diary application, where, if the user writes a one-line summary of their day, the AI analyzes their emotions, offers empathy, and provides words of comfort.
The backend architect should implement the features for emotion analysis and empathetic message generation by integrating the OpenRouter API. Please use the free openai/gpt-oss-20b:free model and the API key stored in the .env file within the current directory.
The frontend developer should design a diary UI that evokes a warm and comforting atmosphere.
Finally, the QA engineer should test the application to ensure it functions smoothly across various scenarios. Any issues found must be fully resolved, and the final version should be delivered as an index.html file that can be opened directly in a web browser.
```


#### PDF Summarizer App

```
We're going to create a web application where you can upload a PDF document and the AI will summarize it.
First, product-manager-prd will write a detailed PRD and feature specifications for the PDF document summary app and then the backend-architect will implement the PDF file upload and text extraction features.
The ai-integration-specialist will integrate the OpenRouter API to summarize the extracted text.
Use the free openai/gpt-oss-20b:free model, and use the API key stored in the '.env' file in the current folder. The frontend-developer will implement a drag-and-drop file upload UI and a clean interface to display the summary results,
The qa-engineer should test to ensure everything works smoothly in various scenarios. If any issues are found, fix them completely, and create the final version as an 'index_pdf.html' file that can be opened directly in the browser.
```

---

### Chapter 8: Going Beyond Claude Code's Limits with MCP

#### Installing and Using MCP Servers

**Notion MCP:**
```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

```
Search for and summarize the latest Claude Code updates and changes. Then save the results to Notion using the Notion MCP.
```

**Sequential Thinking MCP:**

When running in Windows **PowerShell**:
```powershell
claude mcp add sequential-thinking -s local -- npx @modelcontextprotocol/server-sequential-thinking@latest
```

(Reference) When running in the Windows Command Prompt (cmd):
```cmd
claude mcp add sequential-thinking -s local -- cmd /c npx -y @modelcontextprotocol/server-sequential-thinking@latest
```

```
I want to double the average time visitors spend on my web portfolio. Write two documents.
1. Come up with a plan to achieve this goal and save it to Notion via the Notion MCP as 'Increasing Dwell Time'.
2. Use the Sequential Thinking MCP to develop a systematic plan for the same goal and save it to Notion via the Notion MCP as 'Increasing Dwell Time - Systematic Plan'.
```

**Context7 MCP server:**
```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: YOUR_API_KEY"
```


**Playwright MCP:**

When running in Windows **PowerShell**:
```powershell
claude mcp add playwright -- npx @playwright/mcp@latest
```

(Reference) When running in the Windows Command Prompt (cmd):
```cmd
claude mcp add playwright -- cmd /c npx @playwright/mcp@latest
```

```
Build a shopping list app. Make it a simple web UI with add, delete, and check-off features that runs in the local browser.
```

```
Use the Playwright MCP to automatically test every feature of this shopping list app. Verify that adding, deleting, and checking off items all work correctly.
```

**GitHub MCP:**
```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp -H 'Authorization: Bearer $(grep GITHUB_PAT .env | cut -d '=' -f2)'
```

```
I want to save the shopping list app in the current folder to GitHub. Use the GitHub MCP to create a repository named shopping-listapp and upload it.
```

**Vercel:**
```
Rename the shopping list app's shopping -list.html file to index.html and upload it to GitHub.
```

**Supabase MCP:**

When running in Windows **PowerShell**:
```powershell
claude mcp add --transport http supabase "https://mcp.supabase.com/mcp"
```

(Reference) When running in the Windows Command Prompt (cmd):
```cmd
claude mcp add supabase -s local -e SUPABASE_ACCESS_TOKEN=<Supabase API token> -- cmd /c npx -y @supabase/mcp-server-supabase@latest
```

```
Use the Supabase MCP to connect our shopping list app to a database. Create a table named shopping_items, and modify the code so the data currently stored in local storage is saved to the Supabase database instead. When the changes are done, commit and push to GitHub.
```

---

Great work — you made it to the end!
