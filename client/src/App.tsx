import { useState } from "react";
import { BrainCircuit, CheckCircle2, ShieldCheck } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

type AuthMode = "login" | "signup";

function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); } });
  const signup = trpc.auth.signup.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); } });
  const pending = login.isPending || signup.isPending;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      if (mode === "signup") await signup.mutateAsync({ name, email, password });
      else await login.mutateAsync({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to authenticate. Please try again.");
    }
  };

  return (
    <main className="auth-screen">
      <div className="auth-orbit auth-orbit-one" />
      <div className="auth-orbit auth-orbit-two" />
      <section className="auth-card">
        <div className="auth-brand"><div className="auth-brand-mark"><BrainCircuit size={20} /></div><div><strong>StudyStride</strong><span>steady beats perfect</span></div></div>
        <div className="auth-kicker"><ShieldCheck size={14} /> Independent account access</div>
        <h1>{mode === "login" ? <>Welcome<br /><em>back.</em></> : <>Start your<br /><em>stride.</em></>}</h1>
        <p className="auth-copy">{mode === "login" ? "Log in to return to your semesters, syllabus checkoffs, streaks, quizzes, and GATE preparation." : "Create a private StudyStride account and keep your study progress synced across devices."}</p>
        <form onSubmit={submit} className="auth-form">
          {mode === "signup" && <label className="field-label">Your name<input className="text-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Rajasree" autoComplete="name" required /></label>}
          <label className="field-label">Email<input className="text-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
          <label className="field-label">Password<input className="text-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="auth-button" disabled={pending} type="submit">{pending ? "Working…" : mode === "login" ? "Log in" : "Create account"}<span>→</span></button>
        </form>
        <div className="auth-switch">{mode === "login" ? "New to StudyStride?" : "Already have an account?"}<button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>{mode === "login" ? "Sign up" : "Log in"}</button></div>
        <div className="auth-benefits"><div><CheckCircle2 size={16} /><span>Private workspace for your studies</span></div><div><CheckCircle2 size={16} /><span>Progress saved to PostgreSQL</span></div></div>
        <small className="auth-footnote">Your password is securely hashed before it is stored.</small>
      </section>
    </main>
  );
}

function AuthenticatedApp() {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return <div className="auth-loading"><div className="auth-loading-mark"><BrainCircuit size={20} /></div><span>Preparing your private workspace…</span></div>;
  return isAuthenticated ? <Home /> : <AuthScreen />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="bottom-right" />
          <AuthenticatedApp />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
