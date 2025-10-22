#!/usr/bin/env python3
# test_profile_save.py
# Тестирование сохранения профиля с реальными данными

import os
import sys
from dotenv import load_dotenv
from db import init_db, upsert_user, get_user, get_user_count

# Загружаем переменные окружения
load_dotenv()

def test_profile_save():
    """Тестирует сохранение профиля с реальными данными"""
    
    db_path = os.getenv("DB_PATH", "/home/ubuntu/miniapp_api/app.db")
    print(f"🔍 Тестирование сохранения профиля в: {db_path}")
    
    # Тестовые данные профиля (как они приходят от фронтенда)
    test_user_id = 123456789
    test_profile = {
        'psn_id': 'TestPSN',  # Это должно быть psn_id, а не real_name
        'platforms': ['🎮 PlayStation', '💻 ПК'],
        'modes': ['📖 Сюжет', '🏹 Выживание'],
        'goals': ['🏆 Получение трофеев', '🔎 Узнать что-то новое'],
        'difficulties': ['🥉 Бронза', '🥈 Серебро'],
        'trophies': []
    }
    
    print(f"📝 Тестовые данные профиля:")
    print(f"   User ID: {test_user_id}")
    print(f"   PSN ID: {test_profile['psn_id']}")
    print(f"   Platforms: {test_profile['platforms']}")
    print(f"   Modes: {test_profile['modes']}")
    print(f"   Goals: {test_profile['goals']}")
    print(f"   Difficulties: {test_profile['difficulties']}")
    
    # Сохраняем профиль
    print(f"\n💾 Сохраняем профиль...")
    success = upsert_user(db_path, test_user_id, test_profile)
    print(f"✅ Результат сохранения: {'Успешно' if success else 'Ошибка'}")
    
    if success:
        # Читаем профиль обратно
        print(f"\n📖 Читаем профиль обратно...")
        retrieved_profile = get_user(db_path, test_user_id)
        
        if retrieved_profile:
            print(f"✅ Профиль успешно прочитан:")
            print(f"   User ID: {retrieved_profile['user_id']}")
            print(f"   PSN ID: {retrieved_profile['psn_id']}")
            print(f"   Platforms: {retrieved_profile['platforms']}")
            print(f"   Modes: {retrieved_profile['modes']}")
            print(f"   Goals: {retrieved_profile['goals']}")
            print(f"   Difficulties: {retrieved_profile['difficulties']}")
            print(f"   Trophies: {retrieved_profile['trophies']}")
            print(f"   Updated at: {retrieved_profile['updated_at']}")
        else:
            print(f"❌ Не удалось прочитать профиль")
    
    # Проверяем количество пользователей
    user_count = get_user_count(db_path)
    print(f"\n👥 Количество пользователей в БД: {user_count}")
    
    return success and retrieved_profile is not None

def test_api_data_format():
    """Тестирует формат данных, который приходит от API"""
    
    print(f"\n🔍 Тестирование формата данных API...")
    
    # Данные как они приходят от фронтенда в API
    api_data = {
        'real_name': 'Василий',
        'psn': 'TestPSN',
        'platforms': ['🎮 PlayStation', '💻 ПК'],
        'modes': ['📖 Сюжет', '🏹 Выживание'],
        'goals': ['🏆 Получение трофеев'],
        'difficulties': ['🥉 Бронза', '🥈 Серебро']
    }
    
    print(f"📝 Данные от фронтенда:")
    print(f"   real_name: {api_data['real_name']}")
    print(f"   psn: {api_data['psn']}")
    print(f"   platforms: {api_data['platforms']}")
    print(f"   modes: {api_data['modes']}")
    print(f"   goals: {api_data['goals']}")
    print(f"   difficulties: {api_data['difficulties']}")
    
    # Преобразуем в формат для БД
    db_data = {
        'psn_id': api_data['psn'],  # psn -> psn_id
        'platforms': api_data['platforms'],
        'modes': api_data['modes'],
        'goals': api_data['goals'],
        'difficulties': api_data['difficulties'],
        'trophies': []
    }
    
    print(f"\n📝 Данные для БД:")
    print(f"   psn_id: {db_data['psn_id']}")
    print(f"   platforms: {db_data['platforms']}")
    print(f"   modes: {db_data['modes']}")
    print(f"   goals: {db_data['goals']}")
    print(f"   difficulties: {db_data['difficulties']}")
    print(f"   trophies: {db_data['trophies']}")

def main():
    """Основная функция тестирования"""
    print("🚀 Тестирование сохранения профиля")
    print("=" * 50)
    
    # Тестируем формат данных
    test_api_data_format()
    
    # Тестируем сохранение
    success = test_profile_save()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Тест сохранения профиля прошел успешно!")
    else:
        print("❌ Тест сохранения профиля не прошел!")

if __name__ == "__main__":
    main()
