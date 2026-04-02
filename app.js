// --- 1. SELECTING THE ELEMENTS ---
const pcosToggle = document.getElementById('pcos-toggle');
const yogaContainer = document.getElementById('yoga-container');
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');

// --- 2. THE PINK MODE LOGIC ---
// This listens for when you click the switch
pcosToggle.addEventListener('change', () => {
    if (pcosToggle.checked) {
        // Adds the pink theme class to the body
        document.body.classList.add('pcos-active');
        // Shows the breathing yoga circle
        yogaContainer.classList.remove('hidden');
    } else {
        // Removes the pink theme
        document.body.classList.remove('pcos-active');
        // Hides the yoga circle
        yogaContainer.classList.add('hidden');
    }
});

// --- 3. SMART TASK ADDER ---
addTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (!text) return; // Don't add empty tasks

    const li = document.createElement('div');
    li.className = 'task-item';

    // SMART DETECTION: Adds specific glows based on what you type
    const lowerText = text.toLowerCase();
    if (lowerText.includes('water')) li.classList.add('water');
    if (lowerText.includes('steps') || lowerText.includes('walk')) li.classList.add('steps');
    if (lowerText.includes('read')) li.classList.add('reading');

    li.innerHTML = `
        <span>${text}</span>
        <input type="checkbox" class="task-check">
    `;

    taskList.appendChild(li);
    taskInput.value = ''; // Clears the input box
});