import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, LockIcon, MailIcon, UserIcon, LoaderIcon, EyeIcon, EyeOffIcon, SparklesIcon } from "lucide-react";
import { Link } from "react-router";

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isSigningUp } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(formData);
  };

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl md:h-[800px] h-[650px]">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col md:flex-row">
            
            {/* LEFT SIDE - FORM */}
            <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-purple-500/30">
              <div className="w-full max-w-md">
                
                {/* HEADER LOGO WITH BLINK ANIMATION */}
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
                  <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
                  <p className="text-purple-300">Sign up for a new account</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="auth-input-label">Full Name</label>
                    <div className="relative">
                      <UserIcon className="auth-input-icon" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="input"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

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

                  <button className="auth-btn" type="submit" disabled={isSigningUp}>
                    {isSigningUp ? (
                      <LoaderIcon className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link to="/login" className="auth-link">
                    Already have an account? Login
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - BLINKING LOGO */}
            <div className="hidden md:w-1/2 md:flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/30 to-transparent">
              <div className="text-center">
                {/* BIG BLINKING LOGO ON RIGHT SIDE */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl animate-pulse opacity-60"></div>
                  <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 w-32 h-32 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-blink">
                    <MessageCircleIcon className="w-16 h-16 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2 animate-pulse">
                  BlinkChat
                </h3>
                <p className="text-purple-300">Connect with a blink!</p>
                
                <div className="mt-8 flex justify-center gap-4">
                  <span className="auth-badge animate-blink-slow">💬 Blink Chat</span>
                  <span className="auth-badge animate-blink-slow delay-150">⚡ Fast</span>
                  <span className="auth-badge animate-blink-slow delay-300">🔒 Secure</span>
                </div>

                {/* Blinking dots */}
                <div className="flex justify-center gap-2 mt-6">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-blink"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-blink delay-150"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-blink delay-300"></div>
                </div>
              </div>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}

export default SignUpPage;