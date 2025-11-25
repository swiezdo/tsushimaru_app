// trophies.js
// Модуль для работы с трофеями

import { fetchTrophies, updateActiveTrophies } from './api.js';
import { tg, hapticTapSmart, hapticOK, hapticERR, $ } from './telegram.js';
import { clearChildren, createButton, createImage, insertHintAfter, removeElements, getTrophyIconPath } from './utils.js';

const MAX_ACTIVE_TROPHIES = 8;
const HINT_ROLE = 'trophy-hint';

const collectionEl = $('trophiesCollectionContainer');
const collectionCard = collectionEl?.closest('.card');

let cachedTrophies = null;
let cachedActiveTrophies = [];
let trophiesRendered = false;
let renderVersion = 0;

async function fetchTrophiesWithCache(forceRefresh = false) {
    if (!forceRefresh && cachedTrophies !== null) {
        return {
            trophies: cachedTrophies,
            active_trophies: cachedActiveTrophies,
        };
    }

    try {
        const data = await fetchTrophies();
        cachedTrophies = data.trophies || [];
        cachedActiveTrophies = data.active_trophies || [];
        return data;
    } catch (error) {
        console.error('Ошибка загрузки трофеев:', error);
        cachedTrophies = [];
        cachedActiveTrophies = [];
        return { trophies: [], active_trophies: [] };
    }
}

function ensureCollectionLayout() {
    if (!collectionEl) return;
    collectionEl.classList.add('tile-grid');
}

function attachHint(text) {
    if (!collectionEl || !collectionCard) return;
    removeElements(collectionCard, `[data-role="${HINT_ROLE}"]`);
    const hint = insertHintAfter(collectionEl, text, 'muted');
    if (hint) {
        hint.dataset.role = HINT_ROLE;
        hint.style.marginTop = 'var(--space-3)';
    }
}

function createTrophyButton(trophyKey) {
    const button = createButton('button', 'tile-btn', '', { trophyKey });
    const icon = createImage(getTrophyIconPath(trophyKey), 'tile-icon', trophyKey, { loading: 'lazy' });
    button.appendChild(icon);
    button.addEventListener('click', () => handleTrophyClick(trophyKey));
    return button;
}

function syncActiveState(activeKeys) {
    if (!collectionEl) return;
    const activeSet = new Set(activeKeys);
    collectionEl.querySelectorAll('.tile-btn').forEach((btn) => {
        const key = btn.dataset.trophyKey;
        btn.classList.toggle('is-active', activeSet.has(key));
    });
}

async function handleTrophyClick(trophyKey) {
    hapticTapSmart();

    const current = cachedActiveTrophies.slice();
    const isActive = current.includes(trophyKey);
    let next = current;

    if (isActive) {
        next = current.filter((key) => key !== trophyKey);
    } else {
        if (current.length >= MAX_ACTIVE_TROPHIES) {
            return;
        }
        next = [...current, trophyKey].sort();
    }

    syncActiveState(next);

    try {
        await updateActiveTrophies(next);
        cachedActiveTrophies = next;
        hapticOK();
    } catch (error) {
        console.error('Ошибка обновления активных трофеев:', error);
        hapticERR();
        cachedActiveTrophies = current;
        syncActiveState(current);
        tg?.showPopup?.({
            title: 'Ошибка',
            message: 'Не удалось обновить активные трофеи. Попробуйте позже.',
            buttons: [{ type: 'ok' }],
        });
    }
}

export async function renderTrophiesCollection(forceRefresh = false) {
    if (!collectionEl) return;

    ensureCollectionLayout();

    if (trophiesRendered && !forceRefresh) {
        syncActiveState(cachedActiveTrophies);
        return;
    }

    const currentVersion = ++renderVersion;

    removeElements(collectionCard, `[data-role="${HINT_ROLE}"]`);
    clearChildren(collectionEl);

    const data = await fetchTrophiesWithCache(forceRefresh);
    if (currentVersion !== renderVersion) return;

    const trophies = data.trophies || [];
    cachedActiveTrophies = data.active_trophies || [];

    if (trophies.length === 0) {
        attachHint('У вас пока нет трофеев. Достигните максимального уровня или подайте заявку, чтобы получить первый трофей.');
        trophiesRendered = true;
        return;
    }

    const fragment = document.createDocumentFragment();
    const activeSet = new Set(cachedActiveTrophies);

    trophies.forEach((key) => {
        const button = createTrophyButton(key);
        button.classList.toggle('is-active', activeSet.has(key));
        fragment.appendChild(button);
    });

    collectionEl.appendChild(fragment);
    attachHint('Вы можете выбрать до 8 значков для отображения под вашим ником на странице участников');
    trophiesRendered = true;
}

export function invalidateTrophiesCache() {
    cachedTrophies = null;
    cachedActiveTrophies = [];
    trophiesRendered = false;
}

export function initTrophies() {
    ensureCollectionLayout();
}
