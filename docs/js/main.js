// main.js
import { tg, $, hapticTapSmart } from './telegram.js';
import { showScreen, applySafeInsets } from './ui.js';
import { initProfile } from './profile.js';
import { initTrophies } from './trophies.js';
import { initBuilds } from './builds.js';

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
function isVisible(id) {
  const el = document.getElementById(id);
  return el && !el.classList.contains('hidden');
}
function installBackButton() {
  tg?.onEvent?.('backButtonClicked', () => {
    hapticTapSmart(); // Tap на Back
    if (isVisible('buildCreateScreen'))       { showScreen('builds'); return; }
    if (isVisible('buildDetailScreen'))       { showScreen('builds'); return; }
    if (isVisible('buildPublicDetailScreen')) { showScreen('builds'); return; }
    if (isVisible('trophyDetailScreen'))      { showScreen('trophies'); return; }
    if (isVisible('profileScreen') || isVisible('trophiesScreen') || isVisible('buildsScreen')) {
      showScreen('home'); return;
    }
    showScreen('home');
  });
}

// ---------------- Главная: Tap на все кнопки ----------------
function bindHomeButtons() {
  const map = [
    ['openProfileBtn', () => showScreen('profile')],
    ['trophiesBtn',    () => showScreen('trophies')],
    ['buildsBtn',      () => showScreen('builds')],
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
  initBuilds();

  showScreen('home');
}

// Надёжный запуск
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startApp, { once: true });
} else {
  startApp();
}
