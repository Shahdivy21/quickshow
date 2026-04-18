import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(form.email, form.password);

      if (res?.success) {
        const { user } = res;

        if (user.isAdmin) {
          navigate("/admin", { replace: true }); // Admin dashboard
        } else if (!user.isAccountVerified) {
          navigate("/"); // Redirect to verify page
        } else {
          // ✅ Redirect back to where they came from
          const from = location.state?.from || "/";
          navigate(from, { replace: true });
        }
      } else {
        setError(res?.message || "Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // ✅ Store only when forgot password is clicked
    if (form.email.trim() !== "") {
      sessionStorage.setItem("forgetEmail", form.email);
    } else {
      sessionStorage.removeItem("forgetEmail");
    }
    navigate("/forgot");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm bg-[#121212] rounded-xl shadow-xl p-6 border border-gray-800 space-y-4">
        <h1 className="text-2xl font-bold text-white text-center">Welcome Back</h1>
        <p className="text-center text-gray-400 text-sm">Sign in to access your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            required
            className="w-full px-3 py-2 rounded-lg bg-[#1c1c1c] text-white border border-gray-700 focus:ring-2 focus:ring-pink-500 placeholder-gray-500"
          />

          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
              required
              className="w-full px-3 py-2 rounded-lg bg-[#1c1c1c] text-white border border-gray-700 focus:ring-2 focus:ring-pink-500 placeholder-gray-500"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 text-xs"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>

          {error && <p className="text-pink-500 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <button onClick={handleForgotPassword} className="hover:text-pink-500">
            Forgot password?
          </button>
          <button onClick={() => navigate("/register")} className="hover:text-pink-500">
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
