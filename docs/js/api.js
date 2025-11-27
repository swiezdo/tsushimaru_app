// api.js
// API-клиент для взаимодействия с бэкендом Tsushima Mini App

import { tg } from './telegram.js';

// Конфигурация API endpoint
const API_BASE = 'https://api.tsushimaru.com';

// Получение initData из Telegram WebApp
function getInitData() {
    if (!tg || !tg.initData) {
        console.error('Telegram WebApp initData недоступен');
        return null;
    }
    return tg.initData;
}

function ensureInitData() {
    const initData = getInitData();
    if (!initData) {
        throw new Error('Не удалось получить данные авторизации Telegram');
    }
    return initData;
}

function isFormData(value) {
    return typeof FormData !== 'undefined' && value instanceof FormData;
}

async function requestJson(endpoint, { method = 'GET', headers = {}, body, includeAuth = false } = {}) {
    const finalHeaders = { ...headers };
    let payload = body;

    if (includeAuth) {
        finalHeaders['X-Telegram-Init-Data'] = ensureInitData();
    }

    if (payload && !isFormData(payload) && payload !== undefined) {
        if (!finalHeaders['Content-Type']) {
            finalHeaders['Content-Type'] = 'application/json';
        }
        payload = JSON.stringify(payload);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: finalHeaders,
        body: payload,
    });

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
    }

    if (!response.ok) {
        const error = new Error(
            data?.detail || data?.message || `HTTP ${response.status}`,
        );
        error.status = response.status;
        throw error;
    }

    return data;
}

// Базовый fetch с обработкой ошибок
async function apiRequest(endpoint, options = {}) {
    return requestJson(endpoint, { ...options, includeAuth: true });
}

function safeParseJSON(text) {
    if (typeof text !== 'string' || !text.length) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function postFormDataWithProgress(url, formData, initData, options = {}) {
    const { onUploadProgress } = options || {};

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.responseType = 'json';

        if (initData) {
            xhr.setRequestHeader('X-Telegram-Init-Data', initData);
        }

        if (typeof onUploadProgress === 'function') {
            xhr.upload.addEventListener('progress', (event) => {
                if (!event.lengthComputable) return;
                const fraction = event.total > 0 ? event.loaded / event.total : 0;
                try {
                    onUploadProgress(Math.min(1, Math.max(0, fraction)));
                } catch (progressError) {
                    console.error('Ошибка обработчика прогресса загрузки:', progressError);
                }
            });
        }

        xhr.onerror = () => {
            reject(new Error('Не удалось отправить запрос. Проверьте соединение.'));
        };

        xhr.onabort = () => {
            reject(new Error('Отправка была прервана.'));
        };

        xhr.onreadystatechange = () => {
            if (xhr.readyState !== XMLHttpRequest.DONE) return;

            const status = xhr.status;
            const body = xhr.response ?? safeParseJSON(xhr.responseText);

            if (status >= 200 && status < 300) {
                if (typeof onUploadProgress === 'function') {
                    try {
                        onUploadProgress(1);
                    } catch (progressError) {
                        console.error('Ошибка обработчика прогресса загрузки:', progressError);
                    }
                }
                resolve(body ?? {});
            } else {
                const error = new Error(body?.detail || `HTTP ${status}`);
                error.status = status;
                reject(error);
            }
        };

        xhr.send(formData);
    });
}

// Получение профиля пользователя
export async function fetchProfile() {
    try {
        const data = await apiRequest('/api/profile.get');
        return data;
    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        throw error;
    }
}

// Сохранение профиля пользователя
export async function saveProfile(formData) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        // Создаем FormData для отправки
        const data = new FormData();
        
        // Добавляем поля формы
        data.append('real_name', formData.real_name || '');
        data.append('psn_id', formData.psn_id || '');
        
        // Добавляем массивы как отдельные поля
        const platforms = formData.platforms || [];
        platforms.forEach(platform => {
            data.append('platforms', platform);
        });
        
        const modes = formData.modes || [];
        modes.forEach(mode => {
            data.append('modes', mode);
        });
        
        const goals = formData.goals || [];
        goals.forEach(goal => {
            data.append('goals', goal);
        });
        
        const difficulties = formData.difficulties || [];
        difficulties.forEach(difficulty => {
            data.append('difficulties', difficulty);
        });

        // Добавляем день рождения, если указан
        if (formData.birthday) {
            data.append('birthday', formData.birthday);
        }

        const result = await requestJson('/api/profile.save', {
            method: 'POST',
            body: data,
            includeAuth: true,
        });
        return result ?? {};
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        throw error;
    }
}

// Проверка работоспособности API
export async function checkApiHealth() {
    try {
        const data = await requestJson('/health');
        return data ?? {};
    } catch (error) {
        console.error('Ошибка проверки API:', error);
        throw error;
    }
}

// Получение статистики API
export async function getApiStats() {
    try {
        const data = await apiRequest('/api/stats');
        return data;
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        throw error;
    }
}

// Получение данных волн
export async function getWavesData() {
    try {
        const data = await apiRequest('/api/waves.get');
        return data;
    } catch (error) {
        console.error('Ошибка получения волн:', error);
        throw error;
    }
}

// Утилита для проверки подключения к API
export async function testConnection() {
    try {
        await checkApiHealth();
        return true;
    } catch (error) {
        console.error('Нет подключения к API:', error);
        return false;
    }
}

// Проверка участия в группе
export async function checkGroupMembership() {
    try {
        const data = await apiRequest('/api/user.checkGroupMembership');
        return data.is_member === true;
    } catch (error) {
        console.error('Ошибка проверки участия в группе:', error);
        // При ошибке считаем что пользователь не в группе
        return false;
    }
}

// Проверка регистрации пользователя (упрощенная версия - только проверка наличия в БД)
export async function checkUserRegistration() {
    try {
        // Проверяем наличие профиля в БД
        await fetchProfile();
        return true;
    } catch (error) {
        if (error.status === 404) {
            // Пользователь не зарегистрирован
            return false;
        }
        // Для других ошибок (сеть, сервер) считаем что пользователь не зарегистрирован
        console.error('Ошибка проверки регистрации:', error);
        return false;
    }
}

// Уведомление бота о том, что пользователь не в группе
export async function notifyBotUserNotRegistered() {
    try {
        await apiRequest('/api/user.notifyNotRegistered', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Ошибка уведомления бота:', error);
        // Не критично, если не удалось отправить - просто логируем
    }
}

// Получение последних событий наград/мастерства
export async function getRecentEvents(limit = 3) {
    const normalizeAvatarUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `${API_BASE}${url}`;
    };

    try {
        const params = new URLSearchParams({ limit: String(Math.max(1, Math.min(limit, 10))) });
        const data = await apiRequest(`/api/events.recent?${params.toString()}`);
        if (data && Array.isArray(data.events)) {
            return data.events.map((event) => ({
                ...event,
                avatar_url: normalizeAvatarUrl(event?.avatar_url || ''),
            }));
        }
        return [];
    } catch (error) {
        console.error('Ошибка получения ленты наград:', error);
        return [];
    }
}

export async function getTop100Prize() {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        const response = await requestJson('/api/top100.prize', {
            method: 'GET',
            includeAuth: true
        });

        if (!response || response.status !== 'ok') {
            throw new Error(response?.detail || 'Ошибка получения приза Top100');
        }

        return response.prize;
    } catch (error) {
        console.error('Ошибка получения приза Top100:', error);
        throw error;
    }
}

export async function getRecentComments(limit = 3) {
    const normalizeAvatarUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `${API_BASE}${url}`;
    };

    try {
        const params = new URLSearchParams({ limit: String(Math.max(1, Math.min(limit, 10))) });
        const data = await apiRequest(`/api/comments.recent?${params.toString()}`);
        if (data && Array.isArray(data.comments)) {
            return data.comments.map((comment) => ({
                ...comment,
                avatar_url: normalizeAvatarUrl(comment?.avatar_url || ''),
                build_class: comment?.build_class || '',
            }));
        }
        return [];
    } catch (error) {
        console.error('Ошибка получения комментариев:', error);
        return [];
    }
}

export async function getUpcomingBirthdays(limit = 3) {
    const normalizeAvatarUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `${API_BASE}${url}`;
    };

    try {
        const params = new URLSearchParams({ limit: String(Math.max(1, Math.min(limit, 10))) });
        const data = await apiRequest(`/api/birthdays.upcoming?${params.toString()}`);
        if (data && Array.isArray(data.birthdays)) {
            return data.birthdays.map((birthday) => ({
                ...birthday,
                avatar_url: normalizeAvatarUrl(birthday?.avatar_url || ''),
            }));
        }
        return [];
    } catch (error) {
        console.error('Ошибка получения ближайших дней рождения:', error);
        return [];
    }
}

export async function getHellmodeQuest() {
    try {
        const data = await apiRequest('/api/quests.hellmode');
        return data || null;
    } catch (error) {
        console.error('Ошибка получения задания HellMode:', error);
        return null;
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С БИЛДАМИ ==========

// Создание билда
export async function createBuild(buildData) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        const data = new FormData();
        data.append('name', buildData.name || '');
        data.append('class_name', buildData.class || '');
        data.append('tags', JSON.stringify(buildData.tags || []));
        data.append('description', buildData.description || '');
        
        // Добавляем изображения
        if (buildData.photo_1) data.append('photo_1', buildData.photo_1);
        if (buildData.photo_2) data.append('photo_2', buildData.photo_2);

        return await requestJson('/api/builds.create', {
            method: 'POST',
            body: data,
            includeAuth: true,
        });
    } catch (error) {
        console.error('Ошибка создания билда:', error);
        throw error;
    }
}

// Обновление билда
export async function updateBuild(buildId, buildData) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        const data = new FormData();
        data.append('build_id', buildId);
        data.append('name', buildData.name || '');
        data.append('class_name', buildData.class || '');
        data.append('tags', JSON.stringify(buildData.tags || []));
        data.append('description', buildData.description || '');
        
        // Добавляем изображения только если они были изменены (являются Blob)
        if (buildData.photo_1) {
            data.append('photo_1', buildData.photo_1, 'photo_1.jpg');
        }
        if (buildData.photo_2) {
            data.append('photo_2', buildData.photo_2, 'photo_2.jpg');
        }

        return await requestJson('/api/builds.update', {
            method: 'POST',
            body: data,
            includeAuth: true,
        });
    } catch (error) {
        console.error('Ошибка обновления билда:', error);
        throw error;
    }
}

// Получение своих билдов
export async function getMyBuilds() {
    try {
        const data = await apiRequest('/api/builds.getMy');
        return data.builds || [];
    } catch (error) {
        console.error('Ошибка получения билдов:', error);
        throw error;
    }
}

// Получение публичных билдов
export async function getPublicBuilds() {
    try {
        const data = await requestJson('/api/builds.getPublic');
        return data.builds || [];
    } catch (error) {
        console.error('Ошибка получения публичных билдов:', error);
        throw error;
    }
}

// Переключение публичности билда
export async function toggleBuildPublish(buildId, isPublic) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        const data = new FormData();
        data.append('build_id', buildId);
        data.append('is_public', isPublic ? 1 : 0);

        return await requestJson('/api/builds.togglePublish', {
            method: 'POST',
            body: data,
            includeAuth: true,
        });
    } catch (error) {
        console.error('Ошибка переключения публичности билда:', error);
        throw error;
    }
}

// Удаление билда
export async function deleteBuild(buildId) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        // Преобразуем buildId в число для корректной работы на бэкенде
        const buildIdNum = parseInt(buildId, 10);
        return await requestJson(`/api/builds.delete?build_id=${buildIdNum}`, {
            method: 'DELETE',
            includeAuth: true,
        });
    } catch (error) {
        console.error('Ошибка удаления билда:', error);
        throw error;
    }
}


// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ОТЗЫВАМИ ==========

// Отправка отзыва
export async function submitFeedback(description, photos = []) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        // Всегда используем FormData для совместимости с бэкендом
        const data = new FormData();
        data.append('description', description || '');
        
        // Добавляем изображения, если они есть
        if (photos && photos.length > 0) {
            photos.forEach(photo => {
                if (photo) {
                    data.append('photos', photo);
                }
            });
        }

        return (await requestJson('/api/feedback.submit', {
            method: 'POST',
            body: data,
            includeAuth: true,
        })) ?? {};
    } catch (error) {
        console.error('Ошибка отправки отзыва:', error);
        throw error;
    }
}

// Получение списка всех участников
export async function fetchParticipants() {
    try {
        const data = await apiRequest('/api/users.list');
        return data.users || [];
    } catch (error) {
        console.error('Ошибка получения списка участников:', error);
        throw error;
    }
}

// Получение профиля участника по user_id
export async function fetchUserProfile(userId) {
    try {
        const data = await apiRequest(`/api/users.getProfile?target_user_id=${userId}`);
        return data;
    } catch (error) {
        console.error('Ошибка получения профиля участника:', error);
        throw error;
    }
}

// Получение публичных билдов участника по user_id
export async function fetchUserBuilds(userId) {
    try {
        const data = await apiRequest(`/api/builds.getUserBuilds?target_user_id=${userId}`);
        return data.builds || [];
    } catch (error) {
        console.error('Ошибка получения билдов участника:', error);
        throw error;
    }
}


// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С МАСТЕРСТВОМ ==========

// Получение уровней мастерства
export async function fetchMastery() {
    try {
        const data = await apiRequest('/api/mastery.get');
        return data;
    } catch (error) {
        console.error('Ошибка получения уровней мастерства:', error);
        // При ошибке возвращаем нулевые уровни
        return { solo: 0, hellmode: 0, raid: 0, speedrun: 0, glitch: 0 };
    }
}

// Получение уровней мастерства пользователя по user_id
export async function fetchUserMastery(userId) {
    try {
        const data = await apiRequest(`/api/mastery.get?target_user_id=${userId}`);
        return data;
    } catch (error) {
        console.error('Ошибка получения уровней мастерства пользователя:', error);
        return { solo: 0, hellmode: 0, raid: 0, speedrun: 0, glitch: 0 };
    }
}

// Отправка заявки на повышение уровня мастерства
export async function submitMasteryApplication(
    categoryKey,
    currentLevel,
    nextLevel,
    comment = '',
    media = [],
    options = {},
) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        const data = new FormData();
        data.append('category_key', categoryKey);
        data.append('current_level', currentLevel.toString());
        data.append('next_level', nextLevel.toString());
        
        if (comment) {
            data.append('comment', comment);
        }
        
        const files = Array.isArray(media) ? media : Array.from(media || []);

        files.forEach((file) => {
            if (file) {
                data.append('photos', file);
            }
        });

        const url = `${API_BASE}/api/mastery.submitApplication`;
        return await postFormDataWithProgress(url, data, initData, options);
    } catch (error) {
        console.error('Ошибка отправки заявки на повышение уровня:', error);
        throw error;
    }
}

// Загрузка аватарки на сервер
export async function uploadAvatar(userId, avatarFile) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }
        
        const data = new FormData();
        data.append('avatar', avatarFile);
        
        return (await requestJson(`/api/users/avatars/${userId}/upload`, {
            method: 'POST',
            body: data,
            includeAuth: true,
        })) ?? {};
    } catch (error) {
        console.error('Ошибка загрузки аватарки:', error);
        throw error;
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С КОММЕНТАРИЯМИ ==========

// Создание комментария
export async function createComment(buildId, commentText) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        const data = new FormData();
        data.append('build_id', buildId);
        data.append('comment_text', commentText);

        return (await requestJson('/api/comments.create', {
            method: 'POST',
            body: data,
            includeAuth: true,
        })) ?? {};
    } catch (error) {
        console.error('Ошибка создания комментария:', error);
        throw error;
    }
}

// Получение комментариев для билда
export async function getBuildComments(buildId) {
    try {
        const data = await requestJson(`/api/comments.get?build_id=${buildId}`);
        return data.comments || [];
    } catch (error) {
        console.error('Ошибка получения комментариев:', error);
        throw error;
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С РЕАКЦИЯМИ (ЛАЙКИ/ДИЗЛАЙКИ) ==========

// Переключение реакции (лайк/дизлайк)
export async function toggleReaction(buildId, reactionType) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        const data = new FormData();
        data.append('build_id', buildId);
        data.append('reaction_type', reactionType);

        const result = (await requestJson('/api/builds.toggleReaction', {
            method: 'POST',
            body: data,
            includeAuth: true,
        })) ?? {};
        return {
            likes_count: result.likes_count || 0,
            dislikes_count: result.dislikes_count || 0,
            current_user_reaction: result.current_user_reaction || null
        };
    } catch (error) {
        console.error('Ошибка переключения реакции:', error);
        throw error;
    }
}

// Получение статистики реакций для билда
export async function getReactions(buildId) {
    try {
        const data = await apiRequest(`/api/builds.getReactions/${buildId}`);
        return {
            likes_count: data.likes_count || 0,
            dislikes_count: data.dislikes_count || 0,
            current_user_reaction: data.current_user_reaction || null
        };
    } catch (error) {
        console.error('Ошибка получения реакций:', error);
        throw error;
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ТРОФЕЯМИ ==========

// Получение трофеев пользователя
export async function fetchTrophies() {
    try {
        const data = await apiRequest('/api/trophies.get');
        return {
            trophies: data.trophies || [],
            active_trophies: data.active_trophies || []
        };
    } catch (error) {
        console.error('Ошибка получения трофеев:', error);
        throw error;
    }
}

// Получение трофеев указанного пользователя
export async function fetchUserTrophies(targetUserId) {
    try {
        const data = await apiRequest(`/api/trophies.get?target_user_id=${targetUserId}`);
        return {
            trophies: data.trophies || [],
            active_trophies: data.active_trophies || []
        };
    } catch (error) {
        console.error('Ошибка получения трофеев пользователя:', error);
        throw error;
    }
}

// Получение списка всех доступных трофеев из конфига
export async function fetchTrophiesList() {
    try {
        const data = await apiRequest('/api/trophies.list');
        return data.trophies || [];
    } catch (error) {
        console.error('Ошибка получения списка трофеев:', error);
        throw error;
    }
}

// Отправка заявки на получение трофея
export async function submitTrophyApplication(trophyKey, comment = '', media = [], options = {}) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        const data = new FormData();
        data.append('trophy_key', trophyKey);
        
        if (comment) {
            data.append('comment', comment);
        }
        
        const files = Array.isArray(media) ? media : Array.from(media || []);

        files.forEach((file) => {
            if (file) {
                data.append('photos', file);
            }
        });

        const url = `${API_BASE}/api/trophy.submit`;
        return await postFormDataWithProgress(url, data, initData, options);
    } catch (error) {
        console.error('Ошибка отправки заявки на получение трофея:', error);
        throw error;
    }
}

// Отправка заявки на задание HellMode Quest
export async function submitHellmodeQuestApplication(comment = '', files = [], options = {}) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        const data = new FormData();
        
        if (comment) {
            data.append('comment', comment);
        }
        
        const fileArray = Array.isArray(files) ? files : Array.from(files || []);

        fileArray.forEach((file) => {
            if (file) {
                data.append('photos', file);
            }
        });

        const url = `${API_BASE}/api/hellmodeQuest.submit`;
        return await postFormDataWithProgress(url, data, initData, options);
    } catch (error) {
        console.error('Ошибка отправки заявки на задание HellMode:', error);
        throw error;
    }
}

// Отправка заявки на ТОП-100
export async function submitTop100Application(category, comment = '') {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        const response = await requestJson('/api/top100.submit', {
            method: 'POST',
            body: {
                category: category,
                comment: comment || undefined
            },
            includeAuth: true
        });

        if (!response || response.status !== 'ok') {
            throw new Error(response?.detail || 'Ошибка отправки заявки ТОП-100');
        }

        return response;
    } catch (error) {
        console.error('Ошибка отправки заявки ТОП-100:', error);
        throw error;
    }
}

// Обновление активных трофеев
export async function updateActiveTrophies(activeTrophiesList) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        const data = new FormData();
        
        // Добавляем каждый трофей как отдельное поле
        activeTrophiesList.forEach(trophy => {
            data.append('active_trophies', trophy);
        });

        return (await requestJson('/api/trophies.updateActive', {
            method: 'POST',
            body: data,
            includeAuth: true,
        })) ?? {};
    } catch (error) {
        console.error('Ошибка обновления активных трофеев:', error);
        throw error;
    }
}

// Получение текущей недели ротации
export async function getCurrentRotationWeek() {
    try {
        const data = await requestJson('/api/rotation/current');
        return data.week || 14; // Возвращаем 14 по умолчанию если не удалось получить
    } catch (error) {
        console.error('Ошибка получения текущей недели:', error);
        // При ошибке возвращаем неделю 14 по умолчанию
        return 14;
    }
}

// Экспорт константы для использования в других модулях
export { API_BASE };
