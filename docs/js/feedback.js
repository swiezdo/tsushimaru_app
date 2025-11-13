// feedback.js
import { tg, $, hapticTapSmart, hapticOK, hapticERR, hideKeyboard } from './telegram.js';
import { showScreen, focusAndScrollIntoView } from './ui.js';
import { shake, createFileKey, isImageFile, isVideoFile, renderFilesPreview } from './utils.js';
import { submitFeedback } from './api.js';

// Элементы интерфейса
const feedbackFormEl = $('feedbackForm');
const feedbackFilesEl = $('feedbackFiles');
const feedbackSubmitBtn = $('feedbackSubmitBtn');
const feedbackTextEl = $('feedbackText');
const previewEl = $('feedbackPreview');
const feedbackAddBtn = $('feedbackAddBtn');
const MAX_FEEDBACK_FILES = 10;

let feedbackSelected = [];
let feedbackPreviewCleanup = () => {};

function resetFeedbackForm() {
  // Очищаем objectURL при сбросе формы
  feedbackPreviewCleanup();
  feedbackPreviewCleanup = () => {};
  
  if (previewEl) { previewEl.innerHTML = ''; previewEl.classList.remove('shake','error'); }
  if (feedbackFilesEl) feedbackFilesEl.value = '';
  feedbackSelected = [];
  if (feedbackTextEl) {
    feedbackTextEl.value = '';
    feedbackTextEl.style.height = 'auto';
    feedbackTextEl.classList.remove('shake','error');
  }
}

function renderFeedbackPreview() {
  if (!previewEl) return;
  
  // Очищаем старые objectURL
  feedbackPreviewCleanup();
  feedbackPreviewCleanup = () => {};
  
  // Используем универсальную функцию renderFilesPreview
  feedbackPreviewCleanup = renderFilesPreview(feedbackSelected, previewEl, {
    limit: 4,
    onRemove: (idx) => {
      feedbackSelected.splice(idx, 1);
      hapticTapSmart();
      renderFeedbackPreview();
    }
  });
}

let submitting = false;
async function submitFeedbackForm() {
  if (submitting) return;
  submitting = true;
  
  const submitBtn = feedbackSubmitBtn;
  const originalText = submitBtn?.textContent || 'Отправить';
  
  // Блокируем кнопку и меняем текст
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('success');
    submitBtn.textContent = 'Подождите...';
  }

  const description = (feedbackTextEl?.value || '').trim();
  const filesCount = feedbackSelected.length;

  if (!description) {
    shake(feedbackTextEl);
    focusAndScrollIntoView(feedbackTextEl);
    hapticERR();
    tg?.showPopup?.({ title: 'Ошибка', message: 'Опишите проблему или идею.', buttons: [{ type: 'ok' }] });
    
    // Восстанавливаем кнопку
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('success');
      submitBtn.textContent = originalText;
    }
    submitting = false;
    return;
  }

  try {
    hapticOK();
    
    await submitFeedback(description, feedbackSelected);
    
    tg?.showPopup?.({ 
      title: 'Отзыв отправлен', 
      message: '✅ Спасибо за ваш отзыв!', 
      buttons: [{ type: 'ok' }] 
    });
    
    resetFeedbackForm();
    showScreen('whatsNew');
    
  } catch (error) {
    console.error('Ошибка отправки отзыва:', error);
    hapticERR();
    tg?.showPopup?.({ 
      title: 'Ошибка', 
      message: error.message || 'Произошла ошибка при отправке отзыва.', 
      buttons: [{ type: 'ok' }] 
    });
  } finally {
    // Восстанавливаем кнопку
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('success');
      submitBtn.textContent = originalText;
    }
    submitting = false;
  }
}

export function initFeedback() {
  resetFeedbackForm();

  // Обработчики для формы отзыва
  feedbackAddBtn?.addEventListener('click', () => {
    hapticTapSmart();
    try { feedbackFilesEl.value = ''; } catch {}
    feedbackFilesEl?.click();
  });

  if (feedbackFilesEl) {
    feedbackFilesEl.addEventListener('change', () => {
      const files = Array.from(feedbackFilesEl.files || []);
      if (!files.length) { 
        shake(previewEl || feedbackAddBtn); 
        focusAndScrollIntoView(feedbackAddBtn || previewEl); 
        return; 
      }

      // Фильтруем изображения и видео
      const mediaFiles = files.filter(file => isImageFile(file) || isVideoFile(file));
      
      if (mediaFiles.length !== files.length) {
        tg?.showPopup?.({
          title: 'Неподдерживаемый формат',
          message: 'Разрешены только изображения и видео (MP4, MOV).',
          buttons: [{ type: 'ok' }]
        });
      }

      const keyOf = (f) => createFileKey(f);
      const existing = new Set(feedbackSelected.map(keyOf));
      const freeSlots = Math.max(0, MAX_FEEDBACK_FILES - feedbackSelected.length);
      const incoming = mediaFiles.filter(f => !existing.has(keyOf));

      if (incoming.length > freeSlots) {
        incoming.length = freeSlots;
        tg?.showPopup?.({
          title: 'Лимит файлов',
          message: `Можно прикрепить не более ${MAX_FEEDBACK_FILES} файлов.`,
          buttons: [{ type: 'ok' }]
        });
      }
      incoming.forEach(f => feedbackSelected.push(f));
      renderFeedbackPreview();
    });
  }

  if (feedbackTextEl) {
    const autoResize = () => {
      feedbackTextEl.style.height = 'auto';
      feedbackTextEl.style.height = Math.min(feedbackTextEl.scrollHeight, 200) + 'px';
    };
    feedbackTextEl.addEventListener('input', autoResize);
    feedbackTextEl.addEventListener('focus', ()=>{ hapticTapSmart(); }, {passive:true});
    setTimeout(autoResize, 0);
  }

  feedbackSubmitBtn?.addEventListener('pointerdown', () => { hapticTapSmart(); });
  feedbackSubmitBtn?.addEventListener('click', (e) => { e.preventDefault?.(); submitFeedbackForm(); });

  feedbackFormEl?.addEventListener('submit', (e) => { e.preventDefault(); submitFeedbackForm(); });
}

