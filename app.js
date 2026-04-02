let currentUser = "";

// LOGIN
document.getElementById('login-btn').addEventListener('click', () => {
    const name = document.getElementById('username-input').value.trim();
    if (name) {
        currentUser = name;
        document.getElementById('display-name').innerText = name;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
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

// SMART GLOW TASKS
document.getElementById('add-task-btn').addEventListener('click', () => {
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    if (!text) return;

    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';

    // Auto-apply glow effects
    const lowerText = text.toLowerCase();
    if (lowerText.includes('water')) taskItem.classList.add('water');
    else if (lowerText.includes('step') || lowerText.includes('walk')) taskItem.classList.add('step');
    else if (lowerText.includes('read') || lowerText.includes('book')) taskItem.classList.add('read');

    taskItem.innerHTML = `<span>${text}</span><input type="checkbox">`;
    document.getElementById('task-list').appendChild(taskItem);
    input.value = "";
});

// GUDDU SPECIAL CELEBRATION
document.getElementById('complete-day').addEventListener('click', () => {
    if (currentUser.toLowerCase() === 'guddu') {
        document.getElementById('guddu-overlay').classList.remove('hidden');
    } else {
        alert("Awesome job, " + currentUser + "! Day Complete! ✅");
    }
});