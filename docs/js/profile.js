// profile.js
import { tg, $, hapticTapSmart, hapticERR, hapticOK, hideKeyboard } from './telegram.js';
import { focusAndScrollIntoView } from './ui.js';
import { fetchProfile, saveProfile as apiSaveProfile } from './api.js';
import { renderChips, activeValues, setActive, shake, prettyLines, validatePSNId, safeLocalStorageGet, safeLocalStorageSet } from './utils.js';

// ---------- Константы ----------
const PLATFORM   = ['🎮 PlayStation','💻 ПК'];
const MODES      = ['📖 Сюжет','🏹 Выживание','🗻 Испытания Иё','⚔️ Соперники','📜 Главы'];
const GOALS      = ['🏆 Получение трофеев','🔎 Узнать что-то новое','👥 Поиск тиммейтов'];
const DIFFICULTY = ['🥉 Бронза','🥈 Серебро','🥇 Золото','🏅 Платина','👻 Кошмар','🔥 HellMode'];

// ---------- LocalStorage ----------
// Удалено: больше не используем localStorage для профиля

// ---------- Отображение ----------
const v_real_name  = $('v_real_name');
const v_psn_id     = $('v_psn_id');
const v_platform   = $('v_platform');
const v_modes      = $('v_modes');
const v_goals      = $('v_goals');
const v_difficulty = $('v_difficulty');

// ---------- Форма ----------
const profileForm     = $('profileForm');
const profileSaveBtn  = $('profileSaveBtn');
const nameErrorEl     = $('nameError');
const psnErrorEl      = $('psnError');

// Кеш для элементов чипов
let chipsCache = null;

function getChipsCache() {
  if (!chipsCache) {
    chipsCache = {
      platform: $('platformChips'),
      modes: $('modesChips'),
      goals: $('goalsChips'),
      difficulty: $('difficultyChips')
    };
  }
  return chipsCache;
}

function refreshProfileView() {
  const cache = getChipsCache();
  if (v_platform)   v_platform.textContent   = prettyLines(activeValues(cache.platform));
  if (v_modes)      v_modes.textContent      = prettyLines(activeValues(cache.modes));
  if (v_goals)      v_goals.textContent      = prettyLines(activeValues(cache.goals));
  if (v_difficulty) v_difficulty.textContent = prettyLines(activeValues(cache.difficulty));
}

function loadProfileToForm(profile) {
  if (!profile) return;
  
  // Заполняем текстовые поля
  if (profileForm.real_name) {
    profileForm.real_name.value = profile.real_name || '';
  }
  if (profileForm.psn_id) {
    profileForm.psn_id.value = profile.psn_id || '';
  }
  
  // Устанавливаем чипы используя кеш
  const cache = getChipsCache();
  if (profile.platforms) setActive(cache.platform, profile.platforms);
  if (profile.modes) setActive(cache.modes, profile.modes);
  if (profile.goals) setActive(cache.goals, profile.goals);
  if (profile.difficulties) setActive(cache.difficulty, profile.difficulties);
  
  // Обновляем отображение в карточке "Ваш профиль"
  if (v_real_name) v_real_name.textContent = profile.real_name || '—';
  if (v_psn_id) v_psn_id.textContent = profile.psn_id || '—';
  refreshProfileView();
}

// Загрузка профиля с сервера
async function fetchProfileFromServer() {
  try {
    const serverProfile = await fetchProfile();
    if (serverProfile) {
      // Обновляем форму и отображение
      loadProfileToForm(serverProfile);
      console.log('Профиль загружен с сервера');
    }
  } catch (error) {
    console.log('Ошибка загрузки профиля с сервера:', error);
    
    // Показываем ошибку для всех случаев (online-only режим)
    if (error.status === 401) {
      tg?.showPopup?.({ 
        title: 'Ошибка авторизации', 
        message: 'Не удалось авторизоваться в системе.', 
        buttons: [{ type: 'ok' }] 
      });
    } else if (error.status === 404) {
      // 404 - профиль не создан, это нормально для первого входа
      console.log('Профиль не найден - первый вход пользователя');
    } else {
      // Любые другие ошибки (сеть, сервер) - показываем ошибку
      tg?.showPopup?.({ 
        title: 'Ошибка сети', 
        message: 'Не удалось загрузить профиль. Проверьте подключение к интернету.', 
        buttons: [{ type: 'ok' }] 
      });
    }
  }
}

export function initProfile() {
  // Получаем кеш элементов чипов
  const cache = getChipsCache();
  
  // Чипы
  renderChips(cache.platform,   PLATFORM,   { onChange: refreshProfileView });
  renderChips(cache.modes,      MODES,      { onChange: refreshProfileView });
  renderChips(cache.goals,      GOALS,      { onChange: refreshProfileView });
  renderChips(cache.difficulty, DIFFICULTY, { onChange: refreshProfileView });

  // Профиль не загружается при инициализации
  // Загрузка происходит только при открытии экрана профиля


  if (!profileForm) return;
  const nameInput = profileForm.real_name;
  const psnInput  = profileForm.psn_id;

  // Навигация по Enter
  nameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      psnInput?.focus(); 
    }
  });
  psnInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      // Закрываем клавиатуру на iOS
      hideKeyboard();
    }
  });

  // Tap при фокусе (глобальный скролл сам подвинет поле)
  nameInput?.addEventListener('focus', ()=>{ hapticTapSmart(); }, {passive:true});
  psnInput?.addEventListener('focus',  ()=>{ hapticTapSmart(); }, {passive:true});

  // Скрывать ошибки при начале редактирования
  nameInput?.addEventListener('input', ()=>{ nameErrorEl?.classList.add('hidden'); });
  psnInput?.addEventListener('input', ()=>{ psnErrorEl?.classList.add('hidden'); });

  function isNameOk() {
    return !!(nameInput && (nameInput.value || '').trim());
  }
  function isPSNOk() {
    if (!psnInput) return false;
    return validatePSNId(psnInput.value);
  }

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const okName = isNameOk();
    const okPSN  = isPSNOk();

    if (!okName || !okPSN) {
      let firstBad = null;
      
      if (!okName) { 
        nameErrorEl?.classList.remove('hidden');
        shake(nameInput); 
        firstBad = firstBad || nameInput; 
      }
      
      if (!okPSN) {
        const val = (psnInput?.value || '').trim();
        if (!val) {
          psnErrorEl.textContent = 'Укажите ник в PlayStation Network';
        } else {
          psnErrorEl.textContent = 'Неверный формат';
        }
        psnErrorEl?.classList.remove('hidden');
        shake(psnInput); 
        if (!firstBad) firstBad = psnInput;
      }
      
      if (firstBad) focusAndScrollIntoView(firstBad);
      hapticERR();
      return;
    }

    // Подготавливаем данные профиля
    const cache = getChipsCache();
    const profileData = {
      real_name: (nameInput?.value || '').trim(),
      psn_id: (psnInput?.value || '').trim(),
      platforms: activeValues(cache.platform),
      modes: activeValues(cache.modes),
      goals: activeValues(cache.goals),
      difficulties: activeValues(cache.difficulty)
    };

    // Показываем индикатор загрузки
    const originalBtnText = profileSaveBtn?.textContent;
    if (profileSaveBtn) {
      profileSaveBtn.disabled = true;
      profileSaveBtn.textContent = 'Сохранение...';
    }

    try {
      // Отправляем данные на сервер
      await apiSaveProfile(profileData);
      
      // Обновляем отображение
      if (v_real_name) v_real_name.textContent = profileData.real_name || '—';
      if (v_psn_id) v_psn_id.textContent = profileData.psn_id || '—';
      refreshProfileView();

      hapticOK();
      tg?.showPopup?.({ title: 'Профиль обновлён', message: 'Данные сохранены на сервере.', buttons: [{ type: 'ok' }] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      
      // Показываем ошибку пользователю
      let errorMessage = 'Не удалось сохранить профиль.';
      if (error.status === 401) {
        errorMessage = 'Ошибка авторизации. Попробуйте перезапустить приложение.';
      } else if (error.status === 400) {
        errorMessage = error.message || 'Проверьте правильность заполнения полей.';
      } else if (error.status >= 500) {
        errorMessage = 'Ошибка сервера. Попробуйте позже.';
      } else if (!navigator.onLine) {
        errorMessage = 'Нет подключения к интернету.';
      }
      
      tg?.showPopup?.({ title: 'Ошибка', message: errorMessage, buttons: [{ type: 'ok' }] });
      hapticERR();
      
    } finally {
      // Восстанавливаем кнопку
      if (profileSaveBtn) {
        profileSaveBtn.disabled = false;
        profileSaveBtn.textContent = originalBtnText;
      }
    }
  });

  profileSaveBtn?.addEventListener('click', () => profileForm.requestSubmit());
}

// Функция для загрузки профиля при открытии экрана
export async function loadProfileOnScreenOpen() {
  await fetchProfileFromServer();
}

// Экспорт вспомогательных
export { renderChips, activeValues, setActive, shake, refreshProfileView, loadProfileToForm };
