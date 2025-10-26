// trophies.js
import { tg, $, hapticTapSmart, hapticOK, hapticERR, hideKeyboard } from './telegram.js';
import { showScreen, focusAndScrollIntoView } from './ui.js';
import { shake, createFileKey, isImageFile, isVideoFile } from './utils.js';

const trophyListEl  = $('trophyList');
const trophyTitleEl = $('trophyTitle');
const trophyDescEl  = $('trophyDesc');

const proofFormEl     = $('proofForm');
const proofFilesEl    = $('proofFiles');
const proofSubmitBtn  = $('proofSubmitBtn');
const commentEl       = $('commentText');
const previewEl       = $('filePreview');
const proofAddBtn     = $('proofAddBtn');
const MAX_PROOF_FILES = 12;

const TROPHIES_URL = './assets/data/trophies.json';

let TROPHIES = null;

async function loadTrophies() {
  if (TROPHIES) return TROPHIES;
  try {
    const res = await fetch(TROPHIES_URL, { cache: 'no-store' });
    TROPHIES = await res.json();
  } catch { TROPHIES = {}; }
  return TROPHIES;
}

function renderTrophyList(data) {
  if (!trophyListEl) return;
  trophyListEl.innerHTML = '';
  Object.keys(data || {}).forEach((key) => {
    const t = data[key];
    const btn = document.createElement('button');
    btn.className = 'list-btn';
    btn.type = 'button';
    btn.dataset.id = key;
    btn.innerHTML = `<span>${t.name || key} ${t.emoji || ''}</span><span class="right">›</span>`;
    btn.addEventListener('click', () => { hapticTapSmart(); openTrophyDetail(key); });
    trophyListEl.appendChild(btn);
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
let objectURLs = new Set(); // Отслеживаем созданные objectURL для предотвращения утечек памяти

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
        // Не отзываем URL сразу, так как изображение может быть показано снова
        // URL будет отозван при следующем вызове renderProofPreview
      };
      tile.appendChild(img);
    } else if (isVideoFile(file)) {
      tile.textContent = '🎥';
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

function openTrophyDetail(key) {
  const t = (TROPHIES && TROPHIES[key]) || {};
  if (trophyTitleEl) trophyTitleEl.textContent = `${t.name || 'Трофей'}${t.emoji ? ' ' + t.emoji : ''}`;
  if (trophyDescEl) {
    trophyDescEl.innerHTML = '';
    (t.description || ['Описание скоро будет.']).forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      trophyDescEl.appendChild(li);
    });
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
  const comment    = (commentEl?.value || '').trim();

  if (filesCount === 0 || !comment) {
    if (!filesCount) { shake(previewEl || proofAddBtn || proofFilesEl); focusAndScrollIntoView(proofAddBtn || previewEl); }
    if (!comment)    { shake(commentEl); focusAndScrollIntoView(commentEl); }
    hapticERR();
    tg?.showPopup?.({ title: 'Ошибка', message: 'Добавьте файл и комментарий.', buttons: [{ type: 'ok' }] });
    return;
  }

  hapticOK();
  tg?.showPopup?.({ title: 'Заявка отправлена', message: '✅ Модераторы рассмотрят вашу заявку.', buttons: [{ type: 'ok' }] });
  resetProofForm();
  showScreen('trophies');
}

export async function initTrophies() {
  const data = await loadTrophies();
  renderTrophyList(data);

  proofAddBtn?.addEventListener('click', () => {
    hapticTapSmart();
    try { proofFilesEl.value = ''; } catch {}
    proofFilesEl?.click();
  });

  if (proofFilesEl) {
    proofFilesEl.addEventListener('change', () => {
      const files = Array.from(proofFilesEl.files || []);
      if (!files.length) { shake(previewEl || proofAddBtn); focusAndScrollIntoView(proofAddBtn || previewEl); return; }

      const keyOf = (f) => createFileKey(f);
      const existing = new Set(proofSelected.map(keyOf));
      const freeSlots = Math.max(0, MAX_PROOF_FILES - proofSelected.length);
      const incoming = files.filter(f => !existing.has(keyOf(f)));

      if (incoming.length > freeSlots) {
        incoming.length = freeSlots;
        tg?.showPopup?.({
          title: 'Лимит файлов',
          message: `Можно прикрепить не более ${MAX_PROOF_FILES} файлов.`,
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
