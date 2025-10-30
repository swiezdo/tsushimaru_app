// participantDetail.js
import { tg, $, hapticTapSmart } from './telegram.js';
import { showScreen, setTopbar } from './ui.js';
import { fetchUserProfile, fetchUserBuilds } from './api.js';
import { prettyLines, formatDate } from './utils.js';

// Элементы интерфейса
const participantRealNameEl = $('participant_real_name');
const participantPsnIdEl = $('participant_psn_id');
const participantPlatformEl = $('participant_platform');
const participantModesEl = $('participant_modes');
const participantGoalsEl = $('participant_goals');
const participantDifficultyEl = $('participant_difficulty');

// Трофеи удалены

const participantBuildsListEl = $('participantBuildsList');
const noParticipantBuildsHintEl = $('noParticipantBuildsHint');

let currentParticipantId = null;
let currentParticipantProfile = null;

// Трофеи удалены

// Рендеринг профиля участника
function renderParticipantProfile(profile) {
    if (!profile) return;
    
    if (participantRealNameEl) participantRealNameEl.textContent = profile.real_name || '—';
    if (participantPsnIdEl) participantPsnIdEl.textContent = profile.psn_id || '—';
    if (participantPlatformEl) participantPlatformEl.textContent = prettyLines(profile.platforms || []);
    if (participantModesEl) participantModesEl.textContent = prettyLines(profile.modes || []);
    if (participantGoalsEl) participantGoalsEl.textContent = prettyLines(profile.goals || []);
    if (participantDifficultyEl) participantDifficultyEl.textContent = prettyLines(profile.difficulties || []);
}

// Трофеи удалены

// Рендеринг билдов участника
function renderParticipantBuilds(builds) {
    if (!participantBuildsListEl) return;
    
    participantBuildsListEl.innerHTML = '';
    
    if (!builds || builds.length === 0) {
        noParticipantBuildsHintEl?.classList.remove('hidden');
        return;
    }
    
    noParticipantBuildsHintEl?.classList.add('hidden');
    
    // Используем существующую функцию создания элемента билда из builds.js
    builds.slice().reverse().forEach(build => {
        const buildElement = createBuildElement(build, true); // true = isPublic
        participantBuildsListEl.appendChild(buildElement);
    });
}

// Функция создания элемента билда (копия из builds.js)
function createBuildElement(build, isPublic = false) {
    const CLASS_ICON = {
        'Самурай': './assets/icons/samurai.svg',
        'Охотник': './assets/icons/hunter.svg',
        'Убийца': './assets/icons/assassin.svg',
        'Ронин': './assets/icons/ronin.svg'
    };
    
    const row = document.createElement('button');
    row.className = 'build-item';
    row.type = 'button';
    row.id = build.build_id || build.id;

    const icon = document.createElement('div');
    icon.className = 'build-icon';
    const img = document.createElement('img');
    img.alt = build.class || 'Класс';
    img.src = CLASS_ICON[build.class] || CLASS_ICON['Самурай'];
    icon.appendChild(img);

    const title = document.createElement('div');
    title.className = 'build-title';
    
    const nameDiv = document.createElement('div');
    nameDiv.textContent = build.name || 'Без названия';
    
    const metaDiv = document.createElement('div');
    metaDiv.className = 'build-author';
    
    if (isPublic) {
        metaDiv.textContent = 'Автор: ' + (build.author || '—');
    } else {
        const dateStr = build.created_at ? formatDate(new Date(build.created_at * 1000)) : '—';
        metaDiv.textContent = dateStr === '—' ? '—' : 'Создан: ' + dateStr;
    }
    
    title.appendChild(nameDiv);
    title.appendChild(metaDiv);

    row.appendChild(icon);
    row.appendChild(title);
    
    const clickHandler = () => { 
        hapticTapSmart(); 
        openPublicBuildDetail(build.build_id || build.id); 
    };
    
    row.addEventListener('click', clickHandler);
    return row;
}

// Функция открытия деталей публичного билда (копия из builds.js)
function openPublicBuildDetail(pubId) {
    // Сохраняем информацию о том, откуда мы пришли
    sessionStorage.setItem('previousScreen', `participantDetail:${currentParticipantId}`);
    
    // Используем существующую функцию из builds.js
    import('./builds.js').then(module => {
        // Проверяем, есть ли функция openPublicBuildDetail в модуле
        if (module.openPublicBuildDetail) {
            module.openPublicBuildDetail(pubId);
        } else {
            // Если функции нет, используем showScreen для перехода к деталям билда
            showScreen('buildPublicDetail');
        }
    }).catch(error => {
        console.error('Ошибка импорта builds.js:', error);
        tg?.showAlert?.('Ошибка открытия билда');
    });
}

// Основная функция открытия деталей профиля участника
export async function openParticipantDetail(userId) {
    try {
        currentParticipantId = userId;
        
        // Сохраняем информацию о том, откуда мы пришли, только если она еще не установлена
        if (!sessionStorage.getItem('previousScreen')) {
            sessionStorage.setItem('previousScreen', 'participants');
        }
        
        // Загружаем данные участника параллельно
        const [profile, builds] = await Promise.all([
            fetchUserProfile(userId),
            fetchUserBuilds(userId)
        ]);
        
        currentParticipantProfile = profile;
        
        // Рендерим все данные
        renderParticipantProfile(profile);
        // Трофеи удалены
        renderParticipantBuilds(builds);
        
        // Показываем экран
        showScreen('participantDetail');
        setTopbar(true, 'Участник');
        
    } catch (error) {
        console.error('Ошибка открытия деталей профиля участника:', error);
        tg?.showAlert?.('Не удалось загрузить данные участника');
    }
}

// Функция для получения текущего ID участника (для навигации)
export function getCurrentParticipantId() {
    return currentParticipantId;
}

// Инициализация модуля
export function initParticipantDetail() {
    // Модуль готов к использованию
    console.log('ParticipantDetail модуль инициализирован');
}
