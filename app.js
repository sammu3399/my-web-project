// 1. App State
let currentUser = "";

// 2. Select Elements
const loginBtn = document.getElementById('login-btn');
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const usernameInput = document.getElementById('username-input');
const displayName = document.getElementById('display-name');

// 3. Login Logic (This is what fixes the 'stuck' issue)
loginBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim();

    if (name) {
        currentUser = name;
        displayName.innerText = name;

        // Hide Login, Show App
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');

        console.log("Success! Welcome, " + name);
    } else {
        alert("Please enter a name to start!");
    }
});

// 4. Settings Modal
document.getElementById('settings-trigger').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.remove('hidden');
});

document.getElementById('close-settings').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.add('hidden');
});

// 5. Pink Mode Toggle
document.getElementById('pcos-toggle').addEventListener('change', (e) => {
    document.body.classList.toggle('pcos-active', e.target.checked);
    document.getElementById('yoga-box').classList.toggle('hidden', !e.target.checked);
});

// 6. Mood Selector
function setMood(emoji) {
    alert("Mood updated to " + emoji);
}

// 7. Simple Task Adder (No Database needed to work)
document.getElementById('add-task-btn').addEventListener('click', () => {
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    if (!text) return;

    const list = document.getElementById('task-list');
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';

    // Auto-color logic
    const lower = text.toLowerCase();
    if (lower.includes('water')) taskItem.classList.add('water');
    if (lower.includes('read')) taskItem.classList.add('read');
    if (lower.includes('walk') || lower.includes('step')) taskItem.classList.add('step');

    taskItem.innerHTML = `<span>${text}</span><input type="checkbox">`;
    list.appendChild(taskItem);
    input.value = "";
});

// 8. Celebration Logic
document.getElementById('complete-day').addEventListener('click', () => {
    if (currentUser.toLowerCase() === 'guddu') {
        document.getElementById('guddu-overlay').classList.remove('hidden');
    } else {
        alert("Great job, " + currentUser + "!");
    }
});