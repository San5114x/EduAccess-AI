export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-10 py-5 border-b border-gray-800">
      <h1 className="text-xl font-bold text-blue-400">
        EduAccess AI
      </h1>

      <div className="space-x-6 text-gray-300">
        <a href="#" className="hover:text-white">Features</a>
        <a href="#" className="hover:text-white">Pricing</a>
        <a href="#" className="hover:text-white">Docs</a>
        <button className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 transition">
          Get Started
        </button>
      </div>
    </nav>
  )
}