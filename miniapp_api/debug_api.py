#!/usr/bin/env python3
# debug_api.py
# Скрипт для диагностики API и базы данных

import os
import sys
import json
import sqlite3
from dotenv import load_dotenv
from security import validate_init_data, get_user_id_from_init_data
from db import init_db, get_user, upsert_user, get_user_count

# Загружаем переменные окружения
load_dotenv()

def test_database():
    """Тестирует работу с базой данных"""
    print("🔍 Тестирование базы данных...")
    
    db_path = os.getenv("DB_PATH", "/home/ubuntu/miniapp_api/app.db")
    print(f"📁 Путь к БД: {db_path}")
    print(f"📁 Файл существует: {os.path.exists(db_path)}")
    
    if not os.path.exists(db_path):
        print("🔧 Создаем базу данных...")
        init_db(db_path)
        print("✅ База данных создана")
    
    # Проверяем количество пользователей
    user_count = get_user_count(db_path)
    print(f"👥 Количество пользователей: {user_count}")
    
    # Тестируем запись и чтение
    test_user_id = 123456789
    test_profile = {
        'psn_id': 'TestUser',
        'platforms': ['🎮 PlayStation'],
        'modes': ['📖 Сюжет'],
        'goals': ['🏆 Получение трофеев'],
        'difficulties': ['🥉 Бронза'],
        'trophies': []
    }
    
    print("📝 Тестируем запись профиля...")
    success = upsert_user(db_path, test_user_id, test_profile)
    print(f"✅ Запись профиля: {'Успешно' if success else 'Ошибка'}")
    
    print("📖 Тестируем чтение профиля...")
    retrieved_profile = get_user(db_path, test_user_id)
    print(f"✅ Чтение профиля: {'Успешно' if retrieved_profile else 'Ошибка'}")
    
    if retrieved_profile:
        print(f"📊 Данные профиля:")
        print(f"   PSN: {retrieved_profile.get('psn_id')}")
        print(f"   Platforms: {retrieved_profile.get('platforms')}")
        print(f"   Modes: {retrieved_profile.get('modes')}")
    
    # Проверяем количество пользователей после записи
    user_count_after = get_user_count(db_path)
    print(f"👥 Количество пользователей после записи: {user_count_after}")
    
    return success and retrieved_profile is not None

def test_security():
    """Тестирует модуль безопасности"""
    print("\n🔐 Тестирование модуля безопасности...")
    
    bot_token = os.getenv("BOT_TOKEN")
    if not bot_token:
        print("❌ BOT_TOKEN не найден в .env")
        return False
    
    print(f"🤖 Bot token: {bot_token[:10]}...")
    
    # Создаем тестовый initData (это не будет валидным, но проверим что функция работает)
    test_init_data = "query_id=test&user=%7B%22id%22%3A123456789%7D&auth_date=1697123456&hash=test"
    
    print("🔍 Тестируем валидацию initData...")
    result = validate_init_data(test_init_data, bot_token)
    print(f"✅ Валидация initData: {'Успешно' if result else 'Ошибка (ожидаемо для тестовых данных)'}")
    
    return True

def test_env():
    """Тестирует переменные окружения"""
    print("\n🌍 Тестирование переменных окружения...")
    
    bot_token = os.getenv("BOT_TOKEN")
    allowed_origin = os.getenv("ALLOWED_ORIGIN")
    db_path = os.getenv("DB_PATH")
    api_base = os.getenv("API_BASE")
    
    print(f"🤖 BOT_TOKEN: {'✅ Установлен' if bot_token else '❌ Не установлен'}")
    print(f"🌐 ALLOWED_ORIGIN: {allowed_origin if allowed_origin else '❌ Не установлен'}")
    print(f"📁 DB_PATH: {db_path if db_path else '❌ Не установлен'}")
    print(f"🔗 API_BASE: {api_base if api_base else '❌ Не установлен'}")
    
    return all([bot_token, allowed_origin, db_path, api_base])

def test_database_directly():
    """Тестирует базу данных напрямую через SQLite"""
    print("\n🗄️ Прямое тестирование базы данных...")
    
    db_path = os.getenv("DB_PATH", "/home/ubuntu/miniapp_api/app.db")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Проверяем таблицы
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"📋 Таблицы в БД: {[table[0] for table in tables]}")
        
        # Проверяем структуру таблицы users
        cursor.execute("PRAGMA table_info(users);")
        columns = cursor.fetchall()
        print(f"📊 Структура таблицы users:")
        for col in columns:
            print(f"   {col[1]} ({col[2]})")
        
        # Проверяем данные
        cursor.execute("SELECT COUNT(*) FROM users;")
        count = cursor.fetchone()[0]
        print(f"👥 Количество записей в users: {count}")
        
        if count > 0:
            cursor.execute("SELECT user_id, psn_id, platforms, modes FROM users LIMIT 5;")
            rows = cursor.fetchall()
            print(f"📊 Примеры данных:")
            for row in rows:
                print(f"   User ID: {row[0]}, PSN: {row[1]}, Platforms: {row[2]}, Modes: {row[3]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании БД: {e}")
        return False

def main():
    """Основная функция диагностики"""
    print("🚀 Диагностика Tsushima Mini App API")
    print("=" * 50)
    
    # Тестируем переменные окружения
    env_ok = test_env()
    
    # Тестируем модуль безопасности
    security_ok = test_security()
    
    # Тестируем базу данных
    db_ok = test_database()
    
    # Тестируем базу данных напрямую
    db_direct_ok = test_database_directly()
    
    print("\n" + "=" * 50)
    print("📊 Результаты диагностики:")
    print(f"🌍 Переменные окружения: {'✅ OK' if env_ok else '❌ Ошибка'}")
    print(f"🔐 Модуль безопасности: {'✅ OK' if security_ok else '❌ Ошибка'}")
    print(f"🗄️ База данных (через модуль): {'✅ OK' if db_ok else '❌ Ошибка'}")
    print(f"🗄️ База данных (напрямую): {'✅ OK' if db_direct_ok else '❌ Ошибка'}")
    
    if all([env_ok, security_ok, db_ok, db_direct_ok]):
        print("\n🎉 Все тесты пройдены! API должен работать корректно.")
    else:
        print("\n⚠️ Есть проблемы, которые нужно исправить.")

if __name__ == "__main__":
    main()
