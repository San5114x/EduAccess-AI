export default function Studio() {
  return (
    <div className="min-h-screen bg-black text-white p-12">

      <h1 className="text-3xl font-bold mb-8">
        🎓 Lesson Studio
      </h1>

      <textarea
        placeholder="Paste your lesson content here..."
        className="w-full h-48 bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-300"
      />

      <button className="mt-6 bg-blue-600 px-8 py-3 rounded-lg hover:bg-blue-500 transition">
        Transform with AI
      </button>

    </div>
  )
}