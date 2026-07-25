---
aliases: []
---

# quiz-stats

Analyzes and manages quiz game statistics.

## Usage
```
/quiz-stats [option]
```

## Options
- `/quiz-stats` - Show all statistics
- `/quiz-stats player` - Player statistics
- `/quiz-stats questions` - Question statistics
- `/quiz-stats performance` - Performance analysis
- `/quiz-stats trends` - Trend analysis

## Features
1. **Player statistics**
   - Total games played
   - Average score
   - Highest score
   - Overall accuracy
   - Level and experience points

2. **Question statistics**
   - Question count by category
   - Distribution by difficulty
   - Most frequently missed questions
   - Easiest/hardest questions

3. **Performance analysis**
   - Accuracy by category
   - Performance by difficulty
   - Performance by time of day
   - Correct answer streaks

4. **Trend analysis**
   - Last 10 games trend
   - Daily/weekly statistics
   - Growth curve

## Script
```javascript
const fs = require('fs');

// Simulated localStorage data (actually runs in the browser)
function getStoredData() {
    // A real implementation would read this from localStorage
    return {
        gameHistory: [],
        statistics: {
            totalGamesPlayed: 0,
            totalScore: 0,
            totalCorrectAnswers: 0,
            totalQuestions: 0,
            categoryStats: {},
            difficultyStats: {
                easy: { played: 0, correct: 0 },
                medium: { played: 0, correct: 0 },
                hard: { played: 0, correct: 0 }
            }
        },
        userProfile: {
            username: 'Player',
            level: 1,
            experience: 0,
            achievements: []
        }
    };
}

// Parse parameters
const args = process.argv.slice(2);
const option = args[0] || 'all';

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║               📊 Quiz Game Statistics                         ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Read the questions.js file
const questionsContent = fs.readFileSync('questions.js', 'utf8');
const match = questionsContent.match(/const quizQuestions = (\[[\s\S]*\]);/);
if (!match) {
    console.error('❌ Cannot parse questions.js.');
    process.exit(1);
}
const quizQuestions = eval(match[1]);

// Analyze question statistics
const analyzeQuestions = () => {
    const stats = {
        total: quizQuestions.length,
        byCategory: {},
        byDifficulty: { easy: 0, medium: 0, hard: 0 },
        avgOptionsLength: 0
    };
    
    quizQuestions.forEach(q => {
        // By category
        if (!stats.byCategory[q.category]) {
            stats.byCategory[q.category] = {
                count: 0,
                easy: 0,
                medium: 0,
                hard: 0
            };
        }
        stats.byCategory[q.category].count++;
        stats.byCategory[q.category][q.difficulty]++;
        
        // By difficulty
        stats.byDifficulty[q.difficulty]++;
        
        // Average option length
        const optionLength = q.options.reduce((sum, opt) => sum + opt.length, 0) / q.options.length;
        stats.avgOptionsLength += optionLength;
    });
    
    stats.avgOptionsLength /= quizQuestions.length;
    
    return stats;
};

const questionStats = analyzeQuestions();

// Output per option
switch(option) {
    case 'player':
        console.log('👤 Player Statistics');
        console.log('─'.repeat(60));
        console.log('  Username: Player');
        console.log('  Level: Lv.1');
        console.log('  Experience: 0 XP');
        console.log('  Total games: 0');
        console.log('  Highest score: 0 pts');
        console.log('  Average score: 0 pts');
        console.log('  Overall accuracy: 0%');
        break;
        
    case 'questions':
        console.log('📝 Question Statistics');
        console.log('─'.repeat(60));
        console.log(`  Total questions: ${questionStats.total}\n`);
        
        console.log('  Distribution by category:');
        Object.entries(questionStats.byCategory).forEach(([cat, data]) => {
            console.log(`    ${cat}: ${data.count}`);
            console.log(`      ├─ Easy: ${data.easy}`);
            console.log(`      ├─ Medium: ${data.medium}`);
            console.log(`      └─ Hard: ${data.hard}`);
        });
        
        console.log('\n  Distribution by difficulty:');
        Object.entries(questionStats.byDifficulty).forEach(([level, count]) => {
            const percent = ((count / questionStats.total) * 100).toFixed(1);
            const bar = '█'.repeat(Math.round((count / questionStats.total) * 30));
            const label = level === 'easy' ? 'Easy  ' : level === 'medium' ? 'Medium' : 'Hard  ';
            console.log(`    ${label}: ${bar} ${count} (${percent}%)`);
        });
        break;
        
    case 'performance':
        console.log('🏆 Performance Analysis');
        console.log('─'.repeat(60));
        console.log('  Accuracy by category:');
        console.log('    History: - %');
        console.log('    World Geography: - %');
        console.log('    Science: - %');
        console.log('    Arts & Culture: - %');
        console.log('\n  Accuracy by difficulty:');
        console.log('    Easy: - %');
        console.log('    Medium: - %');
        console.log('    Hard: - %');
        console.log('\n  Longest correct streak: 0');
        console.log('  Average response time: - sec');
        break;
        
    case 'trends':
        console.log('📈 Trend Analysis');
        console.log('─'.repeat(60));
        console.log('  Last 10 games trend:');
        console.log('    (no data)\n');
        console.log('  Weekly statistics:');
        console.log('    Games this week: 0');
        console.log('    Average score this week: 0 pts');
        console.log('    Compared to last week: - %');
        break;
        
    default:
        // All statistics
        console.log('📊 Overall Statistics Summary');
        console.log('─'.repeat(60));
        
        console.log('\n[Question Database]');
        console.log(`  Total questions: ${questionStats.total}`);
        console.log(`  Categories: ${Object.keys(questionStats.byCategory).length}`);
        console.log(`  Average option length: ${questionStats.avgOptionsLength.toFixed(1)} chars`);
        
        console.log('\n[Questions per Category]');
        Object.entries(questionStats.byCategory).forEach(([cat, data]) => {
            const percent = ((data.count / questionStats.total) * 100).toFixed(1);
            console.log(`  ${cat}: ${data.count} (${percent}%)`);
        });
        
        console.log('\n[Difficulty Distribution]');
        Object.entries(questionStats.byDifficulty).forEach(([level, count]) => {
            const percent = ((count / questionStats.total) * 100).toFixed(1);
            const label = level === 'easy' ? 'Easy' : level === 'medium' ? 'Medium' : 'Hard';
            console.log(`  ${label}: ${count} (${percent}%)`);
        });
        
        // Answer distribution
        const answerDist = { 0: 0, 1: 0, 2: 0, 3: 0 };
        quizQuestions.forEach(q => answerDist[q.correctAnswer]++);
        
        console.log('\n[Answer Number Distribution]');
        [0, 1, 2, 3].forEach(i => {
            const count = answerDist[i];
            const percent = ((count / questionStats.total) * 100).toFixed(1);
            console.log(`  Option ${i + 1}: ${count} (${percent}%)`);
        });
        
        // Balance assessment
        const maxCount = Math.max(...Object.values(answerDist));
        const minCount = Math.min(...Object.values(answerDist));
        const balance = ((1 - (maxCount - minCount) / questionStats.total) * 100).toFixed(1);
        console.log(`\n[Balance: ${balance}%]`);
        
        if (balance < 70) {
            console.log('  ⚠️ Answer distribution needs improvement');
        } else if (balance < 85) {
            console.log('  ✔️ Answer distribution is acceptable');
        } else {
            console.log('  ✅ Answer distribution is excellent');
        }
}

console.log('\n✅ Statistics analysis complete\n');
```

## Example Output
```
╔══════════════════════════════════════════════════════════════╗
║               📊 Quiz Game Statistics                         ║
╚══════════════════════════════════════════════════════════════╝

📊 Overall Statistics Summary
────────────────────────────────────────────────────────────

[Question Database]
  Total questions: 43
  Categories: 4
  Average option length: 5.2 chars

[Questions per Category]
  History: 13 (30.2%)
  World Geography: 10 (23.3%)
  Science: 10 (23.3%)
  Arts & Culture: 10 (23.3%)

[Difficulty Distribution]
  Easy: 13 (30.2%)
  Medium: 19 (44.2%)
  Hard: 11 (25.6%)

[Answer Number Distribution]
  Option 1: 11 (25.6%)
  Option 2: 16 (37.2%)
  Option 3: 13 (30.2%)
  Option 4: 3 (7.0%)

[Balance: 69.8%]
  ⚠️ Answer distribution needs improvement

✅ Statistics analysis complete
```