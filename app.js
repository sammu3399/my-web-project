const SUPABASE_URL = 'https://nhfzhnmopnvandpugvkr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_g96CwRBlO-h4uHvhSAm_5Q_80UiY5QR';

let appState = {
    user: { username: "Guest User", avatarSeed: "Guest" },
    tasks: [
        { id: 1, text: "Drink 2L Water", status: "pending", type: "water" },
        { id: 2, text: "Read 10 pages", status: "pending", type: "reading" },
        { id: 3, text: "10000 Steps", status: "pending", type: "steps" }
    ],
    streak: { current: 0 },
    health: { pcosMode: false }
};

const elements = {
    taskList: document.getElementById('task-list'),
    pcosToggle: document.getElementById('pcos-toggle'),
    pcosRecommendations: document.getElementById('pcos-recommendations'),
    appBody: document.getElementById('app-body'),
    streakCount: document.getElementById('streak-count'),
    dailyProgressFill: document.getElementById('daily-progress'),
    progressText: document.getElementById('progress-text')
};

function init() {
    setupEventListeners();
    renderAll();
}

function setupEventListeners() {
    elements.pcosToggle?.addEventListener('change', (e) => {
        appState.health.pcosMode = e.target.checked;
        if (e.target.checked) {
            elements.appBody.classList.add('pcos-active');
            elements.pcosRecommendations.classList.remove('hidden');
        } else {
            elements.appBody.classList.remove('pcos-active');
            elements.pcosRecommendations.classList.add('hidden');
        }
    });

    document.getElementById('add-task-btn').onclick = () => {
        const val = document.getElementById('new-task-input').value;
        if (val) {
            let type = "default";
            if (val.toLowerCase().includes("water")) type = "water";
            if (val.toLowerCase().includes("step")) type = "steps";
            if (val.toLowerCase().includes("read")) type = "reading";

            appState.tasks.push({ id: Date.now(), text: val, status: "pending", type: type });
            document.getElementById('new-task-input').value = '';
            renderTasks();
        }
    };
}

function renderTasks() {
    elements.taskList.innerHTML = '';
    let completed = 0;
    appState.tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.type} ${task.status}`;
        li.innerHTML = `
            <span>${task.text}</span>
            <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''} 
                onclick="toggleTask(${task.id})">
        `;
        elements.taskList.appendChild(li);
        if (task.status === 'completed') completed++;
    });

    const percent = Math.round((completed / appState.tasks.length) * 100) || 0;
    elements.dailyProgressFill.style.width = percent + '%';
    elements.progressText.innerText = percent + '% Completed';
}

window.toggleTask = (id) => {
    const task = appState.tasks.find(t => t.id === id);
    task.status = task.status === 'completed' ? 'pending' : 'completed';
    renderTasks();
};

function renderAll() {
    renderTasks();
    elements.streakCount.innerText = appState.streak.current;
}

document.addEventListener('DOMContentLoaded', init);