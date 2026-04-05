const GOOGLE_DOC_ID = "1Q54y1AsUX_tzxP7_zAckX_XjzSNR_CRmVCpCCt-ub30";
const TG_TOKEN = "8715209750:AAH4-blEgXPZpeYXii8IeWLX0wdbGWtANQc";
const TG_CHAT = "376719975";

async function loadPrompt() {
  try {
    const url = `https://docs.google.com/document/d/${GOOGLE_DOC_ID}/export?format=txt`;
    console.log("📥 Загружаю промт из Google Docs:", url);
    
    const response = await fetch(url);
    console.log("📄 Статус Google Docs:", response.status);
    
    if (!response.ok) {
      const defaultPrompt = "Ты Амина, консультант SEOkazmarket.kz";
      console.log("⚠️ Google Docs недоступна, используем дефолт");
      return defaultPrompt;
    }
    
    let text = await response.text();
    text = text.trim();
    
    if (!text || text.length === 0) {
      const defaultPrompt = "Ты Амина, консультант SEOkazmarket.kz";
      console.warn("⚠️ Промт пуст! Используем дефолт");
      return defaultPrompt;
    }
    
    console.log("✅ Промт загружен, длина:", text.length, "символов");
    console.log("📝 Промт:", text.substring(0, 100) + "...");
    return text;
    
  } catch (e) {
    console.error("❌ loadPrompt error:", e.message);
    return "Ты Амина, консультант SEOkazmarket.kz";
  }
}

async function sendToTelegram(messages) {
  try {
    let text = "📋 История чата Амины:\n\n";
    
    for (let msg of messages) {
      if (msg.role === "user") {
        text += `👤 Клиент: ${msg.content}\n\n`;
      } else {
        text += `🤖 Амина: ${msg.content}\n\n`;
      }
    }
    
    console.log("📤 Отправляю в Telegram...");
    
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        chat_id: TG_CHAT,
        text: text
      })
    });
    
    console.log("✅ Telegram сообщение отправлено");
  } catch (e) {
    console.error("❌ Telegram error:", e.message);
  }
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });

  try {
    console.log("🚀 Новый запрос к /api/chat");
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("❌ API Key не найден!");
      return res.status(500).json({ error: "API Key not configured" });
    }
    console.log("✅ API Key найден:", apiKey.substring(0, 20) + "...");

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      console.error("❌ Messages не валидны");
      return res.status(400).json({ error: "Messages required" });
    }
    console.log("✅ Messages получены:", messages.length, "сообщений");

    const systemPrompt = await loadPrompt();
    console.log("📌 System Prompt установлен, длина:", systemPrompt.length);

    if (!systemPrompt || systemPrompt.length === 0) {
      console.error("❌ System Prompt пуст!");
      return res.status(400).json({ error: "System prompt is empty" });
    }

    const requestBody = {
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: systemPrompt,
      messages: messages
    };

    console.log("🔗 Отправляю запрос в Anthropic API...");
    console.log("📊 Запрос:", JSON.stringify(requestBody, null, 2));
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    console.log("📡 Статус ответа Anthropic:", response.status);

    const data = await response.json();
    console.log("📥 Ответ от API:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("❌ Anthropic API ошибка:", JSON.stringify(data, null, 2));
      return res.status(response.status).json({
        error: data.error?.message || "API Error",
        choices: [{message: {content: "Ошибка API"}}]
      });
    }

    const botMessage = data.content?.[0]?.text || "Ошибка";
    console.log("✅ Ответ получен:", botMessage.substring(0, 50) + "...");
    
    await sendToTelegram(messages);
    
    res.status(200).json({ choices: [{message: {content: botMessage}}] });

  } catch (error) {
    console.error("❌ Server error:", error.message);
    console.error("Stack:", error.stack);
    
    res.status(500).json({
      error: "Server error",
      message: error.message,
      choices: [{message: {content: "Ошибка сервера"}}]
    });
  }
};
