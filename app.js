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
            "Stay focused, go after your dreams and keep moving toward your goals.",
            "Discipline is the bridge between goals and accomplishment.",
            "Excellence is not an act, but a habit.",
            "Success is not greatness, it is consistency.",
            "Discipline is choosing between what you want now and what you want most.",
            "Mastering yourself is true power.",
            "The way to get started is to quit talking and begin doing.",
            "Continuous progress is the key to outrageous success.",
            "Action is the foundational key to all success.",
            "It does not matter how slowly you go so long as you do not stop.",
            "Successful people work hard, then succeed on purpose."
        ];

        const todayStr = new Date().toDateString();
        const lastQuoteDate = localStorage.getItem(`lastQuoteDate_${currentUser}`);
        let quoteIndex = parseInt(localStorage.getItem(`quoteIndex_${currentUser}`));

        if (isNaN(quoteIndex) || lastQuoteDate !== todayStr) {
            // Logic to pick a unique quote until all are seen
            let seenIndices = JSON.parse(localStorage.getItem(`seenQuotes_${currentUser}`) || "[]");
            
            // If all quotes seen, reset the list
            if (seenIndices.length >= quotes.length) {
                seenIndices = [];
            }

            // Find an index that hasn't been seen yet
            let availableIndices = quotes.map((_, i) => i).filter(i => !seenIndices.includes(i));
            quoteIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

            // Save new state
            seenIndices.push(quoteIndex);
            localStorage.setItem(`seenQuotes_${currentUser}`, JSON.stringify(seenIndices));
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

// Audio Elements
const soundSuccess = document.getElementById("sound-success");
const soundLevelUp = document.getElementById("sound-level-up");
const soundHover = document.getElementById("sound-hover"); // New hover sound

function playSound(type) {
    if (type === "success" && soundSuccess) soundSuccess.play().catch(e => console.log("Audio play blocked"));
    if (type === "level-up" && soundLevelUp) soundLevelUp.play().catch(e => console.log("Audio play blocked"));
    if (type === "hover" && soundHover) soundHover.play().catch(e => null); // Silent catch for hover spam
}

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

            // Dynamic Greeting Logic
            const hr = new Date().getHours();
            let greeting = "Good Evening, ";
            if (hr >= 5 && hr < 12) greeting = "Good Morning, ";
            else if (hr >= 12 && hr < 18) greeting = "Good Afternoon, ";

            document.getElementById("display-name").textContent = greeting + profile.username + "!";
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
        
        // --- NEW PREMIUM FEATURES ---
        initTimer();
        loadWater();
        loadGoal();
        loadBadges();
        initChart();

    } catch (err) {
        console.error("Initialization Error:", err);
        showToast("⚠️ Database sync failed!");
        if (document.getElementById("display-name")) {
            document.getElementById("display-name").textContent = currentUser;
        }
    }
}
init();

// ======================
// TASK SYSTEM
// ======================
if (addTaskBtn) addTaskBtn.addEventListener("click", addTask);

if (taskInput) {
    taskInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addTask();
    });
}

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
        const { data: dbTasks } = await _supabase
            .from('tasks')
            .select('*')
            .eq('username', currentUser);
        
        tasks = dbTasks || [];
        renderTasks();
        taskInput.value = "";
        showToast("✅ Task added!");
    } else {
        showToast(`❌ Error: ${error.message}`);
    }
}

function renderTasks() {
    if (!taskList) return;
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
        logCompletion(tasks[taskIndex].text);
        
        if (currentUser && currentUser.toLowerCase() === "guddu") {
            showGudduMessage(); 
        }
        
        playSound("success");
        checkAchievements();
    }

    checkAllCompleted();
    saveAll();
    renderTasks();
}

async function logCompletion(taskName) {
    await _supabase
        .from('task_history')
        .insert([{
            username: currentUser,
            task_text: taskName,
            completed_at: new Date().toISOString()
        }]);
    renderHistory();
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
        "🧘‍♀️ Butterfly Pose (2 mins)", "🧘‍♀️ Cobra Pose (1 min)", "🧘‍♀️ Cat-Cow Stretch (10 reps)",
        "🧘‍♀️ Garland Pose (1 min)", "🧘‍♀️ Bridge Pose (1 min)", "🧘‍♀️ Child's Pose (2 mins)",
        "🧘‍♀️ Pigeon Pose (1 min per side)", "🧘‍♀️ Reclining Bound Angle (2 mins)"
    ];

    let addedCount = 0;
    for (const routineText of routine) {
        const exists = tasks.some(t => t.text === routineText);
        if (!exists) {
            const { data, error } = await _supabase
                .from('tasks')
                .insert([{ username: currentUser, text: routineText, completed: false }])
                .select().single();
            if (!error && data) {
                tasks.push(data);
                addedCount++;
            }
        }
    }

    if (addedCount > 0) {
        renderTasks();
        showToast(`🌸 ${addedCount} Exercises Added!`);
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
            addXP(50);
            showToast("🔥 Streak Increased!");
            launchConfetti();
            localStorage.setItem(streakKey, today);
            saveAll();
        }
    }
    updateStreakUI();
}

function updateStreakUI() {
    if (streakVal) streakVal.textContent = streak;
}

// ======================
// XP SYSTEM
// ======================
function updateXPUI() {
    let percent = (xp / maxXp) * 100;
    if (xpFill) xpFill.style.width = percent + "%";
    const xpText = document.querySelector(".xp-text");
    if (xpText) xpText.innerText = xp + " / " + maxXp + " XP";
    const lvlText = document.getElementById("user-level");
    if (lvlText) lvlText.textContent = "Level " + level + " 🔥";
}

function addXP(amount) {
    xp += amount;
    while (xp >= maxXp) {
        xp -= maxXp;
        level++;
        showToast("🎉 Level Up!");
        launchConfetti();
        playSound("level-up");
    }
    saveAll();
    updateXPUI();
}

// ======================
// MOOD SYSTEM
// ======================
async function setMood(m) {
    mood = m;
    isPinkMode = false;
    await saveAll();
    applyMood();
}

function applyMood() {
    document.body.classList.remove('mood-happy', 'mood-fire', 'mood-sleep', 'mood-yoga');
    if (mood === '😊') document.body.classList.add('mood-happy');
    if (mood === '🔥') document.body.classList.add('mood-fire');
    if (mood === '😴') document.body.classList.add('mood-sleep');
    if (mood === '🧘') document.body.classList.add('mood-yoga');

    if (mood) document.body.setAttribute("data-mood", mood);

    const pcosPanel = document.getElementById("pcos-panel");
    const pinkToggleBtn = document.getElementById("pink-toggle-btn");
    const pinkTogglePanel = document.getElementById("pink-toggle-panel");

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

async function saveAll() {
    if (!currentUser) return;
    await _supabase.from('profiles').update({
        streak: streak, xp: xp, level: level, mood: mood, pink_mode: isPinkMode
    }).eq('username', currentUser);
}

// ======================
// MASCOT (GUDDU/SAMMU)
// ======================
const gudduMessages = [
    "Sammu says: Wow! You're crushing it! 🚀",
    "Sammu is so proud of you! Keep that momentum! 💎",
    "Sammu: Another win in the bag! You're unstoppable! 🔥",
    "Sammu: Your future self is thanking you right now! ✨",
    "Sammu: Look at that focus! You're on fire! 🦁",
    "Sammu says: Small steps lead to big wins! Keep going! 🏆",
    "Sammu: One more win for the books! 📚",
    "Sammu: You're on the right track, keep moving! 🛤️",
    "Sammu: Success looks good on you, Guddu! 💎",
    "Sammu: Every task counts! Great job! ✅"
];

const vipGudduMessages = [
    "Sammu says: Hey Guddu! You're doing incredible today, keep it up! 👑",
    "Sammu is extra proud of you, Guddu! Legacy in the making! 🌟",
    "Sammu: Guddu, keep winning! You're the best! 💎",
    "Sammu: You're not just a sister, you're my inspiration, Guddu! 🔥",
    "Sammu: I always knew you could do it, Guddu! 🌟",
    "Sammu: You're making me so proud every single day, Guddu! 🦁",
    "Sammu: Keep shining like the star you are, Guddu! ✨",
    "Sammu: Guddu, you're the strongest person I know! 🔥"
];

function showGudduMessage() {
    if (!currentUser || currentUser.toLowerCase() !== "guddu") return;
    const existing = document.querySelector(".guddu-toast");
    if (existing) existing.remove();

    let pool = [...gudduMessages, ...vipGudduMessages];
    const msg = pool[Math.floor(Math.random() * pool.length)];
    const toast = document.createElement("div");
    toast.className = "guddu-toast";
    toast.innerHTML = `<div class="guddu-icon">🦁</div><div class="guddu-text">${msg}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("active"), 100);
    setTimeout(() => {
        toast.classList.remove("active");
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// ======================
// UTILS
// ======================
function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function launchConfetti() {
    const count = 80;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.setProperty("--x", centerX + "px");
        confetti.style.setProperty("--y", centerY + "px");
        const angle = Math.random() * Math.PI * 2;
        const velocity = 100 + Math.random() * 300;
        confetti.style.setProperty("--tx", Math.cos(angle) * velocity + "px");
        confetti.style.setProperty("--ty", Math.sin(angle) * velocity + "px");
        confetti.style.setProperty("--tr", (Math.random() * 720) + "deg");
        confetti.style.background = `hsl(${Math.random() * 360}, 100%, 60%)`;
        confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 1500);
    }
}

async function dailyReset() {
    if (!currentUser) return;
    const lastDate = localStorage.getItem(`lastDate_${currentUser}`);
    const today = new Date().toDateString();
    if (lastDate !== today) {
        const { error } = await _supabase.from('tasks').update({ completed: false }).eq('username', currentUser);
        if (!error) {
            tasks.forEach(t => t.completed = false);
            renderTasks();
            localStorage.setItem(`lastDate_${currentUser}`, today);
        }
    }
}

// ======================
// PREMIUM FEATURES LOGIC
// ======================

// 1. Timer
let timerInterval;
let timeLeft = 25 * 60;
let isTimerRunning = false;
function initTimer() {
    const startBtn = document.getElementById("timer-start-btn");
    const resetBtn = document.getElementById("timer-reset-btn");
    if (!startBtn) return;
    startBtn.onclick = () => {
        if (isTimerRunning) { clearInterval(timerInterval); startBtn.innerText = "Resume"; }
        else { timerInterval = setInterval(() => { 
            if (timeLeft <= 0) { clearInterval(timerInterval); playSound("level-up"); showToast("⏰ Session complete!"); return; }
            timeLeft--; updateTimerUI();
        }, 1000); startBtn.innerText = "Pause"; }
        isTimerRunning = !isTimerRunning;
    };
    resetBtn.onclick = () => { clearInterval(timerInterval); isTimerRunning = false; timeLeft = 25 * 60; startBtn.innerText = "Start"; updateTimerUI(); };
}
function updateTimerUI() {
    const display = document.querySelector(".timer-display");
    if (display) display.innerText = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
}

// 2. Hydration
let waterCount = 0;
async function loadWater() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await _supabase.from('user_habits').select('value').eq('username', currentUser).eq('habit_type', 'water').eq('date', today).single();
    waterCount = data ? data.value : 0;
    updateWaterUI();
}
const addWaterBtn = document.getElementById("add-water-btn");
if (addWaterBtn) {
    addWaterBtn.onclick = async () => {
        waterCount = Math.min(waterCount + 1, 8);
        updateWaterUI();
        await _supabase.from('user_habits').upsert({ username: currentUser, habit_type: 'water', value: waterCount, date: new Date().toISOString().split('T')[0] }, { onConflict: 'username,habit_type,date' });
    };
}
function updateWaterUI() { if (document.getElementById("water-count")) document.getElementById("water-count").innerText = waterCount; }

// 3. Goal Wall
const goalUpload = document.getElementById("goal-upload");
if (goalUpload) goalUpload.addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    showToast("🎯 Uploading Goal...");
    const fileName = `goal-${currentUser}.${file.name.split('.').pop()}`;
    const { error } = await _supabase.storage.from('goals').upload(fileName, file, { upsert: true });
    if (!error) {
        const { data: { publicUrl } } = _supabase.storage.from('goals').getPublicUrl(fileName);
        await _supabase.from('profiles').update({ goal_image_url: publicUrl }).eq('username', currentUser);
        updateGoalUI(publicUrl);
        showToast("✅ Goal set!");
    }
});
async function loadGoal() {
    const { data } = await _supabase.from('profiles').select('goal_image_url').eq('username', currentUser).single();
    if (data?.goal_image_url) updateGoalUI(data.goal_image_url);
}
function updateGoalUI(url) {
    const img = document.getElementById("goal-img");
    const container = document.getElementById("goal-container");
    if (img && url) {
        img.src = url; img.style.display = "block";
        if (document.getElementById("goal-placeholder")) document.getElementById("goal-placeholder").style.display = "none";
        container.style.border = "none";
    }
}

// 4. Achievements
const ACHIEVEMENTS = { STREAK_7: "🔥 7-Day Warrior", TASKS_50: "👑 Productivity King", WATER_8: "💧 Hydration Master" };
async function loadBadges() {
    const { data } = await _supabase.from('user_achievements').select('achievement_type').eq('username', currentUser);
    if (data) data.forEach(ach => awardBadgeUI(ach.achievement_type));
}
async function checkAchievements() {
    if (streak >= 7) await awardBadge("STREAK_7");
    if (waterCount >= 8) await awardBadge("WATER_8");
}
async function awardBadge(type) {
    const { error } = await _supabase.from('user_achievements').upsert({ username: currentUser, achievement_type: type });
    if (!error) awardBadgeUI(type);
}
function awardBadgeUI(type) {
    const container = document.getElementById("badge-container");
    if (!container || document.getElementById(`badge-${type}`)) return;
    if (document.getElementById("no-badges")) document.getElementById("no-badges").style.display = "none";
    const badge = document.createElement("div");
    badge.className = "badge-item new";
    badge.id = `badge-${type}`;
    badge.title = ACHIEVEMENTS[type];
    badge.innerText = type === "STREAK_7" ? "🔥" : type === "TASKS_50" ? "👑" : "💧";
    container.appendChild(badge);
}

// 5. Chart (Custom CSS Bars)
function initChart() {
    const container = document.getElementById('weekly-bars-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Data replicating the provided UI image exactly
    const data = [
        { label: 'Sun', percent: 40 },
        { label: 'Mon', percent: 80 },
        { label: 'Tue', percent: 50 },
        { label: 'Wed', percent: 30 },
        { label: 'Thu', percent: 100 },
        { label: 'Fri', percent: 50 },
        { label: 'Sa', percent: 70 }
    ];

    data.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.className = `weekly-bar-wrapper ${item.percent === 100 ? 'completed' : ''}`;
        
        wrapper.innerHTML = `
            <div class="weekly-bar-check">✔</div>
            <div class="weekly-bar-bg" title="${item.percent}% completed">
                <div class="weekly-bar-fill" style="height: ${item.percent}%;">
                    <span class="weekly-bar-percent">${item.percent}%</span>
                </div>
            </div>
            <span class="weekly-bar-label">${item.label}</span>
        `;
        
        container.appendChild(wrapper);
    });
}

// ======================
// MICRO-INTERACTIONS
// ======================
document.addEventListener("DOMContentLoaded", () => {
    // Add hover sounds to all interactive buttons
    document.body.addEventListener("mouseenter", (e) => {
        if (e.target.tagName === "BUTTON" && !e.target.disabled) {
            if (soundHover) {
                soundHover.currentTime = 0;
                playSound("hover");
            }
        }
    }, true);
});