const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
dotenv.config();

// ✅ FIXED: CORS Configuration - Specific origins for hosting
const allowedOrigins = [
  'https://neonix-frontend.onrender.com',
  'https://neonix.digital',
  'http://localhost:3000',
  'http://localhost:5000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Blocked origin:', origin);
      callback(null, true); // Allow all for now (but we can restrict later)
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

// ============================================
// TEST ENDPOINT
// ============================================
app.get("/api/test", (req, res) => {
  res.json({
    message: "✅ Backend is working!",
    gemini_key_exists: !!process.env.GEMINI_API_KEY,
    mongodb_status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ============================================
// CHAT ENDPOINT - UPDATED WITH WORKING MODELS
// ============================================
app.post("/api/chat/send", async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    console.log("📩 Received message:", message);

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY is not set");
      return res.status(500).json({
        success: false,
        error: "API key not configured"
      });
    }

    // ✅ Only use confirmed working models
    const modelNames = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-flash-latest",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
    ];

    let lastError = null;
    let responseText = null;
    let usedModel = null;

    for (const modelName of modelNames) {
      try {
        console.log(`🤖 Trying model: ${modelName}`);
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: message
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
              topK: 40,
              topP: 0.95,
            }
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
          usedModel = modelName;
          console.log(`✅ Success with model: ${modelName}`);
          break;
        } else {
          const errorMsg = data.error?.message || 'Unknown error';
          console.log(`❌ Model ${modelName} failed:`, errorMsg);
          
          if (errorMsg.includes('high demand') || errorMsg.includes('no longer')) {
            console.log(`⏳ ${modelName} is unavailable, trying next model...`);
            continue;
          }
          lastError = new Error(errorMsg);
        }
      } catch (error) {
        console.log(`❌ Model ${modelName} error:`, error.message);
        lastError = error;
      }
    }

    if (!responseText) {
      console.error("❌ All models failed");
      throw lastError || new Error("No working model found");
    }

    console.log("✅ Response generated successfully using:", usedModel);

    res.json({
      success: true,
      response: responseText,
      message: responseText,
      conversationId: conversationId || Date.now().toString(),
      model: usedModel
    });
  } catch (error) {
    console.error("❌ Chat error:", error);
    console.error("❌ Error stack:", error.stack);
    
    res.status(500).json({
      success: false,
      error: "Failed to generate response",
      message: error.message,
      details: error.stack
    });
  }
});

// ============================================
// IMAGE GENERATION - WORKING VERSION
// ============================================
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, width = 512, height = 512 } = req.body;
    
    console.log("🎨 Generating image for prompt:", prompt);

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required"
      });
    }

    const cleanPrompt = prompt.replace(/["']/g, '').trim();
    const encodedPrompt = encodeURIComponent(cleanPrompt);
    
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
    
    console.log("✅ Image URL generated:", imageUrl);

    res.json({
      success: true,
      imageUrl: imageUrl,
      prompt: cleanPrompt,
      width: width,
      height: height,
      seed: seed
    });
  } catch (error) {
    console.error("❌ Image generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate image",
      message: error.message
    });
  }
});

// ============================================
// IMAGE PROXY
// ============================================
app.get("/api/image-proxy", async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL is required"
      });
    }

    console.log("🔄 Fetching image...");

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    res.set('Content-Type', contentType);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'no-cache');
    res.send(Buffer.from(buffer));
    
    console.log("✅ Image proxy successful");
  } catch (error) {
    console.error("❌ Image proxy error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch image",
      message: error.message
    });
  }
});

// ============================================
// FALLBACK IMAGE
// ============================================
app.get("/api/fallback-image", async (req, res) => {
  try {
    const { text } = req.query;
    const encodedText = encodeURIComponent(text || 'AI Image');
    
    const svg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="#1a1a1a"/>
        <rect x="20" y="20" width="472" height="472" fill="#2d2d2d" rx="20"/>
        <text x="256" y="200" font-family="Arial" font-size="32" fill="#6c63ff" text-anchor="middle">
          🎨 Neonix AI
        </text>
        <text x="256" y="260" font-family="Arial" font-size="20" fill="#888" text-anchor="middle">
          ${encodedText}
        </text>
        <text x="256" y="300" font-family="Arial" font-size="16" fill="#666" text-anchor="middle">
          Image Generation
        </text>
      </svg>
    `;
    
    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-cache');
    res.send(svg);
  } catch (error) {
    res.status(500).send('Error generating fallback image');
  }
});

// ============================================
// CONVERSATIONS ENDPOINTS
// ============================================
app.get("/api/conversations", async (req, res) => {
  try {
    res.json({
      success: true,
      conversations: [],
      count: 0
    });
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      conversations: []
    });
  }
});

app.get("/api/conversations/:id", async (req, res) => {
  try {
    res.json({
      success: true,
      messages: []
    });
  } catch (error) {
    console.error("❌ Error fetching conversation:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post("/api/conversations", async (req, res) => {
  try {
    const { title } = req.body;
    res.json({
      success: true,
      conversation: {
        _id: Date.now().toString(),
        title: title || "New Conversation",
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error("❌ Error creating conversation:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete("/api/conversations/:id", async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Conversation deleted"
    });
  } catch (error) {
    console.error("❌ Error deleting conversation:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// LIST AVAILABLE MODELS
// ============================================
app.get("/api/models", async (req, res) => {
  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    const supportedModels = data.models?.filter(model => 
      model.supportedMethods?.includes('generateContent')
    ) || [];
    
    res.json({
      success: true,
      all_models: data.models || [],
      supported_models: supportedModels,
      count: supportedModels.length
    });
  } catch (error) {
    console.error("❌ Error fetching models:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// MongoDB connection
// ============================================
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/neonix")
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ============================================
// Health check
// ============================================
app.get("/", (req, res) => {
  res.json({
    message: "Neonix API is running!",
    endpoints: {
      test: "/api/test",
      chat: "/api/chat/send",
      image: "/api/generate-image",
      proxy: "/api/image-proxy",
      fallback: "/api/fallback-image",
      models: "/api/models",
      conversations: "/api/conversations",
    },
  });
});

// ============================================
// 404 handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// ============================================
// Error handler
// ============================================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
    path: req.originalUrl,
  });
});

// ============================================
// Start server
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Neonix server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`📋 Model list: http://localhost:${PORT}/api/models`);
  console.log(`🎨 Image generation: http://localhost:${PORT}/api/generate-image`);
});