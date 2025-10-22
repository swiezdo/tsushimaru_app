#!/usr/bin/env python3
# test_db.py
# Скрипт для тестирования базы данных

import os
import sys
from db import init_db, get_user_count, get_user

def test_database():
    """Тестирует работу с базой данных"""
    
    # Путь к базе данных
    db_path = os.getenv("DB_PATH", "/home/ubuntu/miniapp_api/app.db")
    
    print(f"🔍 Тестирование базы данных: {db_path}")
    print(f"📁 Файл существует: {os.path.exists(db_path)}")
    
    if not os.path.exists(db_path):
        print("❌ База данных не найдена!")
        print("🔧 Создаем базу данных...")
        init_db(db_path)
        print("✅ База данных создана")
    else:
        print("✅ База данных найдена")
    
    # Проверяем количество пользователей
    user_count = get_user_count(db_path)
    print(f"👥 Количество пользователей в базе: {user_count}")
    
    if user_count > 0:
        print("📊 Пользователи в базе:")
        # Здесь можно добавить вывод списка пользователей
        # Но пока просто показываем количество
    
    print("✅ Тест базы данных завершен")

if __name__ == "__main__":
    test_database()
