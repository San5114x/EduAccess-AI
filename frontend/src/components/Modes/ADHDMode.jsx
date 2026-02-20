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
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // ================= QUIZ GENERATION =================
  const triggerQuiz = async () => {
    if (!data || data.trim() === "") return;

    setLoadingQuiz(true);

    try {
      const response = await generateQuiz(data);

      const result =
        response?.question ||
        response?.result?.question ||
        response?.result ||
        response;

      if (result) {
        setQuiz(result);
      } else {
        setQuiz("Unable to generate quiz.");
      }

    } catch (err) {
      console.error("Quiz API failed:", err);
      setQuiz("Quiz generation failed.");
    }

    setLoadingQuiz(false);
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
        const faceCentered = eyeCenterX > 0.4 && eyeCenterX < 0.6;

        if (faceCentered) {
          setAttention(a => Math.min(100, a + 1));
          setPoints(p => Math.min(100, p + 1));
        } else {
          setAttention(a => Math.max(0, a - 2));
        }
      });

      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
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

  // ================= QUIZ TRIGGER =================
  useEffect(() => {
    if (attention < 40 && !quizCooldownRef.current && data) {

      triggerQuiz();

      quizCooldownRef.current = true;

      setTimeout(() => {
        quizCooldownRef.current = false;
      }, 20000);
    }

  }, [attention, data]);

  // ================= OPTION CLICK =================
  const handleOptionClick = () => {
    setPoints(p => Math.min(100, p + 5));
    setAttention(a => Math.min(100, a + 10));
    setQuiz(null);
  };

  const handleFocusBoost = () => {
    setAttention(a => Math.min(100, a + 15));
    setPoints(p => Math.min(100, p + 10));
  };

  // ================= QUIZ PARSER =================
  const renderQuiz = () => {
    if (!quiz) return null;

    // Split into blocks by numbered questions
    const questionBlocks = quiz.split(/\n(?=\d+\.)/);

    return questionBlocks.map((block, i) => {
      const lines = block.split("\n").filter(Boolean);
      if (lines.length < 2) return null;

      const question = lines[0];
      const options = lines.slice(1);

      return (
        <div key={i} className="mb-6">
          <p className="font-medium mb-3">{question}</p>

          <div className="space-y-2">
            {options.map((opt, index) => (
              <button
                key={index}
                onClick={handleOptionClick}
                className="w-full text-left p-2 rounded-lg bg-white border hover:bg-green-100 transition"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    });
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

      {/* Attention Bar */}
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

      {/* Study Content */}
      <div className="mt-6 p-6 bg-white rounded-xl border shadow-sm">
        <h3 className="font-semibold mb-3 text-lg">
          📚 Study Content
        </h3>

        <div className="whitespace-pre-wrap text-gray-700 leading-7">
          {data || "No lesson content available."}
        </div>
      </div>

      {/* Quiz */}
      {loadingQuiz && (
        <div className="text-sm text-gray-500">
          Generating quiz...
        </div>
      )}

      {quiz && (
        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-300">
          <h3 className="font-semibold mb-4">
            📝 Smart Focus Check
          </h3>

          {renderQuiz()}
        </div>
      )}

    </div>
  );
}