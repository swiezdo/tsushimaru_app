// mastery.js
// Модуль для работы с системой мастерства

import { fetchMastery } from './api.js';
import { hapticTapSmart } from './telegram.js';
import { showScreen, setTopbar } from './ui.js';

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
    const maxLevels = category.maxLevels;
    const progress = calculateProgress(currentLevel, maxLevels);
    const styles = getButtonStyles(category, currentLevel);
    const levelData = getLevelByNumber(category, currentLevel);
    const isMaxLevel = currentLevel === maxLevels && styles.showIcon;
    
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
    
    // Левая часть - тексты
    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-1);
        flex: 1;
        z-index: 2;
        position: relative;
    `;
    
    // Первая строка - название категории
    const categoryName = document.createElement('div');
    categoryName.className = 'badge-category-name';
    categoryName.textContent = category.name;
    categoryName.style.cssText = `
        font-size: var(--fs-14);
        color: var(--tg-hint);
        font-weight: 500;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85), 0 0 6px rgba(0, 0, 0, 0.45);
    `;
    textContainer.appendChild(categoryName);
    
    // Вторая строка - название уровня (если level > 0)
    if (currentLevel > 0 && levelData) {
        const levelName = document.createElement('div');
        levelName.className = 'badge-level-name';
        levelName.textContent = levelData.name;
        levelName.style.cssText = `
            font-size: var(--fs-16);
            font-weight: 600;
            color: var(--tg-tx);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85), 0 0 8px rgba(0, 0, 0, 0.5);
        `;
        textContainer.appendChild(levelName);
    }
    
    button.appendChild(textContainer);
    
    // Правая часть - круговой прогресс
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
        position: relative;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        z-index: 2;
    `;
    
    if (isMaxLevel) {
        // Максимальный уровень - иконка
        const icon = document.createElement('div');
        icon.style.cssText = `
            width: 100%;
            height: 100%;
            background-image: url('./assets/mastery/${category.key}/icon.svg');
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            filter: drop-shadow(0 0 6px rgba(212, 175, 55, 0.6)) drop-shadow(0 0 10px rgba(212, 175, 55, 0.35));
            opacity: 0.95;
        `;
        progressContainer.appendChild(icon);
    } else {
        // Не максимальный уровень - круговой прогресс + цифра
        const gradientId = `grad-${category.key}-${Math.random().toString(36).substr(2, 9)}`;
        
        // SVG контейнер
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.style.cssText = `
            width: 100%;
            height: 100%;
        `;
        
        // Defs с градиентом
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', gradientId);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '0%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#ffffff');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#8b0000');
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        
        // Фоновый круг
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', '50');
        bgCircle.setAttribute('cy', '50');
        bgCircle.setAttribute('r', '45');
        bgCircle.setAttribute('fill', 'none');
        bgCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.15)');
        bgCircle.setAttribute('stroke-width', '5');
        
        // Прогресс круг
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (progress / 100) * circumference;
        
        const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        progressCircle.setAttribute('cx', '50');
        progressCircle.setAttribute('cy', '50');
        progressCircle.setAttribute('r', '45');
        progressCircle.setAttribute('fill', 'none');
        progressCircle.setAttribute('stroke', `url(#${gradientId})`);
        progressCircle.setAttribute('stroke-width', '5');
        progressCircle.setAttribute('stroke-linecap', 'round');
        progressCircle.setAttribute('stroke-dasharray', `${circumference} ${circumference}`);
        progressCircle.setAttribute('stroke-dashoffset', offset);
        progressCircle.setAttribute('transform', 'rotate(-90 50 50)');
        
        svg.appendChild(defs);
        svg.appendChild(bgCircle);
        svg.appendChild(progressCircle);
        progressContainer.appendChild(svg);
        
        // Цифра уровня по центру
        const levelNumber = document.createElement('div');
        levelNumber.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 14px;
            font-weight: 700;
            color: var(--tg-tx);
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9), 0 0 8px rgba(0, 0, 0, 0.5);
            pointer-events: none;
            line-height: 1;
        `;
        levelNumber.textContent = currentLevel.toString();
        progressContainer.appendChild(levelNumber);
    }
    
    button.appendChild(progressContainer);
    
    // Обработчик клика
    button.addEventListener('click', () => {
        hapticTapSmart();
        openMasteryDetail(category.key);
    });
    
    return button;
}

// Рендеринг всех кнопок мастерства
export async function renderMasteryButtons() {
    console.log('🎯 renderMasteryButtons вызван');
    
    // Пробуем найти контейнер разными способами
    let container = document.getElementById('masteryButtonsContainer');
    if (!container) {
        // Если не найден по ID, пробуем через селектор
        container = document.querySelector('#masteryButtonsContainer');
    }
    if (!container) {
        console.error('❌ Контейнер для кнопок мастерства не найден');
        console.log('Поиск всех элементов с id:', document.querySelectorAll('[id*="mastery"]'));
        return;
    }
    
    console.log('✅ Контейнер найден:', container);
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Загружаем конфиг
    console.log('📋 Загрузка конфига мастерства...');
    const config = await loadMasteryConfig();
    if (!config) {
        console.error('❌ Не удалось загрузить конфиг мастерства');
        container.innerHTML = '<div class="hint muted">Ошибка загрузки данных мастерства</div>';
        return;
    }
    console.log('✅ Конфиг загружен, категорий:', config.categories?.length);
    
    // Загружаем уровни пользователя
    console.log('📊 Загрузка уровней пользователя...');
    let levels;
    try {
        levels = await fetchMastery();
        console.log('✅ Уровни получены:', levels);
    } catch (error) {
        console.error('❌ Ошибка получения уровней мастерства:', error);
        levels = { solo: 0, hellmode: 0, raid: 0, speedrun: 0 };
    }
    
    // Порядок категорий для отображения
    const categoryOrder = ['solo', 'hellmode', 'raid', 'speedrun'];
    
    // Создаём кнопки для каждой категории
    let buttonsCreated = 0;
    for (const key of categoryOrder) {
        const category = getCategoryByKey(config, key);
        if (!category) {
            console.warn(`⚠️ Категория ${key} не найдена в конфиге`);
            continue;
        }
        
        const currentLevel = levels[key] || 0;
        console.log(`🔨 Создание кнопки для ${key}, уровень: ${currentLevel}`);
        const button = createBadgeButton(category, currentLevel);
        container.appendChild(button);
        buttonsCreated++;
    }
    
    console.log(`✅ Рендеринг завершён. Создано кнопок: ${buttonsCreated}`);
}

// Открытие детального экрана мастерства
export async function openMasteryDetail(categoryKey) {
    console.log('🎯 Открытие детального экрана для категории:', categoryKey);
    
    // Показываем экран сначала (чтобы топбар был виден)
    showScreen('rewardDetail');
    
    // Загружаем конфиг
    const config = await loadMasteryConfig();
    if (!config) {
        console.error('Не удалось загрузить конфиг мастерства');
        return;
    }
    
    // Находим категорию
    const category = getCategoryByKey(config, categoryKey);
    if (!category) {
        console.error(`Категория ${categoryKey} не найдена`);
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
    
    const currentLevel = levels[categoryKey] || 0;
    
    // Рендерим детальный экран (это обновит топбар)
    renderMasteryDetail(category, currentLevel);
}

// Рендеринг детального экрана мастерства
function renderMasteryDetail(category, currentLevel) {
    const container = document.getElementById('masteryDetailContainer');
    if (!container) {
        console.error('Контейнер для детального экрана не найден');
        return;
    }
    
    container.innerHTML = '';
    
    const maxLevels = category.maxLevels;
    const progress = calculateProgress(currentLevel, maxLevels);
    const styles = getButtonStyles(category, currentLevel);
    
    // Обновляем топбар с названием категории и уровнем
    setTopbar(true, `${category.name} — Ур. ${currentLevel} из ${maxLevels}`);
    
    // Заголовок с названием текущего уровня
    const headerCard = document.createElement('section');
    headerCard.className = 'card';
    headerCard.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
    `;
    
    // Применяем фоновое изображение если есть
    if (styles.backgroundImage) {
        headerCard.style.backgroundImage = styles.backgroundImage;
        headerCard.style.backgroundRepeat = 'no-repeat';
        headerCard.style.backgroundPosition = styles.backgroundPosition || 'center';
        headerCard.style.backgroundSize = styles.backgroundSize || '160% auto';
    }
    
    // Определяем название для заголовка карточки
    let headerTitleText;
    if (currentLevel > 0) {
        const levelData = getLevelByNumber(category, currentLevel);
        headerTitleText = levelData ? levelData.name : category.name;
    } else {
        headerTitleText = category.name;
    }
    
    // Левая часть - название
    const titleContainer = document.createElement('h2');
    titleContainer.className = 'card-title reward-detail-header';
    titleContainer.style.cssText = `
        margin: 0;
        flex: 1;
        z-index: 2;
        position: relative;
    `;
    titleContainer.textContent = headerTitleText;
    headerCard.appendChild(titleContainer);
    
    // Правая часть - круговой прогресс или иконка
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
        position: relative;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        z-index: 2;
    `;
    
    const isMaxLevel = currentLevel === maxLevels && styles.showIcon;
    
    if (isMaxLevel) {
        // Максимальный уровень - иконка
        const icon = document.createElement('div');
        icon.style.cssText = `
            width: 100%;
            height: 100%;
            background-image: url('./assets/mastery/${category.key}/icon.svg');
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            filter: drop-shadow(0 0 6px rgba(212, 175, 55, 0.6)) drop-shadow(0 0 10px rgba(212, 175, 55, 0.35));
            opacity: 0.95;
        `;
        progressContainer.appendChild(icon);
    } else {
        // Не максимальный уровень - круговой прогресс + цифра
        const gradientId = `grad-detail-${category.key}-${Math.random().toString(36).substr(2, 9)}`;
        
        // SVG контейнер
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.style.cssText = `
            width: 100%;
            height: 100%;
        `;
        
        // Defs с градиентом
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', gradientId);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '0%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#ffffff');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#8b0000');
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        
        // Фоновый круг
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', '50');
        bgCircle.setAttribute('cy', '50');
        bgCircle.setAttribute('r', '45');
        bgCircle.setAttribute('fill', 'none');
        bgCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.15)');
        bgCircle.setAttribute('stroke-width', '5');
        
        // Прогресс круг
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (progress / 100) * circumference;
        
        const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        progressCircle.setAttribute('cx', '50');
        progressCircle.setAttribute('cy', '50');
        progressCircle.setAttribute('r', '45');
        progressCircle.setAttribute('fill', 'none');
        progressCircle.setAttribute('stroke', `url(#${gradientId})`);
        progressCircle.setAttribute('stroke-width', '5');
        progressCircle.setAttribute('stroke-linecap', 'round');
        progressCircle.setAttribute('stroke-dasharray', `${circumference} ${circumference}`);
        progressCircle.setAttribute('stroke-dashoffset', offset);
        progressCircle.setAttribute('transform', 'rotate(-90 50 50)');
        
        svg.appendChild(defs);
        svg.appendChild(bgCircle);
        svg.appendChild(progressCircle);
        progressContainer.appendChild(svg);
        
        // Цифра уровня по центру (показываем только если уровень > 0)
        if (currentLevel > 0) {
            const levelNumber = document.createElement('div');
            levelNumber.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 14px;
                font-weight: 700;
                color: var(--tg-tx);
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9), 0 0 8px rgba(0, 0, 0, 0.5);
                pointer-events: none;
                line-height: 1;
            `;
            levelNumber.textContent = currentLevel.toString();
            progressContainer.appendChild(levelNumber);
        }
    }
    
    headerCard.appendChild(progressContainer);
    container.appendChild(headerCard);
    
    // Текущий уровень (если level > 0 и не максимальный)
    if (currentLevel > 0 && currentLevel < maxLevels) {
        const currentLevelData = getLevelByNumber(category, currentLevel);
        if (currentLevelData) {
            const currentCard = document.createElement('section');
            currentCard.className = 'card current-level';
            
            const currentTitle = document.createElement('h3');
            currentTitle.className = 'card-title';
            currentTitle.innerHTML = `✅ ${currentLevelData.name}`;
            currentCard.appendChild(currentTitle);
            
            const currentDesc = document.createElement('div');
            currentDesc.className = 'mastery-description';
            currentDesc.style.whiteSpace = 'pre-line';
            currentDesc.textContent = currentLevelData.description;
            currentCard.appendChild(currentDesc);
            
            container.appendChild(currentCard);
        }
    }
    
    // Следующий уровень или максимальный
    if (currentLevel < maxLevels) {
        const nextLevelNum = currentLevel + 1;
        const nextLevelData = getLevelByNumber(category, nextLevelNum);
        
        if (nextLevelData) {
            const nextCard = document.createElement('section');
            nextCard.className = 'card next-level';
            
            const nextTitle = document.createElement('h3');
            nextTitle.className = 'card-title';
            nextTitle.innerHTML = `➡️ Следующий уровень: ${nextLevelData.name}`;
            nextCard.appendChild(nextTitle);
            
            const nextDesc = document.createElement('div');
            nextDesc.className = 'mastery-description';
            nextDesc.style.whiteSpace = 'pre-line';
            nextDesc.textContent = nextLevelData.description;
            nextCard.appendChild(nextDesc);
            
            const nextProof = document.createElement('div');
            nextProof.className = 'mastery-proof';
            nextProof.style.marginTop = 'var(--space-3)';
            nextProof.style.paddingTop = 'var(--space-3)';
            nextProof.style.borderTop = '1px solid var(--color-border)';
            nextProof.style.fontSize = 'var(--fs-14)';
            nextProof.style.color = 'var(--tg-hint)';
            nextProof.textContent = `📸 ${nextLevelData.proof}`;
            nextCard.appendChild(nextProof);
            
            container.appendChild(nextCard);
        }
    } else {
        // Максимальный уровень достигнут
        const maxCard = document.createElement('section');
        maxCard.className = 'card max-level';
        
        const maxTitle = document.createElement('h3');
        maxTitle.className = 'card-title';
        maxTitle.innerHTML = '🎉 Вы достигли максимального уровня!';
        maxCard.appendChild(maxTitle);
        
        const maxLevelData = getLevelByNumber(category, maxLevels);
        if (maxLevelData) {
            const maxDesc = document.createElement('div');
            maxDesc.className = 'mastery-description';
            maxDesc.style.whiteSpace = 'pre-line';
            maxDesc.textContent = maxLevelData.description;
            maxCard.appendChild(maxDesc);
        }
        
        container.appendChild(maxCard);
    }
}

// Инициализация модуля
export function initMastery() {
    // Модуль инициализируется при открытии экрана мастерства
    // Рендеринг вызывается через renderMasteryButtons()
}

