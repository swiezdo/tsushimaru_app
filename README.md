# Tsushima Mini App

Telegram Mini App для игры Ghost of Tsushima: Legends - создание и управление профилями игроков и билдами.

## Описание

Этот проект представляет собой фронтенд приложение для Telegram Mini App. Позволяет пользователям:
- Создавать и редактировать профили
- Создавать и публиковать билды персонажей
- Просматривать билды других игроков
- Подавать заявки на повышение уровня мастерства
- Комментировать билды и ставить реакции
- Просматривать список участников и их уровни мастерства

## Структура проекта

```
tsushimaru_app/
└── docs/                    # Frontend (GitHub Pages)
    ├── assets/             # Статические ресурсы (логотипы, иконки)
    ├── css/                # Стили
    ├── js/                 # JavaScript модули
    │   ├── main.js         # Главный файл, инициализация
    │   ├── telegram.js     # Работа с Telegram WebApp SDK
    │   ├── api.js          # API клиент для miniapp_api
    │   ├── profile.js      # Профиль пользователя
    │   ├── builds.js       # Билды
    │   ├── mastery.js       # Мастерство
    │   ├── participants.js  # Участники
    │   ├── feedback.js      # Отзывы
    │   ├── whatsNew.js     # Что нового
    │   ├── ui.js            # UI утилиты
    │   └── utils.js        # Общие утилиты
    ├── index.html          # Главная страница
    ├── mastery-config.json  # Конфигурация мастерства
    └── whats-new.json      # Что нового
```

## Компоненты

### Frontend (`/docs`)

- **Технологии**: HTML, CSS, JavaScript, Telegram WebApp SDK
- **Деплой**: GitHub Pages (автоматически из папки `/docs`)
- **URL**: https://swiezdo.github.io/tsushimaru_app/
- **Статические файлы**: все ресурсы в `docs/`

## Оптимизации и соглашения

- `docs/js/api.js` использует единый помощник `requestJson()` и функции-обёртки, чтобы не дублировать обработку `fetch`.
- Логика навигации и BackButton сведена в `main.js`/`ui.js`, без длинных цепочек `if / else`.
- В `css/style.css` добавлены утилитарные классы (`hidden-input`, `mt-sm`, `build-edit-btn--left`), что позволило отказаться от инлайн-стилей в `index.html`.
- Повторяющиеся операции с DOM (чипы, превью файлов, карточки) переиспользуют функции из `utils.js` и локальные хелперы в модулях.

### Backend

- **Расположение**: `/root/miniapp_api` (отдельный проект)
- **Технологии**: Python, FastAPI, SQLite
- **API URL**: https://api.tsushimaru.com
- **Взаимодействие**: только через REST API

## Быстрый старт

### Разработка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd tsushimaru_app
```

2. Откройте `docs/index.html` в браузере (для локальной разработки)
   - Или используйте локальный сервер для разработки

3. Для тестирования в Telegram:
   - Запустите локальный сервер (например, через Python: `python -m http.server 8000`)
   - Используйте ngrok или подобный инструмент для создания публичного URL
   - Настройте бота на использование этого URL

### Деплой на GitHub Pages

1. Убедитесь, что все файлы в папке `docs/`
2. Сделайте commit и push:
```bash
git add docs/
git commit -m "Update frontend"
git push origin main
```

3. GitHub Pages автоматически обновится (обычно в течение минуты)

### Настройка GitHub Pages

1. Перейдите в Settings → Pages репозитория
2. Выберите "Deploy from a branch"
3. Выберите ветку: `main`
4. Выберите папку: `/docs`
5. Сохраните

## API взаимодействие

### Авторизация

Все запросы (кроме публичных) требуют заголовок `X-Telegram-Init-Data`:
```javascript
headers: {
    'X-Telegram-Init-Data': window.Telegram.WebApp.initData
}
```

### Основные endpoints

- **Профили**: `/api/profile.get`, `/api/profile.save`
- **Билды**: `/api/builds.*` (create, getMy, getPublic, search, get, update, delete, togglePublish)
- **Комментарии**: `/api/comments.create`, `/api/comments.get`
- **Реакции**: `/api/builds.toggleReaction`, `/api/builds.getReactions/{build_id}`
- **Мастерство**: `/api/mastery.get`, `/api/mastery.submitApplication`
- **Участники**: `/api/users.list`
- **Отзывы**: `/api/feedback.submit`

### Настройка API endpoint

В файле `docs/js/api.js` настройте `API_BASE_URL`:
```javascript
const API_BASE_URL = 'https://api.tsushimaru.com';
// или для разработки: 'http://localhost:8000'
```

## Конфигурационные файлы

### mastery-config.json

- Расположение: `docs/mastery-config.json`
- Содержит структуру категорий и уровней мастерства
- Загружается через API: `/assets/mastery-config.json`
- Используется для отображения форм заявок на мастерство
- Текущие категории: `solo`, `hellmode`, `raid`, `speedrun`, `glitch` (иконки лежат в `docs/assets/mastery/<key>/`)

### whats-new.json

- Расположение: `docs/whats-new.json`
- Содержит список новостей/обновлений
- Загружается через API: `/assets/whats-new.json`
- Отображается в разделе "Что нового?"

## Структура экранов

1. **Home Screen** - главный экран с кнопками навигации
2. **Profile Screen** - профиль пользователя (просмотр и редактирование)
3. **Builds Screen** - список билдов (создание, просмотр, редактирование)
4. **Mastery Screen** - мастерство (просмотр уровней, подача заявок)
5. **Participants Screen** - список участников с уровнями мастерства
6. **Feedback Screen** - отправка отзывов и баг-репортов
7. **Whats New Screen** - что нового в приложении

## Разработка

### Обновление кода

**Frontend**: Просто делайте commit и push - GitHub Pages обновится автоматически.

**Backend**: Backend находится в отдельном репозитории `/root/miniapp_api`. Для обновления backend следуйте инструкциям в его README.

### Локальная разработка

Для локальной разработки можно использовать:
```bash
cd docs
python -m http.server 8000
# или
npx serve
```

Затем откройте http://localhost:8000 в браузере.

**Важно**: Для полноценного тестирования нужен доступ к Telegram WebApp SDK, поэтому рекомендуется тестировать в реальном Telegram Mini App.

## Безопасность

- **Авторизация**: через Telegram `initData` (валидируется на стороне API)
- **CORS**: настроен на стороне API для домена GitHub Pages
- **Нет прямого доступа к БД**: все через REST API

## Интеграции

### miniapp_api

- Взаимодействие только через REST API
- API endpoint: `https://api.tsushimaru.com`
- Валидация через Telegram initData

### gyozenbot

- Бот открывает Mini App через WebApp кнопку
- Пользователь взаимодействует с фронтендом
- Фронтенд обращается к API

## Дополнительная информация

Для более детальной информации о работе с проектом см. [CONTEXT.md](CONTEXT.md) - файл с контекстом для AI-ассистента, содержащий важные нюансы структуры проекта, взаимодействия с API и примеры работы с модулями.

## Лицензия

MIT License
