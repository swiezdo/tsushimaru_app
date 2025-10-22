# Установка python-dotenv

## Проблема:
python-dotenv не установлен на Raspberry Pi.

## Решение:

### 1. Установите python-dotenv

```bash
# На Raspberry Pi
cd ~/miniapp_api

# Активируйте виртуальное окружение
source venv/bin/activate

# Установите python-dotenv
pip install python-dotenv>=1.0.0

# Или установите все зависимости из requirements.txt
pip install -r requirements.txt
```

### 2. Проверьте установку

```bash
# Проверьте что python-dotenv установлен
pip list | grep dotenv

# Должно показать что-то вроде:
# python-dotenv 1.0.0
```

### 3. Проверьте импорт в Python

```bash
# На Raspberry Pi
cd ~/miniapp_api
source venv/bin/activate
python3 -c "from dotenv import load_dotenv; print('✅ python-dotenv работает!')"
```

### 4. Перезапустите API

```bash
# Перезапустите API сервис
sudo systemctl restart miniapp_api

# Проверьте статус
sudo systemctl status miniapp_api
```

## Альтернативный способ установки:

Если pip install не работает, попробуйте:

```bash
# Обновите pip
pip install --upgrade pip

# Установите python-dotenv
pip install python-dotenv

# Или установите все зависимости
pip install -r requirements.txt
```

## Проверка работы:

После установки python-dotenv API должен запускаться без ошибок. Проверьте логи:

```bash
sudo journalctl -u miniapp_api -f
```

Должно появиться что-то вроде:
```
🚀 Запуск Tsushima Mini App API...
📁 База данных: /home/ubuntu/miniapp_api/app.db
🌐 Разрешенный origin: https://swiezdo.github.io/tsushimaru_app/
🤖 Bot token: 1234567890...
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

Если все работает, то python-dotenv установлен правильно! 🎉
