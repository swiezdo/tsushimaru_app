// builds.js
import { tg, $, hapticTapSmart, hapticOK, hapticERR, hideKeyboard } from './telegram.js';
import { showScreen, focusAndScrollIntoView, setTopbar } from './ui.js';
import { renderChips, activeValues, setActive, shake, createButton, validateBuildName, formatDate } from './utils.js';
import { createBuild, getMyBuilds, getPublicBuilds, toggleBuildPublish, deleteBuild, API_BASE } from './api.js';

const CLASS_VALUES = ['Самурай','Охотник','Убийца','Ронин'];
const TAG_VALUES   = ['HellMode','Соло','Выживание','Спидран','Набег','Сюжет','Соперники','Ключевой урон','Без дыма'];

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

// Storage - УДАЛЕНО, теперь работаем через API

// Универсальная функция создания элемента билда
function createBuildElement(build, isPublic = false) {
  const row = createButton('button', 'build-item', '', { id: build.build_id || build.id });

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
  items.slice().reverse().forEach(build => {
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

function renderAllBuilds() {
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

function openBuildDetail(id) {
  getMyBuilds().then(builds => {
    const b = builds.find((x) => String(x.build_id || x.id) === String(id));
    if (!b) { tg?.showAlert?.('Билд не найден'); return; }
    currentBuildId = b.build_id || b.id;

    if (deleteBuildBtn) deleteBuildBtn.dataset.id = String(b.build_id || b.id);

    vd_class.textContent = b.class || '—';
    vd_tags.textContent  = (b.tags && b.tags.length) ? b.tags.join(', ') : '—';
    vd_desc.textContent  = b.description || b.desc || '—';

    const vd_build_id = $('vd_build_id');
    if (vd_build_id) {
      vd_build_id.textContent = `#${b.build_id || b.id}`;
    }

    buildDetailShots.innerHTML = '';
    const shots = [b.photo_1, b.photo_2].filter(Boolean);
    shots.forEach((photoPath) => {
      const fullUrl = photoPath.startsWith('http') ? photoPath : `${API_BASE}${photoPath}`;
      const wrap = document.createElement('button');
      wrap.type = 'button';
      wrap.className = 'shot-thumb';
      const img = document.createElement('img');
      img.src = fullUrl;
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
    pd_author.textContent = p.author || '—';

    const pd_build_id = $('pd_build_id');
    if (pd_build_id) {
      pd_build_id.textContent = `#${p.build_id || p.id}`;
    }

    try {
      const d = new Date(p.created_at * 1000);
      pd_date.textContent = isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU');
    } catch { pd_date.textContent = '—'; }

    publicDetailShots.innerHTML = '';
    const shots = [p.photo_1, p.photo_2].filter(Boolean);
    shots.forEach((photoPath) => {
      const fullUrl = photoPath.startsWith('http') ? photoPath : `${API_BASE}${photoPath}`;
      const wrap = document.createElement('button');
      wrap.type = 'button';
      wrap.className = 'shot-thumb';
      const img = document.createElement('img');
      img.src = fullUrl;
      wrap.appendChild(img);
      wrap.addEventListener('click', () => openLightbox(fullUrl));
      publicDetailShots.appendChild(wrap);
    });

    showScreen('buildPublicDetail');
    setTopbar(true, formatTopbarTitle(p.name || 'Билд')); // Устанавливаем название билда в topbar ПОСЛЕ showScreen
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
    }).then(() => {
      hapticOK();
      tg?.showPopup?.({ title: 'Билд создан', message: 'Билд успешно сохранен!', buttons: [{ type:'ok' }] });

      renderMyBuilds();
      showScreen('builds');
    }).catch(err => {
      tg?.showAlert?.('Ошибка создания билда: ' + err);
      hapticERR();
    });
  });

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

// Экспорт функций для использования в других модулях
export { openPublicBuildDetail };
