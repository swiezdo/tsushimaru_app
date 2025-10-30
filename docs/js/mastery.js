// mastery.js
// Модуль для работы с системой мастерства

import { fetchMastery } from './api.js';
import { $ } from './telegram.js';

// Кэш конфига
let masteryConfig = null;

// Загрузка конфига из JSON
async function loadMasteryConfig() {
    if (masteryConfig) return masteryConfig;
    
    try {
        const response = await fetch('./mastery-config.json');
        if (!response.ok) throw new Error('Не удалось загрузить конфиг');
        masteryConfig = await response.json();
        return masteryConfig;
    } catch (error) {
        console.error('Ошибка загрузки конфига мастерства:', error);
        return null;
    }
}

// Получение категории по ключу
function getCategoryByKey(config, key) {
    if (!config || !config.categories) return null;
    return config.categories.find(cat => cat.key === key) || null;
}

// Получение уровня по номеру в категории
function getLevelByNumber(category, levelNum) {
    if (!category || !category.levels) return null;
    return category.levels.find(level => level.level === levelNum) || null;
}

// Расчёт прогресса в процентах
function calculateProgress(currentLevel, maxLevels) {
    if (maxLevels === 0) return 0;
    return Math.round((currentLevel / maxLevels) * 100);
}

// Определение стилей кнопки в зависимости от уровня
function getButtonStyles(category, currentLevel) {
    const maxLevels = category.maxLevels;
    const styles = {
        classes: ['badge-btn', `${category.key}-badge`],
        backgroundImage: null,
        backgroundSize: null,
        backgroundPosition: null,
        showIcon: false
    };
    
    // Уровень 0: базовый стиль (без контура, без фона)
    if (currentLevel === 0) {
        return styles;
    }
    
    // Уровень 1+: красный контур (добавляется через CSS класс)
    styles.classes.push('has-glow');
    
    // Правила для разных количеств уровней
    if (maxLevels === 3) {
        // 3 уровня: 2 - background.jpg, 3 - background.gif + иконка
        if (currentLevel >= 2) {
            styles.backgroundImage = `url('./assets/mastery/${category.key}/background.jpg')`;
            styles.backgroundSize = '160% auto';
            styles.backgroundPosition = 'center';
        }
        if (currentLevel >= 3) {
            styles.backgroundImage = `url('./assets/mastery/${category.key}/background.gif')`;
            styles.showIcon = true;
        }
    } else if (maxLevels === 4) {
        // 4 уровня: 2 - background.jpg, 3 - background.gif, 4 - background.gif + иконка
        if (currentLevel >= 2) {
            styles.backgroundImage = `url('./assets/mastery/${category.key}/background.jpg')`;
            styles.backgroundSize = '160% auto';
            styles.backgroundPosition = 'center';
        }
        if (currentLevel >= 3) {
            styles.backgroundImage = `url('./assets/mastery/${category.key}/background.gif')`;
        }
        if (currentLevel >= 4) {
            styles.showIcon = true;
        }
    } else if (maxLevels === 5) {
        // 5 уровней: 2 - background.jpg, 3 - background2.jpg, 4 - background.gif, 5 - background.gif + иконка
        if (currentLevel >= 2) {
            styles.backgroundImage = `url('./assets/mastery/${category.key}/background.jpg')`;
            styles.backgroundSize = '160% auto';
            styles.backgroundPosition = 'center';
        }
        if (currentLevel >= 3) {
            styles.backgroundImage = `url('./assets/mastery/${category.key}/background2.jpg')`;
            styles.backgroundSize = '160% auto';
            styles.backgroundPosition = 'center';
        }
        if (currentLevel >= 4) {
            styles.backgroundImage = `url('./assets/mastery/${category.key}/background.gif')`;
        }
        if (currentLevel >= 5) {
            styles.showIcon = true;
        }
    }
    
    return styles;
}

// Создание HTML кнопки
function createBadgeButton(category, currentLevel) {
    const levelData = getLevelByNumber(category, currentLevel);
    const maxLevels = category.maxLevels;
    const progress = calculateProgress(currentLevel, maxLevels);
    const styles = getButtonStyles(category, currentLevel);
    
    // Название уровня или "Базовый уровень" если level = 0
    const levelName = currentLevel > 0 && levelData ? levelData.name : 'Базовый уровень';
    
    // Создаём элемент кнопки
    const button = document.createElement('button');
    button.type = 'button';
    button.className = styles.classes.join(' ');
    
    // Применяем фоновое изображение если есть
    if (styles.backgroundImage) {
        button.style.backgroundImage = styles.backgroundImage;
        button.style.backgroundRepeat = 'no-repeat';
        button.style.backgroundPosition = styles.backgroundPosition || 'center';
        button.style.backgroundSize = styles.backgroundSize || '160% auto';
    }
    
    // Заголовок с иконкой если нужно
    const titleDiv = document.createElement('div');
    titleDiv.className = 'badge-title';
    if (styles.showIcon) {
        titleDiv.style.display = 'inline-flex';
        titleDiv.style.alignItems = 'center';
        titleDiv.style.gap = '8px';
        
        // Добавляем иконку как первый элемент
        const iconSpan = document.createElement('span');
        iconSpan.style.cssText = `
            width: 32px;
            height: 32px;
            background-image: url('./assets/mastery/${category.key}/icon.svg');
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            filter: drop-shadow(0 0 6px rgba(212, 175, 55, 0.6)) drop-shadow(0 0 10px rgba(212, 175, 55, 0.35));
            opacity: 0.95;
            flex-shrink: 0;
        `;
        titleDiv.appendChild(iconSpan);
    }
    // Добавляем текст названия
    const titleText = document.createTextNode(levelName);
    titleDiv.appendChild(titleText);
    
    // Строка с прогресс-баром и уровнем
    const progressRow = document.createElement('div');
    progressRow.className = 'badge-progress-row';
    
    // Прогресс-бар
    const progressDiv = document.createElement('div');
    progressDiv.className = 'badge-progress';
    progressDiv.setAttribute('aria-label', 'Прогресс');
    
    const progressFill = document.createElement('div');
    progressFill.className = 'badge-progress-fill';
    progressFill.style.setProperty('--progress', `${progress}%`);
    
    progressDiv.appendChild(progressFill);
    
    // Текст уровня
    const levelDiv = document.createElement('div');
    levelDiv.className = 'badge-level';
    levelDiv.textContent = currentLevel > 0 ? `Ур. ${currentLevel}` : 'Ур. 0';
    
    progressRow.appendChild(progressDiv);
    progressRow.appendChild(levelDiv);
    
    // Собираем кнопку
    button.appendChild(titleDiv);
    button.appendChild(progressRow);
    
    return button;
}

// Рендеринг всех кнопок мастерства
export async function renderMasteryButtons() {
    const container = $('#masteryButtonsContainer');
    if (!container) {
        console.error('Контейнер для кнопок мастерства не найден');
        return;
    }
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Загружаем конфиг
    const config = await loadMasteryConfig();
    if (!config) {
        console.error('Не удалось загрузить конфиг мастерства');
        container.innerHTML = '<div class="hint muted">Ошибка загрузки данных мастерства</div>';
        return;
    }
    
    // Загружаем уровни пользователя
    let levels;
    try {
        levels = await fetchMastery();
    } catch (error) {
        console.error('Ошибка получения уровней мастерства:', error);
        levels = { solo: 0, hellmode: 0, raid: 0, speedrun: 0 };
    }
    
    // Порядок категорий для отображения
    const categoryOrder = ['solo', 'hellmode', 'raid', 'speedrun'];
    
    // Создаём кнопки для каждой категории
    for (const key of categoryOrder) {
        const category = getCategoryByKey(config, key);
        if (!category) {
            console.warn(`Категория ${key} не найдена в конфиге`);
            continue;
        }
        
        const currentLevel = levels[key] || 0;
        const button = createBadgeButton(category, currentLevel);
        container.appendChild(button);
    }
}

// Инициализация модуля
export function initMastery() {
    // Модуль инициализируется при открытии экрана мастерства
    // Рендеринг вызывается через renderMasteryButtons()
}

