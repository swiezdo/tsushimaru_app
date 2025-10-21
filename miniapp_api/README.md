# Tsushima Mini App API

Backend API для Telegram Mini App Tsushima.Ru на FastAPI + SQLite.

## Установка и настройка

### 1. Установка зависимостей

```bash
# Создайте виртуальное окружение
python3 -m venv venv
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt
```

### 2. Настройка .env файла

```bash
# Скопируйте .env.example в .env
cp .env.example .env

# Отредактируйте .env с реальными значениями
nano .env
```

**Обязательные параметры:**
- `BOT_TOKEN` - токен вашего Telegram-бота
- `ALLOWED_ORIGIN` - URL вашего GitHub Pages
- `DB_PATH` - путь к файлу базы данных
- `API_BASE` - URL вашего Cloudflare Tunnel

### 3. Запуск локально

```bash
# Активируйте виртуальное окружение
source venv/bin/activate

# Запустите сервер
python3 app.py
```

Сервер будет доступен по адресу: `http://127.0.0.1:8000`

### 4. Тестирование API

```bash
# Проверка работоспособности
curl http://127.0.0.1:8000/health

# Проверка статистики
curl http://127.0.0.1:8000/api/stats
```

## API Эндпоинты

### GET /health
Проверка работоспособности API.

**Ответ:**
```json
{
  "status": "ok",
  "message": "Tsushima Mini App API работает"
}
```

### GET /api/profile.get
Получение профиля пользователя.

**Заголовки:**
- `X-Telegram-Init-Data` - данные авторизации Telegram

**Ответ:**
```json
{
  "real_name": "Василий",
  "psn": "TestPSN",
  "platforms": ["🎮 PlayStation", "💻 ПК"],
  "modes": ["📖 Сюжет", "🏹 Выживание"],
  "goals": ["🏆 Получение трофеев"],
  "difficulties": ["🥉 Бронза", "🥈 Серебро"],
  "trophies": []
}
```

### POST /api/profile.save
Сохранение профиля пользователя.

**Заголовки:**
- `X-Telegram-Init-Data` - данные авторизации Telegram

**Форма:**
- `real_name` - реальное имя (обязательно)
- `psn` - PSN никнейм (обязательно, 3-16 символов)
- `platforms[]` - список платформ
- `modes[]` - список режимов
- `goals[]` - список целей
- `difficulties[]` - список сложностей

**Ответ:**
```json
{
  "status": "ok",
  "message": "Профиль успешно сохранен"
}
```

### GET /api/stats
Статистика API.

**Ответ:**
```json
{
  "total_users": 42,
  "api_version": "1.0.0"
}
```

## Systemd сервис

### Создание сервиса

```bash
sudo nano /etc/systemd/system/miniapp_api.service
```

**Содержимое:**
```ini
[Unit]
Description=Tsushima Mini App API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/miniapp_api
ExecStart=/home/ubuntu/miniapp_api/venv/bin/python /home/ubuntu/miniapp_api/app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Управление сервисом

```bash
# Перезагрузить systemd
sudo systemctl daemon-reload

# Включить автозапуск
sudo systemctl enable miniapp_api

# Запустить сервис
sudo systemctl start miniapp_api

# Проверить статус
sudo systemctl status miniapp_api

# Посмотреть логи
sudo journalctl -u miniapp_api -f
```

## Cloudflare Tunnel

### Настройка туннеля

```bash
# Создайте systemd сервис для туннеля
sudo nano /etc/systemd/system/cloudflared-tunnel.service
```

**Содержимое:**
```ini
[Unit]
Description=Cloudflare Tunnel for Mini App API
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/usr/bin/cloudflared tunnel --url http://127.0.0.1:8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Управление туннелем

```bash
# Включить автозапуск
sudo systemctl enable cloudflared-tunnel

# Запустить туннель
sudo systemctl start cloudflared-tunnel

# Проверить статус
sudo systemctl status cloudflared-tunnel
```

## Структура проекта

```
miniapp_api/
├── app.py              # FastAPI приложение
├── db.py               # Модуль работы с базой данных
├── security.py         # Модуль валидации Telegram initData
├── requirements.txt    # Зависимости Python
├── .env.example       # Пример конфигурации
├── .env               # Конфигурация (создать вручную)
├── README.md          # Документация
└── app.db             # База данных SQLite (создается автоматически)
```

## Безопасность

- Все API эндпоинты (кроме `/health` и `/api/stats`) требуют валидный `X-Telegram-Init-Data`
- Валидация подписи HMAC-SHA256 по алгоритму Telegram
- CORS настроен только для разрешенного origin
- Валидация входных данных (PSN формат, обязательные поля)

## Логи и отладка

```bash
# Логи приложения
sudo journalctl -u miniapp_api -f

# Логи туннеля
sudo journalctl -u cloudflared-tunnel -f

# Тестирование модулей
python3 security.py
python3 db.py
```
