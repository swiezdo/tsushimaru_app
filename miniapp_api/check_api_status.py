#!/usr/bin/env python3
# check_api_status.py
# Проверка статуса API

import os
import sys
import subprocess
import requests
import time

def check_api_status():
    """Проверяет статус API"""
    
    print("🔍 Проверка статуса API...")
    
    # Проверяем systemd сервис
    try:
        print("1. Проверяем systemd сервис...")
        result = subprocess.run(['systemctl', 'is-active', 'miniapp_api'], 
                              capture_output=True, text=True)
        print(f"   Сервис статус: {result.stdout.strip()}")
        
        if result.stdout.strip() != 'active':
            print("   ❌ Сервис не активен!")
            return False
    except Exception as e:
        print(f"   Ошибка проверки сервиса: {e}")
        return False
    
    # Проверяем локальный API
    try:
        print("\n2. Проверяем локальный API...")
        response = requests.get("http://127.0.0.1:8000/health", timeout=5)
        print(f"   Локальный статус: {response.status_code}")
        print(f"   Локальный ответ: {response.text}")
        
        if response.status_code != 200:
            print("   ❌ Локальный API не отвечает!")
            return False
    except Exception as e:
        print(f"   Ошибка локального API: {e}")
        return False
    
    # Проверяем Tunnel
    try:
        print("\n3. Проверяем Tunnel...")
        response = requests.get("https://refers-asin-babies-benefits.trycloudflare.com/health", timeout=10)
        print(f"   Tunnel статус: {response.status_code}")
        print(f"   Tunnel ответ: {response.text}")
        
        if response.status_code != 200:
            print("   ❌ Tunnel не отвечает!")
            return False
    except Exception as e:
        print(f"   Ошибка Tunnel: {e}")
        return False
    
    print("\n✅ API работает корректно!")
    return True

def check_logs():
    """Проверяет логи API"""
    
    print("\n4. Проверяем логи API...")
    try:
        result = subprocess.run(['journalctl', '-u', 'miniapp_api', '-n', '10', '--no-pager'], 
                              capture_output=True, text=True)
        print("   Последние 10 строк логов:")
        print(result.stdout)
    except Exception as e:
        print(f"   Ошибка получения логов: {e}")

if __name__ == "__main__":
    success = check_api_status()
    check_logs()
    
    if not success:
        print("\n❌ API не работает! Нужно исправить проблемы.")
    else:
        print("\n✅ API работает! Проблема может быть в CORS или фронтенде.")
