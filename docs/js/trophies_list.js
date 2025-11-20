// trophies_list.js
// Модуль для работы со списком трофеев

import { fetchTrophiesList } from './api.js';
import { hapticTapSmart, $ } from './telegram.js';
import { createButton } from './utils.js';
import { openTrophyDetail } from './trophy_detail.js';

let trophiesListRendered = false;

const listContainer = $('trophiesButtonsContainer');

function createTrophyRow(trophy) {
    const button = createButton('button', 'list-btn', '', { trophyKey: trophy.key });

    button.innerHTML = `
        <div class="list-btn-content">
            <div class="list-btn-info">
                <span class="list-btn-name">${trophy.name}</span>
            </div>
            <div class="list-btn-trailing">
                <img class="list-btn-icon" src="./assets/trophies/${trophy.key}.svg" alt="${trophy.name}" loading="lazy" />
                <span class="right">›</span>
            </div>
        </div>
    `;

    const icon = button.querySelector('.list-btn-icon');
    if (trophy.obtained) {
        button.classList.add('success');
    } else if (icon) {
        icon.classList.add('is-dimmed');
    }

    button.addEventListener('click', async () => {
        hapticTapSmart();
        // Проверяем, является ли трофей сезонным
        if (trophy.is_season) {
            const { openSeasonTrophyDetail } = await import('./season_trophy_detail.js');
            openSeasonTrophyDetail(trophy.key);
        } else {
            openTrophyDetail(trophy.key);
        }
    });

    return button;
}

export async function renderTrophiesButtons() {
    if (trophiesListRendered || !listContainer) {
        return;
    }

    listContainer.innerHTML = '';

    try {
        const trophies = await fetchTrophiesList();

        if (!trophies || trophies.length === 0) {
            listContainer.innerHTML = '<div class="hint muted">Трофеи пока не добавлены</div>';
            trophiesListRendered = true;
            return;
        }

        const fragment = document.createDocumentFragment();
        trophies.forEach((trophy) => fragment.appendChild(createTrophyRow(trophy)));
        listContainer.appendChild(fragment);

        trophiesListRendered = true;
    } catch (error) {
        console.error('Ошибка загрузки списка трофеев:', error);
        listContainer.innerHTML = '<div class="hint muted">Ошибка загрузки списка трофеев</div>';
    }
}

export function resetTrophiesListRendered() {
    trophiesListRendered = false;
}

export function initTrophiesList() {
    // Модуль готов к использованию
    console.log('TrophiesList модуль инициализирован');
}
