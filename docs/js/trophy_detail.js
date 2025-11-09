// trophy_detail.js
// Модуль для работы с детальной страницей трофея

import { fetchTrophiesList, fetchTrophies, submitTrophyApplication } from './api.js';
import { showScreen, setTopbar, focusAndScrollIntoView } from './ui.js';
import { tg, hapticTapSmart, hapticOK, hapticERR, $ } from './telegram.js';
import {
    shake,
    createFileKey,
    isImageFile,
    isVideoFile,
    clearChildren,
    renderFilesPreview,
    createProgressController,
    updateUploadProgress,
} from './utils.js';

const MAX_TROPHY_FILES = 18;
const MAX_FILES_PER_BATCH = 9;

function isSupportedMediaFile(file) {
    return isImageFile(file) || isVideoFile(file);
}

const detailContainer = $('trophyDetailContainer');

let trophyListCache = null;

const applicationState = {
    files: [],
    cleanupPreview: () => {},
    commentEl: null,
    previewEl: null,
    progressEl: null,
    progressController: null,
    filesInput: null,
    submitBtn: null,
};

export async function openTrophyDetail(trophyKey) {
    showScreen('trophyDetail');
    setTopbar(true, 'Просмотр трофея');

    try {
        const [trophies, userData] = await Promise.all([loadTrophiesList(), fetchTrophies()]);
        const trophy = trophies.find((item) => item.key === trophyKey);

        if (!trophy) {
            console.error(`Трофей ${trophyKey} не найден`);
            return;
        }

        const userTrophies = userData?.trophies || [];
        const isObtained = userTrophies.includes(trophyKey);
        renderTrophyDetail(trophy, isObtained);
    } catch (error) {
        console.error('Ошибка загрузки данных трофея:', error);
    }
}

async function loadTrophiesList() {
    if (trophyListCache) return trophyListCache;

    try {
        trophyListCache = await fetchTrophiesList();
    } catch (error) {
        console.error('Ошибка загрузки списка трофеев:', error);
        trophyListCache = [];
    }

    return trophyListCache;
}

function renderTrophyDetail(trophy, isObtained) {
    if (!detailContainer) return;

    resetApplicationState();
    clearChildren(detailContainer);

    if (isObtained) {
        detailContainer.appendChild(buildObtainedNoticeCard());
        detailContainer.appendChild(buildInfoCard(trophy, { includeProof: false }));
    } else {
        detailContainer.appendChild(buildInfoCard(trophy, { includeProof: Boolean(trophy.proof) }));
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

function buildInfoCard(trophy, { includeProof }) {
    const card = document.createElement('section');
    card.className = 'card next-level';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = trophy.name;
    card.appendChild(title);

    const description = document.createElement('div');
    description.className = 'trophy-description';
    description.style.whiteSpace = 'pre-line';
    description.textContent = trophy.description;
    card.appendChild(description);

    if (includeProof && trophy.proof) {
        const proof = document.createElement('div');
        proof.className = 'trophy-proof with-divider';
        proof.textContent = `📸 ${trophy.proof}`;
        card.appendChild(proof);
    }

    return card;
}

function buildApplicationCard(trophy) {
    const card = document.createElement('section');
    card.className = 'card';
    card.id = 'trophyApplicationCard';

    card.innerHTML = `
        <h2 class="card-title">Отправить заявку</h2>
        <form class="form" id="trophyApplicationForm">
            <div class="input">
                <label for="trophyApplicationComment">Комментарии (необязательно)</label>
                <textarea id="trophyApplicationComment" rows="1" placeholder="Дополнительная информация"></textarea>
            </div>
            <div class="input">
                <label for="trophyApplicationFiles">Прикрепите файлы</label>
                <input id="trophyApplicationFiles" type="file" multiple accept="image/*,video/*" hidden />
                <button type="button" class="fileline-btn" id="trophyApplicationAddBtn" aria-label="Прикрепить файлы">＋ Прикрепить</button>
                <div id="trophyApplicationPreview" class="thumbs-row"></div>
            </div>
        </form>
        <div id="trophyApplicationProgress" class="progress-tracker hidden"></div>
        <div class="actions-bar">
            <button type="button" class="btn primary wide" id="trophyApplicationSubmitBtn">Отправить</button>
        </div>
    `;

    setupApplicationForm(card, trophy);
    return card;
}

function setupApplicationForm(card, trophy) {
    const commentEl = card.querySelector('#trophyApplicationComment');
    const filesInput = card.querySelector('#trophyApplicationFiles');
    const addBtn = card.querySelector('#trophyApplicationAddBtn');
    const previewEl = card.querySelector('#trophyApplicationPreview');
    const submitBtn = card.querySelector('#trophyApplicationSubmitBtn');
    const progressEl = card.querySelector('#trophyApplicationProgress');

    applicationState.commentEl = commentEl;
    applicationState.filesInput = filesInput;
    applicationState.previewEl = previewEl;
    applicationState.submitBtn = submitBtn;
    applicationState.progressEl = progressEl;
    applicationState.progressController = progressEl ? createProgressController(progressEl) : null;

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
        applicationState.progressController?.reset();
        handleFilesSelected(Array.from(filesInput.files || []));
    });

    submitBtn?.addEventListener('pointerdown', () => { hapticTapSmart(); });
    submitBtn?.addEventListener('click', (e) => {
        e.preventDefault?.();
        submitTrophyApplicationForm(trophy);
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

    const freeSlots = Math.max(0, MAX_TROPHY_FILES - applicationState.files.length);
    const knownKeys = new Set(applicationState.files.map((file) => createFileKey(file)));
    const uniqueNewFiles = [];
    let skippedByLimit = 0;

    supported.forEach((file) => {
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
        limit: 6,
        onRemove: (idx) => {
            applicationState.files.splice(idx, 1);
            hapticTapSmart();
            refreshPreview();
        },
    });
}

async function submitTrophyApplicationForm(trophy) {
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
    const progress = applicationState.progressController;
    const totalFiles = applicationState.files.length;
    const batchCount = Math.max(1, Math.ceil(totalFiles / MAX_FILES_PER_BATCH));

    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    submitBtn.textContent = 'Подготовка...';

    progress?.reset();
    progress?.start(batchCount);

    try {
        const comment = (applicationState.commentEl?.value || '').trim();

        if (progress) {
            progress.setStatus(0, 'done');
            if (progress.getStepCount() > 2) {
                progress.setStatus(1, 'active');
            } else {
                progress.setStatus(progress.getStepCount() - 1, 'active');
            }
        }

        submitBtn.textContent = 'Отправка...';

        await submitTrophyApplication(trophy.key, comment, applicationState.files, {
            onUploadProgress: (fraction) => {
                updateUploadProgress(progress, fraction, batchCount);
            },
        });

        if (progress) {
            const lastIndex = progress.getStepCount() - 1;
            progress.setStatus(lastIndex, 'done');
            progress.hide();
        }

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

        if (progress) {
            const lastIndex = progress.getStepCount() - 1;
            if (lastIndex >= 0) {
                progress.setStatus(lastIndex, 'error');
                progress.setLabel(lastIndex, 'Ошибка отправки');
            }
        }

        tg?.showPopup?.({
            title: 'Ошибка',
            message: error.message || 'Не удалось отправить заявку. Попробуйте позже.',
            buttons: [{ type: 'ok' }],
        });
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        submitBtn.textContent = originalText;
    }
}

function resetApplicationState() {
    applicationState.cleanupPreview();
    applicationState.cleanupPreview = () => {};
    applicationState.files = [];
    applicationState.commentEl = null;
    applicationState.previewEl = null;
    applicationState.progressController?.reset();
    applicationState.progressEl = null;
    applicationState.progressController = null;
    applicationState.filesInput = null;
    applicationState.submitBtn = null;
}
