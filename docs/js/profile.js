// profile.js
import { tg, $, hapticTapSmart, hapticERR, hapticOK, hideKeyboard } from './telegram.js';
import { focusAndScrollIntoView, showScreen } from './ui.js';
import { fetchProfile, saveProfile as apiSaveProfile, uploadAvatar, API_BASE } from './api.js';
import { renderChips, activeValues, setActive, shake, prettyLines, validatePSNId, safeLocalStorageGet, safeLocalStorageSet } from './utils.js';

// ---------- Константы ----------
const PLATFORM   = ['🎮 PlayStation','💻 ПК'];
const MODES      = ['📖 Сюжет','🏹 Выживание','🗻 Испытания Иё','⚔️ Соперники','📜 Главы'];
const GOALS      = ['🔎 Узнать что-то новое','👥 Поиск тиммейтов','🏆 Получение наград'];
const DIFFICULTY = ['🥉 Бронза','🥈 Серебро','🥇 Золото','💎 Платина','👻 Кошмар','🔥 HellMode'];

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

// ---------- Аватарка (страница "Профиль" - неактивная) ----------
const avatarDisplay = $('avatarDisplay');
const avatarPreview = $('avatarPreview');
const avatarPlaceholder = $('avatarPlaceholder');

// ---------- Аватарка (страница "Редактировать профиль" - активная) ----------
const avatarEditUploadBtn = $('avatarEditUploadBtn');
const avatarEditFileInput = $('avatarEditFileInput');
const avatarEditPreview = $('avatarEditPreview');
const avatarEditPlaceholder = $('avatarEditPlaceholder');

let selectedAvatarFile = null; // Временное хранилище выбранного файла
let currentUserId = null; // ID текущего пользователя
let currentAvatarEditObjectUrl = null; // URL для локального превью на странице редактирования

// Исходное состояние профиля для отслеживания изменений
let originalProfileState = null;

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
  
  // Сохраняем исходное состояние для отслеживания изменений
  originalProfileState = {
    real_name: profile.real_name || '',
    psn_id: profile.psn_id || '',
    platforms: [...(profile.platforms || [])],
    modes: [...(profile.modes || [])],
    goals: [...(profile.goals || [])],
    difficulties: [...(profile.difficulties || [])],
    avatar_url: profile.avatar_url || null
  };
  
  // Обновляем отображение в карточке "Ваш профиль"
  if (v_real_name) v_real_name.textContent = profile.real_name || '—';
  if (v_psn_id) v_psn_id.textContent = profile.psn_id || '—';
  refreshProfileView();
  
  // Обновляем аватарку на странице "Профиль" (неактивная)
  if (profile.avatar_url) {
    const avatarUrl = API_BASE + profile.avatar_url + '?t=' + Date.now();
    // Обновляем аватарку на странице "Профиль"
    if (avatarPreview) {
      avatarPreview.src = avatarUrl;
      avatarPreview.classList.remove('hidden');
    }
    if (avatarPlaceholder) {
      avatarPlaceholder.classList.add('hidden');
    }
    // Обновляем аватарку на странице "Редактировать профиль" (активная)
    if (avatarEditPreview) {
      avatarEditPreview.src = avatarUrl;
      avatarEditPreview.classList.remove('hidden');
    }
    if (avatarEditPlaceholder) {
      avatarEditPlaceholder.classList.add('hidden');
    }
    if (avatarEditUploadBtn) {
      avatarEditUploadBtn.classList.add('has-avatar');
    }
  } else {
    // Нет аватарки - показываем placeholder
    if (avatarPreview) {
      avatarPreview.classList.add('hidden');
    }
    if (avatarPlaceholder) {
      avatarPlaceholder.classList.remove('hidden');
    }
    if (avatarEditPreview) {
      avatarEditPreview.classList.add('hidden');
    }
    if (avatarEditPlaceholder) {
      avatarEditPlaceholder.classList.remove('hidden');
    }
    if (avatarEditUploadBtn) {
      avatarEditUploadBtn.classList.remove('has-avatar');
    }
  }
}

// Загрузка профиля с сервера
async function fetchProfileFromServer() {
  try {
    const serverProfile = await fetchProfile();
    if (serverProfile) {
      // Сохраняем user_id из профиля для загрузки аватарки
      currentUserId = serverProfile.user_id;
      // Обновляем форму и отображение
      loadProfileToForm(serverProfile);
    }
  } catch (error) {
    
    // Показываем ошибку для всех случаев (online-only режим)
    if (error.status === 401) {
      tg?.showPopup?.({ 
        title: 'Ошибка авторизации', 
        message: 'Не удалось авторизоваться в системе.', 
        buttons: [{ type: 'ok' }] 
      });
    } else if (error.status === 404) {
      // 404 - профиль не создан, это нормально для первого входа
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

  // Обработчики аватарки на странице "Редактировать профиль" (активная)
  if (avatarEditUploadBtn && avatarEditFileInput) {
    avatarEditUploadBtn.addEventListener('click', () => {
      hapticTapSmart();
      avatarEditFileInput.click();
    });
    
    avatarEditFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Валидация типа файла
      if (!file.type.startsWith('image/')) {
        tg?.showPopup?.({ 
          title: 'Ошибка', 
          message: 'Разрешены только изображения.', 
          buttons: [{ type: 'ok' }] 
        });
        hapticERR();
        e.target.value = ''; // Очищаем input
        return;
      }
      
      // Валидация размера (10 МБ)
      if (file.size > 10 * 1024 * 1024) {
        tg?.showPopup?.({ 
          title: 'Ошибка', 
          message: 'Размер файла не должен превышать 10 МБ.', 
          buttons: [{ type: 'ok' }] 
        });
        hapticERR();
        e.target.value = '';
        return;
      }
      
      // Освобождаем предыдущий objectUrl если он был
      if (currentAvatarEditObjectUrl) {
        URL.revokeObjectURL(currentAvatarEditObjectUrl);
      }
      
      // Создаем превью на странице редактирования
      currentAvatarEditObjectUrl = URL.createObjectURL(file);
      avatarEditPreview.src = currentAvatarEditObjectUrl;
      avatarEditPreview.classList.remove('hidden');
      avatarEditPlaceholder.classList.add('hidden');
      avatarEditUploadBtn.classList.add('has-avatar');
      
      // Сохраняем файл для загрузки
      selectedAvatarFile = file;
      
      hapticTapSmart();
    });
  }

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
      const saveResult = await apiSaveProfile(profileData);
      
      // Получаем user_id из ответа сервера (важно для первого сохранения профиля)
      // Проверяем несколько возможных форматов ответа
      if (!currentUserId && saveResult) {
        currentUserId = saveResult.user_id || saveResult.userId || saveResult.id || null;
      }
      
      // Если user_id не получен из ответа, перезагружаем профиль для получения user_id
      if (!currentUserId && selectedAvatarFile) {
        try {
          await fetchProfileFromServer();
        } catch (fetchError) {
          // Игнорируем ошибку
        }
      }
      
      // Загружаем аватарку если выбрана и user_id доступен
      if (selectedAvatarFile && currentUserId) {
        try {
          await uploadAvatar(currentUserId, selectedAvatarFile);
          // Освобождаем objectUrl локального превью
          if (currentAvatarEditObjectUrl) {
            URL.revokeObjectURL(currentAvatarEditObjectUrl);
            currentAvatarEditObjectUrl = null;
          }
          // Перезагружаем профиль чтобы получить обновленную аватарку
          await fetchProfileFromServer();
          selectedAvatarFile = null; // Очищаем после успешной загрузки
        } catch (avatarError) {
          // Не прерываем успех сохранения профиля, просто игнорируем ошибку
        }
      } else {
        // Обновляем отображение только если аватарка не загружалась
        if (v_real_name) v_real_name.textContent = profileData.real_name || '—';
        if (v_psn_id) v_psn_id.textContent = profileData.psn_id || '—';
        refreshProfileView();
      }

      hapticOK();
      // Сбрасываем исходное состояние после успешного сохранения
      originalProfileState = null;
      selectedAvatarFile = null;
      if (currentAvatarEditObjectUrl) {
        URL.revokeObjectURL(currentAvatarEditObjectUrl);
        currentAvatarEditObjectUrl = null;
      }
      
      tg?.showPopup?.({ title: 'Профиль обновлён', message: 'Данные профиля успешно сохранены.', buttons: [{ type: 'ok' }] }, () => {
        // Возвращаемся на страницу профиля после закрытия попапа
        showScreen('profile');
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Обновляем список участников, если он открыт
      // Используем динамический импорт чтобы избежать циклических зависимостей
      import('./participants.js').then(module => {
        module.refreshParticipantsList().catch(() => {});
      }).catch(() => {});
      
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

// Проверка наличия несохраненных изменений
export function hasUnsavedChanges() {
  if (!originalProfileState || !profileForm) return false;
  
  const cache = getChipsCache();
  const currentState = {
    real_name: (profileForm.real_name?.value || '').trim(),
    psn_id: (profileForm.psn_id?.value || '').trim(),
    platforms: activeValues(cache.platform).sort(),
    modes: activeValues(cache.modes).sort(),
    goals: activeValues(cache.goals).sort(),
    difficulties: activeValues(cache.difficulty).sort(),
    hasNewAvatar: selectedAvatarFile !== null
  };
  
  const originalState = {
    real_name: originalProfileState.real_name || '',
    psn_id: originalProfileState.psn_id || '',
    platforms: (originalProfileState.platforms || []).sort(),
    modes: (originalProfileState.modes || []).sort(),
    goals: (originalProfileState.goals || []).sort(),
    difficulties: (originalProfileState.difficulties || []).sort(),
    hasNewAvatar: false
  };
  
  // Проверяем изменения в текстовых полях
  if (currentState.real_name !== originalState.real_name) return true;
  if (currentState.psn_id !== originalState.psn_id) return true;
  
  // Проверяем изменения в чипах
  if (JSON.stringify(currentState.platforms) !== JSON.stringify(originalState.platforms)) return true;
  if (JSON.stringify(currentState.modes) !== JSON.stringify(originalState.modes)) return true;
  if (JSON.stringify(currentState.goals) !== JSON.stringify(originalState.goals)) return true;
  if (JSON.stringify(currentState.difficulties) !== JSON.stringify(originalState.difficulties)) return true;
  
  // Проверяем изменения в аватарке
  if (currentState.hasNewAvatar !== originalState.hasNewAvatar) return true;
  
  return false;
}

// Функция для загрузки профиля при открытии экрана
export async function loadProfileOnScreenOpen() {
  selectedAvatarFile = null; // Сбрасываем выбранный файл при загрузке профиля
  // Освобождаем objectUrl локального превью если был
  if (currentAvatarEditObjectUrl) {
    URL.revokeObjectURL(currentAvatarEditObjectUrl);
    currentAvatarEditObjectUrl = null;
  }
  originalProfileState = null; // Сбрасываем исходное состояние
  await fetchProfileFromServer();
}

// Экспорт вспомогательных
export { renderChips, activeValues, setActive, shake, refreshProfileView, loadProfileToForm };
