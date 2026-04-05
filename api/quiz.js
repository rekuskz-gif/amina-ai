// 🔧 КОНФИГ БАЗЫ ДАННЫХ
const KV_URL = "https://ready-snail-66852.upstash.io";
const KV_TOKEN = "gQAAAAAAAQUkAAIncDE1ODRmZjFhODNlMDU0YzA0ODEyNzI2YTczNDA2ZGJkNHAxNjY4NTI";

// 🔧 КОНФИГ TELEGRAM
const TG_TOKEN = "8715209750:AAH4-blEgXPZpeYXii8IeWLX0wdbGWtANQc";
const TG_CHAT_ID = "376719975";

// 🎯 ГЛАВНЫЙ ОБРАБОТЧИК
export default async function handler(req, res) {
  // 🔓 РАЗРЕШИТЬ ЗАПРОСЫ
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 📝 ПОЛУЧИТЬ ДАННЫЕ КВИЗА
  if (req.method === "GET") {
    return handleGet(req, res);
  }

  // ✍️ СОХРАНИТЬ ДАННЫЕ КВИЗА
  if (req.method === "POST") {
    return handlePost(req, res);
  }

  res.status(405).json({ error: "Method not allowed" });
}

// ✍️ СОХРАНЕНИЕ КВИЗА
async function handlePost(req, res) {
  try {
    const data = req.body;
    const id = (data.tranid || Date.now().toString()).replace(/[^a-zA-Z0-9_]/g, "_");

    // 💾 СОХРАНЯЕМ В БАЗУ ДАННЫХ
    await fetch(`${KV_URL}/set/amina_quiz_${id}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ex: 86400,
        value: JSON.stringify(data)
      })
    });

    // 📌 СОХРАНЯЕМ ПОСЛЕДНЮЮ ЗАЯВКУ
    await fetch(`${KV_URL}/set/amina_quiz_latest`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ex: 3600,
        value: JSON.stringify(data)
      })
    });

    // 📤 ОТПРАВЛЯЕМ В TELEGRAM
    await sendTelegramMessage(data, id);

    return res.status(200).json({
      ok: true,
      id: id,
      message: "Quiz saved successfully"
    });

  } catch (error) {
    console.error("Ошибка при сохранении квиза:", error);
    return res.status(500).json({
      error: "Failed to save quiz",
      message: error.message
    });
  }
}

// 📥 ПОЛУЧЕНИЕ КВИЗА
async function handleGet(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID required" });
    }

    const safeId = id === "latest" 
      ? "latest" 
      : id.replace(/[^a-zA-Z0-9_]/g, "_");

    // 📖 ПОЛУЧАЕМ ИЗ БАЗЫ ДАННЫХ
    const response = await fetch(`${KV_URL}/get/amina_quiz_${safeId}`, {
      headers: {
        "Authorization": `Bearer ${KV_TOKEN}`
      }
    });

    const raw = await response.text();
    let quiz = null;

    // 🔄 ПАРСИМ JSON
    try {
      const match = raw.match(/\{.*\}/s);
      if (match) {
        quiz = JSON.parse(match[0]);
      }
    } catch (parseError) {
      console.error("Ошибка парсинга:", parseError);
    }

    return res.status(200).json({
      quiz: quiz,
      found: quiz !== null
    });

  } catch (error) {
    console.error("Ошибка при получении квиза:", error);
    return res.status(500).json({
      error: "Failed to get quiz",
      message: error.message
    });
  }
}

// 📤 ОТПРАВКА В TELEGRAM
async function sendTelegramMessage(data, id) {
  try {
    const fieldNames = {
      name: "Имя",
      phone: "Телефон",
      email: "Email",
      clients: "Тип клиентов",
      budget: "Бюджет",
      check: "Средний чек",
      leads: "Заявок сейчас",
      result: "Хочет заявок",
      geo: "География",
      tasks: "Задачи",
      competitors: "Конкуренты",
      advantage: "Преимущество",
      services: "Услуги"
    };

    let messageText = "📋 Новая заявка от Амины!\n\n";

    // Добавляем все поля
    for (const [key, label] of Object.entries(fieldNames)) {
      if (data[key]) {
        messageText += `• ${label}: ${data[key]}\n`;
      }
    }

    messageText += `\n🔗 Ссылка на бот: https://amina-bot.vercel.app?id=${id}`;

    // 🚀 ОТПРАВЛЯЕМ
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: messageText
      })
    });

    console.log("✅ Сообщение отправлено в Telegram");

  } catch (error) {
    console.error("Ошибка Telegram:", error);
    // Не прерываем если ошибка с TG
  }
}
