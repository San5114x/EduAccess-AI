import express from "express";
import { runGroqSimple } from "../services/groqService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "No content provided" });
    }

    const prompt = `
Create a short ADHD focus check.

Include:
• One recall question
• One keyword question
• One true/false question

Keep everything simple and under 15 words.

Content:
${content}
`;

    const result = await runGroqSimple(prompt);

    res.json({ question: result });

  } catch (error) {
    console.error("QUIZ ROUTE ERROR:", error);
    res.status(500).json({ error: "Quiz generation failed" });
  }
});

export default router;