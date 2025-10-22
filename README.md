# Tsushima Mini App

Telegram Mini App для игры Ghost of Tsushima: Legends - создание и управление профилями игроков, трофеями и билдами.

## Структура проекта

```
tsushimaru_app/
├── docs/                    # Frontend (GitHub Pages)
│   ├── assets/             # Статические ресурсы
│   ├── css/                # Стили
│   ├── js/                 # JavaScript модули
│   ├── index.html          # Главная страница
│   └── .gitignore          # Git ignore для фронтенда
├── backend/                 # Backend API
│   ├── app.py              # FastAPI приложение
│   ├── db.py               # Работа с базой данных
│   ├── security.py         # Валидация Telegram initData
│   ├── requirements.txt    # Python зависимости
│   ├── .env.example        # Пример переменных окружения
│   ├── .gitignore          # Git ignore для бэкенда
│   └── README.md           # Инструкции по развертыванию
├── .gitignore              # Общий git ignore
└── README.md               # Этот файл
```

## Компоненты

### Frontend (`/docs`)
- **Технологии**: HTML, CSS, JavaScript, Telegram WebApp SDK
- **Деплой**: GitHub Pages (автоматически из папки `/docs`)
- **URL**: https://swiezdo.github.io/tsushimaru_app/

### Backend (`/backend`)
- **Технологии**: Python 3, FastAPI, SQLite, Uvicorn
- **Деплой**: Raspberry Pi с systemd сервисом
- **API**: REST API для управления профилями пользователей

## Быстрый старт

### Frontend (разработка)
1. Клонируйте репозиторий
2. Откройте `docs/index.html` в браузере
3. Изменения автоматически деплоятся на GitHub Pages

### Backend (развертывание)
Следуйте инструкциям в [backend/README.md](backend/README.md) для:
- Установки Git на Raspberry Pi
- Настройки SSH ключей
- Клонирования репозитория с sparse-checkout
- Настройки виртуального окружения
- Конфигурации systemd сервисов

## API Endpoints

- `GET /health` - проверка работоспособности API
- `GET /api/profile.get` - получение профиля пользователя
- `POST /api/profile.save` - сохранение профиля пользователя
- `GET /api/stats` - статистика API

## GitHub Pages настройка

1. Перейдите в Settings → Pages
2. Выберите "Deploy from a branch"
3. Выберите ветку: `main`
4. Выберите папку: `/docs`
5. Сохраните

## Разработка

### Обновление кода

**Frontend**: Просто делайте commit и push - GitHub Pages обновится автоматически.

**Backend**: Используйте команду из [backend/README.md](backend/README.md):
```bash
cd ~/miniapp_api && sudo systemctl stop miniapp_api && git pull origin main && mv backend/* . 2>/dev/null && rmdir backend 2>/dev/null && source venv/bin/activate && pip install -r requirements.txt && sudo systemctl start miniapp_api && sudo systemctl status miniapp_api
```

## Безопасность

- Telegram `initData` валидация через HMAC-SHA256
- CORS настроен для домена GitHub Pages
- Переменные окружения для конфиденциальных данных

## Лицензия

MIT License
