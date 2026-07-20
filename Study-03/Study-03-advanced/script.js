// Game state management
let gameState = {
    currentQuestionIndex: 0,
    score: 0,
    correctAnswers: 0,
    answers: [],
    categoryScores: {
        "History": { correct: 0, total: 0 },
        "World Geography": { correct: 0, total: 0 },
        "Science": { correct: 0, total: 0 },
        "Arts & Culture": { correct: 0, total: 0 }
    },
    isAnswered: false,
    consecutiveCorrect: 0,
    currentGameMode: 'full',
    questionStartTime: 0,
    timeSpent: 0,
    hintUsed: false,
    timerInterval: null,
    totalQuestions: 40
};

// Score manager class
class ScoreManager {
    calculateScore(isCorrect, timeSpent, consecutiveCorrect, hintUsed) {
        let score = 0;
        if (isCorrect) {
            score += 10;
            if (timeSpent < 5) score += 5;
            else if (timeSpent < 10) score += 3;
            if (!hintUsed) score += 2;
            score += this.getConsecutiveBonus(consecutiveCorrect);
        }
        return score;
    }

    getConsecutiveBonus(consecutive) {
        if (consecutive >= 10) return 5;
        if (consecutive >= 7) return 3;
        if (consecutive >= 5) return 2;
        if (consecutive >= 3) return 1;
        return 0;
    }

    getScoreBreakdown(isCorrect, timeSpent, consecutiveCorrect, hintUsed) {
        const breakdown = [];
        if (isCorrect) {
            breakdown.push({ label: 'Correct answer', points: 10 });
            if (timeSpent < 5) {
                breakdown.push({ label: 'Fast response', points: 5 });
            } else if (timeSpent < 10) {
                breakdown.push({ label: 'Time bonus', points: 3 });
            }
            if (!hintUsed) {
                breakdown.push({ label: 'No hint', points: 2 });
            }
            const consecutiveBonus = this.getConsecutiveBonus(consecutiveCorrect);
            if (consecutiveBonus > 0) {
                breakdown.push({ label: `${consecutiveCorrect} in a row`, points: consecutiveBonus });
            }
        }
        return breakdown;
    }
}

const scoreManager = new ScoreManager();

// Game mode settings
const gameModes = {
    full: {
        name: 'Full Challenge',
        questions: 40,
        timeLimit: null,
        description: '40 questions from all categories',
        categories: ['History', 'World Geography', 'Science', 'Arts & Culture']
    },
    category: {
        name: 'By Category',
        questions: 10,
        timeLimit: null,
        description: '10 questions from a chosen category',
        categories: null
    },
    speed: {
        name: 'Speed Quiz',
        questions: 20,
        timeLimit: 15,
        description: '15-second limit per question',
        categories: ['History', 'World Geography', 'Science', 'Arts & Culture']
    }
};

// DOM elements
const startScreen = document.getElementById('startScreen');
const quizScreen = document.getElementById('quizScreen');
const resultScreen = document.getElementById('resultScreen');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const feedbackModal = document.getElementById('feedbackModal');

// Initialize the game
function initGame(mode = 'full', category = null) {
    const selectedMode = gameModes[mode];

    gameState = {
        currentQuestionIndex: 0,
        score: 0,
        correctAnswers: 0,
        answers: [],
        categoryScores: {
            "History": { correct: 0, total: 0 },
            "World Geography": { correct: 0, total: 0 },
            "Science": { correct: 0, total: 0 },
            "Arts & Culture": { correct: 0, total: 0 }
        },
        isAnswered: false,
        consecutiveCorrect: 0,
        currentGameMode: mode,
        questionStartTime: 0,
        timeSpent: 0,
        hintUsed: false,
        timerInterval: null,
        totalQuestions: selectedMode.questions,
        selectedCategory: category,
        timeLimit: selectedMode.timeLimit
    };

    // Select questions
    selectQuestions(mode, category);

    // Switch screens
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');
    resultScreen.classList.remove('active');
    feedbackModal.classList.remove('show');

    // Load the first question
    loadQuestion();
}

// Select questions
function selectQuestions(mode, category) {
    let availableQuestions = [...quizQuestions];

    // Filter by category
    if (mode === 'category' && category) {
        availableQuestions = availableQuestions.filter(q => q.category === category);
    }

    // Shuffle questions
    availableQuestions.sort(() => Math.random() - 0.5);

    // Take as many as needed
    gameState.selectedQuestions = availableQuestions.slice(0, gameState.totalQuestions);
}

// Load and display a question
function loadQuestion() {
    const question = gameState.selectedQuestions[gameState.currentQuestionIndex];

    // Reset timing
    gameState.questionStartTime = Date.now();
    gameState.hintUsed = false;

    // Start the timer in speed mode
    if (gameState.currentGameMode === 'speed') {
        startTimer();
    }

    // Update progress
    updateProgress();

    // Update category badge
    document.getElementById('categoryBadge').textContent = question.category;

    // Display question text
    document.getElementById('questionText').textContent = question.question;

    // Create answer options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.onclick = () => handleAnswer(index);
        optionsContainer.appendChild(button);
    });

    // Reset state
    gameState.isAnswered = false;
}

// Start the timer
function startTimer() {
    clearInterval(gameState.timerInterval);
    let timeRemaining = gameState.timeLimit;

    updateTimerDisplay(timeRemaining);

    gameState.timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay(timeRemaining);

        if (timeRemaining <= 0) {
            clearInterval(gameState.timerInterval);
            handleAnswer(-1); // Time is up
        }
    }, 1000);
}

// Update the timer display
function updateTimerDisplay(seconds) {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = `${seconds}s`;
        if (seconds <= 5) {
            timerElement.classList.add('warning');
        } else {
            timerElement.classList.remove('warning');
        }
    }
}

// Handle an answer
function handleAnswer(selectedIndex) {
    if (gameState.isAnswered) return;

    gameState.isAnswered = true;
    clearInterval(gameState.timerInterval);

    const question = gameState.selectedQuestions[gameState.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctAnswer;

    // Calculate elapsed time
    gameState.timeSpent = (Date.now() - gameState.questionStartTime) / 1000;

    // Update per-category score
    gameState.categoryScores[question.category].total++;

    // Handle correct/incorrect answer
    if (isCorrect) {
        gameState.correctAnswers++;
        gameState.consecutiveCorrect++;
        const earnedScore = scoreManager.calculateScore(
            true,
            gameState.timeSpent,
            gameState.consecutiveCorrect,
            gameState.hintUsed
        );
        gameState.score += earnedScore;
        gameState.categoryScores[question.category].correct++;
    } else {
        gameState.consecutiveCorrect = 0;
    }

    // Save the answer
    gameState.answers.push({
        questionId: question.id,
        selected: selectedIndex,
        correct: question.correctAnswer,
        isCorrect: isCorrect
    });

    // UI feedback
    showAnswerFeedback(selectedIndex, question.correctAnswer, isCorrect);

    // Show the feedback modal
    setTimeout(() => {
        showFeedback(isCorrect, question.explanation);
    }, 1000);
}

// Answer feedback UI
function showAnswerFeedback(selectedIndex, correctIndex, isCorrect) {
    const buttons = document.querySelectorAll('.option-btn');

    // Disable all buttons
    buttons.forEach(btn => btn.classList.add('disabled'));

    // Highlight the selected answer
    if (isCorrect) {
        buttons[selectedIndex].classList.add('correct');
    } else {
        buttons[selectedIndex].classList.add('incorrect');
        buttons[correctIndex].classList.add('correct');
    }
}

// Show the feedback modal
function showFeedback(isCorrect, explanation) {
    const feedbackIcon = document.getElementById('feedbackIcon');
    const feedbackTitle = document.getElementById('feedbackTitle');
    const feedbackExplanation = document.getElementById('feedbackExplanation');
    const scoreBreakdown = document.getElementById('scoreBreakdown');

    feedbackIcon.className = `feedback-icon ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackTitle.textContent = isCorrect ? 'Correct!' : 'Incorrect';
    feedbackExplanation.textContent = explanation;

    // Show the score breakdown
    if (scoreBreakdown) {
        scoreBreakdown.innerHTML = '';
        if (isCorrect) {
            const breakdown = scoreManager.getScoreBreakdown(
                true,
                gameState.timeSpent,
                gameState.consecutiveCorrect,
                gameState.hintUsed
            );
            breakdown.forEach(item => {
                const div = document.createElement('div');
                div.className = 'score-item';
                div.textContent = `${item.label}: +${item.points} pts`;
                scoreBreakdown.appendChild(div);
            });
        }
    }

    feedbackModal.classList.add('show');
}

// Move to the next question
function nextQuestion() {
    feedbackModal.classList.remove('show');
    gameState.currentQuestionIndex++;

    if (gameState.currentQuestionIndex < gameState.selectedQuestions.length) {
        loadQuestion();
    } else {
        endGame();
    }
}

// End the game
function endGame() {
    // Save data
    saveGameResult();

    // Switch screens
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');

    // Display results
    displayResults();
}

// Display results
function displayResults() {
    // Final score
    document.getElementById('finalScore').textContent = gameState.score;

    // Number of correct answers
    document.getElementById('correctCount').textContent =
        `${gameState.correctAnswers} / ${gameState.selectedQuestions.length}`;

    // Accuracy
    const accuracy = Math.round((gameState.correctAnswers / gameState.selectedQuestions.length) * 100);
    document.getElementById('accuracyRate').textContent = `${accuracy}%`;

    // Per-category results
    const categoryResults = document.getElementById('categoryResults');
    categoryResults.innerHTML = '';

    for (const [category, scores] of Object.entries(gameState.categoryScores)) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-result';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'category-name';
        nameSpan.textContent = category;

        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'category-score';
        scoreSpan.textContent = `${scores.correct} / ${scores.total}`;

        categoryDiv.appendChild(nameSpan);
        categoryDiv.appendChild(scoreSpan);
        categoryResults.appendChild(categoryDiv);
    }
}

// Update progress
function updateProgress() {
    const current = gameState.currentQuestionIndex + 1;
    const total = gameState.selectedQuestions.length;

    document.getElementById('currentQuestion').textContent = current;
    document.getElementById('totalQuestions').textContent = total;
    document.getElementById('currentScore').textContent = gameState.score;

    // Update the progress bar
    const progressPercent = (current / total) * 100;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;

    // Show the streak indicator
    const streakElement = document.getElementById('streak');
    if (gameState.consecutiveCorrect >= 3) {
        streakElement.style.display = 'inline-block';
        document.getElementById('streakCount').textContent = gameState.consecutiveCorrect;
    } else {
        streakElement.style.display = 'none';
    }

    // Show the timer in speed mode
    const timerElement = document.getElementById('timer');
    if (gameState.currentGameMode === 'speed') {
        timerElement.style.display = 'inline-block';
    } else {
        timerElement.style.display = 'none';
    }
}

// Use a hint
function useHint() {
    if (gameState.isAnswered || gameState.hintUsed) return;

    gameState.hintUsed = true;
    const question = gameState.selectedQuestions[gameState.currentQuestionIndex];

    // Hide two wrong answers
    const buttons = document.querySelectorAll('.option-btn');
    let hiddenCount = 0;
    buttons.forEach((btn, index) => {
        if (index !== question.correctAnswer && hiddenCount < 2) {
            btn.classList.add('hint-hidden');
            btn.disabled = true;
            hiddenCount++;
        }
    });
}

// Restart the game
function restartGame() {
    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
}

// Event listeners
startBtn.addEventListener('click', () => {
    showModeSelection();
});

// Show the mode selection screen
function showModeSelection() {
    const modeSelectionHTML = `
        <div class="mode-selection">
            <h2>Select Game Mode</h2>
            <div class="mode-buttons">
                <button onclick="startGameWithMode('full')" class="mode-btn">
                    <h3>${gameModes.full.name}</h3>
                    <p>${gameModes.full.description}</p>
                </button>
                <button onclick="startGameWithMode('category')" class="mode-btn">
                    <h3>${gameModes.category.name}</h3>
                    <p>${gameModes.category.description}</p>
                </button>
                <button onclick="startGameWithMode('speed')" class="mode-btn">
                    <h3>${gameModes.speed.name}</h3>
                    <p>${gameModes.speed.description}</p>
                </button>
            </div>
        </div>
    `;

    startScreen.innerHTML = modeSelectionHTML;
}

// Start the game with the selected mode
function startGameWithMode(mode) {
    if (mode === 'category') {
        showCategorySelection();
    } else {
        initGame(mode);
    }
}

// Category selection screen
function showCategorySelection() {
    const categories = ['History', 'World Geography', 'Science', 'Arts & Culture'];
    const categoryHTML = `
        <div class="category-selection">
            <h2>Select Category</h2>
            <div class="category-buttons">
                ${categories.map(cat => `
                    <button onclick="initGame('category', '${cat}')" class="category-btn">
                        ${cat}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    startScreen.innerHTML = categoryHTML;
}
// Save the game result
function saveGameResult() {
    const result = {
        score: gameState.score,
        totalQuestions: gameState.selectedQuestions.length,
        correctAnswers: gameState.correctAnswers,
        category: gameState.selectedCategory || 'mixed',
        difficulty: 'mixed',
        timeSpent: (Date.now() - gameState.questionStartTime) / 1000,
        questionsDetail: gameState.answers
    };

    // Save via the DataManager
    if (typeof dataManager !== 'undefined') {
        dataManager.saveGameResult(result);

        // Add experience points
        const expPoints = Math.floor(gameState.score / 10);
        dataManager.addExperience(expPoints);

        // Check achievements
        const newAchievements = dataManager.checkAchievements();
        if (newAchievements.length > 0) {
            showAchievementNotification(newAchievements);
        }
    }
}

// Show an achievement notification
function showAchievementNotification(achievements) {
    achievements.forEach(ach => {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${ach.icon}</div>
            <div class="achievement-info">
                <h4>Achievement Unlocked!</h4>
                <p>${ach.name}</p>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    });
}

nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', restartGame);

// Keyboard shortcut support
document.addEventListener('keydown', (e) => {
    if (quizScreen.classList.contains('active') && !gameState.isAnswered) {
        // Select an answer with number keys 1-4
        if (e.key >= '1' && e.key <= '4') {
            const index = parseInt(e.key) - 1;
            const buttons = document.querySelectorAll('.option-btn');
            if (buttons[index]) {
                handleAnswer(index);
            }
        }
    } else if (feedbackModal.classList.contains('show')) {
        // Next question with the Enter key
        if (e.key === 'Enter') {
            nextQuestion();
        }
    }
});