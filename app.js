let currentUser = "";

// 1. SELECT ALL ELEMENTS
const loginBtn = document.getElementById('login-btn');
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const usernameInput = document.getElementById('username-input');
const displayName = document.getElementById('display-name');
const settingsTrigger = document.getElementById('settings-trigger');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const pcosToggle = document.getElementById('pcos-toggle');

// 2. LOGIN LOGIC (Fixed to always move forward)
loginBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim();

    if (name) {
        currentUser = name;
        displayName.innerText = name;

        // Switch Screens
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');

        console.log("Logged in as:", currentUser);
    } else {
        alert("Please enter a name to start winning!");
    }
});

// 3. SETTINGS MODAL CONTROLS
settingsTrigger.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});

closeSettings.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

// 4. PINK MODE (WELLNESS) TOGGLE
pcosToggle.addEventListener('change', (e) => {
    document.body.classList.toggle('pcos-active', e.target.checked);
    const yogaBox = document.getElementById('yoga-box');
    if (e.target.checked) {
        yogaBox.classList.remove('hidden');
    } else {
        yogaBox.classList.add('hidden');
    }
});

// 5. TASK LOGIC (Simple Version)
document.getElementById('add-task-btn').addEventListener('click', () => {
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    if (!text) return;

    const list = document.getElementById('task-list');
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';

    // Auto-Glow Colors
    const lowerText = text.toLowerCase();
    if (lowerText.includes('water')) taskItem.classList.add('water');
    else if (lowerText.includes('step') || lowerText.includes('walk')) taskItem.classList.add('step');
    else if (lowerText.includes('read') || lowerText.includes('book')) taskItem.classList.add('read');

    taskItem.innerHTML = `<span>${text}</span><input type="checkbox">`;
    list.appendChild(taskItem);
    input.value = "";
});

// 6. GUDDU SPECIAL CELEBRATION
document.getElementById('complete-day').addEventListener('click', () => {
    if (currentUser.toLowerCase() === 'guddu') {
        document.getElementById('guddu-overlay').classList.remove('hidden');
    } else {
        alert("Awesome job, " + currentUser + "! Day Complete! ✅");
    }
});

// 7. MOOD SELECTOR
function setMood(emoji) {
    alert("Mood updated to " + emoji + ". Stay Focused!");
}