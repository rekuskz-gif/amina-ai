const GOOGLE_DOC_ID = "1Q54y1AsUX_tzxP7_zAckX_XjzSNR_CRmVCpCCt-ub30";
const TG_TOKEN = "8715209750:AAH4-blEgXPZpeYXii8IeWLX0wdbGWtANQc";
const TG_CHAT = "376719975";

async function loadPrompt() {
  try {
    const url = `https://docs.google.com/document/d/${GOOGLE_DOC_ID}/export?format=txt`;
    const response = await fetch(url);
    if (!response.ok) return "Ты Амина, консультант SEOkazmarket.kz";
    const text = await response.text();
    return text.trim() || "Ты Амина, консультант SEOkazmarket.kz";
  } catch (e) {
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
    
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        chat_id: TG_CHAT,
        text: text
      })
    });
  } catch (e) {
    console.error("Telegram error:", e);
  }
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API Key not configured" });

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Messages required" });

    const systemPrompt = await loadPrompt();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-opus-4-1",
        max_tokens: 300,
        system: systemPrompt,
        messages: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "API Error",
        choices: [{message: {content: "Ошибка API"}}]
      });
    }

    const botMessage = data.content?.[0]?.text || "Ошибка";
    
    await sendToTelegram(messages);
    
    res.status(200).json({ choices: [{message: {content: botMessage}}] });

  } catch (error) {
    res.status(500).json({
      error: "Server error",
      choices: [{message: {content: "Ошибка сервера"}}]
    });
  }
};
