// builds.js
import { tg, $, hapticTapSmart, hapticOK, hapticERR, hideKeyboard } from './telegram.js';
import { showScreen, focusAndScrollIntoView, setTopbar } from './ui.js';
import { renderChips, activeValues, setActive, shake } from './profile.js';

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

let currentBuildId = null;
let shot1Data = null;
let shot2Data = null;

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
  try { const raw = localStorage.getItem(LS_KEY_BUILDS); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
function saveBuilds(arr){
  try { localStorage.setItem(LS_KEY_BUILDS, JSON.stringify(arr||[])); return true; }
  catch {
    tg?.showPopup?.({
      title: 'Хранилище заполнено',
      message: 'Не удалось сохранить билд: лимит хранения исчерпан. Уменьшите размер скриншотов или удалите старые билды.',
      buttons: [{ type:'ok' }]
    });
    hapticERR();
    return false;
  }
}
function loadPublicBuilds() {
  try { const raw = localStorage.getItem(LS_KEY_PUB_BUILDS); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
function savePublicBuilds(arr) {
  try { localStorage.setItem(LS_KEY_PUB_BUILDS, JSON.stringify(arr||[])); return true; }
  catch { return false; }
}

// Рендер списков
function renderMyBuilds() {
  const items = loadBuilds();
  myBuildsList.innerHTML = '';
  if (!items.length) { noBuildsHint.classList.remove('hidden'); return; }
  noBuildsHint.classList.add('hidden');

  items.slice().reverse().forEach((b) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'build-item';
    row.setAttribute('data-id', b.id);

    const icon = document.createElement('div');
    icon.className = 'build-icon';
    const img = document.createElement('img');
    img.alt = b.class || 'Класс';
    img.src = CLASS_ICON[b.class] || CLASS_ICON['Самурай'];
    icon.appendChild(img);

    const title = document.createElement('div');
    title.className = 'build-title';
    
    const nameDiv = document.createElement('div');
    const name = (b.name || 'Без названия').toString();
    nameDiv.textContent = name;
    
    const dateDiv = document.createElement('div');
    dateDiv.className = 'build-author';
    try {
      const d = new Date(b.createdAt);
      dateDiv.textContent = isNaN(d.getTime()) ? '—' : 'Создан: ' + d.toLocaleDateString('ru-RU');
    } catch {
      dateDiv.textContent = '—';
    }
    
    title.appendChild(nameDiv);
    title.appendChild(dateDiv);

    row.appendChild(icon);
    row.appendChild(title);
    row.addEventListener('click', () => { hapticTapSmart(); openBuildDetail(b.id); });
    myBuildsList.appendChild(row);
  });
}
function renderAllBuilds() {
  const items = loadPublicBuilds();
  allBuildsList.innerHTML = '';
  if (!items.length) { noAllBuildsHint.classList.remove('hidden'); return; }
  noAllBuildsHint.classList.add('hidden');

  items.slice().reverse().forEach((p) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'build-item';
    row.setAttribute('data-id', p.id);

    const icon = document.createElement('div');
    icon.className = 'build-icon';
    const img = document.createElement('img');
    img.alt = p.class || 'Класс';
    img.src = CLASS_ICON[p.class] || CLASS_ICON['Самурай'];
    icon.appendChild(img);

    const title = document.createElement('div');
    title.className = 'build-title';
    
    const nameDiv = document.createElement('div');
    const name = (p.name || 'Без названия').toString();
    nameDiv.textContent = name;
    
    const authorDiv = document.createElement('div');
    authorDiv.className = 'build-author';
    authorDiv.textContent = 'Автор: ' + (p.author || '—');
    
    title.appendChild(nameDiv);
    title.appendChild(authorDiv);

    row.appendChild(icon);
    row.appendChild(title);
    row.addEventListener('click', () => { hapticTapSmart(); openPublicBuildDetail(p.id); });
    allBuildsList.appendChild(row);
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
    if (name.length > 26) name = name.slice(0, 26);

    const klass = activeValues(classChipsEl)[0] || '';
    const tags  = activeValues(tagsChipsEl);
    const desc  = (buildDescEl?.value || '').trim();

    if (!name)   { shake(buildNameEl); hapticERR(); focusAndScrollIntoView(buildNameEl); return; }
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

  renderMyBuilds();
  renderAllBuilds();
}
