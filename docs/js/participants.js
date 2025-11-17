// participants.js
import { tg, $, hapticTapSmart } from './telegram.js';
import { showScreen } from './ui.js';
import { fetchParticipants, API_BASE } from './api.js';
import { openParticipantDetail } from './participantDetail.js';

// Элементы интерфейса
const participantsListEl = $('participantsList');
const noParticipantsHintEl = $('noParticipantsHint');
const participantSearchEl = $('participantSearch');

let ALL_PARTICIPANTS = [];

async function loadParticipants() {
    try {
        ALL_PARTICIPANTS = await fetchParticipants();
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
            ? `${API_BASE}${user.avatar_url}?t=${Date.now()}` 
            : './assets/default-avatar.svg';
        
        // Создаем иконки активных трофеев
        let trophyIconsHtml = '';
        const activeTrophies = user.active_trophies || [];
        if (activeTrophies.length > 0) {
            // Сортируем трофеи по алфавиту (они уже должны быть отсортированы с сервера, но на всякий случай)
            const sortedTrophies = [...activeTrophies].sort();
            const icons = sortedTrophies
                .map(trophyKey => `<img src="./assets/trophies/${trophyKey}.svg" alt="${trophyKey}" class="mastery-icon" />`)
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
                // Устанавливаем previousScreen перед открытием профиля участника
                // Это гарантирует, что при возврате назад мы вернемся на страницу участников
                sessionStorage.setItem('previousScreen', 'participants');
                openParticipantDetail(parseInt(userId));
            }
        });
        
        participantsListEl.appendChild(btn);
    });
}

function filterParticipants(searchQuery) {
    if (!searchQuery || searchQuery.trim() === '') {
        renderParticipants(ALL_PARTICIPANTS);
        return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = ALL_PARTICIPANTS.filter(user => {
        const psnId = (user.psn_id || '').toLowerCase();
        return psnId.startsWith(query);
    });
    
    renderParticipants(filtered);
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
            icon.src = './assets/icons/system/search.webp';
            icon.alt = '';
            icon.className = 'card-title-icon';
            searchTitle.appendChild(icon);
        }
    }
    
    // Рендерим интерфейс
    renderParticipants();
    
    // Обработчик поиска
    if (participantSearchEl) {
        participantSearchEl.addEventListener('input', (e) => {
            filterParticipants(e.target.value);
        });
        participantSearchEl.addEventListener('focus', () => {
            hapticTapSmart();
        }, { passive: true });
    }
}

// Функция для обновления списка участников (вызывается после сохранения профиля)
export async function refreshParticipantsList() {
    await loadParticipants();
    renderParticipants();
}

export function resetParticipantSearch() {
    if (participantSearchEl) {
        participantSearchEl.value = '';
    }
}
