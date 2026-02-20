import express from "express";
import axios from "axios";

const router = express.Router();

/* ================= ATTENTION QUIZ ROUTE ================= */

router.post("/attention", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content required" });
    }

    const prompt = `
Create ONE short multiple-choice focus recovery question from this content.

Rules:
- 1 question only
- 4 options
- Return ONLY valid JSON
Format:
{
  "q": "question",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0
}

Content:
${content.slice(0, 2000)}
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 300
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        }
      }
    );

    const raw = response.data.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("Quiz JSON parse failed:", raw);
      return res.status(500).json({ error: "Quiz format invalid" });
    }

    res.json(parsed);

  } catch (error) {
    console.error("Groq Quiz Error:", error.response?.data || error.message);
    res.status(500).json({ error: "AI quiz generation failed" });
  }
});

export default router;