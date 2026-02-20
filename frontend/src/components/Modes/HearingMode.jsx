import Card from "../UI/Card";
import { useState, useRef, useEffect } from "react";

const ASL = {
  A:"🤜",B:"✋",C:"🤏",D:"☝️",E:"🤛",F:"👌",G:"👉",H:"🤙",I:"🤙",J:"🤙",
  K:"✌️",L:"🤙",M:"✊",N:"✊",O:"👌",P:"👇",Q:"👇",R:"✌️",S:"✊",T:"✊",
  U:"✌️",V:"✌️",W:"🖖",X:"☝️",Y:"🤙",Z:"☝️"," ":" "
};

export default function HearingMode({ data }) {

  const [showSign, setShowSign] = useState(false);
  const [letters, setLetters] = useState([]);
  const [current, setCurrent] = useState(-1);

  const intervalRef = useRef(null);

  if (!data) {
    return (
      <Card>
        <p className="text-gray-400">No content available.</p>
      </Card>
    );
  }

  const animate = (text) => {
    const chars = text.toUpperCase().split("");
    setLetters(chars);
    setCurrent(-1);

    let i = 0;
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setCurrent(i);
      i++;
      if (i >= chars.length) clearInterval(intervalRef.current);
    }, 180); // slightly smoother speed
  };

  useEffect(() => {
    if (showSign) {
      animate(data);
    } else {
      clearInterval(intervalRef.current);
      setLetters([]);
      setCurrent(-1);
    }

    return () => clearInterval(intervalRef.current);
  }, [showSign]);

  return (
    <Card>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-purple-500">
          👂 Hearing Support Mode
        </h2>

        <button
          onClick={() => setShowSign(!showSign)}
          className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          {showSign ? "Hide Sign" : "Convert to Sign"}
        </button>
      </div>

      {/* AI Generated Text */}
      {!showSign && (
        <div className="whitespace-pre-wrap leading-8 text-gray-200 text-[15px] mb-10">
          {data}
        </div>
      )}

      {/* SIGN LANGUAGE DISPLAY */}
      {showSign && (
        <div className="flex flex-wrap gap-4 text-3xl animate-fadeIn">
          {letters.map((letter, index) => (
            <div
              key={index}
              className={`p-3 rounded ${
                index === current
                  ? "bg-purple-600 scale-125"
                  : "bg-gray-800"
              } transition duration-200`}
            >
              {ASL[letter] || letter}
            </div>
          ))}
        </div>
      )}

    </Card>
  );
}