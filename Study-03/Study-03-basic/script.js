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
    isAnswered: false
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
function initGame() {
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
        isAnswered: false
    };

    // Switch screens
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');
    resultScreen.classList.remove('active');
    feedbackModal.classList.remove('show');

    // Load the first question
    loadQuestion();
}

// Load and display a question
function loadQuestion() {
    const question = quizQuestions[gameState.currentQuestionIndex];

    // Update progress
    updateProgress();

    // Update category badge
    const categoryBadge = document.getElementById('categoryBadge');
    if (categoryBadge) {
        categoryBadge.textContent = question.category;
    }

    // Display question text
    const questionText = document.getElementById('questionText');
    if (questionText) {
        questionText.textContent = question.question;
    }

    // Create answer options
    const optionsContainer = document.getElementById('optionsContainer');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';

        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.onclick = () => handleAnswer(index);
            optionsContainer.appendChild(button);
        });
    }

    // Reset state
    gameState.isAnswered = false;
}

// Handle an answer
function handleAnswer(selectedIndex) {
    if (gameState.isAnswered) return;

    gameState.isAnswered = true;

    const question = quizQuestions[gameState.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctAnswer;

    // Update per-category score
    gameState.categoryScores[question.category].total++;

    // Handle correct/incorrect answer
    if (isCorrect) {
        gameState.correctAnswers++;
        gameState.score += 10;
        gameState.categoryScores[question.category].correct++;
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

    feedbackIcon.className = `feedback-icon ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackTitle.textContent = isCorrect ? 'Correct!' : 'Incorrect';
    feedbackExplanation.textContent = explanation;

    feedbackModal.classList.add('show');
}

// Move to the next question
function nextQuestion() {
    feedbackModal.classList.remove('show');
    gameState.currentQuestionIndex++;

    if (gameState.currentQuestionIndex < quizQuestions.length) {
        loadQuestion();
    } else {
        endGame();
    }
}

// End the game
function endGame() {
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
        `${gameState.correctAnswers} / ${quizQuestions.length}`;

    // Accuracy
    const accuracy = Math.round((gameState.correctAnswers / quizQuestions.length) * 100);
    document.getElementById('accuracyRate').textContent = `${accuracy}%`;

    // Per-category results
    const categoryResults = document.getElementById('categoryResults');
    categoryResults.innerHTML = '';

    for (const [category, scores] of Object.entries(gameState.categoryScores)) {
        if (scores.total === 0) continue;

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
    const total = quizQuestions.length;

    const currentQuestionEl = document.getElementById('currentQuestion');
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const currentScoreEl = document.getElementById('currentScore');

    if (currentQuestionEl) currentQuestionEl.textContent = current;
    if (totalQuestionsEl) totalQuestionsEl.textContent = total;
    if (currentScoreEl) currentScoreEl.textContent = gameState.score;

    // Update the progress bar
    const progressFillEl = document.getElementById('progressFill');
    if (progressFillEl) {
        const progressPercent = (current / total) * 100;
        progressFillEl.style.width = `${progressPercent}%`;
    }
}

// Restart the game
function restartGame() {
    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
}

// Event listeners
startBtn.addEventListener('click', () => {
    initGame();
});

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
