# Контекст для AI-ассистента - Tsushima Mini App (Frontend)

Этот файл содержит важную информацию для AI-ассистента при работе с проектом tsushimaru_app.

## Общие принципы

- Проект представляет собой **статический фронтенд** (HTML, CSS, JavaScript)
- Содержимое публикуется как статический контент из папки `docs/`
- Использует **Telegram WebApp SDK** для взаимодействия с Telegram
- Взаимодействует с **miniapp_api** только через **REST API**
- **Нет прямого доступа к БД** - все через API

## Важные нюансы и особенности

### Структура проекта

```
tsushimaru_app/
└── docs/                    # Frontend (статический контент)
    ├── assets/             # Статические ресурсы (логотипы, иконки, данные)
    │   ├── icons/
    │   │   ├── classes/    # Иконки классов (samurai.*, hunter.*, assassin.*, ronin.*)
    │   │   ├── modes/      # Иконки режимов (story.svg, survival.svg, rivals.svg, trials.svg)
    │   │   ├── navigation/ # Иконки навигации WebP (home.webp, users.webp, ...)
    │   │   └── system/     # UI-иконки (like.svg, share.svg, sort.svg, tag.svg, ...)
    │   ├── maps/
    │   │   └── survival/   # Карты выживания
    │   └── data/           # Данные JSON (rotation.json, whats-new.json, trophies.json, mastery-config.json)
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
    └── index.html          # Главная страница
```

- `js/api.js` содержит helper `requestJson()` — новые запросы следует строить на нём вместо прямого `fetch`.
- Навигация и BackButton централизованы в `main.js`/`ui.js`.
- Используйте утилитарные классы из `css/style.css` вместо инлайн-стилей.

### Публикация

- Сборка не требуется: контент из `docs/` может быть размещён на любом статическом хостинге
- Обновление — обычный процесс деплоя выбранного хостинга

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
- Ротация недель: `/api/rotation/current` (FastAPI), UI читает `assets/data/rotation.json`

#### Обработка ошибок

- Все ошибки обрабатываются в `api.js`
- Показываются пользователю через UI утилиты
- Логирование ошибок в консоль

### Конфигурационные файлы

#### mastery-config.json

- Расположение: `docs/assets/data/mastery-config.json`
- Фронтенд: `./assets/data/mastery-config.json`
- Backend fallback: `/root/tsushimaru_app/docs/assets/data/mastery-config.json` и относительные пути
- Используется для отображения форм заявок

#### whats-new.json

- Расположение: `docs/assets/data/whats-new.json`
- Фронтенд: `./assets/data/whats-new.json`

#### trophies.json

- Расположение: `docs/assets/data/trophies.json`
- Backend fallback: `/root/tsushimaru_app/docs/assets/data/trophies.json` и относительные пути

### Иконки

- Классы: `docs/assets/icons/classes/` (`samurai.*`, `hunter.*`, `assassin.*`, `ronin.*`)
- Режимы: `docs/assets/icons/modes/`
- Навигация: `docs/assets/icons/navigation/`
- Системные: `docs/assets/icons/system/`

## Структура JavaScript модулей

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
- **CORS**: настроен на стороне API для клиентского домена

### gyozenbot
- **Нет прямой интеграции**
- gyozenbot открывает Mini App через WebApp кнопку
- Пользователь взаимодействует с фронтендом, который обращается к API

## Домашний экран (home)

- Полностью переработан: показывается недельная ротация из `assets/data/rotation.json`
- Заголовок: `Неделя #N`
- Кнопки: "Сюжет", "Выживание \"Кошмар\"", "Соперники", "Испытания Иё"
- Иконки модификаторов берутся из `assets/icons/mod1|mod2|mods`
- Обновление недели: бэкенд трекает текущую неделю, обновление по пятницам 18:00 МСК

## Частые задачи и их решения

### Обновление конфигурационных файлов

- Все JSON-конфиги находятся в `docs/assets/data/`
- После изменения следуйте процессу публикации на выбранном статическом хостинге
- API маунтит эти файлы через `/assets/`

## Известные ограничения

1. **Нет прямого доступа к БД**: все через REST API
2. **Backend отдельно**: не в этом репозитории, в `/root/miniapp_api`
3. **Статические файлы**: только HTML, CSS, JavaScript (нет серверной логики)
4. **Ограничения статического хостинга**: нет серверных возможностей
5. **CORS**: должен быть настроен на стороне API для клиентского домена

## Структура экранов

1. **Home Screen** (`#homeScreen`) — главный экран с недельной ротацией
2. **Profile Screen** (`#profileScreen`) — профиль пользователя
3. **Builds Screen** (`#buildsScreen`) — список билдов
4. **Mastery Screen** (`#masteryScreen`) — мастерство
5. **Participants Screen** (`#participantsScreen`) — список участников
6. **Feedback Screen** (`#feedbackScreen`) — отзывы/баг-репорты
7. **Whats New Screen** (`#whatsNewScreen`) — что нового

## Важные замечания

1. **API endpoint**: настраивается в `api.js`, по умолчанию `https://api.tsushimaru.com`
2. **Авторизация**: всегда требуется `X-Telegram-Init-Data` заголовок
3. **Обработка ошибок**: все ошибки API должны обрабатываться и показываться пользователю
4. **Телефонная тема**: учитывать темную/светлую тему через Telegram WebApp SDK
5. **Responsive design**: приложение должно работать на мобильных устройствах

