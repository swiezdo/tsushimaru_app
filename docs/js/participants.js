// participants.js
import { tg, $, hapticTapSmart, hapticOK } from './telegram.js';
import { showScreen } from './ui.js';
import { fetchParticipants, API_BASE } from './api.js';
import { openParticipantDetail } from './participantDetail.js';
import { pushNavigation } from './navigation.js';
import { getTrophyIconPath, getDynamicAssetPath, getStaticAssetPath, getSystemIconPath } from './utils.js';
import { PLATFORM, MODES, GOALS, DIFFICULTY } from './profile.js';

// Элементы интерфейса
const participantsListEl = $('participantsList');
const noParticipantsHintEl = $('noParticipantsHint');
const participantSearchEl = $('participantSearch');
const participantsFilterTabsContainer = $('participantsFilterTabsContainer');

// Элементы модального окна фильтров
const filterModal = $('filterModal');
const filterModalTitle = $('filterModalTitle');
const filterModalOptions = $('filterModalOptions');
const filterModalOkBtn = $('filterModalOkBtn');

let ALL_PARTICIPANTS = [];

// Состояние фильтров
let selectedPlatforms = [];
let selectedModes = [];
let selectedGoals = [];
let selectedDifficulties = [];

async function loadParticipants() {
    try {
        ALL_PARTICIPANTS = await fetchParticipants();
        // Отладочный вывод (можно убрать после проверки)
        if (ALL_PARTICIPANTS.length > 0) {
            console.log('Загружено участников:', ALL_PARTICIPANTS.length);
            console.log('Пример данных участника:', {
                psn_id: ALL_PARTICIPANTS[0].psn_id,
                platforms: ALL_PARTICIPANTS[0].platforms,
                modes: ALL_PARTICIPANTS[0].modes,
                goals: ALL_PARTICIPANTS[0].goals,
                difficulties: ALL_PARTICIPANTS[0].difficulties
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки участников:', error);
        ALL_PARTICIPANTS = [];
    }
}

// Компаратор приоритезированной сортировки участников
function compareParticipants(a, b) {
    // Вспомогательные признаки с учетом возможных полей бэкенда
    const hasAnyTrophyA = Boolean(a?.has_any_trophy) || (Array.isArray(a?.trophies) && a.trophies.length > 0) || (Array.isArray(a?.active_trophies) && a.active_trophies.length > 0);
    const hasAnyTrophyB = Boolean(b?.has_any_trophy) || (Array.isArray(b?.trophies) && b.trophies.length > 0) || (Array.isArray(b?.active_trophies) && b.active_trophies.length > 0);
    
    // ВЫСШИЙ ПРИОРИТЕТ: количество активных значков (по убыванию)
    const activeCountA = typeof a?.active_trophies_count === 'number'
        ? a.active_trophies_count
        : (Array.isArray(a?.active_trophies) ? a.active_trophies.length : 0);
    const activeCountB = typeof b?.active_trophies_count === 'number'
        ? b.active_trophies_count
        : (Array.isArray(b?.active_trophies) ? b.active_trophies.length : 0);
    if (activeCountA !== activeCountB) {
        return activeCountB - activeCountA; // больше значков — выше
    }
    
    const hasMasteryA = Boolean(a?.has_mastery_progress);
    const hasMasteryB = Boolean(b?.has_mastery_progress);
    
    // П1: Значки/трофеи/мастерство (любые трофеи или любой прогресс мастерства)
    const p1A = hasAnyTrophyA || hasMasteryA;
    const p1B = hasAnyTrophyB || hasMasteryB;
    if (p1A !== p1B) return p1A ? -1 : 1;
    
    // П2: Наличие аватарки
    const p2A = Boolean(a?.avatar_url);
    const p2B = Boolean(b?.avatar_url);
    if (p2A !== p2B) return p2A ? -1 : 1;
    
    // П3 в исходном требовании (хотя перекрыт П1): хотя бы первый уровень мастерства
    // Оставляем на случай, если бэкенд решит разделить признаки
    if (hasMasteryA !== hasMasteryB) return hasMasteryA ? -1 : 1;
    
    // П4: Есть хотя бы один билд (публичный)
    const hasBuildsA = Boolean(a?.has_public_builds) || (typeof a?.builds_count === 'number' && a.builds_count > 0);
    const hasBuildsB = Boolean(b?.has_public_builds) || (typeof b?.builds_count === 'number' && b.builds_count > 0);
    if (hasBuildsA !== hasBuildsB) return hasBuildsA ? -1 : 1;
    
    // Внутри групп — по имени (psn_id) A→Я
    const nameA = (a?.psn_id || '').toLowerCase();
    const nameB = (b?.psn_id || '').toLowerCase();
    return nameA.localeCompare(nameB);
}

function renderParticipants(participants = ALL_PARTICIPANTS) {
    if (!participantsListEl) return;
    
    participantsListEl.innerHTML = '';
    
    if (participants.length === 0) {
        noParticipantsHintEl?.classList.remove('hidden');
        return;
    }
    
    noParticipantsHintEl?.classList.add('hidden');
    
    // Применяем приоритезированную сортировку
    const sorted = participants.slice().sort(compareParticipants);
    
    sorted.forEach(user => {
        const btn = document.createElement('button');
        btn.className = 'list-btn';
        btn.type = 'button';
        btn.dataset.userId = user.user_id;
        
        // Определяем источник аватарки с timestamp для предотвращения кеширования
        const avatarSrc = user.avatar_url 
            ? getDynamicAssetPath(`${API_BASE}${user.avatar_url}`)
            : getStaticAssetPath('./assets/default-avatar.svg');
        
        // Создаем иконки активных трофеев
        let trophyIconsHtml = '';
        const activeTrophies = user.active_trophies || [];
        if (activeTrophies.length > 0) {
            // Сортируем трофеи по алфавиту (они уже должны быть отсортированы с сервера, но на всякий случай)
            const sortedTrophies = [...activeTrophies].sort();
            const icons = sortedTrophies
                .map(trophyKey => {
                    const iconPath = getTrophyIconPath(trophyKey);
                    return `<img src="${iconPath}" alt="${trophyKey}" class="mastery-icon" loading="lazy" />`;
                })
                .join('');
            trophyIconsHtml = `<div class="mastery-icons">${icons}</div>`;
        }
        
        // Создаем структуру с аватаркой
        btn.innerHTML = `
            <div class="list-btn-avatar">
                <img src="${avatarSrc}" alt="" />
            </div>
            <div class="list-btn-content">
                <div class="list-btn-info">
                    <span class="list-btn-name">${user.psn_id || '—'}</span>
                    ${trophyIconsHtml}
                </div>
                <span class="right">›</span>
            </div>
        `;
        
        // Добавляем обработчик клика
        btn.addEventListener('click', () => {
            hapticTapSmart();
            const userId = btn.dataset.userId;
            if (userId) {
                pushNavigation('participantDetail', { userId: parseInt(userId) });
                openParticipantDetail(parseInt(userId));
            }
        });
        
        participantsListEl.appendChild(btn);
    });
}

// Функция фильтрации участников по текстовому запросу и тегам
function filterParticipants(searchQuery = '') {
    let filtered = ALL_PARTICIPANTS;
    
    // Применяем текстовый поиск
    if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(user => {
            const psnId = (user.psn_id || '').toLowerCase();
            return psnId.startsWith(query);
        });
    }
    
    // Применяем фильтры по тегам (AND между категориями, OR внутри категории)
    filtered = filtered.filter(user => {
        // Платформа
        if (selectedPlatforms.length > 0) {
            const userPlatforms = Array.isArray(user.platforms) ? user.platforms : [];
            if (userPlatforms.length === 0) return false; // Если у пользователя нет платформ, а мы ищем - исключаем
            const platformMatch = selectedPlatforms.some(platform => 
                userPlatforms.includes(platform)
            );
            if (!platformMatch) return false;
        }
        
        // Режимы
        if (selectedModes.length > 0) {
            const userModes = Array.isArray(user.modes) ? user.modes : [];
            if (userModes.length === 0) return false; // Если у пользователя нет режимов, а мы ищем - исключаем
            const modesMatch = selectedModes.some(mode => 
                userModes.includes(mode)
            );
            if (!modesMatch) return false;
        }
        
        // Цели
        if (selectedGoals.length > 0) {
            const userGoals = Array.isArray(user.goals) ? user.goals : [];
            if (userGoals.length === 0) return false; // Если у пользователя нет целей, а мы ищем - исключаем
            const goalsMatch = selectedGoals.some(goal => 
                userGoals.includes(goal)
            );
            if (!goalsMatch) return false;
        }
        
        // Сложность
        if (selectedDifficulties.length > 0) {
            const userDifficulties = Array.isArray(user.difficulties) ? user.difficulties : [];
            if (userDifficulties.length === 0) return false; // Если у пользователя нет сложностей, а мы ищем - исключаем
            const difficultiesMatch = selectedDifficulties.some(difficulty => 
                userDifficulties.includes(difficulty)
            );
            if (!difficultiesMatch) return false;
        }
        
        return true;
    });
    
    // Отладочный вывод (можно убрать после проверки)
    if (selectedPlatforms.length > 0 || selectedModes.length > 0 || selectedGoals.length > 0 || selectedDifficulties.length > 0) {
        console.log('Фильтры:', {
            platforms: selectedPlatforms,
            modes: selectedModes,
            goals: selectedGoals,
            difficulties: selectedDifficulties
        });
        console.log('Найдено участников:', filtered.length);
        if (filtered.length > 0) {
            console.log('Пример участника:', {
                psn_id: filtered[0].psn_id,
                platforms: filtered[0].platforms,
                modes: filtered[0].modes,
                goals: filtered[0].goals,
                difficulties: filtered[0].difficulties
            });
        }
    }
    
    renderParticipants(filtered);
}

// Функция обновления состояния кнопки фильтра
function updateFilterButton() {
    if (!participantsFilterTabsContainer) return;
    
    const hasActiveFilters = selectedPlatforms.length > 0 || 
                            selectedModes.length > 0 || 
                            selectedGoals.length > 0 || 
                            selectedDifficulties.length > 0;
    
    const filterTab = participantsFilterTabsContainer.querySelector('.class-tab');
    if (filterTab) {
        filterTab.classList.toggle('active', hasActiveFilters);
    }
}

// Функция открытия модального окна фильтров
function openParticipantsFilterModal() {
    if (!filterModal || !filterModalTitle || !filterModalOptions) return;
    
    filterModalTitle.textContent = 'Фильтры';
    renderFilterModalCategories();
    filterModal.classList.remove('hidden');
}

// Функция рендеринга всех категорий в модальном окне
function renderFilterModalCategories() {
    if (!filterModalOptions) return;
    
    filterModalOptions.innerHTML = '';
    
    // Платформа
    const platformSection = createFilterCategorySection('Платформа:', PLATFORM, selectedPlatforms, 'platform');
    filterModalOptions.appendChild(platformSection);
    
    // Режимы
    const modesSection = createFilterCategorySection('Режимы:', MODES, selectedModes, 'modes');
    filterModalOptions.appendChild(modesSection);
    
    // Цели
    const goalsSection = createFilterCategorySection('Цели:', GOALS, selectedGoals, 'goals');
    filterModalOptions.appendChild(goalsSection);
    
    // Сложность
    const difficultySection = createFilterCategorySection('Сложность:', DIFFICULTY, selectedDifficulties, 'difficulty');
    filterModalOptions.appendChild(difficultySection);
}

// Функция создания секции категории фильтров
function createFilterCategorySection(title, values, selectedValues, categoryType) {
    const section = document.createElement('div');
    section.className = 'filter-category-section';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'filter-category-title';
    titleEl.textContent = title;
    section.appendChild(titleEl);
    
    values.forEach(value => {
        const label = document.createElement('label');
        label.className = 'filter-option';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = value;
        checkbox.checked = selectedValues.includes(value);
        
        const span = document.createElement('span');
        span.textContent = value;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        
        checkbox.addEventListener('change', (e) => {
            hapticTapSmart();
            updateFilterSelection(categoryType, e.target.value, e.target.checked);
        });
        
        section.appendChild(label);
    });
    
    return section;
}

// Функция обновления выбора фильтров
function updateFilterSelection(categoryType, value, checked) {
    if (categoryType === 'platform') {
        if (checked) {
            if (!selectedPlatforms.includes(value)) {
                selectedPlatforms.push(value);
            }
        } else {
            selectedPlatforms = selectedPlatforms.filter(v => v !== value);
        }
    } else if (categoryType === 'modes') {
        if (checked) {
            if (!selectedModes.includes(value)) {
                selectedModes.push(value);
            }
        } else {
            selectedModes = selectedModes.filter(v => v !== value);
        }
    } else if (categoryType === 'goals') {
        if (checked) {
            if (!selectedGoals.includes(value)) {
                selectedGoals.push(value);
            }
        } else {
            selectedGoals = selectedGoals.filter(v => v !== value);
        }
    } else if (categoryType === 'difficulty') {
        if (checked) {
            if (!selectedDifficulties.includes(value)) {
                selectedDifficulties.push(value);
            }
        } else {
            selectedDifficulties = selectedDifficulties.filter(v => v !== value);
        }
    }
    
    updateFilterButton();
    // Обновляем модальное окно, чтобы отразить изменения
    renderFilterModalCategories();
}

// Функция закрытия модального окна фильтров
function closeParticipantsFilterModal() {
    if (filterModal) {
        filterModal.classList.add('hidden');
    }
}

// Функция создания кнопки фильтра
function createFilterButton() {
    if (!participantsFilterTabsContainer) return;
    
    participantsFilterTabsContainer.innerHTML = '';
    
    const filterTab = document.createElement('button');
    filterTab.type = 'button';
    filterTab.className = 'class-tab';
    filterTab.dataset.type = 'filter';
    
    const filterIcon = document.createElement('img');
    filterIcon.src = getSystemIconPath('tag.svg');
    filterIcon.alt = 'Фильтры';
    filterTab.appendChild(filterIcon);
    
    filterTab.addEventListener('click', () => {
        hapticTapSmart();
        openParticipantsFilterModal();
    });
    
    participantsFilterTabsContainer.appendChild(filterTab);
    updateFilterButton();
}

export async function initParticipants() {
    // Загружаем данные
    await loadParticipants();
    
    // Добавляем иконку в заголовок "Поиск"
    const searchCard = document.querySelector('#participantsScreen .card:first-child');
    if (searchCard) {
        const searchTitle = searchCard.querySelector('.card-title');
        if (searchTitle && !searchTitle.querySelector('.card-title-icon')) {
            const icon = document.createElement('img');
            icon.src = getSystemIconPath('search.webp');
            icon.alt = '';
            icon.className = 'card-title-icon';
            searchTitle.appendChild(icon);
        }
    }
    
    // Создаем кнопку фильтра
    createFilterButton();
    
    // Рендерим интерфейс
    renderParticipants();
    
    // Обработчик поиска
    if (participantSearchEl) {
        participantSearchEl.addEventListener('input', (e) => {
            const searchQuery = e.target.value;
            filterParticipants(searchQuery);
        });
        participantSearchEl.addEventListener('focus', () => {
            hapticTapSmart();
        }, { passive: true });
    }
    
    // Обработчик кнопки ОК в модальном окне фильтров
    // Используем проверку заголовка, чтобы не конфликтовать с builds.js
    if (filterModalOkBtn) {
        // Удаляем старый обработчик, если он есть
        if (filterModalOkBtn._participantsFilterHandler) {
            filterModalOkBtn.removeEventListener('click', filterModalOkBtn._participantsFilterHandler);
        }
        
        // Создаем новый обработчик
        filterModalOkBtn._participantsFilterHandler = () => {
            // Проверяем, что это модальное окно фильтров участников
            if (filterModalTitle?.textContent === 'Фильтры') {
                hapticOK();
                closeParticipantsFilterModal();
                // Применяем фильтры после закрытия модального окна
                const searchQuery = participantSearchEl?.value || '';
                filterParticipants(searchQuery);
            }
        };
        
        filterModalOkBtn.addEventListener('click', filterModalOkBtn._participantsFilterHandler);
    }
    
    // Закрытие модального окна при клике на фон
    // Используем проверку заголовка, чтобы не конфликтовать с builds.js
    if (filterModal) {
        if (filterModal._participantsClickHandler) {
            filterModal.removeEventListener('click', filterModal._participantsClickHandler);
        }
        filterModal._participantsClickHandler = (e) => {
            if (e.target === filterModal && filterModalTitle?.textContent === 'Фильтры') {
                hapticTapSmart();
                closeParticipantsFilterModal();
            }
        };
        filterModal.addEventListener('click', filterModal._participantsClickHandler);
    }
}

// Функция для обновления списка участников (вызывается после сохранения профиля)
export async function refreshParticipantsList() {
    await loadParticipants();
    const searchQuery = participantSearchEl?.value || '';
    filterParticipants(searchQuery);
}

export function resetParticipantSearch() {
    if (participantSearchEl) {
        participantSearchEl.value = '';
    }
}
