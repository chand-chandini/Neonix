const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const app = express();

dotenv.config();

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

// ============================================
// TEST ENDPOINT - Add this first!
// ============================================
app.get("/api/test", (req, res) => {
  res.json({
    message: "✅ Backend is working!",
    gemini_key_exists: !!process.env.GEMINI_API_KEY,
    mongodb_status:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    mongodb_uri: process.env.MONGODB_URI || "mongodb://localhost:27017/neonix",
  });
});

// ============================================
// Routes
// ============================================
const chatRoutes = require("./routes/chat.routes");
const conversationRoutes = require("./routes/conversation.routes");

app.use("/api/chat", chatRoutes);
app.use("/api/conversations", conversationRoutes);

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
      conversations: "/api/conversations",
    },
  });
});

// ============================================
// 404 handler - catch all undefined routes
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
});
