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

function renderParticipants(participants = ALL_PARTICIPANTS) {
    if (!participantsListEl) return;
    
    participantsListEl.innerHTML = '';
    
    if (participants.length === 0) {
        noParticipantsHintEl?.classList.remove('hidden');
        return;
    }
    
    noParticipantsHintEl?.classList.add('hidden');
    
    participants.forEach(user => {
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
    
    // Рендерим интерфейс
    renderParticipants();
    
    // Обработчик поиска
    if (participantSearchEl) {
        participantSearchEl.addEventListener('input', (e) => {
            filterParticipants(e.target.value);
        });
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
