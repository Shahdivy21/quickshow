import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // Step 1: email, Step 2: OTP + new password
  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  // Load stored email from sessionStorage (set in Login.jsx)
  useEffect(() => {
    const storedEmail = sessionStorage.getItem("forgetEmail");
    if (storedEmail) {
      setForm((prev) => ({ ...prev, email: storedEmail }));
    }
  }, []);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:3000/api/auth/send-reset-otp",
        { email: form.email },
        { withCredentials: true }
      );

      if (res.data.success) {
        setStep(2);
        toast.success("OTP sent to your email!");
        // Save temporarily for OTP step
        sessionStorage.setItem("forgetEmail", form.email);
      } else {
        toast.error(res.data.message || "Failed to send OTP");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:3000/api/auth/reset-password",
        { email: form.email, otp: form.otp, newPassword: form.newPassword },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success("Password changes successfully!");
        
        // Clear stored email for security
        sessionStorage.removeItem("forgetEmail");

        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast.error(res.data.message || "Wrong OTP or reset failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Wrong OTP or reset failed");
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
            Reset Password,<br />
            <span className="text-[#F84565]">Secure Account</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed max-w-xs">
            Lost your access? Follow the steps to get back to booking your favorite movies.
          </p>

          {/* Feature pills */}
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
             <span className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#F84565]/30 text-[#F84565] bg-[#F84565]/10 backdrop-blur-sm">
                📧 Fast OTP verification
             </span>
             <span className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#F84565]/30 text-[#F84565] bg-[#F84565]/10 backdrop-blur-sm">
                🔒 Safe & encrypted
             </span>
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
              <h1 className="text-3xl font-bold text-white mb-2">Forgot Password</h1>
              <p className="text-gray-400 text-sm">
                {step === 1
                  ? "Enter your email to receive a secure OTP"
                  : "Enter the OTP sent to your email and a new password"}
              </p>
            </div>

            <form onSubmit={step === 1 ? handleSendOtp : handleResetPassword} className="space-y-5">
              {/* Email (Always shown but disabled in step 2) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  disabled={step === 2}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#F84565] focus:bg-white/8 transition-all duration-200 ${step === 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>

              {step === 2 && (
                <>
                  {/* OTP */}
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">One-Time Password (OTP)</label>
                    <input
                      id="reset-otp"
                      type="text"
                      value={form.otp}
                      onChange={(e) => setForm({ ...form, otp: e.target.value })}
                      placeholder="Enter 6-digit OTP"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#F84565] focus:bg-white/8 transition-all duration-200"
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <input
                        id="reset-new-password"
                        type={show ? "text" : "password"}
                        value={form.newPassword}
                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
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
                </>
              )}

              {/* Submit */}
              <button
                id="reset-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 relative overflow-hidden group mt-4"
                style={{ background: "linear-gradient(135deg, #F84565, #D63854)" }}
              >
                <span className="relative z-10">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                       <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {step === 1 ? "Sending OTP..." : "Resetting Password..."}
                    </span>
                  ) : step === 1 ? (
                    "Send OTP to Email"
                  ) : (
                    "Confirm Reset"
                  )}
                </span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Navigate back to login */}
            <p className="text-center text-sm text-gray-500">
              Remember your password?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-[#F84565] font-semibold hover:underline transition-all"
              >
                Back to Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
