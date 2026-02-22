import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: messages
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error("Anthropic error:", error.response?.data || error.message);
    res.status(500).json({ error: "Anthropic request failed" });
  }
});

export default router;