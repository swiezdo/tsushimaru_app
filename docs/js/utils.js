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
    tile.title = 'Нажмите, чтобы удалить';

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
export function createFileKey(file) {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

export function isImageFile(file) {
  return file.type.startsWith('image/');
}

export function isVideoFile(file) {
  return file.type.startsWith('video/');
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
