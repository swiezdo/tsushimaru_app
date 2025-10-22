# Диагностика проблемы с сохранением профиля

## Проблема:
При нажатии кнопки "Сохранить" в профиле выводится ошибка "Не удалось сохранить профиль".

## Шаги диагностики:

### 1. Запустите диагностический скрипт

```bash
# На Raspberry Pi
cd ~/miniapp_api
python3 debug_api.py
```

**Этот скрипт проверит:**
- ✅ Переменные окружения
- ✅ Модуль безопасности
- ✅ Базу данных (запись и чтение)
- ✅ Структуру таблиц

### 2. Обновите app.py с логированием

Скопируйте обновленный `app.py` на Raspberry Pi (с добавленным логированием).

### 3. Перезапустите API сервис

```bash
# На Raspberry Pi
sudo systemctl restart miniapp_api
```

### 4. Проверьте логи в реальном времени

```bash
# На Raspberry Pi
sudo journalctl -u miniapp_api -f
```

### 5. Попробуйте сохранить профиль

1. Откройте Mini App в Telegram
2. Перейдите в "Профиль"
3. Заполните форму
4. Нажмите "Сохранить"

### 6. Посмотрите логи

В логах должно появиться что-то вроде:
```
🔍 Сохранение профиля для user_id: 123456789
📝 Данные: real_name=Test, psn=TestPSN
📝 platforms=['🎮 PlayStation'], modes=['📖 Сюжет'], goals=['🏆 Получение трофеев'], difficulties=['🥉 Бронза']
💾 Сохраняем профиль в БД: {'psn_id': 'TestPSN', 'platforms': ['🎮 PlayStation'], ...}
✅ Результат сохранения: True
🎉 Профиль успешно сохранен
```

## Возможные проблемы:

### Проблема 1: Ошибка валидации initData
**Симптомы:** 401 Unauthorized в логах
**Решение:** Проверьте BOT_TOKEN в .env

### Проблема 2: Ошибка CORS
**Симптомы:** 400 Bad Request на OPTIONS запросах
**Решение:** Убедитесь что ALLOWED_ORIGIN правильный

### Проблема 3: Ошибка базы данных
**Симптомы:** 500 Internal Server Error в логах
**Решение:** Запустите debug_api.py для диагностики БД

### Проблема 4: Неправильные данные от фронтенда
**Симптомы:** Данные в логах выглядят неправильно
**Решение:** Проверьте как фронтенд отправляет данные

## Проверка базы данных:

```bash
# На Raspberry Pi
sqlite3 ~/miniapp_api/app.db

# SQL команды:
.tables
.schema users
SELECT * FROM users;
.quit
```

## Проверка API напрямую:

```bash
# Тест health endpoint
curl https://refers-asuz-babies-benefits.trycloudflare.com/health

# Тест stats endpoint
curl https://refers-asuz-babies-benefits.trycloudflare.com/api/stats
```

## Что проверить:

1. ✅ **База данных создана** - запустите `python3 debug_api.py`
2. ✅ **API запущен** - проверьте `sudo systemctl status miniapp_api`
3. ✅ **Логи показывают данные** - смотрите `sudo journalctl -u miniapp_api -f`
4. ✅ **Нет ошибок в логах** - ищите ошибки в выводе логов

После выполнения этих шагов мы сможем точно определить, где проблема!
