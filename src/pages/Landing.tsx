import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Calculator,
  CheckCircle2,
  FileText,
  Map,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";

const capabilities = [
  {
    icon: Map,
    title: "Survey Intelligence",
    desc: "Import, clean, visualize, and organize Total Station, DGPS, and drone survey points.",
  },
  {
    icon: Ruler,
    title: "Engineering Estimation",
    desc: "Calculate earthwork, quantities, alignments, profiles, and field-ready summaries.",
  },
  {
    icon: Bot,
    title: "Civil AI Assistant",
    desc: "Ask project questions, explain methods, and turn raw site data into useful decisions.",
  },
  {
    icon: FileText,
    title: "Document Workspace",
    desc: "Keep project files, reports, estimates, and generated outputs together in one place.",
  },
];

const workflow = ["Import survey data", "Validate coordinates", "Generate drawings", "Estimate quantities"];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground blueprint-grid overflow-hidden">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="CiviLogiCore" className="h-9 w-9" />
            <span className="font-mono text-sm font-bold tracking-wider">
              <span className="text-gradient-cyan">C</span>IVI<span className="text-gradient-cyan">L</span>OGI<span className="text-gradient-cyan">C</span>ORE
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#platform" className="hover:text-foreground">Platform</a>
            <a href="#workflow" className="hover:text-foreground">Workflow</a>
            <a href="#security" className="hover:text-foreground">Security</a>
          </nav>
          <Button asChild className="font-mono text-xs">
            <Link to="/auth">Open Workspace <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered civil engineering workspace
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl lg:text-6xl">
              Civil engineering data, drawings, estimates, and AI in one focused workspace.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              CiviLogiCore helps surveyors and civil engineers move from raw field data to usable project intelligence without jumping across disconnected tools.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="font-mono text-sm">
                <Link to="/auth">Start Engineering <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-mono text-sm">
                <a href="#platform">Explore Platform</a>
              </Button>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
              {workflow.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative min-h-[520px] overflow-hidden rounded-lg border border-border bg-card/70 shadow-[0_0_80px_hsl(var(--blueprint-cyan)/0.08)]"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex h-12 items-center justify-between border-b border-border bg-sidebar px-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-survey-red" />
                <span className="h-2.5 w-2.5 rounded-full bg-survey-orange" />
                <span className="h-2.5 w-2.5 rounded-full bg-survey-green" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Project Command</span>
            </div>
            <div className="grid h-[468px] grid-cols-[180px_1fr]">
              <aside className="border-r border-border bg-sidebar/80 p-3">
                {["Dashboard", "Survey Data", "AI Assistant", "Documents", "Estimations"].map((item, index) => (
                  <div key={item} className={`mb-2 rounded-md px-3 py-2 font-mono text-xs ${index === 2 ? "border border-primary/30 bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                    {item}
                  </div>
                ))}
              </aside>
              <div className="flex flex-col bg-background/60">
                <div className="border-b border-border p-5">
                  <p className="font-mono text-xs uppercase tracking-widest text-primary">Civil Engineering Agent</p>
                  <h2 className="mt-2 text-xl font-semibold">How much earthwork for chainage 0+000 to 0+500?</h2>
                </div>
                <div className="flex-1 space-y-4 p-5">
                  <div className="max-w-[78%] rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                    Upload your cross-section points or paste the formation levels. I can calculate cut/fill, summarize assumptions, and prepare an export-ready report.
                  </div>
                  <div className="ml-auto max-w-[72%] rounded-lg bg-primary p-4 text-sm text-primary-foreground">
                    Use trapezoidal method and create a quantity summary.
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {["Survey Points", "DXF Ready", "Estimate Saved"].map((item) => (
                      <div key={item} className="rounded-md border border-border bg-card p-3">
                        <p className="font-mono text-[10px] text-muted-foreground">{item}</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">Ready</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border p-4">
                  <div className="rounded-lg border border-border bg-secondary px-4 py-3 font-mono text-xs text-muted-foreground">
                    Ask about survey, drawings, materials, quantities, or site planning...
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="platform" className="border-t border-border bg-background/80 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-widest text-primary">Built for civil engineers</p>
              <h2 className="mt-3 text-3xl font-semibold">The tools your project data keeps asking for.</h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {capabilities.map((item) => (
                <article key={item.title} className="rounded-lg border border-border bg-card/75 p-5">
                  <item.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 font-mono text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="border-t border-border py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">Field to finish</p>
              <h2 className="mt-3 text-3xl font-semibold">A cleaner flow from site measurements to decisions.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {workflow.map((item, index) => (
                <div key={item} className="rounded-lg border border-border bg-card/70 p-5">
                  <span className="font-mono text-xs text-primary">0{index + 1}</span>
                  <p className="mt-3 font-medium text-foreground">{item}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Keep context attached to the project instead of scattered across files and chat threads.</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="border-t border-border bg-sidebar/70 py-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Private engineering workspace</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Your project tools stay behind authenticated access. Public pages explain the platform; engineering data stays inside the workspace.
                </p>
              </div>
            </div>
            <Button asChild className="font-mono text-xs">
              <Link to="/auth">Sign In <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
