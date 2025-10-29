// whatsNew.js
import { $, hapticTapSmart } from './telegram.js';
import { showScreen } from './ui.js';

// Элементы
const whatsNewContainer = $('whatsNewContainer');
const sendFeedbackBtn = $('sendFeedbackBtn');

// Иконки для типов изменений
const CHANGE_ICONS = {
  new: '✨',
  improvement: '⚡',
  fix: '🐛'
};

// Загрузка данных из JSON файла
async function loadWhatsNewData() {
  try {
    const response = await fetch('./whats-new.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка загрузки данных "Что нового?":', error);
    return [];
  }
}

// Форматирование даты
function formatDate(dateString) {
  // Парсим формат ДД-ММ-ГГГГ
  const [day, month, year] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Создание карточки версии
function createVersionCard(versionData) {
  const card = document.createElement('section');
  card.className = 'card';
  
  // Заголовок версии
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = `v${versionData.version} — ${versionData.title}`;
  
  // Дата
  const date = document.createElement('div');
  date.className = 'version-date';
  date.textContent = formatDate(versionData.date);
  
  // Список изменений
  const changesList = document.createElement('ul');
  changesList.className = 'changelog-list';
  
  // Фильтруем только заполненные изменения
  const validChanges = versionData.changes.filter(change => 
    change.text && change.text.trim() !== ''
  );
  
  validChanges.forEach(change => {
    const listItem = document.createElement('li');
    listItem.className = 'changelog-item';
    
    const icon = document.createElement('span');
    icon.className = 'changelog-icon';
    icon.textContent = CHANGE_ICONS[change.type] || '•';
    
    const text = document.createElement('span');
    text.className = 'changelog-text';
    text.textContent = change.text;
    
    listItem.appendChild(icon);
    listItem.appendChild(text);
    changesList.appendChild(listItem);
  });
  
  // Собираем карточку
  card.appendChild(title);
  card.appendChild(date);
  card.appendChild(changesList);
  
  return card;
}

// Рендеринг всех карточек
export async function renderWhatsNewCards() {
  try {
    const data = await loadWhatsNewData();
    
    // Очищаем контейнер
    whatsNewContainer.innerHTML = '';
    
    if (data.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'hint muted';
      emptyMessage.textContent = 'Обновления пока не опубликованы.';
      whatsNewContainer.appendChild(emptyMessage);
      return;
    }
    
    // Обращаем порядок массива (последние записи в JSON показываются первыми)
    const sortedData = data.slice().reverse();
    
    // Создаем карточки для каждой версии
    sortedData.forEach(versionData => {
      const card = createVersionCard(versionData);
      whatsNewContainer.appendChild(card);
    });
    
  } catch (error) {
    console.error('Ошибка рендеринга "Что нового?":', error);
    
    const errorMessage = document.createElement('div');
    errorMessage.className = 'hint muted';
    errorMessage.textContent = 'Не удалось загрузить обновления.';
    whatsNewContainer.appendChild(errorMessage);
  }
}

// Инициализация экрана "Что нового?"
export function initWhatsNew() {
  // Обработчик кнопки уже настроен в main.js через bindHomeButtons()
  // Обработчик кнопки отправки отзыва
  sendFeedbackBtn?.addEventListener('click', () => {
    hapticTapSmart();
    showScreen('feedback');
  });
}
