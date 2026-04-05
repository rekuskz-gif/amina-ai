# 🤖 Амина Bot - AI Эксперт

Полнофункциональный AI чат-бот Амины для продажи услуг SEOkazmarket.kz

## 📁 Структура проекта

```
amina-bot/
├── api/
│   ├── chat.js          # API для общения с AI
│   └── quiz.js          # API для квиза
├── index.html           # Интерфейс чата
├── vercel.json          # Конфиг Vercel
└── README.md            # Этот файл
```

## 🚀 Развертывание

### 1. GitHub
- Создай новый репо: `amina-bot`
- Загрузи все файлы

### 2. Vercel
- Подключи репо к Vercel
- Добавь переменные окружения:
  ```
  OPENROUTER_API_KEY=твой_ключ
  ```
- Deploy!

## 📍 URLs

- **Основной**: `https://amina-bot.vercel.app`
- **С квизом**: `https://amina-bot.vercel.app?id=123`
- **API чата**: `https://amina-bot.vercel.app/api/chat`
- **API квиза**: `https://amina-bot.vercel.app/api/quiz`

## 🔧 Переменные окружения

Нужно добавить в Vercel:
- `OPENROUTER_API_KEY` - ключ OpenRouter AI

## 📝 Промт загружается из Google Docs

ID документа: `1Q54y1AsUX_tzxP7_zAckX_XjzSNR_CRmVCpCCt-ub30`

Автоматически берется при каждом обращении.

## 💬 Общение

Бот получает:
- Промт из Google Docs
- История разговора
- Отправляет ответ пользователю
- Сохраняет в Telegram

## 📦 Зависимости

Встроенные (встроены в Vercel):
- Node.js
- Fetch API

## 👤 Контакты

Telegram: @rekuskz_gif
