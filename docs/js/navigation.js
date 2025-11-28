// navigation.js
// Система навигации на основе стека

import { showScreen, screens, saveScrollPosition } from './ui.js';

// Главные экраны - доступны через нижнюю панель навигации
const MAIN_SCREENS = ['home', 'participants', 'reward', 'rotation', 'builds', 'profile'];

// Стек навигации - хранит историю переходов
let navigationStack = [];

// Последний главный экран - точка отсчета для возврата назад
let lastMainScreen = 'home';

// Флаг для предотвращения добавления в стек при программном возврате назад
let isNavigatingBack = false;

// Хранилище параметров текущих экранов
const currentScreenParams = new Map();

/**
 * Проверяет, является ли экран главным
 * @param {string} screen - название экрана
 * @returns {boolean}
 */
function isMainScreen(screen) {
  return MAIN_SCREENS.includes(screen);
}

/**
 * Сохраняет параметры текущего экрана
 * @param {string} screen - название экрана
 * @param {object} params - параметры экрана
 */
export function setCurrentScreenParams(screen, params = {}) {
  currentScreenParams.set(screen, params);
}

/**
 * Получает параметры текущего экрана
 * @param {string} screen - название экрана
 * @returns {object} параметры экрана или пустой объект
 */
export function getCurrentScreenParams(screen) {
  return currentScreenParams.get(screen) || {};
}

/**
 * Добавляет текущий экран в стек навигации перед переходом на новый
 * @param {string} newScreen - название нового экрана, на который переходим
 * @param {object} newParams - параметры нового экрана
 */
export function pushNavigation(newScreen, newParams = {}) {
  // Не добавляем в стек, если это программный возврат назад
  if (isNavigatingBack) {
    isNavigatingBack = false;
    return;
  }

  // Определяем текущий экран
  const currentScreen = getCurrentScreen();
  
  // ВАЖНО: Сохраняем позицию скролла ДО всех действий, если текущий экран требует сохранения
  // Это должно быть ПЕРВЫМ действием, чтобы зафиксировать реальную позицию скролла
  if (currentScreen && ['participants', 'builds', 'home'].includes(currentScreen)) {
    saveScrollPosition(currentScreen);
  }
  
  // Предотвращаем дубликаты: если текущий экран уже является тем, на который мы переходим,
  // не добавляем его в стек (это может произойти при повторном открытии того же экрана)
  if (currentScreen === newScreen) {
    // Просто обновляем параметры текущего экрана
    setCurrentScreenParams(newScreen, newParams);
    return;
  }
  
  // Если есть текущий экран, добавляем его в стек с параметрами
  if (currentScreen) {
    const params = getCurrentScreenParams(currentScreen);
    // ВАЖНО: Всегда добавляем текущий экран в стек перед переходом на новый,
    // даже если он уже есть в стеке - это нужно для правильной навигации назад
    // НО: не добавляем, если последний элемент стека уже является этим экраном с теми же параметрами
    // (это предотвращает дубликаты при быстрых переходах)
    const lastStackItem = navigationStack.length > 0 ? navigationStack[navigationStack.length - 1] : null;
    if (!lastStackItem || lastStackItem.screen !== currentScreen || JSON.stringify(lastStackItem.params) !== JSON.stringify(params)) {
      navigationStack.push({
        screen: currentScreen,
        params: params
      });
    }
    
    // Если текущий экран - главный, сохраняем его как последний главный экран
    if (isMainScreen(currentScreen)) {
      lastMainScreen = currentScreen;
    }
  }

  // Сохраняем параметры нового экрана
  setCurrentScreenParams(newScreen, newParams);

  // Ограничиваем размер стека (последние 50 экранов)
  if (navigationStack.length > 50) {
    navigationStack = navigationStack.slice(-50);
  }
}

/**
 * Извлекает последний экран из стека и возвращает его
 * @returns {object|null} объект с screen и params или null, если стек пуст
 */
export function popNavigation() {
  if (navigationStack.length === 0) {
    return null;
  }
  return navigationStack.pop();
}

/**
 * Возвращает название текущего экрана (определяется по DOM)
 * @returns {string|null} название экрана или null
 */
function getCurrentScreen() {
  for (const [screenName, screenElement] of Object.entries(screens)) {
    if (screenElement && !screenElement.classList.contains('hidden')) {
      return screenName;
    }
  }
  return null;
}

/**
 * Восстанавливает экран с параметрами
 * @param {string} screen - название экрана
 * @param {object} params - параметры для восстановления
 */
async function restoreScreen(screen, params = {}) {
  switch (screen) {
    case 'participantDetail':
      if (params.userId) {
        const module = await import('./participantDetail.js');
        await module.openParticipantDetail(params.userId);
      } else {
        showScreen('participants', { restoring: true });
      }
      break;
      
    case 'buildPublicDetail':
      if (params.buildId) {
        const module = await import('./builds.js');
        module.openPublicBuildDetail(params.buildId);
      } else {
        showScreen('builds', { restoring: true });
      }
      break;
      
    case 'buildDetail':
      if (params.buildId) {
        const module = await import('./builds.js');
        module.openBuildDetail(params.buildId);
      } else {
        showScreen('builds', { restoring: true });
      }
      break;
      
    case 'trophyDetail':
      if (params.trophyKey) {
        const module = await import('./trophy_detail.js');
        await module.openTrophyDetail(params.trophyKey);
      } else {
        showScreen('reward');
      }
      break;
      
    case 'seasonTrophy':
      if (params.trophyKey) {
        const module = await import('./season_trophy_detail.js');
        await module.openSeasonTrophyDetail(params.trophyKey);
      } else {
        showScreen('reward');
      }
      break;
      
    case 'hellmodeQuestDetail':
      const hellmodeModule = await import('./hellmode_quest_detail.js');
      await hellmodeModule.openHellmodeQuestDetail();
      break;
      
    case 'top50Detail':
      if (params.category) {
        const top50Module = await import('./top50_detail.js');
        await top50Module.openTop50Detail(params.category);
      } else {
        showScreen('home', { restoring: true });
      }
      break;
      
    case 'home':
    case 'participants':
    case 'builds':
      // Для этих экранов уже вызван showScreen с restoring: true в goBack()
      // Здесь просто выполняем hook'и через вызов функции напрямую
      // Ничего не делаем, hook'и уже вызваны в showScreen
      break;
      
    default:
      // Для остальных экранов просто показываем их
      showScreen(screen);
      break;
  }
}

/**
 * Основная функция для кнопки "Назад"
 * Восстанавливает предыдущий экран из стека
 */
export async function goBack() {
  const previous = popNavigation();
  
  if (!previous) {
    showScreen(lastMainScreen, { restoring: true });
    return;
  }
  
  isNavigatingBack = true;
  // Передаем флаг restoring для восстановления позиции скролла
  showScreen(previous.screen, { restoring: true });
  setCurrentScreenParams(previous.screen, previous.params);
  await restoreScreen(previous.screen, previous.params);
  
  // Восстановление позиции теперь происходит в showScreen после выполнения hook'ов
  // Дополнительное восстановление не нужно, так как showScreen уже обрабатывает это
  
  isNavigatingBack = false;
}

/**
 * Устанавливает главный экран и очищает стек навигации
 * Используется при переходе на главные экраны через нижнюю панель
 * @param {string} screen - название главного экрана
 */
export function setMainScreen(screen) {
  if (isMainScreen(screen)) {
    lastMainScreen = screen;
    navigationStack = [];
    // Сохраняем параметры главного экрана (обычно пустые)
    setCurrentScreenParams(screen, {});
  }
}

/**
 * Очищает стек навигации
 * Используется для начальных экранов (home, главные разделы)
 */
export function clearNavigation() {
  navigationStack = [];
}

/**
 * Получает текущий размер стека (для отладки)
 */
export function getStackSize() {
  return navigationStack.length;
}

