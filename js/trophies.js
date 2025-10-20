// trophies.js
import { tg, $, hapticTapSmart, hapticOK, hapticERR } from './telegram.js';
import { showScreen } from './ui.js';
import { shake, smartScrollIntoView } from './profile.js';

const trophyListEl  = $('trophyList');
const trophyTitleEl = $('trophyTitle');
const trophyDescEl  = $('trophyDesc');

const proofFormEl     = $('proofForm');
const proofFilesEl    = $('proofFiles');       // скрытый input[type=file]
const proofSubmitBtn  = $('proofSubmitBtn');   // ВНЕ формы — общий actions-bar
const commentEl       = $('commentText');
const previewEl       = $('filePreview');
const proofAddBtn     = $('proofAddBtn');      // узкая кнопка-строка «＋ Прикрепить»
const MAX_PROOF_FILES = 12;

const TROPHIES_URL = './assets/data/trophies.json';

let TROPHIES = null;
let proofSelected = []; // Array<File>

async function loadTrophies() {
  if (TROPHIES) return TROPHIES;
  try {
    const res = await fetch(TROPHIES_URL, { cache: 'no-store' });
    TROPHIES = await res.json();
  } catch {
    TROPHIES = {};
  }
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
    btn.addEventListener('click', () => { hapticTapSmart(); openTrophyDetail(key); }); // Tap на кнопку трофея
    trophyListEl.appendChild(btn);
  });
}

function resetProofForm() {
  if (previewEl) {
    previewEl.innerHTML = '';
    previewEl.classList.remove('shake','error');
  }
  if (proofFilesEl) proofFilesEl.value = '';
  proofSelected = [];
  if (commentEl) {
    commentEl.value = '';
    commentEl.style.height = 'auto';
    commentEl.classList.remove('shake','error');
  }
}

function renderProofPreview() {
  if (!previewEl) return;
  previewEl.innerHTML = '';

  const limit = 4;
  const toShow = proofSelected.slice(0, limit);

  toShow.forEach((file, idx) => {
    const tile = document.createElement('div');
    tile.className = 'preview-item removable';
    tile.title = 'Нажмите, чтобы удалить';

    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      tile.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      tile.textContent = '🎥';
    } else {
      tile.textContent = '📄';
    }

    tile.addEventListener('click', () => {
      proofSelected.splice(idx, 1);
      hapticTapSmart(); // Tap при удалении превью
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
    if (!filesCount) shake(previewEl || proofAddBtn || proofFilesEl);
    if (!comment)    { shake(commentEl); smartScrollIntoView(commentEl); }
    hapticERR(); // ERR при ошибке
    tg?.showPopup?.({ title: 'Ошибка', message: 'Добавьте файл и комментарий.', buttons: [{ type: 'ok' }] });
    return;
  }

  // Имитация успешной отправки
  hapticOK(); // OK на успех
  tg?.showPopup?.({ title: 'Заявка отправлена', message: '✅ Модераторы рассмотрят вашу заявку.' });
  resetProofForm();
  showScreen('trophies');
}

export async function initTrophies() {
  // Список
  const data = await loadTrophies();
  renderTrophyList(data);

  // «＋ Прикрепить» — Tap
  proofAddBtn?.addEventListener('click', () => {
    hapticTapSmart();
    try { proofFilesEl.value = ''; } catch {}
    proofFilesEl?.click();
  });

  // Если не выбрано медиа при попытке добавить — shake делается в change ниже (когда пусто)

  // Выбор файлов
  if (proofFilesEl) {
    proofFilesEl.addEventListener('change', () => {
      const files = Array.from(proofFilesEl.files || []);
      if (!files.length) { shake(previewEl || proofAddBtn); return; }

      const keyOf = (f) => `${f.name}::${f.size}::${f.lastModified}`;
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

  // Авторесайз textarea и Tap на фокус
  if (commentEl) {
    const autoResize = () => {
      commentEl.style.height = 'auto';
      commentEl.style.height = Math.min(commentEl.scrollHeight, 200) + 'px';
    };
    commentEl.addEventListener('input', autoResize);
    commentEl.addEventListener('focus', ()=>{ hapticTapSmart(); }, {passive:true}); // Tap на поле комментария
    setTimeout(autoResize, 0);
  }

  // Кнопка «Отправить»: Tap при нажатии, OK/ERR в submitProof
  proofSubmitBtn?.addEventListener('pointerdown', () => { hapticTapSmart(); });
  proofSubmitBtn?.addEventListener('click', (e) => { e.preventDefault?.(); submitProof(); });

  // Блок самой формы — защита от submit
  proofFormEl?.addEventListener('submit', (e) => { e.preventDefault(); submitProof(); });
}
