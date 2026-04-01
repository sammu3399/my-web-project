// Supabase Configuration - REPLACE WITH YOUR PROJECT VALUES
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
        { id: 1, text: "Drink 2L Water", status: "pending" }, // pending, completed, failed
        { id: 2, text: "Read 10 pages", status: "pending" },
        { id: 3, text: "Workout 30 mins", status: "pending" }
    ],
    streak: {
        current: 0,
        perfectDays: 0,
        shieldActive: false
    },
    weeklyStats: {
        completed: 12,
        failed: 3
    },
    health: {
        height: null,
        weight: null,
        pcosMode: false
    }
};

// DOM Elements
const elements = {
    // Profile
    usernameDisplay: document.getElementById('username-display'),
    avatarDisplay: document.getElementById('user-avatar'),
    editProfileBtn: document.getElementById('edit-profile-btn'),
    editBannerBtn: document.getElementById('edit-banner-btn'),
    profileModal: document.getElementById('profile-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    usernameInput: document.getElementById('username-input'),
    saveProfileBtn: document.getElementById('save-profile-btn'),

    // Tasks & Dashboard
    taskList: document.getElementById('task-list'),
    newTaskInput: document.getElementById('new-task-input'),
    addTaskBtn: document.getElementById('add-task-btn'),
    dateDisplay: document.getElementById('date-display'),
    dailyProgressFill: document.getElementById('daily-progress'),
    progressText: document.getElementById('progress-text'),
    motivationalText: document.getElementById('motivational-text'),
    completeDayBtn: document.getElementById('complete-day-btn'),

    // Streaks
    streakCount: document.getElementById('streak-count'),
    streakShield: document.getElementById('streak-shield'),

    // Health
    heightInput: document.getElementById('height-input'),
    weightInput: document.getElementById('weight-input'),
    calcIntensityBtn: document.getElementById('calc-intensity-btn'),
    intensityResult: document.getElementById('intensity-result'),
    intensityLevel: document.getElementById('intensity-level'),
    intensityDesc: document.getElementById('intensity-desc'),
    pcosToggle: document.getElementById('pcos-toggle'),
    pcosRecommendations: document.getElementById('pcos-recommendations'),

    // Guddu Overlay
    gudduCelebration: document.getElementById('guddu-celebration'),
    gudduMessage: document.getElementById('guddu-message'),

    // Leaderboard
    leaderboardList: document.getElementById('leaderboard-list'),

    // Sync status
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
    // 1. Try to get userId from localStorage
    let userId = localStorage.getItem('myWinUserId');

    if (supabase && userId) {
        try {
            updateSyncStatus('syncing', 'Fetching data...');
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                appState.userId = userId;
                appState.user.username = data.username;
                appState.user.avatarSeed = data.avatar_seed;
                appState.user.statusText = data.status_text;
                appState.streak.current = data.streak_current;
                appState.streak.perfectDays = data.streak_perfect_days;
                appState.streak.shieldActive = data.streak_shield_active;
                appState.weeklyStats.completed = data.weekly_completed;
                appState.weeklyStats.failed = data.weekly_failed;
                appState.health.height = data.height;
                appState.health.weight = data.weight;
                appState.health.pcosMode = data.pcos_mode;

                // Fetch tasks
                const { data: tasksData, error: tasksError } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', userId);

                if (tasksData) {
                    appState.tasks = tasksData.map(t => ({
                        id: t.id,
                        text: t.text,
                        status: t.status
                    }));
                }
                updateSyncStatus('synced', 'Live');
                return;
            }
        } catch (e) {
            console.error("Supabase load failed, falling back to local storage", e);
        }
    }

    // Fallback to local storage
    const saved = localStorage.getItem('myWinState');
    if (saved) {
        appState = JSON.parse(saved);
        if (!appState.health) appState.health = { height: null, weight: null, pcosMode: false };
        updateSyncStatus('synced', 'Local (Offline)');
    } else {
        updateSyncStatus('synced', 'First time!');
    }
}

async function saveState() {
    // Save to localStorage as a backup
    localStorage.setItem('myWinState', JSON.stringify(appState));

    if (!supabase) return;

    try {
        updateSyncStatus('syncing', 'Syncing...');

        // If we don't have a userId yet, create a record in Supabase
        if (!appState.userId) {
            const { data, error } = await supabase
                .from('profiles')
                .insert([{
                    username: appState.user.username,
                    avatar_seed: appState.user.avatarSeed,
                    status_text: appState.user.statusText,
                    streak_current: appState.streak.current,
                    streak_perfect_days: appState.streak.perfectDays,
                    streak_shield_active: appState.streak.shieldActive,
                    weekly_completed: appState.weeklyStats.completed,
                    weekly_failed: appState.weeklyStats.failed,
                    height: appState.health.height,
                    weight: appState.health.weight,
                    pcos_mode: appState.health.pcosMode
                }])
                .select()
                .single();

            if (data) {
                appState.userId = data.id;
                localStorage.setItem('myWinUserId', data.id);
            }
        } else {
            // Update existing profile
            await supabase
                .from('profiles')
                .update({
                    username: appState.user.username,
                    avatar_seed: appState.user.avatarSeed,
                    status_text: appState.user.statusText,
                    streak_current: appState.streak.current,
                    streak_perfect_days: appState.streak.perfectDays,
                    streak_shield_active: appState.streak.shieldActive,
                    weekly_completed: appState.weeklyStats.completed,
                    weekly_failed: appState.weeklyStats.failed,
                    height: appState.health.height,
                    weight: appState.health.weight,
                    pcos_mode: appState.health.pcosMode
                })
                .eq('id', appState.userId);
        }

        // Sync Tasks (Simple approach: delete all and re-insert for now)
        // A more robust approach would be to track individual changes
        if (appState.userId) {
            await supabase.from('tasks').delete().eq('user_id', appState.userId);
            const tasksToInsert = appState.tasks.map(t => ({
                user_id: appState.userId,
                text: t.text,
                status: t.status
            }));
            if (tasksToInsert.length > 0) {
                await supabase.from('tasks').insert(tasksToInsert);
            }
        }

        updateSyncStatus('synced', 'Live');
    } catch (e) {
        console.error("Supabase sync failed", e);
        updateSyncStatus('synced', 'Local (Sync Error)');
    }
}

function updateSyncStatus(status, text) {
    elements.syncStatus.className = 'sync-status ' + status;
    elements.syncText.innerText = text;
}

// Listeners SetupEvent 
function setupEventListeners() {
    // Profile Modal
    elements.editBannerBtn.addEventListener('click', () => {
        alert("Banner customization feature coming soon!");
    });

    elements.editProfileBtn.addEventListener('click', () => {
        elements.usernameInput.value = appState.user.username;
        elements.profileModal.classList.remove('hidden');
    });

    elements.closeModalBtn.addEventListener('click', () => {
        elements.profileModal.classList.add('hidden');
    });

    elements.saveProfileBtn.addEventListener('click', () => {
        const newName = elements.usernameInput.value.trim();
        if (newName) {
            appState.user.username = newName;
            appState.user.avatarSeed = newName;
            elements.profileModal.classList.add('hidden');
            saveState();
            renderProfile();
            updateMotivationalText();
            renderLeaderboard();
        }
    }); // ... (existing code for saveProfileBtn)
    renderLeaderboard();
}
}); // <--- Paste RIGHT AFTER this line

// PCOS Toggle Action
if (elements.pcosToggle) {
    elements.pcosToggle.addEventListener('change', function () {
        if (this.checked) {
            elements.pcosRecommendations.classList.remove('hidden');
        } else {
            elements.pcosRecommendations.classList.add('hidden');
        }
    });
}

// Task Management
elements.addTaskBtn.addEventListener('click', handleAddTask);
elements.newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddTask();
});

// Complete Day
elements.completeDayBtn.addEventListener('click', handleCompleteDay);

// Health Integration
elements.calcIntensityBtn.addEventListener('click', calculateIntensity);
elements.pcosToggle.addEventListener('change', (e) => {
    appState.health.pcosMode = e.target.checked;
    saveState();
    renderHealthSection();
});

// Navigation (Mock)
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
        e.target.closest('li').classList.add('active');
    });
});

// Celebration Overlay close on click
elements.gudduCelebration.addEventListener('click', () => {
    elements.gudduCelebration.classList.add('hidden');
});
}

// Rendering Logic
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
        li.className = `task-item ${task.status === 'completed' ? 'completed' : ''} ${task.status === 'failed' ? 'failed' : ''}`;

        let statusIconText = '';
        if (task.status === 'completed') statusIconText = '<i class="fa-solid fa-check btn-check"></i>';
        else if (task.status === 'failed') statusIconText = '<i class="fa-solid fa-xmark btn-cross"></i>';

        li.innerHTML = `
            <div class="task-info">
                ${statusIconText}
                <span class="task-title">${task.text}</span>
            </div>
            <div class="task-actions">
                ${task.status === 'pending' ? `
                    <button class="btn-check" onclick="updateTaskStatus(${task.id}, 'completed')" title="Complete">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <button class="btn-cross" onclick="updateTaskStatus(${task.id}, 'failed')" title="Fail">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                ` : ''}
                <button class="btn-delete" onclick="deleteTask(${task.id})" title="Delete Task">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        elements.taskList.appendChild(li);

        if (task.status === 'completed' || task.status === 'failed') {
            completedCount++;
        }
    });

    // Update Progress Bar
    const total = appState.tasks.length;
    const progress = total === 0 ? 0 : Math.round((completedCount / total) * 100);
    elements.dailyProgressFill.style.width = `${progress}%`;
    elements.progressText.textContent = `${progress}% Completed (${completedCount}/${total})`;

    // Complete Day Button logic
    if (total > 0 && completedCount === total) {
        elements.completeDayBtn.disabled = false;
    } else {
        elements.completeDayBtn.disabled = true;
    }
}

function renderStreak() {
    elements.streakCount.textContent = appState.streak.current;
    if (appState.streak.shieldActive) {
        elements.streakShield.classList.remove('hidden');
    } else {
        elements.streakShield.classList.add('hidden');
    }
}

function renderHealthSection() {
    if (appState.health.height) elements.heightInput.value = appState.health.height;
    if (appState.health.weight) elements.weightInput.value = appState.health.weight;

    elements.pcosToggle.checked = appState.health.pcosMode;
    if (appState.health.pcosMode) {
        elements.pcosRecommendations.classList.remove('hidden');
    } else {
        elements.pcosRecommendations.classList.add('hidden');
    }
}

// Logic Controllers
window.updateTaskStatus = function (taskId, status) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (task) {
        task.status = status;
        saveState();
        renderTasks();
    }
}

window.deleteTask = function (taskId) {
    appState.tasks = appState.tasks.filter(t => t.id !== taskId);
    saveState();
    renderTasks();
}

function handleAddTask() {
    const text = elements.newTaskInput.value.trim();
    if (text) {
        appState.tasks.push({
            id: Date.now(),
            text: text,
            status: "pending"
        });
        elements.newTaskInput.value = '';
        saveState();
        renderTasks();
    }
}

function handleCompleteDay() {
    const allCompletedSuccessfully = appState.tasks.every(t => t.status === 'completed');

    if (allCompletedSuccessfully) {
        // Masterful day logic
        appState.streak.current += 1;
        appState.streak.perfectDays += 1;
        appState.weeklyStats.completed += appState.tasks.length;

        // Shield logic (Earn exactly every 7 days, max 1 shield for simplicity)
        if (appState.streak.perfectDays % 7 === 0) {
            appState.streak.shieldActive = true;
        }

        // Guddu Special Logic
        if (appState.user.username.toLowerCase() === "guddu") {
            triggerGudduCelebration();
        } else {
            // Standard generic celebration
            triggerGenericCelebration();
        }

    } else {
        // Missed tasks day logic
        appState.weeklyStats.failed += appState.tasks.filter(t => t.status === 'failed').length;
        appState.weeklyStats.completed += appState.tasks.filter(t => t.status === 'completed').length;

        if (appState.streak.shieldActive) {
            // Consume Shield
            appState.streak.shieldActive = false;
            appState.streak.perfectDays = 0;
            alert("Streak Shield protected your streak today, but the shield was consumed!");
        } else {
            // Broken Streak
            appState.streak.current = 0;
            appState.streak.perfectDays = 0;
            alert("Streak broken! Back to Day 0. Consistency is key.");
        }
    }

    // Reset daily tasks
    appState.tasks.forEach(t => t.status = 'pending');
    saveState();

    renderAll();
    updateChart(); // Push new data to the chart
}

// Special Guddu Logic
function triggerGudduCelebration() {
    // Motivation Override
    elements.motivationalText.innerText = "Killing it today, Guddu! Make big bro proud!";

    // Confetti!
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#6366f1', '#a855f7', '#10b981']
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#6366f1', '#a855f7', '#10b981']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());

    // Show 🫂 Overlay
    elements.gudduMessage.innerText = "Awesome job today, Guddu!";
    elements.gudduCelebration.classList.remove('hidden');
}

function triggerGenericCelebration() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

function updateMotivationalText() {
    if (appState.user.username.toLowerCase() === "guddu") {
        elements.motivationalText.innerText = "Keep pushing, Guddu! You're stronger than you think!";
    } else {
        elements.motivationalText.innerText = `Keep pushing, ${appState.user.username}! You got this!`;
    }
}

// Biometrics Logic
function calculateIntensity() {
    const height = parseFloat(elements.heightInput.value);
    const weight = parseFloat(elements.weightInput.value);

    if (!height || !weight) {
        alert("Please enter valid height and weight");
        return;
    }

    appState.health.height = height;
    appState.health.weight = weight;
    saveState();

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    elements.intensityResult.classList.remove('hidden');

    if (bmi < 18.5) {
        elements.intensityLevel.textContent = "Low to Moderate";
        elements.intensityLevel.style.color = "#fbbf24";
        elements.intensityLevel.style.backgroundColor = "rgba(251, 191, 36, 0.2)";
        elements.intensityDesc.textContent = "Focus on building strength gradually with weight training.";
    } else if (bmi >= 18.5 && bmi <= 24.9) {
        elements.intensityLevel.textContent = "High / Vigorous";
        elements.intensityLevel.style.color = "#22c55e";
        elements.intensityLevel.style.backgroundColor = "rgba(34, 197, 94, 0.2)";
        elements.intensityDesc.textContent = "Mix of HIIT, cardio, and heavy lifting.";
    } else {
        elements.intensityLevel.textContent = "Low Impact / Moderate";
        elements.intensityLevel.style.color = "#3b82f6";
        elements.intensityLevel.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
        elements.intensityDesc.textContent = "Focus on brisk walking, swimming, or cycling to build cardiovascular base without joint stress.";
    }
}

// Chart.js Setup
let weeklyChartInstance = null;
function initChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');

    Chart.defaults.color = '#a1a1aa';
    Chart.defaults.font.family = 'Inter';

    weeklyChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Missed'],
            datasets: [{
                data: [appState.weeklyStats.completed, appState.weeklyStats.failed],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            cutout: '70%'
        }
    });
}

function updateChart() {
    if (weeklyChartInstance) {
        weeklyChartInstance.data.datasets[0].data = [
            appState.weeklyStats.completed,
            appState.weeklyStats.failed
        ];
        weeklyChartInstance.update();
    }
}

// Mock Leaderboard Logic
function renderLeaderboard() {
    const myStreak = appState.streak.current;

    let mockFriends = [
        { name: "IronMan23", streak: 45, seed: "Iron" },
        { name: "LiftingBro", streak: 12, seed: "Lift" },
        { name: "Anna", streak: 5, seed: "Anna" }
    ];

    // Insert current user
    mockFriends.push({
        name: appState.user.username + " (You)",
        streak: myStreak,
        seed: appState.user.avatarSeed,
        isMe: true
    });

    // Sort by descending streak
    mockFriends.sort((a, b) => b.streak - a.streak);

    elements.leaderboardList.innerHTML = '';
    mockFriends.forEach((friend, idx) => {
        const li = document.createElement('li');
        li.className = 'leaderboard-item';
        if (friend.isMe) {
            li.style.background = 'rgba(99, 102, 241, 0.1)';
            li.style.border = '1px solid rgba(99, 102, 241, 0.3)';
        }

        let rankClass = '';
        if (idx === 0) rankClass = 'gold';
        else if (idx === 1) rankClass = 'silver';
        else if (idx === 2) rankClass = 'bronze';

        li.innerHTML = `
            <div class="lb-rank ${rankClass}">#${idx + 1}</div>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(friend.seed)}" class="lb-avatar" alt="avatar">
            <div class="lb-name">${friend.name}</div>
            <div class="lb-streak">
                <i class="fa-solid fa-fire text-orange"></i> ${friend.streak}
            </div>
        `;
        elements.leaderboardList.appendChild(li);
    });
}

// Boot
document.addEventListener('DOMContentLoaded', init);
