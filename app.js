const STORAGE_KEY = 'pill-reminder-medicines';

function loadMedicines() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMedicines(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function formatFrequency(med) {
  if (med.frequency === 'daily') return 'Daily';
  if (med.frequency === 'every-other-day') return 'Every other day';
  if (med.frequency === 'specific-days') {
    if (!med.days || med.days.length === 0) return 'Specific days';
    return `On ${med.days.join(', ')}`;
  }
  return '';
}

function formatTimeOfDay(med) {
  if (!med.timeOfDay || med.timeOfDay.length === 0) return null;
  const pretty = med.timeOfDay
    .map((t) => {
      if (t === 'morning') return 'Morning';
      if (t === 'afternoon') return 'Afternoon';
      if (t === 'night') return 'Night';
      return t;
    })
    .join(', ');
  return pretty;
}

function formatMealTiming(med) {
  if (!med.mealTiming) return null;
  if (med.mealTiming === 'before') return 'Before meal';
  if (med.mealTiming === 'after') return 'After meal';
  return null;
}

function formatDateRange(med) {
  if (!med.startDate && !med.endDate) return '';
  if (med.startDate && !med.endDate) return `From ${med.startDate}`;
  if (!med.startDate && med.endDate) return `Until ${med.endDate}`;
  return `${med.startDate} → ${med.endDate}`;
}

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function isWithinDateRange(med, targetDate) {
  const start = parseDate(med.startDate);
  const end = parseDate(med.endDate);

  if (start && targetDate < start) return false;
  if (end && targetDate > end) return false;
  return true;
}

function shouldTakeOnDate(med, targetDate) {
  if (!isWithinDateRange(med, targetDate)) return false;

  if (med.frequency === 'daily') return true;

  if (med.frequency === 'every-other-day') {
    const start = parseDate(med.startDate);
    if (!start) return false;
    const diffMs = targetDate - start;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return diffDays % 2 === 0;
  }

  if (med.frequency === 'specific-days') {
    if (!med.days || med.days.length === 0) return false;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[targetDate.getUTCDay()];
    return med.days.includes(dayName);
  }

  return false;
}

function renderScheduleForDate(dateStr) {
  const scheduleListEl = document.getElementById('schedule-list');
  const scheduleEmptyStateEl = document.getElementById('schedule-empty-state');
  const scheduleDateLabelEl = document.getElementById('schedule-date-label');

  if (!scheduleListEl || !scheduleEmptyStateEl || !scheduleDateLabelEl) return;

  const effectiveDateStr = dateStr || getTodayDateString();
  const targetDate = parseDate(effectiveDateStr);
  if (!targetDate) return;

  const medicines = loadMedicines().filter((med) => shouldTakeOnDate(med, targetDate));

  scheduleListEl.innerHTML = '';

  const formattedDate = targetDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  scheduleDateLabelEl.textContent = formattedDate;

  if (medicines.length === 0) {
    scheduleEmptyStateEl.classList.remove('hidden');
    return;
  }

  scheduleEmptyStateEl.classList.add('hidden');

  medicines.forEach((med) => {
    const li = document.createElement('li');
    li.className = 'medicine-item';
    li.dataset.id = med.id;

    const main = document.createElement('div');
    main.className = 'medicine-main';

    const nameEl = document.createElement('div');
    nameEl.className = 'medicine-name';
    nameEl.textContent = med.name;

    const doseEl = document.createElement('div');
    doseEl.className = 'medicine-dose';
    doseEl.textContent = med.dose || '';
    if (!med.dose) doseEl.classList.add('hidden');

    const meta = document.createElement('div');
    meta.className = 'medicine-meta';

    const tagRow = document.createElement('div');
    tagRow.className = 'tag-row';

    const freqTag = document.createElement('span');
    freqTag.className = 'tag';
    freqTag.textContent = formatFrequency(med);
    tagRow.appendChild(freqTag);

    const tod = formatTimeOfDay(med);
    if (tod) {
      const todTag = document.createElement('span');
      todTag.className = 'tag secondary';
      todTag.textContent = tod;
      tagRow.appendChild(todTag);
    }

    const meal = formatMealTiming(med);
    if (meal) {
      const mealTag = document.createElement('span');
      const mealClass =
        med.mealTiming === 'before' ? 'tag meal-before' : 'tag meal-after';
      mealTag.className = mealClass;
      mealTag.textContent = meal;
      tagRow.appendChild(mealTag);
    }

    const dateRange = formatDateRange(med);
    if (dateRange) {
      const dateTag = document.createElement('span');
      dateTag.className = 'tag';
      dateTag.textContent = dateRange;
      tagRow.appendChild(dateTag);
    }

    meta.appendChild(tagRow);

    main.appendChild(nameEl);
    main.appendChild(doseEl);
    main.appendChild(meta);

    li.appendChild(main);

    scheduleListEl.appendChild(li);
  });
}

function renderScheduleForCurrentDate() {
  const scheduleDateInput = document.getElementById('schedule-date');
  if (!scheduleDateInput) return;
  const value = scheduleDateInput.value || getTodayDateString();
  renderScheduleForDate(value);
}

function renderMedicines() {
  const listEl = document.getElementById('medicine-list');
  const emptyStateEl = document.getElementById('empty-state');
  const medicines = loadMedicines();

  listEl.innerHTML = '';

  if (medicines.length === 0) {
    emptyStateEl.classList.remove('hidden');
    renderScheduleForCurrentDate();
    return;
  }

  emptyStateEl.classList.add('hidden');

  medicines.forEach((med) => {
    const li = document.createElement('li');
    li.className = 'medicine-item';
    li.dataset.id = med.id;
    li.draggable = true;

    const main = document.createElement('div');
    main.className = 'medicine-main';

    const nameEl = document.createElement('div');
    nameEl.className = 'medicine-name';
    nameEl.textContent = med.name;

    const doseEl = document.createElement('div');
    doseEl.className = 'medicine-dose';
    doseEl.textContent = med.dose || '';
    if (!med.dose) doseEl.classList.add('hidden');

    const meta = document.createElement('div');
    meta.className = 'medicine-meta';

    const tagRow = document.createElement('div');
    tagRow.className = 'tag-row';

    const freqTag = document.createElement('span');
    freqTag.className = 'tag';
    freqTag.textContent = formatFrequency(med);
    tagRow.appendChild(freqTag);

    const tod = formatTimeOfDay(med);
    if (tod) {
      const todTag = document.createElement('span');
      todTag.className = 'tag secondary';
      todTag.textContent = tod;
      tagRow.appendChild(todTag);
    }

    const dateRange = formatDateRange(med);
    if (dateRange) {
      const dateTag = document.createElement('span');
      dateTag.className = 'tag';
      dateTag.textContent = dateRange;
      tagRow.appendChild(dateTag);
    }

    meta.appendChild(tagRow);

    main.appendChild(nameEl);
    main.appendChild(doseEl);
    main.appendChild(meta);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Remove';
    deleteBtn.addEventListener('click', () => {
      deleteMedicine(med.id);
    });

    li.appendChild(main);
    li.appendChild(deleteBtn);

    listEl.appendChild(li);
  });

  renderScheduleForCurrentDate();
}

function deleteMedicine(id) {
  const medicines = loadMedicines().filter((m) => m.id !== id);
  saveMedicines(medicines);
  renderMedicines();
}

function clearAllMedicines() {
  saveMedicines([]);
  renderMedicines();
}

function setupForm() {
  const form = document.getElementById('medicine-form');
  const frequencySelect = document.getElementById('frequency');
  const specificDaysField = document.getElementById('specific-days-field');
  const clearAllBtn = document.getElementById('clear-all');

  frequencySelect.addEventListener('change', () => {
    if (frequencySelect.value === 'specific-days') {
      specificDaysField.classList.remove('hidden');
    } else {
      specificDaysField.classList.add('hidden');
    }
  });

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (loadMedicines().length === 0) return;
      if (confirm('Clear all medicines?')) {
        clearAllMedicines();
      }
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    const name = formData.get('name').trim();
    if (!name) return;

    const dose = formData.get('dose').trim() || '';
    const frequency = formData.get('frequency');
    const startDate = formData.get('startDate') || '';
    const endDate = formData.get('endDate') || '';

    const timeOfDay = formData.getAll('timeOfDay');
    const days = formData.getAll('days');
    const mealTiming = formData.get('mealTiming') || '';

    const newMed = {
      id: crypto.randomUUID ? crypto.randomUUID() : `med-${Date.now()}-${Math.random()}`,
      name,
      dose,
      frequency,
      timeOfDay,
      mealTiming,
      days: frequency === 'specific-days' ? days : [],
      startDate,
      endDate,
      createdAt: new Date().toISOString(),
    };

    const medicines = loadMedicines();
    medicines.push(newMed);
    saveMedicines(medicines);

    form.reset();
    specificDaysField.classList.add('hidden');
    renderMedicines();
  });
}

function setupAccordions() {
  const accordions = document.querySelectorAll('.accordion');
  accordions.forEach((accordion) => {
    const header = accordion.querySelector('.accordion-header');
    if (!header) return;

    header.addEventListener('click', (event) => {
      // Allow inner buttons like "Clear all" to work without toggling.
      if (event.target.closest('#clear-all')) {
        return;
      }
      accordion.classList.toggle('collapsed');
    });
  });
}

function setupDragAndDrop() {
  const listEl = document.getElementById('medicine-list');
  if (!listEl) return;

  let dragId = null;

  listEl.addEventListener('dragstart', (event) => {
    const li = event.target.closest('.medicine-item');
    if (!li) return;
    dragId = li.dataset.id;
    li.classList.add('dragging');
  });

  listEl.addEventListener('dragend', (event) => {
    const li = event.target.closest('.medicine-item');
    if (li) {
      li.classList.remove('dragging');
    }
    dragId = null;
  });

  listEl.addEventListener('dragover', (event) => {
    event.preventDefault();
  });

  listEl.addEventListener('drop', (event) => {
    event.preventDefault();
    const targetLi = event.target.closest('.medicine-item');
    if (!dragId || !targetLi) return;
    const targetId = targetLi.dataset.id;
    if (!targetId || targetId === dragId) return;

    const medicines = loadMedicines();
    const fromIndex = medicines.findIndex((m) => m.id === dragId);
    const toIndex = medicines.findIndex((m) => m.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = medicines.splice(fromIndex, 1);
    medicines.splice(toIndex, 0, moved);
    saveMedicines(medicines);
    renderMedicines();
  });

  // Pointer based reordering for touch/mobile (also works on desktop).
  listEl.addEventListener('pointerdown', (event) => {
    // Ignore presses on buttons like "Remove"
    if (event.target.closest('button')) return;
    const li = event.target.closest('.medicine-item');
    if (!li) return;
    dragId = li.dataset.id;
    li.classList.add('dragging');
    document.body.classList.add('no-scroll');
    li.setPointerCapture(event.pointerId);
  });

  listEl.addEventListener('pointerup', (event) => {
    if (!dragId) return;
    document.body.classList.remove('no-scroll');
    const sourceId = dragId;
    const targetLi = event.target.closest('.medicine-item');

    // Clear dragging state
    const draggingEl = listEl.querySelector('.medicine-item.dragging');
    if (draggingEl) draggingEl.classList.remove('dragging');
    dragId = null;

    if (!targetLi) return;
    const targetId = targetLi.dataset.id;
    if (!targetId || targetId === sourceId) return;

    const medicines = loadMedicines();
    const fromIndex = medicines.findIndex((m) => m.id === sourceId);
    const toIndex = medicines.findIndex((m) => m.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = medicines.splice(fromIndex, 1);
    medicines.splice(toIndex, 0, moved);
    saveMedicines(medicines);
    renderMedicines();
  });

  listEl.addEventListener('pointercancel', () => {
    const draggingEl = listEl.querySelector('.medicine-item.dragging');
    if (draggingEl) draggingEl.classList.remove('dragging');
    dragId = null;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupForm();
  setupAccordions();
  setupDragAndDrop();
  renderMedicines();

   const scheduleDateInput = document.getElementById('schedule-date');
   if (scheduleDateInput) {
     const today = getTodayDateString();
     scheduleDateInput.value = today;
     scheduleDateInput.addEventListener('change', () => {
       const value = scheduleDateInput.value || getTodayDateString();
       renderScheduleForDate(value);
     });
     renderScheduleForDate(scheduleDateInput.value);
   }
});

