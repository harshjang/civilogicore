import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.svg";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
  }, []);

  const handleUpdate = async () => {
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "You can now sign in." });
      navigate("/auth", { replace: true });
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background blueprint-grid flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl p-8 text-center max-w-md">
          <img src={logo} alt="CiviLogiCore" className="w-16 h-16 mx-auto mb-4" />
          <p className="font-mono text-sm text-muted-foreground">Invalid or expired reset link.</p>
          <Button onClick={() => navigate("/auth")} className="mt-4 font-mono text-sm">
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background blueprint-grid flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={logo} alt="CiviLogiCore" className="w-20 h-20 mx-auto mb-3" />
          <h1 className="font-mono text-xl font-bold text-foreground tracking-wider">SET NEW PASSWORD</h1>
        </div>
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 glow-cyan space-y-5">
          <div>
            <label className="font-mono text-xs text-muted-foreground mb-1.5 block">NEW PASSWORD</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="bg-background/50 border-border font-mono text-sm pr-10"
                onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
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
          <Button onClick={handleUpdate} disabled={submitting} className="w-full font-mono text-sm tracking-wider">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>UPDATE PASSWORD <ArrowRight className="w-4 h-4" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}
