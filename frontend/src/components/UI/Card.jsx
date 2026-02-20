export default function Card({ children }) {
  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800 transition hover:scale-[1.01]">
      {children}
    </div>
  );
}