import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
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
          navigate("/admin", { replace: true });
        } else if (!user.isAccountVerified) {
          navigate("/");
        } else {
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
    if (form.email.trim() !== "") {
      sessionStorage.setItem("forgetEmail", form.email);
    } else {
      sessionStorage.removeItem("forgetEmail");
    }
    navigate("/forgot");
  };

  return (
    <div className="min-h-screen flex bg-[#09090B]">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center">
        {/* Gradient BG */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#09090B] via-[#1a0a10] to-[#09090B]" />

        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#F84565] opacity-10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-[#F84565] opacity-10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "1.5s" }} />

        {/* Decorative film strip lines */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-around opacity-10">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="w-8 h-5 mx-auto border-2 border-[#F84565] rounded-sm" />
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-12 flex flex-col justify-around opacity-10">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="w-8 h-5 mx-auto border-2 border-[#F84565] rounded-sm" />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          {/* Logo */}
          <div className="flex items-center mb-10">
            <span className="text-[#F84565] text-4xl font-black">Q</span>
            <span className="text-white text-3xl font-bold tracking-tight">uickShow</span>
          </div>

          {/* Tagline */}
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Your Cinema,<br />
            <span className="text-[#F84565]">Your Experience</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed max-w-xs">
            Book movie tickets instantly. Choose your seats, pick your show — all in one place.
          </p>

          {/* Feature pills */}
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            {["🎬 Now Showing", "🎫 Easy Booking", "💺 Choose Seats", "🍿 All Genres"].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#F84565]/30 text-[#F84565] bg-[#F84565]/10 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#09090B] to-transparent" />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
        {/* Subtle top-right glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F84565] opacity-5 rounded-full blur-[120px]" />

        <div className="w-full max-w-[360px] relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center mb-8 justify-center">
            <span className="text-[#F84565] text-3xl font-black">Q</span>
            <span className="text-white text-2xl font-bold">uickShow</span>
          </div>

          {/* Card */}
          <div className="bg-white/[0.03] border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
              <p className="text-gray-400 text-sm">Sign in to continue to QuickShow</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#F84565] focus:bg-white/8 transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={show ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#F84565] focus:bg-white/8 transition-all duration-200 pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#F84565] text-xs font-medium transition-colors duration-150"
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F84565]/10 border border-[#F84565]/30 rounded-lg">
                  <span className="text-[#F84565] text-xs">⚠ {error}</span>
                </div>
              )}

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-gray-500 hover:text-[#F84565] transition-colors duration-150"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 relative overflow-hidden group"
                style={{ background: "linear-gradient(135deg, #F84565, #D63854)" }}
              >
                <span className="relative z-10">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-600 text-xs">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Sign up link */}
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-[#F84565] font-semibold hover:underline transition-all"
              >
                Create account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
