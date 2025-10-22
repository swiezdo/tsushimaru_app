# Обновление схемы базы данных

## Проблема:
Поле `real_name` не сохраняется в базе данных.

## Решение:

### 1. Обновите файлы на Raspberry Pi

Скопируйте обновленные файлы:
- `app.py` - добавлено сохранение `real_name`
- `db.py` - обновлена схема БД и функции чтения/записи

### 2. Пересоздайте базу данных

```bash
# На Raspberry Pi
cd ~/miniapp_api

# Удалите старую базу данных
rm ~/miniapp_api/app.db

# Перезапустите API для создания новой БД
sudo systemctl restart miniapp_api
```

### 3. Проверьте новую схему БД

```bash
# На Raspberry Pi
sqlite3 ~/miniapp_api/app.db
.schema users
.quit
```

**Новая схема должна быть:**
```sql
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    real_name TEXT,           -- ← НОВОЕ ПОЛЕ
    psn_id TEXT,
    platforms TEXT,
    modes TEXT,
    goals TEXT,
    difficulties TEXT,
    trophies TEXT,
    updated_at INTEGER
);
```

### 4. Протестируйте сохранение профиля

```bash
# На Raspberry Pi
python3 test_profile_save.py
```

**Теперь должно сохраняться:**
```
User ID: 123456789
Real Name: Василий          -- ← ТЕПЕРЬ СОХРАНЯЕТСЯ!
PSN ID: TestPSN
Platforms: ['🎮 PlayStation', '💻 ПК']
Modes: ['📖 Сюжет', '🏹 Выживание']
Goals: ['🏆 Получение трофеев']
Difficulties: ['🥉 Бронза', '🥈 Серебро']
```

### 5. Проверьте базу данных

```bash
# На Raspberry Pi
sqlite3 ~/miniapp_api/app.db
SELECT * FROM users;
.quit
```

**Должно показать:**
```
user_id | real_name | psn_id  | platforms                    | modes                    | goals                    | difficulties
123456789| Василий   | TestPSN | ["🎮 PlayStation","💻 ПК"] | ["📖 Сюжет","🏹 Выживание"] | ["🏆 Получение трофеев"] | ["🥉 Бронза","🥈 Серебро"]
```

## Что изменилось:

1. ✅ **Схема БД** - добавлено поле `real_name`
2. ✅ **API сохранения** - теперь сохраняет `real_name`
3. ✅ **API чтения** - теперь возвращает `real_name`
4. ✅ **Функции БД** - обновлены для работы с новым полем

## После обновления:

- ✅ Имя будет сохраняться в БД
- ✅ Имя будет загружаться из БД
- ✅ Профиль будет работать полностью

**Обновите файлы и пересоздайте БД - имя теперь будет сохраняться!** 🎯
