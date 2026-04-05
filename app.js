// ======================
// AUTH CHECK
// ======================
const currentUser = localStorage.getItem("username");
if (!currentUser) {
    window.location.href = "login.html";
} else {
    document.addEventListener("DOMContentLoaded", () => {
        const displayName = document.getElementById("display-name");
        if (displayName) displayName.textContent = currentUser;
        
        const avatar = document.querySelector(".profile-avatar");
        if (avatar) avatar.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser}`;
        
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                localStorage.removeItem("username");
                window.location.href = "login.html";
            });
        }
    });
}

// ======================
// LOCAL STORAGE DATA
// ======================
let tasks = [];
let streak = 0;
let mood = "";
let xp = 0;
let level = 1;

if (currentUser) {
    tasks = JSON.parse(localStorage.getItem(`${currentUser}_tasks`)) || [];
    
    let parsedStreak = parseInt(localStorage.getItem(`${currentUser}_streak`));
    streak = isNaN(parsedStreak) ? 0 : parsedStreak;
    
    mood = localStorage.getItem(`${currentUser}_mood`) || "";
    
    let parsedXp = parseInt(localStorage.getItem(`${currentUser}_xp`));
    xp = isNaN(parsedXp) ? 0 : parsedXp;
    
    let parsedLevel = parseInt(localStorage.getItem(`${currentUser}_level`));
    level = isNaN(parsedLevel) ? 1 : parsedLevel;
}
// ======================
// ELEMENTS
// ======================
const taskInput = document.getElementById("task-input");
const addTaskBtn = document.getElementById("add-task-btn");
const taskList = document.getElementById("task-list");
const streakVal = document.querySelector(".streak-val");
const xpFill = document.querySelector(".xp-fill");
const yogaBox = document.getElementById("yoga-box");
const pcosMsg = document.getElementById("pcos-off-msg");

// ======================
// INIT
// ======================
function init() {
    renderTasks();
    updateStreakUI();
    updateXPUI();
    applyMood();
    dailyReset();
}
init();

// ======================
// TASK SYSTEM
// ======================
addTaskBtn.addEventListener("click", addTask);

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const task = {
        id: Date.now(),
        text,
        completed: false
    };

    tasks.push(task);
    saveAll();
    renderTasks();
    taskInput.value = "";
}

function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach(task => {
        const div = document.createElement("div");
        div.className = "task-item";

        div.innerHTML = `
            <span class="${task.completed ? 'done' : ''}">${task.text}</span>
            <div>
                <button onclick="toggleTask(${task.id})">✔</button>
                <button onclick="deleteTask(${task.id})">❌</button>
            </div>
        `;

        taskList.appendChild(div);
    });
}

function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id && !task.completed) {
            addXP(10); // XP per task
        }
        return task.id === id ? { ...task, completed: !task.completed } : task;
    });

    checkAllCompleted();
    saveAll();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveAll();
    renderTasks();
}
// ======================
// STREAK SYSTEM
// ======================
function checkAllCompleted() {
    if (tasks.length === 0) return;

    const allDone = tasks.every(t => t.completed);

    if (allDone) {
        streak++;
        addXP(50); // bonus XP
        showToast("🔥 Streak Increased!");
        launchConfetti();

        tasks = [];
        saveAll();
    }

    updateStreakUI();
}

function updateStreakUI() {
    streakVal.textContent = streak;
}

// ======================
// XP SYSTEM
// ======================
const maxXp = 150;

function updateXPUI() {
    let percent = (xp / maxXp) * 100;
    xpFill.style.width = percent + "%";
    document.querySelector(".xp-text").innerText = xp + " / " + maxXp + " XP";
    document.getElementById("user-level").textContent = "Level " + level + " 🔥";
}

function addXP(amount) {
    xp += amount;

    while (xp >= maxXp) {
        xp -= maxXp;
        level++;
        showToast("🎉 Level Up!");
        launchConfetti();
    }

    saveAll();
    updateXPUI();
}

// ======================
// MOOD SYSTEM
// ======================
function setMood(m) {
    mood = m;
    if (currentUser) localStorage.setItem(`${currentUser}_mood`, mood);
    applyMood();
}

function applyMood() {
    if (!mood) return;
    document.body.setAttribute("data-mood", mood);
}
// ======================
// WELLNESS TOGGLE
// ======================
function enableWellness(enable = true) {
    if (enable) {
        yogaBox.classList.remove("hidden");
        pcosMsg.style.display = "none";
    } else {
        yogaBox.classList.add("hidden");
        pcosMsg.style.display = "block";
    }
}

// ======================
// SAVE ALL
// ======================
function saveAll() {
    if (!currentUser) return;
    localStorage.setItem(`${currentUser}_tasks`, JSON.stringify(tasks));
    localStorage.setItem(`${currentUser}_streak`, streak);
    localStorage.setItem(`${currentUser}_xp`, xp);
    localStorage.setItem(`${currentUser}_level`, level);
}

// ======================
// TOAST NOTIFICATION 🔔
// ======================
function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = msg;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}
function launchConfetti() {
    for (let i = 0; i < 40; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";

        confetti.style.left = Math.random() * 100 + "vw";
        confetti.style.background =
            `hsl(${Math.random() * 360}, 100%, 50%)`;

        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 2000);
    }
}
// ======================
// DAILY RESET SYSTEM
// ======================
function dailyReset() {
    if (!currentUser) return;
    const lastDate = localStorage.getItem(`${currentUser}_lastDate`);
    const today = new Date().toDateString();

    if (lastDate !== today) {
        tasks = [];
        saveAll();
        localStorage.setItem(`${currentUser}_lastDate`, today);
    }
}