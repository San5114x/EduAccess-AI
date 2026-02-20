export default function StudyPlanMode({ data }) {

  if (!data) {
    return <p>No study plan generated.</p>;
  }

  return (
    <div className="space-y-6">
      {data.split("\n\n").map((block, index) => (
        <div
          key={index}
          className="bg-blue-50 p-6 rounded-xl border border-blue-200"
        >
          {block}
        </div>
      ))}
    </div>
  );
}