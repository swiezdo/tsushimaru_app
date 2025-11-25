// season_trophy_detail.js
// Модуль для работы с детальной страницей сезонного трофея

import { submitTrophyApplication } from './api.js';
import { showScreen, setTopbar, focusAndScrollIntoView } from './ui.js';
import { tg, hapticTapSmart, hapticOK, hapticERR, $ } from './telegram.js';
import { getTrophyIconPath } from './utils.js';
import {
    shake,
    createFileKey,
    isImageFile,
    isVideoFile,
    clearChildren,
    renderFilesPreview,
    startButtonDotsAnimation,
    validateFileSize,
    parseDateTime,
    formatTimeRemaining,
} from './utils.js';
import { fetchTrophies } from './api.js';

const MAX_TROPHY_FILES = 18;

function isSupportedMediaFile(file) {
    return isImageFile(file) || isVideoFile(file);
}

const detailContainer = $('seasonTrophyDetailContainer');

const applicationState = {
    files: [],
    cleanupPreview: () => {},
    commentEl: null,
    previewEl: null,
    filesInput: null,
    submitBtn: null,
};

let countdownTimerId = null;

/**
 * Форматирует текст трофея с поддержкой разметки:
 * *текст* - серый цвет (класс muted)
 * #текст# - жирный шрифт
 * 
 * @param {string} text - Исходный текст
 * @returns {string} - Отформатированный HTML
 */
function formatTrophyText(text) {
    if (!text) return '';
    
    // Экранируем HTML символы для безопасности
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Сначала обрабатываем #текст# (жирный), чтобы избежать конфликтов
    formatted = formatted.replace(/#([^#]+)#/g, '<strong>$1</strong>');
    
    // Затем обрабатываем *текст* (серый)
    formatted = formatted.replace(/\*([^*]+)\*/g, '<span class="muted">$1</span>');
    
    return formatted;
}

/**
 * Загружает данные сезонного трофея из JSON файла
 */
async function loadSeasonTrophy(trophyKey) {
    try {
        const response = await fetch(`./assets/data/season_trophy.json?v=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`season_trophy.json status ${response.status}`);
        }
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            console.error('season_trophy.json: ожидается массив');
            return null;
        }

        // Ищем трофей по ключу
        const trophy = data.find(t => t.key === trophyKey);
        return trophy || null;
    } catch (error) {
        console.error('Ошибка загрузки season_trophy.json:', error);
        return null;
    }
}

export async function openSeasonTrophyDetail(trophyKey) {
    showScreen('seasonTrophy');
    setTopbar(true, 'Сезонный трофей');

    try {
        const [trophy, userData] = await Promise.all([
            loadSeasonTrophy(trophyKey),
            fetchTrophies()
        ]);

        if (!trophy) {
            console.error(`Сезонный трофей ${trophyKey} не найден`);
            return;
        }

        const userTrophies = userData?.trophies || [];
        const isObtained = userTrophies.includes(trophyKey);
        renderSeasonTrophyDetail(trophy, isObtained);
    } catch (error) {
        console.error('Ошибка загрузки данных сезонного трофея:', error);
    }
}

function renderSeasonTrophyDetail(trophy, isObtained) {
    if (!detailContainer) return;

    resetApplicationState();
    clearChildren(detailContainer);

    // Иконка 128x128 со свечением
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'trophy-detail-icon-wrapper';

    const icon = document.createElement('img');
    icon.className = 'trophy-detail-icon';
    icon.src = getTrophyIconPath(trophy.key);
    icon.alt = trophy.name;
    icon.loading = 'lazy';
    icon.decoding = 'async';
    iconWrapper.appendChild(icon);

    detailContainer.appendChild(iconWrapper);

    if (isObtained) {
        detailContainer.appendChild(buildObtainedNoticeCard());
    }

    // Карточка с названием и card_msg
    detailContainer.appendChild(buildInfoCard(trophy));

    // Карточка с условиями
    if (trophy.conditions) {
        detailContainer.appendChild(buildConditionsCard(trophy));
    }

    // Карточка с доказательствами
    if (trophy.proof) {
        detailContainer.appendChild(buildProofCard(trophy));
    }

    // Карточка с испытаниями
    detailContainer.appendChild(buildChallengesCard(trophy));

    // Карточка с оставшимся временем (если есть поле time и трофей не получен)
    if (trophy.time && !isObtained) {
        detailContainer.appendChild(buildTimeRemainingCard(trophy));
    }

    // Карточка для подачи заявки (если трофей не получен)
    if (!isObtained) {
        detailContainer.appendChild(buildApplicationCard(trophy));
    }
}

function buildObtainedNoticeCard() {
    const card = document.createElement('section');
    card.className = 'card max-level';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = '🎉 Вы получили этот трофей!';
    card.appendChild(title);

    return card;
}

function buildInfoCard(trophy) {
    const card = document.createElement('section');
    card.className = 'card next-level';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = trophy.name;
    card.appendChild(title);

    const description = document.createElement('div');
    description.className = 'trophy-description';
    description.style.whiteSpace = 'pre-line';
    description.innerHTML = formatTrophyText(trophy.card_msg || '');
    card.appendChild(description);

    return card;
}

function buildConditionsCard(trophy) {
    const card = document.createElement('section');
    card.className = 'card next-level';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Условия';
    card.appendChild(title);

    const description = document.createElement('div');
    description.className = 'trophy-description';
    description.style.whiteSpace = 'pre-line';
    description.innerHTML = formatTrophyText(trophy.conditions || '');
    card.appendChild(description);

    return card;
}

function buildProofCard(trophy) {
    const card = document.createElement('section');
    card.className = 'card next-level';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Доказательство';
    card.appendChild(title);

    const description = document.createElement('div');
    description.className = 'trophy-description';
    description.style.whiteSpace = 'pre-line';
    description.innerHTML = formatTrophyText(trophy.proof || '');
    card.appendChild(description);

    return card;
}

function buildChallengesCard(trophy) {
    const card = document.createElement('section');
    card.className = 'card next-level';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Испытания';
    card.appendChild(title);

    const description = document.createElement('div');
    description.className = 'trophy-description';
    description.style.whiteSpace = 'pre-line';
    description.innerHTML = formatTrophyText(trophy.description || '');
    card.appendChild(description);

    return card;
}

function buildTimeRemainingCard(trophy) {
    const card = document.createElement('section');
    card.className = 'card next-level';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Оставшееся время';
    card.appendChild(title);

    const timeEl = document.createElement('div');
    timeEl.className = 'trophy-description';
    timeEl.id = 'seasonTrophyTimeRemaining';
    timeEl.setAttribute('aria-live', 'polite');
    card.appendChild(timeEl);

    // Обновляем таймер
    const updateTimer = () => {
        const targetDate = parseDateTime(trophy.time);
        if (!targetDate) {
            timeEl.textContent = '—';
            return;
        }

        const ms = targetDate.getTime() - Date.now();
        timeEl.textContent = formatTimeRemaining(ms);
    };

    // Очищаем предыдущий таймер
    if (countdownTimerId) {
        clearInterval(countdownTimerId);
    }

    // Обновляем сразу и затем каждую секунду
    updateTimer();
    countdownTimerId = setInterval(updateTimer, 1000);

    return card;
}

function buildApplicationCard(trophy) {
    const card = document.createElement('section');
    card.className = 'card';
    card.id = 'seasonTrophyApplicationCard';

    card.innerHTML = `
        <h2 class="card-title">Отправить заявку</h2>
        <form class="form" id="seasonTrophyApplicationForm">
            <div class="input">
                <label for="seasonTrophyApplicationComment">Комментарии (необязательно)</label>
                <textarea id="seasonTrophyApplicationComment" rows="1" placeholder="Дополнительная информация"></textarea>
            </div>
            <div class="input">
                <label for="seasonTrophyApplicationFiles">Прикрепите файлы</label>
                <input id="seasonTrophyApplicationFiles" type="file" multiple accept="image/*,video/*" hidden />
                <button type="button" class="fileline-btn" id="seasonTrophyApplicationAddBtn" aria-label="Прикрепить файлы">＋ Прикрепить</button>
                <div id="seasonTrophyApplicationPreview" class="thumbs-row"></div>
            </div>
        </form>
        <div class="actions-bar">
            <button type="button" class="btn primary wide" id="seasonTrophyApplicationSubmitBtn">Отправить</button>
        </div>
    `;

    setupApplicationForm(card, trophy);
    return card;
}

function setupApplicationForm(card, trophy) {
    const commentEl = card.querySelector('#seasonTrophyApplicationComment');
    const filesInput = card.querySelector('#seasonTrophyApplicationFiles');
    const addBtn = card.querySelector('#seasonTrophyApplicationAddBtn');
    const previewEl = card.querySelector('#seasonTrophyApplicationPreview');
    const submitBtn = card.querySelector('#seasonTrophyApplicationSubmitBtn');

    applicationState.commentEl = commentEl;
    applicationState.filesInput = filesInput;
    applicationState.previewEl = previewEl;
    applicationState.submitBtn = submitBtn;

    if (commentEl) {
        const autoResize = () => {
            commentEl.style.height = 'auto';
            commentEl.style.height = Math.min(commentEl.scrollHeight, 200) + 'px';
        };
        commentEl.addEventListener('input', autoResize);
        commentEl.addEventListener('focus', () => { hapticTapSmart(); }, { passive: true });
        autoResize();
    }

    addBtn?.addEventListener('click', () => {
        hapticTapSmart();
        if (!filesInput) return;
        try { filesInput.value = ''; } catch {}
        filesInput.click();
    });

    filesInput?.addEventListener('change', () => {
        handleFilesSelected(Array.from(filesInput.files || []));
    });

    submitBtn?.addEventListener('pointerdown', () => { hapticTapSmart(); });
    submitBtn?.addEventListener('click', (e) => {
        e.preventDefault?.();
        submitSeasonTrophyApplicationForm(trophy);
    });
}

function handleFilesSelected(files) {
    if (!files.length) {
        shake(applicationState.previewEl || applicationState.submitBtn);
        focusAndScrollIntoView(applicationState.previewEl || applicationState.submitBtn);
        return;
    }

    const supported = files.filter((file) => isSupportedMediaFile(file));
    if (supported.length !== files.length) {
        tg?.showPopup?.({
            title: 'Неподдерживаемый формат',
            message: 'Можно прикреплять изображения и видео (например, MP4, MOV).',
            buttons: [{ type: 'ok' }],
        });
    }

    // Проверка размера файлов
    const sizeErrors = [];
    const validFiles = supported.filter((file) => {
        const validation = validateFileSize(file);
        if (!validation.valid) {
            sizeErrors.push(validation.error);
            return false;
        }
        return true;
    });

    if (sizeErrors.length > 0) {
        if (sizeErrors.length === 1) {
            tg?.showPopup?.({
                title: 'Файл слишком большой',
                message: sizeErrors[0],
                buttons: [{ type: 'ok' }],
            });
        } else {
            tg?.showPopup?.({
                title: 'Файлы слишком большие',
                message: 'Некоторые файлы превышают максимальный размер. Изображения: до 10 МБ, видео: до 50 МБ.',
                buttons: [{ type: 'ok' }],
            });
        }
    }

    if (validFiles.length === 0) {
        return;
    }

    const freeSlots = Math.max(0, MAX_TROPHY_FILES - applicationState.files.length);
    const knownKeys = new Set(applicationState.files.map((file) => createFileKey(file)));
    const uniqueNewFiles = [];
    let skippedByLimit = 0;

    validFiles.forEach((file) => {
        const key = createFileKey(file);
        if (knownKeys.has(key)) return;
        if (uniqueNewFiles.length >= freeSlots) {
            skippedByLimit += 1;
            return;
        }
        knownKeys.add(key);
        uniqueNewFiles.push(file);
    });

    if (skippedByLimit > 0) {
        tg?.showPopup?.({
            title: 'Лимит файлов',
            message: `Можно прикрепить не более ${MAX_TROPHY_FILES} файлов.`,
            buttons: [{ type: 'ok' }],
        });
    }

    if (!uniqueNewFiles.length) return;

    applicationState.files.push(...uniqueNewFiles);
    refreshPreview();
}

function refreshPreview() {
    applicationState.cleanupPreview();
    applicationState.cleanupPreview = renderFilesPreview(applicationState.files, applicationState.previewEl, {
        limit: 4,
        onRemove: (idx) => {
            applicationState.files.splice(idx, 1);
            hapticTapSmart();
            refreshPreview();
        },
    });
}

async function submitSeasonTrophyApplicationForm(trophy) {
    const submitBtn = applicationState.submitBtn;
    if (!submitBtn) return;

    if (applicationState.files.length === 0) {
        shake(submitBtn);
        focusAndScrollIntoView(submitBtn);
        tg?.showPopup?.({
            title: 'Ошибка',
            message: 'Необходимо прикрепить хотя бы один файл (изображение или видео).',
            buttons: [{ type: 'ok' }],
        });
        hapticERR();
        return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');

    let dotsAnimation = null;

    try {
        const comment = (applicationState.commentEl?.value || '').trim();

        dotsAnimation = startButtonDotsAnimation(submitBtn, 'Отправка');

        // Используем существующий endpoint для трофеев
        await submitTrophyApplication(trophy.key, comment, applicationState.files);

        applicationState.files = [];
        applicationState.cleanupPreview();
        applicationState.cleanupPreview = () => {};
        if (applicationState.filesInput) {
            applicationState.filesInput.value = '';
        }
        if (applicationState.commentEl) {
            applicationState.commentEl.value = '';
            applicationState.commentEl.style.height = 'auto';
        }
        if (applicationState.previewEl) {
            applicationState.previewEl.innerHTML = '';
        }

        hapticOK();
        tg?.showPopup?.({
            title: 'Успешно',
            message: 'Заявка отправлена! Модераторы рассмотрят её в ближайшее время.',
            buttons: [{ type: 'ok' }],
        });

        showScreen('reward');
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        hapticERR();

        tg?.showPopup?.({
            title: 'Ошибка',
            message: error.message || 'Не удалось отправить заявку. Попробуйте позже.',
            buttons: [{ type: 'ok' }],
        });
    } finally {
        dotsAnimation?.stop(originalText);
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
    }
}

function resetApplicationState() {
    applicationState.cleanupPreview();
    applicationState.cleanupPreview = () => {};
    applicationState.files = [];
    applicationState.commentEl = null;
    applicationState.previewEl = null;
    applicationState.filesInput = null;
    applicationState.submitBtn = null;
    
    // Очищаем таймер
    if (countdownTimerId) {
        clearInterval(countdownTimerId);
        countdownTimerId = null;
    }
}

