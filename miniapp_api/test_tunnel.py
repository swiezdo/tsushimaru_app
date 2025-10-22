#!/usr/bin/env python3
# test_tunnel.py
# Тестирование Cloudflare Tunnel

import requests
import json

def test_tunnel():
    """Тестирует Cloudflare Tunnel"""
    
    tunnel_url = "https://refers-asin-babies-benefits.trycloudflare.com"
    local_url = "http://127.0.0.1:8000"
    
    print("🔍 Тестирование Cloudflare Tunnel...")
    
    # Тест 1: Локальный API
    try:
        print("1. Тестируем локальный API...")
        response = requests.get(f"{local_url}/health", timeout=5)
        print(f"   Local Status: {response.status_code}")
        print(f"   Local Response: {response.text}")
    except Exception as e:
        print(f"   Local Ошибка: {e}")
    
    # Тест 2: Через Tunnel
    try:
        print("\n2. Тестируем через Tunnel...")
        response = requests.get(f"{tunnel_url}/health", timeout=10)
        print(f"   Tunnel Status: {response.status_code}")
        print(f"   Tunnel Response: {response.text}")
    except Exception as e:
        print(f"   Tunnel Ошибка: {e}")
    
    # Тест 3: OPTIONS через Tunnel
    try:
        print("\n3. Тестируем OPTIONS через Tunnel...")
        response = requests.options(f"{tunnel_url}/api/profile.get", timeout=10)
        print(f"   OPTIONS Status: {response.status_code}")
        print(f"   OPTIONS Response: {response.text}")
        print(f"   OPTIONS Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"   OPTIONS Ошибка: {e}")
    
    # Тест 4: Проверяем заголовки Tunnel
    try:
        print("\n4. Проверяем заголовки Tunnel...")
        response = requests.head(f"{tunnel_url}/health", timeout=10)
        print(f"   HEAD Status: {response.status_code}")
        print(f"   HEAD Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"   HEAD Ошибка: {e}")

if __name__ == "__main__":
    test_tunnel()
