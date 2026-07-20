/**
 * My Tasks - Advanced todo management application
 * Author: Claude
 * Version: 2.0.0
 *
 * Key features:
 * - Todo CRUD operations
 * - Category classification and filtering
 * - Progress dashboard
 * - Dark mode
 * - Data import/export
 * - Drag-and-drop sorting
 * - Undo function
 * - Accessibility support
 */

// ==================== Global Variables ====================
let tasks = [];
let currentFilter = 'all';
let currentSort = 'newest';
let editingTaskId = null;
let deletedTasksHistory = []; // Delete history for undo
let sortableInstance = null; // Sortable.js instance

// ==================== DOM Element References ====================
const taskInput = document.getElementById('taskInput');
const addButton = document.getElementById('addButton');
const taskContainer = document.getElementById('taskContainer');
const categorySelect = document.getElementById('categorySelect');
const filterButtons = document.querySelectorAll('.filter-button');
const searchInput = document.getElementById('searchInput');
const clearCompletedBtn = document.getElementById('clearCompleted');
const completedBadge = document.getElementById('completedBadge');
const themeToggle = document.getElementById('themeToggle');
const sortSelect = document.getElementById('sortSelect');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const undoBtn = document.getElementById('undoBtn');
const quoteText = document.getElementById('quoteText');
const motivationMessage = document.getElementById('motivationMessage');

// Progress-related DOM elements
const progressCompleted = document.getElementById('progressCompleted');
const progressTotal = document.getElementById('progressTotal');
const progressPercent = document.getElementById('progressPercent');
const mainProgressBar = document.getElementById('mainProgressBar');
const todayCount = document.getElementById('todayCount');

// Per-category progress DOM elements
const categoryProgressElements = {
    work: {
        completed: document.getElementById('workCompleted'),
        total: document.getElementById('workTotal'),
        bar: document.getElementById('workProgress')
    },
    personal: {
        completed: document.getElementById('personalCompleted'),
        total: document.getElementById('personalTotal'),
        bar: document.getElementById('personalProgress')
    },
    study: {
        completed: document.getElementById('studyCompleted'),
        total: document.getElementById('studyTotal'),
        bar: document.getElementById('studyProgress')
    }
};

// ==================== Category Settings ====================
const categories = {
    work: { name: 'Work', color: '#4A90E2', icon: '💼' },
    personal: { name: 'Personal', color: '#27AE60', icon: '🏠' },
    study: { name: 'Study', color: '#8E44AD', icon: '📚' }
};

// ==================== Auto-Categorization Keywords ====================
const categoryKeywords = {
    work: {
        keywords: ['meeting', 'report', 'presentation', 'project', 'office', 'company', 'commute',
                  'client', 'customer', 'contract', 'proposal', 'planning', 'deadline', 'team', 'department',
                  'email', 'approval', 'review', 'collaboration', 'accounting', 'budget', 'sales', 'performance', 'target'],
        patterns: [/^\[work\]/i, /^\[office\]/i, /meeting/i, /project/i, /deadline/i, /client/i]
    },
    personal: {
        keywords: ['workout', 'gym', 'yoga', 'walk', 'cleaning', 'laundry', 'grocery', 'cooking', 'family', 'friend',
                   'appointment', 'birthday', 'anniversary', 'hospital', 'pharmacy', 'bank', 'shopping', 'movie', 'hobby',
                   'rest', 'cafe', 'restaurant', 'travel', 'date', 'party', 'gathering', 'gift', 'home'],
        patterns: [/^\[personal\]/i, /^\[daily\]/i, /exercise/i, /family/i, /friend/i, /birthday/i]
    },
    study: {
        keywords: ['study', 'learning', 'lecture', 'class', 'assignment', 'homework', 'exam', 'quiz', 'presentation', 'paper',
                   'book', 'reading', 'revision', 'preview', 'problem', 'solution', 'memorize', 'notes', 'notetaking',
                   'toeic', 'toefl', 'certificate', 'course', 'online', 'library', 'tutoring', 'mentoring'],
        patterns: [/^\[study\]/i, /^\[learning\]/i, /study/i, /learn/i, /exam/i, /test/i, /homework/i]
    }
};

// User-defined keywords (loaded from localStorage)
let customKeywords = {};

// ==================== Quote of the Day ====================
const quotes = [
    "Don't put off until tomorrow what you can do today.",
    "Small achievements add up to great success.",
    "Well begun is half done.",
    "Consistency is the key to success.",
    "Make a little progress every day.",
    "Take one step at a time toward your goal.",
    "Today's effort is tomorrow's result.",
    "Those who never give up will win.",
    "A goal without a plan is just a dream.",
    "Start now — there is no perfect time."
];

// ==================== Debounce Utility ====================
/**
 * Debounce function that delays function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time (ms)
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== Initialization ====================
window.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    loadFilter();
    loadTheme();
    loadSortPreference();
    loadCustomKeywords();
    renderTasks();
    updateDashboard();
    initFilterButtons();
    initSearch();
    initClearCompleted();
    initThemeToggle();
    initKeyboardShortcuts();
    initSorting();
    initDataManagement();
    initUndo();
    initAutoCategory();
    displayQuote();
    initDragAndDrop();
});

// ==================== Filter Feature ====================
function initFilterButtons() {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            setFilter(filter);
        });
    });
}

function setFilter(filter) {
    currentFilter = filter;

    // Update button active state and ARIA attributes
    filterButtons.forEach(button => {
        if (button.dataset.filter === filter) {
            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
        } else {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
        }
    });

    saveFilter();
    renderTasks();
}

// ==================== Search Feature ====================
function initSearch() {
    // Debounced search function
    const debouncedSearch = debounce((searchTerm) => {
        searchTasks(searchTerm);
    }, 300);

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        debouncedSearch(searchTerm);
    });
}

function searchTasks(searchTerm) {
    const taskItems = document.querySelectorAll('.task-item');
    let visibleCount = 0;

    taskItems.forEach(item => {
        const taskText = item.querySelector('.task-text')?.textContent.toLowerCase() || '';
        const categoryTag = item.querySelector('.category-tag')?.textContent.toLowerCase() || '';

        if (searchTerm === '' || taskText.includes(searchTerm) || categoryTag.includes(searchTerm)) {
            item.classList.remove('hidden-by-search');
            visibleCount++;
        } else {
            item.classList.add('hidden-by-search');
        }
    });

    // Show a message when there are no search results
    if (visibleCount === 0 && searchTerm !== '' && tasks.length > 0) {
        const emptyState = taskContainer.querySelector('.empty-state');
        if (!emptyState) {
            const message = document.createElement('div');
            message.className = 'empty-state';
            message.textContent = 'No search results found.';
            taskContainer.appendChild(message);
        }
    }
}

// ==================== Sorting Feature ====================
function initSorting() {
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        saveSortPreference();
        renderTasks();

        // Enable/disable manual sort mode
        if (currentSort === 'manual') {
            enableDragAndDrop();
        } else {
            disableDragAndDrop();
        }
    });
}

function sortTasks(taskList) {
    const sorted = [...taskList];

    switch(currentSort) {
        case 'oldest':
            return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        case 'newest':
            return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'category':
            return sorted.sort((a, b) => a.category.localeCompare(b.category));
        case 'status':
            return sorted.sort((a, b) => a.completed - b.completed);
        case 'manual':
            // Manual sort keeps the existing order
            return sorted;
        default:
            return sorted;
    }
}

// ==================== Drag and Drop ====================
function initDragAndDrop() {
    if (currentSort === 'manual') {
        enableDragAndDrop();
    }
}

function enableDragAndDrop() {
    if (sortableInstance) {
        sortableInstance.destroy();
    }

    sortableInstance = new Sortable(taskContainer, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        handle: '.task-item',
        filter: '.empty-state',
        onEnd: function(evt) {
            // Update order after dragging completes
            const reorderedTasks = [];
            const taskElements = taskContainer.querySelectorAll('.task-item');

            taskElements.forEach(element => {
                const taskId = parseInt(element.dataset.taskId);
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    reorderedTasks.push(task);
                }
            });

            // Add the remaining tasks that were filtered out
            tasks.forEach(task => {
                if (!reorderedTasks.find(t => t.id === task.id)) {
                    reorderedTasks.push(task);
                }
            });

            tasks = reorderedTasks;
            saveTasks();
        }
    });
}

function disableDragAndDrop() {
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
    }
}

// ==================== Data Management ====================
function initDataManagement() {
    // Export
    exportBtn.addEventListener('click', exportData);

    // Import
    importFile.addEventListener('change', importData);
}

function exportData() {
    const dataToExport = {
        tasks: tasks,
        filter: currentFilter,
        sort: currentSort,
        theme: localStorage.getItem('theme') || 'light',
        exportDate: new Date().toISOString(),
        version: '2.0.0'
    };

    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    const date = new Date();
    const filename = `my-tasks-backup-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}.json`;

    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);

    showMotivation('📥 Data exported successfully!');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Back up current data
    const currentBackup = {
        tasks: [...tasks],
        filter: currentFilter,
        sort: currentSort
    };

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const imported = JSON.parse(event.target.result);

            // Validate data
            if (!imported.tasks || !Array.isArray(imported.tasks)) {
                throw new Error('Invalid file format.');
            }

            // Confirm import
            const confirmImport = confirm(
                `Import ${imported.tasks.length} task(s)?\n` +
                'Your current data will be deleted and replaced with the imported data.'
            );

            if (confirmImport) {
                tasks = imported.tasks;
                currentFilter = imported.filter || 'all';
                currentSort = imported.sort || 'newest';

                // Update UI
                sortSelect.value = currentSort;
                setFilter(currentFilter);

                saveTasks();
                saveSortPreference();
                renderTasks();
                updateDashboard();

                showMotivation(`✅ Successfully imported ${imported.tasks.length} task(s)!`);
            }
        } catch (error) {
            alert('An error occurred while reading the file: ' + error.message);
            console.error('Import error:', error);
        }
    };

    reader.readAsText(file);

    // Reset file input
    e.target.value = '';
}

// ==================== Undo Feature ====================
function initUndo() {
    undoBtn.addEventListener('click', undoLastDelete);
    updateUndoButton();
}

function addToDeleteHistory(task) {
    deletedTasksHistory.push({
        task: task,
        deletedAt: new Date()
    });

    // Keep at most 10 entries
    if (deletedTasksHistory.length > 10) {
        deletedTasksHistory.shift();
    }

    updateUndoButton();
}

function undoLastDelete() {
    if (deletedTasksHistory.length === 0) return;

    const lastDeleted = deletedTasksHistory.pop();
    tasks.push(lastDeleted.task);

    saveTasks();
    renderTasks();
    updateDashboard();
    updateUndoButton();

    showMotivation('↩️ Delete undone!');
}

function updateUndoButton() {
    undoBtn.disabled = deletedTasksHistory.length === 0;

    if (deletedTasksHistory.length > 0) {
        const lastTask = deletedTasksHistory[deletedTasksHistory.length - 1].task;
        undoBtn.title = `Restore "${lastTask.text}"`;
    } else {
        undoBtn.title = 'Undo';
    }
}

// ==================== Auto-Categorization ====================
function initAutoCategory() {
    // Real-time category suggestion while typing
    taskInput.addEventListener('input', debounce((e) => {
        const text = e.target.value.trim();
        if (text.length > 2) {
            const suggestedCategory = detectCategory(text);
            if (suggestedCategory && suggestedCategory !== categorySelect.value) {
                updateCategorySuggestion(suggestedCategory);
            }
        }
    }, 200));
}

/**
 * Analyze text and suggest an appropriate category
 * @param {string} text - Text to analyze
 * @returns {string|null} Suggested category or null
 */
function detectCategory(text) {
    const lowerText = text.toLowerCase();
    let scores = { work: 0, personal: 0, study: 0 };

    // Compute a score for each category
    for (const [category, data] of Object.entries(categoryKeywords)) {
        // Check default keywords
        data.keywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                scores[category] += 2;
            }
        });

        // Pattern matching
        data.patterns.forEach(pattern => {
            if (pattern.test(text)) {
                scores[category] += 3;
            }
        });

        // Check user-defined keywords
        if (customKeywords[category]) {
            customKeywords[category].forEach(keyword => {
                if (lowerText.includes(keyword.toLowerCase())) {
                    scores[category] += 3;
                }
            });
        }
    }

    // Return the category with the highest score
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0) {
        for (const [category, score] of Object.entries(scores)) {
            if (score === maxScore) {
                return category;
            }
        }
    }

    return null;
}

/**
 * Update the category suggestion UI
 * @param {string} suggestedCategory - Suggested category
 */
function updateCategorySuggestion(suggestedCategory) {
    // Remove previous suggestion
    const existingSuggestion = document.querySelector('.category-suggestion');
    if (existingSuggestion) {
        existingSuggestion.remove();
    }

    // Show new suggestion
    const suggestion = document.createElement('div');
    suggestion.className = 'category-suggestion';
    suggestion.innerHTML = `
        <span class="suggestion-text">
            💡 Suggested category: <strong>${categories[suggestedCategory].icon} ${categories[suggestedCategory].name}</strong>
        </span>
        <button class="suggestion-apply" data-category="${suggestedCategory}">Apply</button>
        <button class="suggestion-dismiss">✕</button>
    `;

    // Add below the input section
    const inputSection = document.querySelector('.input-section');
    inputSection.insertAdjacentElement('afterend', suggestion);

    // Event listeners
    suggestion.querySelector('.suggestion-apply').addEventListener('click', (e) => {
        categorySelect.value = e.target.dataset.category;
        suggestion.remove();
        showMotivation(`✨ Category automatically set to '${categories[suggestedCategory].name}'!`);
    });

    suggestion.querySelector('.suggestion-dismiss').addEventListener('click', () => {
        suggestion.remove();
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (suggestion.parentElement) {
            suggestion.style.opacity = '0';
            setTimeout(() => suggestion.remove(), 300);
        }
    }, 5000);
}

/**
 * Add a user-defined keyword
 * @param {string} category - Category
 * @param {string} keyword - Keyword to add
 */
function addCustomKeyword(category, keyword) {
    if (!customKeywords[category]) {
        customKeywords[category] = [];
    }

    if (!customKeywords[category].includes(keyword)) {
        customKeywords[category].push(keyword);
        saveCustomKeywords();
    }
}

/**
 * Save user-defined keywords
 */
function saveCustomKeywords() {
    localStorage.setItem('customKeywords', JSON.stringify(customKeywords));
}

/**
 * Load user-defined keywords
 */
function loadCustomKeywords() {
    const saved = localStorage.getItem('customKeywords');
    if (saved) {
        try {
            customKeywords = JSON.parse(saved);
        } catch (error) {
            console.error('Failed to load custom keywords:', error);
            customKeywords = {};
        }
    }
}

// ==================== Add Task ====================
addButton.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

function addTask() {
    const taskText = taskInput.value.trim();

    if (taskText === '') {
        alert('Please enter a task!');
        taskInput.focus();
        return;
    }

    // Auto-detect category (if the user has not selected one)
    if (categorySelect.value === 'personal') { // When the default is personal
        const detectedCategory = detectCategory(taskText);
        if (detectedCategory) {
            categorySelect.value = detectedCategory;
        }
    }

    // Check for duplicates
    const isDuplicate = tasks.some(task =>
        task.text.toLowerCase() === taskText.toLowerCase() &&
        task.category === categorySelect.value
    );

    if (isDuplicate) {
        const confirmDuplicate = confirm(
            'The same task already exists.\nDo you want to add it anyway?'
        );
        if (!confirmDuplicate) {
            taskInput.focus();
            return;
        }
    }

    const newTask = {
        id: Date.now(),
        text: taskText,
        category: categorySelect.value,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    updateDashboard();
    updateClearButton();

    // Reset input and refocus
    taskInput.value = '';
    taskInput.focus();

    // Show motivational message
    const totalCount = tasks.length;
    if (totalCount % 10 === 0) {
        showMotivation(`🎉 Congratulations! You have added ${totalCount} tasks!`);
    }
}

// ==================== Delete Task ====================
function deleteTask(id, element) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Add to delete history
    addToDeleteHistory(task);

    // Fade-out animation
    element.classList.add('fade-out');

    setTimeout(() => {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateDashboard();
        updateClearButton();
    }, 300);
}

// ==================== Toggle Task Completion ====================
function toggleTask(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateDashboard();
        updateClearButton();

        // Motivational message based on completion rate
        checkCompletionMilestone();
    }
}

// ==================== Edit Task ====================
function editTask(id) {
    if (editingTaskId && editingTaskId !== id) {
        cancelEdit();
    }

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;

    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    if (!taskElement) return;

    taskElement.classList.add('editing');

    // Hide existing content
    const checkbox = taskElement.querySelector('.task-checkbox');
    const categoryTag = taskElement.querySelector('.category-tag');
    const taskText = taskElement.querySelector('.task-text');
    const taskDate = taskElement.querySelector('.task-date');
    const deleteButton = taskElement.querySelector('.delete-button');

    checkbox.style.display = 'none';
    categoryTag.style.display = 'none';
    taskText.style.display = 'none';
    taskDate.style.display = 'none';
    deleteButton.style.display = 'none';

    // Create edit UI
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'edit-input';
    editInput.value = task.text;
    editInput.setAttribute('aria-label', 'Edit task');

    const editSelect = document.createElement('select');
    editSelect.className = 'edit-select';
    editSelect.setAttribute('aria-label', 'Change category');

    ['work', 'personal', 'study'].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = categories[cat].name;
        if (cat === task.category) option.selected = true;
        editSelect.appendChild(option);
    });

    const editButtons = document.createElement('div');
    editButtons.className = 'edit-buttons';

    const saveButton = document.createElement('button');
    saveButton.className = 'save-button';
    saveButton.textContent = 'Save';
    saveButton.setAttribute('aria-label', 'Save changes');

    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.setAttribute('aria-label', 'Cancel editing');

    editButtons.appendChild(saveButton);
    editButtons.appendChild(cancelButton);

    // Add the edit UI
    taskElement.insertBefore(editInput, taskDate);
    taskElement.insertBefore(editSelect, taskDate);
    taskElement.insertBefore(editButtons, taskDate);

    // Focus the input
    editInput.focus();
    editInput.select();

    // Event listeners
    const saveEdit = () => {
        const newText = editInput.value.trim();
        if (newText === '') {
            alert('Please enter a task!');
            return;
        }

        task.text = newText;
        task.category = editSelect.value;
        saveTasks();
        renderTasks();
        updateDashboard();
        updateClearButton();
        editingTaskId = null;
    };

    const cancelEdit = () => {
        renderTasks();
        editingTaskId = null;
    };

    saveButton.addEventListener('click', saveEdit);
    cancelButton.addEventListener('click', cancelEdit);

    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });
}

// ==================== Rendering ====================
// Debounced render function
const debouncedRenderTasks = debounce(() => {
    renderTasksImmediate();
}, 100);

function renderTasks() {
    if (tasks.length > 100) {
        // Apply debouncing for large datasets
        debouncedRenderTasks();
    } else {
        renderTasksImmediate();
    }
}

function renderTasksImmediate() {
    taskContainer.innerHTML = '';

    // Get the filtered task list
    let filteredTasks = getFilteredTasks();

    // Apply sorting
    filteredTasks = sortTasks(filteredTasks);

    // Move completed items to the bottom
    if (currentSort !== 'status') {
        filteredTasks = sortTasksByCompletion(filteredTasks);
    }

    if (filteredTasks.length === 0) {
        const emptyMessage = currentFilter === 'all'
            ? 'No tasks yet. Try adding a new one!'
            : `No tasks in the ${categories[currentFilter]?.name || 'selected'} category.`;

        taskContainer.innerHTML = `
            <div class="empty-state">
                ${emptyMessage}
            </div>
        `;
        return;
    }

    // Use DocumentFragment for performance optimization
    const fragment = document.createDocumentFragment();

    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        fragment.appendChild(taskElement);
    });

    taskContainer.appendChild(fragment);
}

// Return the filtered task list
function getFilteredTasks() {
    if (currentFilter === 'all') {
        return tasks;
    }
    return tasks.filter(task => task.category === currentFilter);
}

// Sort by completion status
function sortTasksByCompletion(taskList) {
    const incomplete = taskList.filter(task => !task.completed);
    const complete = taskList.filter(task => task.completed);
    return [...incomplete, ...complete];
}

// Create a task element
function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.category}`;
    taskItem.dataset.taskId = task.id;
    taskItem.setAttribute('role', 'listitem');

    if (task.completed) {
        taskItem.classList.add('completed');
    }

    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Toggle completion of ${task.text}`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Create category tag
    const categoryTag = document.createElement('span');
    categoryTag.className = `category-tag ${task.category}`;
    categoryTag.textContent = categories[task.category].name;

    // Create task text
    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    if (task.completed) {
        taskText.classList.add('completed');
    }
    taskText.textContent = task.text;

    // Enter edit mode on double click
    taskText.addEventListener('dblclick', () => {
        if (!task.completed) {
            editTask(task.id);
        }
    });

    // Show relative time
    const taskDate = document.createElement('span');
    taskDate.className = 'task-date';
    taskDate.textContent = getRelativeTime(task.createdAt);

    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = '✕';
    deleteButton.setAttribute('aria-label', `Delete ${task.text}`);
    deleteButton.addEventListener('click', () => deleteTask(task.id, taskItem));

    // Append elements to task-item
    taskItem.appendChild(checkbox);
    taskItem.appendChild(categoryTag);
    taskItem.appendChild(taskText);
    taskItem.appendChild(taskDate);
    taskItem.appendChild(deleteButton);

    return taskItem;
}

// ==================== Utility Functions ====================
// Relative time calculation function
function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
        return 'just now';
    } else if (diffMin < 60) {
        return `${diffMin}m ago`;
    } else if (diffHour < 24) {
        return `${diffHour}h ago`;
    } else if (diffDay < 7) {
        return `${diffDay}d ago`;
    } else {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
}

// ==================== Dashboard Update ====================
function updateDashboard() {
    // Calculate overall progress
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    progressCompleted.textContent = completed;
    progressTotal.textContent = total;
    progressPercent.textContent = percent;
    mainProgressBar.style.width = `${percent}%`;

    // Calculate per-category progress
    ['work', 'personal', 'study'].forEach(category => {
        const categoryTasks = tasks.filter(task => task.category === category);
        const categoryTotal = categoryTasks.length;
        const categoryCompleted = categoryTasks.filter(task => task.completed).length;
        const categoryPercent = categoryTotal > 0 ? (categoryCompleted / categoryTotal) * 100 : 0;

        const elements = categoryProgressElements[category];
        elements.completed.textContent = categoryCompleted;
        elements.total.textContent = categoryTotal;
        elements.bar.style.width = `${categoryPercent}%`;
    });

    // Calculate tasks added today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
    });

    todayCount.textContent = todayTasks.length;

    // Update completed-items badge
    updateClearButton();
}

// ==================== Completed Items Management ====================
function initClearCompleted() {
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    updateClearButton();
}

function clearCompletedTasks() {
    const completedTasks = tasks.filter(task => task.completed);
    const completedCount = completedTasks.length;

    if (completedCount === 0) {
        alert('There are no completed items to delete.');
        return;
    }

    if (confirm(`Delete all ${completedCount} completed item(s)?`)) {
        // Add to delete history
        completedTasks.forEach(task => addToDeleteHistory(task));

        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateDashboard();
        updateClearButton();

        showMotivation(`🗑️ ${completedCount} completed item(s) deleted!`);
    }
}

function updateClearButton() {
    const completedCount = tasks.filter(task => task.completed).length;
    completedBadge.textContent = completedCount;
    clearCompletedBtn.disabled = completedCount === 0;
}

// ==================== Theme Management ====================
function initThemeToggle() {
    themeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    });
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggle.checked = true;
    }
}

// ==================== Keyboard Shortcuts ====================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt + N: focus new task input
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            taskInput.focus();
            taskInput.select();
        }

        // Alt + 1~4: switch filters
        if (e.altKey && e.key >= '1' && e.key <= '4') {
            e.preventDefault();
            const filterIndex = parseInt(e.key) - 1;
            const filters = ['all', 'work', 'personal', 'study'];
            if (filterIndex < filters.length) {
                setFilter(filters[filterIndex]);
            }
        }

        // Alt + D: toggle dark mode
        if (e.altKey && e.key === 'd') {
            e.preventDefault();
            themeToggle.checked = !themeToggle.checked;
            themeToggle.dispatchEvent(new Event('change'));
        }

        // Alt + S: focus search box
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }

        // Alt + Z: undo
        if (e.altKey && e.key === 'z') {
            e.preventDefault();
            undoLastDelete();
        }

        // Alt + E: export data
        if (e.altKey && e.key === 'e') {
            e.preventDefault();
            exportData();
        }

        // Alt + K: keyword settings dialog
        if (e.altKey && e.key === 'k') {
            e.preventDefault();
            showKeywordSettings();
        }
    });
}

// ==================== Keyword Settings Dialog ====================
function showKeywordSettings() {
    // Remove existing dialog
    const existing = document.querySelector('.keyword-dialog');
    if (existing) existing.remove();

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'keyword-dialog';
    dialog.innerHTML = `
        <div class="dialog-backdrop"></div>
        <div class="dialog-content">
            <h2>🔤 Auto-Categorization Keyword Settings</h2>
            <div class="keyword-sections">
                ${Object.entries(categories).map(([key, cat]) => `
                    <div class="keyword-section">
                        <h3>${cat.icon} ${cat.name}</h3>
                        <div class="keyword-list">
                            <div class="default-keywords">
                                <strong>Default keywords:</strong>
                                <span class="keywords-display">${categoryKeywords[key].keywords.slice(0, 5).join(', ')}...</span>
                            </div>
                            <div class="custom-keywords">
                                <strong>Custom keywords:</strong>
                                <div class="custom-keyword-tags" data-category="${key}">
                                    ${(customKeywords[key] || []).map(kw =>
                                        `<span class="keyword-tag">
                                            ${kw}
                                            <button class="remove-keyword" data-keyword="${kw}" data-category="${key}">×</button>
                                        </span>`
                                    ).join('')}
                                </div>
                                <div class="add-keyword-form">
                                    <input type="text" class="keyword-input" data-category="${key}" placeholder="Add keyword">
                                    <button class="add-keyword-btn" data-category="${key}">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="dialog-footer">
                <button class="dialog-close">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // Set up event listeners
    dialog.querySelector('.dialog-backdrop').addEventListener('click', () => dialog.remove());
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.remove());

    // Add keyword
    dialog.querySelectorAll('.add-keyword-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            const input = dialog.querySelector(`.keyword-input[data-category="${category}"]`);
            const keyword = input.value.trim();

            if (keyword) {
                addCustomKeyword(category, keyword);
                input.value = '';
                showKeywordSettings(); // Refresh dialog
                showMotivation(`✅ Keyword '${keyword}' added!`);
            }
        });
    });

    // Add with Enter key
    dialog.querySelectorAll('.keyword-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const btn = input.nextElementSibling;
                btn.click();
            }
        });
    });

    // Remove keyword
    dialog.querySelectorAll('.remove-keyword').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            const keyword = e.target.dataset.keyword;

            if (customKeywords[category]) {
                customKeywords[category] = customKeywords[category].filter(kw => kw !== keyword);
                saveCustomKeywords();
                showKeywordSettings(); // Refresh dialog
            }
        });
    });
}

// ==================== Quotes and Motivational Messages ====================
function displayQuote() {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteText.textContent = randomQuote;
}

function showMotivation(message) {
    motivationMessage.textContent = message;
    motivationMessage.style.display = 'block';

    setTimeout(() => {
        motivationMessage.style.display = 'none';
    }, 3000);
}

function checkCompletionMilestone() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (percent === 100 && total > 0) {
        showMotivation('🏆 Amazing! You have completed all your tasks!');
    } else if (percent >= 75 && percent < 100) {
        showMotivation('💪 Almost there! Keep pushing!');
    } else if (percent === 50) {
        showMotivation('✨ Halfway done! Keep it up!');
    }
}

// ==================== Data Save and Load ====================
// Debounced save function
const debouncedSaveTasks = debounce(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}, 500);

function saveTasks() {
    if (tasks.length > 100) {
        debouncedSaveTasks();
    } else {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
            // Backward compatibility: handle legacy data without a category
            tasks = tasks.map(task => {
                if (!task.category) {
                    task.category = 'personal';
                }
                return task;
            });
            saveTasks();
        } catch (error) {
            console.error('An error occurred while loading the task list:', error);
            tasks = [];
        }
    }
}

function saveFilter() {
    localStorage.setItem('currentFilter', currentFilter);
}

function loadFilter() {
    const savedFilter = localStorage.getItem('currentFilter');
    if (savedFilter && ['all', 'work', 'personal', 'study'].includes(savedFilter)) {
        currentFilter = savedFilter;
        // Activate the button matching the saved filter
        filterButtons.forEach(button => {
            if (button.dataset.filter === savedFilter) {
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');
            } else {
                button.classList.remove('active');
                button.setAttribute('aria-selected', 'false');
            }
        });
    }
}

function saveSortPreference() {
    localStorage.setItem('sortPreference', currentSort);
}

function loadSortPreference() {
    const savedSort = localStorage.getItem('sortPreference');
    if (savedSort && ['newest', 'oldest', 'category', 'status', 'manual'].includes(savedSort)) {
        currentSort = savedSort;
        sortSelect.value = savedSort;
    }
}

// ==================== Periodic Updates ====================
// Update times every minute
setInterval(() => {
    const dateElements = document.querySelectorAll('.task-date');
    if (dateElements.length > 0) {
        renderTasks();
    }
}, 60000);

// Change the quote once a day
setInterval(() => {
    displayQuote();
}, 86400000); // 24 hours

// ==================== Error Handling ====================
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    // Show a user-friendly error message
    if (e.error && e.error.message) {
        console.log('An error occurred. Please refresh the page.');
    }
});

// ==================== Performance Monitoring ====================
if ('performance' in window) {
    window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`Page load time: ${pageLoadTime}ms`);
    });
}
