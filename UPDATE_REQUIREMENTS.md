# Обновление зависимостей бэкенда

## Обновленный requirements.txt

Файл `requirements.txt` обновлен с дополнительными зависимостями:

```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
python-dotenv>=1.0.0
python-multipart>=0.0.6

# Дополнительные зависимости для диагностики и разработки
requests>=2.31.0
httpx>=0.25.0
```

## Установка обновленных зависимостей:

### На Raspberry Pi:

```bash
# Перейдите в директорию проекта
cd ~/miniapp_api

# Активируйте виртуальное окружение
source venv/bin/activate

# Обновите зависимости
pip install -r requirements.txt

# Проверьте установленные пакеты
pip list
```

## Что добавлено:

- **requests** - для HTTP запросов (если понадобится для тестирования)
- **httpx** - современная альтернатива requests с поддержкой async/await

## Проверка установки:

```bash
# Проверьте что все пакеты установлены
pip list | grep -E "(fastapi|uvicorn|python-dotenv|python-multipart|requests|httpx)"
```

## После обновления:

1. ✅ **Перезапустите API сервис:**
   ```bash
   sudo systemctl restart miniapp_api
   ```

2. ✅ **Проверьте статус:**
   ```bash
   sudo systemctl status miniapp_api
   ```

3. ✅ **Запустите диагностику:**
   ```bash
   python3 debug_api.py
   ```

Теперь у вас есть все необходимые зависимости для работы API и диагностики! 🚀
