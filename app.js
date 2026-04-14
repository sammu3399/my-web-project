// ======================
// AUTH & SESSION
// ======================
const currentUser = localStorage.getItem("username");

function checkAuth() {
    if (!currentUser) {
        // Only redirect if we are not already on login.html or reset-password.html
        const path = window.location.pathname;
        if (!path.includes("login.html") && !path.includes("reset-password.html")) {
            window.location.href = "login.html";
        }
    } else {
        setupUI();
        init();
    }
}

async function uploadAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;

    showToast("📸 Uploading...");
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await _supabase.storage
        .from('avatars')
        .upload(fileName, file);

    if (uploadError) {
        showToast(`❌ Error: ${uploadError.message}`);
        return;
    }

    const { data: { publicUrl } } = _supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

    const { error: updateError } = await _supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('username', currentUser);

    if (!updateError) {
        document.getElementById("profile-img").src = publicUrl;
        showToast("✅ Profile photo updated!");
    }
}

function setupUI() {
    const initUI = () => {
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                localStorage.removeItem("username");
                window.location.href = "login.html";
            });
        }

        // Pink Mode Logic
        const pinkToggleBtn = document.getElementById("pink-toggle-btn");
        if (pinkToggleBtn) {
            pinkToggleBtn.addEventListener("click", async () => {
                isPinkMode = !isPinkMode;
                await saveAll();
                applyMood();
            });
        }

        // Avatar Upload Listener
        const avatarInput = document.getElementById("avatar-upload");
        if (avatarInput) {
            avatarInput.addEventListener("change", uploadAvatar);
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
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initUI);
    } else {
        initUI();
    }
}

checkAuth();

// ======================
// SYNCED LOGIC
// ======================
function handleDailyQuote() {
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
        let quoteIndex = parseInt(localStorage.getItem(`quoteIndex_${currentUser}`));
        const lastQuoteDate = localStorage.getItem(`lastQuoteDate_${currentUser}`);

        if (isNaN(quoteIndex) || lastQuoteDate !== todayStr) {
            quoteIndex = Math.floor(Math.random() * quotes.length);
            localStorage.setItem(`quoteIndex_${currentUser}`, quoteIndex);
            localStorage.setItem(`lastQuoteDate_${currentUser}`, todayStr);
        }
        dailyQuote.textContent = `"${quotes[quoteIndex]}"`;
    }
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
    
    try {
        // Load profile from Supabase
        let { data: profile, error: profileErr } = await _supabase
            .from('profiles')
            .select('*')
            .eq('username', currentUser)
            .single();
        
        // Handle missing profile (re-create it)
        if (!profile && profileErr && (profileErr.code === 'PGRST116' || profileErr.message.includes('not found'))) {
            const { data: newProfile, error: createErr } = await _supabase
                .from('profiles')
                .insert([{ 
                    username: currentUser, 
                    streak: 0, 
                    xp: 0, 
                    level: 1 
                }])
                .select()
                .single();
            if (!createErr) profile = newProfile;
        } else if (profileErr) {
            // Throw for other errors (like missing columns)
            throw profileErr;
        }
        
        if (profile) {
            streak = profile.streak || 0;
            xp = profile.xp || 0;
            level = profile.level || 1;
            mood = profile.mood || "";
            isPinkMode = !!profile.pink_mode;

            // Update UI
            document.getElementById("display-name").textContent = profile.username;
            const profileImg = document.getElementById("profile-img");
            if (profileImg) {
                profileImg.src = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;
            }
        }

        // Load tasks from Supabase
        const { data: dbTasks, error: tasksErr } = await _supabase
            .from('tasks')
            .select('*')
            .eq('username', currentUser);
        
        if (tasksErr) throw tasksErr;
        
        tasks = dbTasks || [];

        renderTasks();
        renderHistory();
        updateStreakUI();
        updateXPUI();
        applyMood();
        handleDailyQuote();
        dailyReset();

    } catch (err) {
        console.error("Initialization Error:", err);
        showToast("⚠️ Database sync failed. Check your Supabase columns!");
        // Set some defaults so the UI isn't completely broken
        document.getElementById("display-name").textContent = currentUser;
    }
}
init();

// ======================
// TASK SYSTEM
// ======================
addTaskBtn.addEventListener("click", addTask);

// Support Enter key
taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTask();
});

async function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const { error } = await _supabase
        .from('tasks')
        .insert([{
            username: currentUser,
            text: text,
            completed: false
        }]);

    if (!error) {
        // Refresh local tasks and render
        const { data: dbTasks } = await _supabase
            .from('tasks')
            .select('*')
            .eq('username', currentUser);
        
        tasks = dbTasks || [];
        renderTasks();
        taskInput.value = "";
        showToast("✅ Task added!");
    } else {
        console.error("Supabase Add Error:", error);
        showToast(`❌ Error: ${error.message}`);
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
        
        // Show Guddu message ONLY for the user named 'guddu'
        if (currentUser && currentUser.toLowerCase() === "guddu") {
            showGudduMessage(); 
        }
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
        "🧘‍♀️ Garland Pose (1 min)",
        "🧘‍♀️ Bridge Pose (1 min)",
        "🧘‍♀️ Child's Pose (2 mins)",
        "🧘‍♀️ Pigeon Pose (1 min per side)",
        "🧘‍♀️ Reclining Bound Angle (2 mins)"
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
        const streakKey = `streakDate_${currentUser}`;
        const streakDateStr = localStorage.getItem(streakKey);
        const today = new Date().toDateString();

        if (streakDateStr !== today) {
            streak++;
            addXP(50); // bonus XP
            showToast("🔥 Streak Increased!");
            launchConfetti();

            localStorage.setItem(streakKey, today);
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

const gudduMessages = [
    "Guddu says: Wow! You're crushing it! 🚀",
    "Guddu is so proud of you! Keep that momentum! 💎",
    "Guddu: Another win in the bag! You're unstoppable! 🔥",
    "Guddu: Your future self is thanking you right now! ✨",
    "Guddu: Look at that focus! You're on fire! 🦁",
    "Guddu says: Small steps lead to big wins! Keep going! 🏆"
];

const vipGudduMessages = [
    "Guddu says: Hey namesake! You're doing incredible today! 👑",
    "Guddu is extra proud of you, Guddu! Legacy in the making! 🌟",
    "Guddu: From one legend to another, keep winning! 💎",
    "Guddu: You're not just a user, you're the inspiration! 🔥"
];

function showGudduMessage() {
    const existing = document.querySelector(".guddu-toast");
    if (existing) existing.remove();

    let pool = gudduMessages;
    if (currentUser && currentUser.toLowerCase() === "guddu") {
        pool = [...gudduMessages, ...vipGudduMessages];
    }

    const msg = pool[Math.floor(Math.random() * pool.length)];
    const toast = document.createElement("div");
    toast.className = "guddu-toast";
    toast.innerHTML = `
        <div class="guddu-icon">🦁</div>
        <div class="guddu-text">${msg}</div>
    `;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add("active"), 100);
    
    // Auto-remove
    setTimeout(() => {
        toast.classList.remove("active");
        setTimeout(() => toast.remove(), 500);
    }, 4000);
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
    const count = 80;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";

        // Starting position (center)
        confetti.style.setProperty("--x", centerX + "px");
        confetti.style.setProperty("--y", centerY + "px");

        // Random destination (blast effect)
        const angle = Math.random() * Math.PI * 2;
        const velocity = 100 + Math.random() * 300;
        const tx = Math.cos(angle) * velocity + "px";
        const ty = Math.sin(angle) * velocity + "px";
        const tr = (Math.random() * 720) + "deg";

        confetti.style.setProperty("--tx", tx);
        confetti.style.setProperty("--ty", ty);
        confetti.style.setProperty("--tr", tr);

        // Color & Shape
        confetti.style.background = `hsl(${Math.random() * 360}, 100%, 60%)`;
        confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";

        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 1500);
    }
}
// ======================
// DAILY RESET SYSTEM
// ======================
async function dailyReset() {
    if (!currentUser) return;
    const lastDate = localStorage.getItem(`lastDate_${currentUser}`);
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
            localStorage.setItem(`lastDate_${currentUser}`, today);
        }
    }
}