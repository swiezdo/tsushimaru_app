// waves.js
// Отрисовка волновых расписаний

import { getWavesData } from './api.js';
import { setTopbar } from './ui.js';
import { getMapPath } from './utils.js';

const elements = {
  map: null,
  mod1: null,
  mod2: null,
  table: null,
  tbody: null,
  emptyState: null,
  modIcons: null,
  mapCard: null,
  metaCard: null,
  objectivesList: null,
  modsList: null,
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
  const numberKey = `objective${index + 1}_num`;
  const count = objectives[numberKey];
  const label =
    typeof count === 'number' || typeof count === 'string'
      ? String(count)
      : null;
  const description = objectives[descriptionKey] || 'Бонусная задача';
  const tooltip = label ? `${description} — ${label}` : description;

  return {
    path: `./assets/icons/objectives/${filename}`,
    type: ICON_TYPES.OBJECTIVE,
    description: tooltip,
    label,
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
    label: null,
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

  if (iconData.label) {
    const tag = document.createElement('span');
    tag.classList.add('waves-icon-tag');
    tag.textContent = iconData.label;
    badge.appendChild(tag);
  }

  badge.appendChild(icon);
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
  elements.modIcons = document.getElementById('wavesModIcons');
  elements.mapCard = document.querySelector('.waves-meta-card');
  elements.metaCard = document.getElementById('wavesMetaCard');
  elements.objectivesList = document.getElementById('wavesObjectivesList');
  elements.modsList = document.getElementById('wavesModsList');

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
  if (elements.metaCard) {
    elements.metaCard.classList.add('hidden');
  }
  if (elements.modIcons) {
    elements.modIcons.innerHTML = '';
    elements.modIcons.classList.add('hidden');
  }
}

function showTable() {
  if (elements.table) {
    elements.table.classList.remove('hidden');
  }
  if (elements.emptyState) {
    elements.emptyState.classList.add('hidden');
  }
  if (elements.metaCard) {
    elements.metaCard.classList.remove('hidden');
  }
}

function renderHeader(data) {
  if (elements.map) elements.map.textContent = data?.map || '—';
  if (elements.mod1) elements.mod1.textContent = data?.mod1 || '—';
  if (elements.mod2) elements.mod2.textContent = data?.mod2 || '—';
  if (elements.mapCard) {
    const slug = data?.slug;
    if (slug) {
      const mapPath = getMapPath(slug, 'survival');
      // Устанавливаем фон напрямую на элемент, как в story-hero-card
      elements.mapCard.style.backgroundImage = `url('${mapPath}')`;
      elements.mapCard.style.backgroundSize = 'cover';
      elements.mapCard.style.backgroundPosition = 'center';
      elements.mapCard.style.backgroundRepeat = 'no-repeat';
      elements.mapCard.classList.add('waves-meta-card--with-bg');
    } else {
      elements.mapCard.style.backgroundImage = '';
      elements.mapCard.style.backgroundSize = '';
      elements.mapCard.style.backgroundPosition = '';
      elements.mapCard.style.backgroundRepeat = '';
      elements.mapCard.classList.remove('waves-meta-card--with-bg');
    }
  }
  renderModIcons(data);

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

function renderMetaList(container, items) {
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(items) || items.length === 0) {
    container.classList.add('waves-meta-list--empty');
    return;
  }

  container.classList.remove('waves-meta-list--empty');

  items.forEach((item) => {
    const row = document.createElement('div');
    row.classList.add('waves-meta-item');

    const icon = document.createElement('img');
    icon.src = item.path;
    icon.alt = item.description;
    icon.decoding = 'async';
    icon.loading = 'lazy';
    icon.classList.add('waves-meta-icon');

    const text = document.createElement('div');
    text.classList.add('waves-meta-text');
    text.textContent = item.description;

    row.appendChild(icon);
    row.appendChild(text);
    container.appendChild(row);
  });
}

function buildObjectiveItems(objectives) {
  if (!objectives) return [];
  const items = [];

  OBJECTIVE_WAVE_NUMBERS.forEach((_, idx) => {
    const index = idx + 1;
    const iconKey = `objective${index}_icon`;
    const labelKey = `objective${index}`;
    const numberKey = `objective${index}_num`;

    const filename = objectives[iconKey];
    if (!filename) return;

    const description = objectives[labelKey] || 'Бонусная задача';
    const count = objectives[numberKey];
    const fullDescription =
      typeof count === 'number' || typeof count === 'string'
        ? `${description} — ${count}`
        : description;

    items.push({
      path: `./assets/icons/objectives/${filename}`,
      description: fullDescription,
    });
  });

  return items;
}

function buildModItems(mods) {
  if (!mods) return [];
  const items = [];

  const waveLabel = (number) => `${number}-я`;

  MOD_WAVE_NUMBERS.forEach((waveNumber, idx) => {
    const index = idx + 1;
    const iconKey = `mod${index}_icon`;
    const labelKey = `mod${index}`;

    const filename = mods[iconKey];
    if (!filename) return;

    const description = mods[labelKey] || 'Модификатор мира';
    const waveText = `${waveLabel(waveNumber)} волна`;
    const fullDescription = `${description} — ${waveText}`;

    items.push({
      path: `./assets/icons/mods/${filename}`,
      description: fullDescription,
    });
  });

  return items;
}

function renderWaves(data) {
  renderHeader(data);
  renderTableRows(data?.waves, {
    objectives: data?.objectives,
    mods: data?.mods,
  });

  const objectivesItems = buildObjectiveItems(data?.objectives);
  const modItems = buildModItems(data?.mods);

  renderMetaList(elements.objectivesList, objectivesItems);
  renderMetaList(elements.modsList, modItems);
}

function renderModIcons(data) {
  if (!elements.modIcons) {
    console.warn('waves.js: elements.modIcons не найден');
    return;
  }
  elements.modIcons.innerHTML = '';

  const items = [];
  if (data?.mod1_icon) {
    items.push({
      path: `./assets/icons/mod1/${data.mod1_icon}`,
      title: data?.mod1 || '',
    });
  }
  if (data?.mod2_icon) {
    items.push({
      path: `./assets/icons/mod2/${data.mod2_icon}`,
      title: data?.mod2 || '',
    });
  }

  if (!items.length) {
    console.warn('waves.js: Нет данных для модификаторов', {
      mod1_icon: data?.mod1_icon,
      mod2_icon: data?.mod2_icon,
      dataKeys: data ? Object.keys(data) : null
    });
    elements.modIcons.classList.add('hidden');
    return;
  }

  elements.modIcons.classList.remove('hidden');

  items.forEach((item) => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('waves-mod-icon');

    const img = document.createElement('img');
    img.src = item.path;
    img.alt = item.title;
    img.title = item.title;
    img.decoding = 'async';
    img.loading = 'lazy';
    img.onerror = () => {
      console.error(`waves.js: Не удалось загрузить иконку модификатора: ${item.path}`);
    };

    wrapper.appendChild(img);
    elements.modIcons.appendChild(wrapper);
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

