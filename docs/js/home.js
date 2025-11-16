// home.js
// Управление главной страницей с ротацией недель

import { getCurrentRotationWeek } from './api.js';
import { showScreen } from './ui.js';
import { openWavesScreen } from './waves.js';
import { tg, hapticTapSmart } from './telegram.js';
import { checkUserRegistration } from './api.js';

let rotationData = null;

/**
 * Загружает данные ротации из rotation.json
 * @returns {Promise<Object|null>} Объект с данными ротации или null при ошибке
 */
export async function loadRotationData() {
  try {
    const response = await fetch('./assets/data/rotation.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    rotationData = data;
    return data;
  } catch (error) {
    console.error('Ошибка загрузки данных ротации:', error);
    return null;
  }
}

/**
 * Загружает текущую неделю через API
 * @returns {Promise<number>} Номер текущей недели (1-16)
 */
export async function loadCurrentWeek() {
  try {
    const week = await getCurrentRotationWeek();
    return week;
  } catch (error) {
    console.error('Ошибка загрузки текущей недели:', error);
    return 14; // Возвращаем 14 по умолчанию
  }
}

/**
 * Получает данные для конкретной недели
 * @param {number} week - Номер недели (1-16)
 * @returns {Object|null} Данные недели или null
 */
function getWeekData(week) {
  if (!rotationData || !Array.isArray(rotationData)) {
    return null;
  }
  return rotationData.find(item => item.week === week) || null;
}

/**
 * Отображает контент ротации для текущей недели
 * @param {Object} weekData - Данные недели из rotation.json
 */
export function renderHomeContent(weekData) {
  if (!weekData) {
    console.error('Данные недели не найдены');
    return;
  }

  // Обновляем заголовок недели
  const weekTitle = document.getElementById('rotationWeekTitle');
  if (weekTitle) {
    weekTitle.textContent = `Неделя #${weekData.week}`;
  }

  // Сюжет
  const storyBtn = document.getElementById('rotationStoryBtn');
  const storyMap = storyBtn?.querySelector('.rotation-mode-map');
  const storyModIcon = document.getElementById('rotationStoryModIcon');
  
  if (storyMap) {
    storyMap.textContent = weekData.story || '—';
  }
  
  if (storyModIcon && weekData.story_mod_icon) {
    storyModIcon.src = `./assets/icons/mods/${weekData.story_mod_icon}`;
    storyModIcon.alt = weekData.story_mod || '';
  }

  // Выживание "Кошмар"
  const survivalBtn = document.getElementById('rotationSurvivalBtn');
  const survivalMap = survivalBtn?.querySelector('.rotation-mode-map');
  const survivalMod1Icon = document.getElementById('rotationSurvivalMod1Icon');
  const survivalMod2Icon = document.getElementById('rotationSurvivalMod2Icon');
  
  if (survivalMap) {
    survivalMap.textContent = weekData.survival || '—';
  }
  
  if (survivalMod1Icon && weekData.survival_mod1_icon) {
    survivalMod1Icon.src = `./assets/icons/mod1/${weekData.survival_mod1_icon}`;
    survivalMod1Icon.alt = weekData.survival_mod1 || '';
  }
  
  if (survivalMod2Icon && weekData.survival_mod2_icon) {
    survivalMod2Icon.src = `./assets/icons/mod2/${weekData.survival_mod2_icon}`;
    survivalMod2Icon.alt = weekData.survival_mod2 || '';
  }

  // Соперники
  const rivalsBtn = document.getElementById('rotationRivalsBtn');
  const rivalsMap = rivalsBtn?.querySelector('.rotation-mode-map');
  const rivalsModIcons = document.getElementById('rotationRivalsModIcons');
  
  if (rivalsMap) {
    rivalsMap.textContent = weekData.rivals || '—';
  }
  
  // Очищаем контейнер иконок модификаторов для соперников
  if (rivalsModIcons) {
    rivalsModIcons.innerHTML = '';
    
    // Добавляем иконку только если есть rivals_mod_icon
    if (weekData.rivals_mod_icon) {
      const modIconWrapper = document.createElement('div');
      modIconWrapper.className = 'waves-mod-icon';
      const modIconImg = document.createElement('img');
      modIconImg.src = `./assets/icons/mods/${weekData.rivals_mod_icon}`;
      modIconImg.alt = weekData.rivals_mod || '';
      modIconWrapper.appendChild(modIconImg);
      rivalsModIcons.appendChild(modIconWrapper);
    }
  }

  // Испытания Иё
  const trialsBtn = document.getElementById('rotationTrialsBtn');
  const trialsMap = trialsBtn?.querySelector('.rotation-mode-map');
  
  if (trialsMap) {
    trialsMap.textContent = weekData.trials || '—';
  }

  // TODO: Подготовка для фоновых изображений карт
  // В будущем здесь будет подстановка фоновых изображений:
  // - story: ./assets/maps/story/{story_map}.jpg
  // - survival: ./assets/maps/survival/{survival_map}.jpg
  // - rivals: ./assets/maps/rivals/{rivals_map}.jpg
  // - trials: ./assets/maps/trials/{trials_map}.jpg
}

/**
 * Инициализация главной страницы
 */
export async function initHome() {
  try {
    // Загружаем данные ротации и текущую неделю параллельно
    const [currentWeek, rotationJson] = await Promise.all([
      loadCurrentWeek(),
      loadRotationData()
    ]);

    if (!rotationJson) {
      console.error('Не удалось загрузить данные ротации');
      return;
    }

    // Получаем данные для текущей недели
    const weekData = getWeekData(currentWeek);
    
    if (!weekData) {
      console.error(`Данные для недели ${currentWeek} не найдены`);
      return;
    }

    // Отображаем контент
    renderHomeContent(weekData);

    // Настраиваем обработчики кнопок
    setupRotationButtons();
  } catch (error) {
    console.error('Ошибка инициализации главной страницы:', error);
  }
}

/**
 * Настраивает обработчики кнопок ротации
 */
function setupRotationButtons() {
  // Кнопка "Выживание" → ведет на страницу "Волны"
  const survivalBtn = document.getElementById('rotationSurvivalBtn');
  if (survivalBtn) {
    survivalBtn.addEventListener('click', async () => {
      hapticTapSmart();
      
      // Проверка регистрации
      const result = await checkUserRegistration();
      const isRegistered = typeof result === 'object' ? result.isRegistered : result;
      const isInGroup = typeof result === 'object' ? result.isInGroup : true;
      
      if (!isRegistered || !isInGroup) {
        if (!isRegistered) {
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
          });
        } else if (!isInGroup) {
          tg?.showPopup({
            title: "Требуется участие в группе",
            message: "Эти функции доступны только участникам группы Tsushima.Ru. Пожалуйста, присоединитесь к группе.",
            buttons: [
              { id: "cancel", type: "default", text: "Ок" },
              { id: "joinGroup", type: "destructive", text: "Открыть группу" }
            ]
          }, (buttonId) => {
            if (buttonId === "joinGroup") {
              window.open("https://t.me/+ZFiVYVrz-PEzYjBi", "_blank");
            }
          });
        }
        return;
      }
      
      // Если зарегистрирован и в группе - переходим на волны
      showScreen('waves');
      openWavesScreen();
    });
  }

  // Кнопка "Сюжет" → заглушка
  const storyBtn = document.getElementById('rotationStoryBtn');
  if (storyBtn) {
    storyBtn.addEventListener('click', () => {
      hapticTapSmart();
      tg?.showPopup({
        title: "Скоро",
        message: "Страница сюжета находится в разработке",
        buttons: [
          { id: "ok", type: "default", text: "Ок" }
        ]
      });
    });
  }

  // Кнопки "Соперники" и "Испытания Иё" некликабельные
  // (установлен атрибут disabled в HTML)
}

