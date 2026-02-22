import express from "express";
import { model } from "../config/gemini.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });

  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Gemini failed" });
  }
});

export default router;