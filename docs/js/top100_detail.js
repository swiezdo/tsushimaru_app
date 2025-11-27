// top100_detail.js
// Модуль для работы со страницей ТОП-100

import { getTop100Prize, submitTop100Application } from './api.js';
import { showScreen, setTopbar, focusAndScrollIntoView } from './ui.js';
import { tg, hapticTapSmart, hapticOK, hapticERR } from './telegram.js';
import { getModIconPath, getMapPath, getSystemIconPath } from './utils.js';
import { loadRotationData, loadCurrentWeek, getWeekData } from './home.js';
import { pushNavigation } from './navigation.js';
import { clearChildren, startButtonDotsAnimation } from './utils.js';

const detailContainer = document.getElementById('top100DetailContainer');

const categoryNames = {
  story: 'Сюжет',
  survival: 'Выживание',
  trials: 'Испытания Иё'
};

let currentCategory = null;
let currentPrize = null;

export async function openTop100Detail(category) {
  if (!detailContainer) return;
  
  currentCategory = category;
  
  showScreen('top100Detail');
  
  const categoryName = categoryNames[category] || category;
  setTopbar(true, `ТОП-100 ${categoryName}`);
  
  try {
    // Загружаем данные параллельно
    const [currentWeek, rotationJson, prize] = await Promise.all([
      loadCurrentWeek(),
      loadRotationData(),
      getTop100Prize().catch(() => 300) // Значение по умолчанию
    ]);
    
    currentPrize = prize;
    
    if (!rotationJson || !Array.isArray(rotationJson)) {
      console.error('Данные ротации недоступны');
      return;
    }
    
    const weekData = getWeekData(currentWeek);
    
    renderTop100Detail(category, weekData || {});
  } catch (error) {
    console.error('Ошибка загрузки данных ТОП-100:', error);
  }
}

function renderTop100Detail(category, weekData) {
  if (!detailContainer) return;
  
  clearChildren(detailContainer);
  
  // Hero-карточка
  detailContainer.appendChild(renderHeroCard(category, weekData, currentPrize));
  
  // Карточка "Описание"
  detailContainer.appendChild(renderDescriptionCard());
  
  // Карточка "Награда"
  detailContainer.appendChild(renderRewardCard());
  
  // Карточка "Доказательство"
  detailContainer.appendChild(renderProofCard());
  
  // Карточка "Подать заявку"
  detailContainer.appendChild(renderApplicationCard(category));
}

function normalizeChapterMods(chapterData) {
  if (chapterData === '' || chapterData === null || chapterData === undefined) {
    return null;
  }
  if (Array.isArray(chapterData)) {
    return chapterData.filter(mod => mod && mod.slug);
  }
  if (typeof chapterData === 'object' && chapterData.slug) {
    return [chapterData];
  }
  return null;
}

function createRewardBadge(prize) {
  const rewardBadge = document.createElement('div');
  rewardBadge.className = 'quest-reward-badge';
  
  const rewardValue = document.createElement('span');
  rewardValue.className = 'quest-reward-value';
  rewardValue.textContent = prize || 0;
  
  const magatamaImg = document.createElement('img');
  magatamaImg.src = getSystemIconPath('magatama.svg');
  magatamaImg.alt = 'Награда';
  magatamaImg.className = 'quest-reward-icon';
  
  rewardBadge.appendChild(rewardValue);
  rewardBadge.appendChild(magatamaImg);
  
  return rewardBadge;
}

function renderHeroCard(category, weekData, prize) {
  const card = document.createElement('section');
  
  if (category === 'survival') {
    // Выживание - waves-meta-card
    card.className = 'card waves-meta-card';
    
    const modIcons = document.createElement('div');
    modIcons.className = 'waves-mod-icons';
    
    if (weekData.survival_mod1_icon) {
      const mod1 = document.createElement('div');
      mod1.className = 'waves-mod-icon';
      const img1 = document.createElement('img');
      img1.src = getModIconPath(weekData.survival_mod1_icon, 'mod1');
      img1.alt = weekData.survival_mod1 || '';
      mod1.appendChild(img1);
      modIcons.appendChild(mod1);
    }
    
    if (weekData.survival_mod2_icon) {
      const mod2 = document.createElement('div');
      mod2.className = 'waves-mod-icon';
      const img2 = document.createElement('img');
      img2.src = getModIconPath(weekData.survival_mod2_icon, 'mod2');
      img2.alt = weekData.survival_mod2 || '';
      mod2.appendChild(img2);
      modIcons.appendChild(mod2);
    }
    
    card.appendChild(modIcons);
    
    const header = document.createElement('div');
    header.className = 'waves-header';
    
    const title = document.createElement('div');
    title.className = 'waves-title';
    title.textContent = weekData.survival || '—';
    
    const subtitle1 = document.createElement('div');
    subtitle1.className = 'waves-subtitle muted';
    subtitle1.textContent = weekData.survival_mod1 || '—';
    
    const subtitle2 = document.createElement('div');
    subtitle2.className = 'waves-subtitle muted';
    subtitle2.textContent = weekData.survival_mod2 || '—';
    
    header.appendChild(title);
    header.appendChild(subtitle1);
    header.appendChild(subtitle2);
    card.appendChild(header);
    
    // Фон карты
    const mapSlug = weekData.survival_slug || (weekData.survival_img ? weekData.survival_img.replace('.jpg', '') : '');
    if (mapSlug) {
      const mapPath = getMapPath(mapSlug, 'survival');
      card.style.backgroundImage = `url('${mapPath}')`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
      card.style.backgroundRepeat = 'no-repeat';
      card.classList.add('waves-meta-card--with-bg');
    }
    
    // Награда
    card.appendChild(createRewardBadge(prize));
    
  } else if (category === 'story') {
    // Сюжет - story-hero-card
    card.className = 'card story-hero-card';
    
    const storyImgName = weekData.story_img || (weekData.story_slug ? `${weekData.story_slug}.jpg` : '');
    if (storyImgName) {
      const mapSlug = storyImgName.replace('.jpg', '');
      const url = getMapPath(mapSlug, 'story');
      card.style.backgroundImage = `url('${url}')`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
      card.style.backgroundRepeat = 'no-repeat';
      card.classList.add('story-hero-card--with-bg');
    }
    
    // Модификатор недели (справа сверху)
    if (weekData.story_mod_icon) {
      const modIcons = document.createElement('div');
      modIcons.className = 'waves-mod-icons';
      
      const modIcon = document.createElement('div');
      modIcon.className = 'waves-mod-icon';
      const img = document.createElement('img');
      img.src = getModIconPath(weekData.story_mod_icon, 'mods');
      img.alt = weekData.story_mod || '';
      img.decoding = 'async';
      img.loading = 'lazy';
      modIcon.appendChild(img);
      modIcons.appendChild(modIcon);
      card.appendChild(modIcons);
    }
    
    const header = document.createElement('div');
    header.className = 'story-hero-header';
    
    const title = document.createElement('div');
    title.className = 'story-hero-title';
    title.textContent = weekData.story || '—';
    
    const subtitle = document.createElement('div');
    subtitle.className = 'story-hero-subtitle muted';
    subtitle.textContent = weekData.story_mod || '—';
    
    header.appendChild(title);
    header.appendChild(subtitle);
    card.appendChild(header);
    
    // Награда
    card.appendChild(createRewardBadge(prize));
    
  } else if (category === 'trials') {
    // Испытания Иё - trials-meta-card
    card.className = 'card trials-meta-card';
    
    const modIcons = document.createElement('div');
    modIcons.className = 'waves-mod-icons';
    
    if (weekData.trials_mod_icon) {
      const mod = document.createElement('div');
      mod.className = 'waves-mod-icon';
      const img = document.createElement('img');
      img.src = getModIconPath(weekData.trials_mod_icon, 'mods');
      img.alt = weekData.trials_mod || '';
      mod.appendChild(img);
      modIcons.appendChild(mod);
    }
    
    card.appendChild(modIcons);
    
    const header = document.createElement('div');
    header.className = 'waves-header';
    
    const title = document.createElement('div');
    title.className = 'waves-title';
    title.textContent = weekData.trials || '—';
    
    const subtitle = document.createElement('div');
    subtitle.className = 'waves-subtitle';
    subtitle.textContent = 'Свирепые враги';
    
    header.appendChild(title);
    header.appendChild(subtitle);
    card.appendChild(header);
    
    // Фон карты
    const mapSlug = weekData.trials_slug || (weekData.trials_img ? weekData.trials_img.replace('.jpg', '') : '');
    if (mapSlug) {
      const mapPath = getMapPath(mapSlug, 'trials');
      card.style.backgroundImage = `url('${mapPath}')`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
      card.style.backgroundRepeat = 'no-repeat';
      card.classList.add('trials-meta-card--with-bg');
    }
    
    // Награда
    card.appendChild(createRewardBadge(prize));
  }
  
  return card;
}

function renderDescriptionCard() {
  const card = document.createElement('section');
  card.className = 'card';
  
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = 'Описание';
  card.appendChild(title);
  
  const content = document.createElement('div');
  content.innerHTML = `
    <p>Выполнить каждое из заданий <b>ТОП-100</b> можно <b>только один</b> раз в неделю начиная с <b>субботы</b>, ваша задача попасть в ТОП-100 списка лидеров в выбранном вами режиме. Последний день для принятия заявок на текущую неделю — <b>четверг</b>, в пятницу подача заявок на получение наград за выполнение заданий ТОП-100 будет не доступна.</p>
  `;
  card.appendChild(content);
  
  return card;
}

function renderRewardCard() {
  const card = document.createElement('section');
  card.className = 'card';
  
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = 'Награда';
  card.appendChild(title);
  
  const content = document.createElement('div');
  content.innerHTML = `
    <p>Награда за выполнение заданий ТОП-100 зависит от дня недели, в который проверяли ваше место в списке лидеров.</p>
  `;
  card.appendChild(content);
  
  const table = document.createElement('table');
  table.className = 'top100-rewards-table';
  
  const rewards = [
    { day: 'Суббота', prize: 60 },
    { day: 'Воскресенье', prize: 120 },
    { day: 'Понедельник', prize: 180 },
    { day: 'Вторник', prize: 240 },
    { day: 'Среда', prize: 300 },
    { day: 'Четверг', prize: 350 },
    { day: 'Пятница', prize: null, note: 'Заявки не принимаются' }
  ];
  
  const tbody = document.createElement('tbody');
  rewards.forEach(({ day, prize, note }) => {
    const row = document.createElement('tr');
    
    const dayCell = document.createElement('td');
    dayCell.textContent = day;
    if (note) {
      dayCell.innerHTML = `<b>${day}</b>`;
    }
    
    const prizeCell = document.createElement('td');
    if (prize !== null) {
      prizeCell.innerHTML = `${prize} <img src="${getSystemIconPath('magatama.svg')}" alt="🪙" style="width: 16px; height: 16px; vertical-align: middle;">`;
    } else {
      prizeCell.innerHTML = `<b>${note}</b>`;
    }
    
    row.appendChild(dayCell);
    row.appendChild(prizeCell);
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  content.appendChild(table);
  
  const hint = document.createElement('p');
  hint.className = 'muted';
  hint.style.marginTop = 'var(--space-3)';
  hint.textContent = 'Повышение наград происходит в 9 часов утра по Московскому времени';
  content.appendChild(hint);
  
  return card;
}

function renderProofCard() {
  const card = document.createElement('section');
  card.className = 'card';
  
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = 'Доказательство';
  card.appendChild(title);
  
  const content = document.createElement('div');
  content.innerHTML = `
    <p>Единственное что вам необходимо сделать, это убедиться что в вашем профиле правильно указан ваш ник PSN, по нему мы будем проверять ваше место в списке лидеров, никаких скриншотов/видео не требуется.</p>
  `;
  card.appendChild(content);
  
  return card;
}

function renderApplicationCard(category) {
  const card = document.createElement('section');
  card.className = 'card';
  card.id = 'top100ApplicationCard';
  
  card.innerHTML = `
    <h2 class="card-title">Подать заявку</h2>
    <form class="form" id="top100ApplicationForm">
      <div class="input">
        <label for="top100ApplicationComment">Комментарии (необязательно)</label>
        <textarea id="top100ApplicationComment" rows="1" placeholder="Дополнительная информация"></textarea>
      </div>
    </form>
    <div class="actions-bar">
      <button type="button" class="btn primary wide" id="top100ApplicationSubmitBtn">Подать заявку</button>
    </div>
  `;
  
  setupApplicationForm(card, category);
  return card;
}

function setupApplicationForm(card, category) {
  const commentEl = card.querySelector('#top100ApplicationComment');
  const submitBtn = card.querySelector('#top100ApplicationSubmitBtn');
  
  if (commentEl) {
    const autoResize = () => {
      commentEl.style.height = 'auto';
      commentEl.style.height = Math.min(commentEl.scrollHeight, 200) + 'px';
    };
    commentEl.addEventListener('input', autoResize);
    commentEl.addEventListener('focus', () => { hapticTapSmart(); }, { passive: true });
    autoResize();
  }
  
  submitBtn?.addEventListener('pointerdown', () => { hapticTapSmart(); });
  submitBtn?.addEventListener('click', (e) => {
    e.preventDefault?.();
    submitTop100ApplicationForm(category);
  });
}

async function submitTop100ApplicationForm(category) {
  const commentEl = document.getElementById('top100ApplicationComment');
  const submitBtn = document.getElementById('top100ApplicationSubmitBtn');
  
  if (!submitBtn) return;
  
  const comment = commentEl?.value?.trim() || '';
  
  if (submitBtn.disabled) return;
  
  submitBtn.disabled = true;
  const dotsAnimation = startButtonDotsAnimation(submitBtn, 'Подать заявку');
  
  try {
    await submitTop100Application(category, comment);
    
    hapticOK();
    
    tg?.showPopup?.({
      title: 'Заявка отправлена',
      message: 'Ваша заявка успешно отправлена. Вы получите уведомление о результатах рассмотрения.',
      buttons: [{ type: 'ok' }],
    });
    
    // Возвращаемся на главную страницу
    pushNavigation('home');
    showScreen('home');
    
  } catch (error) {
    hapticERR();
    
    const errorMessage = error?.message || error?.detail || 'Произошла ошибка при отправке заявки';
    
    tg?.showPopup?.({
      title: 'Ошибка',
      message: errorMessage,
      buttons: [{ type: 'ok' }],
    });
    
    focusAndScrollIntoView(submitBtn);
  } finally {
    submitBtn.disabled = false;
    if (dotsAnimation) {
      clearInterval(dotsAnimation);
      submitBtn.textContent = 'Подать заявку';
    }
  }
}

