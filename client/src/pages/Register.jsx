import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError("");
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await register(form.name, form.email, form.password, file);
      if (res.success) navigate("/");
      else setError(res.message);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#09090B]">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center">
        {/* Gradient BG */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#09090B] via-[#1a0a10] to-[#09090B]" />

        {/* Glow blobs */}
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-[#F84565] opacity-10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#F84565] opacity-8 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />

        {/* Film strip decoration */}
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
          <div className="flex items-center mb-10">
            <span className="text-[#F84565] text-4xl font-black">Q</span>
            <span className="text-white text-3xl font-bold tracking-tight">uickShow</span>
          </div>

          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Join the World of<br />
            <span className="text-[#F84565]">Cinema Magic</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed max-w-xs">
            Create your account today and start booking seats for the latest blockbusters instantly.
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-6 w-full max-w-xs">
            {[
              { num: "500+", label: "Movies" },
              { num: "50+", label: "Theaters" },
              { num: "1M+", label: "Bookings" },
            ].map(({ num, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-[#F84565] text-2xl font-bold">{num}</span>
                <span className="text-gray-500 text-xs mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#09090B] to-transparent" />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
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
            <div className="mb-7">
              <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
              <p className="text-gray-400 text-sm">Join QuickShow and start booking today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Picture Upload */}
              <div className="flex items-center gap-4 mb-2">
                <label htmlFor="register-avatar" className="cursor-pointer group relative">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 group-hover:border-[#F84565]/60 transition-colors duration-200 flex items-center justify-center overflow-hidden bg-white/5">
                    {preview ? (
                      <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-gray-600 group-hover:text-[#F84565] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                  <input
                    id="register-avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <div>
                  <p className="text-white text-sm font-medium">Profile Photo</p>
                  <p className="text-gray-500 text-xs">Click to upload · Max 10MB</p>
                  {preview && (
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-xs text-[#F84565] hover:underline mt-0.5"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                <input
                  id="register-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#F84565] transition-all duration-200"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                <input
                  id="register-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#F84565] transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={show ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#F84565] transition-all duration-200 pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#F84565] text-xs font-medium transition-colors"
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

              {/* Submit */}
              <button
                id="register-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 relative overflow-hidden group mt-2"
                style={{ background: "linear-gradient(135deg, #F84565, #D63854)" }}
              >
                <span className="relative z-10">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-600 text-xs">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-[#F84565] font-semibold hover:underline transition-all"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
