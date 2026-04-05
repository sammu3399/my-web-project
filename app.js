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

        // Daily Quote Logic
        const dailyQuote = document.getElementById("daily-quote-text");
        if (dailyQuote) {
            const quotes = [
                "Believe you can and you're halfway there.",
                "The only way to do great work is to love what you do.",
                "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                "Act as if what you do makes a difference. It does.",
                "Your limitation—it's only your imagination.",
                "Push yourself, because no one else is going to do it for you.",
                "Dream it. Wish it. Do it.",
                "Stay focused, go after your dreams and keep moving toward your goals."
            ];
            const todayStr = new Date().toDateString();
            let quoteIndex = parseInt(localStorage.getItem(`${currentUser}_quoteIndex`));
            const lastQuoteDate = localStorage.getItem(`${currentUser}_lastQuoteDate`);

            if (isNaN(quoteIndex) || lastQuoteDate !== todayStr) {
                quoteIndex = Math.floor(Math.random() * quotes.length);
                localStorage.setItem(`${currentUser}_quoteIndex`, quoteIndex);
                localStorage.setItem(`${currentUser}_lastQuoteDate`, todayStr);
            }
            dailyQuote.textContent = `"${quotes[quoteIndex]}"`;
        }
        
        // Pink Mode Logic
        const pinkToggleBtn = document.getElementById("pink-toggle-btn");
        if (pinkToggleBtn) {
            pinkToggleBtn.addEventListener("click", () => {
                isPinkMode = !isPinkMode;
                localStorage.setItem(`${currentUser}_pinkMode`, isPinkMode);
                applyMood();
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
let isPinkMode = false;
let xp = 0;
let level = 1;
const maxXp = 150;

if (currentUser) {
    tasks = JSON.parse(localStorage.getItem(`${currentUser}_tasks`)) || [];

    let parsedStreak = parseInt(localStorage.getItem(`${currentUser}_streak`));
    streak = isNaN(parsedStreak) ? 0 : parsedStreak;

    mood = localStorage.getItem(`${currentUser}_mood`) || "";
    isPinkMode = localStorage.getItem(`${currentUser}_pinkMode`) === "true";

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
        const streakDateStr = localStorage.getItem(`${currentUser}_streakDate`);
        const today = new Date().toDateString();
        
        if (streakDateStr !== today) {
            streak++;
            addXP(50); // bonus XP
            showToast("🔥 Streak Increased!");
            launchConfetti();
            
            localStorage.setItem(`${currentUser}_streakDate`, today);
            saveAll();
        }
    }

    updateStreakUI();
}

function updateStreakUI() {
    streakVal.textContent = streak;
}

// ======================
// XP SYSTEM
// ======================

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
    isPinkMode = false; // Selecting standard mood forces pink mode off
    if (currentUser) {
        localStorage.setItem(`${currentUser}_mood`, mood);
        localStorage.setItem(`${currentUser}_pinkMode`, isPinkMode);
    }
    applyMood();
}

function applyMood() {
    let currentTheme = isPinkMode ? "🌸" : mood;
    if (!currentTheme) {
        document.body.removeAttribute("data-mood");
    } else {
        document.body.setAttribute("data-mood", currentTheme);
    }
    
    const pcosPanel = document.getElementById("pcos-panel");
    const pinkToggleBtn = document.getElementById("pink-toggle-btn");
    
    if (pcosPanel) {
        if (isPinkMode) {
            pcosPanel.classList.remove("hidden");
            if(pinkToggleBtn) pinkToggleBtn.textContent = "🌸 Turn Pink Mode OFF";
        } else {
            pcosPanel.classList.add("hidden");
            if(pinkToggleBtn) pinkToggleBtn.textContent = "🌸 Turn Pink Mode ON";
        }
    }
}
// Wellness removed

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
        tasks.forEach(t => t.completed = false);
        saveAll();
        renderTasks();
        localStorage.setItem(`${currentUser}_lastDate`, today);
    }
}