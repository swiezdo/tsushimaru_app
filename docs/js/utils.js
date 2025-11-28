// utils.js
// Общие утилиты для всех модулей приложения

import { hapticTapSmart } from './telegram.js';

// ---------- Анимации и эффекты ----------
export function shake(el) {
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth; // Принудительный reflow
  el.classList.add('shake');
}

/**
 * Определяет длительность анимации WebP
 * @param {string} src - Путь к WebP файлу
 * @returns {Promise<number|null>} Длительность в миллисекундах или null
 */
export async function getWebPAnimationDuration(src) {
  try {
    // Пробуем использовать ImageDecoder API (современные браузеры)
    if ('ImageDecoder' in window) {
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const decoder = new ImageDecoder({ data: blob, type: 'image/webp' });
        
        // Ждем готовности декодера
        await decoder.tracks.ready;
        
        const track = decoder.tracks.selectedTrack;
        if (track && track.frameCount > 1) {
          let totalDuration = 0;
          
          // Проходим по всем кадрам и суммируем их длительности
          for (let i = 0; i < track.frameCount; i++) {
            const result = await decoder.decode({ frameIndex: i });
            // duration может быть в миллисекундах или микросекундах, проверяем
            const frameDuration = result.image.duration || 0;
            // Если duration очень большое (> 10000), значит это микросекунды
            totalDuration += frameDuration > 10000 ? frameDuration / 1000 : frameDuration;
          }
          
          if (totalDuration > 0) {
            return Math.round(totalDuration);
          }
        }
      } catch (e) {
        console.warn('ImageDecoder API не сработал, используем парсинг:', e);
      }
    }
    
    // Альтернативный метод: парсинг WebP формата
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    const view = new DataView(arrayBuffer);
    
    // Проверяем RIFF header
    if (view.getUint32(0, true) !== 0x46464952) { // "RIFF"
      return null;
    }
    
    // Проверяем WEBP signature
    if (String.fromCharCode(
      view.getUint8(8),
      view.getUint8(9),
      view.getUint8(10),
      view.getUint8(11)
    ) !== 'WEBP') {
      return null;
    }
    
    let offset = 12;
    let totalDuration = 0;
    let hasAnim = false;
    let frameCount = 0;
    
    // Парсим chunks
    while (offset < arrayBuffer.byteLength - 8) {
      if (offset + 8 > arrayBuffer.byteLength) break;
      
      const chunkType = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );
      
      const chunkSize = view.getUint32(offset + 4, true);
      
      if (chunkType === 'VP8X') {
        // VP8X chunk содержит флаги (offset + 12)
        if (offset + 12 < arrayBuffer.byteLength) {
          const flags = view.getUint8(offset + 12);
          hasAnim = (flags & 0x02) !== 0; // Animation flag (bit 1)
          if (!hasAnim) return null;
        }
      }
      
      if (chunkType === 'ANMF') {
        // ANMF chunk - кадр анимации
        // Структура: 4 байта типа, 4 байта размера, затем:
        // - 4 байта X координаты
        // - 4 байта Y координаты  
        // - 2 байта ширины
        // - 2 байта высоты
        // - 2 байта задержки (в миллисекундах, little-endian)
        // - 1 байт флагов
        // - данные кадра
        
        if (offset + 24 < arrayBuffer.byteLength) {
          // Задержка находится в байтах 20-21 (после координат и размеров)
          const delayMs = view.getUint16(offset + 20, true); // little-endian, в миллисекундах
          totalDuration += delayMs;
          frameCount++;
        }
      }
      
      // Переходим к следующему chunk
      offset += 8; // заголовок chunk
      if (chunkSize % 2 === 1) {
        offset += chunkSize + 1; // размер + выравнивание
      } else {
        offset += chunkSize;
      }
      
      if (offset >= arrayBuffer.byteLength) break;
    }
    
    if (hasAnim && totalDuration > 0 && frameCount > 0) {
      return totalDuration;
    }
    
    return null;
  } catch (e) {
    console.warn('Не удалось определить длительность анимации:', e);
    return null;
  }
}

/**
 * Инициализирует статичное изображение из первого кадра анимированного WebP
 * @param {HTMLImageElement} img - Элемент изображения с data-static="true"
 */
export async function initStaticImage(img) {
  if (!img || img.dataset.static !== 'true') return;
  
  // Сохраняем оригинальный путь к анимированному изображению
  const baseSrc = img.src.split('?')[0];
  img.dataset.animatedSrc = baseSrc;
  
  // Автоматически определяем длительность, если не указана
  if (!img.dataset.animationDuration) {
    const duration = await getWebPAnimationDuration(baseSrc);
    if (duration && duration > 0) {
      img.dataset.animationDuration = Math.round(duration).toString();
      console.log(`✅ Автоматически определена длительность для ${baseSrc.split('/').pop()}: ${Math.round(duration)}ms`);
    } else {
      // Если не удалось определить, используем значение по умолчанию
      img.dataset.animationDuration = '2000';
      console.warn(`⚠️ Не удалось определить длительность для ${baseSrc.split('/').pop()}, используется значение по умолчанию: 2000ms. Укажите data-animation-duration вручную.`);
    }
  } else {
    console.log(`ℹ️ Используется указанная длительность для ${baseSrc.split('/').pop()}: ${img.dataset.animationDuration}ms`);
  }
  
  // Временно скрываем изображение, чтобы анимация не воспроизводилась визуально
  const originalDisplay = img.style.display;
  img.style.display = 'none';
  
  // Создаем скрытое изображение для извлечения первого кадра
  const hiddenImg = new Image();
  hiddenImg.onload = function() {
    try {
      // Создаем canvas для извлечения первого кадра
      const canvas = document.createElement('canvas');
      canvas.width = hiddenImg.width;
      canvas.height = hiddenImg.height;
      const ctx = canvas.getContext('2d');
      // Рисуем первый кадр анимации
      ctx.drawImage(hiddenImg, 0, 0);
      // Конвертируем первый кадр в data URL (используем PNG для гарантии статичности)
      const staticSrc = canvas.toDataURL('image/png');
      // Сохраняем статичное изображение и используем его
      img.dataset.staticSrc = staticSrc;
      img.src = staticSrc;
      img.style.display = originalDisplay;
    } catch (e) {
      // Если не удалось создать статичное изображение (CORS или другая ошибка)
      console.warn('Не удалось создать статичное изображение:', e);
      img.style.display = originalDisplay;
    }
  };
  hiddenImg.onerror = function() {
    console.warn('Не удалось загрузить изображение для создания статичного');
    img.style.display = originalDisplay;
  };
  hiddenImg.src = baseSrc;
}

// ========== ASSET VERSIONING SYSTEM ==========
// Версии для статических ресурсов (увеличивать при обновлении ресурсов)
const ASSETS_VERSION = '3';

/**
 * Добавляет версию к пути статического ресурса для cache busting
 * @param {string} path - Относительный путь к ресурсу (например, './assets/icons/system/icon.svg')
 * @returns {string} Путь с версией (например, './assets/icons/system/icon.svg?v=1')
 */
export function getStaticAssetPath(path) {
  if (!path) return '';
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}v=${ASSETS_VERSION}`;
}

/**
 * Добавляет timestamp к пути динамического ресурса для cache busting
 * @param {string} path - Относительный путь к ресурсу
 * @returns {string} Путь с timestamp
 */
export function getDynamicAssetPath(path) {
  if (!path) return '';
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}t=${Date.now()}`;
}

// ========== SPECIALIZED ASSET PATH FUNCTIONS ==========

const CLASS_ICON_MAP = {
  'Самурай': './assets/icons/classes/samurai.svg',
  'Охотник': './assets/icons/classes/hunter.svg',
  'Убийца': './assets/icons/classes/assassin.svg',
  'Ронин': './assets/icons/classes/ronin.svg',
};

/**
 * Получает путь к иконке класса с версией
 * @param {string} className - Название класса
 * @returns {string} Путь к иконке с версией
 */
export function getClassIconPath(className) {
  if (!className) return '';
  const path = CLASS_ICON_MAP[className] || CLASS_ICON_MAP['Самурай'];
  return getStaticAssetPath(path);
}

/**
 * Получает путь к иконке трофея с версией
 * @param {string} trophyKey - Ключ трофея (например, 'raid')
 * @returns {string} Путь к иконке с версией
 */
export function getTrophyIconPath(trophyKey) {
  if (!trophyKey) return '';
  return getStaticAssetPath(`./assets/trophies/${trophyKey}.svg`);
}

/**
 * Получает путь к системной иконке с версией
 * @param {string} iconName - Имя иконки (например, 'magatama.svg', 'reward.webp')
 * @returns {string} Путь к иконке с версией
 */
export function getSystemIconPath(iconName) {
  if (!iconName) return '';
  return getStaticAssetPath(`./assets/icons/system/${iconName}`);
}

/**
 * Получает путь к иконке мода с версией
 * @param {string} modSlug - Slug мода
 * @param {string} category - Категория ('mods', 'mod1', 'mod2', 'story_mods')
 * @returns {string} Путь к иконке с версией
 */
export function getModIconPath(modSlug, category = 'mods') {
  if (!modSlug) return '';
  // Если уже есть расширение, не добавляем его
  const filename = modSlug.endsWith('.svg') ? modSlug : `${modSlug}.svg`;
  return getStaticAssetPath(`./assets/icons/${category}/${filename}`);
}

/**
 * Получает путь к карте с версией
 * @param {string} mapSlug - Slug карты
 * @param {string} category - Категория ('survival', 'story', 'rivals', 'trials')
 * @returns {string} Путь к карте с версией
 */
export function getMapPath(mapSlug, category = 'survival') {
  if (!mapSlug) return '';
  // Если уже есть расширение, не добавляем его
  const filename = mapSlug.endsWith('.jpg') ? mapSlug : `${mapSlug}.jpg`;
  return getStaticAssetPath(`./assets/maps/${category}/${filename}`);
}

/**
 * Получает путь к иконке эмоции с версией
 * @param {string} emoteSlug - Slug эмоции
 * @returns {string} Путь к иконке с версией
 */
export function getEmoteIconPath(emoteSlug) {
  if (!emoteSlug) return '';
  return getStaticAssetPath(`./assets/icons/emotes/${emoteSlug}.svg`);
}

/**
 * Получает путь к иконке оружия с версией
 * @param {string} gearSlug - Slug оружия
 * @returns {string} Путь к иконке с версией
 */
export function getGearIconPath(gearSlug) {
  if (!gearSlug) return '';
  return getStaticAssetPath(`./assets/icons/ghost-weapons/${gearSlug}.svg`);
}

/**
 * Запускает анимацию изображения на один цикл
 * @param {HTMLImageElement} img - Элемент изображения с data-static="true"
 */
export function playAnimationOnce(img) {
  if (!img || img.dataset.static !== 'true') {
    // Если уже анимируется, останавливаем предыдущую и запускаем новую
    if (img && img.dataset.animationTimer) {
      clearTimeout(parseInt(img.dataset.animationTimer));
    }
  }
  
  // Получаем длительность анимации из атрибута или используем значение по умолчанию
  const animationDuration = parseInt(img.dataset.animationDuration) || 2000;
  
  // Переключаемся на анимированную версию
  const animatedSrc = img.dataset.animatedSrc || img.src.split('?')[0];
  img.src = animatedSrc + '?t=' + Date.now();
  img.dataset.static = 'false';
  
  // Останавливаем предыдущий таймер, если он был
  if (img.dataset.animationTimer) {
    clearTimeout(parseInt(img.dataset.animationTimer));
  }
  
  // Устанавливаем таймер для остановки анимации после одного цикла
  const timerId = setTimeout(() => {
    // Возвращаем статичное изображение (первый кадр)
    if (img.dataset.staticSrc) {
      img.src = img.dataset.staticSrc;
    } else {
      // Если статичное изображение не было создано, перезагружаем оригинал
      const baseSrc = img.dataset.animatedSrc || img.src.split('?')[0];
      img.src = baseSrc;
    }
    img.dataset.static = 'true';
    img.dataset.animationTimer = '';
  }, animationDuration);
  
  img.dataset.animationTimer = timerId.toString();
}

// ---------- Работа с чипами ----------
export function renderChips(container, values, { single = false, onChange } = {}) {
  if (!container) return;
  container.innerHTML = '';
  
  values.forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip-btn';
    b.textContent = v;
    b.dataset.value = v;
    b.addEventListener('click', () => {
      hapticTapSmart();
      if (single) {
        container.querySelectorAll('.chip-btn').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
      } else {
        b.classList.toggle('active');
      }
      onChange?.();
    });
    container.appendChild(b);
  });
}

export function activeValues(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll('.chip-btn.active')).map((b) => b.dataset.value);
}

export function setActive(container, arr) {
  if (!container) return;
  const set = new Set(arr || []);
  container.querySelectorAll('.chip-btn').forEach((b) => {
    b.classList.toggle('active', set.has(b.dataset.value));
  });
}

// ---------- Форматирование ----------
export function prettyLines(arr) { 
  return (arr && arr.length) ? arr.join('\n') : '—'; 
}

// ---------- DOM утилиты ----------
export function createElement(tag, className, textContent) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  return el;
}

export function createButton(type, className, textContent, dataset = {}) {
  const btn = createElement('button', className, textContent);
  btn.type = type || 'button';
  Object.assign(btn.dataset, dataset);
  return btn;
}

export function appendChildren(parent, ...children) {
  if (!parent) return parent;
  children.forEach((child) => {
    if (!child) return;
    parent.appendChild(child);
  });
  return parent;
}

export function clearChildren(node) {
  if (!node) return;
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export function removeElements(root, selector) {
  if (!root || !selector) return;
  root.querySelectorAll(selector).forEach((el) => el.remove());
}

export function createImage(src, className, alt = '', attributes = {}) {
  const img = document.createElement('img');
  if (className) img.className = className;
  if (typeof alt === 'string') img.alt = alt;
  if (src) img.src = src;
  Object.assign(img, attributes);
  return img;
}

export function insertHintAfter(anchor, text, extraClass = '') {
  if (!anchor || !anchor.parentNode) return null;
  const className = ['hint', extraClass].filter(Boolean).join(' ');
  const hint = createElement('div', className, text);
  anchor.insertAdjacentElement('afterend', hint);
  return hint;
}

export function renderFilesPreview(files, previewEl, { limit = 4, onRemove } = {}) {
  if (!previewEl) return () => {};

  const objectURLs = [];
  previewEl.innerHTML = '';

  const shown = files.slice(0, limit);
  shown.forEach((file, idx) => {
    const tile = createElement('div', 'preview-item removable');

    if (isImageFile(file)) {
      const objectURL = URL.createObjectURL(file);
      objectURLs.push(objectURL);
      const img = createImage(objectURL, '', file.name || '');
      tile.appendChild(img);
    } else if (isVideoFile(file)) {
      const objectURL = URL.createObjectURL(file);
      objectURLs.push(objectURL);

      const videoWrapper = createElement('div', 'preview-video-wrapper');
      const video = document.createElement('video');
      video.src = objectURL;
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      videoWrapper.appendChild(video);

      const badge = createElement('div', 'preview-badge', '🎬');
      videoWrapper.appendChild(badge);

      video.addEventListener(
        'loadeddata',
        () => {
          try {
            video.currentTime = Math.min(video.duration || 0, 0.1);
            video.pause();
          } catch {}
        },
        { once: true },
      );

      tile.classList.add('is-video');
      tile.appendChild(videoWrapper);
    } else {
      tile.textContent = '📄';
    }

    tile.addEventListener('click', () => {
      hapticTapSmart();
      onRemove?.(idx);
    });

    previewEl.appendChild(tile);
  });

  if (files.length > limit) {
    const more = createElement('div', 'preview-more', `+${files.length - limit}`);
    previewEl.appendChild(more);
  }

  return () => {
    objectURLs.forEach((url) => URL.revokeObjectURL(url));
  };
}

// ---------- Работа с файлами ----------
// Лимиты размера файлов
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 МБ
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 МБ

export function createFileKey(file) {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

export function isImageFile(file) {
  return file.type.startsWith('image/');
}

export function isVideoFile(file) {
  return file.type.startsWith('video/');
}

/**
 * Проверяет размер файла и возвращает результат валидации
 * @param {File} file - Файл для проверки
 * @returns {{ valid: boolean, error: string | null }} Результат валидации
 */
export function validateFileSize(file) {
  if (!file) {
    return { valid: false, error: 'Файл не указан' };
  }

  const isImage = isImageFile(file);
  const isVideo = isVideoFile(file);

  if (!isImage && !isVideo) {
    return { valid: false, error: 'Неподдерживаемый тип файла' };
  }

  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  const maxSizeMB = isImage ? 10 : 50;
  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
  const fileType = isImage ? 'изображений' : 'видео';

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Файл '${file.name}' (${fileSizeMB} МБ) превышает максимальный размер ${maxSizeMB} МБ для ${fileType}.`
    };
  }

  return { valid: true, error: null };
}

export function startButtonDotsAnimation(button, baseText = 'Отправка', interval = 400) {
  if (!button) return null;

  const suffixes = ['', ' .', ' ..', ' ...'];
  let index = 0;

  button.textContent = `${baseText}${suffixes[index]}`;

  const timer = setInterval(() => {
    index = (index + 1) % suffixes.length;
    button.textContent = `${baseText}${suffixes[index]}`;
  }, Math.max(200, interval));

  return {
    stop(finalText) {
      clearInterval(timer);
      if (button) {
        button.textContent = finalText ?? baseText;
      }
    },
  };
}

// ---------- Валидация ----------
export function validatePSNId(value) {
  if (!value) return false;
  return /^[A-Za-z0-9_-]{3,16}$/.test(value.trim());
}

export function validateBuildName(name) {
  if (!name || !name.trim()) return false;
  
  // Проверка на длинные слова (больше 15 символов)
  const words = name.trim().split(/\s+/);
  return words.every(word => word.length <= 15);
}

// ---------- Работа с датами ----------
export function formatDate(dateString) {
  try {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU');
  } catch {
    return '—';
  }
}

export function formatDateTime(dateString) {
  try {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU');
  } catch {
    return '—';
  }
}

/**
 * Парсит дату из формата "дд-мм-гггг чч:мм" или "дд.мм.гггг чч:мм"
 * @param {string} dateString - Дата в формате "дд-мм-гггг чч:мм" или "дд.мм.гггг чч:мм"
 * @returns {Date|null} Объект Date или null при ошибке
 */
export function parseDateTime(dateString) {
  if (!dateString) return null;
  try {
    // Поддерживаем оба формата: с дефисами и с точками
    // Формат: "дд-мм-гггг чч:мм" или "дд.мм.гггг чч:мм"
    const match = dateString.match(/^(\d{2})[.-](\d{2})[.-](\d{4})\s+(\d{2}):(\d{2})$/);
    if (!match) return null;
    
    const [, day, month, year, hour, minute] = match.map(Number);
    const date = new Date(year, month - 1, day, hour, minute, 0, 0);
    
    // Проверяем валидность даты
    if (isNaN(date.getTime())) return null;
    
    return date;
  } catch {
    return null;
  }
}

/**
 * Функция для склонения слов
 */
function plural(n, one, few, many) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

/**
 * Форматирует оставшееся время в полном формате
 * @param {number} ms - Миллисекунды до даты
 * @returns {string} Отформатированная строка (например, "5 дней, 3 часа и 15 минут")
 */
export function formatTimeRemaining(ms) {
  if (ms < 0) return 'Время истекло';
  
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  
  const parts = [];
  
  if (days > 0) {
    parts.push(`${days} ${plural(days, 'день', 'дня', 'дней')}`);
  }
  
  if (hours > 0) {
    parts.push(`${hours} ${plural(hours, 'час', 'часа', 'часов')}`);
  }
  
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} ${plural(minutes, 'минута', 'минуты', 'минут')}`);
  }
  
  // Форматируем с запятыми и "и"
  if (parts.length === 1) {
    return parts[0];
  } else if (parts.length === 2) {
    return `${parts[0]} и ${parts[1]}`;
  } else {
    return `${parts.slice(0, -1).join(', ')} и ${parts[parts.length - 1]}`;
  }
}

/**
 * Форматирует оставшееся время в сокращенном формате
 * @param {number} ms - Миллисекунды до даты
 * @returns {string} Отформатированная строка (например, "5д 3ч" или "3ч 15м")
 */
export function formatTimeRemainingShort(ms) {
  if (ms < 0) return 'Истекло';
  
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  
  const parts = [];
  
  if (days > 0) {
    parts.push(`${days}д`);
  }
  
  if (hours > 0) {
    parts.push(`${hours}ч`);
  }
  
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes}м`);
  }
  
  return parts.join(' ');
}

// ---------- LocalStorage утилиты ----------
export function safeLocalStorageGet(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
