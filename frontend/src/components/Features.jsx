export default function Features() {
  const items = [
    {
      title: "Visual Accessibility",
      desc: "Spatial narration and AI-powered TTS for blind learners.",
    },
    {
      title: "Deaf Learning Cards",
      desc: "Symbol-based concept cards with structured visual mapping.",
    },
    {
      title: "Dyslexia Reader",
      desc: "Custom typography, bionic reading, and focus ruler.",
    },
    {
      title: "ADHD Focus Mode",
      desc: "Camera-based attention tracking with gamified learning.",
    },
  ]

  return (
    <section className="px-10 py-24 bg-gray-950">
      <h2 className="text-3xl font-bold text-center mb-16">
        Platform Features
      </h2>

      <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
        {items.map((item, index) => (
          <div
            key={index}
            className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-blue-500 transition"
          >
            <h3 className="text-xl font-semibold mb-4 text-blue-400">
              {item.title}
            </h3>
            <p className="text-gray-400">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}