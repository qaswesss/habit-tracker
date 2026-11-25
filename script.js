let habitsData = [];

const habitsList = document.getElementById('habits-list');
const modal = document.getElementById('modal');
const habitForm = document.getElementById('habit-form');
const modalTitle = document.getElementById('modal-title');
const habitTemplate = document.getElementById('habit-template');

const habitIdInput = document.getElementById('habit-id');
const habitNameInput = document.getElementById('habit-name');
const habitColorInput = document.getElementById('habit-color');
const habitTargetInput = document.getElementById('habit-target');

const addBtn = document.getElementById('add-btn');
const cancelBtn = document.getElementById('cancel-btn');

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function loadData() {
    const data = localStorage.getItem('habit_tracker_data');
    if (data) {
        try { habitsData = JSON.parse(data); } catch (e) { habitsData = []; }
    }
}

function saveData() {
    localStorage.setItem('habit_tracker_data', JSON.stringify(habitsData));
}

function calculateStreak(habit) {
    let streak = 0;
    let d = new Date();
    while (true) {
        if ((habit.records[d.toISOString().split('T')[0]] || 0) >= habit.target) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else break;
    }
    return streak;
}

function calculateWeeklyPercent(habit) {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if ((habit.records[d.toISOString().split('T')[0]] || 0) >= habit.target) count++;
    }
    return Math.round((count / 7) * 100);
}

function checkIfNeglected(habit) {
    const today = new Date();
    for (let i = 1; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if ((habit.records[d.toISOString().split('T')[0]] || 0) >= habit.target) return false;
    }
    return true;
}

function renderAll() {
    habitsList.innerHTML = '';
    
    if (habitsData.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-list';
        empty.textContent = 'Привычек пока нет. Нажмите «Добавить привычку».';
        habitsList.appendChild(empty);
        return;
    }

    const todayStr = getToday();
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    habitsData.forEach(habit => {
        const clone = habitTemplate.content.cloneNode(true);
        const card = clone.querySelector('.habit-card');
        
        card.style.borderLeftColor = habit.color;
        clone.querySelector('.habit-name-text').textContent = habit.name;
        
        if (checkIfNeglected(habit)) {
            clone.querySelector('.badge-warning').classList.remove('hidden');
        }

        const doneToday = habit.records[todayStr] || 0;
        const percent = Math.min(100, Math.round((doneToday / habit.target) * 100));
        
        const progressBar = clone.querySelector('.progress-bar');
        progressBar.style.width = percent + '%';
        progressBar.style.backgroundColor = habit.color;
        progressBar.textContent = percent + '%';

        clone.querySelector('.counter-text').textContent = `${doneToday} / ${habit.target}`;
        
        const streak = calculateStreak(habit);
        const weeklyPercent = calculateWeeklyPercent(habit);
        clone.querySelector('.streak-text').textContent = `Серия: ${streak} дн. подряд`;
        clone.querySelector('.weekly-text').textContent = `За последнюю неделю: ${weeklyPercent}% (${Math.round(weeklyPercent * 7 / 100)} из 7 дней)`;

        const calendarDiv = clone.querySelector('.calendar');
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isDone = (habit.records[dateStr] || 0) >= habit.target;
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            if (isDone) {
                dayElement.style.backgroundColor = habit.color;
                dayElement.style.color = 'white';
            }
            calendarDiv.appendChild(dayElement);
        }

        clone.querySelector('.plus-btn').addEventListener('click', () => addCompletion(habit.id));
        clone.querySelector('.btn-reset').addEventListener('click', () => resetToday(habit.id));
        clone.querySelector('.btn-edit').addEventListener('click', () => openEditModal(habit.id));
        clone.querySelector('.btn-delete').addEventListener('click', () => deleteHabit(habit.id));

        habitsList.appendChild(clone);
    });
}

function addCompletion(id) {
    const habit = habitsData.find(h => h.id === id);
    if (!habit) return;
    const todayStr = getToday();
    let current = habit.records[todayStr] || 0;
    if (current < habit.target) {
        habit.records[todayStr] = current + 1;
        saveData();
        renderAll();
    } else alert('Цель на сегодня уже достигнута!');
}

function resetToday(id) {
    const habit = habitsData.find(h => h.id === id);
    if (!habit) return;
    const todayStr = getToday();
    if (habit.records[todayStr]) {
        habit.records[todayStr] = 0;
        saveData();
        renderAll();
    }
}

function deleteHabit(id) {
    if (confirm('Вы уверены, что хотите удалить эту привычку?')) {
        habitsData = habitsData.filter(h => h.id !== id);
        saveData();
        renderAll();
    }
}

function openAddModal() {
    habitIdInput.value = '';
    habitNameInput.value = '';
    habitColorInput.value = '#904caf';
    habitTargetInput.value = '';
    modalTitle.textContent = 'Добавить привычку';
    modal.classList.remove('hidden');
}

function openEditModal(id) {
    const habit = habitsData.find(h => h.id === id);
    habitIdInput.value = habit.id;
    habitNameInput.value = habit.name;
    habitColorInput.value = habit.color;
    habitTargetInput.value = habit.target;
    modalTitle.textContent = 'Редактировать привычку';
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
}

addBtn.addEventListener('click', openAddModal);
cancelBtn.addEventListener('click', closeModal);

habitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = habitIdInput.value || Date.now().toString();
    const name = habitNameInput.value.trim();
    const color = habitColorInput.value;
    const target = parseInt(habitTargetInput.value);
    
    if (!name || !target || target < 1) return;

    if (habitIdInput.value) {
        const habit = habitsData.find(h => h.id === habitIdInput.value);
        habit.name = name;
        habit.color = color;
        habit.target = target;
    } else {
        habitsData.push({ id: id, name: name, color: color, target: target, records: {} });
    }
    
    saveData();
    closeModal();
    renderAll();
});

loadData();
renderAll();
