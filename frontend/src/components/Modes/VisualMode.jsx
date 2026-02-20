import { useState, useEffect, useRef } from "react";
import { askAgent } from "../../services/api";

export default function VisualMode({ data, attentionLevel }) {

  const [speaking, setSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [personality, setPersonality] = useState("friendly");
  const [listening, setListening] = useState(false);
  const [agentActive, setAgentActive] = useState(false);
  const [accessibilityScore, setAccessibilityScore] = useState(0);
  const [status, setStatus] = useState("Idle");

  const recognitionRef = useRef(null);

  // ================= ADHD-AWARE PERSONALITY =================
  useEffect(() => {
    if (!attentionLevel) return;

    if (attentionLevel < 25) setPersonality("motivational");
    else if (attentionLevel < 40) setPersonality("simple");
    else setPersonality("friendly");

  }, [attentionLevel]);

  // ================= LOAD VOICES =================
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(v => v.name.includes("Google UK English Female")) ||
        voices.find(v => v.name.includes("Samantha")) ||
        voices.find(v => v.lang === "en-US") ||
        voices[0];

      setSelectedVoice(preferred);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // ================= ACCESSIBILITY SCORE =================
  useEffect(() => {
    if (!data) return;

    const sentences = data.split(/[.!?]+/).filter(Boolean);
    const words = data.split(/\s+/).filter(Boolean);
    const bullets = (data.match(/•|-/g) || []).length;

    const avgSentenceLength = words.length / (sentences.length || 1);

    let score = 100;

    if (avgSentenceLength > 20) score -= 20;
    else score -= avgSentenceLength;

    score += bullets * 2;
    if (sentences.length < 3) score -= 10;

    setAccessibilityScore(
      Math.max(30, Math.min(100, Math.round(score)))
    );
  }, [data]);

  // ================= SPEAK FUNCTION =================
  const speak = (text) => {
    if (!text) return;

    // Stop mic before speaking
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // 🎭 Personality-based emotion
    if (personality === "motivational") {
      utterance.rate = 0.95;
      utterance.pitch = 1.25;
    } else if (personality === "simple") {
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
    } else if (personality === "strict") {
      utterance.rate = 0.9;
      utterance.pitch = 0.95;
    } else {
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
    }

    utterance.voice = selectedVoice;

    utterance.onstart = () => {
      setSpeaking(true);
      setListening(false);
      setStatus("Speaking...");
    };

    utterance.onend = () => {
      setSpeaking(false);

      if (agentActive) {
        // Delay prevents Chrome recognition crash
        setTimeout(() => {
          startListening();
        }, 500);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // ================= START LISTENING =================
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Please use Google Chrome for voice support.");
      return;
    }

    recognitionRef.current?.stop();

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setStatus("Listening...");
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (event) => {
      console.log("Recognition error:", event.error);
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;

      setStatus("Thinking...");

      try {
        const res = await askAgent(transcript, data, personality);
        const answer = res?.answer || "Sorry, I couldn't respond.";

        speak(answer);

      } catch (err) {
        console.error(err);
        speak("AI failed to respond.");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // ================= AGENT CONTROL =================
  const startAgent = () => {
    setAgentActive(true);
    speak("Hello. I am your AI tutor. Ask me anything about this lesson.");
  };

  const stopAgent = () => {
    setAgentActive(false);
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    setListening(false);
    setSpeaking(false);
    setStatus("Stopped");
  };

  // ================= UI =================
  return (
    <div className="space-y-8">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-blue-600">
          🎙 Voice AI Tutor Mode
        </h2>

        {agentActive ? (
          <button
            onClick={stopAgent}
            className="bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Stop Agent
          </button>
        ) : (
          <button
            onClick={startAgent}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Start Voice Agent
          </button>
        )}
      </div>

      {/* Accessibility Score */}
      <div className="p-4 rounded-xl bg-gray-100 border">
        <div className="flex justify-between items-center">
          <span className="font-medium">🎯 Accessibility Score</span>
          <span className="font-bold">{accessibilityScore}%</span>
        </div>

        <div className="w-full bg-gray-200 h-3 rounded mt-2">
          <div
            className="h-3 bg-green-500 rounded transition-all duration-500"
            style={{ width: `${accessibilityScore}%` }}
          />
        </div>
      </div>

      {/* STATUS PANEL */}
      <div className="p-6 bg-gray-100 rounded-xl border text-center">
        <p className="text-lg font-medium">
          Status: {status}
        </p>

        {listening && (
          <div className="mt-4 animate-pulse text-blue-600">
            🎤 Listening...
          </div>
        )}

        {speaking && (
          <div className="mt-4 animate-pulse text-purple-600">
            🔊 Speaking...
          </div>
        )}
      </div>

      {/* LESSON CONTENT */}
      <div className="whitespace-pre-wrap text-gray-700 leading-7">
        {data}
      </div>

    </div>
  );
}