// ======================
// LOCAL STORAGE DATA
// ======================
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let streak = parseInt(localStorage.getItem("streak")) || 0;
let mood = localStorage.getItem("mood") || "";
let xp = parseInt(localStorage.getItem("xp")) || 0;

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
    saveTasks();
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
            xp += 10; // 🎮 XP gain
        }
        return task.id === id
            ? { ...task, completed: !task.completed }
            : task;
    });

    checkAllCompleted();
    saveAll();
    renderTasks();
    updateXPUI();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
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
        xp += 50; // bonus XP 🔥

        showToast("🔥 Streak Increased!");
        launchConfetti();
        tasks = [];
        saveTasks();
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
    let level = Math.floor(xp / 100);
    let progress = xp % 100;

    xpFill.style.width = progress + "%";

    document.getElementById("user-level").textContent =
        "Level " + level + " 🔥";
}

// ======================
// MOOD SYSTEM
// ======================
function setMood(m) {
    mood = m;
    localStorage.setItem("mood", mood);
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
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("streak", streak);
    localStorage.setItem("xp", xp);
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
    const lastDate = localStorage.getItem("lastDate");
    const today = new Date().toDateString();

    if (lastDate !== today) {
        tasks = [];
        saveTasks();
        localStorage.setItem("lastDate", today);
    }
}
dailyReset();
// toast function
function showToast(msg) { ... }

// confetti function
function launchConfetti() { ... }

// somewhere in streak logic
showToast("🔥 Streak Increased!");
launchConfetti();