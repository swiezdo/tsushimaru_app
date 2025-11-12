# Контекст для AI-ассистента - Tsushima Mini App (Frontend)

Этот файл содержит важную информацию для AI-ассистента при работе с проектом tsushimaru_app.

## Общие принципы

- Проект представляет собой **статический фронтенд** (HTML, CSS, JavaScript)
- Деплоится на **GitHub Pages** из папки `docs/`
- Использует **Telegram WebApp SDK** для взаимодействия с Telegram
- Взаимодействует с **miniapp_api** только через **REST API**
- **Нет прямого доступа к БД** - все через API

## Важные нюансы и особенности

### Структура проекта

```
tsushimaru_app/
└── docs/                    # Frontend (GitHub Pages)
    ├── assets/             # Статические ресурсы (логотипы, иконки)
    ├── css/                # Стили (style.css)
    ├── js/                 # JavaScript модули
    │   ├── main.js         # Главный файл, инициализация
    │   ├── telegram.js     # Работа с Telegram WebApp SDK
    │   ├── api.js          # API клиент для miniapp_api
    │   ├── profile.js      # Профиль пользователя
    │   ├── builds.js        # Билды
    │   ├── mastery.js       # Мастерство
    │   ├── participants.js  # Участники
    │   ├── feedback.js      # Отзывы
    │   ├── whatsNew.js     # Что нового
    │   ├── ui.js            # UI утилиты
    │   └── utils.js         # Общие утилиты
    ├── index.html          # Главная страница
    ├── mastery-config.json # Конфигурация мастерства (загружается через API)
    └── whats-new.json      # Что нового (загружается через API)
```

- `js/api.js` содержит helper `requestJson()` — новые запросы следует строить на нём вместо прямого `fetch`.
- Навигация и BackButton централизованы в `main.js`/`ui.js`; избегайте дублирования переходов внутри экранов.
- Для отказа от inline-стилей используйте утилитарные классы `hidden-input`, `mt-sm`, `build-edit-btn--left` из `css/style.css`.

### GitHub Pages

- **Деплой**: автоматический из папки `docs/`
- **URL**: `https://swiezdo.github.io/tsushimaru_app/`
- **Настройка**: Settings → Pages → Source: `/docs`
- **Обновление**: просто commit и push - GitHub Pages обновится автоматически

### Backend отдельно

- **Backend НЕ в этом репозитории!**
- Backend находится в `/root/miniapp_api` (отдельный проект)
- Взаимодействие только через REST API
- API endpoint: `https://api.tsushimaru.com` (или `API_BASE_URL` из конфига)

### Telegram WebApp SDK

- Используется для:
  - Получения `initData` для авторизации
  - Отправки данных в Telegram
  - Работы с темой (светлая/темная)
  - Закрытия приложения

- Инициализация:
```javascript
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
```

### API взаимодействие

#### Авторизация

- Все запросы (кроме публичных) требуют заголовок `X-Telegram-Init-Data`
- Получается из `tg.initData`
- Отправляется в каждом запросе к API

#### Endpoints

- Профили: `/api/profile.get`, `/api/profile.save`
- Билды: `/api/builds.*`
- Мастерство: `/api/mastery.*`
- Комментарии: `/api/comments.*`
- Реакции: `/api/builds.toggleReaction`, `/api/builds.getReactions/{build_id}`

#### Обработка ошибок

- Все ошибки обрабатываются в `api.js`
- Показываются пользователю через UI утилиты
- Логирование ошибок в консоль

### Конфигурационные файлы

#### mastery-config.json

- Загружается через API: `/assets/mastery-config.json`
- Содержит структуру категорий и уровней мастерства
- Используется для отображения форм заявок на мастерство
- Формат: JSON с ключами `categories`, каждый category содержит `levels`
- Поддерживаемые ключи категорий: `solo`, `hellmode`, `raid`, `speedrun`, `glitch` (статические ассеты берутся из `docs/assets/mastery/<key>/`)

#### whats-new.json

- Загружается через API: `/assets/whats-new.json`
- Содержит список новостей/обновлений
- Отображается в разделе "Что нового?"

### Структура JavaScript модулей

#### main.js

- Инициализация приложения
- Настройка роутинга между экранами
- Обработка навигации

#### telegram.js

- Работа с Telegram WebApp SDK
- Получение initData
- Настройка темы
- Отправка данных в Telegram

#### api.js

- Клиент для работы с miniapp_api
- Все HTTP запросы проходят через этот модуль
- Обработка ошибок
- Добавление заголовков авторизации

#### profile.js, builds.js, mastery.js и т.д.

- Модули для работы с конкретными разделами
- Каждый модуль отвечает за свой функционал
- Используют `api.js` для запросов к серверу

## Интеграции с другими проектами

### miniapp_api

- **REST API**: все взаимодействие через HTTP запросы
- **API endpoint**: `https://api.tsushimaru.com` (настраивается в `api.js`)
- **Авторизация**: через `X-Telegram-Init-Data` заголовок
- **CORS**: настроен на стороне API для GitHub Pages домена

### gyozenbot

- **Нет прямой интеграции**
- gyozenbot открывает Mini App через WebApp кнопку
- Пользователь взаимодействует с фронтендом, который обращается к API

## Частые задачи и их решения

### Добавление нового экрана

1. Добавить HTML секцию в `index.html` с `id="newScreen"` и классом `hidden`
2. Создать JavaScript модуль `js/newScreen.js`
3. Добавить обработчик навигации в `main.js`
4. Добавить кнопку для открытия экрана

### Работа с API

```javascript
// В api.js
async function apiCall(endpoint, method = 'GET', data = null) {
    const tg = window.Telegram.WebApp;
    const initData = tg.initData;
    
    const options = {
        method,
        headers: {
            'X-Telegram-Init-Data': initData,
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    return response.json();
}
```

### Загрузка изображений

```javascript
// Для аватарок и фото билдов
const formData = new FormData();
formData.append('photo', file);

const response = await fetch(`${API_BASE_URL}/api/endpoint`, {
    method: 'POST',
    headers: {
        'X-Telegram-Init-Data': tg.initData
    },
    body: formData
});
```

### Обновление конфигурационных файлов

- `mastery-config.json` и `whats-new.json` находятся в `docs/`
- После изменения нужно сделать commit и push
- GitHub Pages обновится автоматически
- API маунтит эти файлы через `/assets/`

## Известные ограничения

1. **Нет прямого доступа к БД**: все через REST API
2. **Backend отдельно**: не в этом репозитории, в `/root/miniapp_api`
3. **Статические файлы**: только HTML, CSS, JavaScript (нет серверной логики)
4. **GitHub Pages**: ограничения на размер файлов, нет серверных возможностей
5. **CORS**: должен быть настроен на стороне API для GitHub Pages домена

## Структура экранов

1. **Home Screen** (`#homeScreen`) - главный экран с кнопками
2. **Profile Screen** (`#profileScreen`) - профиль пользователя
3. **Builds Screen** (`#buildsScreen`) - список билдов
4. **Mastery Screen** (`#masteryScreen`) - мастерство
5. **Participants Screen** (`#participantsScreen`) - список участников
6. **Feedback Screen** (`#feedbackScreen`) - отзывы/баг-репорты
7. **Whats New Screen** (`#whatsNewScreen`) - что нового

## Важные замечания

1. **API endpoint**: настраивается в `api.js`, по умолчанию `https://api.tsushimaru.com`
2. **Авторизация**: всегда требуется `X-Telegram-Init-Data` заголовок
3. **Обработка ошибок**: все ошибки API должны обрабатываться и показываться пользователю
4. **Телефонная тема**: учитывать темную/светлую тему через Telegram WebApp SDK
5. **Responsive design**: приложение должно работать на мобильных устройствах

