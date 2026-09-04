import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheckBig,
  Clock3,
  Flame,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Menu,
  NotebookPen,
  Play,
  Plus,
  RefreshCcw,
  Settings2,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { calculateProgressPercent, calculateSyllabusProgress, filterLogsBySubject, formatDuration, generateSyllabusQuestions, mergeUniqueById, parseSyllabus, sumStudyMinutes, toggleCompletedUnit } from "@/lib/studystride";
import { trpc } from "@/lib/trpc";

type View = "today" | "semester" | "gate" | "quizzes" | "insights" | "log";
type Profile = {
  name: string;
  program: string;
  semester: string;
};
type Streak = {
  current: number;
  best: number;
  lastCompletedDate?: string;
};
type Task = {
  id: string;
  title: string;
  detail: string;
  minutes: number;
  tag: string;
  category: "Semester" | "GATE" | "Habit";
  complete: boolean;
};
type Subject = {
  id: string;
  code: string;
  name: string;
  professor: string;
  progress: number;
  target: string;
  hours: string;
  next: string;
  color: string;
  hasSyllabus?: boolean;
  syllabus?: string[];
  completedUnits?: string[];
};
type StudyLog = {
  id: string;
  subjectId: string;
  title: string;
  minutes: number;
  track: "Semester" | "GATE prep" | "Habit";
  reflection: string;
  date: string;
  syllabusUnit?: string;
};
type QuizQuestion = {
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
};
type Quiz = {
  id: string;
  title: string;
  subject: string;
  questions: QuizQuestion[];
  difficulty: "Warm-up" | "Core" | "Challenge";
  duration: string;
  attempts: number;
  color: string;
};

const initialProfile: Profile = { name: "Rajasree", program: "BCA", semester: "5th sem" };
const RAJASREE_WORKSPACE_KEY = "rajasree-bca-sem5";
const initialStreak: Streak = { current: 0, best: 0 };

const freshTasks: Task[] = [
  { id: "fresh-1", title: "Choose your first syllabus unit", detail: "Start with one small block", minutes: 25, tag: "Start here", category: "Semester", complete: false },
  { id: "fresh-2", title: "Do a 10-minute recall", detail: "Write what you already know", minutes: 10, tag: "Recall", category: "Habit", complete: false },
  { id: "fresh-3", title: "Log the block in your subject trail", detail: "Keep the progress visible", minutes: 5, tag: "Reset", category: "Habit", complete: false },
];

const seedTasks: Task[] = [
  { id: "t1", title: "Revise graph traversal patterns", detail: "Algorithms · 2 focus blocks", minutes: 50, tag: "Deep work", category: "Semester", complete: true },
  { id: "t2", title: "GATE: solve 12 OS scheduling questions", detail: "Operating Systems · PYQ set", minutes: 45, tag: "GATE", category: "GATE", complete: true },
  { id: "t3", title: "Spaced recall: DBMS normal forms", detail: "Flashcards · due today", minutes: 25, tag: "Recall", category: "Habit", complete: false },
  { id: "t4", title: "Plan tomorrow in 3 lines", detail: "Close the loop before you stop", minutes: 10, tag: "Reset", category: "Habit", complete: false },
];

const seedSubjects: Subject[] = [
  { id: "s1", code: "CS402", name: "Design & Analysis of Algorithms", professor: "Core semester subject", progress: 68, target: "Unit 4 of 6", hours: "18.5h logged", next: "Graph algorithms · 50 min", color: "#6d5dfc" },
  { id: "s2", code: "CS404", name: "Operating Systems", professor: "Core semester subject", progress: 54, target: "Unit 3 of 5", hours: "14h logged", next: "Deadlocks recap · 35 min", color: "#ec6b4b" },
  { id: "s3", code: "CS406", name: "Database Management Systems", professor: "Core semester subject", progress: 41, target: "Unit 2 of 5", hours: "10.25h logged", next: "Normalization flashcards", color: "#26a67a" },
  { id: "s4", code: "HS401", name: "Professional Communication", professor: "Elective / seminar", progress: 82, target: "Unit 4 of 4", hours: "7.5h logged", next: "Submit reflection · Friday", color: "#d4a72c" },
];

const semVSubjects: Subject[] = [
  { id: "semv-daa", code: "BCT351", name: "Design and Analysis of Algorithms", professor: "Semester V · core", progress: 0, target: "Unit 1 of 5", hours: "0h logged", next: "Start with algorithm design", color: "#6d5dfc", hasSyllabus: true, syllabus: ["Introduction and asymptotic analysis", "Greedy methods", "Dynamic programming", "Backtracking and branch & bound", "String matching, trees, graphs, NP-hard/NP-complete"] },
  { id: "semv-csharp", code: "BCT352", name: ".NET Framework & C#", professor: "Semester V · core", progress: 0, target: "Unit 1 of 5", hours: "0h logged", next: "Explore the .NET framework", color: "#ec6b4b", hasSyllabus: true, syllabus: ["Microsoft .NET Framework", "C# design goals, syntax, types and control flow", "Class libraries, methods, arrays and strings", "Multi-threading, networking and web applications", "ADO.NET, datasets, data binding and connectivity"] },
  { id: "semv-iot", code: "BCT353", name: "Introduction to Internet of Things", professor: "Semester V · core", progress: 0, target: "Unit 1 of 5", hours: "0h logged", next: "Meet embedded systems", color: "#26a67a", hasSyllabus: true, syllabus: ["Embedded systems and 8051 programming", "IoT overview, protocols and connected-device design", "IoT hardware, sensors and embedded platforms", "Arduino platform and programming", "IoT applications"] },
  { id: "semv-blockchain", code: "BCE355", name: "Blockchain Technology and Applications", professor: "Semester V · elective", progress: 0, target: "Unit 1 of 5", hours: "0h logged", next: "Understand blockchain foundations", color: "#d4a72c", hasSyllabus: true, syllabus: ["Blockchain foundations, networks, wallets and ledgers", "Consensus mechanisms", "Cryptocurrency and MetaMask wallets", "Smart contracts and Ethereum", "Hyperledger Fabric and blockchain use cases"] },
  { id: "semv-sociology", code: "BMD353", name: "Industrial Sociology", professor: "Semester V · elective", progress: 0, target: "Unit 1 of 4", hours: "0h logged", next: "Read the industrial society overview", color: "#e27455", hasSyllabus: true, syllabus: ["Introduction to industrial sociology", "Sociological theories related to industry", "Trade union movement in India", "Labour problems and welfare"] },
];

const seedLogs: StudyLog[] = [];

const seedQuizzes: Quiz[] = [
  {
    id: "q1",
    title: "OS scheduling sprint",
    subject: "Operating Systems",
    difficulty: "Core",
    duration: "8 min",
    attempts: 2,
    color: "#ec6b4b",
    questions: [
      { prompt: "Which scheduling algorithm can cause starvation for low-priority processes?", choices: ["Round Robin", "Priority scheduling", "FCFS", "FIFO page replacement"], answer: 1, explanation: "A continuously arriving stream of high-priority processes can starve lower-priority work." },
      { prompt: "In Round Robin scheduling, the key tuning parameter is the…", choices: ["Page size", "Time quantum", "Cache hit ratio", "Semaphore count"], answer: 1, explanation: "The time quantum controls how long each ready process runs before rotation." },
    ],
  },
  {
    id: "q2",
    title: "Graph algorithms warm-up",
    subject: "Algorithms",
    difficulty: "Warm-up",
    duration: "6 min",
    attempts: 4,
    color: "#6d5dfc",
    questions: [
      { prompt: "Which traversal naturally uses a queue?", choices: ["DFS", "BFS", "Dijkstra's relaxation", "Topological sort only"], answer: 1, explanation: "Breadth-first search expands level by level using a queue." },
      { prompt: "Dijkstra's algorithm assumes edge weights are…", choices: ["All equal", "Non-negative", "Strictly negative", "Prime numbers"], answer: 1, explanation: "Negative edges break Dijkstra's greedy choice guarantee." },
    ],
  },
  {
    id: "q3",
    title: "DBMS normalization check",
    subject: "Database Management Systems",
    difficulty: "Challenge",
    duration: "12 min",
    attempts: 1,
    color: "#26a67a",
    questions: [
      { prompt: "A relation is in 3NF when it is in 2NF and…", choices: ["Has no foreign keys", "Has no transitive dependency of non-key attributes on a key", "Has exactly three columns", "Uses only numeric values"], answer: 1, explanation: "3NF removes transitive dependencies from non-key attributes to a candidate key." },
      { prompt: "A candidate key is a…", choices: ["Minimal superkey", "Nullable column", "Foreign key only", "Derived attribute"], answer: 0, explanation: "A candidate key uniquely identifies tuples and is minimal." },
    ],
  },
];

const week = [
  { day: "Mon", date: "31", status: "done", minutes: 145 },
  { day: "Tue", date: "01", status: "done", minutes: 210 },
  { day: "Wed", date: "02", status: "partial", minutes: 90 },
  { day: "Thu", date: "03", status: "done", minutes: 185 },
  { day: "Fri", date: "04", status: "today", minutes: 120 },
  { day: "Sat", date: "05", status: "upcoming", minutes: 0 },
  { day: "Sun", date: "06", status: "upcoming", minutes: 0 },
];

function useStoredState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const saved = window.localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Local-first mode still works when storage is unavailable.
    }
  }, [key, value]);
  return [value, setValue];
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short" }).format(date);

const navItems: { id: View; label: string; caption: string; icon: typeof LayoutDashboard }[] = [
  { id: "today", label: "Today", caption: "Your next best step", icon: LayoutDashboard },
  { id: "log", label: "Study log", caption: "Every block counts", icon: NotebookPen },
  { id: "semester", label: "Semester", caption: "Subjects & coverage", icon: GraduationCap },
  { id: "gate", label: "GATE prep", caption: "Exam runway", icon: Target },
  { id: "quizzes", label: "Quizzes", caption: "Practice recall", icon: BrainCircuit },
  { id: "insights", label: "Insights", caption: "Patterns & momentum", icon: BarChart3 },
];

export default function Home() {
  const [activeView, setActiveView] = useState<View>("today");
  const [profile, setProfile] = useStoredState<Profile>("studystride_profile_rajasree", initialProfile);
  const [tasks, setTasks] = useStoredState<Task[]>("studystride_tasks_rajasree", freshTasks);
  const [subjects, setSubjects] = useStoredState<Subject[]>("studystride_subjects_rajasree", semVSubjects);
  const [logs, setLogs] = useStoredState<StudyLog[]>("studystride_logs_rajasree", seedLogs);
  const [streak, setStreak] = useStoredState<Streak>("studystride_streak_rajasree", initialStreak);
  const workspaceQuery = useMemo(() => ({ workspaceKey: RAJASREE_WORKSPACE_KEY }), []);
  const cloudWorkspace = trpc.study.get.useQuery(workspaceQuery, { retry: false });
  const saveWorkspace = trpc.study.save.useMutation();
  const [cloudHydrated, setCloudHydrated] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectHasSyllabus, setNewSubjectHasSyllabus] = useState(true);
  const [newSubjectSyllabus, setNewSubjectSyllabus] = useState("");
  const [logTitle, setLogTitle] = useState("");
  const [logMinutes, setLogMinutes] = useState("25");
  const [logSubjectId, setLogSubjectId] = useState(semVSubjects[0].id);
  const [logSyllabusUnit, setLogSyllabusUnit] = useState("");
  const [logTrack, setLogTrack] = useState<StudyLog["track"]>("Semester");
  const [logReflection, setLogReflection] = useState("");

  useEffect(() => {
    if (cloudHydrated || cloudWorkspace.isLoading) return;
    if (cloudWorkspace.data) {
      const remote = cloudWorkspace.data;
      setProfile(remote.profile as Profile);
      setTasks(remote.tasks as Task[]);
      setSubjects(remote.subjects as Subject[]);
      setLogs(remote.logs as StudyLog[]);
      setStreak({ ...initialStreak, ...(remote.streak as Partial<Streak> | undefined) });
    }
    setCloudHydrated(true);
  }, [cloudHydrated, cloudWorkspace.data, cloudWorkspace.isError, cloudWorkspace.isLoading, setLogs, setProfile, setStreak, setSubjects, setTasks]);

  useEffect(() => {
    if (cloudWorkspace.isLoading || !cloudHydrated) return;
    const timer = window.setTimeout(() => {
      saveWorkspace.mutate({ workspaceKey: RAJASREE_WORKSPACE_KEY, profile, tasks, subjects, logs, streak });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [cloudHydrated, cloudWorkspace.isLoading, logs, profile, streak, subjects, tasks]);

  const completedMinutes = useMemo(() => tasks.filter((task) => task.complete).reduce((total, task) => total + task.minutes, 0), [tasks]);
  const completedTasks = tasks.filter((task) => task.complete).length;
  const dateLabel = formatDate(new Date());
  const progressPercent = calculateProgressPercent(completedMinutes, 180);
  const todayKey = new Date().toLocaleDateString("en-CA");
  const streakCompletedToday = streak.lastCompletedDate === todayKey;
  const generatedQuizzes = useMemo<Quiz[]>(() => {
    const levels: Quiz["difficulty"][] = ["Warm-up", "Core", "Challenge"];
    const syllabusQuizzes = subjects.flatMap((subject) => {
      if (!subject.syllabus?.length) return [];
      const syllabus = subject.syllabus;
      return levels.map((difficulty, index) => ({
        id: `generated-${subject.id}-${difficulty.toLowerCase()}`,
        title: `${subject.code} ${difficulty.toLowerCase()} recall`,
        subject: subject.name,
        difficulty,
        duration: `${6 + index * 3} min`,
        attempts: 0,
        color: subject.color,
        questions: generateSyllabusQuestions(subject.name, syllabus, difficulty, subject.completedUnits),
      }));
    });
    return syllabusQuizzes.length ? syllabusQuizzes : seedQuizzes;
  }, [subjects]);

  const goTo = (view: View) => {
    setActiveView(view);
    setMobileNavOpen(false);
  };

  const toggleTask = (id: string) => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, complete: !task.complete } : task)));
    const task = tasks.find((item) => item.id === id);
    if (task && !task.complete) toast.success("Nice. That block is in the bank.");
  };

  const completeStreakDay = () => {
    if (streakCompletedToday) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toLocaleDateString("en-CA");
    const current = streak.lastCompletedDate === yesterdayKey ? streak.current + 1 : 1;
    setStreak({ current, best: Math.max(streak.best, current), lastCompletedDate: todayKey });
    toast.success(current === 1 ? "New streak started. One day is enough to return." : `${current}-day streak saved.`);
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizIndex(0);
    setSelectedOption(null);
  };

  const submitAnswer = () => {
    if (!activeQuiz || selectedOption === null) return;
    const question = activeQuiz.questions[quizIndex];
    if (selectedOption === question.answer) toast.success("Correct — keep the momentum.");
    else toast("Not quite. Read the explanation, then keep moving.");
  };

  const nextQuestion = () => {
    if (!activeQuiz) return;
    if (quizIndex === activeQuiz.questions.length - 1) {
      toast.success("Quiz complete. Your recall reps count.");
      setActiveQuiz(null);
      return;
    }
    setQuizIndex((current) => current + 1);
    setSelectedOption(null);
  };

  const addSubject = () => {
    if (!newSubjectName.trim()) return;
    const units = parseSyllabus(newSubjectSyllabus);
    setSubjects((current) => [
      ...current,
      { id: `s-${Date.now()}`, code: newSubjectCode.trim() || "NEW101", name: newSubjectName.trim(), professor: "New semester subject", progress: 0, target: `Unit 1 of ${Math.max(1, units.length || 5)}`, hours: "0h logged", next: units[0] || "Add your first study block", color: "#6d5dfc", hasSyllabus: newSubjectHasSyllabus && units.length > 0, syllabus: newSubjectHasSyllabus ? units : undefined },
    ]);
    setNewSubjectName("");
    setNewSubjectCode("");
    setNewSubjectHasSyllabus(true);
    setNewSubjectSyllabus("");
    setAddSubjectOpen(false);
    toast.success("Subject added to your semester board.");
  };

  const loadSemV = () => {
    setSubjects((current) => mergeUniqueById(current, semVSubjects));
    setActiveView("semester");
    toast.success("SEM-V subjects and syllabus units added.");
  };

  const toggleSyllabusUnit = (subjectId: string, unit: string) => {
    setSubjects((current) => current.map((subject) => {
      if (subject.id !== subjectId || !subject.syllabus?.length) return subject;
      const completedUnits = toggleCompletedUnit(subject.completedUnits ?? [], unit);
      const progress = calculateSyllabusProgress(subject.syllabus, completedUnits);
      const nextUnit = subject.syllabus.find((syllabusUnit) => !completedUnits.includes(syllabusUnit));
      return { ...subject, completedUnits, progress, target: `${completedUnits.length ? `Unit ${completedUnits.length} of` : "Unit 1 of"} ${subject.syllabus.length}`, next: nextUnit ? nextUnit : "Syllabus complete" };
    }));
    toast.success("Syllabus progress updated.");
  };

  const saveStudyLog = () => {
    if (!logTitle.trim()) return;
    setLogs((current) => [{ id: `l-${Date.now()}`, subjectId: logSubjectId, title: logTitle.trim(), minutes: Number(logMinutes), track: logTrack, reflection: logReflection.trim() || "No reflection added.", date: "Today", syllabusUnit: logSyllabusUnit || undefined }, ...current]);
    setLogTitle("");
    setLogMinutes("25");
    setLogSyllabusUnit("");
    setLogReflection("");
    setLogOpen(false);
    toast.success("Study block added to your semester log.");
  };

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-[#1f2340]">
      <div className="flex min-h-screen">
        <aside className={`study-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
          <div className="sidebar-inner">
            <div className="brand-lockup">
              <div className="brand-mark"><Sparkles size={17} strokeWidth={2.6} /></div>
              <div><div className="brand-name">StudyStride</div><div className="brand-subtitle">steady beats perfect</div></div>
            </div>
            <div className="sidebar-rule" />
            <div className="nav-label">Workspace</div>
            <nav className="space-y-1.5" aria-label="Main navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => goTo(item.id)} className={`nav-item ${activeView === item.id ? "active" : ""}`}>
                    <Icon size={18} />
                    <span className="min-w-0 text-left"><span className="block text-[13px] font-semibold">{item.label}</span><span className="nav-caption">{item.caption}</span></span>
                    {activeView === item.id && <span className="nav-dot" />}
                  </button>
                );
              })}
            </nav>
            <div className="sidebar-spacer" />
            <div className="recovery-mini">
              <div className="recovery-icon"><RefreshCcw size={16} /></div>
              <div><div className="text-[12px] font-bold text-[#31365d]">Missed a day?</div><div className="mt-1 text-[11px] leading-4 text-[#777b9b]">Pick up from the next block.</div></div>
              <button onClick={() => setRecoveryOpen(true)} className="mini-link">Reset</button>
            </div>
            <div className="profile-row">
              <div className="avatar">{profile.name.charAt(0)}</div>
              <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-bold text-[#31365d]">{profile.name}</div><div className="truncate text-[11px] text-[#8a8ea8]">{profile.program} · {profile.semester}</div></div>
              <button className="icon-ghost" aria-label="Settings"><Settings2 size={16} /></button>
            </div>
          </div>
        </aside>
        {mobileNavOpen && <button aria-label="Close navigation" className="mobile-overlay" onClick={() => setMobileNavOpen(false)} />}
        <main className="min-w-0 flex-1">
          <header className="topbar">
            <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
            <div className="topbar-context"><span className="topbar-kicker">My learning cockpit</span><span className="topbar-slash">/</span><span>{navItems.find((item) => item.id === activeView)?.label}</span></div>
            <div className="topbar-actions"><div className="saved-state"><span className="saved-dot" /> {cloudWorkspace.isLoading ? "Loading PostgreSQL" : saveWorkspace.isPending ? "Syncing…" : saveWorkspace.isError ? "Offline backup" : "Saved to PostgreSQL"}</div><button className="icon-ghost"><CalendarDays size={17} /></button><button onClick={() => setLogOpen(true)} className="primary-button small"><Plus size={16} /> Log study</button></div>
          </header>
          <div className="page-shell">
            <AnimatePresence mode="wait">
              <motion.div key={activeView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
                {activeView === "today" && <TodayView profile={profile} streak={streak} streakCompletedToday={streakCompletedToday} completeStreakDay={completeStreakDay} tasks={tasks} completedMinutes={completedMinutes} completedTasks={completedTasks} progressPercent={progressPercent} dateLabel={dateLabel} toggleTask={toggleTask} openRecovery={() => setRecoveryOpen(true)} goTo={goTo} />}
                {activeView === "log" && <StudyLogView logs={logs} subjects={subjects} onLog={() => setLogOpen(true)} />}
                {activeView === "semester" && <SemesterView profile={profile} subjects={subjects} onAdd={() => setAddSubjectOpen(true)} onLoadSemV={loadSemV} onToggleUnit={toggleSyllabusUnit} />}
                {activeView === "gate" && <GateView goTo={goTo} />}
                {activeView === "quizzes" && <QuizzesView quizzes={generatedQuizzes} startQuiz={startQuiz} />}
                {activeView === "insights" && <InsightsView completedMinutes={completedMinutes} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {recoveryOpen && <Modal title="Recovery mode" eyebrow="No guilt. Just a restart." onClose={() => setRecoveryOpen(false)}>
          <div className="recovery-hero"><div className="recovery-big-icon"><RefreshCcw size={23} /></div><div><div className="text-[18px] font-extrabold text-[#2d3157]">Your progress is still here.</div><p className="mt-1 text-[13px] leading-5 text-[#737797]">A skipped day is a data point, not a reset. We trimmed today to the next two highest-leverage blocks.</p></div></div>
          <div className="recovery-plan"><div><span className="step-number">1</span><div><div className="font-bold text-[#30345b]">Finish DBMS recall</div><div className="text-[12px] text-[#8286a4]">25 min · low-friction win</div></div></div><div><span className="step-number">2</span><div><div className="font-bold text-[#30345b]">Solve 5 OS questions</div><div className="text-[12px] text-[#8286a4]">20 min · rebuild rhythm</div></div></div><div><span className="step-number">3</span><div><div className="font-bold text-[#30345b]">Stop while it still feels easy</div><div className="text-[12px] text-[#8286a4]">Take the win; tomorrow resumes normally</div></div></div></div>
          <button className="primary-button w-full justify-center" onClick={() => { setRecoveryOpen(false); toast.success("Recovery plan loaded for today."); }}>Load recovery plan <ChevronRight size={16} /></button>
        </Modal>}
        {logOpen && <Modal title="Log a study block" eyebrow="Capture the work, not just the intention." onClose={() => setLogOpen(false)}>
          <div className="space-y-3"><label className="field-label">What did you work on?<input value={logTitle} onChange={(event) => setLogTitle(event.target.value)} className="text-input" placeholder="e.g. Binary trees, Unit 3 notes" autoFocus /></label><div className="grid grid-cols-2 gap-3"><label className="field-label">Subject<select value={logSubjectId} onChange={(event) => { setLogSubjectId(event.target.value); setLogSyllabusUnit(""); }} className="text-input">{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} · {subject.name}</option>)}</select></label><label className="field-label">Duration<select value={logMinutes} onChange={(event) => setLogMinutes(event.target.value)} className="text-input"><option value="25">25 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option></select></label></div>{subjects.find((subject) => subject.id === logSubjectId)?.syllabus?.length ? <label className="field-label">Syllabus unit<select value={logSyllabusUnit} onChange={(event) => setLogSyllabusUnit(event.target.value)} className="text-input"><option value="">Choose a unit (optional)</option>{subjects.find((subject) => subject.id === logSubjectId)?.syllabus?.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label> : <div className="syllabus-hint"><BookOpen size={14} /> This subject has no syllabus units yet. You can still log the block.</div>}<label className="field-label">Track<select value={logTrack} onChange={(event) => setLogTrack(event.target.value as StudyLog["track"])} className="text-input"><option>Semester</option><option>GATE prep</option><option>Habit</option></select></label><label className="field-label">One-line reflection<textarea value={logReflection} onChange={(event) => setLogReflection(event.target.value)} className="text-input min-h-[76px] resize-none" placeholder="What got clearer?" /></label></div><button disabled={!logTitle.trim()} className="primary-button mt-5 w-full justify-center" onClick={saveStudyLog}>Save block <Check size={16} /></button>
        </Modal>}
        {addSubjectOpen && <Modal title="Add a semester subject" eyebrow="Make the board match your real semester." onClose={() => setAddSubjectOpen(false)}>
          <div className="space-y-3"><label className="field-label">Subject name<input value={newSubjectName} onChange={(event) => setNewSubjectName(event.target.value)} className="text-input" placeholder="e.g. Computer Networks" autoFocus /></label><label className="field-label">Course code <span className="font-normal text-[#a0a3b8]">(optional)</span><input value={newSubjectCode} onChange={(event) => setNewSubjectCode(event.target.value)} className="text-input" placeholder="CS408" /></label><label className="syllabus-toggle"><input type="checkbox" checked={newSubjectHasSyllabus} onChange={(event) => setNewSubjectHasSyllabus(event.target.checked)} /><span><strong>Add syllabus</strong><small>Optional — you can add units now or keep this subject as a blank tracker.</small></span></label>{newSubjectHasSyllabus && <label className="field-label">Syllabus units <span className="font-normal text-[#a0a3b8]">(one per line)</span><textarea value={newSubjectSyllabus} onChange={(event) => setNewSubjectSyllabus(event.target.value)} className="text-input min-h-[110px] resize-none" placeholder={"Unit 1 — Introduction\nUnit 2 — Core concepts\nUnit 3 — Practice"} /></label>}</div><button disabled={!newSubjectName.trim()} className="primary-button mt-5 w-full justify-center" onClick={addSubject}>Add subject <Plus size={16} /></button>
        </Modal>}
        {activeQuiz && <QuizModal quiz={activeQuiz} index={quizIndex} selected={selectedOption} setSelected={setSelectedOption} submit={submitAnswer} next={nextQuestion} onClose={() => setActiveQuiz(null)} />}
      </AnimatePresence>
    </div>
  );
}

function StudyLogView({ logs, subjects, onLog }: { logs: StudyLog[]; subjects: Subject[]; onLog: () => void }) {
  const [filter, setFilter] = useState("all");
  const filteredLogs = filterLogsBySubject(logs, filter);
  const totalMinutes = sumStudyMinutes(filteredLogs);
  const subjectName = (subjectId: string) => subjects.find((subject) => subject.id === subjectId)?.name ?? "Other study";
  const subjectCode = (subjectId: string) => subjects.find((subject) => subject.id === subjectId)?.code ?? "—";
  return <>
    <section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line green-line" /> study log</div><h1>Every block counts.</h1><p>Keep a visible record of the work behind your progress. Filter by subject when you need proof that you are moving.</p></div><button onClick={onLog} className="primary-button"><Plus size={16} /> Log study</button></section>
    <section className="log-summary"><div><div className="log-summary-icon purple"><Clock3 size={18} /></div><div><span>Total logged</span><strong>{formatDuration(totalMinutes)}</strong><small>{filter === "all" ? "across this semester" : "for this subject"}</small></div></div><div><div className="log-summary-icon coral"><BookOpenCheck size={18} /></div><div><span>Study blocks</span><strong>{filteredLogs.length}</strong><small>small wins recorded</small></div></div><div><div className="log-summary-icon green"><NotebookPen size={18} /></div><div><span>Reflections</span><strong>{filteredLogs.filter((log) => log.reflection && log.reflection !== "No reflection added.").length}</strong><small>notes worth revisiting</small></div></div></section>
    <div className="log-toolbar"><div><div className="panel-kicker">RECENT BLOCKS</div><h2 className="section-title">Your semester trail</h2></div><div className="log-filters"><button onClick={() => setFilter("all")} className={`filter-chip ${filter === "all" ? "selected" : ""}`}>All subjects</button>{subjects.map((subject) => <button key={subject.id} onClick={() => setFilter(subject.id)} className={`filter-chip ${filter === subject.id ? "selected" : ""}`}>{subject.code}</button>)}</div></div>
    <div className="log-list">{filteredLogs.length === 0 ? <div className="log-empty"><NotebookPen size={22} /><strong>No blocks for this subject yet.</strong><span>Log the next 25 minutes and start the trail.</span><button onClick={onLog} className="text-button">Add first block <ChevronRight size={14} /></button></div> : filteredLogs.map((log) => <div className="log-entry" key={log.id}><div className="log-entry-date">{log.date}</div><div className="log-entry-icon" style={{ background: `${subjects.find((subject) => subject.id === log.subjectId)?.color ?? "#6d5dfc"}18`, color: subjects.find((subject) => subject.id === log.subjectId)?.color ?? "#6d5dfc" }}><BookOpen size={18} /></div><div className="min-w-0 flex-1"><div className="log-entry-title">{log.title}</div><div className="log-entry-subject">{subjectCode(log.subjectId)} · {subjectName(log.subjectId)} <span>·</span> <span className={`track-inline ${log.track === "GATE prep" ? "gate" : ""}`}>{log.track}</span></div>{log.syllabusUnit && <div className="log-entry-unit"><BookOpenCheck size={12} /> {log.syllabusUnit}</div>}<p>{log.reflection}</p></div><div className="log-entry-time"><strong>{log.minutes}m</strong><span>focus block</span></div></div>)}</div>
    <div className="bottom-note"><Sparkles size={16} /><span>Log the attempt even when the session felt messy. The trail is how you avoid starting from zero.</span></div>
  </>;
}

function TodayView({ profile, streak, streakCompletedToday, completeStreakDay, tasks, completedMinutes, completedTasks, progressPercent, dateLabel, toggleTask, openRecovery, goTo }: { profile: Profile; streak: Streak; streakCompletedToday: boolean; completeStreakDay: () => void; tasks: Task[]; completedMinutes: number; completedTasks: number; progressPercent: number; dateLabel: string; toggleTask: (id: string) => void; openRecovery: () => void; goTo: (view: View) => void }) {
  const todayDuration = formatDuration(completedMinutes);
  return <>
    <section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> {dateLabel}</div><h1>Good afternoon, {profile.name}.</h1><p>Keep the chain alive, not perfect. Your next best step is already waiting.</p></div><div className="heading-actions"><button onClick={completeStreakDay} disabled={streakCompletedToday} className="secondary-button"><Flame size={15} /> {streakCompletedToday ? "Today counted" : "Count today"}</button><button onClick={openRecovery} className="secondary-button"><RefreshCcw size={15} /> I missed a day</button><button onClick={() => goTo("quizzes")} className="secondary-button"><BrainCircuit size={15} /> Quick quiz</button></div></section>
    <section className="stat-grid"><StatCard icon={<Clock3 size={18} />} label="Today logged" value={todayDuration} note="of 3h target" tone="purple" /><StatCard icon={<Flame size={18} />} label="Momentum" value="76%" note="+8% this week" tone="coral" /><StatCard icon={<CircleCheckBig size={18} />} label="Blocks done" value={`${completedTasks}/4`} note="2 still gentle" tone="green" /><StatCard icon={<Trophy size={18} />} label="Current streak" value={`${streak.current} day${streak.current === 1 ? "" : "s"}`} note={`Best: ${streak.best} days`} tone="gold" /></section>
    <section className="dashboard-grid mt-5"><div className="hero-card"><div className="hero-card-top"><div><div className="hero-label"><span className="pulse-dot" /> TODAY'S RHYTHM</div><h2>Progress survives<br /><em>imperfect days.</em></h2><p>Three focused hours is the target. Today only needs the next 25 minutes to count.</p></div><div className="hero-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><Zap size={21} fill="currentColor" /><span>{Math.min(progressPercent, 100)}%</span></div></div></div><div className="hero-progress-row"><div className="hero-progress"><div className="hero-progress-fill" style={{ width: `${Math.min(progressPercent, 100)}%` }} /></div><span>{completedMinutes} / 180 min</span></div><div className="hero-bottom"><span><Sparkles size={14} /> Recovery-friendly plan active</span><button onClick={openRecovery} className="hero-link">See the fallback plan <ChevronRight size={15} /></button></div></div><WeekPulse /></section>
    <section className="content-grid mt-5"><div className="panel"><div className="panel-header"><div><div className="panel-kicker">YOUR NEXT BLOCKS</div><h3>Today’s focus</h3></div><button className="text-button">Edit plan <ChevronRight size={15} /></button></div><div className="task-list">{tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />)}</div></div><div className="panel next-panel"><div className="panel-header"><div><div className="panel-kicker">UP NEXT</div><h3>One thing to remember</h3></div><NotebookPen size={19} className="muted-icon" /></div><div className="note-card"><div className="note-pin"><BookOpenCheck size={17} /></div><div><div className="note-title">Recall before you reread</div><p>Try to sketch the 3NF rules from memory before opening your notes. The tiny struggle is the learning.</p></div></div><div className="up-next-row"><div className="up-next-icon"><Target size={17} /></div><div className="flex-1"><div className="text-[13px] font-bold text-[#35395e]">GATE mock · Sunday</div><div className="mt-1 text-[11px] text-[#898ca8]">28 questions · 45 min planned</div></div><button onClick={() => goTo("gate")} className="round-arrow"><ChevronRight size={16} /></button></div><div className="quote-strip"><Sparkles size={15} /><span>“Consistency is a direction, not a streak.”</span></div></div></section>
  </>;
}

function StatCard({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: string; note: string; tone: string }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="min-w-0"><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div><div className="stat-spark"><span /><span /><span /><span /><span /></div></div>; }

function WeekPulse() { return <div className="panel week-panel"><div className="panel-header"><div><div className="panel-kicker">THIS WEEK</div><h3>Week pulse</h3></div><div className="week-total">8h 50m</div></div><div className="week-grid">{week.map((day) => <div key={day.day} className={`week-day ${day.status}`}><div className="week-day-name">{day.day}</div><div className="week-day-date">{day.date}</div><div className="week-day-bar"><div style={{ height: `${day.minutes ? Math.min(100, Math.max(18, day.minutes / 2.3)) : 10}%` }} /></div><div className="week-day-status">{day.status === "today" ? "now" : day.status === "upcoming" ? "—" : day.status === "partial" ? "light" : "done"}</div></div>)}</div><div className="week-footer"><span><span className="legend-dot purple" /> Study time</span><span><span className="legend-dot coral" /> Today</span><span>1 light day · still on track</span></div></div>; }

function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) { return <div className={`task-row ${task.complete ? "complete" : ""}`}><button onClick={onToggle} className={`task-check ${task.complete ? "checked" : ""}`} aria-label={task.complete ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}>{task.complete && <Check size={14} strokeWidth={3} />}</button><div className="min-w-0 flex-1"><div className="task-title">{task.title}</div><div className="task-detail">{task.detail}</div></div><span className={`task-tag ${task.category.toLowerCase()}`}>{task.tag}</span><div className="task-time"><Clock3 size={13} /> {task.minutes}m</div><button className="task-more" aria-label="Task options">···</button></div>; }

function SemesterView({ profile, subjects, onAdd, onLoadSemV, onToggleUnit }: { profile: Profile; subjects: Subject[]; onAdd: () => void; onLoadSemV: () => void; onToggleUnit: (subjectId: string, unit: string) => void }) { return <><section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> semester cockpit</div><h1>Make every unit visible.</h1><p>{profile.name} · {profile.program} · {profile.semester}. A calm overview of what is moving, what is next, and where a small review will unlock the most.</p></div><div className="heading-actions"><button onClick={onLoadSemV} className="secondary-button"><BookOpen size={15} /> Load SEM-V syllabus</button><button onClick={onAdd} className="primary-button"><Plus size={16} /> Add subject</button></div></section><div className="semester-banner"><div className="semester-banner-icon"><GraduationCap size={22} /></div><div className="flex-1"><div className="banner-kicker">{profile.program.toUpperCase()} · {profile.semester.toUpperCase()}</div><div className="banner-title">Set up the semester once.</div><div className="banner-copy">Import DAA, IoT, C#, Blockchain and Industrial Sociology from your syllabus, or add a blank subject and fill it later.</div></div><div className="semester-score"><span>Topics completed</span><strong>{subjects.reduce((total, subject) => total + (subject.completedUnits?.length ?? 0), 0)}</strong><div className="score-bar"><div style={{ width: `${Math.min(100, subjects.reduce((total, subject) => total + (subject.progress ?? 0), 0) / Math.max(1, subjects.length))}%` }} /></div></div></div><div className="section-row"><div><div className="panel-kicker">SUBJECT BOARD</div><h2 className="section-title">Your semester</h2></div><div className="filter-chip"><span className="chip-dot" /> {subjects.length} active subjects</div></div><div className="subject-grid">{subjects.map((subject) => <SubjectCard subject={subject} key={subject.id} onToggleUnit={onToggleUnit} />)}</div><div className="bottom-note"><Sparkles size={16} /><span>Check off each topic as you study it. Progress is saved to your PostgreSQL workspace.</span></div></>; }

function SubjectCard({ subject, onToggleUnit }: { subject: Subject; onToggleUnit: (subjectId: string, unit: string) => void }) { const completedUnits = subject.completedUnits ?? []; return <div className="subject-card"><div className="subject-card-accent" style={{ background: subject.color }} /><div className="subject-top"><div><span className="subject-code">{subject.code}</span><h3>{subject.name}</h3><p>{subject.professor}</p></div><div className="subject-percent" style={{ color: subject.color }}>{subject.progress}%</div></div><div className="subject-progress"><div style={{ width: `${subject.progress}%`, background: subject.color }} /></div><div className="subject-meta"><span>{subject.target}</span><span>{subject.hours}</span></div>{subject.hasSyllabus && subject.syllabus?.length ? <div className="syllabus-section"><div className="syllabus-section-heading"><span><BookOpenCheck size={12} /> Syllabus units</span><small>{completedUnits.length}/{subject.syllabus.length} done</small></div><div className="syllabus-unit-list">{subject.syllabus.map((unit) => <button key={unit} onClick={() => onToggleUnit(subject.id, unit)} className={`syllabus-unit-row ${completedUnits.includes(unit) ? "completed" : ""}`} aria-pressed={completedUnits.includes(unit)}><span className="syllabus-unit-check">{completedUnits.includes(unit) && <Check size={11} strokeWidth={3} />}</span><span>{unit}</span></button>)}</div></div> : <div className="syllabus-preview blank"><span className="syllabus-badge blank-badge">No syllabus yet</span><span className="syllabus-first">Add units whenever you are ready</span></div>}<div className="subject-next"><div><span className="next-label">NEXT UP</span><span className="next-value">{subject.next}</span></div><button className="round-arrow"><ChevronRight size={16} /></button></div></div>; }

function GateView({ goTo }: { goTo: (view: View) => void }) { return <><section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line coral-line" /> GATE 2027 runway</div><h1>Train for the exam,<br /><span className="coral-text">not the panic.</span></h1><p>Build depth in the topics that matter, then use recall to turn coverage into marks.</p></div><button onClick={() => goTo("quizzes")} className="primary-button"><Play size={15} fill="currentColor" /> Start a quiz</button></section><div className="gate-grid"><div className="gate-hero"><div className="gate-hero-copy"><div className="gate-pill"><Target size={14} /> 154 days to GATE</div><h2>Foundation<br /><em>→ application</em></h2><p>You are in the build phase. Prioritize OS, DBMS and Algorithms this week; keep aptitude warm with short reps.</p><div className="gate-metrics"><div><strong>42%</strong><span>syllabus touched</span></div><div><strong>68%</strong><span>avg. quiz accuracy</span></div><div><strong>12</strong><span>PYQs this week</span></div></div></div><div className="gate-arc"><div className="arc-track" /><div className="arc-fill" /><div className="arc-label"><span>Week 06</span><strong>on runway</strong></div></div></div><div className="panel phase-panel"><div className="panel-kicker">PREP PHASE</div><h3>Build the base</h3><div className="phase-list"><div className="phase done"><span>01</span><div><strong>Orientation</strong><small>Done · 2 weeks</small></div><Check size={15} /></div><div className="phase active"><span>02</span><div><strong>Build the base</strong><small>Current · 8 of 12 weeks</small></div><i /></div><div className="phase"><span>03</span><div><strong>Mixed practice</strong><small>Up next · 6 weeks</small></div></div><div className="phase"><span>04</span><div><strong>Mocks & polish</strong><small>Later · 4 weeks</small></div></div></div></div></div><section className="content-grid mt-5"><div className="panel"><div className="panel-header"><div><div className="panel-kicker">WEEKLY FOCUS</div><h3>Where your time should go</h3></div><span className="soft-badge">9h target</span></div><div className="gate-subject-row"><div className="gate-subject-label"><span className="subject-dot purple-dot" /><span>Operating Systems</span><strong>3h 10m</strong></div><div className="wide-bar"><div className="bar-purple" style={{ width: "74%" }} /></div><small>74% of target</small></div><div className="gate-subject-row"><div className="gate-subject-label"><span className="subject-dot coral-dot" /><span>Algorithms</span><strong>2h 25m</strong></div><div className="wide-bar"><div className="bar-coral" style={{ width: "58%" }} /></div><small>58% of target</small></div><div className="gate-subject-row"><div className="gate-subject-label"><span className="subject-dot green-dot" /><span>DBMS</span><strong>1h 40m</strong></div><div className="wide-bar"><div className="bar-green" style={{ width: "43%" }} /></div><small>43% of target</small></div><div className="gate-subject-row"><div className="gate-subject-label"><span className="subject-dot gold-dot" /><span>Aptitude</span><strong>1h 05m</strong></div><div className="wide-bar"><div className="bar-gold" style={{ width: "31%" }} /></div><small>31% of target</small></div></div><div className="panel score-panel"><div className="panel-header"><div><div className="panel-kicker">RECENT SIGNAL</div><h3>Mock score trend</h3></div><div className="trend-up">↗ 12% <span>this month</span></div></div><div className="score-chart"><div className="chart-y"><span>80</span><span>60</span><span>40</span><span>20</span></div><div className="chart-bars">{[{ h: 42, label: "M1" }, { h: 49, label: "M2" }, { h: 45, label: "M3" }, { h: 63, label: "M4" }, { h: 70, label: "M5" }].map((item, index) => <div className="chart-col" key={item.label}><div className={`chart-bar ${index === 4 ? "latest" : ""}`} style={{ height: `${item.h}%` }} /><span>{item.label}</span></div>)}</div></div><div className="score-callout"><Gauge size={16} /><span>Keep the next mock <strong>mixed</strong> — single-subject scores are already rising.</span></div></div></section></>; }

function QuizzesView({ quizzes, startQuiz }: { quizzes: Quiz[]; startQuiz: (quiz: Quiz) => void }) { return <><section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line green-line" /> active recall lab</div><h1>Turn “I know it”<br /><span className="green-text">into proof.</span></h1><p>Every quiz is generated from your syllabus. Warm-up, Core, and Challenge levels change the question style as your understanding grows.</p></div><div className="quiz-score"><div className="quiz-score-icon"><BrainCircuit size={19} /></div><div><span>Quiz accuracy</span><strong>68%</strong></div></div></section><div className="quiz-summary"><div><span className="summary-number">{String(quizzes.length).padStart(2, "0")}</span><span className="summary-label">syllabus quizzes</span></div><div><span className="summary-number">{String(quizzes.reduce((total, quiz) => total + quiz.questions.length, 0)).padStart(2, "0")}</span><span className="summary-label">questions ready</span></div><div><span className="summary-number">03</span><span className="summary-label">levels per subject</span></div><div className="summary-quote"><Sparkles size={16} /> Retrieval adapts to the units you have completed.</div></div><div className="section-row mt-6"><div><div className="panel-kicker">QUIZ LIBRARY</div><h2 className="section-title">Pick a syllabus rep</h2></div><div className="filter-chip">All subjects <ChevronRight size={14} /></div></div><div className="quiz-grid">{quizzes.map((quiz) => <div className="quiz-card" key={quiz.id}><div className="quiz-card-top"><div className="quiz-card-icon" style={{ background: `${quiz.color}16`, color: quiz.color }}><BrainCircuit size={20} /></div><span className={`difficulty ${quiz.difficulty.toLowerCase().replace("-", "")}`}>{quiz.difficulty}</span></div><h3>{quiz.title}</h3><p>{quiz.subject}</p><div className="quiz-card-meta"><span><Clock3 size={13} /> {quiz.duration}</span><span><ListChecks size={13} /> {quiz.questions.length} Qs</span><span>{quiz.attempts} attempts</span></div><button onClick={() => startQuiz(quiz)} className="quiz-start">Start quiz <Play size={14} fill="currentColor" /></button></div>)}</div><div className="bottom-note mt-6"><Trophy size={16} /><span>Warm-up finds the topic, Core checks the method, and Challenge asks you to transfer it.</span></div></>; }

function InsightsView({ completedMinutes }: { completedMinutes: number }) { return <><section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line gold-line" /> your learning signals</div><h1>Notice what helps<br /><span className="gold-text">you return.</span></h1><p>Insights are here to reduce friction — not to turn your study life into another exam.</p></div><button className="secondary-button"><CalendarDays size={15} /> Last 30 days <ChevronRight size={14} /></button></section><div className="insights-grid"><div className="panel consistency-card"><div className="panel-kicker">CONSISTENCY</div><div className="consistency-big">76<span>%</span></div><p>of planned study days had at least one meaningful block.</p><div className="consistency-bars">{[48, 75, 61, 85, 42, 91, 70, 80, 55, 95, 74, 83].map((height, index) => <span key={index} style={{ height: `${height}%` }} className={index > 8 ? "active" : ""} />)}</div><div className="insight-caption"><span><i className="tiny-dot purple" /> Last 12 days</span><strong>+14% vs. last month</strong></div></div><div className="panel time-card"><div className="panel-kicker">TIME MIX</div><h3>Hours by track</h3><div className="time-mix"><div className="donut"><div className="donut-hole"><strong>27.5</strong><span>hours</span></div></div><div className="mix-legend"><div><i className="tiny-dot purple" /><span>Semester</span><strong>14.2h</strong></div><div><i className="tiny-dot coral" /><span>GATE prep</span><strong>10.8h</strong></div><div><i className="tiny-dot green" /><span>Recall & review</span><strong>2.5h</strong></div></div></div></div><div className="panel insight-wide"><div className="panel-header"><div><div className="panel-kicker">RETURN PATTERNS</div><h3>Your best study window</h3></div><div className="time-window"><Clock3 size={16} /> 7:00 – 9:00 PM</div></div><div className="window-content"><div className="window-graphic"><div className="window-line" /><span className="window-point p1" /><span className="window-point p2" /><span className="window-point p3" /><span className="window-point p4" /><span className="window-point p5" /></div><div className="window-copy"><div className="text-[14px] font-bold text-[#34385e]">Evening focus is 1.4× stronger</div><p>When a day slips, protect this window instead of trying to “make up” the whole plan. Your data says a small evening return works.</p><button className="text-button">Build an evening routine <ChevronRight size={15} /></button></div></div></div><div className="panel insight-wide"><div className="panel-header"><div><div className="panel-kicker">COVERAGE GAPS</div><h3>Topics asking for a revisit</h3></div><span className="soft-badge coral-badge">3 gentle nudges</span></div><div className="gap-list"><div><div className="gap-label"><span className="subject-dot coral-dot" /> OS · Synchronization <small>last touched 8 days ago</small></div><div className="gap-action">15 min recall <ChevronRight size={14} /></div></div><div><div className="gap-label"><span className="subject-dot purple-dot" /> Algorithms · MST <small>quiz accuracy 52%</small></div><div className="gap-action">6 question sprint <ChevronRight size={14} /></div></div><div><div className="gap-label"><span className="subject-dot green-dot" /> DBMS · Functional dependencies <small>due for review</small></div><div className="gap-action">Flashcards <ChevronRight size={14} /></div></div></div></div></div><div className="insight-footnote"><Sparkles size={15} /> You logged {completedMinutes} minutes today. The point of insights is a kinder next decision.</div></>; }

function Modal({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: React.ReactNode }) { return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><motion.div className="modal-card" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.18 }}><div className="modal-header"><div><div className="panel-kicker">{eyebrow}</div><h2>{title}</h2></div><button onClick={onClose} className="icon-ghost"><X size={18} /></button></div>{children}</motion.div></motion.div>; }

function QuizModal({ quiz, index, selected, setSelected, submit, next, onClose }: { quiz: Quiz; index: number; selected: number | null; setSelected: (value: number) => void; submit: () => void; next: () => void; onClose: () => void }) { const question = quiz.questions[index]; return <Modal title={quiz.title} eyebrow={`${quiz.subject} · Question ${index + 1} of ${quiz.questions.length}`} onClose={onClose}><div className="quiz-progress"><div style={{ width: `${((index + 1) / quiz.questions.length) * 100}%` }} /></div><div className="quiz-question">{question.prompt}</div><div className="quiz-options">{question.choices.map((choice, choiceIndex) => <button key={choice} onClick={() => setSelected(choiceIndex)} className={`quiz-option ${selected === choiceIndex ? "selected" : ""}`}><span>{String.fromCharCode(65 + choiceIndex)}</span>{choice}</button>)}</div><div className="quiz-modal-footer"><span>{selected === null ? "Choose an answer to continue" : "Answer selected"}</span>{selected === null ? <button disabled className="primary-button disabled">Check answer</button> : <button onClick={() => { submit(); next(); }} className="primary-button">{index === quiz.questions.length - 1 ? "Finish quiz" : "Check & next"} <ChevronRight size={15} /></button>}</div></Modal>; }
