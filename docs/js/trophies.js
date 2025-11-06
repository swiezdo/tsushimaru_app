// trophies.js
// Модуль для работы с трофеями

import { fetchTrophies, updateActiveTrophies } from './api.js';
import { tg, hapticTapSmart, hapticOK, hapticERR, $ } from './telegram.js';

// Кэш трофеев
let cachedTrophies = null;
let cachedActiveTrophies = [];

// Флаг: отрендерено ли уже коллекция за эту сессию
let trophiesRendered = false;

// Получение трофеев с кэшированием
async function fetchTrophiesWithCache(forceRefresh = false) {
    if (cachedTrophies !== null && !forceRefresh) {
        return {
            trophies: cachedTrophies,
            active_trophies: cachedActiveTrophies
        };
    }
    
    try {
        const data = await fetchTrophies();
        cachedTrophies = data.trophies || [];
        cachedActiveTrophies = data.active_trophies || [];
        return data;
    } catch (error) {
        console.error('Ошибка загрузки трофеев:', error);
        return {
            trophies: [],
            active_trophies: []
        };
    }
}

// Создание кнопки трофея
function createTrophyButton(trophyKey, isActive) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'trophy-button';
    button.dataset.trophyKey = trophyKey;
    
    if (isActive) {
        button.classList.add('active');
    }
    
    const icon = document.createElement('img');
    icon.className = 'trophy-icon';
    icon.src = `./assets/trophies/${trophyKey}.svg`;
    icon.alt = trophyKey;
    icon.loading = 'lazy';
    
    button.appendChild(icon);
    
    return button;
}

// Рендеринг коллекции трофеев
export async function renderTrophiesCollection() {
    // Пробуем найти контейнер
    const container = document.getElementById('trophiesCollectionContainer');
    if (!container) {
        return;
    }
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Загружаем трофеи (инвалидируем кэш если нужно обновить данные)
    const data = await fetchTrophiesWithCache();
    const trophies = data.trophies || [];
    const activeTrophies = data.active_trophies || [];
    
    if (trophies.length === 0) {
        // Если нет трофеев, показываем подсказку
        const hint = document.createElement('div');
        hint.className = 'hint muted';
        hint.textContent = 'У вас пока нет трофеев. Достигните максимального уровня в категории мастерства, чтобы получить трофей!';
        container.appendChild(hint);
        trophiesRendered = true;
        return;
    }
    
    // Создаем кнопки для каждого трофея
    trophies.forEach(trophyKey => {
        const isActive = activeTrophies.includes(trophyKey);
        const button = createTrophyButton(trophyKey, isActive);
        
        // Обработчик клика (используем замыкание для актуальных данных)
        button.addEventListener('click', async () => {
            // Обновляем данные из кэша перед обработкой клика
            const currentData = await fetchTrophiesWithCache();
            await handleTrophyClick(trophyKey, currentData.active_trophies || []);
        });
        
        container.appendChild(button);
    });
    
    // Добавляем подсказку о выборе до 8 значков
    const hint = document.createElement('div');
    hint.className = 'hint muted';
    hint.style.marginTop = 'var(--space-3)';
    hint.textContent = 'Вы можете выбрать до 8 значков для отображения под вашим ником на странице участников';
    container.appendChild(hint);
    
    trophiesRendered = true;
}

// Обработка клика на трофей
async function handleTrophyClick(trophyKey, currentActive) {
    hapticTapSmart();
    
    const isCurrentlyActive = currentActive.includes(trophyKey);
    let newActiveTrophies;
    
    if (isCurrentlyActive) {
        // Трофей уже выбран - снимаем выделение
        newActiveTrophies = currentActive.filter(t => t !== trophyKey);
    } else {
        // Трофей не выбран
        if (currentActive.length >= 8) {
            // Уже выбрано 8 трофеев - ничего не делаем (не показываем сообщение, просто игнорируем)
            return;
        }
        // Добавляем в активные
        newActiveTrophies = [...currentActive, trophyKey].sort(); // Сортируем по алфавиту
    }
    
    // Обновляем UI сразу (оптимистичное обновление)
    updateTrophiesUI(newActiveTrophies);
    
    // Отправляем запрос на сервер
    try {
        await updateActiveTrophies(newActiveTrophies);
        hapticOK();
        // Обновляем кэш после успешного обновления
        cachedActiveTrophies = newActiveTrophies;
    } catch (error) {
        console.error('Ошибка обновления активных трофеев:', error);
        hapticERR();
        
        // Откатываем изменения в UI
        updateTrophiesUI(currentActive);
        cachedActiveTrophies = currentActive;
        
        tg?.showPopup?.({
            title: 'Ошибка',
            message: 'Не удалось обновить активные трофеи. Попробуйте позже.',
            buttons: [{ type: 'ok' }]
        });
    }
}

// Обновление UI трофеев
function updateTrophiesUI(activeTrophies) {
    const container = document.getElementById('trophiesCollectionContainer');
    if (!container) return;
    
    const buttons = container.querySelectorAll('.trophy-button');
    buttons.forEach(button => {
        const trophyKey = button.dataset.trophyKey;
        if (activeTrophies.includes(trophyKey)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Очистка кэша (для обновления после получения нового трофея)
export function invalidateTrophiesCache() {
    cachedTrophies = null;
    cachedActiveTrophies = [];
    trophiesRendered = false;
}

// Инициализация модуля
export function initTrophies() {
    // Модуль готов к использованию
    console.log('Trophies модуль инициализирован');
}

