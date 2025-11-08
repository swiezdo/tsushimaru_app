// waves.js
// Отрисовка волновых расписаний

import { getWavesData } from './api.js';
import { setTopbar } from './ui.js';

const elements = {
  map: null,
  mod1: null,
  mod2: null,
  table: null,
  tbody: null,
  emptyState: null,
  emptyStateText: null,
};

let wavesCache = null;
let initialized = false;

function ensureElements() {
  if (initialized) return;

  elements.map = document.getElementById('wavesMap');
  elements.mod1 = document.getElementById('wavesMod1');
  elements.mod2 = document.getElementById('wavesMod2');
  elements.table = document.getElementById('wavesTable');
  elements.emptyState = document.getElementById('wavesEmptyState');
  elements.emptyStateText = document.getElementById('wavesEmptyStateText');

  if (elements.table) {
    elements.tbody = elements.table.querySelector('tbody');
  }

  initialized = true;
}

function formatTopbarTitle(data) {
  const absoluteWeek = data?.absolute_week;
  const week = data?.week;

  if (absoluteWeek == null || week == null) {
    return 'Волны';
  }

  return `${absoluteWeek}-ая неделя (${week})`;
}

function setLoading(message = 'Загрузка...') {
  if (!elements.emptyState || !elements.table) return;
  if (elements.emptyStateText) elements.emptyStateText.textContent = message;
  else elements.emptyState.textContent = message;
  elements.emptyState.classList.remove('hidden');
  elements.table.classList.add('hidden');
}

function showEmpty(message) {
  if (!elements.emptyState || !elements.table) return;
  if (elements.emptyStateText) elements.emptyStateText.textContent = message;
  else elements.emptyState.textContent = message;
  elements.emptyState.classList.remove('hidden');
  elements.table.classList.add('hidden');
}

function showTable() {
  if (!elements.emptyState || !elements.table) return;
  elements.emptyState.classList.add('hidden');
  elements.table.classList.remove('hidden');
}

function renderHeader(data) {
  if (elements.map) elements.map.textContent = data?.map || '—';
  if (elements.mod1) elements.mod1.textContent = data?.mod1 || '—';
  if (elements.mod2) elements.mod2.textContent = data?.mod2 || '—';

  const title = formatTopbarTitle(data);
  setTopbar(true, title);
}

function renderTableRows(waves) {
  if (!elements.tbody) return;
  elements.tbody.innerHTML = '';

  if (!Array.isArray(waves) || waves.length === 0) {
    showEmpty('Данные о волнах недоступны.');
    return;
  }

  waves.forEach((spawnRow, index) => {
    const tr = document.createElement('tr');

    const waveNumber = index + 1;
    if (waveNumber % 3 === 0) {
      tr.classList.add('waves-strong');
    }

    const numCell = document.createElement('td');
    numCell.textContent = `${waveNumber}.`;
    numCell.classList.add('waves-number');
    tr.appendChild(numCell);

    for (let i = 0; i < 3; i += 1) {
      const cell = document.createElement('td');
      const value = Array.isArray(spawnRow) ? spawnRow[i] : undefined;
      cell.textContent = value || '—';
      tr.appendChild(cell);
    }

    elements.tbody.appendChild(tr);
  });

  showTable();
}

function renderWaves(data) {
  renderHeader(data);
  renderTableRows(data?.waves);
}

export async function openWavesScreen() {
  ensureElements();

  if (wavesCache) {
    renderWaves(wavesCache);
    return;
  }

  setLoading('Загрузка волн...');

  try {
    const data = await getWavesData();
    wavesCache = data;
    renderWaves(data);
  } catch (error) {
    console.error('Не удалось загрузить данные волн:', error);
    showEmpty('Не удалось загрузить волны. Попробуйте позже.');
    setTopbar(true, 'Волны');
  }
}

export function resetWavesCache() {
  wavesCache = null;
}

export function initWaves() {
  ensureElements();
}

