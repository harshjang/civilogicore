import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "cyan" | "orange" | "green";
}

const variantStyles = {
  default: "border-border",
  cyan: "border-glow",
  orange: "border-survey-orange/30",
  green: "border-survey-green/30",
};

const iconVariants = {
  default: "text-muted-foreground",
  cyan: "text-primary",
  orange: "text-survey-orange",
  green: "text-survey-green",
};

export default function StatCard({ icon: Icon, label, value, subtitle, variant = "default" }: StatCardProps) {
  return (
    <div className={`bg-card rounded-lg border p-5 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-mono font-bold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-md bg-secondary ${iconVariants[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
