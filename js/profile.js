// profile.js
import { tg, $, hapticTap, hapticERR, hapticOK } from './telegram.js';
import { showScreen } from './ui.js';

// ---------- Общие утилиты для чипов ----------
function renderChips(container, values, { single = false, onChange } = {}) {
  if (!container) return;
  container.innerHTML = '';
  values.forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip-btn';
    b.textContent = v;
    b.dataset.value = v;
    b.addEventListener('click', () => {
      if ((window.__tsuShouldHaptic?.() ?? true)) hapticTap();
      if (single) {
        container.querySelectorAll('.chip-btn').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
      } else {
        b.classList.toggle('active');
      }
      onChange?.();
    });
    container.appendChild(b);
  });
}
function activeValues(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll('.chip-btn.active')).map((b) => b.dataset.value);
}
function setActive(container, arr) {
  if (!container) return;
  const set = new Set(arr || []);
  container.querySelectorAll('.chip-btn').forEach((b) => {
    b.classList.toggle('active', set.has(b.dataset.value));
  });
}
function prettyLines(arr) { return (arr && arr.length) ? arr.join('\n') : '—'; }
function shake(el) {
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}
function smartScrollIntoView(el){
  if (!el) return;
  try { el.focus({ preventScroll: true }); } catch(_) { try{ el.focus(); }catch{} }
  const behavior = 'smooth';
  const pad = 16;
  const rect = el.getBoundingClientRect();

  if (window.visualViewport) {
    const vv = window.visualViewport;
    const topOk = rect.top >= pad;
    const bottomOk = rect.bottom <= (vv.height - pad);
    if (!topOk || !bottomOk) {
      const targetY = rect.top + window.scrollY - Math.max(0, (vv.height/2 - rect.height/2));
      window.scrollTo({ top: targetY, behavior });
    }
  } else {
    el.scrollIntoView({ block: 'center', behavior });
  }
}

// ---------- Константы профиля ----------
const PLATFORM   = ['🎮 PlayStation','💻 ПК'];
const MODES      = ['📖 Сюжет','🏹 Выживание','🗻 Испытания Иё','⚔️ Соперники','📜 Главы'];
const GOALS      = ['🏆 Получение трофеев','🔎 Узнать что-то новое','👥 Поиск тиммейтов'];
const DIFFICULTY = ['🥉 Бронза','🥈 Серебро','🥇 Золото','🏅 Платина','👻 Кошмар','🔥 HellMode'];

// ---------- Элементы отображения ----------
const v_real_name  = $('v_real_name');
const v_psn        = $('v_psn');
const v_platform   = $('v_platform');
const v_modes      = $('v_modes');
const v_goals      = $('v_goals');
const v_difficulty = $('v_difficulty');

// ---------- Форма профиля ----------
const profileForm     = $('profileForm');
const profileSaveBtn  = $('profileSaveBtn');

function refreshProfileView() {
  if (v_platform)   v_platform.textContent   = prettyLines(activeValues($('platformChips')));
  if (v_modes)      v_modes.textContent      = prettyLines(activeValues($('modesChips')));
  if (v_goals)      v_goals.textContent      = prettyLines(activeValues($('goalsChips')));
  if (v_difficulty) v_difficulty.textContent = prettyLines(activeValues($('difficultyChips')));
}

export function initProfile() {
  // Chip-контролы
  renderChips($('platformChips'),   PLATFORM,   { onChange: refreshProfileView });
  renderChips($('modesChips'),      MODES,      { onChange: refreshProfileView });
  renderChips($('goalsChips'),      GOALS,      { onChange: refreshProfileView });
  renderChips($('difficultyChips'), DIFFICULTY, { onChange: refreshProfileView });

  // Шапка с @username
  const chip = $('userChip');
  const uname = tg?.initDataUnsafe?.user?.username;
  if (chip && uname) chip.textContent = '@' + uname;

  if (!profileForm) return;

  const nameInput = profileForm.real_name;
  const psnInput  = profileForm.psn;

  // Навигация по Enter
  nameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); psnInput?.focus(); }
  });
  psnInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); }
  });

  // Хаптик Tap при фокусе
  nameInput?.addEventListener('focus', ()=>{ if ((window.__tsuShouldHaptic?.() ?? true)) hapticTap(); }, {passive:true});
  psnInput?.addEventListener('focus',  ()=>{ if ((window.__tsuShouldHaptic?.() ?? true)) hapticTap(); }, {passive:true});

  function isNameOk() {
    return !!(nameInput && (nameInput.value || '').trim());
  }
  function isPSNOk() {
    if (!psnInput) return false;
    const val = (psnInput.value || '').trim();
    if (!val) return false;
    return /^[A-Za-z0-9_-]{3,16}$/.test(val);
  }

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const okName = isNameOk();
    const okPSN  = isPSNOk();

    if (!okName || !okPSN) {
      const msgs = [];
      let firstBad = null;
      if (!okName) { msgs.push('Нужно указать Имя.'); shake(nameInput); firstBad = firstBad || nameInput; }
      if (!okPSN) {
        const val = (psnInput?.value || '').trim();
        if (!val) msgs.push('Нужно указать Ник PlayStation.');
        else msgs.push('Неверный формат ника PlayStation (3–16: A–Z, a–z, 0–9, -, _).');
        shake(psnInput);
        if (!firstBad) firstBad = psnInput;
      }
      if (firstBad) smartScrollIntoView(firstBad);
      if ((window.__tsuShouldHaptic?.() ?? true)) hapticERR();
      tg?.showPopup?.({ title: 'Ошибка', message: msgs.join('\n'), buttons: [{ type: 'ok' }] });
      return;
    }

    if (v_real_name) v_real_name.textContent = (nameInput?.value || '').trim() || '—';
    if (v_psn)       v_psn.textContent       = (psnInput?.value || '').trim()       || '—';
    refreshProfileView();

    if ((window.__tsuShouldHaptic?.() ?? true)) hapticOK();
    tg?.showPopup?.({ title: 'Профиль обновлён', message: 'Данные сохранены.', buttons: [{ type: 'ok' }] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  profileSaveBtn?.addEventListener('click', () => profileForm.requestSubmit());
}

// Экспорт вспомогательных функций, если понадобятся в других модулях
export { renderChips, activeValues, setActive, shake, smartScrollIntoView, refreshProfileView };
