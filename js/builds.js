// builds.js
import { tg, $, hapticTap, hapticOK, hapticERR } from './telegram.js';
import { showScreen } from './ui.js';
import { renderChips, activeValues, setActive, shake } from './profile.js';

// ---------- Константы/пути ----------
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

// ---------- Элементы ----------
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

const buildDetailTitle = $('buildDetailTitle');
const vd_class         = $('vd_class');
const vd_tags          = $('vd_tags');
const vd_desc          = $('vd_desc');
const buildDetailShots = $('buildDetailShots');

const publishBuildBtn  = $('publishBuildBtn');
const deleteBuildBtn   = $('deleteBuildBtn');

// Публичные детали
const publicDetailTitle = $('publicDetailTitle');
const pd_class          = $('pd_class');
const pd_tags           = $('pd_tags');
const pd_desc           = $('pd_desc');
const pd_author         = $('pd_author');
const pd_date           = $('pd_date');
const publicDetailShots = $('publicDetailShots');

// Списки «Все билды»
const allBuildsList   = $('allBuildsList');
const noAllBuildsHint = $('noAllBuildsHint');

// ---------- Состояние ----------
let currentBuildId = null;
let shot1Data = null;
let shot2Data = null;

// ---------- Хелперы ----------
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
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
        canvas.width = w;
        canvas.height = h;
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
    if ((window.__tsuShouldHaptic?.() ?? true)) hapticTap();
    const input = getShotInputByIdx(String(idx));
    if (!input) return;
    try { input.value = ''; } catch {}
    input.click();
  });
  return btn;
}

// ---------- Storage ----------
function loadBuilds() {
  try {
    const raw = localStorage.getItem(LS_KEY_BUILDS);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}
function saveBuilds(arr){
  try{
    localStorage.setItem(LS_KEY_BUILDS, JSON.stringify(arr||[]));
    return true;
  }catch(e){
    tg?.showPopup?.({
      title: 'Хранилище заполнено',
      message: 'Не удалось сохранить билд: лимит хранения исчерпан. Уменьшите размер скриншотов или удалите старые билды.',
      buttons: [{ type:'ok' }]
    });
    if ((window.__tsuShouldHaptic?.() ?? true)) hapticERR();
    return false;
  }
}
function loadPublicBuilds() {
  try {
    const raw = localStorage.getItem(LS_KEY_PUB_BUILDS);
    return raw ? JSON.parse(raw) : [];
  } catch(_) { return []; }
}
function savePublicBuilds(arr) {
  try {
    localStorage.setItem(LS_KEY_PUB_BUILDS, JSON.stringify(arr||[]));
    return true;
  } catch(_) { return false; }
}

// ---------- Рендер списков ----------
function renderMyBuilds() {
  const items = loadBuilds();
  myBuildsList.innerHTML = '';
  if (!items.length) {
    noBuildsHint.style.display = 'block';
    return;
  }
  noBuildsHint.style.display = 'none';

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
    const name = (b.name || 'Без названия').toString();
    const safeName = name.length > 20 ? (name.slice(0, 20) + '…') : name;
    title.textContent = safeName;

    row.appendChild(icon);
    row.appendChild(title);
    row.addEventListener('click', () => openBuildDetail(b.id));
    myBuildsList.appendChild(row);
  });
}
function renderAllBuilds() {
  const items = loadPublicBuilds();
  allBuildsList.innerHTML = '';
  if (!items.length) {
    noAllBuildsHint.style.display = 'block';
    return;
  }
  noAllBuildsHint.style.display = 'none';

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
    const name = (p.name || 'Без названия').toString();
    const safeName = name.length > 20 ? (name.slice(0, 20) + '…') : name;
    title.textContent = safeName;

    row.appendChild(icon);
    row.appendChild(title);
    row.addEventListener('click', () => openPublicBuildDetail(p.id));
    allBuildsList.appendChild(row);
  });
}

// ---------- Создание билда ----------
function resetBuildForm() {
  try { buildForm?.reset(); } catch {}
  setActive(classChipsEl, []);
  setActive(tagsChipsEl,  []);
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

      if(targetEl && targetEl.parentNode){
        targetEl.parentNode.replaceChild(thumb, targetEl);
      } else if (shotsTwo){
        shotsTwo.appendChild(thumb);
      }

      if(idx === '1') shot1Data = data; else shot2Data = data;
      if ((window.__tsuShouldHaptic?.() ?? true)) hapticTap();
    }catch(_){
      shake(shotsTwo);
    }
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

// ---------- Открытие карточек ----------
function openBuildDetail(id) {
  const all = loadBuilds();
  const b = all.find((x) => String(x.id) === String(id));
  if (!b) { tg?.showAlert?.('Билд не найден'); return; }
  currentBuildId = b.id;

  if (deleteBuildBtn) {
    deleteBuildBtn.dataset.id = String(b.id);
  }

  buildDetailTitle.textContent = b.name || 'Билд';
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
}
function openPublicBuildDetail(pubId) {
  const pubs = loadPublicBuilds();
  const p = pubs.find(x => String(x.id) === String(pubId));
  if (!p) { tg?.showAlert?.('Публикация не найдена'); return; }

  publicDetailTitle.textContent = p.name || 'Билд';
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
}

// ---------- Лайтбокс ----------
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

// ---------- Паблиш/Удаление ----------
function tgConfirm(title, message) {
  if (!tg?.showPopup) return Promise.resolve(window.confirm(message || title));
  return new Promise((resolve) => {
    let _resolver = null;
    const handler = (e) => {
      tg.offEvent('popupClosed', handler);
      resolve(e?.button_id === 'yes');
    };
    tg.onEvent('popupClosed', handler);
    tg.showPopup({
      title: title || 'Подтверждение',
      message: message || '',
      buttons: [
        {id:'no',  type:'cancel',      text:'Отмена'},
        {id:'yes', type:'destructive', text:'Удалить'}
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

// ---------- Публичные обработчики/инициализация ----------
export function initBuilds() {
  // Чипы
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

  // Хаптик на фокус полей
  buildNameEl?.addEventListener('focus', ()=>{ if ((window.__tsuShouldHaptic?.() ?? true)) hapticTap(); }, {passive:true});
  buildDescEl?.addEventListener('focus', ()=>{ if ((window.__tsuShouldHaptic?.() ?? true)) hapticTap(); }, {passive:true});

  // Кнопка «Создать билд»
  createBuildBtn?.addEventListener('click', () => {
    if ((window.__tsuShouldHaptic?.() ?? true)) hapticOK();
    resetBuildForm();
    showScreen('buildCreate');
  });
  createBuildBtn?.addEventListener('pointerdown', () => { /* tap в click */ });

  // Слоты изображений
  bindShotInput(shotInput1, '1');
  bindShotInput(shotInput2, '2');

  // Делегирование клика по квадратам
  shotsTwo?.addEventListener('click', (e) => {
    if ((window.__tsuShouldHaptic?.() ?? true)) hapticTap();
    const box = e.target.closest('.upload-box');
    if (!box) return;
    const idx = box.dataset.idx;
    const input = getShotInputByIdx(idx);
    if (!input) return;
    try { input.value = ''; } catch {}
    input.click();
  });

  // Submit билда
  buildSubmitBtn?.addEventListener('click', () => buildForm?.requestSubmit());
  buildForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    let name = (buildNameEl?.value || '').trim();
    if (name.length > 20) name = name.slice(0, 20);

    const klass = activeValues(classChipsEl)[0] || '';
    const tags  = activeValues(tagsChipsEl);
    const desc  = (buildDescEl?.value || '').trim();

    if (!name)   { shake(buildNameEl); if ((window.__tsuShouldHaptic?.() ?? true)) hapticERR(); buildNameEl && buildNameEl.scrollIntoView({behavior:'smooth', block:'center'}); return; }
    if (!klass)  { shake(classChipsEl); if ((window.__tsuShouldHaptic?.() ?? true)) hapticERR(); return; }
    if (!shot1Data || !shot2Data) { shake(shotsTwo); if ((window.__tsuShouldHaptic?.() ?? true)) hapticERR(); return; }

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

    if ((window.__tsuShouldHaptic?.() ?? true)) hapticOK();
    tg?.showPopup?.({ title: 'Билд создан', message: 'Сохранено локально (макет, без сервера).', buttons: [{ type:'ok' }] });

    renderMyBuilds();
    showScreen('builds');
  });

  // Публикация/скрытие
  publishBuildBtn?.addEventListener('click', () => {
    if ((window.__tsuShouldHaptic?.() ?? true)) hapticOK();
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

  // Удаление
  deleteBuildBtn?.addEventListener('click', async () => {
    if ((window.__tsuShouldHaptic?.() ?? true)) hapticOK();
    const idFromBtn = deleteBuildBtn?.dataset?.id;
    const id = idFromBtn ?? currentBuildId;
    if (!id) { tg?.showAlert?.('Не удалось определить билд для удаления.'); return; }
    const ok = await tgConfirm('Удалить билд', 'Вы уверены, что хотите удалить этот билд?');
    if (!ok) return;
    deleteBuildById(String(id));
  });

  // Первый рендер списков
  renderMyBuilds();
  renderAllBuilds();
}
