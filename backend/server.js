require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const { initPool, closePool } = require("./config/db");
const { startCleanupJob } = require("./jobs/cleanupPendingUsers");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve the frontend (index.html / script.js / style.css) so it and the
// API share the same origin — that's what lets script.js's relative
// API_BASE = "/api" work with no extra config on localhost.
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

let cleanupHandle;

async function start() {
  try {
    await initPool();
    // Sweeps out unverified signup attempts once their OTP has expired.
    cleanupHandle = startCleanupJob();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

process.on("SIGINT", async () => {
  if (cleanupHandle) clearInterval(cleanupHandle);
  await closePool();
  process.exit(0);
});const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.AI_API_KEY
});

// Temporary chat history
const chatHistory = {};

// ===============================
// CHAT API
// ===============================

app.post("/api/chat", async (req, res) => {
  try {
    const {
      userId = "demo-user",
      question,
      subject = "General",
      level = "Beginner",
      topic = "",
      mode = "Learn"
    } = req.body;

    // Validate question
    if (!question || question.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please enter your question."
      });
    }

    // Create history for user
    if (!chatHistory[userId]) {
      chatHistory[userId] = [];
    }

    // Get previous conversation
    const previousConversation = chatHistory[userId]
      .slice(-10)
      .map((message) => {
        return `${message.role}: ${message.content}`;
      })
      .join("\n");

    // AI system instructions
    const systemPrompt = `
You are an AI Study Assistant and personal tutor.

Student information:
Subject: ${subject}
Current Topic: ${topic || "Not specified"}
Student Level: ${level}
Mode: ${mode}

Help the student understand academic concepts clearly.

Rules:

1. Adapt your explanation to the student's level.
2. For beginners, use simple language and easy examples.
3. For intermediate students, give moderately detailed explanations.
4. For advanced students, give detailed technical explanations.
5. If the student asks for an example, give a clear example.
6. If the student asks to explain simply, make it easier.
7. If the student asks for a real-life example, use an everyday example.
8. If the student asks for step-by-step, use numbered steps.
9. If the mode is Exam Preparation, provide:
   - Definition
   - Key Points
   - Example
   - Short Exam Answer
10. Use previous conversation context for follow-up questions.
11. Stay focused on education and the student's subject.
`;

    // Final prompt
    const prompt = `
${systemPrompt}

PREVIOUS CONVERSATION:
${previousConversation || "No previous conversation."}

CURRENT QUESTION:
${question}

Answer the student as a helpful personal study tutor.
`;

    // Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });

    const answer = response.text;

    if (!answer) {
      throw new Error("Gemini returned an empty response.");
    }

    // Save user message
    chatHistory[userId].push({
      role: "user",
      content: question,
      timestamp: new Date()
    });

    // Save AI response
    chatHistory[userId].push({
      role: "assistant",
      content: answer,
      timestamp: new Date()
    });

    // Send response
    res.json({
      success: true,
      answer: answer,
      context: {
        subject: subject,
        topic: topic,
        level: level,
        mode: mode
      }
    });

  } catch (error) {

    console.error("Gemini Error:", error);

    res.status(500).json({
      success: false,
      message: "Sorry, I couldn't generate an answer right now."
    });
  }
});


// ===============================
// GET CHAT HISTORY
// ===============================

app.get("/api/history/:userId", (req, res) => {

  const userId = req.params.userId;

  res.json({
    success: true,
    history: chatHistory[userId] || []
  });

});


// ===============================
// CLEAR CHAT HISTORY
// ===============================

app.delete("/api/history/:userId", (req, res) => {

  const userId = req.params.userId;

  chatHistory[userId] = [];

  res.json({
    success: true,
    message: "Chat history cleared."
  });

});


// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {

  res.send("AI Study Assistant Backend is running!");

});


// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(
    `AI Study Assistant running on port ${PORT}`
  );

});