import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSplash } from "@/components/SplashScreen";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowRight, Shield, Loader2 } from "lucide-react";
import logo from "@/assets/logo.svg";

type AuthMode = "signin" | "signup" | "verify-email" | "reset-password";

const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;

function normalizeUsername(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

function getAuthMessage(error: { message?: string } | null) {
  const message = error?.message || "Authentication failed. Please try again.";
  if (/invalid login credentials/i.test(message)) return "The email or password is incorrect.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email before signing in.";
  if (/user already registered|already been registered/i.test(message)) return "An account with this email already exists. Please sign in instead.";
  if (/database error|saving new user/i.test(message)) return "We could not create your profile. Try another username or contact support.";
  return message;
}

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { triggerSplash } = useSplash();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [failCount, setFailCount] = useState(() => {
    const stored = localStorage.getItem("auth_fail_count");
    return stored ? parseInt(stored, 10) : 0;
  });
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    const stored = localStorage.getItem("auth_lockout_until");
    if (!stored) return null;
    const val = parseInt(stored, 10);
    return val > Date.now() ? val : null;
  });
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    localStorage.setItem("auth_fail_count", String(failCount));
  }, [failCount]);

  useEffect(() => {
    if (lockoutUntil) localStorage.setItem("auth_lockout_until", String(lockoutUntil));
    else localStorage.removeItem("auth_lockout_until");
  }, [lockoutUntil]);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutRemaining(remaining);
      if (remaining <= 0) setLockoutUntil(null);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [lockoutUntil]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSignUp = useCallback(async () => {
    const safeUsername = normalizeUsername(username);
    const cleanEmail = email.trim().toLowerCase();

    if (!safeUsername || !cleanEmail || !password.trim()) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    if (!usernamePattern.test(safeUsername)) {
      toast({
        title: "Invalid username",
        description: "Use 3-30 letters, numbers, or underscores.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { username: safeUsername, display_name: safeUsername },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Sign up failed", description: getAuthMessage(error), variant: "destructive" });
      return;
    }

    setUsername(safeUsername);
    setMode("verify-email");
    toast({ title: "Check your email", description: "Confirm your account, then sign in to your workspace." });
  }, [email, password, toast, username]);

  const handleSignIn = useCallback(async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password.trim()) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    if (lockoutUntil && Date.now() < lockoutUntil) {
      toast({ title: "Sign in paused", description: `Try again in ${formatTime(lockoutRemaining)}.`, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    setSubmitting(false);

    if (error) {
      const newCount = failCount + 1;
      setFailCount(newCount);
      if (newCount >= 4) {
        setMode("reset-password");
        toast({ title: "Too many attempts", description: "Reset your password to continue.", variant: "destructive" });
        return;
      }
      if (newCount >= 2) {
        setLockoutUntil(Date.now() + 30000);
        setLockoutRemaining(30);
      }
      toast({ title: "Sign in failed", description: getAuthMessage(error), variant: "destructive" });
      return;
    }

    setFailCount(0);
    setLockoutUntil(null);
    triggerSplash();
    navigate("/dashboard", { replace: true });
  }, [email, failCount, lockoutRemaining, lockoutUntil, navigate, password, toast, triggerSplash]);

  const handlePasswordReset = useCallback(async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast({ title: "Enter your email", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Reset failed", description: getAuthMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Reset email sent", description: "Check your inbox for a password reset link." });
    }
  }, [email, toast]);

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
      <Link to="/" className="absolute left-4 top-4 z-20 font-mono text-xs text-muted-foreground hover:text-foreground">
        Back to site
      </Link>

      <motion.div
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="text-center mb-8">
          <motion.img
            src={logo}
            alt="CiviLogiCore"
            className="w-24 h-24 mx-auto mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
            style={{ filter: "drop-shadow(0 0 20px hsl(187 80% 48% / 0.3))" }}
          />
          <h1 className="font-mono text-2xl md:text-3xl font-bold text-foreground tracking-wider">
            <span className="text-gradient-cyan">C</span>IVI<span className="text-gradient-cyan">L</span>OGI<span className="text-gradient-cyan">C</span>ORE
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-2 tracking-widest uppercase">
            Civil Engineering Intelligence Platform
          </p>
        </div>

        <motion.div className="bg-card/85 backdrop-blur-sm border border-border rounded-lg p-6 md:p-8 glow-cyan" layout>
          <AnimatePresence mode="wait">
            {mode === "signin" && (
              <motion.div key="signin" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-5">
                <div>
                  <h2 className="font-mono text-sm font-semibold text-foreground tracking-wider">SIGN IN</h2>
                  <p className="text-xs text-muted-foreground mt-1">Access your engineering workspace</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-mono text-xs text-muted-foreground mb-1.5 block">EMAIL</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="engineer@example.com" className="bg-background/50 border-border font-mono text-sm" disabled={isLocked} />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground mb-1.5 block">PASSWORD</label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="bg-background/50 border-border font-mono text-sm pr-10" disabled={isLocked} onKeyDown={(e) => e.key === "Enter" && handleSignIn()} />
                      <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {isLocked && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <Shield className="w-4 h-4 text-destructive" />
                    <span className="font-mono text-xs text-destructive">Paused for {formatTime(lockoutRemaining)}</span>
                  </div>
                )}

                <Button onClick={handleSignIn} disabled={submitting || isLocked} className="w-full font-mono text-sm tracking-wider">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>AUTHENTICATE <ArrowRight className="w-4 h-4" /></>}
                </Button>

                <div className="flex items-center justify-between text-xs">
                  <button onClick={() => setMode("signup")} className="font-mono text-primary hover:underline">CREATE ACCOUNT</button>
                  <button onClick={() => setMode("reset-password")} className="font-mono text-muted-foreground hover:text-foreground">FORGOT PASSWORD?</button>
                </div>
              </motion.div>
            )}

            {mode === "signup" && (
              <motion.div key="signup" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-5">
                <div>
                  <h2 className="font-mono text-sm font-semibold text-foreground tracking-wider">CREATE ACCOUNT</h2>
                  <p className="text-xs text-muted-foreground mt-1">Set up your engineering profile</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-mono text-xs text-muted-foreground mb-1.5 block">USERNAME</label>
                    <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onBlur={() => setUsername(normalizeUsername(username))} placeholder="civil_engineer" className="bg-background/50 border-border font-mono text-sm" />
                    <p className="mt-1 text-[10px] text-muted-foreground">3-30 letters, numbers, or underscores.</p>
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground mb-1.5 block">EMAIL</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="engineer@example.com" className="bg-background/50 border-border font-mono text-sm" />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground mb-1.5 block">PASSWORD</label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="bg-background/50 border-border font-mono text-sm pr-10" onKeyDown={(e) => e.key === "Enter" && handleSignUp()} />
                      <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSignUp} disabled={submitting} className="w-full font-mono text-sm tracking-wider">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>REGISTER <ArrowRight className="w-4 h-4" /></>}
                </Button>

                <button onClick={() => setMode("signin")} className="font-mono text-xs text-primary hover:underline block mx-auto">ALREADY HAVE AN ACCOUNT?</button>
              </motion.div>
            )}

            {mode === "verify-email" && (
              <motion.div key="verify" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-5 text-center">
                <div>
                  <h2 className="font-mono text-sm font-semibold text-foreground tracking-wider">VERIFY EMAIL</h2>
                  <p className="text-xs text-muted-foreground mt-2">We sent a confirmation link to <span className="text-primary">{email}</span>.</p>
                </div>
                <p className="font-mono text-xs text-muted-foreground">After confirming, return here and sign in.</p>
                <Button onClick={() => setMode("signin")} className="w-full font-mono text-sm">BACK TO SIGN IN</Button>
              </motion.div>
            )}

            {mode === "reset-password" && (
              <motion.div key="reset" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-5">
                <div>
                  <h2 className="font-mono text-sm font-semibold text-foreground tracking-wider">RESET PASSWORD</h2>
                  <p className="text-xs text-muted-foreground mt-1">We will send a reset link to your email</p>
                </div>
                <div>
                  <label className="font-mono text-xs text-muted-foreground mb-1.5 block">EMAIL</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="engineer@example.com" className="bg-background/50 border-border font-mono text-sm" onKeyDown={(e) => e.key === "Enter" && handlePasswordReset()} />
                </div>
                <Button onClick={handlePasswordReset} disabled={submitting} className="w-full font-mono text-sm tracking-wider">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>SEND RESET LINK <ArrowRight className="w-4 h-4" /></>}
                </Button>
                <button onClick={() => setMode("signin")} className="font-mono text-xs text-primary hover:underline block mx-auto">BACK TO SIGN IN</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="font-mono text-[10px] text-muted-foreground text-center mt-6 tracking-widest">
          v1.0.0 - GEOSPATIAL INTELLIGENCE PLATFORM
        </p>
      </motion.div>
    </div>
  );
}

