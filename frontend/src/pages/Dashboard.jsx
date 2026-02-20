import { useState } from "react";
import { transformContent } from "../services/api";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

import VisualMode from "../components/Modes/VisualMode";
import HearingMode from "../components/Modes/HearingMode";
import DyslexiaMode from "../components/Modes/DyslexiaMode";
import ADHDMode from "../components/Modes/ADHDMode";
import StudyPlanMode from "../components/Modes/StudyPlanMode";

export default function Dashboard() {

  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("visual");

  // ================= PDF UPLOAD =================
  const handlePDFUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Clear old results when new PDF uploaded
      setResult(null);
      setActiveTab("visual");

      const arrayBuffer = await file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let extractedText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map(item => item.str)
          .join(" ");

        extractedText += pageText + "\n\n";
      }

      setInput(extractedText);

      // Reset file input so same file can be uploaded again
      e.target.value = null;

    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to read PDF.");
    }
  };

  // ================= TRANSFORM =================
  const handleTransform = async () => {
    if (!input.trim()) return;

    try {
      setLoading(true);

      const res = await transformContent(input);

      if (!res?.result) {
        alert("Invalid AI response structure");
        return;
      }

      setResult(res.result);
      setActiveTab("visual");

    } catch (err) {
      console.error(err);
      alert("AI failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* NAVBAR */}
      <div className="bg-white shadow-sm border-b px-10 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600 tracking-tight">
          EduAccess AI
        </h1>
        <span className="text-sm text-gray-500">
          Accessibility Learning Platform
        </span>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* HERO */}
        <div className="mb-10">
          <h2 className="text-4xl font-semibold mb-3">
            Transform Learning For Everyone
          </h2>
          <p className="text-gray-600 text-lg">
            AI-powered accessibility tools for visual, hearing, dyslexia and ADHD support.
          </p>
        </div>

        {/* INPUT CARD */}
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200">

          <textarea
            className="w-full bg-gray-100 p-5 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            rows="6"
            placeholder="Paste lesson content here or upload a PDF..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="flex gap-4 flex-wrap">

            <button
              onClick={handleTransform}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              {loading ? "Processing..." : "Transform"}
            </button>

            <label className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition cursor-pointer">
              📄 Upload PDF
              <input
                type="file"
                accept="application/pdf"
                hidden
                onChange={handlePDFUpload}
              />
            </label>

          </div>

        </div>

        {/* RESULTS SECTION */}
        {result && (
          <div className="mt-12">

            <div className="flex gap-4 flex-wrap mb-8 border-b pb-4">
              {["visual","hearing","dyslexia","adhd","study_plan"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === tab
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {tab.replace("_"," ").toUpperCase()}
                </button>
              ))}
            </div>

            <div className="bg-white p-10 rounded-2xl shadow-md border border-gray-200 transition-all duration-300">

              {activeTab === "visual" && (
                <VisualMode data={result.visual} />
              )}

              {activeTab === "hearing" && (
                <HearingMode data={result.hearing} />
              )}

              {activeTab === "dyslexia" && (
                <DyslexiaMode data={result.dyslexia} />
              )}

              {activeTab === "adhd" && (
                <ADHDMode data={result.adhd} />
              )}

              {activeTab === "study_plan" && (
                <StudyPlanMode data={result.study_plan} />
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}