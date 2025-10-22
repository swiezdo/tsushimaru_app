#!/usr/bin/env python3
# test_api_direct.py
# Прямое тестирование API без CORS

import requests
import json

def test_api_direct():
    """Тестирует API напрямую без CORS"""
    
    base_url = "https://refers-asin-babies-benefits.trycloudflare.com"
    
    print("🔍 Тестирование API напрямую...")
    
    # Тест 1: Health endpoint
    try:
        print("1. Тестируем /health...")
        response = requests.get(f"{base_url}/health", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        print(f"   Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"   Ошибка: {e}")
    
    # Тест 2: OPTIONS запрос
    try:
        print("\n2. Тестируем OPTIONS /api/profile.get...")
        response = requests.options(f"{base_url}/api/profile.get", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        print(f"   Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"   Ошибка: {e}")
    
    # Тест 3: OPTIONS запрос с заголовками
    try:
        print("\n3. Тестируем OPTIONS с CORS заголовками...")
        headers = {
            'Origin': 'https://swiezdo.github.io',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'X-Telegram-Init-Data'
        }
        response = requests.options(f"{base_url}/api/profile.get", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        print(f"   Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"   Ошибка: {e}")

if __name__ == "__main__":
    test_api_direct()
