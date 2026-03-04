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

function formatDateRange(med) {
  if (!med.startDate && !med.endDate) return '';
  if (med.startDate && !med.endDate) return `From ${med.startDate}`;
  if (!med.startDate && med.endDate) return `Until ${med.endDate}`;
  return `${med.startDate} → ${med.endDate}`;
}

function renderMedicines() {
  const listEl = document.getElementById('medicine-list');
  const emptyStateEl = document.getElementById('empty-state');
  const medicines = loadMedicines();

  listEl.innerHTML = '';

  if (medicines.length === 0) {
    emptyStateEl.classList.remove('hidden');
    return;
  }

  emptyStateEl.classList.add('hidden');

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

  clearAllBtn.addEventListener('click', () => {
    if (loadMedicines().length === 0) return;
    if (confirm('Clear all medicines?')) {
      clearAllMedicines();
    }
  });

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

    const newMed = {
      id: crypto.randomUUID ? crypto.randomUUID() : `med-${Date.now()}-${Math.random()}`,
      name,
      dose,
      frequency,
      timeOfDay,
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

document.addEventListener('DOMContentLoaded', () => {
  setupForm();
  renderMedicines();
});

