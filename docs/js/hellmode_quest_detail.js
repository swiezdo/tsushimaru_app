// hellmode_quest_detail.js
// Модуль для работы с детальной страницей задания HellMode

import { getHellmodeQuest } from './api.js';
import { showScreen, setTopbar } from './ui.js';
import { tg, hapticTapSmart } from './telegram.js';
import { getClassIconPath, getGearIconPath, getEmoteIconPath, getMapPath, getSystemIconPath } from './utils.js';
import { pushNavigation } from './navigation.js';

const detailContainer = document.getElementById('hellmodeQuestDetailContainer');

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
    detailContainer.innerHTML = '';

    // Карточка 1: Hero/Meta карточка
    detailContainer.appendChild(buildHeroCard(quest));

    // Карточка 2: Описание
    detailContainer.appendChild(buildDescriptionCard(quest));

    // Карточка 3: Задание
    detailContainer.appendChild(buildQuestCard(quest));

    // Карточка 4: Доказательство
    detailContainer.appendChild(buildProofCard(quest));

    // Карточка 5: Отправить заявку
    detailContainer.appendChild(buildApplicationCard());
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
    classImg.src = getClassIconPath(quest.class_slug);
    classImg.alt = quest.class_slug || '';
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
    classIcon.src = getClassIconPath(quest.class_slug);
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

function buildApplicationCard() {
    const card = document.createElement('section');
    card.className = 'card';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Отправить заявку';
    card.appendChild(title);

    const actionsBar = document.createElement('div');
    actionsBar.className = 'actions-bar';
    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'btn primary wide';
    submitBtn.textContent = 'Отправить заявку';
    submitBtn.addEventListener('click', () => {
        hapticTapSmart();
        // TODO: Реализовать функционал отправки заявки
        tg?.showPopup?.({
            title: 'В разработке',
            message: 'Функционал отправки заявки будет добавлен позже.',
            buttons: [{ type: 'ok' }],
        });
    });
    actionsBar.appendChild(submitBtn);
    card.appendChild(actionsBar);

    return card;
}

