import { useState, useEffect, useRef, useCallback } from "react";

// ─── Waveform bars ────────────────────────────────────────────────────────────
function WaveBar({ active, delay = 0 }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 4,
        borderRadius: 99,
        background: active ? "#a78bfa" : "#4b5563",
        animationName: active ? "wave" : "none",
        animationDuration: "0.8s",
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationDelay: `${delay}s`,
        height: active ? undefined : 6,
        minHeight: 6,
        maxHeight: 32,
        transition: "background 0.3s",
      }}
    />
  );
}

function Waveform({ active, bars = 18 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 36 }}>
      <style>{`
        @keyframes wave {
          0%,100% { height: 6px }
          50% { height: 32px }
        }
      `}</style>
      {Array.from({ length: bars }, (_, i) => (
        <WaveBar key={i} active={active} delay={(i % 5) * 0.12} />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VisualMode({ data }) {
  const [speaking, setSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [accessibilityScore, setAccessibilityScore] = useState(0);

  // Voice agent state
  const [agentListening, setAgentListening] = useState(false);
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState([]); // {role, text}
  const [error, setError] = useState(null);

  const hasSpokenRef = useRef(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ── Auto-scroll messages ────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Load TTS voices ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.name.includes("Google US English")) ||
        voices.find((v) => v.name.includes("Microsoft Aria")) ||
        voices.find((v) => v.name.includes("Samantha")) ||
        voices.find((v) => v.lang === "en-US") ||
        voices[0];
      setSelectedVoice(preferred);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // ── Accessibility score ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!data) return;
    const sentences = data.split(/[.!?]+/).filter(Boolean);
    const words = data.split(/\s+/).filter(Boolean);
    const avg = words.length / (sentences.length || 1);
    let score = 100;
    if (avg > 20) score -= 20;
    else score -= avg;
    setAccessibilityScore(Math.max(30, Math.min(100, Math.round(score))));
  }, [data]);

  // ── Auto-read content on load ───────────────────────────────────────────────
  useEffect(() => {
    if (!data || !selectedVoice || hasSpokenRef.current) return;
    hasSpokenRef.current = true;
    window.speechSynthesis.cancel();
    const sentences = data.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [data];
    let idx = 0;
    const speakNext = () => {
      if (idx >= sentences.length) { setSpeaking(false); return; }
      const utt = new SpeechSynthesisUtterance(sentences[idx]);
      utt.rate = 0.85; utt.pitch = 1.0; utt.volume = 1;
      utt.voice = selectedVoice;
      utt.onstart = () => setSpeaking(true);
      utt.onend = () => { idx++; setTimeout(speakNext, 300); };
      window.speechSynthesis.speak(utt);
    };
    speakNext();
    return () => { window.speechSynthesis.cancel(); hasSpokenRef.current = false; };
  }, [data, selectedVoice]);

  // ── Speak AI reply ──────────────────────────────────────────────────────────
  const speakText = useCallback((text) => {
    if (!selectedVoice) return;
    window.speechSynthesis.cancel();
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    let idx = 0;
    const speakNext = () => {
      if (idx >= sentences.length) { setAgentSpeaking(false); return; }
      const utt = new SpeechSynthesisUtterance(sentences[idx]);
      utt.rate = 0.9; utt.pitch = 1.05; utt.volume = 1;
      utt.voice = selectedVoice;
      utt.onstart = () => setAgentSpeaking(true);
      utt.onend = () => { idx++; setTimeout(speakNext, 250); };
      window.speechSynthesis.speak(utt);
    };
    speakNext();
  }, [selectedVoice]);

  // ── Query Claude ────────────────────────────────────────────────────────────
  const askClaude = useCallback(async (userText) => {
    setAgentThinking(true);
    setError(null);

    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.text })),
      { role: "user", content: userText },
    ];

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are an intelligent voice assistant helping a user understand the following content. 
Keep answers clear, concise, and accessible. Speak in a warm, natural tone as if in conversation.
CONTENT:
${data}`,
          messages: history,
        }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error.message);

      const reply = json.content?.find((b) => b.type === "text")?.text || "I couldn't generate a response.";

      setMessages((prev) => [
        ...prev,
        { role: "user", text: userText },
        { role: "assistant", text: reply },
      ]);

      setAgentThinking(false);
      speakText(reply);
    } catch (err) {
      setAgentThinking(false);
      setError(err.message);
    }
  }, [data, messages, speakText]);

  // ── Start mic listening ─────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    // Stop ongoing TTS so it doesn't interfere
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setAgentSpeaking(false);

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => { setAgentListening(true); setTranscript(""); };

    recognition.onresult = (e) => {
      const interim = Array.from(e.results).map((r) => r[0].transcript).join("");
      setTranscript(interim);
    };

    recognition.onend = () => {
      setAgentListening(false);
      const final = recognitionRef.current?._lastTranscript;
      if (final?.trim()) {
        setTranscript("");
        askClaude(final.trim());
      } else {
        setTranscript("");
      }
    };

    recognition.onerror = (e) => {
      setAgentListening(false);
      if (e.error !== "no-speech") setError(`Mic error: ${e.error}`);
    };

    // Capture final transcript before onend fires
    recognition.addEventListener("result", (e) => {
      if (e.results[e.results.length - 1].isFinal) {
        recognition._lastTranscript = Array.from(e.results).map((r) => r[0].transcript).join("");
      }
    });

    recognition.start();
  }, [askClaude]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // ── Status label ────────────────────────────────────────────────────────────
  const statusLabel = agentListening
    ? "Listening…"
    : agentThinking
    ? "Thinking…"
    : agentSpeaking
    ? "Speaking…"
    : speaking
    ? "Reading content…"
    : "Ask me anything";

  const isActive = agentListening || agentThinking || agentSpeaking || speaking;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Georgia', serif", maxWidth: 780, margin: "0 auto", padding: "24px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Source+Serif+4:ital,wght@0,300;0,400;1,300&display=swap');
        .vm-root { font-family: 'Source Serif 4', Georgia, serif; }
        .vm-title { font-family: 'Playfair Display', Georgia, serif; }
        .vm-bubble-user {
          background: linear-gradient(135deg, #1e1b4b, #312e81);
          color: #e0e7ff;
          border-radius: 18px 18px 4px 18px;
          padding: 12px 16px;
          max-width: 75%;
          align-self: flex-end;
          font-size: 14px;
          line-height: 1.6;
          box-shadow: 0 4px 14px rgba(99,102,241,0.25);
        }
        .vm-bubble-ai {
          background: #1c1917;
          border: 1px solid #292524;
          color: #e7e5e4;
          border-radius: 18px 18px 18px 4px;
          padding: 12px 16px;
          max-width: 80%;
          align-self: flex-start;
          font-size: 14px;
          line-height: 1.7;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        }
        .vm-mic-btn {
          border: none;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .vm-mic-btn:hover { transform: scale(1.06); }
        .vm-mic-btn:active { transform: scale(0.97); }
        .vm-pulse {
          animation: vmPulse 1.4s ease-in-out infinite;
        }
        @keyframes vmPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(167,139,250,0.5); }
          50% { box-shadow: 0 0 0 14px rgba(167,139,250,0); }
        }
      `}</style>

      <div className="vm-root">

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 className="vm-title" style={{ fontSize: 26, color: "#1c1917", margin: 0, fontWeight: 700 }}>
              👁 Visual Learning Mode
            </h2>
            <p style={{ color: "#78716c", margin: "4px 0 0", fontSize: 13 }}>
              AI Voice Agent · Speak to explore the content
            </p>
          </div>
          {(speaking || agentSpeaking) && (
            <span style={{ fontSize: 12, color: "#7c3aed", background: "#ede9fe", padding: "4px 10px", borderRadius: 99, fontWeight: 600 }}>
              🔊 {speaking ? "Reading…" : "Responding…"}
            </span>
          )}
        </div>

        {/* ── Accessibility Score ── */}
        <div style={{
          background: "#fafaf9", border: "1px solid #e7e5e4",
          borderRadius: 14, padding: "14px 18px", marginBottom: 24
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#292524" }}>🎯 Accessibility Score</span>
            <span style={{ fontWeight: 700, color: accessibilityScore >= 80 ? "#16a34a" : accessibilityScore >= 60 ? "#d97706" : "#dc2626" }}>
              {accessibilityScore}%
            </span>
          </div>
          <div style={{ background: "#e7e5e4", borderRadius: 99, height: 8 }}>
            <div style={{
              height: 8, borderRadius: 99,
              background: accessibilityScore >= 80 ? "#22c55e" : accessibilityScore >= 60 ? "#f59e0b" : "#ef4444",
              width: `${accessibilityScore}%`,
              transition: "width 0.6s cubic-bezier(.4,0,.2,1)"
            }} />
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{
          color: "#44403c", lineHeight: 1.85, fontSize: 15.5,
          background: "#fffcf9", border: "1px solid #f5f0eb",
          borderRadius: 14, padding: "20px 22px", marginBottom: 28,
          whiteSpace: "pre-wrap",
        }}>
          {data}
        </div>

        {/* ── AI Voice Agent Panel ── */}
        <div style={{
          background: "#0c0a09", borderRadius: 20,
          border: "1px solid #1c1917", overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.35)"
        }}>

          {/* Panel header */}
          <div style={{
            padding: "14px 20px",
            borderBottom: "1px solid #1c1917",
            display: "flex", alignItems: "center", gap: 10
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: isActive ? "#a78bfa" : "#44403c",
              transition: "background 0.3s",
              boxShadow: isActive ? "0 0 8px #a78bfa" : "none"
            }} />
            <span style={{ color: "#a8a29e", fontSize: 13, fontFamily: "monospace" }}>
              voice-agent · {statusLabel}
            </span>
            <div style={{ marginLeft: "auto" }}>
              <Waveform active={agentListening || agentSpeaking} bars={20} />
            </div>
          </div>

          {/* Conversation */}
          <div style={{
            minHeight: 180, maxHeight: 320, overflowY: "auto",
            padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12
          }}>
            {messages.length === 0 && (
              <p style={{ color: "#57534e", fontSize: 13, textAlign: "center", margin: "auto", fontStyle: "italic" }}>
                Press the mic and ask a question about the content above.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "vm-bubble-user" : "vm-bubble-ai"}
                style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.text}
              </div>
            ))}
            {agentThinking && (
              <div className="vm-bubble-ai" style={{ alignSelf: "flex-start", color: "#78716c" }}>
                <span style={{ letterSpacing: 4 }}>···</span>
              </div>
            )}
            {transcript && (
              <div className="vm-bubble-user" style={{ alignSelf: "flex-end", opacity: 0.6, fontStyle: "italic" }}>
                {transcript}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Mic controls */}
          <div style={{
            padding: "16px 20px",
            borderTop: "1px solid #1c1917",
            display: "flex", alignItems: "center", gap: 14
          }}>
            <button
              className={`vm-mic-btn ${agentListening ? "vm-pulse" : ""}`}
              onClick={agentListening ? stopListening : startListening}
              disabled={agentThinking}
              style={{
                width: 56, height: 56, borderRadius: "50%",
                background: agentListening
                  ? "linear-gradient(135deg, #7c3aed, #a78bfa)"
                  : agentThinking
                  ? "#1c1917"
                  : "linear-gradient(135deg, #3730a3, #6d28d9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
                opacity: agentThinking ? 0.5 : 1,
                cursor: agentThinking ? "not-allowed" : "pointer",
              }}
            >
              {agentListening ? "⏹" : agentThinking ? "⏳" : "🎙️"}
            </button>

            <div style={{ flex: 1 }}>
              <p style={{ color: "#a8a29e", fontSize: 12, margin: 0, fontFamily: "monospace" }}>
                {agentListening
                  ? "Listening — tap to stop"
                  : agentThinking
                  ? "Processing your question…"
                  : agentSpeaking
                  ? "Agent is speaking…"
                  : "Tap mic to ask a question"}
              </p>
              {error && (
                <p style={{ color: "#f87171", fontSize: 12, margin: "4px 0 0", fontFamily: "monospace" }}>
                  ⚠ {error}
                </p>
              )}
            </div>

            {messages.length > 0 && (
              <button
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setMessages([]);
                  setAgentSpeaking(false);
                  setError(null);
                }}
                style={{
                  background: "transparent", border: "1px solid #292524",
                  color: "#78716c", borderRadius: 8, padding: "6px 12px",
                  fontSize: 12, cursor: "pointer", fontFamily: "monospace"
                }}
              >
                clear
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
