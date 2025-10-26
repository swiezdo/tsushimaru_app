#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Telegram Bot для обработки заявок на трофеи Tsushima Mini App
Отдельное приложение, которое работает независимо от API сервера
"""

import os
import asyncio
import aiohttp
import json
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# Конфигурация
BOT_TOKEN = os.getenv("BOT_TOKEN")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
TROPHY_GROUP_CHAT_ID = os.getenv("TROPHY_GROUP_CHAT_ID", "-1002348168326")
TROPHY_GROUP_TOPIC_ID = os.getenv("TROPHY_GROUP_TOPIC_ID", "5675")
MINI_APP_URL = os.getenv("MINI_APP_URL", "https://your-domain.com/docs/index.html")

if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN не установлен в .env файле")

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    user = update.effective_user
    
    welcome_text = f"""Привет, {user.first_name}! 👋

Я бот для системы трофеев Tsushima.Ru Mini App.

🏆 Здесь вы можете:
• Подавать заявки на получение трофеев
• Отслеживать свой прогресс
• Получать уведомления о статусе заявок

Для начала работы откройте мини-приложение:"""
    
    keyboard = InlineKeyboardMarkup([[
        InlineKeyboardButton(
            "🏆 Открыть трофеи", 
            web_app=WebAppInfo(url=f"{MINI_APP_URL}#trophies")
        )
    ]])
    
    await update.message.reply_text(welcome_text, reply_markup=keyboard)

async def handle_callback_query(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик callback кнопок для одобрения/отклонения трофеев"""
    query = update.callback_query
    await query.answer()
    
    callback_data = query.data
    
    if callback_data.startswith("trophy_approve:"):
        # Одобрение трофея
        parts = callback_data.split(":")
        if len(parts) == 3:
            user_id = int(parts[1])
            trophy_id = parts[2]
            
            success = await approve_trophy(user_id, trophy_id)
            
            if success:
                await query.edit_message_text(
                    f"✅ Трофей {trophy_id} одобрен для пользователя {user_id}"
                )
            else:
                await query.edit_message_text(
                    f"❌ Ошибка при одобрении трофея {trophy_id}"
                )
    
    elif callback_data.startswith("trophy_reject:"):
        # Отклонение трофея
        parts = callback_data.split(":")
        if len(parts) == 3:
            user_id = int(parts[1])
            trophy_id = parts[2]
            
            success = await reject_trophy(user_id, trophy_id)
            
            if success:
                await query.edit_message_text(
                    f"❌ Трофей {trophy_id} отклонен для пользователя {user_id}"
                )
            else:
                await query.edit_message_text(
                    f"❌ Ошибка при отклонении трофея {trophy_id}"
                )

async def approve_trophy(user_id: int, trophy_id: str) -> bool:
    """Одобряет трофей через API"""
    try:
        async with aiohttp.ClientSession() as session:
            url = f"{API_BASE_URL}/api/trophies.approve"
            data = {
                "user_id": user_id,
                "trophy_id": trophy_id
            }
            
            async with session.post(url, data=data) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"Трофей {trophy_id} одобрен для пользователя {user_id}: {result}")
                    return True
                else:
                    print(f"Ошибка одобрения трофея: {response.status}")
                    return False
    except Exception as e:
        print(f"Ошибка при одобрении трофея: {e}")
        return False

async def reject_trophy(user_id: int, trophy_id: str) -> bool:
    """Отклоняет трофей через API"""
    try:
        async with aiohttp.ClientSession() as session:
            url = f"{API_BASE_URL}/api/trophies.reject"
            data = {
                "user_id": user_id,
                "trophy_id": trophy_id
            }
            
            async with session.post(url, data=data) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"Трофей {trophy_id} отклонен для пользователя {user_id}: {result}")
                    return True
                else:
                    print(f"Ошибка отклонения трофея: {response.status}")
                    return False
    except Exception as e:
        print(f"Ошибка при отклонении трофея: {e}")
        return False

def main():
    """Основная функция запуска бота"""
    print("🤖 Запуск Telegram бота для системы трофеев...")
    print(f"📡 API URL: {API_BASE_URL}")
    print(f"🏆 Группа трофеев: {TROPHY_GROUP_CHAT_ID}")
    
    # Создаем приложение
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Добавляем обработчики
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CallbackQueryHandler(handle_callback_query))
    
    # Запускаем бота
    print("🚀 Бот запущен и готов к работе!")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
