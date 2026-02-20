import { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import { generateQuiz } from "../../services/api";

export default function ADHDMode({ data }) {

  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const decayRef = useRef(null);
  const quizCooldownRef = useRef(false);

  const [tracking, setTracking] = useState(false);
  const [attention, setAttention] = useState(100);
  const [points, setPoints] = useState(50);
  const [quiz, setQuiz] = useState(null);
  const [warning, setWarning] = useState(false);
  const [answered, setAnswered] = useState(false);

  // ================= SMART ADHD QUIZ =================
  const triggerQuiz = async () => {
    try {
      const smartPrompt = `
Generate a very short ADHD-friendly focus check from this content.

Include:
1. One sentence recall question.
2. One keyword identification question.
3. One True/False question.

Rules:
- Keep each question under 15 words.
- Very simple language.
- Format clearly as bullet points.

Content:
${data}
`;

      const q = await generateQuiz(smartPrompt);

      const result =
        q?.question ||
        q?.result?.question ||
        q?.result ||
        q;

      if (result) {
        setQuiz(result);
        setAnswered(false);
      }

    } catch (err) {
      console.error("Quiz error:", err);
    }
  };

  // ================= FACE TRACKING =================
  useEffect(() => {
    if (!tracking) return;

    let faceMesh;

    const init = async () => {

      faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      faceMesh.onResults((results) => {

        if (!results.multiFaceLandmarks?.length) {
          setAttention(a => Math.max(0, a - 2));
          return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const eyeCenterX = (leftEye.x + rightEye.x) / 2;

        const faceCentered =
          eyeCenterX > 0.4 &&
          eyeCenterX < 0.6;

        if (faceCentered) {
          setAttention(a => Math.min(100, a + 1));
          setPoints(p => Math.min(100, p + 1));
        } else {
          setAttention(a => Math.max(0, a - 2));
        }
      });

      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current.readyState === 4) {
            await faceMesh.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });

      cameraRef.current.start();
    };

    init();

    decayRef.current = setInterval(() => {
      setAttention(a => Math.max(0, a - 1));
    }, 6000);

    return () => {
      cameraRef.current?.stop();
      clearInterval(decayRef.current);
    };

  }, [tracking]);

  // ================= WARNING + QUIZ =================
  useEffect(() => {

    if (attention < 40 && !quizCooldownRef.current) {

      setWarning(true);
      triggerQuiz();

      quizCooldownRef.current = true;

      setTimeout(() => {
        quizCooldownRef.current = false;
      }, 20000);

    } else if (attention >= 40) {
      setWarning(false);
    }

  }, [attention]);

  const handleQuizComplete = () => {
    if (!answered) {
      setPoints(p => Math.min(100, p + 5));
      setAttention(a => Math.min(100, a + 10));
      setAnswered(true);
    }
  };

  const handleFocusBoost = () => {
    setAttention(a => Math.min(100, a + 15));
    setPoints(p => Math.min(100, p + 10));
  };

  // ================= UI =================
  return (
    <div className="space-y-8">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-orange-600">
          🧠 AI Attention Detection Mode
        </h2>

        <button
          onClick={() => setTracking(!tracking)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg"
        >
          {tracking ? "Stop Tracking" : "Start AI Tracking"}
        </button>
      </div>

      {tracking && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-64 h-48 rounded-lg border shadow"
        />
      )}

      <div>
        <p className="font-medium mb-2">
          Attention Level: {attention}/100
        </p>

        <div className="w-full bg-gray-200 h-4 rounded">
          <div
            className={`h-4 rounded transition-all duration-300 ${
              attention < 40 ? "bg-red-500" : "bg-green-500"
            }`}
            style={{ width: `${attention}%` }}
          />
        </div>

        {warning && (
          <p className="text-red-600 mt-2 text-sm font-medium">
            ⚠ Focus low — Smart Quiz Activated!
          </p>
        )}
      </div>

      <p className="text-green-600 font-semibold">
        ⭐ Focus Points: {points}/100
      </p>

      <button
        onClick={handleFocusBoost}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Boost Focus
      </button>

      {quiz && (
        <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-300">
          <h3 className="font-semibold mb-3">
            📝 Smart Focus Check
          </h3>

          <div className="whitespace-pre-wrap text-sm mb-4">
            {quiz}
          </div>

          <button
            onClick={handleQuizComplete}
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            I Answered
          </button>
        </div>
      )}

      <div className="text-sm font-medium mt-4">
        Adaptive Mode: {
          attention < 25 ? "Ultra Simplified" :
          attention < 40 ? "Micro Learning" :
          attention < 60 ? "Highlighted" :
          "Normal"
        }
      </div>

    </div>
  );
}