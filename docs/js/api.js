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
        console.log('Профиль получен:', data);
        return data;
    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        throw error;
    }
}

// Сохранение профиля пользователя
export async function saveProfile(formData) {
    try {
        console.log('📤 Отправка данных профиля:', formData);
        
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
        console.log('✅ Профиль сохранен:', result);
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
        console.log('API работает:', data);
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
        console.log('Статистика API:', data);
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

// Экспорт константы для использования в других модулях
export { API_BASE };
