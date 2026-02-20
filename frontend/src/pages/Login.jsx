import { useState } from "react";
import { loginUser } from "../services/api";

export default function Login({ onLogin }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await loginUser(email, password);
    localStorage.setItem("token", res.data.token);
    onLogin();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">

      <h1 className="text-3xl font-bold mb-6">Login</h1>

      <input
        className="bg-gray-800 p-3 mb-3 rounded"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        className="bg-gray-800 p-3 mb-4 rounded"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleLogin}
        className="bg-blue-600 px-6 py-3 rounded-lg"
      >
        Login
      </button>

    </div>
  );
}