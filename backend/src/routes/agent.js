import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/ask", async (req, res) => {
  try {
    const { question, lesson } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
    You are an AI learning tutor.
    Explain clearly and simply.

    Lesson:
    ${lesson}

    Student Question:
    ${question}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ answer: text });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});

export default router;