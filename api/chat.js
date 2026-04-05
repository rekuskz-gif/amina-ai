// 🔧 КОНФИГ
const GOOGLE_DOC_ID = "1Q54y1AsUX_tzxP7_zAckX_XjzSNR_CRmVCpCCt-ub30";
const DEFAULT_SYSTEM = "Ты — Амина, эксперт по продаже услуг ТОО SEOkazmarket.kz.";

// 📥 ЗАГРУЗКА ПОЛНОГО КОНТЕНТА ИЗ GOOGLE DOCS
async function loadContentFromDocs() {
  try {
    const url = `https://docs.google.com/document/d/${GOOGLE_DOC_ID}/export?format=txt`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return { systemPrompt: DEFAULT_SYSTEM, greeting: null };
    }
    
    const text = await response.text();
    const lines = text.trim().split('\n').filter(line => line.trim());
    
    // Берем первую строку как приветствие (может быть несколько строк)
    let greeting = null;
    let systemPrompt = DEFAULT_SYSTEM;
    
    if (lines.length > 0) {
      // Берем всё содержимое как системный промт
      systemPrompt = text.trim();
      
      // Если хочешь отдельное приветствие - можно парсить по разделам
      // Пока берем всё как промт
    }
    
    return { systemPrompt, greeting };
  } catch (error) {
    console.error("Ошибка загрузки контента:", error);
    return { systemPrompt: DEFAULT_SYSTEM, greeting: null };
  }
}

// 🎯 ГЛАВНЫЙ ОБРАБОТЧИК
export default async function handler(req, res) {
  // 🔓 РАЗРЕШИТЬ ЗАПРОСЫ ИЗ ДРУГИХ САЙТОВ
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    // 🔑 ПОЛУЧАЕМ КЛЮЧ
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error("❌ ANTHROPIC_API_KEY не найден!");
      return res.status(500).json({
        error: "API Key not configured",
        choices: [{message: {content: "Ошибка: API ключ не настроен."}}]
      });
    }

    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages required" });
    }

    // 📥 ЗАГРУЖАЕМ ВСЕ ДАННЫЕ ИЗ GOOGLE DOCS
    const { systemPrompt } = await loadContentFromDocs();
    
    console.log("✅ Контент загружен из Google Docs");
    console.log("🔑 Ключ присутствует:", apiKey.substring(0, 20) + "...");

    // 🚀 ОТПРАВЛЯЕМ В ANTHROPIC API
    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-opus-4-1",
        max_tokens: 1500,
        system: systemPrompt,
        messages: messages
      })
    });

    console.log("📡 Статус ответа:", aiResponse.status);

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error("❌ Ошибка API:", JSON.stringify(data, null, 2));
      return res.status(aiResponse.status).json({
        error: data.error?.message || "API Error",
        choices: [{message: {content: "Ошибка API. Попробуйте еще раз."}}]
      });
    }

    // ✅ ПРЕОБРАЗУЕМ ОТВЕТ
    const botMessage = data.content?.[0]?.text || "Ошибка: нет ответа от AI";
    
    console.log("✅ Ответ получен успешно");

    const response = {
      choices: [
        {
          message: {
            content: botMessage
          }
        }
      ]
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("❌ Ошибка сервера:", error.message);
    res.status(500).json({
      error: "Server error",
      message: error.message,
      choices: [{message: {content: "Критическая ошибка сервера."}}]
    });
  }
}
