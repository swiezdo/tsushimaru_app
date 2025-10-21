# db.py
# Модуль для работы с SQLite базой данных

import sqlite3
import json
import time
import os
from typing import Dict, Optional, Any


def init_db(db_path: str) -> None:
    """
    Инициализирует базу данных и создает необходимые таблицы.
    
    Args:
        db_path: Путь к файлу базы данных SQLite
    """
    # Создаем директорию если её нет
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Создаем таблицу users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            psn_id TEXT,
            platforms TEXT,
            modes TEXT,
            goals TEXT,
            difficulties TEXT,
            trophies TEXT,
            updated_at INTEGER
        )
    ''')
    
    # Создаем индекс для быстрого поиска
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id)
    ''')
    
    conn.commit()
    conn.close()


def get_user(db_path: str, user_id: int) -> Optional[Dict[str, Any]]:
    """
    Получает профиль пользователя по user_id.
    
    Args:
        db_path: Путь к файлу базы данных
        user_id: ID пользователя Telegram
    
    Returns:
        Словарь с данными профиля или None если пользователь не найден
    """
    if not os.path.exists(db_path):
        return None
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT user_id, psn_id, platforms, modes, goals, difficulties, trophies, updated_at
        FROM users WHERE user_id = ?
    ''', (user_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    # Преобразуем в словарь
    profile = {
        'user_id': row[0],
        'psn_id': row[1],
        'platforms': json.loads(row[2]) if row[2] else [],
        'modes': json.loads(row[3]) if row[3] else [],
        'goals': json.loads(row[4]) if row[4] else [],
        'difficulties': json.loads(row[5]) if row[5] else [],
        'trophies': json.loads(row[6]) if row[6] else [],
        'updated_at': row[7]
    }
    
    return profile


def upsert_user(db_path: str, user_id: int, profile_data: Dict[str, Any]) -> bool:
    """
    Сохраняет или обновляет профиль пользователя.
    
    Args:
        db_path: Путь к файлу базы данных
        user_id: ID пользователя Telegram
        profile_data: Словарь с данными профиля
    
    Returns:
        True при успешном сохранении, иначе False
    """
    try:
        # Инициализируем БД если её нет
        if not os.path.exists(db_path):
            init_db(db_path)
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Подготавливаем данные для сохранения
        current_time = int(time.time())
        
        # Преобразуем списки в JSON строки
        platforms_json = json.dumps(profile_data.get('platforms', []))
        modes_json = json.dumps(profile_data.get('modes', []))
        goals_json = json.dumps(profile_data.get('goals', []))
        difficulties_json = json.dumps(profile_data.get('difficulties', []))
        trophies_json = json.dumps(profile_data.get('trophies', []))
        
        # Выполняем INSERT OR REPLACE
        cursor.execute('''
            INSERT OR REPLACE INTO users 
            (user_id, psn_id, platforms, modes, goals, difficulties, trophies, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            profile_data.get('psn_id', ''),
            platforms_json,
            modes_json,
            goals_json,
            difficulties_json,
            trophies_json,
            current_time
        ))
        
        conn.commit()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"Ошибка при сохранении профиля: {e}")
        return False


def delete_user(db_path: str, user_id: int) -> bool:
    """
    Удаляет профиль пользователя.
    
    Args:
        db_path: Путь к файлу базы данных
        user_id: ID пользователя Telegram
    
    Returns:
        True при успешном удалении, иначе False
    """
    try:
        if not os.path.exists(db_path):
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM users WHERE user_id = ?', (user_id,))
        
        conn.commit()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"Ошибка при удалении профиля: {e}")
        return False


def get_user_count(db_path: str) -> int:
    """
    Возвращает количество пользователей в базе данных.
    
    Args:
        db_path: Путь к файлу базы данных
    
    Returns:
        Количество пользователей
    """
    try:
        if not os.path.exists(db_path):
            return 0
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM users')
        count = cursor.fetchone()[0]
        
        conn.close()
        
        return count
        
    except Exception:
        return 0


# Тестирование (запускать только если файл запущен напрямую)
if __name__ == "__main__":
    # Тестирование модуля
    test_db_path = "/tmp/test_app.db"
    
    print("Тестирование модуля db.py...")
    
    # Инициализация БД
    init_db(test_db_path)
    print("✅ База данных инициализирована")
    
    # Тестовые данные
    test_user_id = 123456789
    test_profile = {
        'psn_id': 'TestPSN',
        'platforms': ['🎮 PlayStation', '💻 ПК'],
        'modes': ['📖 Сюжет', '🏹 Выживание'],
        'goals': ['🏆 Получение трофеев'],
        'difficulties': ['🥉 Бронза', '🥈 Серебро'],
        'trophies': []
    }
    
    # Сохранение профиля
    success = upsert_user(test_db_path, test_user_id, test_profile)
    print(f"✅ Профиль сохранен: {success}")
    
    # Получение профиля
    retrieved_profile = get_user(test_db_path, test_user_id)
    print(f"✅ Профиль получен: {retrieved_profile is not None}")
    
    if retrieved_profile:
        print(f"Данные: PSN={retrieved_profile['psn_id']}, Platforms={retrieved_profile['platforms']}")
    
    # Количество пользователей
    user_count = get_user_count(test_db_path)
    print(f"✅ Количество пользователей: {user_count}")
    
    # Очистка тестовой БД
    os.remove(test_db_path)
    print("✅ Тестовая база данных удалена")
