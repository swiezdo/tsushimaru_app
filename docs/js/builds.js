// builds.js
import { tg, $, hapticTapSmart, hapticOK, hapticERR, hideKeyboard } from './telegram.js';
import { showScreen, focusAndScrollIntoView, setTopbar } from './ui.js';
import { renderChips, activeValues, setActive, shake, createButton, validateBuildName, formatDate } from './utils.js';
import { createBuild, getMyBuilds, getPublicBuilds, toggleBuildPublish, deleteBuild, updateBuild, createComment, getBuildComments, toggleReaction, getReactions, API_BASE } from './api.js';

const CLASS_VALUES = ['Самурай','Охотник','Убийца','Ронин'];
const TAG_VALUES   = ['HellMode','Соло','Выживание','Спидран','Набег','Сюжет','Соперники','Ключевой урон','Без дыма','Негативные эффекты'];

const CLASS_ICON = {
  'Самурай':'./assets/icons/samurai.svg',
  'Охотник':'./assets/icons/hunter.svg',
  'Убийца':'./assets/icons/assassin.svg',
  'Ронин':'./assets/icons/ronin.svg'
};

// Элементы
const myBuildsList     = $('myBuildsList');
const noBuildsHint     = $('noBuildsHint');
const createBuildBtn   = $('createBuildBtn');

const buildForm        = $('buildForm');
const buildNameEl      = $('build_name');
const buildNameError   = $('buildNameError');
const buildDescEl      = $('build_desc');

const classChipsEl     = $('classChips');
const tagsChipsEl      = $('tagsChips');

const shotInput1       = $('build_shot1');
const shotInput2       = $('build_shot2');
const shotsTwo         = $('shotsTwo');

const buildSubmitBtn   = $('buildSubmitBtn');

const vd_class         = $('vd_class');
const vd_tags          = $('vd_tags');
const vd_desc          = $('vd_desc');
const buildDetailShots = $('buildDetailShots');
const vd_build_id       = $('vd_build_id');

const publishBuildBtn  = $('publishBuildBtn');
const deleteBuildBtn   = $('deleteBuildBtn');
const buildEditBtn     = $('buildEditBtn');

// Элементы формы редактирования
const buildEditForm        = $('buildEditForm');
const buildEditNameEl      = $('buildEdit_name');
const buildEditNameError   = $('buildEditNameError');
const buildEditDescEl      = $('buildEdit_desc');

const classEditChipsEl     = $('classEditChips');
const tagsEditChipsEl      = $('tagsEditChips');

const shotEditInput1       = $('buildEdit_shot1');
const shotEditInput2       = $('buildEdit_shot2');
const shotsEditTwo         = $('shotsEditTwo');

const buildEditSubmitBtn   = $('buildEditSubmitBtn');

let editingBuildId = null;
let shotEdit1Data = null;
let shotEdit2Data = null;
let shotEdit1OriginalUrl = null;
let shotEdit2OriginalUrl = null;

// Публичные детали
const pd_class          = $('pd_class');
const pd_tags           = $('pd_tags');
const pd_desc           = $('pd_desc');
const pd_author         = $('pd_author');
const pd_date           = $('pd_date');
const publicDetailShots = $('publicDetailShots');
const pd_build_id       = $('pd_build_id');

// Реакции (лайки/дизлайки)
const likeBtn           = $('likeBtn');
const dislikeBtn        = $('dislikeBtn');
const likesCount         = $('likesCount');
const dislikesCount     = $('dislikesCount');

// Списки «Все билды»
const allBuildsList   = $('allBuildsList');
const noAllBuildsHint = $('noAllBuildsHint');
const noFilteredBuildsHint = $('noFilteredBuildsHint');
const classTabsContainer = $('classTabsContainer');

// Элементы фильтров
const filterModal = $('filterModal');
const filterModalTitle = $('filterModalTitle');
const filterModalOptions = $('filterModalOptions');
const filterModalOkBtn = $('filterModalOkBtn');

let currentBuildId = null;
let currentPublicBuildId = null; // ID открытого публичного билда для комментариев
let shot1Data = null;
let shot2Data = null;

// Состояние фильтров
let selectedClasses = [];
let selectedTags = [];
let currentFilterType = null;
let sortType = 'newest'; // 'newest' - сначала новые, 'oldest' - сначала старые, 'most_likes' - больше лайков, 'most_dislikes' - больше дизлайков

async function compressImageFile(file, { maxEdge = 1280, quality = 0.7 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        const scale = Math.min(1, maxEdge / Math.max(width, height));
        const w = Math.max(1, Math.round(width * scale));
        const h = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (e) { reject(e); }
    };
    img.onerror = reject;
    const r = new FileReader();
    r.onload = () => { img.src = r.result; };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function getShotInputByIdx(idx) { return idx === '1' ? shotInput1 : shotInput2; }
function getShotEditInputByIdx(idx) { return idx === '1' ? shotEditInput1 : shotEditInput2; }
function renderShotThumb(idx, src) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'shot-thumb';
  btn.dataset.idx = String(idx);
  const img = document.createElement('img');
  img.src = src;
  btn.appendChild(img);
  btn.addEventListener('click', () => {
    hapticTapSmart();
    const input = getShotInputByIdx(String(idx));
    if (!input) return;
    try { input.value = ''; } catch {}
    input.click();
  });
  return btn;
}

// Storage - УДАЛЕНО, теперь работаем через API

// Универсальная функция создания элемента билда
function createBuildElement(build, isPublic = false) {
  const row = createButton('button', 'build-item', '', { id: build.build_id || build.id });

  // Добавляем класс 'published' для опубликованных билдов в разделе "Мои билды"
  if (!isPublic && build.is_public === 1) {
    row.classList.add('published');
  }

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
  
  // Проверяем, опубликован ли билд (для показа статистики в "Мои билды")
  const isPublished = build.is_public === 1;
  
  if (isPublic) {
    // Для публичных билдов создаем flex контейнер с автором слева и статистикой справа
    const authorText = document.createElement('span');
    authorText.textContent = build.author || '—';
    
    // Блок статистики справа
    const statsDiv = document.createElement('div');
    statsDiv.className = 'build-stats';
    
    // Добавляем три элемента статистики
    // ВАЖНО: Если статистика показывает неправильные значения (лайки = комментарии),
    // возможно сервер возвращает данные в другом формате или с другими именами полей
    // Проверяем разные возможные варианты имен полей
    const commentsCount = build.comments_count || build.commentsCount || 0;
    let likesCount = build.likes_count || build.likesCount || 0;
    let dislikesCount = build.dislikes_count || build.dislikesCount || 0;
    
    // Если статистика реакций находится в отдельном объекте
    if (build.reactions) {
      likesCount = build.reactions.likes_count || build.reactions.likesCount || likesCount;
      dislikesCount = build.reactions.dislikes_count || build.reactions.dislikesCount || dislikesCount;
    }
    
    // Временная отладка: если количество лайков совпадает с комментариями и больше 0,
    // возможно проблема в данных сервера
    if (commentsCount > 0 && likesCount === commentsCount && !build.reactions) {
      console.warn('Возможная проблема: likes_count совпадает с comments_count для билда', build.build_id);
    }
    
    statsDiv.appendChild(createStatItem('./assets/icons/comments.svg', commentsCount, 'Комментарии'));
    statsDiv.appendChild(createStatItem('./assets/icons/like.svg', likesCount, 'Лайки'));
    statsDiv.appendChild(createStatItem('./assets/icons/dislike.svg', dislikesCount, 'Дизлайки'));
    
    metaDiv.appendChild(authorText);
    metaDiv.appendChild(statsDiv);
  } else if (isPublished) {
    // Для опубликованных билдов в "Мои билды" показываем дату создания слева и статистику справа
    const dateStr = build.created_at ? formatDate(new Date(build.created_at * 1000)) : '—';
    const dateText = document.createElement('span');
    dateText.textContent = dateStr;
    
    // Блок статистики справа
    const statsDiv = document.createElement('div');
    statsDiv.className = 'build-stats';
    
    // Добавляем три элемента статистики
    // ВАЖНО: Если статистика показывает неправильные значения (лайки = комментарии),
    // возможно сервер возвращает данные в другом формате или с другими именами полей
    // Проверяем разные возможные варианты имен полей
    const commentsCount = build.comments_count || build.commentsCount || 0;
    let likesCount = build.likes_count || build.likesCount || 0;
    let dislikesCount = build.dislikes_count || build.dislikesCount || 0;
    
    // Если статистика реакций находится в отдельном объекте
    if (build.reactions) {
      likesCount = build.reactions.likes_count || build.reactions.likesCount || likesCount;
      dislikesCount = build.reactions.dislikes_count || build.reactions.dislikesCount || dislikesCount;
    }
    
    // Временная отладка: если количество лайков совпадает с комментариями и больше 0,
    // возможно проблема в данных сервера
    if (commentsCount > 0 && likesCount === commentsCount && !build.reactions) {
      console.warn('Возможная проблема: likes_count совпадает с comments_count для билда', build.build_id);
    }
    
    statsDiv.appendChild(createStatItem('./assets/icons/comments.svg', commentsCount, 'Комментарии'));
    statsDiv.appendChild(createStatItem('./assets/icons/like.svg', likesCount, 'Лайки'));
    statsDiv.appendChild(createStatItem('./assets/icons/dislike.svg', dislikesCount, 'Дизлайки'));
    
    metaDiv.appendChild(dateText);
    metaDiv.appendChild(statsDiv);
  } else {
    // Для неопубликованных билдов показываем только дату
    const dateStr = build.created_at ? formatDate(new Date(build.created_at * 1000)) : '—';
    metaDiv.textContent = dateStr === '—' ? '—' : 'Создан: ' + dateStr;
  }
  
  title.appendChild(nameDiv);
  title.appendChild(metaDiv);

  row.appendChild(icon);
  row.appendChild(title);
  
  const clickHandler = isPublic ? 
    () => { hapticTapSmart(); openPublicBuildDetail(build.build_id || build.id); } :
    () => { hapticTapSmart(); openBuildDetail(build.build_id || build.id); };
  
  row.addEventListener('click', clickHandler);
  return row;
}

// Универсальная функция рендеринга списка билдов
function renderBuildsList(container, items, emptyHint, isPublic = false) {
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!items.length) {
    if (emptyHint) emptyHint.classList.remove('hidden');
    return;
  }
  
  if (emptyHint) emptyHint.classList.add('hidden');
  
  // Используем DocumentFragment для оптимизации
  const fragment = document.createDocumentFragment();
  // Сортировка: для «Все билды» по sortType, для «Мои билды» всегда новые сверху
  const currentSortType = isPublic ? sortType : 'newest';
  const sorted = items.slice().sort((a, b) => {
    if (currentSortType === 'newest' || currentSortType === 'oldest') {
      // Сортировка по дате создания
      const ca = Number(a?.created_at || 0);
      const cb = Number(b?.created_at || 0);
      return currentSortType === 'newest' ? (cb - ca) : (ca - cb);
    } else if (currentSortType === 'most_likes') {
      // Сортировка по количеству лайков (по убыванию)
      const likesA = Number(a?.likes_count || a?.likesCount || 0);
      const likesB = Number(b?.likes_count || b?.likesCount || 0);
      // Если лайки одинаковые, сортируем по дате (новые сверху)
      if (likesA === likesB) {
        const ca = Number(a?.created_at || 0);
        const cb = Number(b?.created_at || 0);
        return cb - ca;
      }
      return likesB - likesA;
    } else if (currentSortType === 'most_dislikes') {
      // Сортировка по количеству дизлайков (по убыванию)
      const dislikesA = Number(a?.dislikes_count || a?.dislikesCount || 0);
      const dislikesB = Number(b?.dislikes_count || b?.dislikesCount || 0);
      // Если дизлайки одинаковые, сортируем по дате (новые сверху)
      if (dislikesA === dislikesB) {
        const ca = Number(a?.created_at || 0);
        const cb = Number(b?.created_at || 0);
        return cb - ca;
      }
      return dislikesB - dislikesA;
    }
    // По умолчанию - новые сверху
    const ca = Number(a?.created_at || 0);
    const cb = Number(b?.created_at || 0);
    return cb - ca;
  });
  sorted.forEach(build => {
    fragment.appendChild(createBuildElement(build, isPublic));
  });
  
  container.appendChild(fragment);
}

// Рендер списков
function renderMyBuilds() {
  return getMyBuilds().then(builds => {
    renderBuildsList(myBuildsList, builds, noBuildsHint, false);
  }).catch(err => {
    tg?.showAlert?.('Ошибка загрузки моих билдов: ' + err);
    hapticERR();
  });
}
// Функции фильтрации
function filterBuilds(builds) {
  return builds.filter(build => {
    // Проверка классов (OR внутри категории)
    const classMatch = selectedClasses.length === 0 || 
      selectedClasses.includes(build.class);
    
    // Проверка тегов (OR внутри категории)
    const tagsMatch = selectedTags.length === 0 || 
      (build.tags && build.tags.some(tag => selectedTags.includes(tag)));
    
    // AND между категориями
    return classMatch && tagsMatch;
  });
}

function updateFilterSelection(type, value) {
  if (type === 'class') {
    const index = selectedClasses.indexOf(value);
    if (index > -1) {
      selectedClasses.splice(index, 1);
    } else {
      selectedClasses.push(value);
    }
  } else if (type === 'tags') {
    const index = selectedTags.indexOf(value);
    if (index > -1) {
      selectedTags.splice(index, 1);
    } else {
      selectedTags.push(value);
    }
  }
  
  updateFilterButtons();
  updateClassTabs();
  applyFilters();
}

function updateFilterButtons() {
  // Функция больше не нужна, но оставляем для совместимости
  // Кнопка "Сбросить" удалена
}

function applyFilters() {
  return getPublicBuilds().then(builds => {
    const filteredItems = filterBuilds(builds);
    renderFilteredBuilds(filteredItems);
  }).catch(err => {
    tg?.showAlert?.('Ошибка загрузки публичных билдов: ' + err);
    hapticERR();
  });
}

function renderFilteredBuilds(items) {
  // Скрываем все подсказки
  noAllBuildsHint.classList.add('hidden');
  noFilteredBuildsHint.classList.add('hidden');
  
  if (!items.length) {
    // Очищаем контейнер, если нет результатов
    if (allBuildsList) {
      allBuildsList.innerHTML = '';
    }
    // Показываем соответствующую подсказку
    if (selectedClasses.length > 0 || selectedTags.length > 0) {
      noFilteredBuildsHint.classList.remove('hidden');
    } else {
      noAllBuildsHint.classList.remove('hidden');
    }
    return;
  }

  renderBuildsList(allBuildsList, items, null, true);
}

function renderClassTabs() {
  if (!classTabsContainer) return;
  
  classTabsContainer.innerHTML = '';
  
  // Создаем вкладки для каждого класса
  CLASS_VALUES.forEach(className => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'class-tab';
    tab.dataset.class = className;
    if (selectedClasses.includes(className)) {
      tab.classList.add('active');
    }
    
    const icon = document.createElement('img');
    icon.src = CLASS_ICON[className];
    icon.alt = className;
    tab.appendChild(icon);
    
    tab.addEventListener('click', () => {
      hapticTapSmart();
      // Переключаем выбор класса (добавляем/удаляем из массива)
      const index = selectedClasses.indexOf(className);
      if (index > -1) {
        selectedClasses.splice(index, 1);
      } else {
        selectedClasses.push(className);
      }
      updateClassTabs();
      applyFilters();
    });
    
    classTabsContainer.appendChild(tab);
  });
  
  // Создаем вкладку тегов
  const tagsTab = document.createElement('button');
  tagsTab.type = 'button';
  tagsTab.className = 'class-tab';
  tagsTab.dataset.type = 'tags';
  if (selectedTags.length > 0) {
    tagsTab.classList.add('active');
  }
  
  const tagsIcon = document.createElement('img');
  tagsIcon.src = './assets/icons/tag.svg';
  tagsIcon.alt = 'Теги';
  tagsTab.appendChild(tagsIcon);
  
  tagsTab.addEventListener('click', () => {
    hapticTapSmart();
    openFilterModal('tags');
  });
  
  classTabsContainer.appendChild(tagsTab);

  // Кнопка сортировки справа
  const sortTab = document.createElement('button');
  sortTab.type = 'button';
  sortTab.className = 'class-tab sort-tab';
  const sortIcon = document.createElement('img');
  sortIcon.src = './assets/icons/sort.svg';
  sortIcon.alt = 'Сортировка';
  // Устанавливаем заголовок в зависимости от текущего типа сортировки
  const sortTitles = {
    'newest': 'Сначала новые',
    'oldest': 'Сначала старые',
    'most_likes': 'Больше лайков',
    'most_dislikes': 'Больше дизлайков'
  };
  sortTab.title = sortTitles[sortType] || 'Сортировка';
  // Подсветка активного состояния если не выбрано "сначала новые" (по умолчанию)
  if (sortType !== 'newest') {
    sortTab.classList.add('active');
  }
  sortTab.appendChild(sortIcon);
  sortTab.addEventListener('click', () => {
    hapticTapSmart();
    openSortModal();
  });
  classTabsContainer.appendChild(sortTab);
}

function updateClassTabs() {
  if (!classTabsContainer) return;
  
  const tabs = classTabsContainer.querySelectorAll('.class-tab');
  tabs.forEach(tab => {
    const tabClass = tab.dataset.class;
    const tabType = tab.dataset.type;
    
    if (tabType === 'tags') {
      // Для вкладки тегов проверяем наличие выбранных тегов
      tab.classList.toggle('active', selectedTags.length > 0);
    } else if (tabClass && selectedClasses.includes(tabClass)) {
      // Для вкладки класса проверяем наличие в массиве selectedClasses
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

function renderAllBuilds() {
  renderClassTabs();
  return applyFilters();
}

// Управление модальным окном фильтров
function openFilterModal(type) {
  currentFilterType = type;
  
  if (!filterModal || !filterModalTitle || !filterModalOptions) return;
  
  // Устанавливаем заголовок
  if (type === 'class') {
    filterModalTitle.textContent = 'Класс';
    renderModalOptions(CLASS_VALUES, selectedClasses);
  } else if (type === 'tags') {
    filterModalTitle.textContent = 'Теги';
    renderModalOptions(TAG_VALUES, selectedTags);
  }
  
  filterModal.classList.remove('hidden');
}

function renderModalOptions(values, selectedValues) {
  if (!filterModalOptions) return;
  
  filterModalOptions.innerHTML = '';
  
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
      updateFilterSelection(currentFilterType, e.target.value);
    });
    
    filterModalOptions.appendChild(label);
  });
}

function closeFilterModal() {
  if (filterModal) {
    filterModal.classList.add('hidden');
  }
  currentFilterType = null;
}

// Управление модальным окном сортировки
function openSortModal() {
  if (!filterModal || !filterModalTitle || !filterModalOptions) return;
  
  // Устанавливаем заголовок
  filterModalTitle.textContent = 'Сортировка';
  renderSortOptions();
  
  filterModal.classList.remove('hidden');
}

function renderSortOptions() {
  if (!filterModalOptions) return;
  
  filterModalOptions.innerHTML = '';
  
  const sortOptions = [
    { value: 'newest', label: 'Сначала новые' },
    { value: 'oldest', label: 'Сначала старые' },
    { value: 'most_likes', label: 'Больше лайков' },
    { value: 'most_dislikes', label: 'Больше дизлайков' }
  ];
  
  sortOptions.forEach(option => {
    const label = document.createElement('label');
    label.className = 'filter-option';
    
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'sortType';
    radio.value = option.value;
    radio.checked = sortType === option.value;
    
    const span = document.createElement('span');
    span.textContent = option.label;
    
    label.appendChild(radio);
    label.appendChild(span);
    
    radio.addEventListener('change', (e) => {
      hapticTapSmart();
      if (e.target.checked) {
        sortType = option.value;
      }
    });
    
    filterModalOptions.appendChild(label);
  });
}

// Создание билда
function resetBuildForm() {
  try { buildForm?.reset(); } catch {}
  setActive(classChipsEl, []); setActive(tagsChipsEl,  []);
  if (shotInput1) shotInput1.value = '';
  if (shotInput2) shotInput2.value = '';
  shot1Data = null; shot2Data = null;

  if (shotsTwo) {
    shotsTwo.innerHTML = `
      <button type="button" class="upload-box" data-idx="1" aria-label="Загрузить первое изображение">＋</button>
      <button type="button" class="upload-box" data-idx="2" aria-label="Загрузить второе изображение">＋</button>
    `;
  }
  if (buildDescEl) buildDescEl.style.height = 'auto';
  buildNameError?.classList.add('hidden');
}

// Функции для редактирования билда
function resetEditForm() {
  try { buildEditForm?.reset(); } catch {}
  setActive(classEditChipsEl, []); setActive(tagsEditChipsEl, []);
  if (shotEditInput1) shotEditInput1.value = '';
  if (shotEditInput2) shotEditInput2.value = '';
  shotEdit1Data = null;
  shotEdit2Data = null;
  shotEdit1OriginalUrl = null;
  shotEdit2OriginalUrl = null;
  editingBuildId = null;

  if (shotsEditTwo) {
    shotsEditTwo.innerHTML = `
      <button type="button" class="upload-box" data-idx="1" aria-label="Загрузить первое изображение">＋</button>
      <button type="button" class="upload-box" data-idx="2" aria-label="Загрузить второе изображение">＋</button>
    `;
  }
  if (buildEditDescEl) buildEditDescEl.style.height = 'auto';
  buildEditNameError?.classList.add('hidden');
}

function getShotEditBoxByIdx(idx) {
  return shotsEditTwo?.querySelector(`.upload-box[data-idx="${idx}"]`) ||
         shotsEditTwo?.querySelector(`.shot-thumb[data-idx="${idx}"]`);
}

function renderEditShotThumb(idx, src) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'shot-thumb';
  btn.dataset.idx = String(idx);
  const img = document.createElement('img');
  img.src = src;
  btn.appendChild(img);
  btn.addEventListener('click', () => {
    hapticTapSmart();
    const input = getShotEditInputByIdx(String(idx));
    if (!input) return;
    try { input.value = ''; } catch {}
    input.click();
  });
  return btn;
}

function bindShotEditInput(input, idx){
  input?.addEventListener('change', async ()=>{
    const file = input.files && input.files[0];
    if(!file) return;
    try{
      const data = await compressImageFile(file, { maxEdge: 1280, quality: 0.7 });
      const targetEl = getShotEditBoxByIdx(idx);
      const thumb = renderEditShotThumb(idx, data);
      if(targetEl && targetEl.parentNode){ targetEl.parentNode.replaceChild(thumb, targetEl); }
      else if (shotsEditTwo){ shotsEditTwo.appendChild(thumb); }
      if(idx === '1') {
        shotEdit1Data = data;
        shotEdit1OriginalUrl = null; // Помечаем что фото изменено
      } else {
        shotEdit2Data = data;
        shotEdit2OriginalUrl = null; // Помечаем что фото изменено
      }
      hapticTapSmart();
    }catch(_){ shake(shotsEditTwo); }
  });
}

function populateEditForm(build) {
  if (!build) return;

  // Заполняем название и описание
  if (buildEditNameEl) buildEditNameEl.value = build.name || '';
  if (buildEditDescEl) {
    buildEditDescEl.value = build.description || build.desc || '';
    // Высота будет установлена после показа экрана в openBuildEdit
    // Здесь просто устанавливаем значение
  }

  // Выбираем класс и теги
  if (build.class) setActive(classEditChipsEl, [build.class]);
  if (build.tags && build.tags.length) setActive(tagsEditChipsEl, build.tags);

  // Отображаем существующие фото
  if (shotsEditTwo) {
    shotsEditTwo.innerHTML = '';
    
    if (build.photo_1) {
      const fullUrl = build.photo_1.startsWith('http') ? build.photo_1 : `${API_BASE}${build.photo_1}`;
      shotEdit1OriginalUrl = fullUrl;
      // Добавляем timestamp для предотвращения кеширования при редактировании
      const urlWithCacheBust = `${fullUrl}?t=${Date.now()}`;
      const thumb = renderEditShotThumb('1', urlWithCacheBust);
      shotsEditTwo.appendChild(thumb);
    } else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'upload-box';
      btn.dataset.idx = '1';
      btn.setAttribute('aria-label', 'Загрузить первое изображение');
      btn.textContent = '＋';
      shotsEditTwo.appendChild(btn);
    }

    if (build.photo_2) {
      const fullUrl = build.photo_2.startsWith('http') ? build.photo_2 : `${API_BASE}${build.photo_2}`;
      shotEdit2OriginalUrl = fullUrl;
      // Добавляем timestamp для предотвращения кеширования при редактировании
      const urlWithCacheBust = `${fullUrl}?t=${Date.now()}`;
      const thumb = renderEditShotThumb('2', urlWithCacheBust);
      shotsEditTwo.appendChild(thumb);
    } else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'upload-box';
      btn.dataset.idx = '2';
      btn.setAttribute('aria-label', 'Загрузить второе изображение');
      btn.textContent = '＋';
      shotsEditTwo.appendChild(btn);
    }
  }

  // Сбрасываем флаги изменений фото
  shotEdit1Data = null;
  shotEdit2Data = null;
}

function openBuildEdit(buildId) {
  getMyBuilds().then(builds => {
    const b = builds.find((x) => String(x.build_id || x.id) === String(buildId));
    if (!b) { 
      tg?.showAlert?.('Билд не найден'); 
      return; 
    }
    
    editingBuildId = b.build_id || b.id;
    populateEditForm(b);
    showScreen('buildEdit');
    
    // ОБЯЗАТЕЛЬНО вызываем авто-рост ПОСЛЕ показа экрана, чтобы элемент был видимым
    // и scrollHeight рассчитывался правильно
    if (buildEditDescEl) {
      // Используем несколько подходов для надежности
      const updateHeight = () => {
        buildEditDescEl.style.height = 'auto';
        const scrollHeight = buildEditDescEl.scrollHeight;
        buildEditDescEl.style.height = Math.min(scrollHeight, 200) + 'px';
      };
      
      // Вызываем через requestAnimationFrame для правильного расчета после рендера
      requestAnimationFrame(() => {
        updateHeight();
        // Также через небольшую задержку на случай если DOM еще не полностью обновился
        setTimeout(() => {
          updateHeight();
          // Еще одна попытка через небольшую задержку для надежности
          setTimeout(updateHeight, 50);
        }, 50);
      });
    }
  }).catch(err => {
    tg?.showAlert?.('Ошибка загрузки билда для редактирования: ' + err);
    hapticERR();
  });
}

function getShotBoxByIdx(idx) {
  return shotsTwo?.querySelector(`.upload-box[data-idx="${idx}"]`) ||
         shotsTwo?.querySelector(`.shot-thumb[data-idx="${idx}"]`);
}
function bindShotInput(input, idx){
  input?.addEventListener('change', async ()=>{
    const file = input.files && input.files[0];
    if(!file) return;
    try{
      const data = await compressImageFile(file, { maxEdge: 1280, quality: 0.7 });
      const targetEl = getShotBoxByIdx(idx);
      const thumb = renderShotThumb(idx, data);
      if(targetEl && targetEl.parentNode){ targetEl.parentNode.replaceChild(thumb, targetEl); }
      else if (shotsTwo){ shotsTwo.appendChild(thumb); }
      if(idx === '1') shot1Data = data; else shot2Data = data;
      hapticTapSmart();
    }catch(_){ shake(shotsTwo); }
  });
}

function updatePublishButton(myId) {
  if (!publishBuildBtn) return;
  
  // Получаем текущий статус билда из списка моих билдов
  getMyBuilds().then(builds => {
    const currentBuild = builds.find(b => (b.build_id || b.id) === myId);
    if (!currentBuild) {
      publishBuildBtn.textContent = 'Опубликовать';
      publishBuildBtn.classList.add('primary');
      publishBuildBtn.classList.remove('danger');
      return;
    }
    
    const isPublic = currentBuild.is_public === 1;
    if (isPublic) {
      publishBuildBtn.textContent = 'Скрыть';
      publishBuildBtn.classList.remove('primary');
      publishBuildBtn.classList.add('danger');
    } else {
      publishBuildBtn.textContent = 'Опубликовать';
      publishBuildBtn.classList.add('primary');
      publishBuildBtn.classList.remove('danger');
    }
  }).catch(err => {
    publishBuildBtn.textContent = 'Опубликовать';
    publishBuildBtn.classList.add('primary');
    publishBuildBtn.classList.remove('danger');
  });
}

// Открытие карточек
function formatTopbarTitle(name, maxChars = 18) {
  if (!name || name.length <= maxChars) return name;
  
  // Ищем последний пробел до maxChars, чтобы не разбивать слово
  let splitIndex = maxChars;
  for (let i = maxChars; i >= 0; i--) {
    if (name[i] === ' ') {
      splitIndex = i;
      break;
    }
  }
  
  // Если пробел не найден, разбиваем по maxChars
  if (splitIndex === maxChars && name[maxChars] !== ' ') {
    splitIndex = maxChars;
  }
  
  return name.substring(0, splitIndex).trim() + '\n' + name.substring(splitIndex).trim();
}

async function shareBuildCommand(buildId) {
  const command = `/билд ${buildId}`;
  
  try {
    // Пытаемся использовать современный Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(command);
      hapticOK();
      tg?.showPopup?.({
        title: 'Поделиться билдом',
        message: 'Команда скопирована! Вставьте её в чат',
        buttons: [{ type: 'ok' }]
      });
    } else {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = command;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          hapticOK();
          tg?.showPopup?.({
            title: 'Поделиться билдом',
            message: 'Команда скопирована! Вставьте её в чат',
            buttons: [{ type: 'ok' }]
          });
        } else {
          throw new Error('execCommand failed');
        }
      } catch (err) {
        document.body.removeChild(textArea);
        throw err;
      }
    }
  } catch (error) {
    console.error('Ошибка копирования в буфер обмена:', error);
    hapticERR();
    tg?.showPopup?.({
      title: 'Ошибка',
      message: 'Не удалось скопировать команду. Скопируйте вручную: ' + command,
      buttons: [{ type: 'ok' }]
    });
  }
}

function openBuildDetail(id) {
  getMyBuilds().then(builds => {
    const b = builds.find((x) => String(x.build_id || x.id) === String(id));
    if (!b) { tg?.showAlert?.('Билд не найден'); return; }
    currentBuildId = b.build_id || b.id;

    if (deleteBuildBtn) deleteBuildBtn.dataset.id = String(b.build_id || b.id);

    vd_class.textContent = b.class || '—';
    vd_tags.textContent  = (b.tags && b.tags.length) ? b.tags.join(', ') : '—';
    vd_desc.textContent  = b.description || b.desc || '—';
    if (vd_build_id) {
      const buildIdVal = b.build_id || b.id;
      vd_build_id.textContent = buildIdVal ? `#${buildIdVal}` : '—';
    }

    // Настройка кнопки поделиться
    const vd_build_share_btn = $('vd_build_share_btn');
    if (vd_build_share_btn) {
      const buildId = b.build_id || b.id;
      vd_build_share_btn.setAttribute('data-build-id', buildId);
      
      // Удаляем старый обработчик, если он есть
      vd_build_share_btn.removeEventListener('click', vd_build_share_btn._shareClickHandler);
      
      // Создаем новый обработчик клика для поделиться
      vd_build_share_btn._shareClickHandler = () => {
        shareBuildCommand(buildId);
      };
      
      // Добавляем обработчик клика
      vd_build_share_btn.addEventListener('click', vd_build_share_btn._shareClickHandler);
    }

    buildDetailShots.innerHTML = '';
    const shots = [b.photo_1, b.photo_2].filter(Boolean);
    shots.forEach((photoPath) => {
      const fullUrl = photoPath.startsWith('http') ? photoPath : `${API_BASE}${photoPath}`;
      // Добавляем timestamp для предотвращения кеширования
      const urlWithCacheBust = `${fullUrl}?t=${Date.now()}`;
      const wrap = document.createElement('button');
      wrap.type = 'button';
      wrap.className = 'shot-thumb';
      const img = document.createElement('img');
      img.src = urlWithCacheBust;
      wrap.appendChild(img);
      wrap.addEventListener('click', () => openLightbox(fullUrl));
      buildDetailShots.appendChild(wrap);
    });

    updatePublishButton(b.build_id || b.id);
    showScreen('buildDetail');
    setTopbar(true, formatTopbarTitle(b.name || 'Билд')); // Устанавливаем название билда в topbar ПОСЛЕ showScreen
  }).catch(err => {
    tg?.showAlert?.('Ошибка загрузки моего билда: ' + err);
    hapticERR();
  });
}
function openPublicBuildDetail(pubId) {
  getPublicBuilds().then(pubs => {
    const p = pubs.find(x => String(x.build_id || x.id) === String(pubId));
    if (!p) { tg?.showAlert?.('Публикация не найдена'); return; }

    pd_class.textContent = p.class || '—';
    pd_tags.textContent  = (p.tags && p.tags.length) ? p.tags.join(', ') : '—';
    pd_desc.textContent  = p.description || p.desc || '—';
    if (pd_build_id) {
      const buildIdVal = p.build_id || p.id;
      pd_build_id.textContent = buildIdVal ? `#${buildIdVal}` : '—';
    }
    
    // Настройка кликабельного чипа автора
    if (pd_author) {
      pd_author.textContent = p.author || '—';
      
      // Удаляем старый обработчик, если он есть
      pd_author.removeEventListener('click', pd_author._authorClickHandler);
      
      // Создаем новый обработчик клика для перехода к профилю автора
      pd_author._authorClickHandler = () => {
        hapticTapSmart();
        if (p.user_id) {
          // Сохраняем информацию о том, откуда мы пришли
          sessionStorage.setItem('previousScreen', `buildPublicDetail:${pubId}`);
          
          // Импортируем и вызываем функцию открытия профиля участника
          import('./participantDetail.js').then(module => {
            module.openParticipantDetail(p.user_id);
          }).catch(error => {
            console.error('Ошибка импорта participantDetail.js:', error);
            tg?.showAlert?.('Ошибка открытия профиля автора');
          });
        } else {
          tg?.showAlert?.('Информация об авторе недоступна');
        }
      };
      
      // Добавляем обработчик клика
      pd_author.addEventListener('click', pd_author._authorClickHandler);
    }

    // Настройка кнопки поделиться
    const pd_build_share_btn = $('pd_build_share_btn');
    if (pd_build_share_btn) {
      const buildId = p.build_id || p.id;
      pd_build_share_btn.setAttribute('data-build-id', buildId);
      
      // Удаляем старый обработчик, если он есть
      pd_build_share_btn.removeEventListener('click', pd_build_share_btn._shareClickHandler);
      
      // Создаем новый обработчик клика для поделиться
      pd_build_share_btn._shareClickHandler = () => {
        shareBuildCommand(buildId);
      };
      
      // Добавляем обработчик клика
      pd_build_share_btn.addEventListener('click', pd_build_share_btn._shareClickHandler);
    }

    try {
      const d = new Date(p.created_at * 1000);
      pd_date.textContent = isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU');
    } catch { pd_date.textContent = '—'; }

    publicDetailShots.innerHTML = '';
    const shots = [p.photo_1, p.photo_2].filter(Boolean);
    shots.forEach((photoPath) => {
      const fullUrl = photoPath.startsWith('http') ? photoPath : `${API_BASE}${photoPath}`;
      // Добавляем timestamp для предотвращения кеширования
      const urlWithCacheBust = `${fullUrl}?t=${Date.now()}`;
      const wrap = document.createElement('button');
      wrap.type = 'button';
      wrap.className = 'shot-thumb';
      const img = document.createElement('img');
      img.src = urlWithCacheBust;
      wrap.appendChild(img);
      wrap.addEventListener('click', () => openLightbox(fullUrl));
      publicDetailShots.appendChild(wrap);
    });

    showScreen('buildPublicDetail');
    setTopbar(true, formatTopbarTitle(p.name || 'Билд')); // Устанавливаем название билда в topbar ПОСЛЕ showScreen
    
    // Сохраняем ID текущего публичного билда для комментариев
    currentPublicBuildId = pubId;
    
    // Загружаем реакции для этого билда
    loadBuildReactions(pubId);
    
    // Загружаем комментарии для этого билда
    loadPublicBuildComments(pubId);
  }).catch(err => {
    tg?.showAlert?.('Ошибка загрузки публичной публикации: ' + err);
    hapticERR();
  });
}

// Лайтбокс с поддержкой масштабирования
const lightbox = $('lightbox');
const lightboxImg = $('lightboxImg');

// Состояние масштабирования
let currentScale = 1;
let minScale = 0.5;
let maxScale = 5;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let imageOffset = { x: 0, y: 0 };
let lastTouchDistance = 0;

function updateImageTransform() {
  if (!lightboxImg) return;
  
  const translateX = imageOffset.x;
  const translateY = imageOffset.y;
  
  lightboxImg.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
}

function resetImageTransform() {
  currentScale = 1;
  imageOffset = { x: 0, y: 0 };
  updateImageTransform();
}

function handleDoubleTap(event) {
  event.preventDefault();
  
  if (currentScale > 1) {
    resetImageTransform();
  } else {
    currentScale = 2;
    updateImageTransform();
  }
}

function handleTouchStart(event) {
  if (event.touches.length === 1) {
    // Одиночное касание - начало перетаскивания
    isDragging = true;
    const touch = event.touches[0];
    dragStart = { x: touch.clientX, y: touch.clientY };
  } else if (event.touches.length === 2) {
    // Двойное касание - начало масштабирования
    isDragging = false;
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    lastTouchDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }
}

function handleTouchMove(event) {
  event.preventDefault();
  
  if (event.touches.length === 1 && isDragging && currentScale > 1) {
    // Перетаскивание
    const touch = event.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;
    
    imageOffset.x += deltaX / currentScale;
    imageOffset.y += deltaY / currentScale;
    
    dragStart = { x: touch.clientX, y: touch.clientY };
    updateImageTransform();
  } else if (event.touches.length === 2) {
    // Масштабирование жестом
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    
    if (lastTouchDistance > 0) {
      const scaleChange = currentDistance / lastTouchDistance;
      const newScale = Math.max(minScale, Math.min(maxScale, currentScale * scaleChange));
      
      if (newScale !== currentScale) {
        currentScale = newScale;
        updateImageTransform();
      }
    }
    
    lastTouchDistance = currentDistance;
  }
}

function handleTouchEnd(event) {
  isDragging = false;
  lastTouchDistance = 0;
}

function openLightbox(src) {
  if (!lightbox || !lightboxImg) return;
  
  lightboxImg.src = src;
  lightbox.classList.remove('hidden');
  
  // Сбрасываем состояние при открытии
  resetImageTransform();
  
  // Добавляем обработчики событий
  lightboxImg.addEventListener('dblclick', handleDoubleTap);
  lightboxImg.addEventListener('touchstart', handleTouchStart, { passive: false });
  lightboxImg.addEventListener('touchmove', handleTouchMove, { passive: false });
  lightboxImg.addEventListener('touchend', handleTouchEnd);
}

function closeLightbox() {
  if (!lightbox) return;
  
  lightbox.classList.add('hidden');
  
  // Удаляем обработчики событий
  lightboxImg.removeEventListener('dblclick', handleDoubleTap);
  lightboxImg.removeEventListener('touchstart', handleTouchStart);
  lightboxImg.removeEventListener('touchmove', handleTouchMove);
  lightboxImg.removeEventListener('touchend', handleTouchEnd);
  
  // Сбрасываем состояние
  resetImageTransform();
}

// Закрытие лайтбокса при клике на фон
lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    closeLightbox();
  }
});

// Подтверждение
function tgConfirm(title, message) {
  if (!tg?.showPopup) return Promise.resolve(window.confirm(message || title));
  return new Promise((resolve) => {
    const handler = (e) => {
      tg.offEvent('popupClosed', handler);
      // Если button_id равен 'cancel' или пользователь закрыл popup без нажатия кнопки
      // то возвращаем false (отмена), иначе true (подтверждение)
      resolve(e?.button_id !== 'cancel' && e?.button_id !== undefined);
    };
    tg.onEvent('popupClosed', handler);
    tg.showPopup({
      title: title || 'Подтверждение',
      message: message || '',
      buttons: [
        { id: 'cancel', type: 'cancel' },
        { id: 'ok', type: 'ok' }
      ]
    });
  });
}

async function deleteBuildById(id) {
  try {
    await deleteBuild(id);
    
    // Обновляем оба списка параллельно
    await Promise.all([
      renderMyBuilds(),
      renderAllBuilds()
    ]);
    
    // Возвращаемся на страницу билдов
    showScreen('builds');
    
    // Показываем сообщение об успехе
    await new Promise(resolve => {
      tg?.showPopup?.({ 
        title: 'Удалено', 
        message: 'Билд удалён.', 
        buttons: [{ type:'ok' }] 
      });
      // Даем время на обновление UI
      setTimeout(resolve, 100);
    });
  } catch (err) {
    tg?.showAlert?.('Ошибка удаления билда: ' + err);
    hapticERR();
  }
}

// Инициализация
export function initBuilds() {
  renderChips(classChipsEl, CLASS_VALUES, { single: true });
  renderChips(tagsChipsEl,  TAG_VALUES);

  // Авто-рост описания
  if (buildDescEl) {
    const autoResize = () => {
      buildDescEl.style.height = 'auto';
      buildDescEl.style.height = Math.min(buildDescEl.scrollHeight, 200) + 'px';
    };
    buildDescEl.addEventListener('input', autoResize);
    setTimeout(autoResize, 0);
  }

  // Tap при фокусе полей — глобальный скролл сам подвинет
  buildNameEl?.addEventListener('focus', ()=>{ hapticTapSmart(); }, {passive:true});
  buildDescEl?.addEventListener('focus', ()=>{ hapticTapSmart(); }, {passive:true});
  
  // Скрывать ошибку при начале редактирования названия
  buildNameEl?.addEventListener('input', ()=>{ buildNameError?.classList.add('hidden'); });

  // «＋ Создать билд» — OK
  createBuildBtn?.addEventListener('click', () => {
    hapticOK();
    resetBuildForm();
    showScreen('buildCreate');
  });

  // Слоты изображений
  bindShotInput(shotInput1, '1');
  bindShotInput(shotInput2, '2');

  // Делегирование клика по квадратам
  shotsTwo?.addEventListener('click', (e) => {
    hapticTapSmart();
    const box = e.target.closest('.upload-box');
    if (!box) return;
    const idx = box.dataset.idx;
    const input = getShotInputByIdx(idx);
    if (!input) return;
    try { input.value = ''; } catch {}
    input.click();
  });

  // Сабмит
  buildSubmitBtn?.addEventListener('click', () => buildForm?.requestSubmit());
  buildForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    let name = (buildNameEl?.value || '').trim();
    if (name.length > 40) name = name.slice(0, 40);

    const klass = activeValues(classChipsEl)[0] || '';
    const tags  = activeValues(tagsChipsEl);
    const desc  = (buildDescEl?.value || '').trim();

    if (!name)   { shake(buildNameEl); hapticERR(); focusAndScrollIntoView(buildNameEl); return; }
    
    if (!validateBuildName(name)) {
      buildNameError?.classList.remove('hidden');
      shake(buildNameEl);
      hapticERR();
      focusAndScrollIntoView(buildNameEl);
      return;
    }
    
    if (!klass)  { shake(classChipsEl); hapticERR(); focusAndScrollIntoView(classChipsEl); return; }
    if (!shot1Data || !shot2Data) { shake(shotsTwo); hapticERR(); focusAndScrollIntoView(shotsTwo); return; }

    // Конвертируем Data URL в Blob для отправки
    const dataURLtoBlob = (dataurl) => {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], {type: mime});
    };

    const photo1Blob = dataURLtoBlob(shot1Data);
    const photo2Blob = dataURLtoBlob(shot2Data);
    photo1Blob.name = 'photo1.jpg';
    photo2Blob.name = 'photo2.jpg';

    createBuild({
      name,
      class: klass,
      tags,
      description: desc,
      photo_1: photo1Blob,
      photo_2: photo2Blob
    }).then((response) => {
      hapticOK();
      tg?.showPopup?.({ title: 'Билд создан', message: 'Билд успешно сохранен!', buttons: [{ type:'ok' }] });

      // Обновляем список билдов в фоне
      renderMyBuilds();
      
      // Переходим на страницу деталей только что созданного билда
      const buildId = response.build_id;
      if (buildId) {
        openBuildDetail(buildId);
      } else {
        // Fallback на случай, если build_id не пришел
        showScreen('builds');
      }
    }).catch(err => {
      tg?.showAlert?.('Ошибка создания билда: ' + err);
      hapticERR();
    });
  });

  // Инициализация формы редактирования
  renderChips(classEditChipsEl, CLASS_VALUES, { single: true });
  renderChips(tagsEditChipsEl, TAG_VALUES);

  // Авто-рост описания для редактирования
  if (buildEditDescEl) {
    const autoResizeEdit = () => {
      buildEditDescEl.style.height = 'auto';
      buildEditDescEl.style.height = Math.min(buildEditDescEl.scrollHeight, 200) + 'px';
    };
    buildEditDescEl.addEventListener('input', autoResizeEdit);
    // Также вызываем при изменении значения программно
    buildEditDescEl.addEventListener('change', autoResizeEdit);
    setTimeout(autoResizeEdit, 0);
  }

  // Tap при фокусе полей редактирования
  buildEditNameEl?.addEventListener('focus', ()=>{ hapticTapSmart(); }, {passive:true});
  buildEditDescEl?.addEventListener('focus', ()=>{ hapticTapSmart(); }, {passive:true});
  
  // Скрывать ошибку при начале редактирования названия
  buildEditNameEl?.addEventListener('input', ()=>{ buildEditNameError?.classList.add('hidden'); });

  // Слоты изображений для редактирования
  bindShotEditInput(shotEditInput1, '1');
  bindShotEditInput(shotEditInput2, '2');

  // Делегирование клика по квадратам редактирования
  shotsEditTwo?.addEventListener('click', (e) => {
    hapticTapSmart();
    const box = e.target.closest('.upload-box');
    if (!box) return;
    const idx = box.dataset.idx;
    const input = getShotEditInputByIdx(idx);
    if (!input) return;
    try { input.value = ''; } catch {}
    input.click();
  });

  // Сабмит формы редактирования
  buildEditSubmitBtn?.addEventListener('click', () => buildEditForm?.requestSubmit());
  buildEditForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!editingBuildId) {
      tg?.showAlert?.('Ошибка: билд для редактирования не найден');
      return;
    }

    let name = (buildEditNameEl?.value || '').trim();
    if (name.length > 40) name = name.slice(0, 40);

    const klass = activeValues(classEditChipsEl)[0] || '';
    const tags  = activeValues(tagsEditChipsEl);
    const desc  = (buildEditDescEl?.value || '').trim();

    if (!name)   { shake(buildEditNameEl); hapticERR(); focusAndScrollIntoView(buildEditNameEl); return; }
    
    if (!validateBuildName(name)) {
      buildEditNameError?.classList.remove('hidden');
      shake(buildEditNameEl);
      hapticERR();
      focusAndScrollIntoView(buildEditNameEl);
      return;
    }
    
    if (!klass)  { shake(classEditChipsEl); hapticERR(); focusAndScrollIntoView(classEditChipsEl); return; }
    
    // Проверяем наличие фото (либо новых, либо старых)
    if (!shotEdit1Data && !shotEdit1OriginalUrl) { 
      shake(shotsEditTwo); 
      hapticERR(); 
      focusAndScrollIntoView(shotsEditTwo); 
      return; 
    }
    if (!shotEdit2Data && !shotEdit2OriginalUrl) { 
      shake(shotsEditTwo); 
      hapticERR(); 
      focusAndScrollIntoView(shotsEditTwo); 
      return; 
    }

    // Конвертируем Data URL в Blob для отправки
    const dataURLtoBlob = (dataurl) => {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], {type: mime});
    };

    // Подготавливаем данные для отправки
    const buildData = {
      name,
      class: klass,
      tags,
      description: desc,
    };

    // Выполняем обновление после подготовки всех данных
    Promise.resolve().then(async () => {
      // Добавляем фото только если они были изменены (есть новые данные)
      // Если фото не изменены, не отправляем их - бэкенд сохранит существующие
      if (shotEdit1Data) {
        const photo1Blob = dataURLtoBlob(shotEdit1Data);
        photo1Blob.name = 'photo1.jpg';
        buildData.photo_1 = photo1Blob;
      }

      if (shotEdit2Data) {
        const photo2Blob = dataURLtoBlob(shotEdit2Data);
        photo2Blob.name = 'photo2.jpg';
        buildData.photo_2 = photo2Blob;
      }
      
      return updateBuild(editingBuildId, buildData);
    }).then((response) => {
      hapticOK();
      tg?.showPopup?.({ title: 'Билд обновлён', message: 'Билд успешно обновлён!', buttons: [{ type:'ok' }] });

      // Обновляем список билдов в фоне
      renderMyBuilds();
      renderAllBuilds();
      
      // Ждем немного чтобы данные обновились, затем переходим на страницу деталей
      setTimeout(() => {
        openBuildDetail(editingBuildId);
      }, 300);
    }).catch(err => {
      tg?.showAlert?.('Ошибка обновления билда: ' + err);
      hapticERR();
    });
  });

  // Кнопка редактирования
  buildEditBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hapticOK();
    if (!currentBuildId) return;
    openBuildEdit(currentBuildId);
  });

  // Также обрабатываем клик по изображению внутри кнопки
  const editBtnImg = buildEditBtn?.querySelector('img');
  if (editBtnImg) {
    editBtnImg.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hapticOK();
      if (!currentBuildId) return;
      openBuildEdit(currentBuildId);
    });
  }

  // Публикация/Скрытие — OK
  publishBuildBtn?.addEventListener('click', () => {
    hapticOK();
    if (!currentBuildId) return;

    // Определяем текущий статус и переключаем его
    getMyBuilds().then(builds => {
      const currentBuild = builds.find(b => (b.build_id || b.id) === currentBuildId);
      if (!currentBuild) return;
      
      const isCurrentlyPublic = currentBuild.is_public === 1;
      const newStatus = !isCurrentlyPublic;
      
      toggleBuildPublish(currentBuildId, newStatus).then(() => {
        updatePublishButton(currentBuildId);
        renderMyBuilds();
        renderAllBuilds();
        tg?.showPopup?.({ 
          title: newStatus ? 'Опубликовано' : 'Скрыто', 
          message: newStatus ? 'Билд успешно опубликован.' : 'Билд успешно снят с публикации.', 
          buttons:[{type:'ok'}] 
        });
      }).catch(err => {
        tg?.showAlert?.('Ошибка публикации/скрытия билда: ' + err);
        hapticERR();
      });
    }).catch(err => {
      tg?.showAlert?.('Ошибка получения билда: ' + err);
      hapticERR();
    });
  });

  // Удаление — OK
  deleteBuildBtn?.addEventListener('click', async () => {
    hapticOK();
    const idFromBtn = deleteBuildBtn?.dataset?.id;
    const id = idFromBtn ?? currentBuildId;
    if (!id) { tg?.showAlert?.('Не удалось определить билд для удаления.'); return; }
    const ok = await tgConfirm('Удалить билд', 'Вы уверены, что хотите удалить этот билд?');
    if (!ok) return;
    deleteBuildById(String(id));
  });

  // Обработчик кнопки ОК в модальном окне
  if (filterModalOkBtn) {
    filterModalOkBtn.addEventListener('click', () => {
      hapticOK();
      closeFilterModal();
      // Если это была модалка сортировки, обновляем список и вкладки
      if (filterModalTitle?.textContent === 'Сортировка') {
        renderClassTabs();
        applyFilters();
      }
    });
  }
  
  // Закрытие модального окна при клике на фон
  if (filterModal) {
    filterModal.addEventListener('click', (e) => {
      if (e.target === filterModal) {
        closeFilterModal();
      }
    });
  }

  renderMyBuilds();
  renderAllBuilds();
  
  // Инициализация формы комментариев
  initCommentForm();
  
  // Инициализация обработчиков реакций
  if (likeBtn) {
    likeBtn.addEventListener('click', () => {
      hapticTapSmart();
      handleReactionClick('like');
    });
  }
  
  if (dislikeBtn) {
    dislikeBtn.addEventListener('click', () => {
      hapticTapSmart();
      handleReactionClick('dislike');
    });
  }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С КОММЕНТАРИЯМИ ==========

function loadPublicBuildComments(buildId) {
  const commentsList = $('publicCommentsList');
  if (!commentsList) return;
  
  getBuildComments(buildId).then(comments => {
    renderPublicComments(comments);
  }).catch(err => {
    console.error('Ошибка загрузки комментариев:', err);
    if (commentsList) {
      commentsList.innerHTML = '<div class="hint muted">Ошибка загрузки комментариев</div>';
    }
  });
}

function renderPublicComments(comments) {
  const commentsList = $('publicCommentsList');
  if (!commentsList) return;
  
  // Находим заголовок карточки с комментариями
  const commentsCard = commentsList.closest('.card');
  const commentsTitle = commentsCard?.querySelector('.card-title');
  
  // Обновляем заголовок с количеством комментариев
  if (commentsTitle) {
    commentsTitle.textContent = `Комментарии (${comments.length})`;
  }
  
  commentsList.innerHTML = '';
  
  if (comments.length === 0) {
    const emptyHint = document.createElement('div');
    emptyHint.className = 'hint muted';
    emptyHint.textContent = 'Пока нет комментариев. Будьте первым!';
    commentsList.appendChild(emptyHint);
    return;
  }
  
  comments.forEach(comment => {
    const commentItem = document.createElement('div');
    commentItem.className = 'comment-item';
    
    const authorDiv = document.createElement('div');
    authorDiv.className = 'comment-author';
    
    // Добавляем аватарку
    const avatarImg = document.createElement('img');
    avatarImg.className = 'comment-avatar';
    const avatarSrc = comment.avatar_url 
        ? `${API_BASE}${comment.avatar_url}` 
        : './assets/default-avatar.svg';
    avatarImg.src = avatarSrc;
    avatarImg.alt = comment.author || 'Автор';
    
    // Текст с ником (чип, как у автора билда)
    const authorName = document.createElement('button');
    authorName.type = 'button';
    authorName.className = 'author-chip';
    authorName.textContent = comment.author || 'Неизвестный пользователь';
    
    // Обработчик клика для перехода к профилю
    if (comment.user_id) {
      authorName.addEventListener('click', () => {
        hapticTapSmart();
        // Сохраняем информацию о том, откуда мы пришли
        sessionStorage.setItem('previousScreen', `buildPublicDetail:${currentPublicBuildId}`);
        
        // Импортируем и вызываем функцию открытия профиля участника
        import('./participantDetail.js').then(module => {
          module.openParticipantDetail(comment.user_id);
        }).catch(error => {
          console.error('Ошибка импорта participantDetail.js:', error);
          tg?.showAlert?.('Ошибка открытия профиля автора');
        });
      });
    }
    
    authorDiv.appendChild(avatarImg);
    authorDiv.appendChild(authorName);
    
    const dateDiv = document.createElement('div');
    dateDiv.className = 'comment-date';
    try {
      const d = new Date(comment.created_at * 1000);
      dateDiv.textContent = isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU');
    } catch {
      dateDiv.textContent = '—';
    }
    
    const textDiv = document.createElement('div');
    textDiv.className = 'comment-text';
    textDiv.textContent = comment.comment_text || '';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'comment-header';
    headerDiv.appendChild(authorDiv);
    headerDiv.appendChild(dateDiv);
    
    commentItem.appendChild(headerDiv);
    commentItem.appendChild(textDiv);
    
    commentsList.appendChild(commentItem);
  });
}

// Инициализация обработчика формы комментария
function initCommentForm() {
  const commentForm = $('publicCommentForm');
  const commentText = $('publicCommentText');
  
  if (!commentForm || !commentText) return;
  
  // Автоматическое изменение высоты textarea при вводе
  const autoResizeComment = () => {
    commentText.style.height = 'auto';
    commentText.style.height = Math.min(commentText.scrollHeight, 200) + 'px';
  };
  commentText.addEventListener('input', autoResizeComment);
  // Устанавливаем начальную высоту
  setTimeout(autoResizeComment, 0);
  
  // Удаляем старый обработчик, если он есть
  if (commentForm._submitHandler) {
    commentForm.removeEventListener('submit', commentForm._submitHandler);
  }
  
  // Создаем новый обработчик
  commentForm._submitHandler = async (e) => {
    e.preventDefault();
    
    const text = (commentText.value || '').trim();
    
    if (!text) {
      shake(commentText);
      hapticERR();
      return;
    }
    
    // Получаем build_id из публичного билда через открытый билд
    // Используем pubId из openPublicBuildDetail, сохраняем его в переменную модуля
    if (!currentPublicBuildId) {
      tg?.showAlert?.('Не удалось определить билд для комментария');
      hapticERR();
      return;
    }
    
    const buildId = currentPublicBuildId;
    
    // Отключаем форму на время отправки
    const submitBtn = commentForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';
    }
    
    try {
      await createComment(buildId, text);
      
      // Очищаем поле ввода
      commentText.value = '';
      // Сбрасываем высоту textarea
      commentText.style.height = 'auto';
      
      // Перезагружаем комментарии
      await loadPublicBuildComments(buildId);
      
      hapticOK();
    } catch (error) {
      console.error('Ошибка отправки комментария:', error);
      hapticERR();
      
      let errorMessage = 'Не удалось отправить комментарий.';
      if (error.status === 401) {
        errorMessage = 'Ошибка авторизации. Попробуйте перезапустить приложение.';
      } else if (error.status === 400) {
        errorMessage = error.message || 'Проверьте правильность заполнения полей.';
      } else if (error.status >= 500) {
        errorMessage = 'Ошибка сервера. Попробуйте позже.';
      } else if (!navigator.onLine) {
        errorMessage = 'Нет подключения к интернету.';
      }
      
      tg?.showPopup?.({
        title: 'Ошибка',
        message: errorMessage,
        buttons: [{ type: 'ok' }]
      });
    } finally {
      // Восстанавливаем кнопку
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  };
  
  commentForm.addEventListener('submit', commentForm._submitHandler);
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С РЕАКЦИЯМИ (ЛАЙКИ/ДИЗЛАЙКИ) ==========

function loadBuildReactions(buildId) {
  if (!likeBtn || !dislikeBtn || !likesCount || !dislikesCount) return;
  
  getReactions(buildId).then(reactions => {
    updateReactionsUI(reactions);
  }).catch(err => {
    console.error('Ошибка загрузки реакций:', err);
    // Устанавливаем нулевые значения при ошибке
    updateReactionsUI({
      likes_count: 0,
      dislikes_count: 0,
      current_user_reaction: null
    });
  });
}

function updateReactionsUI(reactions) {
  if (!likeBtn || !dislikeBtn || !likesCount || !dislikesCount) return;
  
  // Обновляем счетчики
  likesCount.textContent = reactions.likes_count || 0;
  dislikesCount.textContent = reactions.dislikes_count || 0;
  
  // Обновляем состояние кнопок (активный/неактивный)
  // Удаляем все классы состояний
  likeBtn.classList.remove('liked');
  dislikeBtn.classList.remove('disliked');
  
  // Добавляем класс активного состояния, если пользователь поставил реакцию
  if (reactions.current_user_reaction === 'like') {
    likeBtn.classList.add('liked');
  } else if (reactions.current_user_reaction === 'dislike') {
    dislikeBtn.classList.add('disliked');
  }
}

function handleReactionClick(reactionType) {
  if (!currentPublicBuildId) {
    tg?.showAlert?.('Не удалось определить билд для реакции');
    hapticERR();
    return;
  }
  
  const buildId = currentPublicBuildId;
  
  // Отключаем кнопки на время запроса
  if (likeBtn) likeBtn.disabled = true;
  if (dislikeBtn) dislikeBtn.disabled = true;
  
  toggleReaction(buildId, reactionType).then(reactions => {
    updateReactionsUI(reactions);
    hapticOK();
  }).catch(err => {
    console.error('Ошибка переключения реакции:', err);
    hapticERR();
    
    let errorMessage = 'Не удалось изменить реакцию.';
    if (err.status === 401) {
      errorMessage = 'Ошибка авторизации. Попробуйте перезапустить приложение.';
    } else if (err.status >= 500) {
      errorMessage = 'Ошибка сервера. Попробуйте позже.';
    } else if (!navigator.onLine) {
      errorMessage = 'Нет подключения к интернету.';
    }
    
    tg?.showPopup?.({
      title: 'Ошибка',
      message: errorMessage,
      buttons: [{ type: 'ok' }]
    });
  }).finally(() => {
    // Восстанавливаем кнопки
    if (likeBtn) likeBtn.disabled = false;
    if (dislikeBtn) dislikeBtn.disabled = false;
  });
}

// Экспорт функций для использования в других модулях
export { openPublicBuildDetail };
