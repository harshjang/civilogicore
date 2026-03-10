import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const getInitialTheme = () => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") return false;
    return true; // default dark
  };
  const [darkMode, setDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <h1 className="font-mono text-xl font-bold text-foreground tracking-wider">Settings</h1>
        </div>

        {/* Profile */}
        <Card className="bg-card border-border mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <CardTitle className="font-mono text-sm">Profile</CardTitle>
            </div>
            <CardDescription className="font-mono text-xs">Manage your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">Email</Label>
              <Input value={user?.email ?? ""} disabled className="font-mono text-xs bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name"
                className="font-mono text-xs"
              />
            </div>
            <Button size="sm" className="font-mono text-xs" onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Saving…" : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card border-border mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <CardTitle className="font-mono text-sm">Notifications</CardTitle>
            </div>
            <CardDescription className="font-mono text-xs">Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs text-muted-foreground">Enable notifications</Label>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="bg-card border-border mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <CardTitle className="font-mono text-sm">Appearance</CardTitle>
            </div>
            <CardDescription className="font-mono text-xs">Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs text-muted-foreground">Dark mode</Label>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <CardTitle className="font-mono text-sm">Security</CardTitle>
            </div>
            <CardDescription className="font-mono text-xs">Manage your security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">Password</Label>
              <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => {
                supabase.auth.resetPasswordForEmail(user?.email ?? "").then(() => {
                  toast.success("Password reset email sent");
                });
              }}>
                Reset Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
