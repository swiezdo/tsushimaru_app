// main.js
import { tg, $, hapticTapSmart } from './telegram.js';
import { showScreen, applySafeInsets, screens } from './ui.js';
import { initProfile } from './profile.js';
import { initParticipants } from './participants.js';
import { initBuilds } from './builds.js';
import { initParticipantDetail } from './participantDetail.js';
import { initWhatsNew, renderWhatsNewCards } from './whatsNew.js';
import { initFeedback } from './feedback.js';
import { initMastery } from './mastery.js';
import { initTrophies } from './trophies.js';
import { initTrophiesList } from './trophies_list.js';
import { checkUserRegistration } from './api.js';
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

const BACK_ROUTES = {
  buildCreate: 'builds',
  buildEdit: 'buildDetail',
  buildDetail: 'builds',
  buildPublicDetail: 'builds',
  profile: 'home',
  profileEdit: 'profile',
  waves: 'home',
  participants: 'home',
  builds: 'home',
  whatsNew: 'home',
  feedback: 'whatsNew',
  reward: 'home',
  rewardDetail: 'reward',
  trophyDetail: 'reward',
};

function parseSpecialScreen(previousValue, prefix) {
  if (!previousValue || !previousValue.startsWith(prefix)) return null;
  const [, id] = previousValue.split(':');
  return id || null;
}

async function importBuildsModule() {
  return import('./builds.js');
}

async function importParticipantDetailModule() {
  return import('./participantDetail.js');
}

async function handleSpecialBackNavigation({ currentScreen, nextScreen, previousScreen }) {
  // Возврат в карточку участника после выбора другого участника
  if (nextScreen === 'participantDetail') {
    const participantId = parseSpecialScreen(previousScreen, 'participantDetail:');
    if (participantId) {
      try {
        const module = await importParticipantDetailModule();
        await module.openParticipantDetail(participantId);
      } catch (error) {
        console.error('Ошибка импорта participantDetail.js:', error);
        showScreen('participants');
      }
      return true;
    }
  }

  // Возврат к публичному билду из списка участников
  if (nextScreen === 'buildPublicDetail') {
    const buildId = parseSpecialScreen(previousScreen, 'buildPublicDetail:');
    if (buildId) {
      try {
        const module = await importBuildsModule();
        await module.openPublicBuildDetail(buildId);
      } catch (error) {
        console.error('Ошибка импорта builds.js:', error);
        showScreen('builds');
      }
      return true;
    }
  }

  // Переход назад из профиля участника к билду, откуда пришли
  if (currentScreen === 'participantDetail') {
    const buildId = parseSpecialScreen(previousScreen, 'buildPublicDetail:');
    if (buildId) {
      try {
        const module = await importBuildsModule();
        await module.openPublicBuildDetail(buildId);
      } catch (error) {
        console.error('Ошибка импорта builds.js:', error);
        showScreen('builds');
      }
      return true;
    }
  }

  // При возврате на экран билдов нужно обновить статистику
  if (currentScreen === 'buildPublicDetail' && nextScreen === 'builds') {
    try {
      const module = await importBuildsModule();
      await module.checkAndRefreshBuilds();
    } catch (error) {
      console.error('Ошибка импорта builds.js:', error);
    }
    showScreen(nextScreen);
    return true;
  }

  return false;
}

// ---------------- BackButton навигация + Tap ----------------
function installBackButton() {
  tg?.onEvent?.('backButtonClicked', async () => {
    hapticTapSmart(); // Tap на Back
    
    // Определяем текущий экран и следующий экран
    const currentScreen = Object.keys(screens).find(key => {
      const screen = screens[key];
      return screen && !screen.classList.contains('hidden');
    });
    
    // Проверяем sessionStorage для специальных случаев навигации
    const previousScreen = sessionStorage.getItem('previousScreen');
    
    // Обрабатываем специальные случаи ПЕРЕД использованием BACK_ROUTES
    let nextScreen;
    
    if (currentScreen === 'participantDetail') {
      // Возврат из профиля участника
      if (previousScreen === 'participants') {
        // Пришли из списка участников - возвращаемся туда
        nextScreen = 'participants';
      } else if (previousScreen?.startsWith('buildPublicDetail:')) {
        // Пришли из билда - обрабатывается в handleSpecialBackNavigation
        nextScreen = 'buildPublicDetail';
      } else {
        // По умолчанию возвращаемся на страницу участников
        nextScreen = 'participants';
      }
    } else {
      // Для остальных экранов используем BACK_ROUTES
      nextScreen = BACK_ROUTES[currentScreen] || 'home';
      
      // Специальный случай: возврат из билда к участнику
    if (nextScreen === 'buildPublicDetail' && previousScreen?.startsWith('participantDetail:')) {
      nextScreen = 'participantDetail';
      }
    }

    const handled = await handleSpecialBackNavigation({
      currentScreen,
      nextScreen,
      previousScreen,
    });

    if (!handled) {
      showScreen(nextScreen);
      // Удаляем previousScreen только после успешного перехода
      if (previousScreen) {
        sessionStorage.removeItem('previousScreen');
      }
    } else {
      // Если handled = true, previousScreen уже обработан в handleSpecialBackNavigation
      // Но нужно его удалить, если переход выполнен
      if (previousScreen && (previousScreen === 'participants' || previousScreen.startsWith('buildPublicDetail:'))) {
        sessionStorage.removeItem('previousScreen');
      }
    }
  });
}

// ---------------- Проверка регистрации ----------------
async function requireRegistration(callback) {
  const result = await checkUserRegistration();
  
  // Проверяем, что result - это объект (новый формат) или boolean (старый формат для обратной совместимости)
  const isRegistered = typeof result === 'object' ? result.isRegistered : result;
  const isInGroup = typeof result === 'object' ? result.isInGroup : true; // Для обратной совместимости считаем что в группе
  
  // Если пользователь не зарегистрирован
  if (!isRegistered) {
    // Показываем Telegram попап
    tg?.showPopup({
      title: "Требуется регистрация",
      message: "Эти функции доступны только зарегистрированным пользователям",
      buttons: [
        { id: "cancel", type: "default", text: "Ок" },
        { id: "register", type: "destructive", text: "Создать профиль" }
      ]
    }, (buttonId) => {
      if (buttonId === "register") {
        showScreen('profile');
      }
      // При нажатии "Ок" или закрытии попапа остаемся на главной
    });
    return;
  }
  
  // Если пользователь зарегистрирован, но не в группе
  if (!isInGroup) {
    // Показываем Telegram попап с предложением присоединиться к группе
    tg?.showPopup({
      title: "Требуется участие в группе",
      message: "Эти функции доступны только участникам группы Tsushima.Ru. Пожалуйста, присоединитесь к группе.",
      buttons: [
        { id: "cancel", type: "default", text: "Ок" },
        { id: "joinGroup", type: "destructive", text: "Открыть группу" }
      ]
    }, (buttonId) => {
      if (buttonId === "joinGroup") {
        // Открываем ссылку на группу
        window.open("https://t.me/+ZFiVYVrz-PEzYjBi", "_blank");
      }
      // При нажатии "Ок" или закрытии попапа остаемся на главной
    });
    return;
  }
  
  // Если зарегистрирован и в группе - выполняем callback
  callback();
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
      hapticTapSmart();
      
      // Запускаем анимацию для всех кнопок с анимированными иконками
      const animatedImg = btn.querySelector('img[data-static="true"]');
      if (animatedImg) {
        playAnimationOnce(animatedImg);
      }
      
      // Обработка разных экранов с requireRegistration
      if (screenName === 'reward') {
        requireRegistration(() => { 
          showScreen('reward'); 
        });
      } else if (screenName === 'participants') {
        requireRegistration(() => showScreen('participants'));
      } else if (screenName === 'waves') {
        requireRegistration(() => { 
          showScreen('waves'); 
          openWavesScreen(); 
        });
      } else if (screenName === 'builds') {
        requireRegistration(() => showScreen('builds'));
      } else {
        // Домой и Профиль - без requireRegistration
        showScreen(screenName);
      }
    });
  });

  // Обработчик для кнопки группы (Telegram)
  const groupBtn = document.getElementById('bottomNavGroupBtn');
  if (groupBtn) {
    groupBtn.addEventListener('click', () => {
      hapticTapSmart();
      window.open("https://t.me/+ZFiVYVrz-PEzYjBi", "_blank");
    });
  }
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

// ---------------- Старт ----------------
async function startApp() {
  applySafeInsets();
  bindHomeButtons();
  bindBottomNav();
  installBackButton();
  applyButtonBackgroundStyles();

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

  // Инициализация модуля волн
  initWaves();

  showScreen('home');
}

// Надёжный запуск
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startApp, { once: true });
} else {
  startApp();
}
