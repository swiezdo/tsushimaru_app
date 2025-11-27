// hellmode_quest_detail.js
// Модуль для работы с детальной страницей задания HellMode

import { getHellmodeQuest, submitHellmodeQuestApplication } from './api.js';
import { showScreen, setTopbar, focusAndScrollIntoView } from './ui.js';
import { tg, hapticTapSmart, hapticOK, hapticERR } from './telegram.js';
import { getClassIconPath, getGearIconPath, getEmoteIconPath, getMapPath, getSystemIconPath } from './utils.js';
import { pushNavigation } from './navigation.js';
import {
    shake,
    createFileKey,
    isImageFile,
    isVideoFile,
    clearChildren,
    renderFilesPreview,
    startButtonDotsAnimation,
    validateFileSize,
} from './utils.js';

const MAX_HELLMODE_FILES = 18;

function isSupportedMediaFile(file) {
    return isImageFile(file) || isVideoFile(file);
}

const detailContainer = document.getElementById('hellmodeQuestDetailContainer');

const applicationState = {
    files: [],
    cleanupPreview: () => {},
    commentEl: null,
    previewEl: null,
    filesInput: null,
    submitBtn: null,
};

export async function openHellmodeQuestDetail() {
    showScreen('hellmodeQuestDetail');
    setTopbar(true, 'Задание HellMode');

    try {
        const quest = await getHellmodeQuest();
        if (!quest) {
            console.error('Задание HellMode не найдено');
            return;
        }
        renderHellmodeQuestDetail(quest);
    } catch (error) {
        console.error('Ошибка загрузки задания HellMode:', error);
    }
}

function renderHellmodeQuestDetail(quest) {
    if (!detailContainer) return;

    // Очищаем контейнер
    resetApplicationState();
    clearChildren(detailContainer);

    // Карточка 1: Hero/Meta карточка
    detailContainer.appendChild(buildHeroCard(quest));

    // Карточка 2: Описание
    detailContainer.appendChild(buildDescriptionCard(quest));

    // Карточка 3: Задание
    detailContainer.appendChild(buildQuestCard(quest));

    // Карточка 4: Доказательство
    detailContainer.appendChild(buildProofCard(quest));

    // Карточка 5: Отправить заявку
    detailContainer.appendChild(buildApplicationCard(quest));
}

function buildHeroCard(quest) {
    const card = document.createElement('section');
    card.className = 'card waves-meta-card waves-meta-card--with-bg';

    // Устанавливаем фон карты
    const mapPath = getMapPath(quest.map_slug, 'survival');
    card.style.backgroundImage = `url('${mapPath}')`;
    card.style.backgroundSize = 'cover';
    card.style.backgroundPosition = 'center';
    card.style.backgroundRepeat = 'no-repeat';

    // Иконки справа сверху
    const modIcons = document.createElement('div');
    modIcons.className = 'waves-mod-icons';

    // 1. Class
    const classIcon = document.createElement('div');
    classIcon.className = 'waves-mod-icon waves-mod-icon--class';
    const classImg = document.createElement('img');
    classImg.src = getClassIconPath(quest.class_name);
    classImg.alt = quest.class_name || '';
    classIcon.appendChild(classImg);

    // 2. Gear
    const gearIcon = document.createElement('div');
    gearIcon.className = 'waves-mod-icon';
    const gearImg = document.createElement('img');
    gearImg.src = getGearIconPath(quest.gear_slug);
    gearImg.alt = quest.gear_slug || '';
    gearIcon.appendChild(gearImg);

    // 3. Emote
    const emoteIcon = document.createElement('div');
    emoteIcon.className = 'waves-mod-icon';
    const emoteImg = document.createElement('img');
    emoteImg.src = getEmoteIconPath(quest.emote_slug);
    emoteImg.alt = quest.emote_slug || '';
    emoteIcon.appendChild(emoteImg);

    modIcons.appendChild(classIcon);
    modIcons.appendChild(gearIcon);
    modIcons.appendChild(emoteIcon);

    // Награда внизу справа (прямоугольник с числом и иконкой)
    const rewardBadge = document.createElement('div');
    rewardBadge.className = 'quest-reward-badge';
    const rewardValue = document.createElement('span');
    rewardValue.className = 'quest-reward-value';
    rewardValue.textContent = quest.reward || 0;
    const magatamaImg = document.createElement('img');
    magatamaImg.src = getSystemIconPath('magatama.svg');
    magatamaImg.alt = 'Награда';
    magatamaImg.className = 'quest-reward-icon';
    rewardBadge.appendChild(rewardValue);
    rewardBadge.appendChild(magatamaImg);

    // Заголовок с названием карты и режима
    const header = document.createElement('div');
    header.className = 'waves-header';

    const title = document.createElement('div');
    title.className = 'waves-title';
    title.textContent = quest.map_name || '—';

    const subtitle = document.createElement('div');
    subtitle.className = 'waves-subtitle';
    subtitle.textContent = 'HellMode';

    header.appendChild(title);
    header.appendChild(subtitle);

    card.appendChild(modIcons);
    card.appendChild(header);
    card.appendChild(rewardBadge);

    return card;
}

function buildDescriptionCard(quest) {
    const card = document.createElement('section');
    card.className = 'card';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Описание';
    card.appendChild(title);

    const profileGrid = document.createElement('div');
    profileGrid.className = 'profile-grid';

    // Карта
    const mapField = document.createElement('div');
    mapField.className = 'field';
    const mapLabel = document.createElement('label');
    mapLabel.textContent = 'Карта';
    const mapValue = document.createElement('div');
    mapValue.className = 'value';
    mapValue.textContent = quest.map_name || '—';
    mapField.appendChild(mapLabel);
    mapField.appendChild(mapValue);
    profileGrid.appendChild(mapField);

    // Класс
    const classField = document.createElement('div');
    classField.className = 'field';
    const classLabel = document.createElement('label');
    classLabel.textContent = 'Класс';
    const classValue = document.createElement('div');
    classValue.className = 'value';
    const classContainer = document.createElement('div');
    classContainer.style.display = 'flex';
    classContainer.style.alignItems = 'center';
    classContainer.style.gap = '8px';
    const classIcon = document.createElement('img');
    classIcon.src = getClassIconPath(quest.class_name);
    classIcon.alt = quest.class_name || '';
    classIcon.style.width = '24px';
    classIcon.style.height = '24px';
    const className = document.createElement('span');
    className.textContent = quest.class_name || '—';
    classContainer.appendChild(classIcon);
    classContainer.appendChild(className);
    classValue.appendChild(classContainer);
    classField.appendChild(classLabel);
    classField.appendChild(classValue);
    profileGrid.appendChild(classField);

    // Орудие
    const gearField = document.createElement('div');
    gearField.className = 'field';
    const gearLabel = document.createElement('label');
    gearLabel.textContent = 'Орудие';
    const gearValue = document.createElement('div');
    gearValue.className = 'value';
    const gearContainer = document.createElement('div');
    gearContainer.style.display = 'flex';
    gearContainer.style.alignItems = 'center';
    gearContainer.style.gap = '8px';
    const gearIcon = document.createElement('img');
    gearIcon.src = getGearIconPath(quest.gear_slug);
    gearIcon.alt = quest.gear_name || '';
    gearIcon.style.width = '24px';
    gearIcon.style.height = '24px';
    const gearName = document.createElement('span');
    gearName.textContent = quest.gear_name || '—';
    gearContainer.appendChild(gearIcon);
    gearContainer.appendChild(gearName);
    gearValue.appendChild(gearContainer);
    gearField.appendChild(gearLabel);
    gearField.appendChild(gearValue);
    profileGrid.appendChild(gearField);

    // Эмоция
    const emoteField = document.createElement('div');
    emoteField.className = 'field';
    const emoteLabel = document.createElement('label');
    emoteLabel.textContent = 'Эмоция';
    const emoteValue = document.createElement('div');
    emoteValue.className = 'value';
    const emoteContainer = document.createElement('div');
    emoteContainer.style.display = 'flex';
    emoteContainer.style.alignItems = 'center';
    emoteContainer.style.gap = '8px';
    const emoteIcon = document.createElement('img');
    emoteIcon.src = getEmoteIconPath(quest.emote_slug);
    emoteIcon.alt = quest.emote_name || '';
    emoteIcon.style.width = '24px';
    emoteIcon.style.height = '24px';
    const emoteName = document.createElement('span');
    emoteName.textContent = quest.emote_name || '—';
    emoteContainer.appendChild(emoteIcon);
    emoteContainer.appendChild(emoteName);
    emoteValue.appendChild(emoteContainer);
    emoteField.appendChild(emoteLabel);
    emoteField.appendChild(emoteValue);
    profileGrid.appendChild(emoteField);

    // Награда
    const rewardField = document.createElement('div');
    rewardField.className = 'field';
    const rewardLabel = document.createElement('label');
    rewardLabel.textContent = 'Награда';
    const rewardValue = document.createElement('div');
    rewardValue.className = 'value';
    const rewardContainer = document.createElement('div');
    rewardContainer.style.display = 'flex';
    rewardContainer.style.alignItems = 'center';
    rewardContainer.style.gap = '8px';
    const rewardText = document.createElement('span');
    rewardText.textContent = quest.reward || 0;
    const magatamaIcon = document.createElement('img');
    magatamaIcon.src = getSystemIconPath('magatama.svg');
    magatamaIcon.alt = 'Награда';
    magatamaIcon.style.width = '24px';
    magatamaIcon.style.height = '24px';
    rewardContainer.appendChild(rewardText);
    rewardContainer.appendChild(magatamaIcon);
    rewardValue.appendChild(rewardContainer);
    rewardField.appendChild(rewardLabel);
    rewardField.appendChild(rewardValue);
    profileGrid.appendChild(rewardField);

    card.appendChild(profileGrid);

    return card;
}

function buildQuestCard(quest) {
    const card = document.createElement('section');
    card.className = 'card';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Задание';
    card.appendChild(title);

    const description = document.createElement('div');
    description.className = 'trophy-description';
    description.style.whiteSpace = 'pre-line';

    const questText = document.createTextNode('Пройти "идеальный" HellMode на карте ');
    const mapName = document.createElement('strong');
    mapName.textContent = quest.map_name || '—';
    const questText2 = document.createTextNode(', играя за класс ');
    const className = document.createElement('strong');
    className.textContent = quest.class_name || '—';
    const questText3 = document.createTextNode(', экипировав орудие Призрака — ');
    const gearName = document.createElement('strong');
    gearName.textContent = quest.gear_name || '—';
    const questText4 = document.createTextNode('.\nПеред началом игры обязательно наденьте эмоцию ');
    const emoteName = document.createElement('strong');
    emoteName.textContent = quest.emote_name || '—';
    const questText5 = document.createTextNode('.\nНаграда за прохождение - ');
    const rewardText = document.createElement('strong');
    rewardText.textContent = quest.reward || 0;
    const questText6 = document.createTextNode(' ');
    const magatamaIcon = document.createElement('img');
    magatamaIcon.src = getSystemIconPath('magatama.svg');
    magatamaIcon.alt = 'Награда';
    magatamaIcon.style.width = '20px';
    magatamaIcon.style.height = '20px';
    magatamaIcon.style.verticalAlign = 'middle';
    magatamaIcon.style.marginLeft = '4px';

    description.appendChild(questText);
    description.appendChild(mapName);
    description.appendChild(questText2);
    description.appendChild(className);
    description.appendChild(questText3);
    description.appendChild(gearName);
    description.appendChild(questText4);
    description.appendChild(emoteName);
    description.appendChild(questText5);
    description.appendChild(rewardText);
    description.appendChild(questText6);
    description.appendChild(magatamaIcon);

    card.appendChild(description);

    return card;
}

function buildProofCard(quest) {
    const card = document.createElement('section');
    card.className = 'card';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Доказательство';
    card.appendChild(title);

    const proof = document.createElement('div');
    proof.className = 'trophy-proof';
    proof.style.whiteSpace = 'pre-line';
    proof.style.color = 'var(--fg)';
    proof.style.fontSize = 'var(--fs-16)';
    proof.textContent = quest.proof || '';
    card.appendChild(proof);

    return card;
}

function buildApplicationCard(quest) {
    const card = document.createElement('section');
    card.className = 'card';
    card.id = 'hellmodeApplicationCard';

    card.innerHTML = `
        <h2 class="card-title">Отправить заявку</h2>
        <form class="form" id="hellmodeApplicationForm">
            <div class="input">
                <label for="hellmodeApplicationComment">Комментарии (необязательно)</label>
                <textarea id="hellmodeApplicationComment" rows="1" placeholder="Дополнительная информация"></textarea>
            </div>
            <div class="input">
                <label for="hellmodeApplicationFiles">Прикрепите файлы</label>
                <input id="hellmodeApplicationFiles" type="file" multiple accept="image/*,video/*" hidden />
                <button type="button" class="fileline-btn" id="hellmodeApplicationAddBtn" aria-label="Прикрепить файлы">＋ Прикрепить</button>
                <div id="hellmodeApplicationPreview" class="thumbs-row"></div>
            </div>
        </form>
        <div class="actions-bar">
            <button type="button" class="btn primary wide" id="hellmodeApplicationSubmitBtn">Отправить</button>
        </div>
    `;

    setupApplicationForm(card, quest);
    return card;
}

function setupApplicationForm(card, quest) {
    const commentEl = card.querySelector('#hellmodeApplicationComment');
    const filesInput = card.querySelector('#hellmodeApplicationFiles');
    const addBtn = card.querySelector('#hellmodeApplicationAddBtn');
    const previewEl = card.querySelector('#hellmodeApplicationPreview');
    const submitBtn = card.querySelector('#hellmodeApplicationSubmitBtn');

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
        submitHellmodeApplicationForm(quest);
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

    const freeSlots = Math.max(0, MAX_HELLMODE_FILES - applicationState.files.length);
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
            message: `Можно прикрепить не более ${MAX_HELLMODE_FILES} файлов.`,
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

async function submitHellmodeApplicationForm(quest) {
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

        await submitHellmodeQuestApplication(comment, applicationState.files);

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

        showScreen('home');
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        hapticERR();

        // Определяем текст и заголовок ошибки
        let title = 'Ошибка';
        let message = error.message || error?.detail || 'Не удалось отправить заявку. Попробуйте позже.';
        
        // Специальная обработка для ошибки "уже выполнили"
        if (error.status === 400 && message.includes('уже выполнили')) {
            title = 'Задание уже выполнено';
            message = 'Вы уже выполнили это задание на этой неделе.';
        }

        tg?.showPopup?.({
            title: title,
            message: message,
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
}

