// trophies_list.js
// Модуль для работы со списком трофеев

import { fetchTrophiesList } from './api.js';
import { showScreen } from './ui.js';
import { openTrophyDetail } from './trophy_detail.js';

// Флаг: отрендерено ли уже список трофеев за эту сессию
let trophiesListRendered = false;

// Создание кнопки трофея в списке
function createTrophyListItemButton(trophy) {
    const trophyKey = trophy.key;
    const trophyName = trophy.name;
    const isObtained = trophy.obtained || false;
    
    // Создаём элемент кнопки
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'trophy-list-item-btn';
    
    // Если трофей получен, добавляем класс для зеленого контура
    if (isObtained) {
        button.classList.add('obtained');
    }
    
    // Левая часть - название трофея
    const textContainer = document.createElement('div');
    textContainer.className = 'trophy-list-item-text';
    textContainer.textContent = trophyName;
    button.appendChild(textContainer);
    
    // Правая часть - иконка (всегда видна)
    const iconContainer = document.createElement('div');
    iconContainer.className = 'trophy-list-item-icon';
    
    const icon = document.createElement('img');
    icon.className = 'trophy-icon-small';
    icon.src = `./assets/trophies/${trophyKey}.svg`;
    icon.alt = trophyName;
    icon.loading = 'lazy';
    
    // Если трофей не получен, делаем иконку полупрозрачной
    if (!isObtained) {
        icon.style.opacity = '0.5';
    }
    
    iconContainer.appendChild(icon);
    button.appendChild(iconContainer);
    
    // Обработчик клика
    button.addEventListener('click', () => {
        openTrophyDetail(trophyKey);
    });
    
    return button;
}

// Рендеринг списка трофеев
export async function renderTrophiesButtons() {
    // Если уже отрендерено - ничего не делаем
    if (trophiesListRendered) {
        return;
    }
    
    // Пробуем найти контейнер
    const container = document.getElementById('trophiesButtonsContainer');
    if (!container) {
        return;
    }
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    try {
        // Загружаем список трофеев
        const trophies = await fetchTrophiesList();
        
        if (!trophies || trophies.length === 0) {
            container.innerHTML = '<div class="hint muted">Трофеи пока не добавлены</div>';
            trophiesListRendered = true;
            return;
        }
        
        // Создаём кнопки для каждого трофея
        trophies.forEach(trophy => {
            const button = createTrophyListItemButton(trophy);
            container.appendChild(button);
        });
        
        trophiesListRendered = true;
    } catch (error) {
        console.error('Ошибка загрузки списка трофеев:', error);
        container.innerHTML = '<div class="hint muted">Ошибка загрузки списка трофеев</div>';
    }
}

// Сброс флага рендеринга (для принудительного обновления)
export function resetTrophiesListRendered() {
    trophiesListRendered = false;
}

// Инициализация модуля
export function initTrophiesList() {
    // Модуль готов к использованию
    console.log('TrophiesList модуль инициализирован');
}

