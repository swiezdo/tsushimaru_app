// main.js
import { tg, $ } from './telegram.js';
import { showScreen, applyTopInset } from './ui.js';
import { initProfile } from './profile.js';
import { initTrophies } from './trophies.js';
import { initBuilds } from './builds.js';

// ---------------- Анти-«пролистывание» для тактильной отдачи (однократно глобально) ----------------
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
    return dt < 1200 && dx < 6 && dy < 6 && dsy < 6;
  };
})();

// ---------------- BackButton навигация ----------------
function isVisible(id) {
  const el = document.getElementById(id);
  return el && !el.classList.contains('hidden');
}
tg?.onEvent?.('backButtonClicked', () => {
  // простая схема возвратов
  if (isVisible('buildCreateScreen'))       { showScreen('builds'); return; }
  if (isVisible('buildDetailScreen'))       { showScreen('builds'); return; }
  if (isVisible('buildPublicDetailScreen')) { showScreen('builds'); return; }
  if (isVisible('trophyDetailScreen'))      { showScreen('trophies'); return; }
  if (isVisible('profileScreen') || isVisible('trophiesScreen') || isVisible('buildsScreen')) { showScreen('home'); return; }
  showScreen('home');
});

// ---------------- Кнопки главного экрана ----------------
function bindHomeButtons() {
  $('openProfileBtn')?.addEventListener('click', () => showScreen('profile'));
  $('trophiesBtn')?.addEventListener('click', () => showScreen('trophies'));
  $('buildsBtn')?.addEventListener('click',   () => { showScreen('builds'); });
}

// ---------------- Старт ----------------
window.addEventListener('DOMContentLoaded', async () => {
  applyTopInset();
  bindHomeButtons();

  // Порядок инициализаций
  initProfile();
  await initTrophies();
  initBuilds();

  showScreen('home');

  // Логотип/чип с username уже подставляется в initProfile()
});
