import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, MailIcon, LoaderIcon, LockIcon, EyeIcon, EyeOffIcon, SparklesIcon, UsersIcon, MessageSquareIcon } from "lucide-react";
import { Link } from "react-router";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl md:h-[800px] h-[650px]">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col md:flex-row">
            
            {/* LEFT SIDE - FORM */}
            <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-purple-500/30">
              <div className="w-full max-w-md">
                
                {/* HEADER LOGO */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-xl animate-pulse">
                    <MessageCircleIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    BlinkChat
                  </span>
                  <SparklesIcon className="w-4 h-4 text-yellow-400 animate-ping" />
                </div>

                {/* HEADING TEXT */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                  <p className="text-purple-300">Login to access your account</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="auth-input-label">Email</label>
                    <div className="relative">
                      <MailIcon className="auth-input-icon" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input"
                        placeholder="johndoe@gmail.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="auth-input-label">Password</label>
                    <div className="relative">
                      <LockIcon className="auth-input-icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300"
                      >
                        {showPassword ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <button className="auth-btn" type="submit" disabled={isLoggingIn}>
                    {isLoggingIn ? (
                      <LoaderIcon className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link to="/signup" className="auth-link">
                    Don't have an account? Sign Up
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - SIMPLE WELCOME STATS */}
            <div className="hidden md:w-1/2 md:flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/30 to-transparent">
              <div className="text-center px-8">
                
                {/* Simple Icon */}
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <UsersIcon className="w-10 h-10 text-white" />
                </div>
                
                {/* Welcome Message */}
                <h3 className="text-2xl font-bold text-white mb-3">
                  Welcome to BlinkChat
                </h3>
                <p className="text-purple-300 mb-8">
                  Join thousands of users chatting in real-time
                </p>
                
                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-300 text-sm">Active Users</span>
                    </div>
                    <span className="text-white font-bold">10,000+</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <MessageSquareIcon className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-300 text-sm">Messages Sent</span>
                    </div>
                    <span className="text-white font-bold">1M+</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-300 text-sm">Happy Users</span>
                    </div>
                    <span className="text-white font-bold">99%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}

export default LoginPage;