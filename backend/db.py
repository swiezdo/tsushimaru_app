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
            real_name TEXT,
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
        SELECT user_id, real_name, psn_id, platforms, modes, goals, difficulties, trophies, updated_at
        FROM users WHERE user_id = ?
    ''', (user_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    # Преобразуем в словарь
    profile = {
        'user_id': row[0],
        'real_name': row[1],
        'psn_id': row[2],
        'platforms': json.loads(row[3]) if row[3] else [],
        'modes': json.loads(row[4]) if row[4] else [],
        'goals': json.loads(row[5]) if row[5] else [],
        'difficulties': json.loads(row[6]) if row[6] else [],
        'trophies': json.loads(row[7]) if row[7] else [],
        'updated_at': row[8]
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
            (user_id, real_name, psn_id, platforms, modes, goals, difficulties, trophies, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            profile_data.get('real_name', ''),
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


