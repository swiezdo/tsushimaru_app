// api.js
// API-клиент для взаимодействия с бэкендом Tsushima Mini App

import { tg } from './telegram.js';

// Базовый URL API (обновите на ваш Cloudflare Tunnel URL)
const API_BASE = 'https://painting-quarters-compound-promote.trycloudflare.com';

// Получение initData из Telegram WebApp
function getInitData() {
    if (!tg || !tg.initData) {
        console.error('Telegram WebApp initData недоступен');
        return null;
    }
    return tg.initData;
}

// Базовый fetch с обработкой ошибок
async function apiRequest(endpoint, options = {}) {
    const initData = getInitData();
    if (!initData) {
        throw new Error('Не удалось получить данные авторизации Telegram');
    }

    const url = `${API_BASE}${endpoint}`;
    const defaultOptions = {
        headers: {
            'X-Telegram-Init-Data': initData,
            'Content-Type': 'application/json',
        },
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, mergedOptions);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.detail || `HTTP ${response.status}`);
            error.status = response.status;
            throw error;
        }

        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Получение профиля пользователя
export async function fetchProfile() {
    try {
        const data = await apiRequest('/api/profile.get');
        
        // Фильтруем пустые трофеи
        if (data.trophies && typeof data.trophies === 'string') {
            data.trophies = data.trophies.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }
        
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

        console.log('📋 FormData содержимое:');
        for (let [key, value] of data.entries()) {
            console.log(`  ${key}: ${value}`);
        }

        const url = `${API_BASE}/api/profile.save`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Telegram-Init-Data': initData,
            },
            body: data,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.detail || `HTTP ${response.status}`);
            error.status = response.status;
            throw error;
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        throw error;
    }
}

// Проверка работоспособности API
export async function checkApiHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        if (!response.ok) {
            throw new Error(`API недоступен: ${response.status}`);
        }
        const data = await response.json();
        return data;
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

// Проверка регистрации пользователя
export async function checkUserRegistration() {
    try {
        await fetchProfile();
        return true; // Пользователь зарегистрирован (статус 200)
    } catch (error) {
        if (error.status === 404) {
            return false; // Пользователь не зарегистрирован
        }
        // Для других ошибок (сеть, сервер) считаем что пользователь не зарегистрирован
        console.error('Ошибка проверки регистрации:', error);
        return false;
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

        const url = `${API_BASE}/api/builds.create`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Telegram-Init-Data': initData,
            },
            body: data,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.detail || `HTTP ${response.status}`);
            error.status = response.status;
            throw error;
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка создания билда:', error);
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
        const response = await fetch(`${API_BASE}/api/builds.getPublic`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.detail || `HTTP ${response.status}`);
            error.status = response.status;
            throw error;
        }
        const data = await response.json();
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

        const url = `${API_BASE}/api/builds.togglePublish`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Telegram-Init-Data': initData,
            },
            body: data,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.detail || `HTTP ${response.status}`);
            error.status = response.status;
            throw error;
        }

        return await response.json();
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
        const url = `${API_BASE}/api/builds.delete?build_id=${buildIdNum}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'X-Telegram-Init-Data': initData,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.detail || `HTTP ${response.status}`);
            error.status = response.status;
            throw error;
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка удаления билда:', error);
        throw error;
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ТРОФЕЯМИ ==========

// Отправка заявки на трофей
export async function submitTrophyApplication(trophyId, photos, comment) {
    try {
        const initData = getInitData();
        if (!initData) {
            throw new Error('Не удалось получить данные авторизации Telegram');
        }

        const data = new FormData();
        data.append('trophy_id', trophyId);
        data.append('comment', comment || '');
        
        // Добавляем изображения
        photos.forEach(photo => {
            data.append('photos', photo);
        });

        const url = `${API_BASE}/api/trophies.submit`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Telegram-Init-Data': initData,
            },
            body: data,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.detail || `HTTP ${response.status}`);
            error.status = response.status;
            throw error;
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка отправки заявки на трофей:', error);
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

// Экспорт константы для использования в других модулях
export { API_BASE };
