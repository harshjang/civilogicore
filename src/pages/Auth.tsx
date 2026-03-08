import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowRight, Shield, Loader2 } from "lucide-react";
import logo from "@/assets/logo.svg";

type AuthMode = "signin" | "signup" | "otp-verify" | "reset-password";

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Failed login tracking
  const [failCount, setFailCount] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // OTP timer
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [otpRemaining, setOtpRemaining] = useState(0);

  // Redirect if logged in
  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  // Lockout countdown
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutRemaining(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        // After lockout, if still failing, force password reset
        if (failCount >= 4) {
          setMode("reset-password");
          toast({ title: "Too many failed attempts", description: "Please reset your password." });
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil, failCount, toast]);

  // OTP countdown
  useEffect(() => {
    if (!otpExpiry) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((otpExpiry - Date.now()) / 1000));
      setOtpRemaining(remaining);
      if (remaining <= 0) setOtpExpiry(null);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpExpiry]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSignUp = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
        emailRedirectTo: window.location.origin,
      },
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      setMode("otp-verify");
      setOtpExpiry(Date.now() + 120000); // 2 min
      setOtpRemaining(120);
      toast({ title: "Check your email", description: "We sent a confirmation link to your email." });
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    if (lockoutUntil && Date.now() < lockoutUntil) {
      toast({ title: "Account locked", description: `Wait ${lockoutRemaining}s`, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      const newCount = failCount + 1;
      setFailCount(newCount);
      if (newCount >= 2 && newCount < 4) {
        // First lockout: 30 seconds
        setLockoutUntil(Date.now() + 30000);
        setLockoutRemaining(30);
        toast({ title: "Too many attempts", description: "Locked for 30 seconds.", variant: "destructive" });
      } else if (newCount >= 4) {
        // After second lockout with 2 more fails, force password reset via OTP
        setMode("reset-password");
        toast({ title: "Account locked", description: "Please reset your password via email.", variant: "destructive" });
      } else {
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      }
    } else {
      setFailCount(0);
      setLockoutUntil(null);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      toast({ title: "Enter your email", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reset email sent", description: "Check your inbox for a password reset link." });
    }
  };

  const isLocked = lockoutUntil !== null && Date.now() < lockoutUntil;

  if (loading) {
    return (
      <div className="min-h-screen bg-background blueprint-grid flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background blueprint-grid flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

      <motion.div
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-block mb-4 relative"
            initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ boxShadow: "0 0 0px hsl(187 80% 48% / 0)" }}
              animate={{
                boxShadow: [
                  "0 0 0px hsl(187 80% 48% / 0)",
                  "0 0 40px hsl(187 80% 48% / 0.4)",
                  "0 0 20px hsl(187 80% 48% / 0.2)",
                ],
              }}
              transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
            />
            <motion.img
              src={logo}
              alt="CiviLogiCore"
              className="w-24 h-24 mx-auto"
              initial={{ filter: "brightness(0) blur(8px)" }}
              animate={{ filter: "brightness(1) blur(0px)" }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              style={{ filter: "drop-shadow(0 0 20px hsl(187 80% 48% / 0.3))" }}
            />
            {/* Scanning line effect */}
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
              initial={{ top: "0%", opacity: 1 }}
              animate={{ top: "100%", opacity: 0 }}
              transition={{ duration: 1.5, delay: 0.4, ease: "easeInOut" }}
            />
          </motion.div>
          <h1 className="font-mono text-2xl md:text-3xl font-bold text-foreground tracking-wider">
            <span className="text-gradient-cyan">C</span>IVI<span className="text-gradient-cyan">L</span>OGI<span className="text-gradient-cyan">C</span>ORE
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-2 tracking-widest uppercase">
            Civil Engineering Intelligence Platform
          </p>
        </div>

        {/* Auth Card */}
        <motion.div
          className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 md:p-8 glow-cyan"
          layout
        >
          <AnimatePresence mode="wait">
            {mode === "signin" && (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="font-mono text-sm font-semibold text-foreground tracking-wider">SIGN IN</h2>
                  <p className="text-xs text-muted-foreground mt-1">Access your engineering workspace</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-mono text-xs text-muted-foreground mb-1.5 block">EMAIL</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="engineer@civilogi.com"
                      className="bg-background/50 border-border font-mono text-sm"
                      disabled={isLocked}
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground mb-1.5 block">PASSWORD</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-background/50 border-border font-mono text-sm pr-10"
                        disabled={isLocked}
                        onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {isLocked && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <Shield className="w-4 h-4 text-destructive" />
                    <span className="font-mono text-xs text-destructive">
                      Locked · {formatTime(lockoutRemaining)} remaining
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleSignIn}
                  disabled={submitting || isLocked}
                  className="w-full font-mono text-sm tracking-wider"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>AUTHENTICATE <ArrowRight className="w-4 h-4" /></>}
                </Button>

                <div className="flex items-center justify-between text-xs">
                  <button onClick={() => setMode("signup")} className="font-mono text-primary hover:underline">
                    CREATE ACCOUNT
                  </button>
                  <button onClick={() => setMode("reset-password")} className="font-mono text-muted-foreground hover:text-foreground">
                    FORGOT PASSWORD?
                  </button>
                </div>
              </motion.div>
            )}

            {mode === "signup" && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="font-mono text-sm font-semibold text-foreground tracking-wider">CREATE ACCOUNT</h2>
                  <p className="text-xs text-muted-foreground mt-1">Set up your engineering profile</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-mono text-xs text-muted-foreground mb-1.5 block">USERNAME</label>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="civil_engineer"
                      className="bg-background/50 border-border font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground mb-1.5 block">EMAIL</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="engineer@civilogi.com"
                      className="bg-background/50 border-border font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground mb-1.5 block">PASSWORD</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="bg-background/50 border-border font-mono text-sm pr-10"
                        onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSignUp}
                  disabled={submitting}
                  className="w-full font-mono text-sm tracking-wider"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>REGISTER <ArrowRight className="w-4 h-4" /></>}
                </Button>

                <button onClick={() => setMode("signin")} className="font-mono text-xs text-primary hover:underline block mx-auto">
                  ALREADY HAVE AN ACCOUNT?
                </button>
              </motion.div>
            )}

            {mode === "otp-verify" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="font-mono text-sm font-semibold text-foreground tracking-wider">VERIFY EMAIL</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    We sent a confirmation link to <span className="text-primary">{email}</span>
                  </p>
                </div>

                {otpExpiry && (
                  <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="font-mono text-2xl font-bold text-primary">
                      {formatTime(otpRemaining)}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">remaining</p>
                  </div>
                )}

                {!otpExpiry && (
                  <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="font-mono text-xs text-destructive">OTP expired</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignUp}
                      className="mt-2 font-mono text-xs"
                    >
                      Resend verification
                    </Button>
                  </div>
                )}

                <p className="font-mono text-xs text-muted-foreground text-center">
                  Click the link in your email to verify your account, then sign in.
                </p>

                <button onClick={() => setMode("signin")} className="font-mono text-xs text-primary hover:underline block mx-auto">
                  BACK TO SIGN IN
                </button>
              </motion.div>
            )}

            {mode === "reset-password" && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="font-mono text-sm font-semibold text-foreground tracking-wider">RESET PASSWORD</h2>
                  <p className="text-xs text-muted-foreground mt-1">We'll send a reset link to your email</p>
                </div>

                <div>
                  <label className="font-mono text-xs text-muted-foreground mb-1.5 block">EMAIL</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@civilogi.com"
                    className="bg-background/50 border-border font-mono text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handlePasswordReset()}
                  />
                </div>

                <Button
                  onClick={handlePasswordReset}
                  disabled={submitting}
                  className="w-full font-mono text-sm tracking-wider"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>SEND RESET LINK <ArrowRight className="w-4 h-4" /></>}
                </Button>

                <button onClick={() => setMode("signin")} className="font-mono text-xs text-primary hover:underline block mx-auto">
                  BACK TO SIGN IN
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <p className="font-mono text-[10px] text-muted-foreground text-center mt-6 tracking-widest">
          v1.0.0 · GEOSPATIAL INTELLIGENCE PLATFORM
        </p>
      </motion.div>
    </div>
  );
}
