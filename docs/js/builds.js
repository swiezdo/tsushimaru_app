// builds.js
import { tg, $, hapticTapSmart, hapticOK, hapticERR, hideKeyboard } from './telegram.js';
import { showScreen, focusAndScrollIntoView, setTopbar } from './ui.js';
import { renderChips, activeValues, setActive, shake, createButton, validateBuildName, formatDate, safeLocalStorageGet, safeLocalStorageSet } from './utils.js';

const LS_KEY_BUILDS      = 'tsu_builds_v1';
const LS_KEY_PUB_BUILDS  = 'tsu_builds_public_v1';

const CLASS_VALUES = ['Самурай','Охотник','Убийца','Ронин'];
const TAG_VALUES   = ['HellMode','Спидран','Соло','Сюжет','Соперники'];

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

const publishBuildBtn  = $('publishBuildBtn');
const deleteBuildBtn   = $('deleteBuildBtn');

// Публичные детали
const pd_class          = $('pd_class');
const pd_tags           = $('pd_tags');
const pd_desc           = $('pd_desc');
const pd_author         = $('pd_author');
const pd_date           = $('pd_date');
const publicDetailShots = $('publicDetailShots');

// Списки «Все билды»
const allBuildsList   = $('allBuildsList');
const noAllBuildsHint = $('noAllBuildsHint');
const noFilteredBuildsHint = $('noFilteredBuildsHint');

// Элементы фильтров
const classFilterBtn = $('classFilterBtn');
const tagsFilterBtn = $('tagsFilterBtn');
const resetFiltersBtn = $('resetFiltersBtn');
const filterModal = $('filterModal');
const filterModalTitle = $('filterModalTitle');
const filterModalOptions = $('filterModalOptions');
const filterModalOkBtn = $('filterModalOkBtn');

let currentBuildId = null;
let shot1Data = null;
let shot2Data = null;

// Состояние фильтров
let selectedClasses = [];
let selectedTags = [];
let currentFilterType = null;

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

// Storage
function loadBuilds() {
  return safeLocalStorageGet(LS_KEY_BUILDS, []);
}

function saveBuilds(arr) {
  const success = safeLocalStorageSet(LS_KEY_BUILDS, arr || []);
  if (!success) {
    tg?.showPopup?.({
      title: 'Хранилище заполнено',
      message: 'Не удалось сохранить билд: лимит хранения исчерпан. Уменьшите размер скриншотов или удалите старые билды.',
      buttons: [{ type:'ok' }]
    });
    hapticERR();
  }
  return success;
}

function loadPublicBuilds() {
  return safeLocalStorageGet(LS_KEY_PUB_BUILDS, []);
}

function savePublicBuilds(arr) {
  return safeLocalStorageSet(LS_KEY_PUB_BUILDS, arr || []);
}

// Универсальная функция создания элемента билда
function createBuildElement(build, isPublic = false) {
  const row = createButton('button', 'build-item', '', { id: build.id });

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
    const dateStr = formatDate(build.createdAt);
    metaDiv.textContent = dateStr === '—' ? '—' : 'Создан: ' + dateStr;
  }
  
  title.appendChild(nameDiv);
  title.appendChild(metaDiv);

  row.appendChild(icon);
  row.appendChild(title);
  
  const clickHandler = isPublic ? 
    () => { hapticTapSmart(); openPublicBuildDetail(build.id); } :
    () => { hapticTapSmart(); openBuildDetail(build.id); };
  
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
  items.slice().reverse().forEach(build => {
    fragment.appendChild(createBuildElement(build, isPublic));
  });
  
  container.appendChild(fragment);
}

// Рендер списков
function renderMyBuilds() {
  const items = loadBuilds();
  renderBuildsList(myBuildsList, items, noBuildsHint, false);
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
  applyFilters();
}

function updateFilterButtons() {
  // Обновляем текст кнопок с количеством выбранных элементов
  if (classFilterBtn) {
    const count = selectedClasses.length;
    classFilterBtn.textContent = count > 0 ? `Класс (${count})` : 'Класс';
    classFilterBtn.classList.toggle('active', count > 0);
  }
  
  if (tagsFilterBtn) {
    const count = selectedTags.length;
    tagsFilterBtn.textContent = count > 0 ? `Теги (${count})` : 'Теги';
    tagsFilterBtn.classList.toggle('active', count > 0);
  }
  
  // Показываем/скрываем кнопку "Сбросить" в зависимости от наличия активных фильтров
  if (resetFiltersBtn) {
    const hasActiveFilters = selectedClasses.length > 0 || selectedTags.length > 0;
    resetFiltersBtn.classList.toggle('hidden', !hasActiveFilters);
  }
}

function applyFilters() {
  const allItems = loadPublicBuilds();
  const filteredItems = filterBuilds(allItems);
  
  renderFilteredBuilds(filteredItems);
}

function renderFilteredBuilds(items) {
  // Скрываем все подсказки
  noAllBuildsHint.classList.add('hidden');
  noFilteredBuildsHint.classList.add('hidden');
  
  if (!items.length) {
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

function renderAllBuilds() {
  applyFilters();
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

function resetFilters() {
  selectedClasses = [];
  selectedTags = [];
  
  updateFilterButtons();
  applyFilters();
  closeFilterModal();
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

function isBuildPublished(myId) {
  const pubs = loadPublicBuilds();
  return pubs.some(p => String(p.originalId) === String(myId));
}
function updatePublishButton(myId) {
  if (!publishBuildBtn) return;
  const published = isBuildPublished(myId);
  if (published) {
    publishBuildBtn.textContent = 'Скрыть';
    publishBuildBtn.classList.remove('primary');
    publishBuildBtn.classList.add('danger');
  } else {
    publishBuildBtn.textContent = 'Опубликовать';
    publishBuildBtn.classList.add('primary');
    publishBuildBtn.classList.remove('danger');
  }
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

function openBuildDetail(id) {
  const all = loadBuilds();
  const b = all.find((x) => String(x.id) === String(id));
  if (!b) { tg?.showAlert?.('Билд не найден'); return; }
  currentBuildId = b.id;

  if (deleteBuildBtn) deleteBuildBtn.dataset.id = String(b.id);

  vd_class.textContent = b.class || '—';
  vd_tags.textContent  = (b.tags && b.tags.length) ? b.tags.join(', ') : '—';
  vd_desc.textContent  = b.desc || '—';

  buildDetailShots.innerHTML = '';
  (b.shots || []).forEach((src) => {
    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = 'shot-thumb';
    const img = document.createElement('img');
    img.src = src;
    wrap.appendChild(img);
    wrap.addEventListener('click', () => openLightbox(src));
    buildDetailShots.appendChild(wrap);
  });

  updatePublishButton(b.id);
  showScreen('buildDetail');
  setTopbar(true, formatTopbarTitle(b.name || 'Билд')); // Устанавливаем название билда в topbar ПОСЛЕ showScreen
}
function openPublicBuildDetail(pubId) {
  const pubs = loadPublicBuilds();
  const p = pubs.find(x => String(x.id) === String(pubId));
  if (!p) { tg?.showAlert?.('Публикация не найдена'); return; }

  pd_class.textContent = p.class || '—';
  pd_tags.textContent  = (p.tags && p.tags.length) ? p.tags.join(', ') : '—';
  pd_desc.textContent  = p.desc || '—';
  pd_author.textContent = p.author || '—';

  try {
    const d = new Date(p.publishedAt);
    pd_date.textContent = isNaN(d.getTime()) ? '—' : d.toLocaleString();
  } catch { pd_date.textContent = '—'; }

  publicDetailShots.innerHTML = '';
  (p.shots || []).forEach((src) => {
    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = 'shot-thumb';
    const img = document.createElement('img');
    img.src = src;
    wrap.appendChild(img);
    wrap.addEventListener('click', () => openLightbox(src));
    publicDetailShots.appendChild(wrap);
  });

  showScreen('buildPublicDetail');
  setTopbar(true, formatTopbarTitle(p.name || 'Билд')); // Устанавливаем название билда в topbar ПОСЛЕ showScreen
}

// Лайтбокс
const lightbox = $('lightbox');
const lightboxImg = $('lightboxImg');
function openLightbox(src) {
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightbox.classList.remove('hidden');
}
function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.add('hidden');
}
lightbox?.addEventListener('click', closeLightbox);

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

function deleteBuildById(id) {
  const rest = loadBuilds().filter((b) => String(b.id) !== String(id));
  if (!saveBuilds(rest)) return;

  const pubs = loadPublicBuilds();
  const pubsRest = pubs.filter(p => String(p.originalId) !== String(id));
  savePublicBuilds(pubsRest);

  renderMyBuilds();
  renderAllBuilds();
  tg?.showPopup?.({ title: 'Удалено', message: 'Билд удалён.', buttons: [{ type:'ok' }] });
  showScreen('builds');
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

    const item = {
      id: Date.now(),
      name,
      class: klass,
      tags,
      desc,
      shots: [shot1Data, shot2Data],
      createdAt: new Date().toISOString()
    };

    const all = loadBuilds();
    all.push(item);
    if (!saveBuilds(all)) { return; }

    hapticOK();
    tg?.showPopup?.({ title: 'Билд создан', message: 'Сохранено локально (макет, без сервера).', buttons: [{ type:'ok' }] });

    renderMyBuilds();
    showScreen('builds');
  });

  // Публикация/Скрытие — OK
  publishBuildBtn?.addEventListener('click', () => {
    hapticOK();
    if (!currentBuildId) return;

    const myAll = loadBuilds();
    const me = myAll.find(x => String(x.id) === String(currentBuildId));
    if (!me) return;

    const pubs = loadPublicBuilds();
    const already = pubs.find(p => String(p.originalId) === String(me.id));

    if (already) {
      const rest = pubs.filter(p => String(p.originalId) !== String(me.id));
      savePublicBuilds(rest);
      updatePublishButton(me.id);
      renderAllBuilds();
      tg?.showPopup?.({ title:'Скрыто', message:'Билд успешно снят с публикации.', buttons:[{type:'ok'}] });
      return;
    }

    const uname = tg?.initDataUnsafe?.user?.username || 'Гость';
    const pubItem = {
      id: `pub_${Date.now()}`,
      originalId: me.id,
      name: me.name,
      class: me.class,
      tags: me.tags || [],
      desc: me.desc || '',
      shots: me.shots || [],
      author: '@' + uname,
      publishedAt: new Date().toISOString()
    };

    pubs.push(pubItem);
    savePublicBuilds(pubs);
    updatePublishButton(me.id);
    renderAllBuilds();
    tg?.showPopup?.({ title:'Опубликовано', message:'Билд успешно опубликован.', buttons:[{type:'ok'}] });
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

  // Обработчики фильтров
  if (classFilterBtn) {
    classFilterBtn.addEventListener('click', () => {
      hapticTapSmart();
      openFilterModal('class');
    });
  }
  
  if (tagsFilterBtn) {
    tagsFilterBtn.addEventListener('click', () => {
      hapticTapSmart();
      openFilterModal('tags');
    });
  }
  
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      hapticTapSmart();
      resetFilters();
    });
  }
  
  // Обработчик кнопки ОК в модальном окне
  if (filterModalOkBtn) {
    filterModalOkBtn.addEventListener('click', () => {
      hapticOK();
      closeFilterModal();
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
}
