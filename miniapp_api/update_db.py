#!/usr/bin/env python3
"""
Скрипт для обновления схемы базы данных.
Добавляет колонку real_name в таблицу users.
"""

import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()
DB_PATH = os.getenv("DB_PATH", "/home/ubuntu/miniapp_api/app.db")

def update_database():
    """
    Обновляет схему базы данных, добавляя колонку real_name.
    """
    if not os.path.exists(DB_PATH):
        print(f"❌ База данных не найдена: {DB_PATH}")
        return False
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Проверяем, есть ли уже колонка real_name
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'real_name' in columns:
            print("✅ Колонка real_name уже существует")
            return True
        
        print("🔧 Добавляем колонку real_name...")
        
        # Добавляем колонку real_name
        cursor.execute('''
            ALTER TABLE users ADD COLUMN real_name TEXT
        ''')
        
        # Обновляем существующие записи (устанавливаем пустую строку)
        cursor.execute('''
            UPDATE users SET real_name = '' WHERE real_name IS NULL
        ''')
        
        conn.commit()
        conn.close()
        
        print("✅ База данных успешно обновлена!")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при обновлении БД: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Обновление базы данных...")
    print(f"📁 Путь к БД: {DB_PATH}")
    
    if update_database():
        print("🎉 Готово! Теперь можно тестировать API.")
    else:
        print("💥 Ошибка! Проверьте логи выше.")
