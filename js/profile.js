// profile.js
import { tg, $, hapticTapSmart, hapticERR, hapticOK } from './telegram.js';
import { focusAndScrollIntoView } from './ui.js';

// ---------- Утилиты для чипов ----------
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
      hapticTapSmart();
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

// ---------- Константы ----------
const PLATFORM   = ['🎮 PlayStation','💻 ПК'];
const MODES      = ['📖 Сюжет','🏹 Выживание','🗻 Испытания Иё','⚔️ Соперники','📜 Главы'];
const GOALS      = ['🏆 Получение трофеев','🔎 Узнать что-то новое','👥 Поиск тиммейтов'];
const DIFFICULTY = ['🥉 Бронза','🥈 Серебро','🥇 Золото','🏅 Платина','👻 Кошмар','🔥 HellMode'];

// ---------- LocalStorage ----------
const LS_KEY_PROFILE = 'tsu_profile_v1';

function saveProfile(data) {
  try {
    localStorage.setItem(LS_KEY_PROFILE, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(LS_KEY_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ---------- Отображение ----------
const v_real_name  = $('v_real_name');
const v_psn        = $('v_psn');
const v_platform   = $('v_platform');
const v_modes      = $('v_modes');
const v_goals      = $('v_goals');
const v_difficulty = $('v_difficulty');

// ---------- Форма ----------
const profileForm     = $('profileForm');
const profileSaveBtn  = $('profileSaveBtn');

function refreshProfileView() {
  if (v_platform)   v_platform.textContent   = prettyLines(activeValues($('platformChips')));
  if (v_modes)      v_modes.textContent      = prettyLines(activeValues($('modesChips')));
  if (v_goals)      v_goals.textContent      = prettyLines(activeValues($('goalsChips')));
  if (v_difficulty) v_difficulty.textContent = prettyLines(activeValues($('difficultyChips')));
}

function loadProfileToForm(profile) {
  if (!profile) return;
  
  // Заполняем текстовые поля
  if (profileForm.real_name) {
    profileForm.real_name.value = profile.real_name || '';
  }
  if (profileForm.psn) {
    profileForm.psn.value = profile.psn || '';
  }
  
  // Устанавливаем чипы
  if (profile.platform) setActive($('platformChips'), profile.platform);
  if (profile.modes) setActive($('modesChips'), profile.modes);
  if (profile.goals) setActive($('goalsChips'), profile.goals);
  if (profile.difficulty) setActive($('difficultyChips'), profile.difficulty);
  
  // Обновляем отображение
  refreshProfileView();
}

export function initProfile() {
  // Чипы
  renderChips($('platformChips'),   PLATFORM,   { onChange: refreshProfileView });
  renderChips($('modesChips'),      MODES,      { onChange: refreshProfileView });
  renderChips($('goalsChips'),      GOALS,      { onChange: refreshProfileView });
  renderChips($('difficultyChips'), DIFFICULTY, { onChange: refreshProfileView });

  // Загружаем сохраненный профиль
  const savedProfile = loadProfile();
  console.log('Загруженный профиль:', savedProfile);
  if (savedProfile) {
    loadProfileToForm(savedProfile);
  }


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

  // Tap при фокусе (глобальный скролл сам подвинет поле)
  nameInput?.addEventListener('focus', ()=>{ hapticTapSmart(); }, {passive:true});
  psnInput?.addEventListener('focus',  ()=>{ hapticTapSmart(); }, {passive:true});

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
        shake(psnInput); if (!firstBad) firstBad = psnInput;
      }
      if (firstBad) focusAndScrollIntoView(firstBad); // <— фокус + скролл
      hapticERR();
      tg?.showPopup?.({ title: 'Ошибка', message: msgs.join('\n'), buttons: [{ type: 'ok' }] });
      return;
    }

    // Сохраняем в localStorage
    const profileData = {
      real_name: (nameInput?.value || '').trim(),
      psn: (psnInput?.value || '').trim(),
      platform: activeValues($('platformChips')),
      modes: activeValues($('modesChips')),
      goals: activeValues($('goalsChips')),
      difficulty: activeValues($('difficultyChips'))
    };
    
    console.log('Сохраняем профиль:', profileData);
    
    if (!saveProfile(profileData)) {
      tg?.showPopup?.({ title: 'Ошибка', message: 'Не удалось сохранить профиль.', buttons: [{ type: 'ok' }] });
      return;
    }

    // Обновляем отображение
    if (v_real_name) v_real_name.textContent = profileData.real_name || '—';
    if (v_psn)       v_psn.textContent       = profileData.psn || '—';
    refreshProfileView();

    hapticOK();
    tg?.showPopup?.({ title: 'Профиль обновлён', message: 'Данные сохранены.', buttons: [{ type: 'ok' }] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  profileSaveBtn?.addEventListener('click', () => profileForm.requestSubmit());
}

// Экспорт вспомогательных
export { renderChips, activeValues, setActive, shake, refreshProfileView };
