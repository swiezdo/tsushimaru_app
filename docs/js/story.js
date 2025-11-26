// story.js
// Экран сюжета: карта недели, модификаторы и свитки Гёдзена

import { loadRotationData, loadCurrentWeek, getWeekData } from './home.js';
import { setTopbar } from './ui.js';
import { openLightbox } from './builds.js';
import { hapticTapSmart } from './telegram.js';
import { getStaticAssetPath, getDynamicAssetPath, getModIconPath, getMapPath, getSystemIconPath } from './utils.js';

let storyDataCache = null;

async function loadStoryConfig() {
  if (storyDataCache) return storyDataCache;
  try {
    const res = await fetch(getDynamicAssetPath('./assets/data/story.json'), { cache: 'no-store' });
    if (!res.ok) throw new Error(`story.json status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error('story.json: ожидается массив');
      return null;
    }
    storyDataCache = data;
    return data;
  } catch (e) {
    console.error('Ошибка загрузки story.json:', e);
    return null;
  }
}

function getScrollBlock(storySlug, storyConfig) {
  if (!storySlug || !Array.isArray(storyConfig)) return null;
  return storyConfig.find((item) => item.story_slug === storySlug) || null;
}

function createModIcon(path, alt) {
  const wrapper = document.createElement('div');
  wrapper.className = 'waves-mod-icon';

  const img = document.createElement('img');
  img.src = path;
  img.alt = alt || '';
  img.decoding = 'async';
  img.loading = 'lazy';

  wrapper.appendChild(img);
  return wrapper;
}

function renderHeroCard(root, weekData) {
  const card = document.createElement('section');
  card.className = 'card story-hero-card';

  const storyImgName = weekData.story_img || (weekData.story_slug ? `${weekData.story_slug}.jpg` : '');
  if (storyImgName) {
    const mapSlug = storyImgName.replace('.jpg', '');
    const url = getMapPath(mapSlug, 'story');
    // Фон карты напрямую на карточку
    card.style.backgroundImage = `url('${url}')`;
    card.style.backgroundSize = 'cover';
    card.style.backgroundPosition = 'center';
    card.style.backgroundRepeat = 'no-repeat';
    card.classList.add('story-hero-card--with-bg');
  }

  // Модификатор недели (слева)
  if (weekData.story_mod_icon) {
    const mainMod = document.createElement('div');
    mainMod.className = 'story-hero-mod-main';
    const path = getModIconPath(weekData.story_mod_icon, 'mods');
    const icon = createModIcon(path, weekData.story_mod || '');
    mainMod.appendChild(icon);
    card.appendChild(mainMod);
  }

  // Модификаторы глав (справа)
  const storyMods = weekData.story_mods || {};
  const chapterKeys = ['chapter1', 'chapter2', 'chapter3'];
  
  // Собираем все модификаторы из всех глав
  const allMods = [];
  chapterKeys.forEach((key) => {
    const chapterData = storyMods[key];
    const mods = normalizeChapterMods(chapterData);
    
    // Если глава не пустая, добавляем все её модификаторы
    if (mods && mods.length > 0) {
      allMods.push(...mods);
    }
  });

  if (allMods.length > 0) {
    const chaptersContainer = document.createElement('div');
    chaptersContainer.className = 'story-hero-mod-chapters';

    allMods.forEach((mod) => {
      const path = getModIconPath(mod.slug, 'story_mods');
      const icon = createModIcon(path, mod.title || '');
      chaptersContainer.appendChild(icon);
    });

    card.appendChild(chaptersContainer);
  }

  root.appendChild(card);
}

function normalizeChapterMods(chapterData) {
  // Если пустая строка - вернуть null
  if (chapterData === '' || chapterData === null || chapterData === undefined) {
    return null;
  }
  
  // Если это массив - вернуть как есть
  if (Array.isArray(chapterData)) {
    return chapterData.filter(mod => mod && mod.slug); // Фильтруем валидные элементы
  }
  
  // Если это объект с slug - вернуть как массив из одного элемента
  if (typeof chapterData === 'object' && chapterData.slug) {
    return [chapterData];
  }
  
  // В остальных случаях - вернуть null
  return null;
}

function renderModifiersCard(root, weekData) {
  const card = document.createElement('section');
  card.className = 'card';

  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = 'Модификаторы';
  card.appendChild(title);

  // Модификатор недели
  const weekLabel = document.createElement('div');
  weekLabel.className = 'muted';
  weekLabel.textContent = 'Модификатор недели';
  card.appendChild(weekLabel);

  if (weekData.story_mod_icon || weekData.story_mod) {
    const row = document.createElement('div');
    row.className = 'story-mod-row';

    if (weekData.story_mod_icon) {
      const img = document.createElement('img');
      img.src = getModIconPath(weekData.story_mod_icon, 'mods');
      img.alt = weekData.story_mod || '';
      img.decoding = 'async';
      img.loading = 'lazy';
      row.appendChild(img);
    }

    const text = document.createElement('div');
    text.textContent = weekData.story_mod || '—';
    row.appendChild(text);

    card.appendChild(row);
  }

  // Модификаторы глав
  const chaptersLabel = document.createElement('div');
  chaptersLabel.className = 'muted';
  chaptersLabel.textContent = 'Модификаторы глав';
  card.appendChild(chaptersLabel);

  const storyMods = weekData.story_mods || {};
  const chapterDefs = [
    { key: 'chapter1', label: 'Глава 1' },
    { key: 'chapter2', label: 'Глава 2' },
    { key: 'chapter3', label: 'Глава 3' },
  ];

  chapterDefs.forEach(({ key, label }) => {
    const chapterData = storyMods[key];
    const mods = normalizeChapterMods(chapterData);
    
    // Пропускаем пустые главы
    if (!mods || mods.length === 0) return;

    const row = document.createElement('div');
    row.className = 'story-mod-row';

    // Добавляем иконки для всех модификаторов
    mods.forEach((mod) => {
      const img = document.createElement('img');
      img.src = getModIconPath(mod.slug, 'story_mods');
      img.alt = mod.title || '';
      img.decoding = 'async';
      img.loading = 'lazy';
      row.appendChild(img);
    });

    // Формируем текст: "Глава X — Название1, Название2"
    const titles = mods.map(mod => mod.title || '').filter(title => title);
    const text = document.createElement('div');
    text.textContent = `${label} — ${titles.join(', ')}`;
    row.appendChild(text);

    card.appendChild(row);
  });

  root.appendChild(card);
}

function renderScrollsCard(root, weekData, scrollBlock) {
  const card = document.createElement('section');
  card.className = 'card';

  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = 'Свиток Гёдзена';
  const icon = document.createElement('img');
  icon.src = getSystemIconPath('scroll.svg');
  icon.alt = '';
  icon.className = 'card-title-icon';
  title.appendChild(icon);
  card.appendChild(title);

  if (!scrollBlock || !scrollBlock.scroll) {
    const hint = document.createElement('div');
    hint.className = 'muted';
    hint.textContent = 'Нет данных по свиткам для этой карты.';
    card.appendChild(hint);
    root.appendChild(card);
    return;
  }

  const storySlug = weekData.story_slug;
  const entries = Object.entries(scrollBlock.scroll);
  if (!entries.length) {
    const hint = document.createElement('div');
    hint.className = 'muted';
    hint.textContent = 'Нет данных по свиткам для этой карты.';
    card.appendChild(hint);
    root.appendChild(card);
    return;
  }

  // Сортируем по ключу как по строке (этого достаточно, ключи уже в нужном формате)
  entries.sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0));

  entries.forEach(([key, description]) => {
    const chapterTitle = document.createElement('div');
    chapterTitle.className = 'story-scroll-title';
    chapterTitle.textContent = `Глава ${key}`;
    card.appendChild(chapterTitle);

    const imagesRow = document.createElement('div');
    imagesRow.className = 'story-scroll-images';

    const img1 = document.createElement('img');
    img1.src = getStaticAssetPath(`./assets/scrolls/${storySlug}/${key}.jpg`);
    img1.alt = `Свиток ${key}`;
    img1.decoding = 'async';
    img1.loading = 'lazy';

    const img2 = document.createElement('img');
    img2.src = getStaticAssetPath(`./assets/scrolls/${storySlug}/${key}_.jpg`);
    img2.alt = `Свиток ${key} (обратная сторона)`;
    img2.decoding = 'async';
    img2.loading = 'lazy';

    imagesRow.appendChild(img1);
    imagesRow.appendChild(img2);

    // Открытие в лайтбоксе с масштабированием
    img1.addEventListener('click', () => {
      hapticTapSmart();
      openLightbox(img1.src);
    });
    img2.addEventListener('click', () => {
      hapticTapSmart();
      openLightbox(img2.src);
    });
    card.appendChild(imagesRow);

    const desc = document.createElement('p');
    desc.className = 'story-scroll-description';
    desc.textContent = description || '';
    card.appendChild(desc);
  });

  root.appendChild(card);
}

export async function openStoryScreen() {
  const screen = document.getElementById('storyScreen');
  if (!screen) return;

  // Полностью пересоздаём корневой контейнер, чтобы исключить дублирование
  screen.innerHTML = '';
  const root = document.createElement('div');
  root.id = 'storyRoot';
  screen.appendChild(root);

  // Параллельно загружаем всё нужное
  const [currentWeek, rotationJson, storyConfig] = await Promise.all([
    loadCurrentWeek(),
    loadRotationData(),
    loadStoryConfig(),
  ]);

  if (!rotationJson || !Array.isArray(rotationJson)) {
    root.textContent = 'Данные сюжета недоступны. Попробуйте позже.';
    return;
  }

  const weekData = getWeekData(currentWeek);
  if (!weekData || !weekData.story_slug) {
    root.textContent = 'Данные сюжета недоступны. Попробуйте позже.';
    return;
  }

  setTopbar(true, weekData.story || 'Сюжет');

  renderHeroCard(root, weekData);
  renderModifiersCard(root, weekData);

  const scrollBlock = storyConfig ? getScrollBlock(weekData.story_slug, storyConfig) : null;
  renderScrollsCard(root, weekData, scrollBlock);
}


