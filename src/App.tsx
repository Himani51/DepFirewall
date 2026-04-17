import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  FileCode, 
  AlertTriangle, 
  Search,
  RefreshCw,
  Github,
  ExternalLink,
  ChevronRight,
  Cpu,
  Zap,
  Activity,
  ArrowRight,
  Lock,
  Eye,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";

interface Issue {
  line: number;
  type: "hallucination" | "suspicious" | "security";
  message: string;
  severity: "high" | "medium" | "low";
  snippet: string;
}

interface ScanResult {
  file: string;
  issues: Issue[];
}

export default function App() {
  const [view, setView] = useState<"intro" | "landing" | "dashboard">("intro");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [scannedAt, setScannedAt] = useState<string | null>(null);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const runScan = async () => {
    setLoading(true);
    setResults([]); // Clear previous results for fresh scan layout
    try {
      const { data } = await axios.get("/api/scan");
      if (data.success) {
        setResults(data.results);
        setScannedAt(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("Scan operation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "dashboard") {
      runScan();
    }
  }, [view]);

  return (
    <div className="bg-brand-bg text-brand-text-main font-sans selection:bg-brand-accent selection:text-black min-h-screen">
      <AnimatePresence mode="wait">
        {view === "intro" && (
          <IntroView onComplete={() => setView("landing")} />
        )}
        {view === "landing" && (
          <LandingView onLaunch={() => setView("dashboard")} theme={theme} toggleTheme={toggleTheme} />
        )}
        {view === "dashboard" && (
          <DashboardView 
            results={results} 
            loading={loading} 
            scannedAt={scannedAt} 
            runScan={runScan} 
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- VIEWS ---

function IntroView({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[100] bg-brand-bg flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] dark:opacity-[0.1]">
        <NeuralScan />
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.2 }}
            className="absolute inset-0 bg-brand-accent/5 rounded-3xl"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border border-brand-accent/20 rounded-full border-dashed"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 border border-brand-accent/10 rounded-full"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          >
            <ShieldAlert className="w-12 h-12 text-brand-accent drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]" />
          </motion.div>
        </div>
        
        <div className="flex overflow-hidden relative py-2 px-4 -mx-4">
          <motion.div 
            className="absolute top-0 bottom-0 left-0 bg-brand-accent w-full z-20"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ delay: 0.8, duration: 1.2, ease: "easeInOut" }}
          />
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.1 }}
            className="text-5xl md:text-7xl font-sans font-extrabold tracking-tighter text-brand-text-main flex items-center gap-3"
          >
            Dependency Firewall
            <span className="font-light italic text-brand-accent">Lite</span>
          </motion.h1>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.8 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <div className="text-[11px] font-mono tracking-[4px] uppercase text-brand-text-dim flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            Initializing Neural Core
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          </div>
          
          <div className="w-48 h-[1px] bg-brand-line relative overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ delay: 2.4, duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-y-0 left-0 w-1/2 bg-brand-accent shadow-[0_0_10px_rgba(var(--accent-rgb),1)]"
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function LandingView({ onLaunch, theme, toggleTheme }: { onLaunch: () => void; theme: string; toggleTheme: () => void }) {
  const [activeTab, setActiveTab] = useState<"hero" | "docs" | "rules">("hero");

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-full relative overflow-hidden flex flex-col bg-brand-bg selection:bg-brand-accent selection:text-brand-bg"
    >
      {/* Background Neural Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.1] dark:opacity-[0.2]">
        <NeuralScan />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 h-20 flex items-center justify-between px-12 lg:px-24 shrink-0 transition-colors">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <div className="w-6 h-6 bg-brand-accent rounded flex items-center justify-center text-brand-bg relative overflow-hidden group">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", damping: 12 }}
              className="absolute inset-0 bg-white/20"
            />
            <ShieldAlert className="w-3.5 h-3.5 relative z-10" />
          </div>
          <span className="font-sans font-bold text-sm tracking-tight leading-none lowercase">Dependency Firewall <span className="text-brand-text-dim font-light italic">Lite</span></span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex items-center gap-10"
        >
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setActiveTab("hero")} className={`text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'hero' ? 'text-brand-accent border-b-2 border-brand-accent pb-1' : 'text-brand-text-dim hover:text-brand-text-main'}`}>System</button>
            <button onClick={() => setActiveTab("docs")} className={`text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'docs' ? 'text-brand-accent border-b-2 border-brand-accent pb-1' : 'text-brand-text-dim hover:text-brand-text-main'}`}>Protocol</button>
            <button onClick={() => setActiveTab("rules")} className={`text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'rules' ? 'text-brand-accent border-b-2 border-brand-accent pb-1' : 'text-brand-text-dim hover:text-brand-text-main'}`}>Entropy</button>
          </div>
          <div className="h-4 w-[1px] bg-brand-line" />
          <button onClick={toggleTheme} className="p-2 hover:bg-brand-line rounded-lg transition-colors group">
            {theme === "dark" ? <Sun className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" /> : <Moon className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />}
          </button>
        </motion.div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-12 lg:px-24">
        <div className="w-full max-w-6xl">
          <AnimatePresence mode="wait">
            {activeTab === "hero" && (
              <motion.section 
                key="hero"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-12 items-center"
              >
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-4xl lg:text-8xl font-sans font-extrabold leading-[0.95] tracking-tighter text-brand-text-main">
                      Neural Integrity Audit<span className="text-brand-accent">.</span>
                    </h1>
                    <p className="text-xl text-brand-text-dim max-w-xl font-sans leading-relaxed">
                      Verification for AI-generated code. Detecting phantom dependencies before they enter your production stack.
                    </p>
                  </div>

                  <div className="flex items-center gap-6 pt-4">
                    <button 
                      onClick={onLaunch}
                      className="group flex items-center gap-4 bg-brand-accent text-brand-bg px-10 py-5 rounded-xl font-bold text-sm hover:opacity-95 transition-all active:scale-95 shadow-2xl shadow-brand-accent/20"
                    >
                      Initialize System
                      <Zap className="w-4 h-4 fill-current" />
                    </button>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-text-dim">Engine Status</span>
                      <span className="text-xs font-mono font-bold text-brand-success">READY TO SCAN</span>
                    </div>
                  </div>
                </div>

                <div className="relative block lg:mt-0 mt-20">
                  <div className="absolute inset-0 bg-brand-accent/10 blur-[120px] rounded-full animate-pulse-fast" />
                  <div className="relative z-10 w-full flex items-center justify-end">
                    <AIBrainAnimation />
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === "docs" && (
              <motion.section 
                key="docs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-10"
              >
                <div className="space-y-6">
                  <h2 className="text-4xl font-serif italic text-brand-text-main">Detection Protocol</h2>
                  <p className="text-brand-text-dim leading-relaxed">
                    The Firewall employs multi-layer verification to ensure that every dependency referenced in your code is a valid, existing artifact.
                  </p>
                  <ul className="space-y-4 pt-4">
                     {['Registry Entropy Check', 'Phantom API Validation', 'Hallucination Pattern Scans'].map((item, i) => (
                       <li key={i} className="flex items-center gap-3 text-brand-text-main font-bold text-sm">
                         <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                         {item}
                       </li>
                     ))}
                  </ul>
                </div>
                <div className="bg-brand-surface border border-brand-line p-10 rounded-2xl shadow-sm">
                  <div className="mb-6 opacity-30"><ShieldAlert className="w-8 h-8" /></div>
                  <p className="text-brand-text-dim font-mono text-xs leading-loose">
                    [SYSTEM_LOG] : Analyzing target: src/components/AIProcessor.tsx<br/>
                    [NOTICE] : Detected import "ai-super-lib"<br/>
                    [FATAL] : Registry mismatch. "ai-super-lib" does not exist.<br/>
                    [BLOCK] : Quarantining artifact.
                  </p>
                </div>
              </motion.section>
            )}

            {activeTab === "rules" && (
              <motion.section 
                key="rules"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { title: "Ghost Hooks", desc: "Prevents usage of plausible but non-existent React hooks like useGlobalStateSynchronizer." },
                    { title: "Zombie Libraries", desc: "Detects imports of libraries that look like part of a standard suite but were invented by the model." },
                    { title: "Phantom Fields", desc: "Flags access to properties that a library has never exported or implemented." }
                  ].map((rule, i) => (
                    <div key={i} className="p-8 bg-brand-surface border border-brand-line rounded-xl hover:border-brand-accent transition-colors">
                      <div className="text-brand-accent mb-6"><AlertTriangle className="w-6 h-6" /></div>
                      <h3 className="text-lg font-bold mb-3">{rule.title}</h3>
                      <p className="text-brand-text-dim leading-relaxed text-[13px]">{rule.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="h-24 flex items-center justify-between px-12 lg:px-24 text-[10px] font-mono text-brand-text-dim uppercase tracking-widest opacity-50 shrink-0">
        <div className="flex gap-10">
          <span>&copy; {new Date().getFullYear()} Himani Vaghani. Open Source under MIT License.</span>
          <span className="hidden sm:inline">Secure Neural Architecture</span>
        </div>
        <div className="flex gap-10">
          <span>Compliance: NIST-800</span>
          <span>Build: Stable_v1.02</span>
        </div>
      </footer>
    </motion.div>
  );
}

function AIBrainAnimation() {
  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto flex items-center justify-center">
      {/* Dynamic Rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border border-brand-accent/20 rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-8 border border-brand-success/20 rounded-full"
      />
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-20 border border-brand-accent/10 rounded-full border-dashed"
      />
      
      <div className="relative z-10 flex items-center justify-center">
        <Cpu className="w-32 h-32 text-brand-accent opacity-20 absolute blur-3xl" />
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.9, 1, 0.9]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="relative flex items-center justify-center"
        >
          <svg width="240" height="240" viewBox="0 0 240 240" fill="none" className="overflow-visible">
            <motion.circle 
              cx="120" 
              cy="120" 
              r="80" 
              stroke="var(--accent)" 
              strokeWidth="0.5" 
              strokeDasharray="4 4"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.path 
              d="M120 60C86.8629 60 60 86.8629 60 120C60 153.137 86.8629 180 120 180C153.137 180 180 153.137 180 120C180 86.8629 153.137 60 120 60Z" 
              stroke="var(--success)" 
              strokeWidth="2"
              animate={{ strokeDashoffset: [0, 100] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              strokeDasharray="20 10"
            />
            <circle cx="120" cy="120" r="30" fill="var(--accent)" fillOpacity="0.1" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
             <ShieldAlert className="w-12 h-12 text-brand-accent drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
          </div>
        </motion.div>
      </div>

      {/* Floating Data Nodes */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ 
            y: [0, -40, 0],
            x: [0, (i % 2 === 0 ? 10 : -10), 0],
            opacity: [0.1, 0.8, 0.1]
          }}
          transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: i * 0.3 }}
          className="absolute font-mono text-[9px] font-bold text-brand-accent/60"
          style={{ 
            top: `${15 + Math.random() * 70}%`, 
            left: `${15 + Math.random() * 70}%` 
          }}
        >
          {i % 2 === 0 ? 'SYNC' : 'AUTH'}
        </motion.div>
      ))}
    </div>
  );
}

function DocItem({ title, content }: { title: string; content: string }) {
  return (
    <div className="border-l-2 border-brand-accent pl-6">
      <h3 className="text-lg font-bold text-brand-text-main mb-2">{title}</h3>
      <p className="text-brand-text-dim text-sm leading-relaxed">{content}</p>
    </div>
  );
}

function RuleCard({ name, desc, severity }: { name: string; desc: string; severity: string }) {
  return (
    <div className="bg-brand-surface border border-brand-line p-5 rounded-lg flex items-center justify-between group hover:border-brand-accent/50 transition-colors">
      <div>
        <div className="font-mono text-brand-accent text-xs mb-1">{name}</div>
        <p className="text-brand-text-dim text-[11px]">{desc}</p>
      </div>
      <div className={`text-[10px] font-bold px-2 py-1 rounded ${severity === 'High' ? 'bg-brand-warning/10 text-brand-warning' : 'bg-brand-accent/10 text-brand-accent'}`}>
        {severity}
      </div>
    </div>
  );
}

function DashboardView({ results, loading, scannedAt, runScan, theme, toggleTheme }: any) {
  const totalIssues = results.reduce((acc: number, curr: any) => acc + curr.issues.length, 0);
  const [copied, setCopied] = useState(false);

  const handleFix = async (file: string, ruleId: string, line: number) => {
    try {
      await axios.post('/api/fix', { file, ruleId, line });
      runScan(); // Refresh
    } catch(e) {
      console.error(e);
    }
  };

  const handleIgnore = async (file: string, line: number) => {
    try {
      await axios.post('/api/ignore', { file, line });
      runScan(); // Refresh
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen w-full overflow-hidden flex flex-col bg-brand-bg text-[12px]"
    >
      {/* Precision Navigation Bar */}
      <header className="h-14 border-b border-brand-line flex items-center justify-between px-8 bg-brand-surface shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-brand-bg">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-sm tracking-tight leading-none mb-1">Dependency Firewall <span className="text-brand-text-dim font-light">Console</span></span>
              <span className="text-[10px] font-mono text-brand-text-dim uppercase tracking-tighter">Instance: PROD-EU-01</span>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-brand-line" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-[10px] text-brand-success bg-brand-success/10 px-2 py-0.5 rounded border border-brand-success/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse" />
              <span>SYNC_ACTIVE</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[9px] text-brand-text-dim font-mono uppercase tracking-[2px]">Last Scan Reference</span>
            <span className="text-[11px] font-mono font-bold">{scannedAt || '00:00:00 UTC'}</span>
          </div>
          <div className="h-4 w-[1px] bg-brand-line" />
          <button onClick={toggleTheme} className="p-2 hover:bg-brand-line rounded-lg transition-colors group">
            {theme === "dark" ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
          
          <button 
            onClick={() => {
              const report = results.map((r: any) => 
                `=== File: ${r.file} ===\n` + 
                r.issues.map((i: any) => `[${i.type.toUpperCase()}] Line ${i.line}: ${i.message}\nSnippet: ${i.snippet.trim()}`).join("\n\n")
              ).join("\n\n---\n\n");
              navigator.clipboard.writeText(report || "No issues found.");
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            disabled={loading || results.length === 0}
            className="text-brand-text-dim hover:text-brand-text-main px-4 py-2 rounded-lg font-bold text-[11px] hover:bg-brand-line transition-all flex items-center gap-2"
          >
            {copied ? <ShieldCheck className="w-3.5 h-3.5 text-brand-success" /> : <FileCode className="w-3.5 h-3.5" />}
            {copied ? <span className="text-brand-success">Copied!</span> : "Copy Report"}
          </button>

          <button 
            onClick={runScan}
            disabled={loading}
            className="bg-brand-accent text-brand-bg px-6 py-2 rounded-lg font-bold text-[11px] hover:opacity-90 active:scale-95 transition-all flex items-center gap-2.5"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {loading ? 'Executing scan...' : 'Initialize Full Analysis'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Plane */}
        <aside className="w-72 border-r border-brand-line bg-brand-surface/30 flex flex-col shrink-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-text-dim mb-5 font-serif italic border-b border-brand-line pb-2">Analysis Engine</h4>
              <div className="space-y-1">
                <DiagnosticItem label="Core Version" value="1.4.2" status="stable" />
                <DiagnosticItem label="Heuristic Tier" value="L5 Full" />
                <DiagnosticItem label="Pattern Set" value={`${new Date().getFullYear()}.Q2`} />
                <DiagnosticItem label="Latency" value="14ms" status="optimal" />
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-text-dim mb-5 font-serif italic border-b border-brand-line pb-2">Detection Context</h4>
              <p className="text-[11px] text-brand-text-dim leading-relaxed mb-6 font-sans">
                Real-time auditing of hallucination vectors using static pattern decomposition and dependency mapping.
              </p>
              <div className="space-y-3">
                <StatusBadge label="Integrity Guard" active />
                <StatusBadge label="Phantom Blocker" active />
                <StatusBadge label="Zero-Trust Resolver" />
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-text-dim mb-5 font-serif italic border-b border-brand-line pb-2">Security Feed</h4>
              <div className="space-y-3">
                <FeedItem time="12:04" msg="Initialized L5 Engine" />
                <FeedItem time="12:05" msg="Cached Registry Loaded" />
                <FeedItem time="12:10" msg="Scan sequence ready" />
              </div>
            </section>
          </div>

          <div className="p-6 border-t border-brand-line bg-brand-surface/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase font-bold tracking-widest opacity-40">System Load</span>
              <span className="text-[9px] font-mono opacity-40">0.04%</span>
            </div>
            <div className="h-1 bg-brand-line rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "4%" }}
                className="h-full bg-brand-success"
              />
            </div>
          </div>
        </aside>

        {/* Dynamic Grid Results */}
        <main className="flex-1 flex flex-col bg-brand-bg/50 relative overflow-hidden">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 border-b border-brand-line" role="region" aria-label="Scan Statistics Summary">
            <MetricCard label="Objects Scanned" value={loading ? "..." : (results.length * 12 + results.length)} />
            <MetricCard label="Violations Detected" value={loading ? "..." : totalIssues} highlight={totalIssues > 0} />
            <MetricCard label="Trust Probability" value={loading ? "..." : (100 - totalIssues * 1.5).toFixed(1) + "%"} />
            <MetricCard label="Threat Vectors" value={loading ? "..." : "7 Defined"} />
          </div>

          <div className="flex-1 p-6 overflow-hidden flex flex-col">
            <div className="flex-1 bg-brand-surface border border-brand-line rounded-lg flex flex-col overflow-hidden shadow-sm outline outline-4 outline-brand-text-main/5">
              {/* Table Header */}
              <div className="grid grid-cols-[80px_1.5fr_1fr_2fr_120px] px-8 py-3.5 border-b border-brand-line bg-brand-text-main/[0.03] font-bold text-[10px] uppercase tracking-[2px] text-brand-text-dim">
                <span>UID</span>
                <span>Artifact Path</span>
                <span>Classification</span>
                <span>Security Diagnostic</span>
                <span className="text-right">Actions</span>
              </div>
              
              {/* Table Content */}
              <div className="flex-1 overflow-y-auto divide-y divide-brand-line/40 font-mono text-[11px]">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center space-y-4"
                    >
                      <div className="relative w-12 h-12">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-2 border-brand-accent/20 border-t-brand-accent rounded-full"
                        />
                      </div>
                      <p className="font-serif italic text-brand-text-dim text-lg">Deconstructing code patterns...</p>
                    </motion.div>
                  ) : results.length === 0 ? (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center opacity-60 text-center"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-brand-success/10 flex items-center justify-center text-brand-success mb-6 mx-auto">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                      <h3 className="font-serif italic text-2xl mb-2 text-brand-text-main">No artifacts detected.</h3>
                      <p className="text-brand-text-dim max-w-xs mx-auto text-[12px] leading-relaxed">The analysis engine completed the sweep with zero significant violations. Your codebase appears verified.</p>
                      <button onClick={runScan} className="mt-8 text-[11px] font-bold uppercase tracking-widest text-brand-accent border border-brand-accent/30 px-6 py-2 rounded-full hover:bg-brand-accent/5 transition-all">Manual Recalibration</button>
                    </motion.div>
                  ) : (
                    results.flatMap((res: any, resIdx: number) => 
                      res.issues.map((issue: any, issueIdx: number) => (
                        <motion.div 
                          key={`${res.file}-${issueIdx}`}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (resIdx + issueIdx) * 0.02 }}
                          className="grid grid-cols-[80px_1.5fr_1fr_2fr_120px] px-8 py-3 items-center hover:bg-brand-text-main/[0.02] transition-colors group cursor-default"
                        >
                          <span className="opacity-20 text-[9px]">RES-{issue.line.toString().padStart(4, '0')}</span>
                          <span className="truncate pr-4 text-brand-text-main font-bold tracking-tight">{res.file}:{issue.line}</span>
                          <div className="flex">
                            <span className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase tracking-widest ${
                              issue.severity === 'high' ? 'bg-brand-warning/10 border-brand-warning/30 text-brand-warning' : 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent'
                            }`}>
                              {issue.type}
                            </span>
                          </div>
                          <span className="text-brand-text-dim truncate pr-6 text-[10px] leading-relaxed flex items-center gap-2">
                             {issue.canAutoFix && <Zap className="w-3 h-3 text-brand-success" />}
                             <span className="italic">{issue.message}</span>
                          </span>
                          <div className="flex items-center justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                             <button
                               onClick={() => handleIgnore(res.file, issue.line)}
                               title="Suppress inline"
                               className="text-[9px] bg-brand-surface border border-brand-line hover:border-brand-text-main px-2 py-1 rounded transition-colors"
                             >
                               IGN
                             </button>
                             <button 
                               onClick={() => handleFix(res.file, issue.ruleId, issue.line)}
                               disabled={!issue.canAutoFix}
                               title={issue.canAutoFix ? "Auto-Fix Issue" : "No Auto-Fix Available"}
                               className={`text-[9px] border px-2 py-1 rounded transition-colors ${issue.canAutoFix ? 'bg-brand-success/10 border-brand-success text-brand-success hover:bg-brand-success hover:text-white' : 'bg-brand-surface border-brand-line text-brand-text-dim opacity-50 cursor-not-allowed'}`}
                             >
                               FIX
                             </button>
                          </div>
                        </motion.div>
                      ))
                    )
                  )}
                </AnimatePresence>
              </div>

              {/* Console Footer */}
              <div className="h-10 bg-brand-bg/50 border-t border-brand-line px-8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6 text-[9px] font-bold uppercase tracking-widest text-brand-text-dim/60">
                   <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-success" /> Engine_Live</div>
                   <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-line" /> Buffer_Ready</div>
                </div>
                <div className="text-[9px] font-mono text-brand-text-dim/40 italic">
                   &copy; {new Date().getFullYear()} Himani Vaghani
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </motion.div>
  );
}

// --- COMPONENTS ---

function NeuralScan() {
  return (
    <div className="w-full h-full relative">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: Math.random() * 1000, y: Math.random() * 1000 }}
          animate={{ 
            opacity: [0.1, 0.5, 0.1],
            x: Math.random() * 1000,
            y: Math.random() * 1000
          }}
          transition={{ duration: Math.random() * 10 + 10, repeat: Infinity }}
          className="absolute w-1 h-1 bg-brand-accent rounded-full"
        />
      ))}
      <svg className="w-full h-full opacity-10">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

function CodeLine({ text, type, delay }: { text: string; type: string; delay: number }) {
  const colors = {
    error: "text-brand-warning",
    warning: "text-orange-400",
    info: "text-brand-text-dim",
    success: "text-brand-success"
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex gap-4 group"
    >
      <span className="text-brand-text-dim/30 select-none">01</span>
      <span className={`${colors[type as keyof typeof colors]} break-all`}>{text}</span>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-brand-surface border border-brand-line hover:border-brand-accent/30 transition-all group">
      <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center mb-6 border border-brand-accent/20 group-hover:scale-110 transition-transform">
        <div className="text-brand-accent">{icon}</div>
      </div>
      <h3 className="text-lg font-bold text-brand-text-main mb-3">{title}</h3>
      <p className="text-sm text-brand-text-dim leading-relaxed">{desc}</p>
    </div>
  );
}

function DiagnosticItem({ label, value, status }: { label: string; value: string; status?: 'stable' | 'optimal' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-brand-line/5 group">
      <span className="text-brand-text-dim text-[10px] uppercase font-bold tracking-wider group-hover:text-brand-text-main transition-colors">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-brand-text-main font-bold text-[11px]">{value}</span>
        {status && <div className={`w-1 h-1 rounded-full ${status === 'optimal' ? 'bg-brand-success' : 'bg-brand-accent'}`} />}
      </div>
    </div>
  );
}

function StatusBadge({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded border transition-all ${active ? 'bg-brand-surface border-brand-line shadow-sm' : 'bg-transparent border-transparent opacity-40'}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-brand-success shadow-[0_0_8px_rgba(5,150,105,0.4)]' : 'bg-brand-line'}`} />
    </div>
  );
}

function FeedItem({ time, msg }: { time: string; msg: string }) {
  return (
    <div className="flex gap-3 text-[10px] border-l border-brand-line pl-3 py-1 ml-1">
      <span className="font-mono text-brand-text-dim tabular-nums shrink-0">{time}</span>
      <span className="text-brand-text-main font-medium truncate">{msg}</span>
    </div>
  );
}

function MetricCard({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div className="px-8 py-5 border-r border-brand-line last:border-r-0 hover:bg-brand-text-main/[0.02] transition-colors">
      <div className="text-[9px] uppercase tracking-[3px] font-bold text-brand-text-dim mb-2">{label}</div>
      <div className={`text-2xl font-mono font-bold ${highlight ? 'text-brand-warning' : 'text-brand-text-main'}`}>
        {value}
      </div>
    </div>
  );
}
