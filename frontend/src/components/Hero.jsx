import { useNavigate } from "react-router-dom"

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className="text-center py-32 px-6">
      ...
      <button
        onClick={() => navigate("/dashboard")}
        className="bg-blue-600 px-8 py-4 rounded-xl text-lg hover:bg-blue-500 transition"
      >
        Launch Platform 🚀
      </button>
    </section>
  )
}