// home.js
// Управление главной страницей с ротацией недель

import { getCurrentRotationWeek, checkUserRegistration, getRecentEvents, getRecentComments } from './api.js';
import { showScreen } from './ui.js';
import { pushNavigation } from './navigation.js';
import { openWavesScreen } from './waves.js';
import { tg, hapticTapSmart } from './telegram.js';
import { getClassIconPath } from './utils.js';

const TELEGRAM_COMMUNITY_URL = 'https://t.me/+ZFiVYVrz-PEzYjBi';

let rotationData = null;
let rotationCountdownTimerId = null;
let rotationButtonsBound = false;

// ===== Загрузка данных «Что нового?» =====
async function loadWhatsNew() {
  try {
    const res = await fetch(`./assets/data/whats-new.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`whats-new.json status ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('Ошибка загрузки whats-new.json:', e);
    return null;
  }
}

/**
 * Загружает данные ротации из rotation.json
 * @returns {Promise<Object|null>} Объект с данными ротации или null при ошибке
 */
export async function loadRotationData() {
  try {
    const cacheBust = Date.now();
    const response = await fetch(`./assets/data/rotation.json?v=${cacheBust}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    rotationData = data;
    return data;
  } catch (error) {
    console.error('Ошибка загрузки данных ротации:', error);
    return null;
  }
}

/**
 * Загружает текущую неделю через API
 * @returns {Promise<number>} Номер текущей недели (1-16)
 */
export async function loadCurrentWeek() {
  try {
    const week = await getCurrentRotationWeek();
    return week;
  } catch (error) {
    console.error('Ошибка загрузки текущей недели:', error);
    return 14; // Возвращаем 14 по умолчанию
  }
}

/**
 * Получает данные для конкретной недели
 * @param {number} week - Номер недели (1-16)
 * @returns {Object|null} Данные недели или null
 */
export function getWeekData(week) {
  if (!rotationData || !Array.isArray(rotationData)) {
    return null;
  }
  return rotationData.find(item => item.week === week) || null;
}

/**
 * Отображает контент ротации для текущей недели
 * @param {Object} weekData - Данные недели из rotation.json
 */
export function renderHomeContent(weekData) {
  if (!weekData) {
    console.error('Данные недели не найдены');
    return;
  }

  // Обновляем заголовок недели
  const weekTitle = document.getElementById('rotationWeekTitle');
  if (weekTitle) {
    weekTitle.textContent = `Неделя №${weekData.week}`;
  }

  // Сюжет
  const storyBtn = document.getElementById('rotationStoryBtn');
  const storyMap = storyBtn?.querySelector('.rotation-mode-map');
  const storyModIcon = document.getElementById('rotationStoryModIcon');
  let storyHint = storyBtn?.querySelector('.rotation-mode-hint');
  
  if (storyMap) {
    storyMap.textContent = weekData.story || '—';
  }
  if (storyBtn) {
    if (!storyHint) {
      storyHint = document.createElement('div');
      storyHint.className = 'rotation-mode-hint';
      storyBtn.querySelector('.rotation-mode-text')?.appendChild(storyHint);
    }
    storyHint.textContent = 'Нажмите, чтобы открыть';
  }
  
  if (storyModIcon && weekData.story_mod_icon) {
    storyModIcon.src = `./assets/icons/mods/${weekData.story_mod_icon}?t=${Date.now()}`;
    storyModIcon.alt = weekData.story_mod || '';
  }

  // Выживание "Кошмар"
  const survivalBtn = document.getElementById('rotationSurvivalBtn');
  const survivalMap = survivalBtn?.querySelector('.rotation-mode-map');
  const survivalMod1Icon = document.getElementById('rotationSurvivalMod1Icon');
  const survivalMod2Icon = document.getElementById('rotationSurvivalMod2Icon');
  let survivalHint = survivalBtn?.querySelector('.rotation-mode-hint');
  
  if (survivalMap) {
    survivalMap.textContent = weekData.survival || '—';
  }
  if (survivalBtn) {
    if (!survivalHint) {
      survivalHint = document.createElement('div');
      survivalHint.className = 'rotation-mode-hint';
      survivalBtn.querySelector('.rotation-mode-text')?.appendChild(survivalHint);
    }
    survivalHint.textContent = 'Нажмите, чтобы открыть';
  }
  
  if (survivalMod1Icon && weekData.survival_mod1_icon) {
    survivalMod1Icon.src = `./assets/icons/mod1/${weekData.survival_mod1_icon}?t=${Date.now()}`;
    survivalMod1Icon.alt = weekData.survival_mod1 || '';
  }
  
  if (survivalMod2Icon && weekData.survival_mod2_icon) {
    survivalMod2Icon.src = `./assets/icons/mod2/${weekData.survival_mod2_icon}?t=${Date.now()}`;
    survivalMod2Icon.alt = weekData.survival_mod2 || '';
  }

  // Соперники
  const rivalsBtn = document.getElementById('rotationRivalsBtn');
  const rivalsMap = rivalsBtn?.querySelector('.rotation-mode-map');
  const rivalsModIcons = document.getElementById('rotationRivalsModIcons');
  let rivalsModLabel = rivalsBtn?.querySelector('.rotation-mode-mod');
  
  if (rivalsMap) {
    rivalsMap.textContent = weekData.rivals || '—';
  }

  // Подпись модификатора соперников (только если есть rivals_mod)
  if (rivalsBtn) {
    if (weekData.rivals_mod) {
      if (!rivalsModLabel) {
        rivalsModLabel = document.createElement('div');
        rivalsModLabel.className = 'rotation-mode-mod';
        rivalsBtn.querySelector('.rotation-mode-text')?.appendChild(rivalsModLabel);
      }
      rivalsModLabel.textContent = weekData.rivals_mod;
    } else if (rivalsModLabel) {
      rivalsModLabel.remove();
    }
  }
  
  // Очищаем контейнер иконок модификаторов для соперников
  if (rivalsModIcons) {
    rivalsModIcons.innerHTML = '';
    
    // Добавляем иконку только если есть rivals_mod_icon
    if (weekData.rivals_mod_icon) {
      const modIconWrapper = document.createElement('div');
      modIconWrapper.className = 'waves-mod-icon';
      const modIconImg = document.createElement('img');
      modIconImg.src = `./assets/icons/mods/${weekData.rivals_mod_icon}?t=${Date.now()}`;
      modIconImg.alt = weekData.rivals_mod || '';
      modIconWrapper.appendChild(modIconImg);
      rivalsModIcons.appendChild(modIconWrapper);
    }
  }

  // Испытания Иё
  const trialsBtn = document.getElementById('rotationTrialsBtn');
  const trialsMap = trialsBtn?.querySelector('.rotation-mode-map');
  let trialsModLabel = trialsBtn?.querySelector('.rotation-mode-mod');
  
  if (trialsMap) {
    trialsMap.textContent = weekData.trials || '—';
  }

  // Подпись модификатора для испытаний Иё (всегда один и тот же)
  if (trialsBtn) {
    if (!trialsModLabel) {
      trialsModLabel = document.createElement('div');
      trialsModLabel.className = 'rotation-mode-mod';
      trialsBtn.querySelector('.rotation-mode-text')?.appendChild(trialsModLabel);
    }
    trialsModLabel.textContent = 'Свирепые враги';
  }

  // Иконка модификатора для испытаний Иё
  if (trialsBtn) {
    let trialsModIcons = document.getElementById('rotationTrialsModIcons');
    if (!trialsModIcons) {
      trialsModIcons = document.createElement('div');
      trialsModIcons.id = 'rotationTrialsModIcons';
      trialsModIcons.className = 'rotation-mod-icons';
      trialsBtn.appendChild(trialsModIcons);
    }
    trialsModIcons.innerHTML = '';
    if (weekData.trials_mod_icon) {
      const modIconWrapper = document.createElement('div');
      modIconWrapper.className = 'waves-mod-icon';
      const modIconImg = document.createElement('img');
      modIconImg.src = `./assets/icons/mods/${weekData.trials_mod_icon}?t=${Date.now()}`;
      modIconImg.alt = weekData.trials_mod || '';
      modIconWrapper.appendChild(modIconImg);
      trialsModIcons.appendChild(modIconWrapper);
    }
  }

  // TODO: Подготовка для фоновых изображений карт
  // В будущем здесь будет подстановка фоновых изображений:
  // - story: ./assets/maps/story/{story_map}.jpg
  // - survival: ./assets/maps/survival/{survival_map}.jpg
  // - rivals: ./assets/maps/rivals/{rivals_map}.jpg
  // - trials: ./assets/maps/trials/{trials_map}.jpg

  // Подстановка фоновых изображений на кнопки режимов
  const storyImgName = weekData.story_img || (weekData.story_slug ? `${weekData.story_slug}.jpg` : '');
  const survivalImgName = weekData.survival_img || (weekData.survival_slug ? `${weekData.survival_slug}.jpg` : '');
  const rivalsImgName = weekData.rivals_img || (weekData.rivals_slug ? `${weekData.rivals_slug}.jpg` : '');
  const trialsImgName = weekData.trials_img || (weekData.trials_slug ? `${weekData.trials_slug}.jpg` : '');

  const storyImgUrl = storyImgName ? `./assets/maps/story/${storyImgName}` : '';
  const survivalImgUrl = survivalImgName ? `./assets/maps/survival/${survivalImgName}` : '';
  const rivalsImgUrl = rivalsImgName ? `./assets/maps/rivals/${rivalsImgName}` : '';
  const trialsImgUrl = trialsImgName ? `./assets/maps/trials/${trialsImgName}` : '';

  applyButtonBackground(storyBtn, storyImgUrl);
  applyButtonBackground(survivalBtn, survivalImgUrl);
  applyButtonBackground(rivalsBtn, rivalsImgUrl);
  applyButtonBackground(trialsBtn, trialsImgUrl);
}

// ===== Превью-карточка «Что нового?» на главной =====
function renderWhatsNewPreviewCard(latest) {
  const home = document.getElementById('homeScreen');
  if (!home || !latest) return;
  let card = document.getElementById('whatsNewPreviewCard');
  if (!card) {
    card = document.createElement('section');
    card.className = 'card';
    card.id = 'whatsNewPreviewCard';
    home.appendChild(card);
  }
  card.innerHTML = '';
  // Заголовок + кнопка
  const header = document.createElement('div');
  header.className = 'card-header-row';
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = 'Что нового?';
  const icon = document.createElement('img');
  icon.src = './assets/icons/system/whatsnew.webp';
  icon.alt = '';
  icon.className = 'card-title-icon';
  title.appendChild(icon);
  const moreBtn = document.createElement('button');
  moreBtn.className = 'author-chip';
  moreBtn.type = 'button';
  moreBtn.textContent = 'Подробнее';
  moreBtn.addEventListener('click', () => {
    hapticTapSmart();
    showScreen('whatsNew');
  });
  header.appendChild(title);
  header.appendChild(moreBtn);
  // Подзаголовки: title, version, date
  const subTitle = document.createElement('div');
  subTitle.className = 'mastery-level-name';
  subTitle.textContent = latest.title || '';
  const subVersion = document.createElement('div');
  subVersion.className = 'mastery-category-name';
  subVersion.textContent = latest.version ? `v${latest.version}` : '';
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const dateEl = document.createElement('div');
  dateEl.className = 'version-date';
  dateEl.textContent = formatDate(latest.date);
  // Список изменений с эмодзи как в whatsNew.js
  const CHANGE_ICONS = { new: '✨', improvement: '⚡', fix: '🐛' };
  const list = document.createElement('ul');
  list.className = 'changelog-list';
  (latest.changes || []).forEach((ch) => {
    if (!ch?.text || !ch.text.trim()) return;
    const li = document.createElement('li');
    li.className = 'changelog-item';
    const icon = document.createElement('span');
    icon.className = 'changelog-icon';
    icon.textContent = CHANGE_ICONS[ch.type] || '•';
    const text = document.createElement('span');
    text.className = 'changelog-text';
    text.textContent = ch.text;
    li.appendChild(icon);
    li.appendChild(text);
    list.appendChild(li);
  });
  card.appendChild(header);
  card.appendChild(subTitle);
  card.appendChild(subVersion);
  card.appendChild(dateEl);
  card.appendChild(list);
  
  // Добавляем кнопку "Отправить отзыв" под карточкой
  let feedbackBtnContainer = document.getElementById('homeFeedbackBtnContainer');
  if (!feedbackBtnContainer) {
    feedbackBtnContainer = document.createElement('div');
    feedbackBtnContainer.className = 'actions-bar';
    feedbackBtnContainer.id = 'homeFeedbackBtnContainer';
    home.appendChild(feedbackBtnContainer);
    
    const feedbackBtn = document.createElement('button');
    feedbackBtn.id = 'sendFeedbackBtn';
    feedbackBtn.className = 'btn primary wide';
    feedbackBtn.type = 'button';
    feedbackBtn.textContent = 'Отправить отзыв';
    feedbackBtn.dataset.bound = 'true';
    feedbackBtn.addEventListener('click', () => {
        hapticTapSmart();
        pushNavigation('feedback');
        showScreen('feedback');
    });
    feedbackBtnContainer.appendChild(feedbackBtn);
  } else {
    const feedbackBtn = feedbackBtnContainer.querySelector('#sendFeedbackBtn');
    if (feedbackBtn && !feedbackBtn.dataset.bound) {
      feedbackBtn.dataset.bound = 'true';
      feedbackBtn.addEventListener('click', () => {
        hapticTapSmart();
        pushNavigation('feedback');
        showScreen('feedback');
      });
    }
  }
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const ms = typeof timestamp === 'number'
    ? (timestamp < 1e12 ? timestamp * 1000 : timestamp)
    : Number(timestamp);
  if (!Number.isFinite(ms)) return '';
  const diff = Date.now() - ms;
  if (diff < 45 * 1000) return 'только что';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

function renderRecentEventsCard(events) {
  const home = document.getElementById('homeScreen');
  if (!home) return;

  const hasEvents = Array.isArray(events) && events.length > 0;
  let card = document.getElementById('recentEventsCard');

  if (!hasEvents) {
    card?.parentElement?.removeChild(card);
    return;
  }

  if (!card) {
    card = document.createElement('section');
    card.className = 'card recent-events-card';
    card.id = 'recentEventsCard';
  }

  const hero = document.getElementById('homeHero');
  if (hero && hero.parentElement === home) {
    hero.insertAdjacentElement('afterend', card);
  } else if (!card.parentElement) {
    home.prepend(card);
  }

  card.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'card-header-row';
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = 'Последние награды';
  const icon = document.createElement('img');
  icon.src = './assets/icons/system/reward.webp';
  icon.alt = '';
  icon.className = 'card-title-icon';
  title.appendChild(icon);
  header.appendChild(title);
  card.appendChild(header);

  const list = document.createElement('ul');
  list.className = 'recent-events-list';

  const createProfileLink = (handler) => {
    const fn = () => {
      if (!handler?.user_id) return;
      pushNavigation('participantDetail', { userId: handler.user_id });
      import('./participantDetail.js').then(module => {
        module.openParticipantDetail(handler.user_id);
      }).catch(err => console.error('Ошибка открытия профиля участника:', err));
    };
    return fn;
  };

  events.slice(0, 3).forEach((event) => {
    const item = document.createElement('li');
    item.className = 'recent-event-item';

    const avatar = document.createElement('button');
    avatar.type = 'button';
    avatar.className = 'recent-event-avatar recent-event-link';
    const img = document.createElement('img');
    img.src = event?.avatar_url || './assets/default-avatar.svg';
    img.alt = event.psn_id || 'Участник';
    img.loading = 'lazy';
    avatar.appendChild(img);
    const openProfile = createProfileLink(event);
    avatar.addEventListener('click', openProfile);

    const body = document.createElement('div');
    body.className = 'recent-event-body';

    const headline = document.createElement('button');
    headline.type = 'button';
    headline.className = 'recent-event-headline recent-event-link';
    headline.textContent = event?.headline || `${event?.psn_id || 'Участник'} получил(а) новую награду`;
    headline.addEventListener('click', openProfile);

    const details = document.createElement('div');
    details.className = 'recent-event-details';
    const time = formatRelativeTime(event?.created_at);
    if (event?.details && time) {
      details.textContent = `${event.details} · ${time}`;
    } else {
      details.textContent = event?.details || time || '';
    }

    body.appendChild(headline);
    if (details.textContent) {
      body.appendChild(details);
    }

    item.appendChild(avatar);
    item.appendChild(body);
    list.appendChild(item);
  });

  card.appendChild(list);
}

function renderRecentCommentsCard(comments) {
  const home = document.getElementById('homeScreen');
  if (!home) return;

  const hasComments = Array.isArray(comments) && comments.length > 0;
  let card = document.getElementById('recentCommentsCard');

  if (!hasComments) {
    card?.parentElement?.removeChild(card);
    return;
  }

  if (!card) {
    card = document.createElement('section');
    card.className = 'card recent-comments-card';
    card.id = 'recentCommentsCard';
    const anchor = document.getElementById('whatsNewPreviewCard');
    if (anchor && anchor.parentElement === home) {
      home.insertBefore(card, anchor);
    } else {
      home.appendChild(card);
    }
  }

  card.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'card-header-row';
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = 'Лента комментариев';
  const icon = document.createElement('img');
  icon.src = './assets/icons/system/comments.webp';
  icon.alt = '';
  icon.className = 'card-title-icon';
  title.appendChild(icon);
  header.appendChild(title);
  card.appendChild(header);

  const list = document.createElement('ul');
  list.className = 'recent-comments-list';

  comments.slice(0, 3).forEach((comment) => {
    const item = document.createElement('li');
    item.className = 'recent-comment-item';

    const avatar = document.createElement('div');
    avatar.className = 'recent-comment-avatar';
    const img = document.createElement('img');
    img.src = comment?.avatar_url || './assets/default-avatar.svg';
    img.alt = comment.psn_id || 'Участник';
    img.loading = 'lazy';
    avatar.appendChild(img);

    const body = document.createElement('div');
    body.className = 'recent-comment-body';

    const meta = document.createElement('div');
    meta.className = 'recent-comment-meta';
    const author = document.createElement('span');
    author.className = 'recent-comment-author';
    author.textContent = comment?.psn_id || 'Участник';
    const time = document.createElement('span');
    time.className = 'recent-comment-time';
    time.textContent = formatRelativeTime(comment?.created_at);
    meta.appendChild(author);
    if (time.textContent) {
      meta.appendChild(document.createTextNode(' · '));
      meta.appendChild(time);
    }

    const buildLink = document.createElement('button');
    buildLink.type = 'button';
    buildLink.className = 'author-chip recent-comment-build';

    const classIconSrc = getClassIconPath(comment?.build_class);
    if (classIconSrc) {
      const iconImg = document.createElement('img');
      iconImg.src = classIconSrc;
      iconImg.alt = comment?.build_class || 'Класс';
      iconImg.width = 18;
      iconImg.height = 18;
      buildLink.appendChild(iconImg);
    }

    const buildNameSpan = document.createElement('span');
    buildNameSpan.textContent = comment?.build_name || 'Открыть билд';
    buildLink.appendChild(buildNameSpan);
    buildLink.addEventListener('click', async () => {
      if (!comment?.build_id) return;
      pushNavigation('buildPublicDetail', { buildId: comment.build_id });
      const { openPublicBuildDetail } = await import('./builds.js');
      openPublicBuildDetail(comment.build_id, { source: 'homeComments' });
    });

    const text = document.createElement('div');
    text.className = 'recent-comment-text';
    text.textContent = comment?.comment_text || '';

    body.appendChild(meta);
    body.appendChild(buildLink);
    body.appendChild(text);

    item.appendChild(avatar);
    item.appendChild(body);
    list.appendChild(item);
  });

  card.appendChild(list);
}

// ===== Таймер до следующей пятницы 18:00 МСК =====
function getNextFridayMsk() {
  const now = new Date();
  const nowUtc = new Date(now.getTime());
  const day = nowUtc.getUTCDay(); // 0..6, 5=Fri
  let daysToFri = (5 - day + 7) % 7;
  // 18:00 MSK == 15:00 UTC
  const target = new Date(Date.UTC(
    nowUtc.getUTCFullYear(),
    nowUtc.getUTCMonth(),
    nowUtc.getUTCDate(),
    15, 0, 0, 0
  ));
  if (daysToFri === 0 && target <= nowUtc) daysToFri = 7;
  if (daysToFri > 0) target.setUTCDate(target.getUTCDate() + daysToFri);
  return target;
}

function formatCountdown(ms) {
  if (ms < 0) ms = 0;
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const hNum = Math.floor((sec % 86400) / 3600);
  const mNum = Math.floor((sec % 3600) / 60);
  // Склонение для "день"
  const plural = (n, one, few, many) => {
    const n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
    return many;
  };
  const daysLabel = plural(d, 'день', 'дня', 'дней');
  // Формат: если есть часы — показываем часы, иначе минуты
  if (hNum > 0) {
    return `${d} ${daysLabel} и ${hNum} ч.`;
  }
  return `${d} ${daysLabel} и ${mNum} мин.`;
}

function renderRotationCountdown() {
  const rotation = document.getElementById('rotationScreen');
  if (!rotation) return;

  // Если ранее создавали отдельную карточку — удалим
  const oldCard = document.getElementById('rotationCountdownCard');
  if (oldCard && oldCard.parentElement) {
    oldCard.parentElement.removeChild(oldCard);
  }

  // Вставляем таймер в конец основной карточки ротации
  const mainCard = rotation.querySelector('section.card');
  if (!mainCard) return;

  let timer = document.getElementById('rotationCountdownTimer');
  if (!timer) {
    // Заголовок для таймера
    const title = document.createElement('h3');
    title.className = 'card-title rotation-countdown-title';
    title.textContent = 'До обновления ротации:';

    timer = document.createElement('div');
    timer.id = 'rotationCountdownTimer';
    timer.className = 'rotation-countdown-timer';
    timer.setAttribute('aria-live', 'polite');

    mainCard.appendChild(title);
    mainCard.appendChild(timer);
  } else if (timer.parentElement !== mainCard) {
    // Если уже существует, но в другом месте — переместим
    mainCard.appendChild(timer);
  }

  if (!timer) return;
  let target = getNextFridayMsk();
  const update = () => {
    let ms = target.getTime() - Date.now();
    // Если время истекло, пересчитываем следующую пятницу
    if (ms <= 0) {
      target = getNextFridayMsk();
      ms = target.getTime() - Date.now();
    }
    timer.textContent = formatCountdown(ms);
  };
  if (rotationCountdownTimerId) clearInterval(rotationCountdownTimerId);
  update();
  rotationCountdownTimerId = setInterval(update, 1000);
}

/**
 * Инициализация главной страницы (превью «Что нового?»)
 */
export async function initHome() {
  try {
    renderHomeHero();
    const [events, comments, whats] = await Promise.all([
      getRecentEvents(3).catch(() => []),
      getRecentComments(3).catch(() => []),
      loadWhatsNew(),
    ]);

    renderRecentEventsCard(events);
    renderRecentCommentsCard(comments);
    if (Array.isArray(whats) && whats.length) {
      const latest = whats[whats.length - 1];
      renderWhatsNewPreviewCard(latest);
    }
  } catch (error) {
    console.error('Ошибка инициализации главной страницы:', error);
  }
}

function renderHomeHero() {
  const home = document.getElementById('homeScreen');
  if (!home) return;

  let hero = document.getElementById('homeHero');
  if (!hero) {
    hero = document.createElement('div');
    hero.id = 'homeHero';
    hero.className = 'home-hero';
    home.prepend(hero);
  }

  hero.innerHTML = '';

  const logoWrapper = document.createElement('div');
  logoWrapper.className = 'home-hero-logo';
  const logoImg = document.createElement('img');
  logoImg.src = './assets/logo/logo.png';
  logoImg.alt = 'Tsushima.Ru';
  logoImg.width = 128;
  logoImg.height = 128;
  logoImg.loading = 'lazy';
  logoWrapper.appendChild(logoImg);

  const actionsBar = document.createElement('div');
  actionsBar.className = 'actions-bar home-hero-actions';

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'joinTelegramBtn';
  button.className = 'btn primary wide';
  button.textContent = 'Перейти в группу';
  button.addEventListener('click', () => {
    hapticTapSmart();
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(TELEGRAM_COMMUNITY_URL);
    } else {
      window.open(TELEGRAM_COMMUNITY_URL, '_blank');
    }
  });

  actionsBar.appendChild(button);

  hero.appendChild(logoWrapper);
  hero.appendChild(actionsBar);
}

/**
 * Инициализация экрана «Ротация»
 */
export async function initRotationScreen() {
  try {
    // Загружаем данные ротации и текущую неделю параллельно
    const [currentWeek, rotationJson] = await Promise.all([
      loadCurrentWeek(),
      loadRotationData()
    ]);

    if (!rotationJson) {
      console.error('Не удалось загрузить данные ротации');
      return;
    }

    // Получаем данные для текущей недели
    const weekData = getWeekData(currentWeek);
    
    if (!weekData) {
      console.error(`Данные для недели ${currentWeek} не найдены`);
      return;
    }

    // Отображаем контент
    renderHomeContent(weekData);

    // Рендерим таймер до обновления ротации
    renderRotationCountdown();

    // Настраиваем обработчики кнопок
    setupRotationButtons();
  } catch (error) {
    console.error('Ошибка инициализации экрана «Ротация»:', error);
  }
}

/**
 * Настраивает обработчики кнопок ротации
 */
function setupRotationButtons() {
  if (rotationButtonsBound) {
    return;
  }
  rotationButtonsBound = true;

  // Кнопка "Выживание" → ведет на страницу "Волны"
  const survivalBtn = document.getElementById('rotationSurvivalBtn');
  if (survivalBtn) {
    survivalBtn.addEventListener('click', async () => {
      hapticTapSmart();
      
      // Переходим на волны
      pushNavigation('waves');
      showScreen('waves');
      openWavesScreen();
    });
  }

  // Кнопка "Сюжет" → заглушка
  const storyBtn = document.getElementById('rotationStoryBtn');
  if (storyBtn) {
    storyBtn.addEventListener('click', () => {
      hapticTapSmart();
      pushNavigation('story');
      showScreen('story');
    });
  }

  // Кнопки "Соперники" и "Испытания Иё" некликабельные
  // (установлен атрибут disabled в HTML)
}


/**
 * Утилита для установки/снятия фонового изображения на кнопках
 * и применения существующих классов оформления фона.
 * Ожидается, что стили для фоновых кнопок уже существуют (например, 'has-bg').
 */
function applyButtonBackground(el, url) {
  if (!el) return;
  if (url) {
    el.style.backgroundImage = `url('${url}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat = 'no-repeat';
    el.classList.add('badge-btn--with-bg');
  } else {
    el.style.backgroundImage = '';
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.backgroundRepeat = '';
    el.classList.remove('badge-btn--with-bg');
  }
}
