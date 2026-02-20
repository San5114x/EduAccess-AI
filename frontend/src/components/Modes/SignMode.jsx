import { useState, useRef, useEffect } from "react";

const ASL = {
  A:"🤜",B:"✋",C:"🤏",D:"☝️",E:"🤛",F:"👌",G:"👉",H:"🤙",I:"🤙",J:"🤙",
  K:"✌️",L:"🤙",M:"✊",N:"✊",O:"👌",P:"👇",Q:"👇",R:"✌️",S:"✊",T:"✊",
  U:"✌️",V:"✌️",W:"🖖",X:"☝️",Y:"🤙",Z:"☝️"," ":" "
};

export default function SignMode() {

  const [text, setText] = useState("");
  const [letters, setLetters] = useState([]);
  const [current, setCurrent] = useState(-1);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);
  const intervalRef = useRef(null);

  const animate = (word) => {
    const chars = word.toUpperCase().split("");
    setLetters(chars);
    setCurrent(-1);

    let i = 0;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent(i);
      i++;
      if (i >= chars.length) clearInterval(intervalRef.current);
    }, 250);
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported (use Chrome)");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
      animate(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="bg-gray-900 p-6 rounded-xl">

      <h2 className="text-2xl font-bold mb-4 text-purple-400">
        🤟 Voice → Sign Language
      </h2>

      <div className="flex gap-4 mb-4">
        <button
          onClick={listening ? stopListening : startListening}
          className="bg-purple-600 px-4 py-2 rounded-lg"
        >
          {listening ? "Stop Listening" : "Start Voice Input"}
        </button>

        <button
          onClick={() => animate(text)}
          className="bg-gray-700 px-4 py-2 rounded-lg"
        >
          Animate Text
        </button>
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type text to animate..."
        className="w-full p-3 bg-gray-800 rounded mb-6"
      />

      <div className="flex flex-wrap gap-4 text-3xl">
        {letters.map((letter, index) => (
          <div
            key={index}
            className={`p-3 rounded ${
              index === current ? "bg-purple-600 scale-125" : "bg-gray-800"
            } transition`}
          >
            {ASL[letter] || letter}
          </div>
        ))}
      </div>
    </div>
  );
}