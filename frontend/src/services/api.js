import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5001/api"
});

// Transform content
export const transformContent = async (content) => {
  const res = await API.post("/transform", { content });
  return res.data;
};

// Generate ADHD Quiz
export const generateQuiz = async (content) => {
  const res = await API.post("/quiz", { content });
  return res.data;
};

// Ask AI Agent
export const askAgent = async (question, lesson, personality) => {
  const res = await API.post("/agent/ask", {
    question,
    lesson,
    personality
  });
  return res.data;
};