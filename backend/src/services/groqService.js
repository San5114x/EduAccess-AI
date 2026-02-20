import axios from "axios";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant"; 
// If you want higher reasoning quality, switch to:
// const MODEL = "llama-3.1-70b-versatile";

export async function runGroqPipeline(content) {

  const systemPrompt = `
You are EduAccess AI — an accessibility-focused educational transformer.

Transform the user content into FIVE clearly separated sections.

Use EXACTLY this format:

---VISUAL---
[Detailed visual-friendly explanation]

---HEARING---
[Structured concept cards with bullets and arrows]

---DYSLEXIA---
[Short sentences. Clear structure.]

---ADHD---
[4 learning blocks + micro-quest + rapid review]

---STUDY_PLAN---
[Personalized step-by-step study plan with sessions, goals, and revision schedule]

Rules:
- DO NOT add commentary.
- DO NOT wrap in markdown.
- DO NOT add backticks.
- Follow section markers EXACTLY.
`;

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content }
        ],
        temperature: 0.6,
        max_tokens: 2500
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        }
      }
    );

    const raw = response.data.choices?.[0]?.message?.content?.trim();

    if (!raw) {
      throw new Error("Empty response from Groq");
    }

    // ================= ROBUST SECTION EXTRACTION =================

    const extract = (start, end) => {
      const regex = new RegExp(
        `${start}([\\s\\S]*?)${end ? end : "$"}`,
        "i"
      );
      const match = raw.match(regex);
      return match ? match[1].trim() : "";
    };

    const sections = {
      visual: extract("---VISUAL---", "---HEARING---"),
      hearing: extract("---HEARING---", "---DYSLEXIA---"),
      dyslexia: extract("---DYSLEXIA---", "---ADHD---"),
      adhd: extract("---ADHD---", "---STUDY_PLAN---"),
      study_plan: extract("---STUDY_PLAN---", null)
    };

    // ================= FORMAT VALIDATION =================

    const allEmpty = Object.values(sections).every(
      (section) => !section || section.length < 20
    );

    if (allEmpty) {
      console.error("FORMAT FAILED. RAW OUTPUT:\n", raw);
      throw new Error("Model format invalid");
    }

    return sections;

  } catch (error) {
    console.error("GROQ FULL ERROR:", error.response?.data || error.message);
    throw new Error("AI processing failed");
  }
}