import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackSignUp, trackLogin } from "@/lib/gtmUtils";
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

type View = "signin" | "signup" | "otp" | "forgot";

export default function NativeAuthScreen() {
  const { user, loading, signUp, signIn, verifyOTP, resendVerification, signInWithOAuth, signInWithLine, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [view, setView] = useState<View>("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "facebook" | "line" | null>(null);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Redirect after login
  const storedNext = sessionStorage.getItem("post_auth_next");
  const from = storedNext || (location.state as any)?.from || "/app";

  useEffect(() => {
    if (user && !loading) {
      if (storedNext) sessionStorage.removeItem("post_auth_next");
      navigate(from, { replace: true });
    }
  }, [user, loading]);

  // --- Handlers ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(signInEmail, signInPassword);
    if (!error) trackLogin("email");
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signUp(signUpEmail, signUpPassword, firstName, lastName);
    if (!error) {
      setOtpEmail(signUpEmail);
      setView("otp");
    }
    setIsLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length < 6) return;
    setIsLoading(true);
    const { error } = await verifyOTP(otpEmail, otpCode);
    if (!error) {
      trackSignUp("email");
      const next = sessionStorage.getItem("post_auth_next") || "/app";
      sessionStorage.removeItem("post_auth_next");
      navigate(next, { replace: true });
    }
    setIsLoading(false);
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    await resendVerification(otpEmail);
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await resetPassword(forgotEmail);
    setResetSent(true);
    setIsLoading(false);
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setSocialLoading(provider);
    trackLogin(provider);
    await signInWithOAuth(provider);
    setSocialLoading(null);
  };

  const handleLineLogin = async () => {
    setSocialLoading("line");
    trackLogin("line");
    await signInWithLine();
    setSocialLoading(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#F97316]" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <button
          onClick={() => {
            if (view === "otp") setView("signup");
            else if (view === "forgot") setView("signin");
            else navigate(-1);
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-4 pb-8 overflow-y-auto">
        {/* ===== SIGN IN ===== */}
        {view === "signin" && (
          <>
            <h1 className="text-[26px] font-bold text-[#1A1A1A] mb-1">Welcome back</h1>
            <p className="text-[14px] text-[#6B6B6B] mb-8">Sign in to your account</p>

            {/* Social buttons */}
            <div className="flex gap-3 mb-6">
              <SocialButton
                provider="google"
                loading={socialLoading}
                onClick={() => handleSocialLogin("google")}
              />
              <SocialButton
                provider="line"
                loading={socialLoading}
                onClick={handleLineLogin}
              />
              <SocialButton
                provider="facebook"
                loading={socialLoading}
                onClick={() => handleSocialLogin("facebook")}
              />
            </div>

            <Divider text="or sign in with email" />

            <form onSubmit={handleSignIn} className="space-y-4 mt-6">
              <InputField
                icon={<Mail className="w-[18px] h-[18px] text-[#9CA3AF]" />}
                type="email"
                placeholder="Email address"
                value={signInEmail}
                onChange={setSignInEmail}
              />
              <div className="relative">
                <InputField
                  icon={<Lock className="w-[18px] h-[18px] text-[#9CA3AF]" />}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={signInPassword}
                  onChange={setSignInPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px] text-[#9CA3AF]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px] text-[#9CA3AF]" />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setView("forgot")}
                className="text-[13px] text-[#F97316] font-medium"
              >
                Forgot password?
              </button>

              <SubmitButton loading={isLoading} text="Sign In" />
            </form>

            <p className="text-center text-[14px] text-[#6B6B6B] mt-8">
              Don't have an account?{" "}
              <button
                onClick={() => setView("signup")}
                className="text-[#F97316] font-semibold"
              >
                Sign Up
              </button>
            </p>
          </>
        )}

        {/* ===== SIGN UP ===== */}
        {view === "signup" && (
          <>
            <h1 className="text-[26px] font-bold text-[#1A1A1A] mb-1">Create account</h1>
            <p className="text-[14px] text-[#6B6B6B] mb-8">
              Join Mobile11 for instant eSIM access
            </p>

            {/* Social buttons */}
            <div className="flex gap-3 mb-6">
              <SocialButton
                provider="google"
                loading={socialLoading}
                onClick={() => handleSocialLogin("google")}
              />
              <SocialButton
                provider="line"
                loading={socialLoading}
                onClick={handleLineLogin}
              />
              <SocialButton
                provider="facebook"
                loading={socialLoading}
                onClick={() => handleSocialLogin("facebook")}
              />
            </div>

            <Divider text="or sign up with email" />

            <form onSubmit={handleSignUp} className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  icon={<User className="w-[18px] h-[18px] text-[#9CA3AF]" />}
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={setFirstName}
                />
                <InputField
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={setLastName}
                />
              </div>
              <InputField
                icon={<Mail className="w-[18px] h-[18px] text-[#9CA3AF]" />}
                type="email"
                placeholder="Email address"
                value={signUpEmail}
                onChange={setSignUpEmail}
              />
              <InputField
                icon={<Lock className="w-[18px] h-[18px] text-[#9CA3AF]" />}
                type="password"
                placeholder="Create password"
                value={signUpPassword}
                onChange={setSignUpPassword}
              />

              <SubmitButton loading={isLoading} text="Create Account" />
            </form>

            <p className="text-center text-[14px] text-[#6B6B6B] mt-8">
              Already have an account?{" "}
              <button
                onClick={() => setView("signin")}
                className="text-[#F97316] font-semibold"
              >
                Sign In
              </button>
            </p>
          </>
        )}

        {/* ===== OTP VERIFICATION ===== */}
        {view === "otp" && (
          <>
            <h1 className="text-[26px] font-bold text-[#1A1A1A] mb-1">Verify email</h1>
            <p className="text-[14px] text-[#6B6B6B] mb-2">
              We sent a 6-digit code to
            </p>
            <p className="text-[14px] font-semibold text-[#1A1A1A] mb-8">
              {otpEmail}
            </p>

            {/* OTP Input */}
            <div className="flex justify-center gap-2 mb-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otpCode[i] || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const newCode = otpCode.split("");
                    newCode[i] = val;
                    const joined = newCode.join("").slice(0, 6);
                    setOtpCode(joined);
                    // Auto-focus next
                    if (val && i < 5) {
                      const next = e.target.nextElementSibling as HTMLInputElement;
                      next?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otpCode[i] && i > 0) {
                      const prev = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                      prev?.focus();
                    }
                  }}
                  className="w-12 h-14 text-center text-[20px] font-semibold text-[#1A1A1A] bg-white rounded-xl border border-[#E5E5E5] focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 outline-none transition-all"
                />
              ))}
            </div>

            <SubmitButton
              loading={isLoading}
              text="Verify"
              onClick={handleVerifyOTP}
              disabled={otpCode.length < 6}
            />

            <div className="text-center mt-6">
              <button
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || isLoading}
                className="text-[14px] text-[#F97316] font-medium disabled:text-[#9CA3AF]"
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Resend code"}
              </button>
            </div>
          </>
        )}

        {/* ===== FORGOT PASSWORD ===== */}
        {view === "forgot" && (
          <>
            <h1 className="text-[26px] font-bold text-[#1A1A1A] mb-1">Reset password</h1>
            <p className="text-[14px] text-[#6B6B6B] mb-8">
              Enter your email and we'll send you a reset link
            </p>

            {resetSent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-green-600" />
                </div>
                <h2 className="text-[18px] font-semibold text-[#1A1A1A] mb-2">
                  Check your email
                </h2>
                <p className="text-[14px] text-[#6B6B6B] mb-6">
                  We've sent a password reset link to{" "}
                  <span className="font-medium text-[#1A1A1A]">{forgotEmail}</span>
                </p>
                <button
                  onClick={() => {
                    setView("signin");
                    setResetSent(false);
                  }}
                  className="text-[14px] text-[#F97316] font-semibold"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <InputField
                  icon={<Mail className="w-[18px] h-[18px] text-[#9CA3AF]" />}
                  type="email"
                  placeholder="Email address"
                  value={forgotEmail}
                  onChange={setForgotEmail}
                />
                <SubmitButton loading={isLoading} text="Send Reset Link" />
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function InputField({
  icon,
  type,
  placeholder,
  value,
  onChange,
}: {
  icon?: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2">{icon}</div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className={`w-full h-12 ${icon ? "pl-11" : "pl-4"} pr-4 bg-white rounded-2xl border border-[#E5E5E5] text-[15px] text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all`}
      />
    </div>
  );
}

function SubmitButton({
  loading,
  text,
  onClick,
  disabled,
}: {
  loading: boolean;
  text: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full h-12 bg-[#F97316] hover:bg-[#EA6C10] text-white font-semibold text-[15px] rounded-full shadow-sm disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {text}
    </button>
  );
}

function Divider({ text }: { text: string }) {
  return (
    <div className="relative flex items-center my-6">
      <div className="flex-1 h-px bg-[#E5E5E5]" />
      <span className="px-3 text-[12px] text-[#9CA3AF] uppercase">{text}</span>
      <div className="flex-1 h-px bg-[#E5E5E5]" />
    </div>
  );
}

function SocialButton({
  provider,
  loading,
  onClick,
}: {
  provider: "google" | "facebook" | "line";
  loading: "google" | "facebook" | "line" | null;
  onClick: () => void;
}) {
  const isLoading = loading === provider;

  const icons: Record<string, React.ReactNode> = {
    google: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
    line: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#00B900">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
    ),
    facebook: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading !== null}
      className="flex-1 h-12 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" />
      ) : (
        icons[provider]
      )}
    </button>
  );
}
