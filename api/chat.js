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
    const { messages, model, max_tokens } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages required" });
    }

    // 📥 ЗАГРУЖАЕМ СИСТЕМНЫЙ ПРОМТ
    const systemPrompt = await loadSystemPrompt();
    
    // ✅ ДОБАВЛЯЕМ ПРОМТ ЕСЛИ ЕГО НЕТ
    let messagesWithSystem = messages;
    if (messages.length === 0 || messages[0].role !== "system") {
      messagesWithSystem = [
        { role: "system", content: systemPrompt },
        ...messages
      ];
    }

    // 🚀 ОТПРАВЛЯЕМ В OPENROUTER AI
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://amina-bot.vercel.app",
        "X-Title": "AminaBot"
      },
      body: JSON.stringify({
        model: model || "openai/gpt-4o-mini",
        max_tokens: max_tokens || 1500,
        messages: messagesWithSystem
      })
    });

    const data = await aiResponse.json();

    // ✅ ВОЗВРАЩАЕМ ОТВЕТ
    res.status(aiResponse.status).json(data);

  } catch (error) {
    console.error("Ошибка сервера:", error);
    res.status(500).json({
      error: "Server error",
      message: error.message
    });
  }
}
