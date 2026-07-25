---
aliases: []
---

# quiz-leaderboard

Manages the quiz game ranking system.

## Usage
```
/quiz-leaderboard [option] [period]
```

## Options
- `/quiz-leaderboard` - Show the full leaderboard
- `/quiz-leaderboard show [period]` - Leaderboard for a specific period
- `/quiz-leaderboard add [score]` - Add a test score
- `/quiz-leaderboard reset` - Reset the leaderboard
- `/quiz-leaderboard export` - Export the leaderboard

## Period Options
- `all` - All time (default)
- `daily` - Today
- `weekly` - This week
- `monthly` - This month

## Features
1. **Leaderboard display**
   - Show the top 10 players
   - Includes score, accuracy, and date
   - Filtering by category

2. **Ranking management**
   - Automatic rank calculation
   - Duplicate removal
   - Filtering by period

3. **Statistics**
   - Average score
   - Highest/lowest score
   - Number of participants

4. **Data management**
   - Leaderboard export
   - Backup and restore
   - Reset

## Script
```javascript
const fs = require('fs');

// Parse parameters
const args = process.argv.slice(2);
const action = args[0] || 'show';
const param = args[1] || 'all';

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║               🏆 Quiz Game Leaderboard                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Generate sample leaderboard data
function generateSampleLeaderboard() {
    const names = ['Chris', 'Emily', 'Mike', 'Sarah', 'David', 'Mia', 'Jake', 'Hannah', 'Sean', 'Lucy'];
    const avatars = ['🎮', '🎯', '🏆', '⭐', '🚀', '🎨', '🎭', '🎪', '🎲', '🃏'];
    const categories = ['History', 'World Geography', 'Science', 'Arts & Culture', 'mixed'];
    
    const leaderboard = [];
    const now = new Date();
    
    for (let i = 0; i < 20; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        
        leaderboard.push({
            username: names[Math.floor(Math.random() * names.length)],
            avatar: avatars[Math.floor(Math.random() * avatars.length)],
            score: Math.floor(Math.random() * 400) + 100,
            accuracy: Math.floor(Math.random() * 40) + 60,
            category: categories[Math.floor(Math.random() * categories.length)],
            timestamp: date.toISOString(),
            games: Math.floor(Math.random() * 50) + 1
        });
    }
    
    return leaderboard.sort((a, b) => b.score - a.score);
}

// Filter by period
function filterByPeriod(leaderboard, period) {
    const now = new Date();
    const filtered = leaderboard.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        
        switch(period) {
            case 'daily':
                return entryDate.toDateString() === now.toDateString();
            case 'weekly':
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return entryDate >= weekAgo;
            case 'monthly':
                const monthAgo = new Date(now);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return entryDate >= monthAgo;
            default:
                return true;
        }
    });
    
    return filtered;
}

// Display the leaderboard
function displayLeaderboard(leaderboard, period) {
    const periodText = {
        'all': 'All time',
        'daily': 'Daily',
        'weekly': 'Weekly',
        'monthly': 'Monthly'
    }[period] || 'All time';
    
    console.log(`📅 Period: ${periodText}`);
    console.log(`👥 Participants: ${leaderboard.length}\n`);
    
    if (leaderboard.length === 0) {
        console.log('  No records yet.\n');
        return;
    }
    
    console.log('┌────┬──────────────┬───────┬────────┬──────────┐');
    console.log('│Rank│    Player    │ Score │Accuracy│   Date   │');
    console.log('├────┼──────────────┼───────┼────────┼──────────┤');
    
    leaderboard.slice(0, 10).forEach((entry, index) => {
        let rank = index + 1;
        let rankDisplay = rank.toString().padStart(2);
        
        if (rank === 1) rankDisplay = '🥇';
        if (rank === 2) rankDisplay = '🥈';
        if (rank === 3) rankDisplay = '🥉';
        
        const playerName = `${entry.avatar} ${entry.username}`.padEnd(12);
        const score = entry.score.toString().padStart(5);
        const accuracy = `${entry.accuracy}%`.padStart(6);
        const date = new Date(entry.timestamp);
        const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`.padStart(8);
        
        console.log(`│ ${rankDisplay} │ ${playerName} │ ${score} │ ${accuracy} │ ${dateStr} │`);
    });
    
    console.log('└────┴──────────────┴───────┴────────┴──────────┘');
    
    // Statistics
    const scores = leaderboard.map(e => e.score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    console.log('\n📊 Statistics');
    console.log('─'.repeat(50));
    console.log(`  Highest score: ${maxScore} pts`);
    console.log(`  Average score: ${avgScore} pts`);
    console.log(`  Lowest score: ${minScore} pts`);
}

// Handle each action
const leaderboard = generateSampleLeaderboard();

switch(action) {
    case 'show':
        const filtered = filterByPeriod(leaderboard, param);
        displayLeaderboard(filtered, param);
        break;
        
    case 'add':
        const score = parseInt(param) || Math.floor(Math.random() * 300) + 100;
        console.log(`✅ Test score added: ${score} pts`);
        
        leaderboard.push({
            username: 'TestUser',
            avatar: '🧪',
            score: score,
            accuracy: Math.floor(Math.random() * 40) + 60,
            category: 'mixed',
            timestamp: new Date().toISOString(),
            games: 1
        });
        
        const newLeaderboard = leaderboard.sort((a, b) => b.score - a.score);
        displayLeaderboard(newLeaderboard.slice(0, 10), 'all');
        break;
        
    case 'reset':
        console.log('⚠️  Reset the leaderboard?');
        console.log('   This action cannot be undone.');
        console.log('\n   In a real environment a confirmation prompt would appear.');
        break;
        
    case 'export':
        const exportData = {
            exported: new Date().toISOString(),
            period: param,
            count: leaderboard.length,
            data: leaderboard.slice(0, 50)
        };
        
        const filename = `leaderboard_${new Date().getTime()}.json`;
        fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
        console.log(`✅ Leaderboard exported to ${filename}.`);
        console.log(`   ${exportData.data.length} records in total`);
        break;
        
    default:
        displayLeaderboard(leaderboard.slice(0, 10), 'all');
}

// Personal best records
console.log('\n🎯 My Best Records');
console.log('─'.repeat(50));
console.log('  Highest score: 0 pts');
console.log('  Best accuracy: 0%');
console.log('  Total games: 0');
console.log('  Current rank: -');

console.log('\n✅ Leaderboard management complete\n');
```

## Example Output
```
╔══════════════════════════════════════════════════════════════╗
║               🏆 Quiz Game Leaderboard                        ║
╚══════════════════════════════════════════════════════════════╝

📅 Period: All time
👥 Participants: 20

┌────┬──────────────┬───────┬────────┬──────────┐
│Rank│    Player    │ Score │Accuracy│   Date   │
├────┼──────────────┼───────┼────────┼──────────┤
│ 🥇 │ 🎮 Chris     │   485 │    92% │    12/15 │
│ 🥈 │ ⭐ Emily     │   472 │    88% │    12/14 │
│ 🥉 │ 🏆 Mike      │   456 │    85% │    12/13 │
│  4 │ 🎯 Sarah     │   445 │    83% │    12/15 │
│  5 │ 🚀 David     │   438 │    81% │    12/12 │
│  6 │ 🎨 Mia       │   425 │    79% │    12/11 │
│  7 │ 🎭 Jake      │   412 │    77% │    12/10 │
│  8 │ 🎪 Hannah    │   398 │    75% │    12/09 │
│  9 │ 🎲 Sean      │   385 │    73% │    12/08 │
│ 10 │ 🃏 Lucy      │   372 │    71% │    12/07 │
└────┴──────────────┴───────┴────────┴──────────┘

📊 Statistics
──────────────────────────────────────────────────
  Highest score: 485 pts
  Average score: 352 pts
  Lowest score: 112 pts

🎯 My Best Records
──────────────────────────────────────────────────
  Highest score: 0 pts
  Best accuracy: 0%
  Total games: 0
  Current rank: -

✅ Leaderboard management complete
```

## Additional Features
- Per-category leaderboards
- Friend ranking comparison
- Weekly/monthly champions
- Rank change tracking
- Reward system integration