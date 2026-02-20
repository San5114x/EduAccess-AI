import express from "express";
import { runGroqPipeline } from "../services/groqService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { content } = req.body;

    const result = await runGroqPipeline(content);

    res.json({ success: true, result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

export default router;