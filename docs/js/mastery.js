// mastery.js
// Модуль для работы с системой мастерства

import { fetchMastery, submitMasteryApplication } from './api.js';
import { tg, hapticTapSmart, hapticOK, hapticERR, $ } from './telegram.js';
import { showScreen, setTopbar, focusAndScrollIntoView } from './ui.js';
import { shake, createFileKey, isImageFile } from './utils.js';

// Кэш конфига
let masteryConfig = null;

// Флаг: отрендерено ли уже мастерство за эту сессию
let masteryRendered = false;

// Lookup table для правил фонов по уровню
const MASTERY_LEVEL_RULES = {
    3: [
        { level: 2, bg: 'background.jpg' },
        { level: 3, bg: 'background.gif', icon: true }
    ],
    4: [
        { level: 2, bg: 'background.jpg' },
        { level: 3, bg: 'background.gif' },
        { level: 4, icon: true }
    ],
    5: [
        { level: 2, bg: 'background.jpg' },
        { level: 3, bg: 'background2.jpg' },
        { level: 4, bg: 'background.gif' },
        { level: 5, icon: true }
    ]
};

// Загрузка конфига из JSON с retry-логикой
async function loadMasteryConfig() {
    if (masteryConfig) return masteryConfig;
    
    const maxAttempts = 3;
    const retryDelay = 1000; // 1 секунда
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch('./mastery-config.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            masteryConfig = await response.json();
            console.log(`✅ Конфиг мастерства загружен с попытки ${attempt}`);
            return masteryConfig;
        } catch (error) {
            if (attempt === maxAttempts) {
                console.error(`❌ Не удалось загрузить конфиг мастерства после ${maxAttempts} попыток:`, error);
                return null;
            }
            console.warn(`⚠️ Попытка ${attempt}/${maxAttempts} не удалась, повтор через ${retryDelay}мс`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}

// Получение уровней с retry-логикой
async function fetchMasteryWithRetry() {
    const maxAttempts = 2;
    const retryDelay = 500; // 0.5 секунды
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const levels = await fetchMastery();
            if (attempt > 1) {
                console.log(`✅ Уровни мастерства получены с попытки ${attempt}`);
            }
            return levels;
        } catch (error) {
            if (attempt === maxAttempts) {
                console.error(`❌ Не удалось получить уровни мастерства после ${maxAttempts} попыток:`, error);
                return { solo: 0, hellmode: 0, raid: 0, speedrun: 0 };
            }
            console.warn(`⚠️ Попытка ${attempt}/${maxAttempts} не удалась, повтор через ${retryDelay}мс`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
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

// Создание SVG кругового прогресса
function createProgressCircle(category, currentLevel, progress) {
    const gradientId = `grad-${category.key}-${Math.random().toString(36).substr(2, 9)}`;
    
    // SVG контейнер
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('class', 'mastery-progress-svg');
    
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
    
    // Цифра уровня по центру
    const levelNumber = document.createElement('div');
    levelNumber.className = 'mastery-level-number';
    levelNumber.textContent = currentLevel.toString();
    return { container: svg, levelNumber };
}

// Создание иконки максимального уровня
function createMaxLevelIcon(categoryKey) {
    const icon = document.createElement('div');
    icon.className = 'mastery-icon';
    icon.style.backgroundImage = `url('./assets/mastery/${categoryKey}/icon.svg')`;
    return icon;
}

// Применение фоновых стилей к элементу
function applyBackgroundStyles(element, backgroundImage) {
    if (backgroundImage) {
        element.style.backgroundImage = backgroundImage;
        element.style.backgroundRepeat = 'no-repeat';
        element.style.backgroundPosition = 'center';
        element.style.backgroundSize = 'cover';
    }
}

// Определение стилей кнопки в зависимости от уровня
function getButtonStyles(category, currentLevel) {
    const maxLevels = category.maxLevels;
    const styles = {
        classes: ['badge-btn', `${category.key}-badge`],
        backgroundImage: null,
        showIcon: false
    };
    
    // Уровень 0: базовый стиль (без контура, без фона)
    if (currentLevel === 0) {
        return styles;
    }
    
    const rules = MASTERY_LEVEL_RULES[maxLevels] || [];
    for (const rule of rules) {
        if (currentLevel >= rule.level) {
            if (rule.bg) {
                styles.backgroundImage = `url('./assets/mastery/${category.key}/${rule.bg}')`;
            }
            if (rule.icon) {
                styles.showIcon = true;
            }
        }
    }
    
    return styles;
}

// Получение списка необходимых изображений для уровня
function getRequiredAssets(category, currentLevel) {
    if (currentLevel === 0) return [];
    
    const maxLevels = category.maxLevels;
    const assets = [];
    const rules = MASTERY_LEVEL_RULES[maxLevels] || [];
    const processedBgs = new Set();
    
    for (const rule of rules) {
        if (currentLevel >= rule.level) {
            if (rule.bg && !processedBgs.has(rule.bg)) {
                assets.push(rule.bg);
                processedBgs.add(rule.bg);
            }
            if (rule.icon) {
                assets.push('icon.svg');
            }
        }
    }
    
    return assets;
}

// Предзагрузка изображений для достигнутых уровней
async function preloadMasteryAssets(config, levels) {
    if (!config || !config.categories || !levels) return;
    
    const preloadPromises = [];
    
    for (const category of config.categories) {
        const currentLevel = levels[category.key] || 0;
        if (currentLevel === 0) continue;
        
        const assets = getRequiredAssets(category, currentLevel);
        
        for (const asset of assets) {
            const img = new Image();
            const promise = new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = `./assets/mastery/${category.key}/${asset}`;
            });
            preloadPromises.push(promise);
        }
    }
    
    // Запускаем все предзагрузки параллельно
    try {
        await Promise.all(preloadPromises);
        console.log('✅ Предзагрузка изображений завершена');
    } catch (error) {
        // Игнорируем ошибки - если изображение не найдено, это не критично
        console.warn('⚠️ Некоторые изображения не удалось предзагрузить:', error);
    }
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
    
    // Применяем фоновое изображение
    applyBackgroundStyles(button, styles.backgroundImage);
    
    // Левая часть - тексты
    const textContainer = document.createElement('div');
    textContainer.className = 'mastery-text-container';
    
    // Название категории
    const categoryName = document.createElement('div');
    categoryName.className = 'mastery-category-name';
    categoryName.textContent = category.name;
    textContainer.appendChild(categoryName);
    
    // Название уровня (если level > 0)
    if (currentLevel > 0 && levelData) {
        const levelName = document.createElement('div');
        levelName.className = 'mastery-level-name';
        levelName.textContent = levelData.name;
        textContainer.appendChild(levelName);
    }
    
    button.appendChild(textContainer);
    
    // Правая часть - круговой прогресс или иконка
    const progressContainer = document.createElement('div');
    progressContainer.className = 'mastery-progress-container';
    
    if (isMaxLevel) {
        // Максимальный уровень - иконка
        const icon = createMaxLevelIcon(category.key);
        progressContainer.appendChild(icon);
    } else {
        // Круговой прогресс + цифра
        const { container: svg, levelNumber } = createProgressCircle(category, currentLevel, progress);
        progressContainer.appendChild(svg);
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
    // Если уже отрендерено - ничего не делаем
    if (masteryRendered) {
        console.log('⚡ Мастерство уже отрендерено, пропускаем');
        return;
    }
    
    console.log('🎯 Первый рендеринг мастерства');
    
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
    
    // Очищаем контейнер только перед первым рендером
    container.innerHTML = '';
    
    // Загружаем данные (из кэша если уже загружены)
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
    const levels = await fetchMasteryWithRetry();
    console.log('✅ Уровни получены:', levels);
    
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
    
    // Помечаем как отрендеренное
    masteryRendered = true;
    console.log(`✅ Рендеринг мастерства завершён (один раз за сессию). Создано кнопок: ${buttonsCreated}`);
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
    const levels = await fetchMasteryWithRetry();
    const currentLevel = levels[categoryKey] || 0;
    
    // Предзагружаем изображения для этой категории (на случай если они еще не были загружены)
    const categoryLevels = { [categoryKey]: currentLevel };
    await preloadMasteryAssets(config, categoryLevels);
    
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
    headerCard.className = 'card mastery-header-card';
    
    // Применяем фоновое изображение
    applyBackgroundStyles(headerCard, styles.backgroundImage);
    
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
    titleContainer.className = 'card-title reward-detail-header mastery-level-name';
    titleContainer.textContent = headerTitleText;
    headerCard.appendChild(titleContainer);
    
    // Правая часть - круговой прогресс или иконка
    const progressContainer = document.createElement('div');
    progressContainer.className = 'mastery-progress-container';
    
    const isMaxLevel = currentLevel === maxLevels && styles.showIcon;
    
    if (isMaxLevel) {
        // Максимальный уровень - иконка
        const icon = createMaxLevelIcon(category.key);
        progressContainer.appendChild(icon);
    } else {
        // Круговой прогресс + цифра
        const { container: svg, levelNumber } = createProgressCircle(category, currentLevel, progress);
        progressContainer.appendChild(svg);
        progressContainer.appendChild(levelNumber);
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
    
    // Карточка заявки на повышение уровня (только если не максимальный уровень)
    if (currentLevel < maxLevels) {
        renderMasteryApplicationCard(container, category, currentLevel);
    }
}

// Константы для формы заявки
const MAX_MASTERY_FILES = 9;
let masteryApplicationSelected = [];
let masteryApplicationObjectURLs = new Set();

// Рендеринг карточки заявки на повышение уровня
function renderMasteryApplicationCard(container, category, currentLevel) {
    // Очищаем предыдущие данные
    masteryApplicationSelected = [];
    masteryApplicationObjectURLs.forEach(url => URL.revokeObjectURL(url));
    masteryApplicationObjectURLs.clear();
    
    // Создаём карточку
    const applicationCard = document.createElement('section');
    applicationCard.className = 'card';
    applicationCard.id = 'masteryApplicationCard';
    
    // Заголовок
    const title = document.createElement('h2');
    title.className = 'card-title';
    title.textContent = 'Отправить заявку';
    applicationCard.appendChild(title);
    
    // Форма
    const form = document.createElement('form');
    form.className = 'form';
    form.id = 'masteryApplicationForm';
    
    // Поле комментария (необязательно)
    const commentContainer = document.createElement('div');
    commentContainer.className = 'input';
    
    const commentLabel = document.createElement('label');
    commentLabel.setAttribute('for', 'masteryApplicationComment');
    commentLabel.textContent = 'Комментарии (необязательно)';
    commentContainer.appendChild(commentLabel);
    
    const commentTextarea = document.createElement('textarea');
    commentTextarea.id = 'masteryApplicationComment';
    commentTextarea.rows = 1;
    commentTextarea.placeholder = 'Дополнительная информация';
    
    // Автоматическое изменение размера textarea
    const autoResize = () => {
        commentTextarea.style.height = 'auto';
        commentTextarea.style.height = Math.min(commentTextarea.scrollHeight, 200) + 'px';
    };
    commentTextarea.addEventListener('input', autoResize);
    commentTextarea.addEventListener('focus', () => { hapticTapSmart(); }, {passive: true});
    
    commentContainer.appendChild(commentTextarea);
    form.appendChild(commentContainer);
    
    // Поле для файлов (обязательное)
    const filesContainer = document.createElement('div');
    filesContainer.className = 'input';
    
    const filesLabel = document.createElement('label');
    filesLabel.setAttribute('for', 'masteryApplicationFiles');
    filesLabel.textContent = 'Прикрепите файлы';
    filesContainer.appendChild(filesLabel);
    
    const filesInput = document.createElement('input');
    filesInput.id = 'masteryApplicationFiles';
    filesInput.type = 'file';
    filesInput.multiple = true;
    filesInput.accept = 'image/*';
    filesInput.style.display = 'none';
    
    const addFilesBtn = document.createElement('button');
    addFilesBtn.type = 'button';
    addFilesBtn.className = 'fileline-btn';
    addFilesBtn.setAttribute('aria-label', 'Прикрепить файлы');
    addFilesBtn.textContent = '＋ Прикрепить';
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'thumbs-row';
    previewContainer.id = 'masteryApplicationPreview';
    
    filesContainer.appendChild(filesInput);
    filesContainer.appendChild(addFilesBtn);
    filesContainer.appendChild(previewContainer);
    form.appendChild(filesContainer);
    
    applicationCard.appendChild(form);
    
    // Кнопка отправки
    const actionsBar = document.createElement('div');
    actionsBar.className = 'actions-bar';
    
    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'btn primary wide';
    submitBtn.id = 'masteryApplicationSubmitBtn';
    submitBtn.textContent = 'Отправить';
    
    actionsBar.appendChild(submitBtn);
    applicationCard.appendChild(actionsBar);
    
    container.appendChild(applicationCard);
    
    // Обработчики событий
    addFilesBtn.addEventListener('click', () => {
        hapticTapSmart();
        try { filesInput.value = ''; } catch {}
        filesInput.click();
    });
    
    filesInput.addEventListener('change', () => {
        const files = Array.from(filesInput.files || []);
        if (!files.length) {
            shake(previewContainer || addFilesBtn);
            focusAndScrollIntoView(addFilesBtn || previewContainer);
            return;
        }
        
        // Фильтруем только изображения
        const imageFiles = files.filter(file => isImageFile(file));
        
        if (imageFiles.length !== files.length) {
            tg?.showPopup?.({
                title: 'Неподдерживаемый формат',
                message: 'Разрешены только изображения.',
                buttons: [{ type: 'ok' }]
            });
        }
        
        const keyOf = (f) => createFileKey(f);
        const existing = new Set(masteryApplicationSelected.map(keyOf));
        const freeSlots = Math.max(0, MAX_MASTERY_FILES - masteryApplicationSelected.length);
        const incoming = imageFiles.filter(f => !existing.has(keyOf));
        
        if (incoming.length > freeSlots) {
            incoming.length = freeSlots;
            tg?.showPopup?.({
                title: 'Лимит файлов',
                message: `Можно прикрепить не более ${MAX_MASTERY_FILES} изображений.`,
                buttons: [{ type: 'ok' }]
            });
        }
        
        incoming.forEach(f => masteryApplicationSelected.push(f));
        renderMasteryApplicationPreview();
    });
    
    submitBtn.addEventListener('pointerdown', () => { hapticTapSmart(); });
    submitBtn.addEventListener('click', (e) => {
        e.preventDefault?.();
        submitMasteryApplicationForm(category, currentLevel, commentTextarea, submitBtn);
    });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitMasteryApplicationForm(category, currentLevel, commentTextarea, submitBtn);
    });
}

// Рендеринг превью загруженных файлов
function renderMasteryApplicationPreview() {
    const previewEl = $('masteryApplicationPreview');
    if (!previewEl) return;
    
    // Очищаем старые objectURL
    masteryApplicationObjectURLs.forEach(url => URL.revokeObjectURL(url));
    masteryApplicationObjectURLs.clear();
    
    previewEl.innerHTML = '';
    const limit = 4;
    const toShow = masteryApplicationSelected.slice(0, limit);
    
    toShow.forEach((file, idx) => {
        const tile = document.createElement('div');
        tile.className = 'preview-item removable';
        tile.title = 'Нажмите, чтобы удалить';
        
        if (isImageFile(file)) {
            const img = document.createElement('img');
            const objectURL = URL.createObjectURL(file);
            masteryApplicationObjectURLs.add(objectURL);
            img.src = objectURL;
            tile.appendChild(img);
        } else {
            tile.textContent = '📄';
        }
        
        tile.addEventListener('click', () => {
            masteryApplicationSelected.splice(idx, 1);
            hapticTapSmart();
            renderMasteryApplicationPreview();
        });
        
        previewEl.appendChild(tile);
    });
    
    if (masteryApplicationSelected.length > limit) {
        const more = document.createElement('div');
        more.className = 'preview-more';
        more.textContent = `+${masteryApplicationSelected.length - limit}`;
        previewEl.appendChild(more);
    }
}

// Отправка формы заявки
let submittingApplication = false;
async function submitMasteryApplicationForm(category, currentLevel, commentTextarea, submitBtn) {
    if (submittingApplication) return;
    submittingApplication = true;
    
    const originalText = submitBtn?.textContent || 'Отправить';
    
    // Блокируем кнопку и меняем текст
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('success');
        submitBtn.textContent = 'Подождите...';
    }
    
    const comment = (commentTextarea?.value || '').trim();
    const filesCount = masteryApplicationSelected.length;
    const nextLevel = currentLevel + 1;
    
    // Валидация: минимум 1 файл обязателен
    if (filesCount === 0) {
        const previewEl = $('masteryApplicationPreview');
        shake(previewEl || submitBtn);
        focusAndScrollIntoView(previewEl || submitBtn);
        hapticERR();
        tg?.showPopup?.({ 
            title: 'Ошибка', 
            message: 'Необходимо прикрепить хотя бы одно изображение.', 
            buttons: [{ type: 'ok' }] 
        });
        
        // Восстанавливаем кнопку
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('success');
            submitBtn.textContent = originalText;
        }
        submittingApplication = false;
        return;
    }
    
    try {
        hapticOK();
        
        await submitMasteryApplication(category.key, currentLevel, nextLevel, comment, masteryApplicationSelected);
        
        tg?.showPopup?.({ 
            title: 'Заявка отправлена', 
            message: 'Спасибо, модераторы рассмотрят вашу заявку.', 
            buttons: [{ type: 'ok' }] 
        });
        
        // Очищаем форму
        masteryApplicationSelected = [];
        masteryApplicationObjectURLs.forEach(url => URL.revokeObjectURL(url));
        masteryApplicationObjectURLs.clear();
        if (commentTextarea) {
            commentTextarea.value = '';
            commentTextarea.style.height = 'auto';
        }
        const previewEl = $('masteryApplicationPreview');
        if (previewEl) previewEl.innerHTML = '';
        const filesInput = $('masteryApplicationFiles');
        if (filesInput) filesInput.value = '';
        
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        hapticERR();
        tg?.showPopup?.({ 
            title: 'Ошибка', 
            message: error.message || 'Произошла ошибка при отправке заявки.', 
            buttons: [{ type: 'ok' }] 
        });
    } finally {
        // Восстанавливаем кнопку
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('success');
            submitBtn.textContent = originalText;
        }
        submittingApplication = false;
    }
}

// Предзагрузка данных без рендеринга (вызывается при старте приложения)
async function preloadMasteryData() {
    console.log('🎯 Предзагрузка данных мастерства...');
    
    // Загружаем конфиг
    const config = await loadMasteryConfig();
    if (!config) {
        console.error('❌ Не удалось загрузить конфиг мастерства');
        return;
    }
    
    // Загружаем уровни пользователя
    const levels = await fetchMasteryWithRetry();
    
    // Предзагружаем изображения
    await preloadMasteryAssets(config, levels);
    
    console.log('✅ Данные мастерства предзагружены');
}

// Инициализация модуля (вызывается при старте приложения)
export function initMastery() {
    // Запускаем предзагрузку данных в фоне
    preloadMasteryData();
}

