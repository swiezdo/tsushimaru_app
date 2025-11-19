// season_trophy.js
// Модуль для работы с сезонным трофеем

import { hapticTapSmart, $ } from './telegram.js';

let cachedSeasonTrophy = null;
let seasonTrophyRendered = false;

const cardContainer = $('seasonTrophyCard');

/**
 * Загружает данные сезонного трофея из JSON файла
 */
async function fetchSeasonTrophy() {
    if (cachedSeasonTrophy !== null) {
        return cachedSeasonTrophy;
    }

    try {
        const response = await fetch(`./assets/data/season_trophy.json?v=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`season_trophy.json status ${response.status}`);
        }
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            console.error('season_trophy.json: ожидается массив');
            cachedSeasonTrophy = null;
            return null;
        }

        // Ищем активный трофей
        const activeTrophy = data.find(trophy => trophy.status === 'active');
        cachedSeasonTrophy = activeTrophy || null;
        return cachedSeasonTrophy;
    } catch (error) {
        console.error('Ошибка загрузки season_trophy.json:', error);
        cachedSeasonTrophy = null;
        return null;
    }
}

/**
 * Создает паттерн с отступами через canvas
 */
async function createPatternWithSpacing(iconUrl, iconSize = 22, spacing = 60) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = spacing;
            canvas.height = spacing;
            
            // Очищаем canvas
            ctx.clearRect(0, 0, spacing, spacing);
            
            // Рисуем иконку по центру ячейки
            const x = (spacing - iconSize) / 2;
            const y = (spacing - iconSize) / 2;
            ctx.drawImage(img, x, y, iconSize, iconSize);
            
            resolve(canvas.toDataURL());
        };
        img.onerror = () => resolve(null);
        img.src = iconUrl;
    });
}

/**
 * Создает карточку сезонного трофея
 */
async function createSeasonTrophyCard(trophy) {
    if (!trophy || !trophy.key) {
        return null;
    }

    const card = document.createElement('button');
    card.className = 'season-trophy-card';
    card.type = 'button';
    card.setAttribute('data-trophy-key', trophy.key);

    // Фон с паттерном из иконки трофея
    const iconUrl = `./assets/trophies/${trophy.key}.svg`;
    
    // Создаем паттерн с отступами (уменьшенный отступ - 50px вместо 60px)
    const patternUrl = await createPatternWithSpacing(iconUrl, 22, 50);
    const bgImage = patternUrl || iconUrl;

    card.innerHTML = `
        <div class="season-trophy-bg" style="background-image: url(${bgImage});"></div>
        <div class="season-trophy-shine"></div>
        <div class="season-trophy-content">
            <div class="season-trophy-icon-wrapper">
                <img class="season-trophy-icon" src="${iconUrl}" alt="${trophy.name || 'Сезонный трофей'}" loading="lazy" />
            </div>
            <div class="season-trophy-text">${trophy.name || 'Сезонный трофей!'}</div>
        </div>
    `;

    // Обработчик клика - переход на страницу деталей
    card.addEventListener('click', async () => {
        hapticTapSmart();
        const { openSeasonTrophyDetail } = await import('./season_trophy_detail.js');
        openSeasonTrophyDetail(trophy.key);
    });

    return card;
}

/**
 * Рендерит карточку сезонного трофея
 */
export async function renderSeasonTrophy() {
    if (!cardContainer) {
        return;
    }

    // Если уже отрендерено, не перерисовываем
    if (seasonTrophyRendered) {
        return;
    }

    try {
        const activeTrophy = await fetchSeasonTrophy();

        if (!activeTrophy) {
            // Нет активного трофея - скрываем карточку
            cardContainer.classList.add('hidden');
            seasonTrophyRendered = true;
            return;
        }

        // Есть активный трофей - показываем карточку
        cardContainer.classList.remove('hidden');
        cardContainer.innerHTML = '';
        
        const card = await createSeasonTrophyCard(activeTrophy);
        if (card) {
            cardContainer.appendChild(card);
        }

        seasonTrophyRendered = true;
    } catch (error) {
        console.error('Ошибка рендеринга сезонного трофея:', error);
        cardContainer.classList.add('hidden');
    }
}

/**
 * Сбрасывает кеш и флаг рендеринга
 */
export function invalidateSeasonTrophyCache() {
    cachedSeasonTrophy = null;
    seasonTrophyRendered = false;
}

/**
 * Инициализация модуля
 */
export function initSeasonTrophy() {
    // Модуль готов к использованию
    console.log('SeasonTrophy модуль инициализирован');
}

