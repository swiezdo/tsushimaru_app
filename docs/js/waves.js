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
};

let wavesCache = null;
let initialized = false;

const MAX_WAVES = 15;
const ICON_TYPES = {
  OBJECTIVE: 'objective',
  MOD: 'mod',
};
const OBJECTIVE_WAVE_NUMBERS = [2, 4, 7, 10, 13];
const MOD_WAVE_NUMBERS = [3, 6, 9, 12, 15];

function getObjectiveIcon(objectives, waveNumber) {
  if (!objectives) return null;

  const index = OBJECTIVE_WAVE_NUMBERS.indexOf(waveNumber);
  if (index === -1) return null;

  const key = `objective${index + 1}_icon`;
  const filename = objectives[key];
  if (!filename) return null;

  const descriptionKey = `objective${index + 1}`;
  return {
    path: `./assets/icons/objectives/${filename}`,
    type: ICON_TYPES.OBJECTIVE,
    description: objectives[descriptionKey] || 'Бонусная задача',
    label: 'Б',
  };
}

function getModIcon(mods, waveNumber) {
  if (!mods) return null;

  const index = MOD_WAVE_NUMBERS.indexOf(waveNumber);
  if (index === -1) return null;

  const key = `mod${index + 1}_icon`;
  const filename = mods[key];
  if (!filename) return null;

  const descriptionKey = `mod${index + 1}`;
  return {
    path: `./assets/icons/mods/${filename}`,
    type: ICON_TYPES.MOD,
    description: mods[descriptionKey] || 'Модификатор мира',
    label: 'М',
  };
}

function getWaveIcon(metadata, waveNumber) {
  if (!metadata) return null;

  return (
    getObjectiveIcon(metadata.objectives, waveNumber)
    || getModIcon(metadata.mods, waveNumber)
  );
}

function createIconCell(metadata, waveNumber) {
  const iconCell = document.createElement('td');
  iconCell.classList.add('waves-icon');

  const iconData = getWaveIcon(metadata, waveNumber);
  if (!iconData) {
    return iconCell;
  }

  const badge = document.createElement('div');
  badge.classList.add('waves-icon-badge');
  if (iconData.type === ICON_TYPES.OBJECTIVE) {
    badge.classList.add('waves-icon-badge--objective');
  } else if (iconData.type === ICON_TYPES.MOD) {
    badge.classList.add('waves-icon-badge--mod');
  }
  badge.title = iconData.description;
  badge.setAttribute('aria-label', iconData.description);

  const icon = document.createElement('img');
  icon.src = iconData.path;
  icon.alt = iconData.description;
  icon.decoding = 'async';
  icon.loading = 'lazy';
  icon.classList.add('waves-icon-img');

  const tag = document.createElement('span');
  tag.classList.add('waves-icon-tag');
  tag.textContent = iconData.label;

  badge.appendChild(icon);
  badge.appendChild(tag);
  iconCell.appendChild(badge);
  return iconCell;
}

function createNumberCell(waveNumber) {
  const numCell = document.createElement('td');
  numCell.textContent = `${waveNumber}.`;
  numCell.classList.add('waves-number');
  return numCell;
}

function createSpawnsCell(spawnRow) {
  const spawnCell = document.createElement('td');
  spawnCell.classList.add('waves-spawns');

  if (!Array.isArray(spawnRow) || spawnRow.length === 0) {
    spawnCell.textContent = '—';
    return spawnCell;
  }

  const filtered = spawnRow.filter((value) => typeof value === 'string' && value.trim().length > 0);
  spawnCell.textContent = filtered.length > 0 ? filtered.join(', ') : '—';

  return spawnCell;
}

function ensureElements() {
  if (initialized) return;

  elements.map = document.getElementById('wavesMap');
  elements.mod1 = document.getElementById('wavesMod1');
  elements.mod2 = document.getElementById('wavesMod2');
  elements.table = document.getElementById('wavesTable');
  elements.emptyState = document.getElementById('wavesEmptyState');

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

function showEmpty(message) {
  if (elements.table) {
    elements.table.classList.add('hidden');
  }
  if (elements.emptyState) {
    elements.emptyState.textContent = message;
    elements.emptyState.classList.remove('hidden');
  }
}

function showTable() {
  if (elements.table) {
    elements.table.classList.remove('hidden');
  }
  if (elements.emptyState) {
    elements.emptyState.classList.add('hidden');
  }
}

function renderHeader(data) {
  if (elements.map) elements.map.textContent = data?.map || '—';
  if (elements.mod1) elements.mod1.textContent = data?.mod1 || '—';
  if (elements.mod2) elements.mod2.textContent = data?.mod2 || '—';

  const title = formatTopbarTitle(data);
  setTopbar(true, title);
}

function renderTableRows(waves, metadata) {
  if (!elements.tbody) return;
  elements.tbody.innerHTML = '';

  if (!Array.isArray(waves) || waves.length === 0) {
    showEmpty('Данные о волнах недоступны.');
    return;
  }

  for (let index = 0; index < MAX_WAVES; index += 1) {
    const tr = document.createElement('tr');

    const waveNumber = index + 1;
    if (waveNumber % 3 === 0) {
      tr.classList.add('waves-strong');
    }

    const spawnRow = Array.isArray(waves) ? waves[index] : null;

    tr.appendChild(createIconCell(metadata, waveNumber));
    tr.appendChild(createNumberCell(waveNumber));
    tr.appendChild(createSpawnsCell(spawnRow));

    elements.tbody.appendChild(tr);
  }

  showTable();
}

function renderWaves(data) {
  renderHeader(data);
  renderTableRows(data?.waves, {
    objectives: data?.objectives,
    mods: data?.mods,
  });
}

export async function openWavesScreen() {
  ensureElements();

  if (wavesCache) {
    renderWaves(wavesCache);
    return;
  }

  if (elements.table) {
    elements.table.classList.add('hidden');
  }
  if (elements.emptyState) {
    elements.emptyState.classList.add('hidden');
  }

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

