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
        // Dynamic Greeting
        const greetingEl = document.getElementById("dynamic-greeting");
        if (greetingEl) {
            const hour = new Date().getHours();
            let greeting = "Welcome";
            let icon = "👋";
            if (hour < 12) { greeting = "Good Morning"; icon = "☀️"; }
            else if (hour < 18) { greeting = "Good Afternoon"; icon = "🌤️"; }
            else { greeting = "Good Evening"; icon = "🌙"; }
            
            const displayUser = currentUser ? currentUser.charAt(0).toUpperCase() + currentUser.slice(1) : "Guest";
            greetingEl.innerText = `${greeting}, ${displayUser}! ${icon}`;
        }

        // Pink Mode Logic (Legacy Button)
        const pinkToggleBtn = document.getElementById("pink-toggle-btn");
        if (pinkToggleBtn) {
            pinkToggleBtn.addEventListener("click", async () => {
                isPinkMode = !isPinkMode;
                await saveAll();
                applyMood();
            });
        }

        // Settings Menu Interactions
        const settingLogoutBtn = document.getElementById("setting-logout-btn");
        if (settingLogoutBtn) {
            settingLogoutBtn.addEventListener("click", () => {
                localStorage.removeItem("username");
                window.location.href = "login.html";
            });
        }

        const themeSetting = document.getElementById("theme-setting");
        if (themeSetting) {
            themeSetting.addEventListener("click", async () => {
                isPinkMode = !isPinkMode;
                await saveAll();
                applyMood();
                
                // Visual Toggle
                const dot = document.getElementById("pink-toggle-dot");
                if (dot) {
                    dot.style.transform = isPinkMode ? "translateX(16px)" : "translateX(0)";
                    dot.parentElement.style.background = isPinkMode ? "#ff9a9e" : "rgba(255,255,255,0.2)";
                }
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

        // Auto-open Daily Insights once per day
        const todayStr = new Date().toLocaleDateString();
        const lastOpenDate = localStorage.getItem(`${currentUser}_lastInsightsOpen`);
        if (lastOpenDate !== todayStr) {
            setTimeout(() => {
                if (window.toggleInsights) {
                    window.toggleInsights();
                    localStorage.setItem(`${currentUser}_lastInsightsOpen`, todayStr);
                }
            }, 1800); // 1.8 second delay to let entrance animations finish playing
        }
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
        if (typeof renderCalendar === 'function') renderCalendar();


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

    tasks.forEach((task, index) => {
        const div = document.createElement("div");
        div.className = "task-item";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "space-between";
        div.style.padding = "15px";
        div.style.background = task.completed ? "rgba(0, 242, 254, 0.05)" : "rgba(255, 255, 255, 0.03)";
        div.style.borderRadius = "15px";
        div.style.marginBottom = "10px";
        div.style.border = task.completed ? "1px solid rgba(0, 242, 254, 0.3)" : "1px solid transparent";
        div.style.transition = "0.3s";
        
        const mockStreak = (index * 2) + 1; // Visual artifact logic
        
        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div onclick="toggleTask('${task.id}')" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${task.completed ? '#00f2fe' : 'rgba(255,255,255,0.3)'}; background: ${task.completed ? '#00f2fe' : 'transparent'}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; flex-shrink: 0;">
                    ${task.completed ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#121212" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                </div>
                <div>
                    <span class="${task.completed ? 'done' : ''}" style="display: block; font-size: 15px; margin-bottom: 2px; color: ${task.completed ? '#00f2fe' : 'var(--text-main)'}; transition: 0.3s;">${task.text}</span>
                    <span style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                        <span style="color: #ff9a9e;">🔥</span> ${mockStreak} days streak
                    </span>
                </div>
            </div>
            <div>
                <button onclick="deleteTask('${task.id}')" style="background: transparent; border: none; font-size: 16px; cursor: pointer; color: rgba(255,255,255,0.2); transition: 0.3s;" onmouseover="this.style.color='#ff5e62'" onmouseout="this.style.color='rgba(255,255,255,0.2)'">🗑️</button>
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

// 5. Chart (Custom CSS Bars Slider)
function initChart() {
    const container = document.getElementById('weekly-bars-container');
    const dotsContainer = document.getElementById('slider-dots');
    const titleStatus = document.getElementById('weekly-title');
    if (!container) return;
    
    container.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';
    
    // Multiple weeks of data to simulate the slider
    const weeksData = [
        {
            title: "This Week's",
            data: [
                { label: 'Sun', percent: 40 }, { label: 'Mon', percent: 80 }, { label: 'Tue', percent: 50 },
                { label: 'Wed', percent: 30 }, { label: 'Thu', percent: 100 }, { label: 'Fri', percent: 50 }, { label: 'Sa', percent: 70 }
            ]
        },
        {
            title: "Last Week's",
            data: [
                { label: 'Sun', percent: 60 }, { label: 'Mon', percent: 90 }, { label: 'Tue', percent: 20 },
                { label: 'Wed', percent: 80 }, { label: 'Thu', percent: 60 }, { label: 'Fri', percent: 100 }, { label: 'Sa', percent: 40 }
            ]
        },
        {
            title: "2 Weeks Ago",
            data: [
                { label: 'Sun', percent: 100 }, { label: 'Mon', percent: 70 }, { label: 'Tue', percent: 90 },
                { label: 'Wed', percent: 40 }, { label: 'Thu', percent: 50 }, { label: 'Fri', percent: 80 }, { label: 'Sa', percent: 60 }
            ]
        }
    ];

    container.style.width = (weeksData.length * 100) + '%';

    weeksData.forEach((week, slideIndex) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'weekly-slide';
        slideDiv.style.width = (100 / weeksData.length) + '%';
        
        week.data.forEach((item) => {
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
            slideDiv.appendChild(wrapper);
        });
        
        container.appendChild(slideDiv);

        // Add dot marker
        if (dotsContainer) {
            const dot = document.createElement('div');
            dot.className = `slider-dot ${slideIndex === 0 ? 'active' : ''}`;
            dot.onclick = () => window.goToSlide(slideIndex);
            dotsContainer.appendChild(dot);
        }
    });

    let currentSlide = 0;
    const totalSlides = weeksData.length;

    window.goToSlide = function(index) {
        if(index < 0) index = 0;
        if(index >= totalSlides) index = totalSlides - 1;
        currentSlide = index;
        
        const translateX = -(currentSlide * (100 / totalSlides));
        container.style.transform = `translateX(${translateX}%)`;
        
        if(titleStatus) titleStatus.innerText = weeksData[currentSlide].title + " Progress";

        if (dotsContainer) {
            Array.from(dotsContainer.children).forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }
    }

    const prevBtn = document.getElementById('slide-prev');
    const nextBtn = document.getElementById('slide-next');
    
    if(prevBtn) {
        const newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        newPrev.onclick = () => { window.goToSlide(currentSlide - 1); playSound("hover"); };
    }
    if(nextBtn) {
        const newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        newNext.onclick = () => { window.goToSlide(currentSlide + 1); playSound("hover"); };
    }
}

// ======================
// BOTTOM SHEET LOGIC
// ======================
window.closeAllSheets = function() {
    const analytics = document.getElementById('analytics-sheet');
    const profile = document.getElementById('profile-sheet');
    const insights = document.getElementById('insights-sheet');
    const overlay = document.getElementById('sheet-overlay');
    if(analytics) analytics.classList.remove('sheet-active');
    if(profile) profile.classList.remove('sheet-active');
    if(insights) insights.classList.remove('sheet-active');
    if(overlay) overlay.classList.remove('active');

    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
    const homeBtn = document.getElementById('nav-home');
    if(homeBtn) homeBtn.classList.add('active');
};

window.toggleAnalytics = function() {
    const sheet = document.getElementById('analytics-sheet');
    const overlay = document.getElementById('sheet-overlay');
    const navBtn = document.getElementById('nav-analytics');
    if (sheet && overlay) {
        if (sheet.classList.contains('sheet-active')) {
            window.closeAllSheets();
        } else {
            window.closeAllSheets();
            const homeBtn = document.getElementById('nav-home');
            if(homeBtn) homeBtn.classList.remove('active');
            sheet.classList.add('sheet-active');
            overlay.classList.add('active');
            if(navBtn) navBtn.classList.add('active');
            playSound("hover");
        }
    }
};

window.toggleProfile = function() {
    const sheet = document.getElementById('profile-sheet');
    const overlay = document.getElementById('sheet-overlay');
    const navBtn = document.getElementById('nav-profile');
    if (sheet && overlay) {
        if (sheet.classList.contains('sheet-active')) {
            window.closeAllSheets();
        } else {
            window.closeAllSheets();
            const homeBtn = document.getElementById('nav-home');
            if(homeBtn) homeBtn.classList.remove('active');
            sheet.classList.add('sheet-active');
            overlay.classList.add('active');
            if(navBtn) navBtn.classList.add('active');
            playSound("hover");
        }
    }
};

window.toggleInsights = function() {
    const sheet = document.getElementById('insights-sheet');
    const overlay = document.getElementById('sheet-overlay');
    const navBtn = document.getElementById('nav-insights');
    if (sheet && overlay) {
        if (sheet.classList.contains('sheet-active')) {
            window.closeAllSheets();
        } else {
            window.closeAllSheets();
            const homeBtn = document.getElementById('nav-home');
            if(homeBtn) homeBtn.classList.remove('active');
            sheet.classList.add('sheet-active');
            overlay.classList.add('active');
            if(navBtn) navBtn.classList.add('active');
            playSound("hover");
        }
    }
};

window.goHome = function() {
    window.closeAllSheets();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    playSound("hover");
};

window.focusTaskInput = function() {
    const input = document.getElementById('task-input');
    if (input) {
        window.closeAllSheets();
        input.focus();
        input.classList.remove('input-pulse');
        void input.offsetWidth; // reflow
        input.classList.add('input-pulse');
        playSound("hover");
    }
};

// ======================
// MICRO-INTERACTIONS & SWIPE
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

    // Add Swipe to Dismiss for all bottom sheets
    const sheets = document.querySelectorAll('.bottom-sheet');
    sheets.forEach(sheet => {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        const handle = sheet.querySelector('.sheet-drag-handle');

        const onTouchStart = (e) => {
            if (!sheet.classList.contains('sheet-active')) return;
            startY = e.touches ? e.touches[0].clientY : e.clientY;
            isDragging = true;
            sheet.style.transition = 'none';
        };

        const onTouchMove = (e) => {
            if (!isDragging) return;
            currentY = e.touches ? e.touches[0].clientY : e.clientY;
            let diff = currentY - startY;
            if (diff > 0) {
                sheet.style.transform = `translateY(${diff}px)`;
            }
        };

        const onTouchEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            sheet.style.transition = 'bottom 0.5s cubic-bezier(0.19, 1, 0.22, 1), transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
            sheet.style.transform = '';
            const diff = currentY - startY;
            if (diff > 100) {
                window.closeAllSheets();
            }
        };

        if (handle) {
            handle.addEventListener('touchstart', onTouchStart, {passive: true});
            handle.addEventListener('mousedown', onTouchStart);
        }
        
        // Listen globally for move and end so drag isn't lost
        window.addEventListener('touchmove', onTouchMove, {passive: true});
        window.addEventListener('mousemove', onTouchMove);
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('mouseup', onTouchEnd);
    });
});

// ======================
// CALENDAR & AI CHAT MOCK
// ======================
window.renderCalendar = function() {
    const grid = document.getElementById("calendar-grid");
    if (!grid) return;
    grid.innerHTML = "";
    
    // Feb 2026 starts on a Sunday based on the mockup layout
    const daysInMonth = 28;
    const firstDayOffset = 0; 
    
    for (let i = 0; i < firstDayOffset; i++) {
        grid.innerHTML += `<div></div>`;
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        const isCompleted = Math.random() > 0.3; // Visual completion dots
        
        let bgStyle = "";
        if (isCompleted) {
            bgStyle = "background: #00f2fe; color: #121212; border: none;";
        } else {
            bgStyle = "background: transparent; border: 1px solid rgba(255,255,255,0.2); color: var(--text-muted);";
        }
        
        grid.innerHTML += `<div style="width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; margin: 0 auto; transition: 0.3s; ${bgStyle}">${i}</div>`;
    }
};

window.sendChatMessage = function() {
    const input = document.getElementById("ai-chat-input");
    const windowEl = document.getElementById("chat-window");
    if (!input || !windowEl || !input.value.trim()) return;
    
    const userMsg = document.createElement("div");
    userMsg.className = "chat-bubble user-bubble";
    userMsg.style = "align-self: flex-end; max-width: 80%; background: rgba(124, 92, 255, 0.2); border: 1px solid rgba(124, 92, 255, 0.4); padding: 10px 15px; border-radius: 15px 15px 0 15px; font-size: 12px; margin-bottom: 5px; color: white;";
    userMsg.innerText = input.value;
    windowEl.appendChild(userMsg);
    
    input.value = "";
    windowEl.scrollTop = windowEl.scrollHeight;
    
    setTimeout(() => {
        const aiMsg = document.createElement("div");
        aiMsg.className = "chat-bubble ai-bubble";
        aiMsg.style = "align-self: flex-start; max-width: 80%; background: rgba(0, 242, 254, 0.15); border: 1px solid rgba(0, 242, 254, 0.3); padding: 10px 15px; border-radius: 15px 15px 15px 0; font-size: 12px; margin-bottom: 5px; color: white;";
        aiMsg.innerText = "You're consistently hitting your habits! Start small: Wake up at the same time and drink water to supercharge your routine. Stay driven! 🔥";
        windowEl.appendChild(aiMsg);
        windowEl.scrollTop = windowEl.scrollHeight;
        if(typeof playSound === 'function') playSound("success");
    }, 1000);
};