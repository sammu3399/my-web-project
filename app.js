// Supabase Configuration
const SUPABASE_URL = 'https://nhfzhnmopnvandpugvkr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_g96CwRBlO-h4uHvhSAm_5Q_80UiY5QR';

let supabase = null;
if (SUPABASE_URL !== 'https://your-project-url.supabase.co') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Core State Structure
let appState = {
    userId: null,
    user: {
        username: "Guest User",
        avatarSeed: "Guest",
        statusText: "Grinding everyday 🚀"
    },
    tasks: [
        { id: 1, text: "Drink 2L Water", status: "pending" },
        { id: 2, text: "Read 10 pages", status: "pending" },
        { id: 3, text: "Workout 30 mins", status: "pending" }
    ],
    streak: { current: 0, perfectDays: 0, shieldActive: false },
    weeklyStats: { completed: 12, failed: 3 },
    health: { height: null, weight: null, pcosMode: false }
};

const elements = {
    usernameDisplay: document.getElementById('username-display'),
    avatarDisplay: document.getElementById('user-avatar'),
    editProfileBtn: document.getElementById('edit-profile-btn'),
    profileModal: document.getElementById('profile-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    usernameInput: document.getElementById('username-input'),
    saveProfileBtn: document.getElementById('save-profile-btn'),
    taskList: document.getElementById('task-list'),
    newTaskInput: document.getElementById('new-task-input'),
    addTaskBtn: document.getElementById('add-task-btn'),
    dateDisplay: document.getElementById('date-display'),
    dailyProgressFill: document.getElementById('daily-progress'),
    progressText: document.getElementById('progress-text'),
    motivationalText: document.getElementById('motivational-text'),
    completeDayBtn: document.getElementById('complete-day-btn'),
    streakCount: document.getElementById('streak-count'),
    streakShield: document.getElementById('streak-shield'),
    heightInput: document.getElementById('height-input'),
    weightInput: document.getElementById('weight-input'),
    calcIntensityBtn: document.getElementById('calc-intensity-btn'),
    intensityResult: document.getElementById('intensity-result'),
    intensityLevel: document.getElementById('intensity-level'),
    intensityDesc: document.getElementById('intensity-desc'),
    pcosToggle: document.getElementById('pcos-toggle'),
    pcosRecommendations: document.getElementById('pcos-recommendations'),
    gudduCelebration: document.getElementById('guddu-celebration'),
    gudduMessage: document.getElementById('guddu-message'),
    leaderboardList: document.getElementById('leaderboard-list'),
    syncText: document.getElementById('sync-text'),
    syncStatus: document.getElementById('sync-status')
};

// Initialization
async function init() {
    updateSyncStatus('syncing', 'Connecting...');
    await loadState();
    setupEventListeners();
    setRealDate();
    renderAll();
    initChart();
}

function setRealDate() {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    elements.dateDisplay.innerText = new Date().toLocaleDateString('en-US', options);
}

async function loadState() {
    let userId = localStorage.getItem('myWinUserId');
    if (supabase && userId) {
        try {
            const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (data) {
                appState.userId = userId;
                appState.user.username = data.username;
                appState.user.avatarSeed = data.avatar_seed;
                appState.health.pcosMode = data.pcos_mode;
                updateSyncStatus('synced', 'Live');
                return;
            }
        } catch (e) { console.error(e); }
    }
    const saved = localStorage.getItem('myWinState');
    if (saved) appState = JSON.parse(saved);
}

async function saveState() {
    localStorage.setItem('myWinState', JSON.stringify(appState));
    updateSyncStatus('synced', 'Saved Locally');
}

function updateSyncStatus(status, text) {
    if (elements.syncStatus) elements.syncStatus.className = 'sync-status ' + status;
    if (elements.syncText) elements.syncText.innerText = text;
}

function setupEventListeners() {
    elements.editProfileBtn?.addEventListener('click', () => {
        elements.usernameInput.value = appState.user.username;
        elements.profileModal.classList.remove('hidden');
    });

    elements.closeModalBtn?.addEventListener('click', () => {
        elements.profileModal.classList.add('hidden');
    });

    elements.saveProfileBtn?.addEventListener('click', () => {
        const newName = elements.usernameInput.value.trim();
        if (newName) {
            appState.user.username = newName;
            appState.user.avatarSeed = newName;
            elements.profileModal.classList.add('hidden');
            saveState();
            renderAll();
        }
    });

    elements.addTaskBtn?.addEventListener('click', handleAddTask);
    elements.completeDayBtn?.addEventListener('click', handleCompleteDay);
    elements.calcIntensityBtn?.addEventListener('click', calculateIntensity);

    // PCOS Toggle - Correct Logic
    elements.pcosToggle?.addEventListener('change', (e) => {
        appState.health.pcosMode = e.target.checked;
        if (e.target.checked) {
            elements.pcosRecommendations.classList.remove('hidden');
            elements.pcosRecommendations.scrollIntoView({ behavior: 'smooth' });
        } else {
            elements.pcosRecommendations.classList.add('hidden');
        }
        saveState();
    });
}

function renderAll() {
    renderProfile();
    renderTasks();
    renderStreak();
    renderHealthSection();
    updateMotivationalText();
    renderLeaderboard();
}

function renderProfile() {
    elements.usernameDisplay.textContent = appState.user.username;
    elements.avatarDisplay.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(appState.user.avatarSeed)}`;
}

function renderTasks() {
    elements.taskList.innerHTML = '';
    let completedCount = 0;
    appState.tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.status === 'completed' ? 'completed' : ''}`;
        li.innerHTML = `<span class="task-title">${task.text}</span>`;
        elements.taskList.appendChild(li);
        if (task.status === 'completed') completedCount++;
    });
    const progress = appState.tasks.length === 0 ? 0 : Math.round((completedCount / appState.tasks.length) * 100);
    elements.dailyProgressFill.style.width = `${progress}%`;
    elements.progressText.textContent = `${progress}% Completed`;
}

function renderStreak() {
    elements.streakCount.textContent = appState.streak.current;
}

function renderHealthSection() {
    elements.pcosToggle.checked = appState.health.pcosMode;
    if (appState.health.pcosMode) elements.pcosRecommendations.classList.remove('hidden');
}

function handleAddTask() {
    const text = elements.newTaskInput.value.trim();
    if (text) {
        appState.tasks.push({ id: Date.now(), text, status: "pending" });
        elements.newTaskInput.value = '';
        saveState();
        renderTasks();
    }
}

function handleCompleteDay() {
    appState.streak.current += 1;
    if (appState.user.username.toLowerCase() === "guddu") {
        showGudduCelebration("Killing it, Guddu! Make big bro proud!");
    }
    saveState();
    renderAll();
}

function updateMotivationalText() {
    const name = appState.user.username;
    elements.motivationalText.innerText = name.toLowerCase() === "guddu"
        ? "Keep pushing, Guddu! You're stronger than you think!"
        : `Keep pushing, ${name}! You got this!`;
}

function calculateIntensity() {
    const h = elements.heightInput.value;
    const w = elements.weightInput.value;
    if (h && w) {
        elements.intensityResult.classList.remove('hidden');
        elements.intensityLevel.textContent = "High / Vigorous";
    }
}

function renderLeaderboard() {
    elements.leaderboardList.innerHTML = '<li class="leaderboard-item">#1 IronMan - 🔥 45</li>';
}

function showGudduCelebration(message) {
    if (elements.gudduCelebration) {
        elements.gudduMessage.innerText = message;
        elements.gudduCelebration.classList.remove('hidden');
        setTimeout(() => elements.gudduCelebration.classList.add('hidden'), 3000);
    }
}

// Chart Placeholder
function initChart() { console.log("Chart initialized"); }

document.addEventListener('DOMContentLoaded', init);