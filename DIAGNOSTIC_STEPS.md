# Диагностика проблем

## Что изменилось на фронтенде:

✅ **Исправлено:** API больше не пытается загрузить профиль при запуске приложения  
✅ **Добавлено:** Загрузка профиля с сервера только при открытии экрана "Профиль"  
✅ **Обновлено:** URL туннеля в js/api.js  

## Шаги для диагностики:

### 1. Проверьте базу данных на Raspberry Pi

```bash
# На Raspberry Pi
cd ~/miniapp_api

# Запустите тест базы данных
python3 test_db.py
```

**Ожидаемый результат:**
```
🔍 Тестирование базы данных: /home/ubuntu/miniapp_api/app.db
📁 Файл существует: True
✅ База данных найдена
👥 Количество пользователей в базе: 0
✅ Тест базы данных завершен
```

### 2. Проверьте .env файл

```bash
# На Raspberry Pi
cat ~/miniapp_api/.env
```

**Убедитесь что:**
- `BOT_TOKEN` - реальный токен вашего бота
- `ALLOWED_ORIGIN` - правильный URL вашего GitHub Pages
- `DB_PATH` - правильный путь к базе данных

### 3. Проверьте API локально

```bash
# На Raspberry Pi
cd ~/miniapp_api
source venv/bin/activate
python3 app.py
```

**Ожидаемый результат:**
```
🚀 Запуск Tsushima Mini App API...
📁 База данных: /home/ubuntu/miniapp_api/app.db
🌐 Разрешенный origin: https://вашusername.github.io
🤖 Bot token: 1234567890...
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### 4. Проверьте туннель

```bash
# В другом терминале на Raspberry Pi
cloudflared tunnel --url http://127.0.0.1:8000
```

**Убедитесь что URL туннеля совпадает с тем, что указано в js/api.js**

### 5. Проверьте API через туннель

```bash
# Проверка health endpoint
curl https://nikon-easy-garbage-responded.trycloudflare.com/health

# Ожидаемый ответ:
{"status": "ok", "message": "Tsushima Mini App API работает"}
```

### 6. Проверьте логи API

```bash
# На Raspberry Pi
sudo journalctl -u miniapp_api -f
```

### 7. Проверьте логи в браузере

1. Откройте Mini App в Telegram
2. Нажмите F12 (или откройте Developer Tools)
3. Перейдите во вкладку Console
4. Посмотрите на ошибки

## Возможные проблемы и решения:

### Проблема: "Не удалось загрузить профиль" при запуске
**Решение:** ✅ Исправлено - теперь профиль загружается только при открытии экрана профиля

### Проблема: "Не удалось сохранить профиль"
**Возможные причины:**
1. **CORS ошибка** - проверьте ALLOWED_ORIGIN в .env
2. **401 Unauthorized** - проверьте BOT_TOKEN
3. **Туннель не работает** - проверьте cloudflared
4. **API не запущен** - проверьте systemd сервис

### Проблема: База данных не создается
**Решение:**
```bash
# На Raspberry Pi
cd ~/miniapp_api
python3 test_db.py
```

## Systemd сервисы:

### Перезапуск API сервиса:
```bash
sudo systemctl restart miniapp_api
sudo systemctl status miniapp_api
```

### Перезапуск туннеля:
```bash
sudo systemctl restart cloudflared-tunnel
sudo systemctl status cloudflared-tunnel
```

## Логи для отладки:

```bash
# Логи API
sudo journalctl -u miniapp_api -f

# Логи туннеля
sudo journalctl -u cloudflared-tunnel -f

# Логи в браузере (F12 → Console)
```

## Что проверить в первую очередь:

1. ✅ **База данных создана** - запустите `python3 test_db.py`
2. ✅ **API запущен** - проверьте `sudo systemctl status miniapp_api`
3. ✅ **Туннель работает** - проверьте `curl https://nikon-easy-garbage-responded.trycloudflare.com/health`
4. ✅ **CORS настроен** - проверьте ALLOWED_ORIGIN в .env
5. ✅ **BOT_TOKEN правильный** - проверьте токен в .env

После выполнения этих шагов Mini App должен работать корректно!
