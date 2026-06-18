import { useAuth } from '@context';
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Zap } from "lucide-react";
import { api } from '@services/api';

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await api.auth.login(email.trim(), password);
      if (res.success && res.data) {
        const { user, accessToken, refreshToken, token } = res.data;
        const usedToken = accessToken ?? token;
        const normalizedRole = user.role ? user.role.name : "User";

        login({
          id: user.id,
          name: user.employeeProfile ? user.employeeProfile.fullName : (user.email.split('@')[0]),
          role: normalizedRole,
          email: user.email,
          roleData: user.role
        }, usedToken, refreshToken);

        navigate("/");
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-[#f8f9fd] dark:bg-[#070913] overflow-hidden transition-colors duration-300 relative">

      {/* Left Column - Form */}
      <div className="h-full flex flex-col justify-center items-center px-6 sm:px-12 md:px-16 lg:px-24 py-6 z-10 bg-gradient-to-br from-[#f3f6fc] to-[#e6ecf8] relative overflow-hidden">

        {/* Subtle background glow matching illustration colors */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00d2ff]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#4f46e5]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md space-y-8 z-10">

          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-black tracking-wider text-slate-800 uppercase">
              LOGIN
            </h1>
            <p className="text-xs font-bold text-[#2563eb] uppercase tracking-widest">
              ERP & LOGISTICS HUB
            </p>
            <p className="text-xs font-medium text-slate-500 max-w-[280px] mx-auto leading-relaxed">
              Enter your credentials to access the central trading control panel.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2563eb] transition-colors">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-14 pr-5 py-4 bg-white border border-slate-300 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] hover:border-slate-400 text-sm font-medium transition-all shadow-[0_2px_6px_rgba(0,0,0,0.03)]"
                placeholder="Username / Email"
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2563eb] transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-14 pr-12 py-4 bg-white border border-slate-300 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] hover:border-slate-400 text-sm font-medium transition-all shadow-[0_2px_6px_rgba(0,0,0,0.03)]"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-[#2563eb] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-[#00d2ff] via-[#2563eb] to-[#4f46e5] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/10 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed relative text-center uppercase tracking-wider"
              >
                <span className={isLoading ? "opacity-0" : "opacity-100"}>Login Now</span>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Right Column - Full-Screen Illustration */}
      <div className="hidden md:block relative w-full h-full bg-[#070913] overflow-hidden select-none">
        <img
          src="/erp_illustration.png"
          alt="Trading ERP Dashboard"
          className="w-full h-full object-cover object-center"
        />
      </div>

    </div>
  );
};

export default LoginPage;
