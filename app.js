// --- EMERGENCY UI FIX ---
window.addEventListener('load', () => {
    const avatar = document.querySelector('.profile-avatar');
    if (avatar) {
        avatar.style.width = '65px';
        avatar.style.height = '65px';
        avatar.style.borderRadius = '50%';
        avatar.style.objectFit = 'cover';
    }
});

// --- EXISTING TASK LOGIC ---
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');

addTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.toLowerCase();
    if (!text) return;

    const div = document.createElement('div');
    div.className = 'task-item';

    if (text.includes('water')) div.classList.add('water');
    if (text.includes('step') || text.includes('walk')) div.classList.add('steps');

    div.innerHTML = `<span>${taskInput.value}</span> <input type="checkbox">`;
    taskList.appendChild(div);
    taskInput.value = '';
});

// --- PINK MODE TOGGLE ---
const pcosToggle = document.getElementById('pcos-mode');
const yogaBox = document.getElementById('yoga-box');

if (pcosToggle) {
    pcosToggle.addEventListener('change', (e) => {
        document.body.classList.toggle('pcos-active', e.target.checked);
        if (yogaBox) {
            yogaBox.classList.toggle('hidden', !e.target.checked);
        }
    });
}

function setMood(emoji) {
    alert(`Mood updated to ${emoji}! Keep that energy!`);
}
// --- TASK LOGIC ---
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');

addTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.toLowerCase();
    if (!text) return;

    const div = document.createElement('div');
    div.className = 'task-item';

    // SMART GLOW DETECTION
    if (text.includes('water')) div.classList.add('water');
    if (text.includes('step') || text.includes('walk')) div.classList.add('steps');

    div.innerHTML = `<span>${taskInput.value}</span> <input type="checkbox">`;
    taskList.appendChild(div);
    taskInput.value = '';
});

// --- PINK MODE TOGGLE ---
const pcosToggle = document.getElementById('pcos-mode');
const yogaBox = document.getElementById('yoga-box');

pcosToggle.addEventListener('change', (e) => {
    document.body.classList.toggle('pcos-active', e.target.checked);
    yogaBox.classList.toggle('hidden', !e.target.checked);
});

// --- MOOD TRACKER ---
function setMood(emoji) {
    alert(`Mood updated to ${emoji}! Keep that energy!`);
}

// --- INITIALIZE ---
function showSection(id) {
    console.log(`Navigating to ${id}`);
    // Logic for switching screens goes here
}