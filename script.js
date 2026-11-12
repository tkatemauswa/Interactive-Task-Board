// Application State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// DOM Element References
const taskForm = document.getElementById('task-form');
const taskTitle = document.getElementById('task-title');
const taskCategory = document.getElementById('task-category');
const taskPriority = document.getElementById('task-priority');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const taskDescription = document.getElementById('task-description');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderTasks();
  setupDropZones();
  
  taskForm.addEventListener('submit', handleAddTask);
  searchInput.addEventListener('input', renderTasks);
  categoryFilter.addEventListener('change', renderTasks);
});

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Add a new task
function handleAddTask(e) {
  e.preventDefault();

  //Ignore tasks whose title is empty
  if (taskTitle.value.trim() === ''){
    return;
  }

  const newTask = {
    id: Date.now().toString(),
    title: taskTitle.value.trim(),
    description: taskDescription.value.trim(),
    category: taskCategory.value,
    priority: taskPriority.value,
    status: 'todo'
   };

  tasks.push(newTask);
  saveTasks();
  renderTasks();


  // Reset form fields
  taskForm.reset();
}

// Update status of a task
function updateTaskStatus(id, newStatus) {
  tasks = tasks.map(task => 
    task.id === id ? { ...task, status: newStatus } : task
  );
  saveTasks();
  renderTasks();
}

// Delete a task
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
}

// Render tasks onto the board based on status and filters
function renderTasks() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  // Clear lists
  const lists = {
    'todo': document.getElementById('list-todo'),
    'in-progress': document.getElementById('list-in-progress'),
    'completed': document.getElementById('list-completed')
  };

  Object.values(lists).forEach(list => list.innerHTML = '');

  // Track counts
  const counts = { 'todo': 0, 'in-progress': 0, 'completed': 0 };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Append elements
  filteredTasks.forEach(task => {
    counts[task.status]++;
    const cardHtml = createTaskCard(task);
    if (lists[task.status]) {
      lists[task.status].appendChild(cardHtml);
    }
  });

  // Update counts in DOM
  document.getElementById('count-todo').textContent = counts['todo'];
  document.getElementById('count-in-progress').textContent = counts['in-progress'];
  document.getElementById('count-completed').textContent = counts['completed'];

  // Uses the full tasks list, so search and filters dont change it
  const completedCount = tasks.filter(task => task.status === 'completed').length;
  const activeCount = tasks.length - completedCount;
  document.getElementById('task-summary').textContent =
    `${activeCount} active - ${completedCount} completed`; }


// Helper: Create Task DOM element
function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.setAttribute('data-priority', task.priority);

  // Make the card draggable
  card.setAttribute('draggable', 'true');

  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    card.classList.add('dragging');
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
  });

  card.innerHTML = `
    <div class="task-card-title">${escapeHtml(task.title)}</div>
    <p class="task-card-description">${escapeHtml(task.description || '')}</p>
    <div class="task-meta">
      <span>${task.category}</span>
      <span>${task.priority} Priority</span>
    </div>
    <div class="task-actions">
      <select onchange="updateTaskStatus('${task.id}', this.value)">
        <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
        <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
      </select>
      <button class="btn-danger" onclick="deleteTask('${task.id}')">Delete</button>
    </div>
  `;

  return card;
}

// Security: Helper function to escape basic HTML injection
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Let each column accept dropped task cards
function setupDropZones() {
  const columns = document.querySelectorAll('.column');


columns.forEach(column => {
  column.addEventListener('dragover', (e) => {
    e.preventDefault();
    column.classList.add('drag-over');
  });


column.addEventListener('dragleave', (e) => {
  if (!column.contains(e.relatedTarget)) {
    column.classList.remove('drag-over');
  }
});

column.addEventListener('drop', (e) => {
  e.preventDefault();
  column.classList.remove('drag-over');
  const taskId = e.dataTransfer.getData('text/plain');
  updateTaskStatus(taskId, column.dataset.status);

});
});
}