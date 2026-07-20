// UI Enhancements - Dark Mode, Animations, and Additional Features

// Initialize UI enhancements on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    loadUserPreferences();
    updateStartScreenStats();
});

// Initialize UI components
function initializeUI() {
    // Check for saved preferences
    const prefs = dataManager.getPreferences();
    
    // Apply dark mode if saved
    if (prefs.darkMode) {
        document.body.classList.add('dark-mode');
        updateDarkModeButton(true);
    }
    
    // Apply animation speed
    document.documentElement.style.setProperty('--animation-speed', 
        prefs.animationSpeed === 'fast' ? '0.2s' : 
        prefs.animationSpeed === 'slow' ? '0.6s' : '0.3s'
    );
}

// Load user preferences
function loadUserPreferences() {
    const profile = dataManager.getUserProfile();
    const prefs = dataManager.getPreferences();
    
    // Update profile display if exists
    if (profile.username !== 'Player') {
        updateProfileDisplay(profile);
    }
}

// Update start screen statistics
function updateStartScreenStats() {
    const stats = dataManager.getStatistics();
    const bestScore = dataManager.getBestScore();
    const profile = dataManager.getUserProfile();
    
    // Update displays
    const totalGamesElement = document.getElementById('totalGamesPlayed');
    const bestScoreElement = document.getElementById('bestScoreDisplay');
    const levelElement = document.getElementById('userLevel');
    
    if (totalGamesElement) totalGamesElement.textContent = stats.totalGamesPlayed;
    if (bestScoreElement) bestScoreElement.textContent = bestScore;
    if (levelElement) levelElement.textContent = `Lv.${profile.level}`;
}

// Toggle dark mode
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    dataManager.updatePreferences({ darkMode: isDarkMode });
    updateDarkModeButton(isDarkMode);
    
    // Show notification
    showNotification(isDarkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
}

// Update dark mode button
function updateDarkModeButton(isDarkMode) {
    const btn = document.getElementById('darkModeBtn');
    if (btn) {
        btn.textContent = isDarkMode ? '☀️' : '🌙';
    }
}

// Show user profile
function showProfile() {
    const profile = dataManager.getUserProfile();
    const stats = dataManager.getStatistics();
    
    const profileHTML = `
        <div id="profileModal" class="modal">
            <div class="modal-content profile-content">
                <span class="close-btn" onclick="closeProfile()">&times;</span>
                <h2>👤 Profile</h2>
                
                <div class="profile-header">
                    <div class="profile-avatar">${profile.avatar}</div>
                    <div class="profile-info">
                        <input type="text" id="usernameInput" value="${profile.username}"
                               class="username-input" placeholder="Enter nickname">
                        <div class="profile-level">Level ${profile.level} (${profile.experience} XP)</div>
                        <div class="profile-joined">Joined: ${new Date(profile.joinDate).toLocaleDateString()}</div>
                    </div>
                </div>
                
                <div class="avatar-selection">
                    <h3>Choose Avatar</h3>
                    <div class="avatar-grid">
                        ${['🎮', '🎯', '🏆', '⭐', '🚀', '🎨', '🎭', '🎪', '🎲', '🃏'].map(avatar => 
                            `<button class="avatar-option ${profile.avatar === avatar ? 'selected' : ''}" 
                                     onclick="selectAvatar('${avatar}')">${avatar}</button>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="profile-stats">
                    <h3>Game Statistics</h3>
                    <div class="stats-summary">
                        <div>Total games: ${stats.totalGamesPlayed}</div>
                        <div>Total score: ${stats.totalScore} pts</div>
                        <div>Accuracy: ${stats.totalQuestions > 0 ?
                            Math.round((stats.totalCorrectAnswers / stats.totalQuestions) * 100) : 0}%</div>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button onclick="saveProfile()" class="btn btn-primary">Save</button>
                    <button onclick="exportData()" class="btn btn-secondary">Back Up Data</button>
                    <button onclick="importData()" class="btn btn-secondary">Restore Data</button>
                    <button onclick="confirmReset()" class="btn btn-danger">Reset</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', profileHTML);
    document.getElementById('profileModal').style.display = 'block';
}

// Close profile
function closeProfile() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.remove();
    }
}

// Select avatar
function selectAvatar(avatar) {
    document.querySelectorAll('.avatar-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

// Save profile
function saveProfile() {
    const username = document.getElementById('usernameInput').value.trim();
    const selectedAvatar = document.querySelector('.avatar-option.selected');
    
    if (username && selectedAvatar) {
        dataManager.updateUserProfile({
            username: username,
            avatar: selectedAvatar.textContent
        });
        
        showNotification('Profile saved', 'success');
        closeProfile();
        updateStartScreenStats();
    }
}

// Share result
function shareResult() {
    const result = {
        score: gameState.score,
        correct: gameState.correctAnswers,
        total: gameState.selectedQuestions.length,
        accuracy: Math.round((gameState.correctAnswers / gameState.selectedQuestions.length) * 100)
    };
    
    const shareText = `🎯 Quiz Game Results\n` +
                     `Score: ${result.score} pts\n` +
                     `Correct: ${result.correct}/${result.total} (${result.accuracy}%)\n` +
                     `#QuizGame #KnowledgeChallenge`;
    
    // Copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Results copied to clipboard!', 'success');
        });
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('Results copied to clipboard!', 'success');
    }
}

// Export data
function exportData() {
    const data = dataManager.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-backup-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Data backed up', 'success');
}

// Import data
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (dataManager.importData(event.target.result)) {
                    showNotification('Data restored', 'success');
                    location.reload();
                } else {
                    showNotification('Data restore failed', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Confirm reset
function confirmReset() {
    if (confirm('Are you sure you want to reset all data?\nThis action cannot be undone.')) {
        dataManager.clearAllData();
        showNotification('Data has been reset', 'info');
        location.reload();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}
            </span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + D for dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleDarkMode();
    }
    
    // Ctrl/Cmd + L for leaderboard
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        leaderboardUI.show();
    }
    
    // Ctrl/Cmd + S for statistics
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        statisticsDashboard.show();
    }
    
    // ESC to close modals
    if (e.key === 'Escape') {
        // Close all modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

// Add page visibility API to pause timers
document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    } else if (!document.hidden && gameState.currentGameMode === 'speed' && gameState.isAnswered === false) {
        // Resume timer if needed
        startTimer();
    }
});

// Add confetti animation for high scores
function showConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

// Check for new best score
function checkNewBestScore(score) {
    const previousBest = dataManager.getBestScore();
    if (score > previousBest) {
        showConfetti();
        showNotification('🎉 New best score!', 'success');
    }
}

// Update profile display
function updateProfileDisplay(profile) {
    // Update any profile displays in the UI
    const profileElements = document.querySelectorAll('.user-profile-display');
    profileElements.forEach(elem => {
        elem.textContent = `${profile.avatar} ${profile.username}`;
    });
}

// Smooth scroll for mobile
function smoothScroll(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Add touch support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 100;
    const diff = touchEndX - touchStartX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe right - could be used for navigation
        } else {
            // Swipe left - could be used for navigation
        }
    }
}