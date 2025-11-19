// main.js
import { tg, $, hapticTapSmart, closeWebApp } from './telegram.js';
import { showScreen, applySafeInsets, screens } from './ui.js';
import { goBack, setMainScreen } from './navigation.js';
import { initProfile } from './profile.js';
import { initParticipants } from './participants.js';
import { initBuilds } from './builds.js';
import { initParticipantDetail } from './participantDetail.js';
import { initWhatsNew, renderWhatsNewCards } from './whatsNew.js';
import { initFeedback } from './feedback.js';
import { initMastery } from './mastery.js';
import { initTrophies } from './trophies.js';
import { initTrophiesList } from './trophies_list.js';
import { initSeasonTrophy } from './season_trophy.js';
import { checkUserRegistration, checkGroupMembership, notifyBotUserNotRegistered } from './api.js';
import { initWaves, openWavesScreen } from './waves.js';
import { initStaticImage, playAnimationOnce } from './utils.js';

// ---------------- Анти-«пролистывание» для тактильной отдачи (глобально один раз) ----------------
(function installHapticGuardOnce(){
  if (window.__tsuHapticInstalled) return;
  window.__tsuHapticInstalled = true;

  let lastDown = { x:0, y:0, sy:0, t:0 };
  window.addEventListener('pointerdown', (e)=>{
    lastDown = { x:e.clientX||0, y:e.clientY||0, sy:window.scrollY||0, t:Date.now() };
  }, { passive:true });

  window.__tsuShouldHaptic = function(){
    const dt  = Date.now() - lastDown.t;
    const dx  = Math.abs((window.__lastUpX ?? lastDown.x) - lastDown.x);
    const dy  = Math.abs((window.__lastUpY ?? lastDown.y) - lastDown.y);
    const dsy = Math.abs((window.scrollY||0) - lastDown.sy);
    // если жест похож на прокрутку — не вибрируем
    return dt < 1200 && dx < 6 && dy < 6 && dsy < 6;
  };
})();

const START_SCREEN_KEY = 'preferredScreen';
const START_SCREEN_OPTIONS = [
  { value: 'home', label: 'Главная' },
  { value: 'participants', label: 'Участники' },
  { value: 'reward', label: 'Награды' },
  { value: 'rotation', label: 'Ротация' },
  { value: 'builds', label: 'Билды' },
  { value: 'profile', label: 'Профиль' },
];
const START_SCREEN_WITH_ACCESS_CHECK = new Set(['participants', 'reward', 'builds']);


// ---------------- BackButton навигация + Tap ----------------
function installBackButton() {
  tg?.onEvent?.('backButtonClicked', async () => {
    hapticTapSmart(); // Tap на Back
    
    // Определяем текущий экран
    const currentScreen = Object.keys(screens).find(key => {
      const screen = screens[key];
      return screen && !screen.classList.contains('hidden');
    });

    // Блокируем кнопку "Назад" на экране вступления в группу
    if (currentScreen === 'joinGroup') {
      return;
    }
    
    // Специальная проверка для страницы редактирования профиля
    if (currentScreen === 'profileEdit') {
      // Блокируем кнопку "Назад", если пользователь не зарегистрирован (навигация скрыта)
      const bottomNav = document.getElementById('bottomNav');
      if (bottomNav && bottomNav.classList.contains('hidden')) {
        // Пользователь не зарегистрирован - блокируем выход со страницы редактирования
        return;
      }
      
      // Динамически импортируем модуль профиля для проверки изменений
      try {
        const profileModule = await import('./profile.js');
        if (profileModule.hasUnsavedChanges && profileModule.hasUnsavedChanges()) {
          // Показываем попап с предупреждением
          tg?.showPopup?.({
            title: 'Несохраненные изменения',
            message: 'У вас есть несохраненные изменения. Вы уверены, что хотите выйти?',
            buttons: [
              { id: 'cancel', type: 'default', text: 'Отменить' },
              { id: 'discard', type: 'destructive', text: 'Выйти без сохранения' }
            ]
          }, async (buttonId) => {
            if (buttonId === 'discard') {
              // Выходим без сохранения - используем систему навигации
              await goBack();
            }
            // Если buttonId === 'cancel', ничего не делаем - остаемся на странице
          });
          return; // Прерываем выполнение, ждем ответа пользователя
        }
      } catch (error) {
        console.error('Ошибка проверки несохраненных изменений:', error);
        // При ошибке просто продолжаем навигацию
      }
    }

    // Используем систему навигации на основе стека
    await goBack();
  });
}

// ---------------- Главная: обработчики удалены (теперь в home.js) ----------------
function bindHomeButtons() {
  // Обработчики кнопок главной страницы перенесены в home.js
  // Оставляем только обработчик кнопки редактирования профиля
  const profileEditBtn = $('profileEditBtn');
  if (profileEditBtn) {
    profileEditBtn.addEventListener('click', () => {
      hapticTapSmart();
      showScreen('profileEdit');
    });
  }
}

// ---------------- Bottom Navigation ----------------
function bindBottomNav() {
  const bottomNav = document.getElementById('bottomNav');
  if (!bottomNav) return;

  // Инициализация: создаем статичные изображения для всех элементов с data-static="true"
  const staticImages = bottomNav.querySelectorAll('img[data-static="true"]');
  staticImages.forEach(img => {
    // initStaticImage теперь асинхронная, но мы не ждем её завершения
    initStaticImage(img).catch(err => {
      console.warn('Ошибка при инициализации статичного изображения:', err);
    });
  });

  // Обработчики для кнопок с data-screen
  const screenButtons = bottomNav.querySelectorAll('[data-screen]');
  screenButtons.forEach(btn => {
    const screenName = btn.dataset.screen;
    btn.addEventListener('click', () => {
      // Блокируем навигацию, если навигация скрыта (пользователь не зарегистрирован)
      if (bottomNav.classList.contains('hidden')) {
        return;
      }
      
      hapticTapSmart();
      
      // Запускаем анимацию для всех кнопок с анимированными иконками
      const animatedImg = btn.querySelector('img[data-static="true"]');
      if (animatedImg) {
        playAnimationOnce(animatedImg);
      }
      
      // Переход на экран
      setMainScreen(screenName);
      showScreen(screenName);
    });
  });

}

const startScreenModal = $('startScreenModal');
const startScreenOptionsEl = $('startScreenOptions');
const startScreenSaveBtn = $('startScreenSaveBtn');

function getPreferredStartScreen() {
  const stored = localStorage.getItem(START_SCREEN_KEY);
  return START_SCREEN_OPTIONS.some(option => option.value === stored) ? stored : 'home';
}

function setPreferredStartScreen(screen) {
  if (START_SCREEN_OPTIONS.some(option => option.value === screen)) {
    localStorage.setItem(START_SCREEN_KEY, screen);
  } else {
    localStorage.removeItem(START_SCREEN_KEY);
  }
}

function renderStartScreenOptions() {
  if (!startScreenOptionsEl || startScreenOptionsEl.childElementCount) return;
  START_SCREEN_OPTIONS.forEach(({ value, label }) => {
    const option = document.createElement('label');
    option.className = 'start-screen-option';
    option.innerHTML = `
      <input type="radio" name="startScreen" value="${value}" />
      <span>${label}</span>
    `;
    startScreenOptionsEl.appendChild(option);
  });
}

function openStartScreenModal() {
  if (!startScreenModal) return;
  renderStartScreenOptions();
  const current = getPreferredStartScreen();
  const activeInput = startScreenOptionsEl?.querySelector(`input[value="${current}"]`);
  if (activeInput) {
    activeInput.checked = true;
  }
  startScreenModal.classList.remove('hidden');
}

function closeStartScreenModal() {
  startScreenModal?.classList.add('hidden');
}

function initStartScreenPreferenceUI() {
  if (!startScreenModal || !startScreenOptionsEl || !startScreenSaveBtn) return;

  document.addEventListener('click', (event) => {
    const btn = event.target.closest?.('#homeSettingsBtn');
    if (btn) {
      event.preventDefault();
      hapticTapSmart();
      openStartScreenModal();
    }
  });

  startScreenModal.addEventListener('click', (event) => {
    if (event.target === startScreenModal) {
      closeStartScreenModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !startScreenModal.classList.contains('hidden')) {
      closeStartScreenModal();
    }
  });

  startScreenSaveBtn.addEventListener('click', () => {
    const selected = startScreenOptionsEl.querySelector('input[name="startScreen"]:checked');
    const value = selected?.value || 'home';
    setPreferredStartScreen(value);
    hapticTapSmart();
    closeStartScreenModal();
  });
}

async function ensureStartScreenAccess(screen) {
  if (!START_SCREEN_WITH_ACCESS_CHECK.has(screen)) {
    return true;
  }
  try {
    const result = await checkUserRegistration();
    const isRegistered = typeof result === 'object' ? result.isRegistered : result;
    const isInGroup = typeof result === 'object' ? result.isInGroup : true;
    return Boolean(isRegistered && isInGroup);
  } catch (error) {
    console.error('Ошибка проверки доступа к стартовому экрану:', error);
    return false;
  }
}

async function showInitialScreen() {
  const preferred = getPreferredStartScreen();
  if (preferred === 'home') {
    setMainScreen('home');
    showScreen('home');
    return;
  }
  const allowed = await ensureStartScreenAccess(preferred);
  if (!allowed) {
    setMainScreen('home');
    showScreen('home');
    return;
  }
  setMainScreen(preferred);
  showScreen(preferred);
}

// ---------------- Применение стилей к кнопкам с фоновыми изображениями ----------------
function applyButtonBackgroundStyles() {
  // Функция для применения стилей к кнопкам по тексту
  const applyStylesToButton = (btn) => {
    if (!btn || !btn.classList.contains('btn')) return;
    
    const text = btn.textContent.trim();
    if (text === 'Отправить' || text === 'Сохранить' || text === 'Создать') {
      btn.setAttribute('data-bg-image', 'green');
    } else if (text === 'Редактировать' || text === 'Создать билд' || text === 'Опубликовать') {
      btn.setAttribute('data-bg-image', 'blue');
    } else if (text === 'Скрыть' || text === 'Удалить') {
      btn.setAttribute('data-bg-image', 'red');
    }
  };
  
  // Применяем стили к существующим кнопкам
  const buttons = Array.from(document.querySelectorAll('button.btn'));
  buttons.forEach(applyStylesToButton);
  
  // Наблюдатель за изменениями DOM для динамически создаваемых кнопок и изменений текста
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Обработка новых кнопок
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (node.tagName === 'BUTTON') {
            applyStylesToButton(node);
          }
          // Также проверяем вложенные кнопки
          const nestedButtons = node.querySelectorAll?.('button.btn');
          if (nestedButtons) {
            nestedButtons.forEach(applyStylesToButton);
          }
        }
      });
      
      // Обработка изменений текста в существующих кнопках
      if (mutation.type === 'characterData' || mutation.type === 'childList') {
        const target = mutation.target;
        if (target.tagName === 'BUTTON' || target.closest?.('button.btn')) {
          const btn = target.tagName === 'BUTTON' ? target : target.closest('button.btn');
          if (btn) {
            applyStylesToButton(btn);
          }
        }
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// ---------------- Управление видимостью нижней навигации ----------------
export function setBottomNavVisible(visible) {
  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav) {
    if (visible) {
      bottomNav.classList.remove('hidden');
    } else {
      bottomNav.classList.add('hidden');
    }
  }
}


// ---------------- Старт ----------------
async function startApp() {
  applySafeInsets();
  bindHomeButtons();
  bindBottomNav();
  installBackButton();
  applyButtonBackgroundStyles();
  initStartScreenPreferenceUI();

  initProfile();
  await initParticipants();
  initBuilds();
  initParticipantDetail();
  initWhatsNew();
  initFeedback();
  
  // Предзагрузка мастерства в фоне (не await - загружается параллельно)
  initMastery();
  
  // Инициализация модуля трофеев
  initTrophies();
  
  // Инициализация модуля списка трофеев
  initTrophiesList();
  
  // Инициализация модуля сезонного трофея
  initSeasonTrophy();

  // Инициализация модуля волн
  initWaves();

  // Инициализация видимости кнопки настроек
  const settingsBtn = document.getElementById('homeSettingsBtn');
  if (settingsBtn) {
    settingsBtn.classList.add('hidden');
  }

  // Проверка участия в группе и регистрации пользователя
  try {
    // Сначала проверяем участие в группе
    const isInGroup = await checkGroupMembership();
    
    if (!isInGroup) {
      // Пользователь не в группе - уведомляем бота и закрываем приложение
      await notifyBotUserNotRegistered();
      closeWebApp();
      return;
    }
    
    // Пользователь в группе - проверяем наличие в БД
    const isRegistered = await checkUserRegistration();
    
    if (!isRegistered) {
      // Пользователь не зарегистрирован - показываем страницу редактирования профиля
      setBottomNavVisible(false);
      showScreen('profileEdit');
    } else {
      // Пользователь зарегистрирован и в группе - показываем обычный стартовый экран
      setBottomNavVisible(true);
      await showInitialScreen();
    }
  } catch (error) {
    console.error('Ошибка проверки регистрации:', error);
    // При ошибке считаем что пользователь не зарегистрирован
    setBottomNavVisible(false);
    showScreen('profileEdit');
  }
  
  // Защита SVG и изображений от скачивания (кроме билдов и свитков)
  installImageProtection();
}

// Защита изображений и SVG от контекстного меню и скачивания
function installImageProtection() {
  // Обработчик для всех изображений и SVG, кроме билдов и свитков
  document.addEventListener('contextmenu', (e) => {
    const target = e.target;
    
    // Проверяем, является ли элемент изображением или SVG
    if (target.tagName === 'IMG' || target.tagName === 'SVG' || target.closest('svg')) {
      // Разрешаем контекстное меню для изображений билдов
      if (target.closest('.shots-grid') || 
          target.closest('.shot-thumb') ||
          target.closest('.buildDetailShots') ||
          target.closest('.publicDetailShots') ||
          target.closest('.lightbox')) {
        return; // Разрешаем контекстное меню
      }
      
      // Разрешаем контекстное меню для изображений свитков Гёдзена
      if (target.closest('.story-scroll-images')) {
        return; // Разрешаем контекстное меню
      }
      
      // Запрещаем контекстное меню для всех остальных изображений и SVG
      e.preventDefault();
      return false;
    }
  }, { passive: false });
  
  // Дополнительная защита: запрет перетаскивания для SVG и защищенных изображений
  document.addEventListener('dragstart', (e) => {
    const target = e.target;
    
    if (target.tagName === 'IMG' || target.tagName === 'SVG' || target.closest('svg')) {
      // Разрешаем перетаскивание для изображений билдов
      if (target.closest('.shots-grid') || 
          target.closest('.shot-thumb') ||
          target.closest('.buildDetailShots') ||
          target.closest('.publicDetailShots') ||
          target.closest('.lightbox')) {
        return; // Разрешаем перетаскивание
      }
      
      // Разрешаем перетаскивание для изображений свитков
      if (target.closest('.story-scroll-images')) {
        return; // Разрешаем перетаскивание
      }
      
      // Запрещаем перетаскивание для всех остальных
      e.preventDefault();
      return false;
    }
  }, { passive: false });
}

// Надёжный запуск
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startApp, { once: true });
} else {
  startApp();
}
