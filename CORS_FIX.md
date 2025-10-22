# Исправление CORS ошибок

## Проблема:
```
INFO: "OPTIONS /api/profile.get HTTP/1.1" 400 Bad Request
INFO: "OPTIONS /api/profile.save HTTP/1.1" 400 Bad Request
```

Это означает, что CORS preflight запросы не проходят.

## Решение:

### 1. Обновите app.py на Raspberry Pi

```bash
# На Raspberry Pi
cd ~/miniapp_api
nano app.py
```

**Найдите секцию CORS и замените на:**
```python
# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

**Добавьте поверх эндпоинтов (после @app.get("/health")):**
```python
@app.options("/api/profile.get")
async def options_profile_get():
    """
    OPTIONS эндпоинт для CORS preflight запросов.
    """
    return {"status": "ok"}


@app.options("/api/profile.save")
async def options_profile_save():
    """
    OPTIONS эндпоинт для CORS preflight запросов.
    """
    return {"status": "ok"}
```

### 2. Убедитесь что .env правильный

```bash
# На Raspberry Pi
cat ~/miniapp_api/.env
```

**Должно быть:**
```env
BOT_TOKEN=ваш_реальный_токен_бота
ALLOWED_ORIGIN=https://swiezdo.github.io/tsushimaru_app/
DB_PATH=/home/ubuntu/miniapp_api/app.db
API_BASE=https://refers-asin-babies-benefits.trycloudflare.com
```

### 3. Перезапустите API сервис

```bash
# На Raspberry Pi
sudo systemctl restart miniapp_api
sudo systemctl status miniapp_api
```

### 4. Проверьте логи

```bash
# На Raspberry Pi
sudo journalctl -u miniapp_api -f
```

**Ожидаемый результат:** Больше не должно быть 400 ошибок на OPTIONS запросах.

### 5. Протестируйте API

```bash
# Проверка health endpoint
curl https://refers-asin-babies-benefits.trycloudflare.com/health

# Ожидаемый ответ:
{"status": "ok", "message": "Tsushima Mini App API работает"}
```

## Что изменилось:

1. ✅ **CORS методы** - явно указаны разрешенные HTTP методы
2. ✅ **OPTIONS эндпоинты** - добавлены явные обработчики для preflight запросов
3. ✅ **ALLOWED_ORIGIN** - обновлен на правильный URL GitHub Pages

## После исправления:

- ✅ OPTIONS запросы будут проходить успешно
- ✅ CORS preflight проверки будут работать
- ✅ API запросы из фронтенда будут проходить
- ✅ Профиль будет загружаться и сохраняться

Попробуйте теперь открыть Mini App - CORS ошибки должны исчезнуть! 🚀
