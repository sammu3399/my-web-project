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

        // Exclusive Details Accordion Logic
        const exerciseDetails = document.querySelectorAll('.exercise-details');
        exerciseDetails.forEach(detail => {
            detail.addEventListener('toggle', () => {
                if (detail.open) {
                    exerciseDetails.forEach(other => {
                        if (other !== detail) {
                            other.removeAttribute('open');
                        }
                    });
                }
            });
        });
    });
}

// ======================
// SUPABASE SYNCED DATA
// ======================
let tasks = [];
let streak = 0;
let mood = "";
let isPinkMode = false;
let xp = 0;
let level = 1;
const maxXp = 100;

// Variables will be loaded in the async init() function
// ======================
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
async function init() {
    if (!currentUser) return;
    
    // Load profile from Supabase
    const { data: profile } = await _supabase
        .from('profiles')
        .select('*')
        .eq('username', currentUser)
        .single();
    
    if (profile) {
        streak = profile.streak || 0;
        xp = profile.xp || 0;
        level = profile.level || 1;
        mood = profile.mood || "";
        isPinkMode = !!profile.pink_mode;
    }

    // Load tasks from Supabase
    const { data: dbTasks } = await _supabase
        .from('tasks')
        .select('*')
        .eq('username', currentUser);
    
    tasks = dbTasks || [];

    renderTasks();
    renderHistory();
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

async function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const { data, error } = await _supabase
        .from('tasks')
        .insert([{
            username: currentUser,
            text: text,
            completed: false
        }])
        .select()
        .single();

    if (!error && data) {
        tasks.push(data);
        renderTasks();
        taskInput.value = "";
    } else {
        showToast("❌ Failed to add task");
    }
}

function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach(task => {
        const div = document.createElement("div");
        div.className = "task-item";

        div.innerHTML = `
            <span class="${task.completed ? 'done' : ''}">${task.text}</span>
            <div>
                <button onclick="toggleTask('${task.id}')">✔</button>
                <button onclick="deleteTask('${task.id}')">❌</button>
            </div>
        `;

        taskList.appendChild(div);
    });
}

async function toggleTask(id) {
    let xpReward = tasks.length > 0 ? Math.round(100 / tasks.length) : 0;
    
    const taskIndex = tasks.findIndex(t => String(t.id) === String(id));
    if (taskIndex === -1) return;
    
    const wasCompleted = tasks[taskIndex].completed;
    const newCompletedStatus = !wasCompleted;

    const { error } = await _supabase
        .from('tasks')
        .update({ completed: newCompletedStatus })
        .eq('id', id);

    if (error) {
        showToast("❌ Error updating task");
        return;
    }

    tasks[taskIndex].completed = newCompletedStatus;

    if (!wasCompleted && newCompletedStatus) {
        addXP(xpReward);
        logCompletion(tasks[taskIndex].text); // RECORD HISTORY
    }

    checkAllCompleted();
    saveAll();
    renderTasks();
}

async function logCompletion(taskName) {
    const { error } = await _supabase
        .from('task_history')
        .insert([{
            username: currentUser,
            task_text: taskName,
            completed_at: new Date().toISOString()
        }]);

    if (!error) renderHistory(); // Refresh the list
}

async function renderHistory() {
    const historyList = document.getElementById("history-list");
    if (!historyList) return;

    const { data: history, error } = await _supabase
        .from('task_history')
        .select('*')
        .eq('username', currentUser)
        .order('completed_at', { ascending: false })
        .limit(10);

    if (error || !history || history.length === 0) {
        historyList.innerHTML = `<p style='font-size: 11px; color: var(--text-muted); font-style: italic;'>No recent activity</p>`;
        return;
    }

    historyList.innerHTML = history.map(item => {
        const date = new Date(item.completed_at);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString();
        
        return `
            <div class="history-item">
                <div class="history-item-top">
                    <span class="history-item-name">${item.task_text}</span>
                    <span class="history-item-time">${dateStr} @ ${timeStr}</span>
                </div>
                <span class="history-item-status">✔️ Completed</span>
            </div>
        `;
    }).join("");
}

async function deleteTask(id) {
    const { error } = await _supabase
        .from('tasks')
        .delete()
        .eq('id', id);

    if (!error) {
        tasks = tasks.filter(task => String(task.id) !== String(id));
        renderTasks();
    } else {
        showToast("❌ Failed to delete task");
    }
}

async function loadPCOSRoutine() {
    const routine = [
        "🧘‍♀️ Butterfly Pose (2 mins)",
        "🧘‍♀️ Cobra Pose (1 min)",
        "🧘‍♀️ Cat-Cow Stretch (10 reps)",
        "🧘‍♀️ Garland Pose (1 min)"
    ];

    let addedCount = 0;
    for (const routineText of routine) {
        const exists = tasks.some(t => t.text === routineText);
        if (!exists) {
            const { data, error } = await _supabase
                .from('tasks')
                .insert([{
                    username: currentUser,
                    text: routineText,
                    completed: false
                }])
                .select()
                .single();

            if (!error && data) {
                tasks.push(data);
                addedCount++;
            }
        }
    }

    if (addedCount > 0) {
        renderTasks();
        showToast(`🌸 ${addedCount} Exercises Added to Tasks!`);
    } else {
        showToast("⚠️ Routine is already in your tasks!");
    }
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
async function setMood(m) {
    mood = m;
    isPinkMode = false; // Selecting standard mood forces pink mode off
    if (currentUser) {
        await saveAll(); // Sync to Supabase
    }
    applyMood();
}

function applyMood() {
    document.body.classList.remove('mood-happy', 'mood-fire', 'mood-sleep', 'mood-yoga');
    if (mood === '😊') document.body.classList.add('mood-happy');
    if (mood === '🔥') document.body.classList.add('mood-fire');
    if (mood === '😴') document.body.classList.add('mood-sleep');
    if (mood === '🧘') document.body.classList.add('mood-yoga');

    if (!mood) {
        document.body.removeAttribute("data-mood");
    } else {
        document.body.setAttribute("data-mood", mood);
    }

    const pcosPanel = document.getElementById("pcos-panel");
    const pinkTogglePanel = document.getElementById("pink-toggle-panel");
    const pinkToggleBtn = document.getElementById("pink-toggle-btn");

    if (pcosPanel) {
        if (isPinkMode) {
            pcosPanel.classList.remove("hidden");
            if (pinkTogglePanel) pinkTogglePanel.classList.add("pcos-active");
            if (pinkToggleBtn) pinkToggleBtn.textContent = "🌸 Turn Pink Mode OFF";
        } else {
            pcosPanel.classList.add("hidden");
            if (pinkTogglePanel) pinkTogglePanel.classList.remove("pcos-active");
            if (pinkToggleBtn) pinkToggleBtn.textContent = "🌸 Turn Pink Mode ON";
        }
    }
}
// Wellness removed

// ======================
// SAVE ALL
// ======================
async function saveAll() {
    if (!currentUser) return;
    
    const { error } = await _supabase
        .from('profiles')
        .update({
            streak: streak,
            xp: xp,
            level: level,
            mood: mood,
            pink_mode: isPinkMode
        })
        .eq('username', currentUser);

    if (error) console.error("Sync Error:", error);
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
async function dailyReset() {
    if (!currentUser) return;
    const lastDate = localStorage.getItem(`${currentUser}_lastDate`);
    const today = new Date().toDateString();

    if (lastDate !== today) {
        // Reset in Supabase
        const { error } = await _supabase
            .from('tasks')
            .update({ completed: false })
            .eq('username', currentUser);

        if (!error) {
            tasks.forEach(t => t.completed = false);
            renderTasks();
            localStorage.setItem(`${currentUser}_lastDate`, today);
        }
    }
}