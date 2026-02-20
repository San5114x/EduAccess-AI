import Card from "../UI/Card";

export default function DyslexiaMode({ data }) {
  if (!data) {
    return (
      <Card>
        <p className="dyslexic-text">No content available yet. Try transforming some text!</p>
      </Card>
    );
  }

  // Logic: Splits the content into blocks for easier focus
  const lines = data.split("\n").filter(Boolean);

  return (
    <div className="animate-fadeIn">
      <Card>
        <h2 className="text-3xl font-bold mb-8 text-orange-600 dyslexic-text">
          🔤 Dyslexia Mode (OpenDyslexic)
        </h2>

        <div className="space-y-10">
          {lines.map((line, index) => (
            <div
              key={index}
              className="bg-yellow-50 p-10 rounded-2xl border-2 border-yellow-200 shadow-md dyslexic-text"
            >
              {/* Replaces dashes with clear bullet points for better scanning */}
              {line.replace("-", "•")}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}