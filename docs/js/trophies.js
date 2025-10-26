// trophies.js
import { tg, $, hapticTapSmart, hapticOK, hapticERR, hideKeyboard } from './telegram.js';
import { showScreen, focusAndScrollIntoView } from './ui.js';
import { shake, createFileKey, isImageFile } from './utils.js';
import { fetchProfile, submitTrophyApplication } from './api.js';

// Элементы интерфейса
const obtainedTrophiesListEl = $('obtainedTrophiesList');
const availableTrophiesListEl = $('availableTrophiesList');
const noObtainedTrophiesHintEl = $('noObtainedTrophiesHint');
const noAvailableTrophiesHintEl = $('noAvailableTrophiesHint');
const trophyProgressFillEl = $('trophyProgressFill');
const trophyProgressTextEl = $('trophyProgressText');

const trophyTitleEl = $('trophyTitle');
const trophyDescEl = $('trophyDesc');
const trophyObtainedCardEl = $('trophyObtainedCard');
const trophyApplicationCardEl = $('trophyApplicationCard');

const proofFormEl = $('proofForm');
const proofFilesEl = $('proofFiles');
const proofSubmitBtn = $('proofSubmitBtn');
const commentEl = $('commentText');
const previewEl = $('filePreview');
const proofAddBtn = $('proofAddBtn');
const MAX_PROOF_FILES = 10;

const TROPHIES_URL = './assets/data/trophies.json';

let TROPHIES = null;
let USER_PROFILE = null;
let CURRENT_TROPHY_ID = null;

async function loadTrophies() {
  if (TROPHIES) return TROPHIES;
  try {
    const res = await fetch(TROPHIES_URL, { cache: 'no-store' });
    TROPHIES = await res.json();
  } catch (error) {
    console.error('Ошибка загрузки трофеев:', error);
    TROPHIES = {};
  }
  return TROPHIES;
}

async function loadUserProfile() {
  try {
    USER_PROFILE = await fetchProfile();
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error);
    USER_PROFILE = null;
  }
  return USER_PROFILE;
}

function renderProgressBar() {
  if (!trophyProgressFillEl || !trophyProgressTextEl) return;
  
  const totalTrophies = Object.keys(TROPHIES || {}).length;
  const obtainedTrophies = USER_PROFILE?.trophies?.length || 0;
  
  const percentage = totalTrophies > 0 ? (obtainedTrophies / totalTrophies) * 100 : 0;
  
  trophyProgressFillEl.style.width = `${percentage}%`;
  trophyProgressTextEl.textContent = `${obtainedTrophies}/${totalTrophies}`;
}

function renderObtainedTrophies() {
  if (!obtainedTrophiesListEl) return;
  
  obtainedTrophiesListEl.innerHTML = '';
  
  const obtainedTrophyIds = USER_PROFILE?.trophies || [];
  
  if (obtainedTrophyIds.length === 0) {
    noObtainedTrophiesHintEl?.classList.remove('hidden');
    return;
  }
  
  noObtainedTrophiesHintEl?.classList.add('hidden');
  
  obtainedTrophyIds.forEach(trophyId => {
    const trophy = TROPHIES?.[trophyId];
    if (!trophy) return;
    
    const btn = document.createElement('button');
    btn.className = 'list-btn trophy-obtained';
    btn.type = 'button';
    btn.dataset.id = trophyId;
    btn.innerHTML = `<span>${trophy.name || trophyId} ${trophy.emoji || ''}</span><span class="right">✓</span>`;
    btn.addEventListener('click', () => { 
      hapticTapSmart(); 
      openTrophyDetail(trophyId, true); 
    });
    obtainedTrophiesListEl.appendChild(btn);
  });
}

function renderAvailableTrophies() {
  if (!availableTrophiesListEl) return;
  
  availableTrophiesListEl.innerHTML = '';
  
  const obtainedTrophyIds = USER_PROFILE?.trophies || [];
  const availableTrophies = Object.keys(TROPHIES || {}).filter(id => !obtainedTrophyIds.includes(id));
  
  if (availableTrophies.length === 0) {
    noAvailableTrophiesHintEl?.classList.remove('hidden');
    return;
  }
  
  noAvailableTrophiesHintEl?.classList.add('hidden');
  
  availableTrophies.forEach(trophyId => {
    const trophy = TROPHIES[trophyId];
    if (!trophy) return;
    
    const btn = document.createElement('button');
    btn.className = 'list-btn';
    btn.type = 'button';
    btn.dataset.id = trophyId;
    btn.innerHTML = `<span>${trophy.name || trophyId} ${trophy.emoji || ''}</span><span class="right">›</span>`;
    btn.addEventListener('click', () => { 
      hapticTapSmart(); 
      openTrophyDetail(trophyId, false); 
    });
    availableTrophiesListEl.appendChild(btn);
  });
}

function resetProofForm() {
  // Очищаем objectURL при сбросе формы
  objectURLs.forEach(url => URL.revokeObjectURL(url));
  objectURLs.clear();
  
  if (previewEl) { previewEl.innerHTML = ''; previewEl.classList.remove('shake','error'); }
  if (proofFilesEl) proofFilesEl.value = '';
  proofSelected = [];
  if (commentEl) {
    commentEl.value = '';
    commentEl.style.height = 'auto';
    commentEl.classList.remove('shake','error');
  }
}

let proofSelected = [];
let objectURLs = new Set();

function renderProofPreview() {
  if (!previewEl) return;
  
  // Очищаем старые objectURL
  objectURLs.forEach(url => URL.revokeObjectURL(url));
  objectURLs.clear();
  
  previewEl.innerHTML = '';
  const limit = 4;
  const toShow = proofSelected.slice(0, limit);

  toShow.forEach((file, idx) => {
    const tile = document.createElement('div');
    tile.className = 'preview-item removable';
    tile.title = 'Нажмите, чтобы удалить';

    if (isImageFile(file)) {
      const img = document.createElement('img');
      const objectURL = URL.createObjectURL(file);
      objectURLs.add(objectURL);
      img.src = objectURL;
      img.onload = () => {
        // URL будет отозван при следующем вызове renderProofPreview
      };
      tile.appendChild(img);
    } else {
      tile.textContent = '📄';
    }

    tile.addEventListener('click', () => {
      proofSelected.splice(idx, 1);
      hapticTapSmart();
      renderProofPreview();
    });

    previewEl.appendChild(tile);
  });

  if (proofSelected.length > limit) {
    const more = document.createElement('div');
    more.className = 'preview-more';
    more.textContent = `+${proofSelected.length - limit}`;
    previewEl.appendChild(more);
  }
}

function openTrophyDetail(trophyId, isObtained = false) {
  const trophy = (TROPHIES && TROPHIES[trophyId]) || {};
  CURRENT_TROPHY_ID = trophyId;
  
  if (trophyTitleEl) trophyTitleEl.textContent = `${trophy.name || 'Трофей'}${trophy.emoji ? ' ' + trophy.emoji : ''}`;
  if (trophyDescEl) {
    trophyDescEl.innerHTML = '';
    (trophy.description || ['Описание скоро будет.']).forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      trophyDescEl.appendChild(li);
    });
  }
  
  // Показываем соответствующую карточку
  if (isObtained) {
    trophyObtainedCardEl?.classList.remove('hidden');
    trophyApplicationCardEl?.classList.add('hidden');
    proofSubmitBtn?.classList.add('hidden');
  } else {
    trophyObtainedCardEl?.classList.add('hidden');
    trophyApplicationCardEl?.classList.remove('hidden');
    proofSubmitBtn?.classList.remove('hidden');
  }
  
  resetProofForm();
  showScreen('trophyDetail');
}

let submitting = false;
async function submitProof() {
  if (submitting) return;
  submitting = true;
  setTimeout(() => (submitting = false), 1200);

  const filesCount = proofSelected.length;
  const comment = (commentEl?.value || '').trim();

  if (filesCount === 0) {
    shake(previewEl || proofAddBtn || proofFilesEl); 
    focusAndScrollIntoView(proofAddBtn || previewEl);
    hapticERR();
    tg?.showPopup?.({ title: 'Ошибка', message: 'Добавьте хотя бы одно изображение.', buttons: [{ type: 'ok' }] });
    return;
  }

  try {
    hapticOK();
    
    await submitTrophyApplication(CURRENT_TROPHY_ID, proofSelected, comment);
    
    tg?.showPopup?.({ 
      title: 'Заявка отправлена', 
      message: '✅ Модераторы рассмотрят вашу заявку.', 
      buttons: [{ type: 'ok' }] 
    });
    
    resetProofForm();
    showScreen('trophies');
    
    // Перезагружаем данные
    await loadUserProfile();
    renderAll();
    
  } catch (error) {
    console.error('Ошибка отправки заявки:', error);
    hapticERR();
    tg?.showPopup?.({ 
      title: 'Ошибка', 
      message: error.message || 'Произошла ошибка при отправке заявки.', 
      buttons: [{ type: 'ok' }] 
    });
  }
}

function renderAll() {
  renderProgressBar();
  renderObtainedTrophies();
  renderAvailableTrophies();
}

export async function initTrophies() {
  // Загружаем данные
  await Promise.all([
    loadTrophies(),
    loadUserProfile()
  ]);
  
  // Рендерим интерфейс
  renderAll();

  // Обработчики для формы заявки
  proofAddBtn?.addEventListener('click', () => {
    hapticTapSmart();
    try { proofFilesEl.value = ''; } catch {}
    proofFilesEl?.click();
  });

  if (proofFilesEl) {
    proofFilesEl.addEventListener('change', () => {
      const files = Array.from(proofFilesEl.files || []);
      if (!files.length) { 
        shake(previewEl || proofAddBtn); 
        focusAndScrollIntoView(proofAddBtn || previewEl); 
        return; 
      }

      // Фильтруем только изображения
      const imageFiles = files.filter(file => isImageFile(file));
      
      if (imageFiles.length !== files.length) {
        tg?.showPopup?.({
          title: 'Неподдерживаемый формат',
          message: 'Разрешены только изображения.',
          buttons: [{ type: 'ok' }]
        });
      }

      const keyOf = (f) => createFileKey(f);
      const existing = new Set(proofSelected.map(keyOf));
      const freeSlots = Math.max(0, MAX_PROOF_FILES - proofSelected.length);
      const incoming = imageFiles.filter(f => !existing.has(keyOf));

      if (incoming.length > freeSlots) {
        incoming.length = freeSlots;
        tg?.showPopup?.({
          title: 'Лимит файлов',
          message: `Можно прикрепить не более ${MAX_PROOF_FILES} изображений.`,
          buttons: [{ type: 'ok' }]
        });
      }
      incoming.forEach(f => proofSelected.push(f));
      renderProofPreview();
    });
  }

  if (commentEl) {
    const autoResize = () => {
      commentEl.style.height = 'auto';
      commentEl.style.height = Math.min(commentEl.scrollHeight, 200) + 'px';
    };
    commentEl.addEventListener('input', autoResize);
    commentEl.addEventListener('focus', ()=>{ hapticTapSmart(); }, {passive:true});
    setTimeout(autoResize, 0);
  }

  proofSubmitBtn?.addEventListener('pointerdown', () => { hapticTapSmart(); });
  proofSubmitBtn?.addEventListener('click', (e) => { e.preventDefault?.(); submitProof(); });

  proofFormEl?.addEventListener('submit', (e) => { e.preventDefault(); submitProof(); });
}