// participantDetail.js
import { tg, $, hapticTapSmart } from './telegram.js';
import { showScreen, setTopbar } from './ui.js';
import { fetchUserProfile, fetchUserBuilds, fetchUserMastery, API_BASE, fetchUserTrophies, fetchTrophiesList } from './api.js';
import { prettyLines, formatDate } from './utils.js';
import { 
    loadMasteryConfig, 
    getCategoryByKey,
    createBadgeButton
} from './mastery.js';

// Элементы интерфейса
const participantRealNameEl = $('participant_real_name');
const participantPsnIdEl = $('participant_psn_id');
const participantPlatformEl = $('participant_platform');
const participantModesEl = $('participant_modes');
const participantGoalsEl = $('participant_goals');
const participantDifficultyEl = $('participant_difficulty');
const participantAvatarEl = $('participantAvatar');
const participantTrophiesCard = $('participantTrophiesCard');
const participantTrophiesContainer = $('participantTrophiesContainer');
const noParticipantTrophiesHintEl = $('noParticipantTrophiesHint');

const participantBuildsListEl = $('participantBuildsList');
const noParticipantBuildsHintEl = $('noParticipantBuildsHint');

let currentParticipantId = null;
let currentParticipantProfile = null;
let trophyDefinitionsByKey = new Map();

// Рендеринг профиля участника
function renderParticipantProfile(profile) {
    if (!profile) return;
    
    if (participantRealNameEl) participantRealNameEl.textContent = profile.real_name || '—';
    if (participantPsnIdEl) participantPsnIdEl.textContent = profile.psn_id || '—';
    if (participantPlatformEl) participantPlatformEl.textContent = prettyLines(profile.platforms || []);
    if (participantModesEl) participantModesEl.textContent = prettyLines(profile.modes || []);
    if (participantGoalsEl) participantGoalsEl.textContent = prettyLines(profile.goals || []);
    if (participantDifficultyEl) participantDifficultyEl.textContent = prettyLines(profile.difficulties || []);
    
    // Обновляем аватарку с timestamp для предотвращения кеширования
    if (participantAvatarEl) {
        const avatarSrc = profile.avatar_url 
            ? `${API_BASE}${profile.avatar_url}?t=${Date.now()}` 
            : './assets/default-avatar.svg';
        participantAvatarEl.src = avatarSrc;
    }
}

function renderParticipantTrophies(trophiesData) {
    if (!participantTrophiesCard || !participantTrophiesContainer) {
        return;
    }

    participantTrophiesContainer.innerHTML = '';
    if (noParticipantTrophiesHintEl) {
        noParticipantTrophiesHintEl.classList.add('hidden');
        noParticipantTrophiesHintEl.textContent = 'У участника пока нет трофеев.';
    }

    participantTrophiesCard.style.display = 'none';

    const masteryKeys = new Set(['solo', 'hellmode', 'raid', 'speedrun', 'glitch']);
    const trophies = (trophiesData?.trophies || [])
        .filter((trophyKey) => !masteryKeys.has(trophyKey))
        .slice()
        .sort();

    participantTrophiesCard.style.display = 'block';

    if (trophies.length === 0) {
        if (noParticipantTrophiesHintEl) {
            noParticipantTrophiesHintEl.classList.remove('hidden');
        }
        return;
    }

    trophies.forEach((trophyKey) => {
        const trophyDef = trophyDefinitionsByKey.get(trophyKey);
        const titleText = trophyDef?.name || trophyKey;

        const item = document.createElement('div');
        item.className = 'list-btn is-static';

        const content = document.createElement('div');
        content.className = 'list-btn-content';

        const info = document.createElement('div');
        info.className = 'list-btn-info';

        const nameEl = document.createElement('span');
        nameEl.className = 'list-btn-name';
        nameEl.textContent = titleText;

        info.appendChild(nameEl);

        const trailing = document.createElement('div');
        trailing.className = 'list-btn-trailing';

        const icon = document.createElement('img');
        icon.className = 'list-btn-icon';
        icon.src = `./assets/trophies/${trophyKey}.svg`;
        icon.alt = titleText;
        icon.loading = 'lazy';

        trailing.appendChild(icon);

        content.appendChild(info);
        content.appendChild(trailing);
        item.appendChild(content);

        participantTrophiesContainer.appendChild(item);
    });
}

// Рендеринг билдов участника
function renderParticipantBuilds(builds) {
    if (!participantBuildsListEl) return;
    
    participantBuildsListEl.innerHTML = '';
    
    if (!builds || builds.length === 0) {
        noParticipantBuildsHintEl?.classList.remove('hidden');
        return;
    }
    
    noParticipantBuildsHintEl?.classList.add('hidden');
    
    // Сортируем билды по дате создания (сначала новые)
    const sortedBuilds = builds.slice().sort((a, b) => {
        const ca = Number(a?.created_at || 0);
        const cb = Number(b?.created_at || 0);
        return cb - ca; // По убыванию (новые сверху)
    });
    
    // Используем существующую функцию создания элемента билда из builds.js
    sortedBuilds.forEach(build => {
        const buildElement = createBuildElement(build, true); // true = isPublic
        participantBuildsListEl.appendChild(buildElement);
    });
}

// Рендеринг мастерства участника
async function renderParticipantMastery(userId) {
    const container = document.getElementById('participantMasteryContainer');
    const card = document.getElementById('participantMasteryCard');
    
    if (!container || !card) return;
    
    // Загружаем конфиг и уровни пользователя
    const [config, levels] = await Promise.all([
        loadMasteryConfig(),
        fetchUserMastery(userId)
    ]);
    
    if (!config) {
        card.style.display = 'none';
        return;
    }
    
    // Проверяем, есть ли хотя бы один уровень > 0
    const hasAnyProgress = Object.values(levels).some(level => level > 0);
    if (!hasAnyProgress) {
        card.style.display = 'none';
        return;
    }
    
    // Показываем карточку
    card.style.display = 'block';
    container.innerHTML = '';
    
    // Порядок категорий
    const categoryOrder = ['solo', 'hellmode', 'raid', 'speedrun', 'glitch'];
    
    for (const key of categoryOrder) {
        const currentLevel = levels[key] || 0;
        
        // Скрываем категории с нулевым уровнем
        if (currentLevel === 0) continue;
        
        const category = getCategoryByKey(config, key);
        if (!category) continue;
        
        // Создаём некликабельный элемент (div вместо button)
        const badge = createParticipantBadge(category, currentLevel);
        container.appendChild(badge);
    }
}

// Создание некликабельного бейджа мастерства (использует общую функцию)
function createParticipantBadge(category, currentLevel) {
    return createBadgeButton(category, currentLevel, false);
}

// Функция создания элемента билда (копия из builds.js)
function createBuildElement(build, isPublic = false) {
    const CLASS_ICON = {
        'Самурай': './assets/icons/classes/samurai.svg',
        'Охотник': './assets/icons/classes/hunter.svg',
        'Убийца': './assets/icons/classes/assassin.svg',
        'Ронин': './assets/icons/classes/ronin.svg'
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
    
    // Функция для создания элемента статистики
    const createStatItem = (iconPath, count, alt) => {
        const statItem = document.createElement('div');
        statItem.className = 'build-stat-item';
        
        const icon = document.createElement('img');
        icon.src = iconPath;
        icon.alt = alt;
        icon.className = 'build-stat-icon';
        
        const countSpan = document.createElement('span');
        countSpan.className = 'build-stat-count';
        countSpan.textContent = count || 0;
        
        statItem.appendChild(icon);
        statItem.appendChild(countSpan);
        
        // Останавливаем всплытие события при клике на статистику
        statItem.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        return statItem;
    };
    
    if (isPublic) {
        // Для публичных билдов создаем flex контейнер с автором слева и статистикой справа
        const authorText = document.createElement('span');
        authorText.textContent = build.author || '—';
        
        // Блок статистики справа
        const statsDiv = document.createElement('div');
        statsDiv.className = 'build-stats';
        
        // Получаем статистику (проверяем разные возможные варианты имен полей)
        const commentsCount = build.comments_count || build.commentsCount || 0;
        let likesCount = build.likes_count || build.likesCount || 0;
        let dislikesCount = build.dislikes_count || build.dislikesCount || 0;
        
        // Если статистика реакций находится в отдельном объекте
        if (build.reactions) {
            likesCount = build.reactions.likes_count || build.reactions.likesCount || likesCount;
            dislikesCount = build.reactions.dislikes_count || build.reactions.dislikesCount || dislikesCount;
        }
        
        statsDiv.appendChild(createStatItem('./assets/icons/system/comments.svg', commentsCount, 'Комментарии'));
        statsDiv.appendChild(createStatItem('./assets/icons/system/like.svg', likesCount, 'Лайки'));
        statsDiv.appendChild(createStatItem('./assets/icons/system/dislike.svg', dislikesCount, 'Дизлайки'));
        
        metaDiv.appendChild(authorText);
        metaDiv.appendChild(statsDiv);
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
        
        const trophyDefinitionsPromise = trophyDefinitionsByKey.size
            ? Promise.resolve(null)
            : fetchTrophiesList().catch(error => {
                console.error('Ошибка загрузки списка трофеев:', error);
                return [];
            });

        // Загружаем данные участника параллельно
        const [profile, builds, trophiesData, trophiesDefinitions] = await Promise.all([
            fetchUserProfile(userId),
            fetchUserBuilds(userId),
            fetchUserTrophies(userId).catch(error => {
                console.error('Ошибка загрузки трофеев участника:', error);
                return { trophies: [], active_trophies: [] };
            }),
            trophyDefinitionsPromise
        ]);

        if (Array.isArray(trophiesDefinitions) && trophiesDefinitions.length) {
            trophyDefinitionsByKey = new Map(trophiesDefinitions.map(def => [def.key, def]));
        }
        
        currentParticipantProfile = profile;
        
        // Рендерим все данные
        renderParticipantProfile(profile);
        renderParticipantTrophies(trophiesData);
        renderParticipantBuilds(builds);
        await renderParticipantMastery(userId);
        
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
