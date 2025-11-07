// trophy_detail.js
// Модуль для работы с детальной страницей трофея

import { fetchTrophiesList, fetchTrophies, submitTrophyApplication } from './api.js';
import { showScreen, setTopbar, focusAndScrollIntoView } from './ui.js';
import { tg, hapticTapSmart, hapticOK, hapticERR, $ } from './telegram.js';
import { shake, createFileKey, isImageFile, clearChildren, renderFilesPreview } from './utils.js';

const MAX_TROPHY_FILES = 9;

const detailContainer = $('trophyDetailContainer');

let trophyListCache = null;

const applicationState = {
    files: [],
    cleanupPreview: () => {},
    commentEl: null,
    previewEl: null,
    filesInput: null,
    submitBtn: null,
};

export async function openTrophyDetail(trophyKey) {
    showScreen('trophyDetail');

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

    setTopbar(true, trophy.name);

    detailContainer.appendChild(buildDescriptionCard(trophy, isObtained));

    if (!isObtained) {
        detailContainer.appendChild(buildApplicationCard(trophy));
    }
}

function buildDescriptionCard(trophy, isObtained) {
    const card = document.createElement('section');
    card.className = `card ${isObtained ? 'max-level' : 'next-level'}`;

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = isObtained ? '🎉 Вы получили этот трофей!' : trophy.name;

    const description = document.createElement('div');
    description.className = 'trophy-description';
    description.textContent = trophy.description;

    card.appendChild(title);
    card.appendChild(description);

    if (!isObtained && trophy.proof) {
        const proof = document.createElement('div');
        proof.className = 'trophy-proof';
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
                <input id="trophyApplicationFiles" type="file" multiple accept="image/*" hidden />
                <button type="button" class="fileline-btn" id="trophyApplicationAddBtn" aria-label="Прикрепить файлы">＋ Прикрепить</button>
                <div id="trophyApplicationPreview" class="thumbs-row"></div>
            </div>
        </form>
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
        submitTrophyApplicationForm(trophy);
    });
}

function handleFilesSelected(files) {
    if (!files.length) {
        shake(applicationState.previewEl || applicationState.submitBtn);
        focusAndScrollIntoView(applicationState.previewEl || applicationState.submitBtn);
        return;
    }

    const images = files.filter((file) => isImageFile(file));
    if (images.length !== files.length) {
        tg?.showPopup?.({
            title: 'Неподдерживаемый формат',
            message: 'Разрешены только изображения.',
            buttons: [{ type: 'ok' }],
        });
    }

    const freeSlots = Math.max(0, MAX_TROPHY_FILES - applicationState.files.length);
    const knownKeys = new Set(applicationState.files.map((file) => createFileKey(file)));
    const uniqueNewFiles = [];
    let skippedByLimit = 0;

    images.forEach((file) => {
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
            message: `Можно прикрепить не более ${MAX_TROPHY_FILES} изображений.`,
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
        onRemove: (idx) => {
            applicationState.files.splice(idx, 1);
            hapticTapSmart();
            refreshPreview();
        },
    });
}

async function submitTrophyApplicationForm(trophy) {
    if (!applicationState.submitBtn) return;

    if (applicationState.files.length === 0) {
        shake(applicationState.submitBtn);
        focusAndScrollIntoView(applicationState.submitBtn);
        tg?.showPopup?.({
            title: 'Ошибка',
            message: 'Необходимо прикрепить хотя бы одно изображение.',
            buttons: [{ type: 'ok' }],
        });
        hapticERR();
        return;
    }

    const submitBtn = applicationState.submitBtn;
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    try {
        const comment = (applicationState.commentEl?.value || '').trim();
        await submitTrophyApplication(trophy.key, comment, applicationState.files);

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
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
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
