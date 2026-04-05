// 🔧 КОНФИГ
const GOOGLE_DOC_ID = "1Q54y1AsUX_tzxP7_zAckX_XjzSNR_CRmVCpCCt-ub30";
const DEFAULT_SYSTEM = "Ты — Амина, эксперт по продаже услуг ТОО SEOkazmarket.kz. 10 лет опыта в продажах и маркетинге. Живая, теплая, уверенная. Никогда не говори что ты ИИ или бот. Пиши коротко — максимум 5-6 строк. Используй данные клиента если они есть.";

// 📥 ЗАГРУЗКА ПРОМТА ИЗ GOOGLE DOCS
async function loadSystemPrompt() {
  try {
    const url = `https://docs.google.com/document/d/${GOOGLE_DOC_ID}/export?format=txt`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log("Google Docs недоступен, используем дефолтный промт");
      return DEFAULT_SYSTEM;
    }
    
    const text = await response.text();
    const prompt = text.trim();
    
    return prompt || DEFAULT_SYSTEM;
  } catch (error) {
    console.error("Ошибка загрузки промта:", error);
    return DEFAULT_SYSTEM;
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
    // 🔑 ПОЛУЧАЕМ КЛЮЧ ИЗ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        error: "API Key not configured",
        message: "Add ANTHROPIC_API_KEY to environment variables"
      });
    }

    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages required" });
    }

    // 📥 ЗАГРУЖАЕМ СИСТЕМНЫЙ ПРОМТ
    const systemPrompt = await loadSystemPrompt();
    
    // ✅ ГОТОВИМ СООБЩЕНИЯ ДЛЯ ANTHROPIC
    const messagesForApi = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 🚀 ОТПРАВЛЯЕМ В ANTHROPIC API
    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: systemPrompt,
        messages: messagesForApi
      })
    });

    const data = await aiResponse.json();

    // ✅ ПРЕОБРАЗУЕМ ОТВЕТ
    const response = {
      choices: [
        {
          message: {
            content: data.content?.[0]?.text || "Ошибка: нет ответа"
          }
        }
      ]
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Ошибка сервера:", error);
    res.status(500).json({
      error: "Server error",
      message: error.message,
      choices: [
        {
          message: {
            content: "Ошибка соединения с AI. Попробуйте еще раз."
          }
        }
      ]
    });
  }
}
