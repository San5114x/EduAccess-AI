import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import transformRoute from "./routes/transform.js";
import quizRoutes from "./routes/quizRoutes.js";
import agentRoute from "./routes/agent.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/agent", agentRoute);


app.use("/api/transform", transformRoute);
app.use("/api/quiz", quizRoutes);

app.get("/", (req, res) => {
  res.json({ message: "EduAccess AI Backend Running 🚀" });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});