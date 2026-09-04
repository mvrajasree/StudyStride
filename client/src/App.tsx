import { BrainCircuit, CheckCircle2, ShieldCheck } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "./const";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

function AuthScreen() {
  return (
    <main className="auth-screen">
      <div className="auth-orbit auth-orbit-one" />
      <div className="auth-orbit auth-orbit-two" />
      <section className="auth-card">
        <div className="auth-brand"><div className="auth-brand-mark"><BrainCircuit size={20} /></div><div><strong>StudyStride</strong><span>steady beats perfect</span></div></div>
        <div className="auth-kicker"><ShieldCheck size={14} /> Your private study cockpit</div>
        <h1>Keep your progress<br /><em>safe and yours.</em></h1>
        <p className="auth-copy">Log in or create your account to save semesters, syllabus checkoffs, streaks, quizzes, and GATE preparation across devices.</p>
        <div className="auth-benefits"><div><CheckCircle2 size={16} /><span>Private workspace for your studies</span></div><div><CheckCircle2 size={16} /><span>PostgreSQL-backed progress sync</span></div><div><CheckCircle2 size={16} /><span>Return without starting from zero</span></div></div>
        <button className="auth-button" onClick={() => startLogin()}>Log in / Sign up <span>→</span></button>
        <small className="auth-footnote">You’ll be redirected to secure Manus authentication.</small>
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
