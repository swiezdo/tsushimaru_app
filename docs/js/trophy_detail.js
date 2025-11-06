// trophy_detail.js
// Модуль для работы с детальной страницей трофея

import { fetchTrophiesList, submitTrophyApplication } from './api.js';
import { fetchTrophies } from './api.js';
import { showScreen, setTopbar } from './ui.js';
import { tg, hapticTapSmart, hapticOK, hapticERR } from './telegram.js';
import { shake, focusAndScrollIntoView } from './builds.js';
import { createFileKey, isImageFile } from './utils.js';

// Константы для формы заявки
const MAX_TROPHY_FILES = 9;
let trophyApplicationSelected = [];
let trophyApplicationObjectURLs = new Set();

// Открытие детального экрана трофея
export async function openTrophyDetail(trophyKey) {
    // Показываем экран сначала (чтобы топбар был виден)
    showScreen('trophyDetail');
    
    try {
        // Загружаем список трофеев и находим нужный
        const trophies = await fetchTrophiesList();
        const trophy = trophies.find(t => t.key === trophyKey);
        
        if (!trophy) {
            console.error(`Трофей ${trophyKey} не найден`);
            return;
        }
        
        // Загружаем трофеи пользователя для проверки получен ли трофей
        const userTrophies = await fetchTrophies();
        const isObtained = userTrophies.trophies.includes(trophyKey);
        
        // Рендерим детальный экран
        renderTrophyDetail(trophy, isObtained);
    } catch (error) {
        console.error('Ошибка загрузки данных трофея:', error);
    }
}

// Рендеринг детального экрана трофея
function renderTrophyDetail(trophy, isObtained) {
    const container = document.getElementById('trophyDetailContainer');
    if (!container) {
        console.error('Контейнер для детального экрана трофея не найден');
        return;
    }
    
    container.innerHTML = '';
    
    // Обновляем топбар с названием трофея
    setTopbar(true, trophy.name);
    
    // Карточка заголовка с названием и иконкой (если получен)
    const headerCard = document.createElement('section');
    headerCard.className = 'card trophy-header-card';
    
    const titleContainer = document.createElement('div');
    titleContainer.className = 'trophy-header-content';
    
    // Название трофея
    const title = document.createElement('h2');
    title.className = 'card-title trophy-detail-header';
    title.textContent = trophy.name;
    titleContainer.appendChild(title);
    
    // Иконка (если получен)
    if (isObtained) {
        const iconContainer = document.createElement('div');
        iconContainer.className = 'trophy-detail-icon-container';
        
        const icon = document.createElement('img');
        icon.className = 'trophy-icon-large';
        icon.src = `./assets/trophies/${trophy.key}.svg`;
        icon.alt = trophy.name;
        icon.loading = 'lazy';
        
        iconContainer.appendChild(icon);
        titleContainer.appendChild(iconContainer);
    }
    
    headerCard.appendChild(titleContainer);
    container.appendChild(headerCard);
    
    // Карточка с описанием трофея
    const descriptionCard = document.createElement('section');
    descriptionCard.className = 'card';
    
    const descriptionTitle = document.createElement('h3');
    descriptionTitle.className = 'card-title';
    descriptionTitle.textContent = trophy.name;
    descriptionCard.appendChild(descriptionTitle);
    
    const description = document.createElement('div');
    description.className = 'trophy-description';
    description.style.whiteSpace = 'pre-line';
    description.textContent = trophy.description;
    descriptionCard.appendChild(description);
    
    // Разделитель
    const divider = document.createElement('div');
    divider.style.marginTop = 'var(--space-3)';
    divider.style.paddingTop = 'var(--space-3)';
    divider.style.borderTop = '1px solid var(--color-border)';
    descriptionCard.appendChild(divider);
    
    // Доказательство (серым текстом поменьше)
    const proof = document.createElement('div');
    proof.className = 'trophy-proof';
    proof.style.fontSize = 'var(--fs-14)';
    proof.style.color = 'var(--tg-hint)';
    proof.style.marginTop = 'var(--space-2)';
    proof.textContent = `Доказательство: ${trophy.proof}`;
    descriptionCard.appendChild(proof);
    
    container.appendChild(descriptionCard);
    
    // Карточка заявки (только если трофей не получен)
    if (!isObtained) {
        renderTrophyApplicationCard(container, trophy);
    } else {
        // Если трофей получен, показываем сообщение
        const obtainedCard = document.createElement('section');
        obtainedCard.className = 'card';
        
        const obtainedMessage = document.createElement('div');
        obtainedMessage.className = 'trophy-obtained-message';
        obtainedMessage.textContent = '🎉 Вы уже получили этот трофей!';
        obtainedCard.appendChild(obtainedMessage);
        
        container.appendChild(obtainedCard);
    }
}

// Рендеринг карточки заявки на получение трофея
function renderTrophyApplicationCard(container, trophy) {
    // Очищаем предыдущие данные
    trophyApplicationSelected = [];
    trophyApplicationObjectURLs.forEach(url => URL.revokeObjectURL(url));
    trophyApplicationObjectURLs.clear();
    
    // Создаём карточку
    const applicationCard = document.createElement('section');
    applicationCard.className = 'card';
    applicationCard.id = 'trophyApplicationCard';
    
    // Заголовок
    const title = document.createElement('h2');
    title.className = 'card-title';
    title.textContent = 'Отправить заявку';
    applicationCard.appendChild(title);
    
    // Форма
    const form = document.createElement('form');
    form.className = 'form';
    form.id = 'trophyApplicationForm';
    
    // Поле комментария (необязательно)
    const commentContainer = document.createElement('div');
    commentContainer.className = 'input';
    
    const commentLabel = document.createElement('label');
    commentLabel.setAttribute('for', 'trophyApplicationComment');
    commentLabel.textContent = 'Комментарии (необязательно)';
    commentContainer.appendChild(commentLabel);
    
    const commentTextarea = document.createElement('textarea');
    commentTextarea.id = 'trophyApplicationComment';
    commentTextarea.rows = 1;
    commentTextarea.placeholder = 'Дополнительная информация';
    
    // Автоматическое изменение размера textarea
    const autoResize = () => {
        commentTextarea.style.height = 'auto';
        commentTextarea.style.height = Math.min(commentTextarea.scrollHeight, 200) + 'px';
    };
    commentTextarea.addEventListener('input', autoResize);
    commentTextarea.addEventListener('focus', () => { hapticTapSmart(); }, {passive: true});
    
    commentContainer.appendChild(commentTextarea);
    form.appendChild(commentContainer);
    
    // Поле для файлов (обязательное)
    const filesContainer = document.createElement('div');
    filesContainer.className = 'input';
    
    const filesLabel = document.createElement('label');
    filesLabel.setAttribute('for', 'trophyApplicationFiles');
    filesLabel.textContent = 'Прикрепите файлы';
    filesContainer.appendChild(filesLabel);
    
    const filesInput = document.createElement('input');
    filesInput.id = 'trophyApplicationFiles';
    filesInput.type = 'file';
    filesInput.multiple = true;
    filesInput.accept = 'image/*';
    filesInput.style.display = 'none';
    
    const addFilesBtn = document.createElement('button');
    addFilesBtn.type = 'button';
    addFilesBtn.className = 'fileline-btn';
    addFilesBtn.setAttribute('aria-label', 'Прикрепить файлы');
    addFilesBtn.textContent = '＋ Прикрепить';
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'thumbs-row';
    previewContainer.id = 'trophyApplicationPreview';
    
    filesContainer.appendChild(filesInput);
    filesContainer.appendChild(addFilesBtn);
    filesContainer.appendChild(previewContainer);
    form.appendChild(filesContainer);
    
    applicationCard.appendChild(form);
    
    // Кнопка отправки
    const actionsBar = document.createElement('div');
    actionsBar.className = 'actions-bar';
    
    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'btn primary wide';
    submitBtn.id = 'trophyApplicationSubmitBtn';
    submitBtn.textContent = 'Отправить';
    
    actionsBar.appendChild(submitBtn);
    applicationCard.appendChild(actionsBar);
    
    container.appendChild(applicationCard);
    
    // Обработчики событий
    addFilesBtn.addEventListener('click', () => {
        hapticTapSmart();
        try { filesInput.value = ''; } catch {}
        filesInput.click();
    });
    
    filesInput.addEventListener('change', () => {
        const files = Array.from(filesInput.files || []);
        if (!files.length) {
            shake(previewContainer || addFilesBtn);
            focusAndScrollIntoView(addFilesBtn || previewContainer);
            return;
        }
        
        // Фильтруем только изображения
        const imageFiles = files.filter(file => isImageFile(file));
        
        if (imageFiles.length !== files.length) {
            tg?.showPopup?.({
                title: 'Неподдерживаемый формат',
                message: 'Разрешены только изображения.',
                buttons: [{ type: 'ok' }]
            });
        }
        
        const keyOf = (f) => createFileKey(f);
        const existing = new Set(trophyApplicationSelected.map(keyOf));
        const freeSlots = Math.max(0, MAX_TROPHY_FILES - trophyApplicationSelected.length);
        const incoming = imageFiles.filter(f => !existing.has(keyOf));
        
        if (incoming.length > freeSlots) {
            incoming.length = freeSlots;
            tg?.showPopup?.({
                title: 'Лимит файлов',
                message: `Можно прикрепить не более ${MAX_TROPHY_FILES} изображений.`,
                buttons: [{ type: 'ok' }]
            });
        }
        
        incoming.forEach(f => trophyApplicationSelected.push(f));
        renderTrophyApplicationPreview();
    });
    
    submitBtn.addEventListener('pointerdown', () => { hapticTapSmart(); });
    submitBtn.addEventListener('click', (e) => {
        e.preventDefault?.();
        submitTrophyApplicationForm(trophy, commentTextarea, submitBtn);
    });
}

// Рендеринг превью выбранных файлов для заявки на трофей
function renderTrophyApplicationPreview() {
    const container = document.getElementById('trophyApplicationPreview');
    if (!container) return;
    
    container.innerHTML = '';
    
    trophyApplicationSelected.forEach((file, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        thumb.setAttribute('data-index', index.toString());
        
        const img = document.createElement('img');
        const url = URL.createObjectURL(file);
        trophyApplicationObjectURLs.add(url);
        img.src = url;
        img.alt = `Превью ${index + 1}`;
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'thumb-remove';
        removeBtn.setAttribute('aria-label', 'Удалить');
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
            hapticTapSmart();
            const idx = trophyApplicationSelected.indexOf(file);
            if (idx !== -1) {
                trophyApplicationSelected.splice(idx, 1);
                URL.revokeObjectURL(url);
                trophyApplicationObjectURLs.delete(url);
                renderTrophyApplicationPreview();
            }
        });
        
        thumb.appendChild(img);
        thumb.appendChild(removeBtn);
        container.appendChild(thumb);
    });
    
    // Показываем кнопку добавления если есть свободные слоты
    if (trophyApplicationSelected.length < MAX_TROPHY_FILES) {
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'fileline-btn';
        addBtn.setAttribute('aria-label', 'Прикрепить ещё');
        addBtn.textContent = '＋';
        addBtn.addEventListener('click', () => {
            hapticTapSmart();
            const input = document.getElementById('trophyApplicationFiles');
            if (input) {
                try { input.value = ''; } catch {}
                input.click();
            }
        });
        container.appendChild(addBtn);
    }
}

// Отправка заявки на получение трофея
async function submitTrophyApplicationForm(trophy, commentTextarea, submitBtn) {
    if (trophyApplicationSelected.length === 0) {
        shake(submitBtn);
        focusAndScrollIntoView(submitBtn);
        tg?.showPopup?.({
            title: 'Ошибка',
            message: 'Необходимо прикрепить хотя бы одно изображение.',
            buttons: [{ type: 'ok' }]
        });
        hapticERR();
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
    
    try {
        const comment = commentTextarea.value.trim();
        await submitTrophyApplication(trophy.key, comment, trophyApplicationSelected);
        
        hapticOK();
        tg?.showPopup?.({
            title: 'Успешно',
            message: 'Заявка отправлена! Модераторы рассмотрят её в ближайшее время.',
            buttons: [{ type: 'ok' }]
        });
        
        // Возвращаемся на экран наград
        showScreen('reward');
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        hapticERR();
        
        const errorMessage = error.message || 'Не удалось отправить заявку. Попробуйте позже.';
        tg?.showPopup?.({
            title: 'Ошибка',
            message: errorMessage,
            buttons: [{ type: 'ok' }]
        });
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить';
    }
}

