# Исправление CORS OPTIONS запросов

## Проблема:
```
INFO: "OPTIONS /api/profile.get HTTP/1.1" 400 Bad Request
INFO: "OPTIONS /api/profile.save HTTP/1.1" 400 Bad Request
```

## Решение:

### 1. Обновите app.py на Raspberry Pi

Скопируйте обновленный `app.py` с исправленными OPTIONS эндпоинтами.

### 2. Перезапустите API сервис

```bash
# На Raspberry Pi
sudo systemctl restart miniapp_api
sudo systemctl status miniapp_api
```

### 3. Проверьте логи

```bash
# На Raspberry Pi
sudo journalctl -u miniapp_api -f
```

### 4. Попробуйте сохранить профиль

1. Откройте Mini App в Telegram
2. Перейдите в "Профиль"
3. Заполните форму
4. Нажмите "Сохранить"

### 5. Посмотрите логи

Теперь в логах должно появиться:
```
🔍 OPTIONS /api/profile.get - ALLOWED_ORIGIN: https://swiezdo.github.io/tsushimaru_app/
🔍 OPTIONS /api/profile.save - ALLOWED_ORIGIN: https://swiezdo.github.io/tsushimaru_app/
```

И вместо 400 Bad Request должно быть 200 OK.

## Что изменилось:

1. ✅ **OPTIONS эндпоинты** - теперь возвращают правильные CORS заголовки
2. ✅ **Логирование** - добавлено логирование для отладки
3. ✅ **CORS заголовки** - явно указаны все необходимые заголовки

## Проверка:

После обновления OPTIONS запросы должны возвращать 200 OK вместо 400 Bad Request.

## Альтернативное решение:

Если проблема все еще есть, попробуйте добавить глобальный OPTIONS обработчик:

```python
@app.options("/{path:path}")
async def options_handler(path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )
```

Но сначала попробуйте текущее решение! 🚀
