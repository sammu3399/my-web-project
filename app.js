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

        evaluateZenMode(); // Determine Task Visibility

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
    
    const daySelect = document.getElementById("task-day-select");
    const isTomorrow = daySelect && daySelect.value === "tomorrow";

    if (isTomorrow) {
        let tTasks = JSON.parse(localStorage.getItem(`tomorrowTasks_${currentUser}`) || "[]");
        tTasks.push(text);
        localStorage.setItem(`tomorrowTasks_${currentUser}`, JSON.stringify(tTasks));
        
        taskInput.value = "";
        showToast("📅 Added to Tomorrow's Plan!");
        daySelect.value = "today"; 
        return;
    }

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
    
    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div style="background: rgba(255, 65, 108, 0.1); border: 1px dashed rgba(255, 65, 108, 0.5); padding: 20px; text-align: center; border-radius: 15px; color: #ff9a9e; margin-bottom: 20px; animation: fadeEntrance 0.5s;">
                <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                <strong>No Tasks Listed!</strong><br><br>
                <span style="font-size: 13px; color: var(--text-muted);">You haven't added any daily tasks yet. Scheduling tasks is the first step to winning the day. Add your first task below!</span>
            </div>
        `;
        return;
    }

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
                <div>
                    <span class="${task.completed ? 'done' : ''}" style="display: block; font-size: 15px; margin-bottom: 2px; color: ${task.completed ? '#00f2fe' : 'var(--text-main)'}; transition: 0.3s; text-decoration: ${task.completed ? 'line-through' : 'none'};">${task.text}</span>
                    <span style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                        <span style="color: #ff9a9e;">🔥</span> ${mockStreak} days streak
                    </span>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button onclick="toggleTask('${task.id}')" style="background: ${task.completed ? 'rgba(0,242,254,0.2)' : 'transparent'}; border: 1px solid ${task.completed ? '#00f2fe' : 'rgba(255,255,255,0.2)'}; border-radius: 50%; width: 32px; height: 32px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.3s;" title="Mark Done">✅</button>

                <button onclick="deleteTask('${task.id}')" style="background: transparent; border: 1px solid rgba(255,94,98,0.2); border-radius: 50%; width: 32px; height: 32px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.3s;" onmouseover="this.style.background='rgba(255,94,98,0.2)'" onmouseout="this.style.background='transparent'" title="Mark Not Done">❌</button>
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

async function logCompletion(taskName, status = "completed") {
    const textToLog = status === "completed" ? `✅ ${taskName}` : `❌ ${taskName}`;
    await _supabase
        .from('task_history')
        .insert([{
            username: currentUser,
            task_text: textToLog,
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
        
        let rawText = item.task_text;
        let isMissed = rawText.startsWith("❌ ");
        let isDone = rawText.startsWith("✅ ");
        
        if (isMissed || isDone) {
            rawText = rawText.substring(2);
        } else {
            isDone = true; // Support legacy history
        }
        
        const statusIcon = isMissed ? "❌" : "✔️";
        const statusText = isMissed ? "Missed" : "Completed";

        return `
            <div class="history-item" style="border-left: 3px solid ${isMissed ? '#ff5e62' : '#00f2fe'};">
                <div class="history-item-top">
                    <span class="history-item-name">${rawText}</span>
                    <span class="history-item-time">${dateStr} @ ${timeStr}</span>
                </div>
                <span class="history-item-status">${statusIcon} ${statusText}</span>
            </div>
        `;
    }).join("");
}

async function deleteTask(id) {
    const taskObj = tasks.find(t => String(t.id) === String(id));
    if (taskObj && !taskObj.completed) {
        await logCompletion(taskObj.text, "missed");
    }

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
    const pinkNav = document.getElementById("nav-pink");

    if (pinkNav) {
        pinkNav.style.display = isPinkMode ? "flex" : "none";
    }

    if (pcosPanel) {
        if (!isPinkMode) {
            // Auto close Pink sheet if it was open while toggling Pink Mode off
            const pinkSheet = document.getElementById('pink-mode-sheet');
            if (pinkSheet && pinkSheet.classList.contains('sheet-active')) {
                window.closeAllSheets();
            }
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
// ZEN MODE LOGIC
// ======================
function evaluateZenMode() {
    const hr = new Date().getHours();
    const isMorning = hr >= 5 && hr < 10;
    const isNight = hr >= 19 && hr <= 23;
    
    // Focus hours: 10AM to 7PM -> Hide tasks from main dash
    const questSection = document.getElementById("quest-section");
    if (questSection) {
        if (isMorning || isNight) {
            questSection.style.display = "block";
        } else {
            questSection.style.display = "none";
        }
    }
}

window.openManageTasks = function() {
    const sheet = document.getElementById('tasks-sheet');
    const overlay = document.getElementById('sheet-overlay');
    const questSection = document.getElementById('quest-section');
    const sheetContent = document.getElementById('tasks-sheet-content');
    
    if (sheet && overlay && questSection && sheetContent) {
        window.closeAllSheets();
        questSection.style.display = "block"; // override Zen Mode explicitly
        sheetContent.appendChild(questSection);
        
        const homeBtn = document.getElementById('nav-home');
        if(homeBtn) homeBtn.classList.remove('active');
        
        sheet.classList.add('sheet-active');
        overlay.classList.add('active');
        if(typeof playSound === 'function') playSound("hover");
    }
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
        // Reset current tasks
        const { error } = await _supabase.from('tasks').update({ completed: false }).eq('username', currentUser);
        
        if (!error) {
            tasks.forEach(t => t.completed = false);
            
            // Migrate tomorrow's scheduled tasks
            let tTasks = JSON.parse(localStorage.getItem(`tomorrowTasks_${currentUser}`) || "[]");
            if (tTasks.length > 0) {
                const inserts = tTasks.map(t => ({ username: currentUser, text: t, completed: false }));
                await _supabase.from('tasks').insert(inserts);
                localStorage.removeItem(`tomorrowTasks_${currentUser}`);
                
                // Fetch updated list from Supabase
                const { data } = await _supabase.from('tasks').select('*').eq('username', currentUser);
                if (data) tasks = data;
            }

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
window.initChart = async function() {
    const container = document.getElementById('weekly-bars-container');
    const dotsContainer = document.getElementById('slider-dots');
    const titleStatus = document.getElementById('weekly-title');
    if (!container) return;
    
    container.innerHTML = "<div style='width:100%; text-align:center; padding-top:20px; font-size:12px; color:var(--text-muted);'>Syncing True Progress...</div>";
    if (dotsContainer) dotsContainer.innerHTML = '';
    
    const now = new Date();
    now.setHours(0,0,0,0);
    
    const dayOfWeek = now.getDay(); 
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - dayOfWeek);
    
    const startOfPast = new Date(startOfThisWeek);
    startOfPast.setDate(startOfPast.getDate() - 14);

    const { data: history } = await _supabase
        .from('task_history')
        .select('completed_at, task_text')
        .eq('username', currentUser)
        .gte('completed_at', startOfPast.toISOString());

    const dayStats = {};
    if (history) {
        history.forEach(item => {
            const d = new Date(item.completed_at);
            const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
            if (!dayStats[key]) dayStats[key] = { done: 0, total: 0 };
            dayStats[key].total++;
            if (item.task_text.startsWith("✅")) dayStats[key].done++;
        });
    }

    const weeksData = [];
    const weekTitles = ["This Week's", "Last Week's", "2 Weeks Ago"];
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sa'];

    for (let w = 0; w < 3; w++) {
        const weekObj = { title: weekTitles[w], data: [] };
        for (let d = 0; d < 7; d++) {
            const currentDay = new Date(startOfThisWeek);
            currentDay.setDate(startOfThisWeek.getDate() - (w * 7) + d);
            
            const key = `${currentDay.getFullYear()}-${currentDay.getMonth()+1}-${currentDay.getDate()}`;
            const stat = dayStats[key] || { done: 0, total: 0 };
            
            const percent = stat.total === 0 ? 0 : Math.round((stat.done / stat.total) * 100);
            
            weekObj.data.push({
                label: labels[d],
                percent: percent,
                dateObj: currentDay,
                dateNum: currentDay.getDate()
            });
        }
        weeksData.push(weekObj);
    }

    container.innerHTML = '';
    container.style.width = (weeksData.length * 100) + '%';

    weeksData.forEach((week, slideIndex) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'weekly-slide';
        slideDiv.style.width = (100 / weeksData.length) + '%';
        
        week.data.forEach((item) => {
            const wrapper = document.createElement('div');
            wrapper.className = `weekly-bar-wrapper ${item.percent === 100 ? 'completed' : ''}`;
            wrapper.style.cursor = "pointer";
            wrapper.style.position = "relative";
            
            wrapper.onclick = () => window.viewDayHistory(item.dateObj);
            
            wrapper.innerHTML = `
                <span style="position: absolute; top: -20px; font-size: 11px; color: var(--text-muted); font-weight: 500;">${item.dateNum}</span>
                <div class="weekly-bar-check">✔</div>
                <div class="weekly-bar-bg" title="${item.percent}% completed">
                    <div class="weekly-bar-fill" style="height: ${item.percent}%;">
                        <span class="weekly-bar-percent" style="font-size: 9px;">${item.percent === 0 ? '' : item.percent + '%'}</span>
                    </div>
                </div>
                <span class="weekly-bar-label">${item.label}</span>
            `;
            slideDiv.appendChild(wrapper);
        });
        
        container.appendChild(slideDiv);

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
// Init mock chart on load
document.addEventListener("DOMContentLoaded", initChart);

window.viewDayHistory = async function(dayLabelOrDate) {
    const detailView = document.getElementById("daily-detail-view");
    const detailContent = document.getElementById("daily-detail-content");
    const title = document.getElementById("daily-detail-title");
    
    // UI Transitions
    if (detailView) detailView.style.display = "block";
    const habitSection = document.querySelector(".habit-consistency");
    if (habitSection) habitSection.style.display = "none";
    if (detailContent) detailContent.innerHTML = "<p style='color: var(--text-muted); font-size: 12px; text-align: center'>Loading history...</p>";
    
    let isStrictDate = dayLabelOrDate instanceof Date;
    let titleStr = isStrictDate ? dayLabelOrDate.toLocaleDateString(undefined, {month:'short', day:'numeric'}) : `${dayLabelOrDate}'s`;
    if (title) title.innerText = `${titleStr} Journal`;
    
    // Fetch History
    const { data: history, error } = await _supabase
        .from('task_history')
        .select('*')
        .eq('username', currentUser)
        .order('completed_at', { ascending: false });

    if (error || !history || history.length === 0) {
        if (detailContent) detailContent.innerHTML = "<p style='color: var(--text-muted); font-size: 12px; text-align: center'>No data recorded for this day.</p>";
        return;
    }
    
    const filteredHistory = history.filter(item => {
        const d = new Date(item.completed_at);
        if (isStrictDate) {
            return d.toDateString() === dayLabelOrDate.toDateString();
        } else {
            const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sa': 6 };
            return d.getDay() === dayMap[dayLabelOrDate];
        }
    });

    if (filteredHistory.length === 0) {
        if (detailContent) detailContent.innerHTML = "<p style='color: var(--text-muted); font-size: 12px; text-align: center'>No tasks recorded for this day. 🧘‍♂️</p>";
        return;
    }
    
    let html = "";
    filteredHistory.forEach(item => {
        const date = new Date(item.completed_at);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let rawText = item.task_text;
        let isMissed = rawText.startsWith("❌ ");
        let isDone = rawText.startsWith("✅ ");
        
        if (isMissed || isDone) rawText = rawText.substring(2);
        else isDone = true;
        
        const statusIcon = isMissed ? "❌" : "✅";
        const color = isMissed ? "#ff5e62" : "#00f2fe";
        const decoration = isMissed ? "none" : "line-through";
        
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.02); border-left: 3px solid ${color}; border-radius: 4px; margin-bottom: 8px; transition: 0.3s; animation: fadeEntrance 0.3s ease-out;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 13px; color: ${isMissed ? '#ff9a9e' : '#fff'}; text-decoration: ${decoration};">${statusIcon} ${rawText}</span>
                    <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Recorded on ${date.toLocaleDateString()} at ${timeStr}</span>
                </div>
            </div>
        `;
    });
    
    if (detailContent) detailContent.innerHTML = html;
};

window.closeDailyDetail = function() {
    const detailView = document.getElementById("daily-detail-view");
    const habitSection = document.querySelector(".habit-consistency");
    if(detailView) detailView.style.display = "none";
    if(habitSection) habitSection.style.display = "block";
};

// ======================
// BOTTOM SHEET LOGIC
// ======================
window.closeAllSheets = function() {
    const analytics = document.getElementById('analytics-sheet');
    const profile = document.getElementById('profile-sheet');
    const insights = document.getElementById('insights-sheet');
    const tasksSheet = document.getElementById('tasks-sheet');
    const pinkSheet = document.getElementById('pink-mode-sheet');
    const brainSheet = document.getElementById('brain-gym-sheet');
    const overlay = document.getElementById('sheet-overlay');
    
    const questSection = document.getElementById('quest-section');
    const homeWrapper = document.getElementById('home-tasks-wrapper');

    if(analytics) analytics.classList.remove('sheet-active');
    if(profile) profile.classList.remove('sheet-active');
    if(insights) insights.classList.remove('sheet-active');
    if(tasksSheet) tasksSheet.classList.remove('sheet-active');
    if(pinkSheet) pinkSheet.classList.remove('sheet-active');
    if(brainSheet) brainSheet.classList.remove('sheet-active');
    if(overlay) overlay.classList.remove('active');
    
    if (typeof window.quitBrainGym === 'function') window.quitBrainGym();

    // Return quest-section to home if it was manually opened
    if (questSection && homeWrapper && tasksSheet && tasksSheet.contains(questSection)) {
        homeWrapper.appendChild(questSection);
        if(typeof evaluateZenMode === 'function') evaluateZenMode();
    }

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

window.togglePinkMode = function() {
    const sheet = document.getElementById('pink-mode-sheet');
    const overlay = document.getElementById('sheet-overlay');
    const navBtn = document.getElementById('nav-pink');
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

// ======================
// BRAIN GYM MINI-GAME
// ======================
let brainTimer = null;
let brainTimeLeft = 60;
let brainScore = 0;
let brainAnswer = 0;

window.toggleBrainGym = function() {
    const sheet = document.getElementById('brain-gym-sheet');
    const overlay = document.getElementById('sheet-overlay');
    const navBtn = document.getElementById('nav-brain-gym');
    
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
            
            // Reset state logically on open
            document.getElementById("brain-menu").style.display = "block";
            document.getElementById("brain-play").style.display = "none";
            document.getElementById("brain-score").innerText = "0";
            document.getElementById("brain-timer").innerText = "60";
            document.getElementById("brain-menu").innerHTML = `
                <h1 style="font-size: 48px; margin-bottom: 10px;">⚡</h1>
                <p style="color: var(--text-muted); margin-bottom: 30px; font-size: 14px;">Wake up your mind with 60 seconds of quick maths.</p>
                <button onclick="startBrainGym()" style="width: 100%; padding: 16px; border-radius: 15px; border: none; background: linear-gradient(to right, #00f2fe, #4facfe); color: #121212; font-size: 16px; font-weight: bold; cursor: pointer;">Start Workout</button>
            `;
        }
    }
};

window.quitBrainGym = function() {
    clearInterval(brainTimer);
};

window.startBrainGym = function() {
    document.getElementById("brain-menu").style.display = "none";
    document.getElementById("brain-play").style.display = "block";
    brainScore = 0;
    brainTimeLeft = 60;
    document.getElementById("brain-score").innerText = brainScore;
    document.getElementById("brain-timer").innerText = brainTimeLeft;
    
    generateMathProblem();
    
    clearInterval(brainTimer);
    brainTimer = setInterval(() => {
        brainTimeLeft--;
        const timerEl = document.getElementById("brain-timer");
        if(timerEl) timerEl.innerText = brainTimeLeft;
        if (brainTimeLeft <= 0) {
            endBrainGym();
        }
    }, 1000);
};

window.generateMathProblem = function() {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let num1, num2;
    
    if (op === '+') {
        num1 = Math.floor(Math.random() * 50) + 10;
        num2 = Math.floor(Math.random() * 50) + 10;
        brainAnswer = num1 + num2;
    } else if (op === '-') {
        num1 = Math.floor(Math.random() * 50) + 20;
        num2 = Math.floor(Math.random() * num1);
        brainAnswer = num1 - num2;
    } else {
        // Keep multiplication small
        num1 = Math.floor(Math.random() * 10) + 2;
        num2 = Math.floor(Math.random() * 10) + 2;
        brainAnswer = num1 * num2;
    }
    
    const eqEl = document.getElementById("brain-equation");
    if(eqEl) eqEl.innerText = `${num1} ${op === '*' ? '×' : op} ${num2} = ?`;
    
    let options = [brainAnswer];
    while(options.length < 4) {
        let fake = brainAnswer + (Math.floor(Math.random() * 20) - 10);
        if (fake !== brainAnswer && !options.includes(fake) && fake >= 0) {
            options.push(fake);
        }
    }
    options.sort(() => Math.random() - 0.5);
    
    const optsContainer = document.getElementById("brain-options");
    if(optsContainer) {
        optsContainer.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.innerText = opt;
            btn.style = "padding: 20px; font-size: 24px; border-radius: 12px; border: none; background: rgba(255,255,255,0.1); color: white; cursor: pointer; transition: 0.2s;";
            btn.onclick = () => checkMathAnswer(opt, btn);
            optsContainer.appendChild(btn);
        });
    }
};

window.checkMathAnswer = function(selected, btnEl) {
    if (selected === brainAnswer) {
        brainScore += 10;
        btnEl.style.background = "#00f2fe";
        btnEl.style.color = "#121212";
        playSound("hover");
        setTimeout(() => window.generateMathProblem(), 200);
    } else {
        brainScore -= 5;
        if(brainScore < 0) brainScore = 0;
        btnEl.style.background = "#ff5e62";
        btnEl.style.color = "white";
        // Simple shake emulation
        btnEl.style.transform = "translateX(5px)";
        setTimeout(() => { btnEl.style.transform = "translateX(-5px)"; }, 50);
        setTimeout(() => { btnEl.style.transform = "translateX(0)"; btnEl.style.background = "rgba(255,255,255,0.1)"; }, 150);
    }
    document.getElementById("brain-score").innerText = brainScore;
};

window.endBrainGym = function() {
    clearInterval(brainTimer);
    document.getElementById("brain-play").style.display = "none";
    document.getElementById("brain-menu").style.display = "block";
    document.getElementById("brain-menu").innerHTML = `
        <h1 style="font-size: 48px; margin-bottom: 10px;">🏆</h1>
        <h2 style="font-size: 24px; margin-bottom: 5px;">Time's Up!</h2>
        <p style="color: var(--text-muted); margin-bottom: 30px; font-size: 14px;">You scored <b style="color: #00f2fe">${brainScore}</b> points.</p>
        <button onclick="startBrainGym()" style="width: 100%; padding: 16px; border-radius: 15px; border: none; background: linear-gradient(to right, #00f2fe, #4facfe); color: #121212; font-size: 16px; font-weight: bold; cursor: pointer;">Play Again</button>
    `;
    playSound("success");
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
// PRODUCTIVITY SUITE LOGIC
// ======================

// 1. DISTRACTION LOGGER
let distractionCount = 0;

window.updateDistractionUI = function() {
    const el = document.getElementById("distraction-count");
    if(el) el.innerText = distractionCount;
};

window.logDistraction = function() {
    distractionCount++;
    if(currentUser) {
        localStorage.setItem(`${currentUser}_distractions`, distractionCount);
    }
    window.updateDistractionUI();
    playSound("hover");
    
    const btn = document.querySelector(".distraction-log-btn");
    if(btn) {
        btn.style.transform = "scale(0.95)";
        setTimeout(() => btn.style.transform = "scale(1)", 100);
    }
};

// 2. THE ONE THING (Priority Node)
window.saveOneThing = function() {
    const input = document.getElementById("one-thing-input");
    if (input && currentUser) {
        localStorage.setItem(`${currentUser}_onething`, input.value);
    }
};

// 3. FOCUS TIMER & LOFI BEATS
let focusTimerInterval = null;
let focusTimeLeft = 25 * 60; // 25 mins
let focusTimerRunning = false;
let lofiEnabled = false;

window.toggleLofiAudio = function() {
    lofiEnabled = !lofiEnabled;
    const statEl = document.getElementById("lofi-status");
    const audioEl = document.getElementById("lofi-audio");
    
    if (statEl) {
        statEl.innerHTML = lofiEnabled ? `🔊 Ambient Flow: <span style="color:#00f2fe;">ON</span>` : `🔈 Ambient Flow: <span style="color:white;">OFF</span>`;
    }
    
    if (focusTimerRunning && audioEl) {
        if (lofiEnabled) audioEl.play().catch(e => console.log("Audio block", e));
        else audioEl.pause();
    }
};

window.updateFocusTimerDisplay = function() {
    const m = Math.floor(focusTimeLeft / 60).toString().padStart(2, '0');
    const s = (focusTimeLeft % 60).toString().padStart(2, '0');
    const el = document.getElementById("main-timer-display");
    if (el) el.innerText = `${m}:${s}`;
};

window.startFocusTimer = function() {
    const btn = document.getElementById("timer-start-btn");
    const audioEl = document.getElementById("lofi-audio");
    
    if (focusTimerRunning) {
        // PAUSE Action
        clearInterval(focusTimerInterval);
        focusTimerRunning = false;
        if(btn) btn.innerText = "Resume";
        if(audioEl) audioEl.pause();
    } else {
        // START Action
        focusTimerRunning = true;
        if(btn) btn.innerText = "Pause";
        
        if (lofiEnabled && audioEl) {
            audioEl.play().catch(e => console.log("Audio block", e));
        }
        
        focusTimerInterval = setInterval(() => {
            if (focusTimeLeft > 0) {
                focusTimeLeft--;
                window.updateFocusTimerDisplay();
            } else {
                window.resetFocusTimer();
                playSound("success");
                window.alert("Pomodoro Complete! Great focus.");
            }
        }, 1000);
    }
    playSound("hover");
};

window.resetFocusTimer = function() {
    clearInterval(focusTimerInterval);
    focusTimerRunning = false;
    focusTimeLeft = 25 * 60;
    
    const btn = document.getElementById("timer-start-btn");
    if(btn) btn.innerText = "Start";
    
    const audioEl = document.getElementById("lofi-audio");
    if(audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0;
    }
    
    window.updateFocusTimerDisplay();
    playSound("hover");
};

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (currentUser) {
            // Load Distractions
            const distStr = localStorage.getItem(`${currentUser}_distractions`);
            if (distStr) distractionCount = parseInt(distStr);
            window.updateDistractionUI();
            
            // Load Priority
            const oneThingStr = localStorage.getItem(`${currentUser}_onething`);
            const oneThingInput = document.getElementById("one-thing-input");
            if (oneThingInput && oneThingStr) {
                oneThingInput.value = oneThingStr;
            }
        }
    }, 1500); // 1.5s delay to ensure currentUser is loaded
});

// ======================
// CALENDAR & AI CHAT MOCK
// ======================
let currentCalDate = new Date();

window.changeCalendarMonth = function(offset) {
    currentCalDate.setMonth(currentCalDate.getMonth() + offset);
    window.renderCalendar();
};

window.renderCalendar = async function() {
    const grid = document.getElementById("calendar-grid");
    const monthTitle = document.getElementById("calendar-month");
    if (!grid || !monthTitle) return;

    grid.innerHTML = "<div style='grid-column: 1 / -1; font-size:11px; padding:10px; text-align:center;'>Loading...</div>";

    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();

    monthTitle.innerText = currentCalDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const startIso = new Date(year, month, 1).toISOString();
    const endIso = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const { data: history } = await _supabase
        .from('task_history')
        .select('completed_at, task_text')
        .eq('username', currentUser)
        .gte('completed_at', startIso)
        .lte('completed_at', endIso);

    const completedDays = new Set();
    const missedDays = new Set();

    if (history) {
        history.forEach(item => {
            const d = new Date(item.completed_at).getDate();
            if (item.task_text.startsWith("✅ ")) completedDays.add(d);
            if (item.task_text.startsWith("❌ ")) missedDays.add(d);
        });
    }

    grid.innerHTML = "";
    
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div></div>`;
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        let bgStyle = "background: transparent; border: 1px solid rgba(255,255,255,0.2); color: var(--text-muted);";
        
        if (completedDays.has(i)) {
            bgStyle = "background: #00f2fe; color: #121212; border: none;";
        } else if (missedDays.has(i)) {
            bgStyle = "background: transparent; border: 1px solid rgba(255, 94, 98, 0.4); color: #ff5e62;";
        }
        
        const isToday = new Date().toDateString() === new Date(year, month, i).toDateString();
        if (isToday && !completedDays.has(i) && !missedDays.has(i)) {
            bgStyle = "background: rgba(255,255,255,0.1); border: 1px dashed rgba(255,255,255,0.5); color: #fff;";
        }

        grid.innerHTML += `<div onclick="window.viewDayHistory(new Date(${year}, ${month}, ${i}))" style="width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; margin: 0 auto; transition: 0.2s; cursor: pointer; ${bgStyle}" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${i}</div>`;
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

document.addEventListener("DOMContentLoaded", () => {
    const dateEl = document.getElementById("home-date-display");
    const timeEl = document.getElementById("corner-time-display");
    
    if (dateEl) {
        dateEl.innerText = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    }

    if (timeEl) {
        const updateTime = () => {
            timeEl.innerText = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        };
        updateTime();
        setInterval(updateTime, 1000);
    }
});
