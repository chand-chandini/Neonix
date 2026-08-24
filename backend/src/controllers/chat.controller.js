const { GoogleGenerativeAI } = require("@google/generative-ai");
const Conversation = require("../models/Conversation");

const MODEL_CANDIDATES = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

let MODEL_NAME = MODEL_CANDIDATES[0];

console.log("🔑 GEMINI_API_KEY exists?", !!process.env.GEMINI_API_KEY);

let genAI;
let model;

function createFallbackReply(message) {
  const text = message.trim();
  const lower = text.toLowerCase();

  if (!text) return "Please enter a message so I can help.";
  if (lower.includes("hello") || lower.includes("hi")) {
    return "Hello! I’m Neonix AI, and this is the local demo mode. Add a valid GEMINI_API_KEY to enable live Gemini responses.";
  }
  if (lower.includes("python")) {
    return "Python is a beginner-friendly, versatile programming language used for web apps, automation, data science, and AI projects.";
  }
  if (lower.includes("react")) {
    return "React is a JavaScript library for building user interfaces using reusable components and state-driven rendering.";
  }
  if (lower.includes("weather")) {
    return "I can’t fetch live weather without an API key, but I can help you build a weather app with OpenWeatherMap or a similar service.";
  }
  if (lower.includes("joke")) {
    return "Why do developers prefer dark mode? Because light attracts bugs.";
  }
  if (lower.includes("who are you") || lower.includes("what are you")) {
    return "I’m Neonix AI, a local demo assistant. The app is working end-to-end even without a live Gemini key.";
  }

  return `Demo response: I received "${text}". This app is currently running in local demo mode because no valid Gemini API key is configured yet. Add a valid GEMINI_API_KEY to enable live AI replies.`;
}

async function initializeModel() {
  if (!process.env.GEMINI_API_KEY) return null;

  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  for (const candidate of MODEL_CANDIDATES) {
    try {
      const candidateModel = genAI.getGenerativeModel({ model: candidate });
      await candidateModel.generateContent("ping");
      MODEL_NAME = candidate;
      console.log(`✅ Gemini model initialized: ${MODEL_NAME}`);
      return candidateModel;
    } catch (error) {
      console.warn(`⚠️ Model ${candidate} unavailable: ${error.message}`);
    }
  }

  return null;
}

(async () => {
  try {
    model = await initializeModel();
  } catch (error) {
    console.error("❌ Failed to initialize Gemini:", error.message);
  }
})();

exports.sendMessage = async (req, res) => {
  console.log("📨 Received request to /api/chat/send");
  console.log("📨 Request body:", req.body);

  if (!req.body || Object.keys(req.body).length === 0) {
    console.log("❌ No body received!");
    return res.status(400).json({
      error: "Request body is missing",
      details: "Make sure Content-Type: application/json is set",
    });
  }

  try {
    const { message, conversationId } = req.body;

    if (!message) {
      console.log("❌ No message provided");
      return res.status(400).json({ error: "Message is required" });
    }

    const useDemoMode = !process.env.GEMINI_API_KEY || !model;

    if (useDemoMode) {
      console.log("ℹ️ Running in demo mode because Gemini is unavailable.");
    }

    console.log("📝 Processing message:", message.substring(0, 50) + "...");

    let conversation;
    if (conversationId) {
      console.log("🔍 Looking for conversation:", conversationId);
      try {
        conversation = await Conversation.findById(conversationId);
        console.log("📂 Found conversation:", conversation ? "Yes" : "No");
      } catch (err) {
        console.log("❌ Error finding conversation:", err.message);
      }
    }

    if (!conversation) {
      console.log("📝 Creating new conversation");
      conversation = new Conversation({
        title: message.slice(0, 30) + "...",
        userId: "default-user",
        messages: [],
      });
    }

    conversation.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    if (useDemoMode) {
      const aiResponse = createFallbackReply(message);
      conversation.messages.push({
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      });

      conversation.updatedAt = new Date();
      await conversation.save();
      console.log("💾 Demo conversation saved with ID:", conversation._id);

      return res.json({
        message: aiResponse,
        conversationId: conversation._id,
        demoMode: true,
      });
    }

    console.log(`🤖 Calling Gemini API with model: ${MODEL_NAME}`);

    try {
      const result = await model.generateContent(message);
      const aiResponse = result.response.text();
      console.log("✅ Received response from Gemini");

      conversation.messages.push({
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      });

      conversation.updatedAt = new Date();
      await conversation.save();
      console.log("💾 Conversation saved with ID:", conversation._id);

      res.json({
        message: aiResponse,
        conversationId: conversation._id,
        demoMode: false,
      });
    } catch (geminiError) {
      console.log("❌ Gemini API Error:", geminiError.message);

      const message = geminiError.message || "";

      if (
        message.includes("API key") ||
        message.includes("API_KEY_INVALID") ||
        message.includes("invalid API key")
      ) {
        const aiResponse = createFallbackReply(message);
        conversation.messages.push({
          role: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        });

        conversation.updatedAt = new Date();
        await conversation.save();

        return res.json({
          message: aiResponse,
          conversationId: conversation._id,
          demoMode: true,
        });
      }

      if (message.includes("not found")) {
        return res.status(500).json({
          error: "Gemini model not found",
          details: `Model "${MODEL_NAME}" is not available. Try a current Gemini model such as "gemini-3.5-flash" or "gemini-3.6-flash" instead.`,
        });
      }

      if (message.includes("quota")) {
        return res.status(429).json({
          error: "Gemini API quota exceeded",
          details: "Please try again later or upgrade your API quota.",
        });
      }

      const fallbackReply = createFallbackReply(message);
      conversation.messages.push({
        role: "assistant",
        content: fallbackReply,
        timestamp: new Date(),
      });
      conversation.updatedAt = new Date();
      await conversation.save();

      return res.json({
        message: fallbackReply,
        conversationId: conversation._id,
        demoMode: true,
      });
    }
  } catch (error) {
    console.log("❌ Chat error:", error.message);
    console.log("❌ Error stack:", error.stack);

    res.status(500).json({
      error: "Failed to get response from Gemini",
      details: error.message,
      status: error.status || 500,
    });
  }
};

exports.getConversations = async (req, res) => {
  try {
    console.log("📋 Fetching conversations");
    const conversations = await Conversation.find({ userId: "default-user" })
      .sort({ updatedAt: -1 })
      .select("_id title messages updatedAt");

    console.log(`📋 Found ${conversations.length} conversations`);
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Fetching conversation:", id);
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      console.log("❌ Conversation not found:", id);
      return res.status(404).json({ error: "Conversation not found" });
    }

    console.log("✅ Found conversation");
    res.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑️ Deleting conversation:", id);
    await Conversation.findByIdAndDelete(id);
    console.log("✅ Deleted conversation");
    res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
};
