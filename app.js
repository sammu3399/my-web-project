let currentUser = "";

// SUPABASE INIT
const SUPABASE_URL = "https://nhfzhnmopnvandpugvkr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_g96CwRBlO-h4uHvhSAm_5Q_80UiY5QR";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SETTINGS MODAL
document.getElementById('settings-trigger').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.remove('hidden');
});
document.getElementById('close-settings').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.add('hidden');
});

// LOGIN
document.getElementById('login-btn').addEventListener('click', async () => {
    const name = document.getElementById('username-input').value.trim();
    if (name) {
        currentUser = name;
        document.getElementById('display-name').innerText = name;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        await fetchTasks();
    }
});

// MOOD SELECTOR
function setMood(emoji) {
    console.log("Mood set to:", emoji);
    alert("Mood updated to " + emoji + ". Stay Focused!");
}

// PINK MODE (PCOS)
const pcosToggle = document.getElementById('pcos-toggle');
pcosToggle.addEventListener('change', (e) => {
    document.body.classList.toggle('pcos-active', e.target.checked);
    document.getElementById('yoga-box').classList.toggle('hidden', !e.target.checked);
});

// SMART GLOW TASKS AND PERSISTENCE
async function fetchTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = "";

    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('username', currentUser)
        .order('id', { ascending: true });

    if (error && error.code !== '42P01') {
        console.error("Error fetching tasks", error);
    } else if (data) {
        data.forEach(task => renderTask(task.id, task.content, task.is_completed));
    }
}

function renderTask(id, text, isCompleted) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    if (id) taskItem.dataset.id = id;

    const lowerText = text.toLowerCase();
    if (lowerText.includes('water')) taskItem.classList.add('water');
    else if (lowerText.includes('step') || lowerText.includes('walk')) taskItem.classList.add('step');
    else if (lowerText.includes('read') || lowerText.includes('book')) taskItem.classList.add('read');

    taskItem.innerHTML = `<span>${text}</span><input type="checkbox" ${isCompleted ? 'checked' : ''}>`;

    const cb = taskItem.querySelector('input[type="checkbox"]');
    cb.addEventListener('change', async (e) => {
        if (id) {
            await supabase.from('tasks').update({ is_completed: e.target.checked }).eq('id', id);
        }
    });

    document.getElementById('task-list').appendChild(taskItem);
}

document.getElementById('add-task-btn').addEventListener('click', async () => {
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = "";

    const { data, error } = await supabase
        .from('tasks')
        .insert([{ username: currentUser, content: text, is_completed: false }])
        .select();

    if (error) {
        if (error.code === '42P01') {
            renderTask(null, text, false);
            console.warn("Tasks table not found in Supabase. Using local memory.");
        } else {
            console.error("Error saving task", error);
        }
    } else if (data && data.length > 0) {
        renderTask(data[0].id, data[0].content, data[0].is_completed);
    }
});

// GUDDU SPECIAL CELEBRATION
document.getElementById('complete-day').addEventListener('click', () => {
    if (currentUser.toLowerCase() === 'guddu') {
        document.getElementById('guddu-overlay').classList.remove('hidden');
    } else {
        alert("Awesome job, " + currentUser + "! Day Complete! ✅");
    }
});
// --- SETTINGS MODAL CONTROLS ---

// 1. Select the elements from your index.html
const settingsTrigger = document.getElementById('settings-trigger');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');

// 2. Open the Settings Modal when the Avatar is clicked
settingsTrigger.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});

// 3. Close the Settings Modal when the 'Close' button is clicked
closeSettings.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

// --- WELLNESS (PINK MODE) TOGGLE ---

// 4. Listen for the switch inside the settings menu
document.getElementById('pcos-toggle').addEventListener('change', (e) => {
    // This flips the global CSS variables to Pink
    document.body.classList.toggle('pcos-active', e.target.checked);

    // This specifically shows/hides the breathing yoga animation
    const yogaBox = document.getElementById('yoga-box');
    if (e.target.checked) {
        yogaBox.classList.remove('hidden');
    } else {
        yogaBox.classList.add('hidden');
    }
});