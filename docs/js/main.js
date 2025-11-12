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
    
    let nextScreen = BACK_ROUTES[currentScreen] || 'home';

    // Уточняем маршрут с учётом предыдущего экрана (например, возврат к участнику)
    if (nextScreen === 'buildPublicDetail' && previousScreen?.startsWith('participantDetail:')) {
      nextScreen = 'participantDetail';
    } else if (currentScreen === 'participantDetail' && previousScreen?.startsWith('buildPublicDetail:')) {
      nextScreen = 'buildPublicDetail';
    }

    const handled = await handleSpecialBackNavigation({
      currentScreen,
      nextScreen,
      previousScreen,
    });

    if (previousScreen) {
      sessionStorage.removeItem('previousScreen');
    }

    if (!handled) {
      showScreen(nextScreen);
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

// ---------------- Главная: Tap на все кнопки ----------------
function bindHomeButtons() {
  const map = [
    ['openProfileBtn', () => showScreen('profile')],
    ['wavesBtn', () => requireRegistration(() => { showScreen('waves'); openWavesScreen(); })],
    ['participantsBtn', () => requireRegistration(() => showScreen('participants'))],
    ['buildsBtn',      () => requireRegistration(() => showScreen('builds'))],
    ['whatsNewBtn',    () => { showScreen('whatsNew'); renderWhatsNewCards(); }],
    ['rewardBtn',      () => requireRegistration(() => { 
      showScreen('reward'); 
    })],
  ];
  for (const [id, handler] of map) {
    const el = $(id);
    if (!el) continue;
    el.addEventListener('click', () => { hapticTapSmart(); handler(); });
  }
}

// ---------------- Старт ----------------
async function startApp() {
  applySafeInsets();
  bindHomeButtons();
  installBackButton();

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
