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
import { checkUserRegistration } from './api.js';

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

// ---------------- BackButton навигация + Tap ----------------
function installBackButton() {
  tg?.onEvent?.('backButtonClicked', () => {
    hapticTapSmart(); // Tap на Back
    
    // Определяем текущий экран и следующий экран
    const currentScreen = Object.keys(screens).find(key => {
      const screen = screens[key];
      return screen && !screen.classList.contains('hidden');
    });
    
    // Проверяем sessionStorage для специальных случаев навигации
    const previousScreen = sessionStorage.getItem('previousScreen');
    
    // Маппинг экранов для навигации назад
    const backNavigation = {
      'buildCreate': 'builds',
      'buildEdit': 'buildDetail',
      'buildDetail': 'builds', 
      'buildPublicDetail': previousScreen ? (previousScreen.startsWith('participantDetail:') ? 'participantDetail' : 'builds') : 'builds',
      'profile': 'home',
      'participants': 'home',
      'builds': 'home',
      'whatsNew': 'home',
      'feedback': 'whatsNew',
      'reward': 'home',
      'rewardDetail': 'reward',
      'participantDetail': previousScreen ? (previousScreen.startsWith('buildPublicDetail:') ? 'buildPublicDetail' : 'participants') : 'participants'
    };
    
    let nextScreen = backNavigation[currentScreen] || 'home';
    
    // Обработка специального случая возврата к профилю участника
    if (nextScreen === 'participantDetail' && previousScreen && previousScreen.startsWith('participantDetail:')) {
      const userId = previousScreen.split(':')[1];
      // Импортируем функцию открытия профиля участника
      import('./participantDetail.js').then(module => {
        module.openParticipantDetail(userId);
      }).catch(error => {
        console.error('Ошибка импорта participantDetail.js:', error);
        showScreen('participants');
      });
      return;
    }
    
    // Обработка возврата из профиля участника к деталям билда
    if (nextScreen === 'buildPublicDetail' && previousScreen && previousScreen.startsWith('buildPublicDetail:')) {
      const buildId = previousScreen.split(':')[1];
      // Импортируем функцию открытия деталей публичного билда
      import('./builds.js').then(module => {
        module.openPublicBuildDetail(buildId);
      }).catch(error => {
        console.error('Ошибка импорта builds.js:', error);
        showScreen('builds');
      });
      return;
    }
    
    // Обработка возврата из профиля участника к деталям билда (когда пришли из buildPublicDetail)
    if (currentScreen === 'participantDetail' && previousScreen && previousScreen.startsWith('buildPublicDetail:')) {
      const buildId = previousScreen.split(':')[1];
      // Импортируем функцию открытия деталей публичного билда
      import('./builds.js').then(module => {
        module.openPublicBuildDetail(buildId);
      }).catch(error => {
        console.error('Ошибка импорта builds.js:', error);
        showScreen('builds');
      });
      return;
    }
    
    // Очищаем sessionStorage после использования
    if (previousScreen) {
      sessionStorage.removeItem('previousScreen');
    }
    
    // Проверяем и обновляем статистику билдов при возврате из buildPublicDetail на экран builds
    if (currentScreen === 'buildPublicDetail' && nextScreen === 'builds') {
      import('./builds.js').then(module => {
        module.checkAndRefreshBuilds();
        showScreen(nextScreen);
      }).catch(error => {
        console.error('Ошибка импорта builds.js:', error);
        showScreen(nextScreen);
      });
      return;
    }
    
    showScreen(nextScreen);
  });
}

// ---------------- Проверка регистрации ----------------
async function requireRegistration(callback) {
  const isRegistered = await checkUserRegistration();
  
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
  
  // Если зарегистрирован - выполняем callback
  callback();
}

// ---------------- Главная: Tap на все кнопки ----------------
function bindHomeButtons() {
  const map = [
    ['openProfileBtn', () => showScreen('profile')],
    ['participantsBtn', () => requireRegistration(() => showScreen('participants'))],
    ['buildsBtn',      () => requireRegistration(() => showScreen('builds'))],
    ['whatsNewBtn',    () => { showScreen('whatsNew'); renderWhatsNewCards(); }],
    ['rewardBtn',      () => requireRegistration(() => showScreen('reward'))],
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

  showScreen('home');
}

// Надёжный запуск
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startApp, { once: true });
} else {
  startApp();
}
