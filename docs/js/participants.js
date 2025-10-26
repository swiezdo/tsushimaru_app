// participants.js
import { tg, $, hapticTapSmart } from './telegram.js';
import { showScreen } from './ui.js';
import { fetchParticipants } from './api.js';

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
        btn.innerHTML = `<span>${user.psn_id || '—'}</span><span class="right">›</span>`;
        // Кнопки пока не кликабельны по требованию
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
        return psnId.includes(query);
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
