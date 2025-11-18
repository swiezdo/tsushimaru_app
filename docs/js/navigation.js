// navigation.js
// Система навигации на основе стека

import { showScreen, screens } from './ui.js';

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
  
  // Если есть текущий экран, добавляем его в стек с параметрами
  if (currentScreen) {
    const params = getCurrentScreenParams(currentScreen);
    navigationStack.push({
      screen: currentScreen,
      params: params
    });
    
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
        showScreen('participants');
      }
      break;
      
    case 'buildPublicDetail':
      if (params.buildId) {
        const module = await import('./builds.js');
        module.openPublicBuildDetail(params.buildId);
      } else {
        showScreen('builds');
      }
      break;
      
    case 'buildDetail':
      if (params.buildId) {
        const module = await import('./builds.js');
        module.openBuildDetail(params.buildId);
      } else {
        showScreen('builds');
      }
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
    // Если стек пуст, возвращаемся на последний главный экран
    showScreen(lastMainScreen);
    return;
  }
  
  // Устанавливаем флаг, чтобы не добавить текущий экран в стек при восстановлении
  isNavigatingBack = true;
  
  // Восстанавливаем предыдущий экран
  await restoreScreen(previous.screen, previous.params);
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

