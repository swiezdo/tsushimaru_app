// main.js
import { tg, $, hapticTapSmart } from './telegram.js';
import { showScreen, applySafeInsets, screens } from './ui.js';
import { initProfile } from './profile.js';
import { initTrophies } from './trophies.js';
import { initParticipants } from './participants.js';
import { initBuilds } from './builds.js';
import { initParticipantDetail } from './participantDetail.js';
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
      'buildDetail': 'builds', 
      'buildPublicDetail': previousScreen ? (previousScreen.startsWith('participantDetail:') ? 'participantDetail' : 'builds') : 'builds',
      'trophyDetail': 'trophies',
      'profile': 'home',
      'trophies': 'home',
      'participants': 'home',
      'builds': 'home',
      'participantDetail': previousScreen || 'participants'
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
    
    // Очищаем sessionStorage после использования
    if (previousScreen) {
      sessionStorage.removeItem('previousScreen');
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
    ['trophiesBtn',    () => requireRegistration(() => showScreen('trophies'))],
    ['participantsBtn', () => requireRegistration(() => showScreen('participants'))],
    ['buildsBtn',      () => requireRegistration(() => showScreen('builds'))],
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
  await initTrophies();
  await initParticipants();
  initBuilds();
  initParticipantDetail();

  showScreen('home');
}

// Надёжный запуск
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startApp, { once: true });
} else {
  startApp();
}
