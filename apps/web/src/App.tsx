import React, {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
} from "react";
import {
  applyTutorEvent,
  parseTutorEvent,
  tutorRetryContext,
} from "./tutor-stream";
import { usePagedData, PageControls } from "./paged-data";
import { plainPreview } from "./preview-text";
import { usageDisplay } from "./usage-display";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  Home as HomeIcon,
  Map,
  BookOpen,
  Library,
  BarChart3,
  Settings as SettingsIcon,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Play,
  Send,
  Code2,
  Check,
  AlertCircle,
  RefreshCw,
  Bookmark,
  Copy,
  Download,
  Plus,
  Minus,
  Maximize,
  GraduationCap,
  History,
  Loader2,
  Terminal,
  PanelLeft,
  RotateCcw,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor/editor/editor.api";
import "monaco-editor/languages/definitions/java/register";
import "monaco-editor/languages/definitions/cpp/register";
import "monaco-editor/languages/definitions/python/register";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
(window as any).MonacoEnvironment = { getWorker: () => new EditorWorker() };
import { loader } from "@monaco-editor/react";
import {
  LessonRenderer,
  lessonSections,
} from "../../../packages/lesson-renderer/src";
import { api, download, RequestError } from "./api";
import { Dialog as Confirm } from "./Dialog";
import { Assessment, AssessmentWorkspacePanel } from "./Assessment";
import { Sources } from "./Sources";
import { ProblemNotes } from "./ProblemNotes";
import { RuntimeMeasurements } from "./RuntimeMeasurements";
import { CommandSearch } from "./CommandSearch";
import { TopicSuggestion } from "./TopicSuggestion";
import { LiveLesson } from "./LiveLesson";
loader.config({ monaco });
monaco.editor.defineTheme("codewise-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#0e121b",
    "editor.foreground": "#e7ebf4",
    "editorLineNumber.foreground": "#7e8ba3",
    "editorLineNumber.activeForeground": "#9aaaff",
    "editor.selectionBackground": "#46568a88",
    "editorCursor.foreground": "#9aaaff",
    "editor.lineHighlightBackground": "#151b27",
    "editorIndentGuide.background1": "#2b3547",
  },
});
monaco.editor.defineTheme("codewise-light", {
  base: "vs",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#ffffff",
    "editor.foreground": "#1b2538",
    "editorLineNumber.foreground": "#7a879a",
    "editorLineNumber.activeForeground": "#4355b6",
    "editor.selectionBackground": "#bfc9ed88",
    "editorCursor.foreground": "#4355b6",
    "editor.lineHighlightBackground": "#f5f7fb",
    "editorIndentGuide.background1": "#d9dfeb",
  },
});
const effectiveTheme = (mode: string) =>
  mode === "system"
    ? matchMedia("(prefers-color-scheme:light)").matches
      ? "light"
      : "dark"
    : mode;
type Topic = {
  id: string;
  name: string;
  quota: number;
  count: number;
  independent: number;
  assisted: number;
};
type State = {
  bootstrap: any;
  topics: Topic[];
  refresh: () => Promise<void>;
  notify: (text: string) => void;
  savePreferences: (data: any) => Promise<void>;
  syncError: any;
};
const Context = createContext<State>(null as any);
const useApp = () => useContext(Context);
const languageName = (id: string) =>
  ({ cpp: "C++", java: "Java", python: "Python" })[id] || id;
let displayTimezone: string | undefined;
const date = (value: string, timezone = displayTimezone) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: timezone,
      })
    : "Not recorded";
const statusLabel = (s: string) =>
  s?.replaceAll("_", " ").replace(/^./, (x) => x.toUpperCase()) || "Unknown";
function ErrorNotice({ error, retry }: { error: any; retry?: () => void }) {
  return (
    <div className="notice error" role="alert">
      <AlertCircle size={18} />
      <div>
        <strong>{error?.message || String(error)}</strong>
        {error?.recoveryAction && <div>{error.recoveryAction}</div>}
        {retry && (
          <button className="ghost" onClick={retry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
function Empty({
  title,
  children,
  icon: Icon = BookOpen,
}: {
  title: string;
  children: React.ReactNode;
  icon?: any;
}) {
  return (
    <div className="empty">
      <Icon size={25} />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
function Loading() {
  return (
    <div className="page" aria-label="Loading" aria-busy="true">
      <div className="skeleton" style={{ width: "35%" }} />
      <div className="skeleton" style={{ width: "60%" }} />
      <div className="skeleton big" />
      <div className="skeleton big" />
    </div>
  );
}
function useData<T = any>(path: string) {
  const sequence = useRef(0);
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState<any>(null),
    [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true);
    setError(null);
    try {
      const incoming = await api<T>(path);
      if (request === sequence.current) setData(incoming);
    } catch (e) {
      if (request === sequence.current) setError(e);
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    void reload();
    return () => {
      sequence.current++;
    };
  }, [reload]);
  return { data, error, loading, reload, setData };
}
export default function App() {
  const [bootstrap, setBootstrap] = useState<any>(null),
    [topics, setTopics] = useState<Topic[]>([]),
    [error, setError] = useState<any>(null),
    [toast, setToast] = useState(""),
    [, setSystemTheme] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const b = await api("bootstrap");
      setBootstrap(b);
      setTopics(await api("topics"));
      setError(null);
    } catch (e) {
      setError(e);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!bootstrap) return;
    const p = bootstrap.preferences;
    const query = matchMedia("(prefers-color-scheme:light)");
    const apply = () => {
      document.documentElement.dataset.theme =
        p.theme === "system" ? (query.matches ? "light" : "dark") : p.theme;
      setSystemTheme(query.matches);
    };
    apply();
    document.documentElement.dataset.reducedMotion = String(p.reducedMotion);
    query.addEventListener("change", apply);
    document.documentElement.style.fontSize = `${Math.min(18, Math.max(14, p.fontSize || 15))}px`;
    document.documentElement.style.setProperty(
      "--lesson-size",
      `${Math.min(22, Math.max(15, (p.fontSize || 15) + 1))}px`,
    );
    return () => query.removeEventListener("change", apply);
  }, [bootstrap]);
  const notify = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 5000);
  };
  const savePreferences = async (data: any) => {
    await api("settings", "PUT", data);
    await refresh();
  };
  if (error && !bootstrap)
    return (
      <div className="page">
        <h1>CodeWise2</h1>
        <ErrorNotice error={error} retry={refresh} />
      </div>
    );
  if (!bootstrap) return <Loading />;
  displayTimezone = bootstrap.preferences.timezone;
  return (
    <Context.Provider
      value={{
        bootstrap,
        topics,
        refresh,
        notify,
        savePreferences,
        syncError: error,
      }}
    >
      <BrowserRouter>
        {!bootstrap.preferences.onboarded ? <Welcome /> : <Shell />}
      </BrowserRouter>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </Context.Provider>
  );
}
function Welcome() {
  const { bootstrap, savePreferences, notify } = useApp();
  const navigate = useNavigate();
  const [language, setLanguage] = useState(bootstrap.preferences.language),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [experience, setExperience] = useState("beginner");
  async function start(assessment: boolean) {
    setBusy(true);
    try {
      await savePreferences({ language, displayName: name, onboarded: true });
      if (assessment) {
        await api("assessment/start", "POST", {
          experience,
          language,
        });
        navigate("/assessment");
      }
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="welcome">
      {bootstrap.fixture && (
        <div className="fixture-banner welcome-fixture" role="status">
          DEVELOPMENT TEST FIXTURE · Temporary data · No live provider response
          · Excluded from the released core bank
        </div>
      )}
      <div className="welcome-inner">
        <div className="brand">
          <span className="brand-mark">{"{·}"}</span>CodeWise2<sup>LOCAL</sup>
        </div>
        <div className="eyebrow">Small steps. Lasting understanding.</div>
        <h1>A calmer way to become a better problem solver.</h1>
        <p className="subtitle">
          Write real code. Understand the missing piece. Build confidence one
          manageable challenge at a time.
        </p>
        <div className="language-options">
          {["python", "cpp", "java"].map((l) => (
            <button
              key={l}
              className={language === l ? "selected" : ""}
              aria-pressed={language === l}
              onClick={() => setLanguage(l)}
            >
              <Code2 size={20} />
              <strong>{languageName(l)}</strong>
              <small>
                {language === l
                  ? "Your preferred language"
                  : "Choose this language"}
              </small>
            </button>
          ))}
        </div>
        <div className="card">
          <div className="field">
            <label htmlFor="name">
              What should we call you? <span className="muted">Optional</span>
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Your name"
            />
          </div>
          <div className="field">
            <label htmlFor="experience">Your starting experience</label>
            <select
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <option value="beginner">I'm new to problem solving</option>
              <option value="some">I've used loops and arrays</option>
              <option value="comfortable">
                I've practised data structures and algorithms
              </option>
            </select>
          </div>
          <div className="notice">
            <Terminal size={18} />
            <div>
              <strong>
                {bootstrap.runner.ready
                  ? "Local runner ready"
                  : "Local runner needs setup"}
              </strong>
              <div>
                {bootstrap.runner.message} You can always read problems and save
                code.
              </div>
            </div>
          </div>
          <div className="actions">
            <button
              className="primary"
              disabled={busy}
              onClick={() => start(false)}
            >
              Start from the beginning <ArrowRight size={16} />
            </button>
            <button disabled={busy} onClick={() => start(true)}>
              Explore my starting point
            </button>
          </div>
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 20 }}>
          Your work stays on this device. DeepSeek tutoring is optional and can
          be configured in Settings.
        </p>
      </div>
    </div>
  );
}
const navigation = [
  ["/", "Home", HomeIcon],
  ["/roadmap", "Learning roadmap", Map],
  ["/problems", "Problem library", BookOpen],
  ["/library", "Learning Library", Library],
  ["/progress", "Your progress", BarChart3],
  ["/settings", "Settings", SettingsIcon],
  ["/sources", "Sources & licenses", ShieldCheck],
] as const;
function Shell() {
  const { bootstrap, topics, savePreferences, syncError, refresh } = useApp();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("codewise2.sidebar-collapsed") !== "false";
    } catch {
      return true;
    }
  });
  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("codewise2.sidebar-collapsed", String(next));
    } catch {
      // Navigation remains usable when browser storage is unavailable.
    }
  };
  const [compact, setCompact] = useState(window.innerWidth <= 800);
  useEffect(() => {
    const query = matchMedia("(max-width:800px)");
    const change = () => setCompact(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!open) return;
    document.querySelector<HTMLElement>("aside .nav a")?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        document.querySelector<HTMLElement>(".mobile-menu")?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  const topicRoute = location.pathname.match(/^\/topics\/([^/]+)$/);
  const title = topicRoute
    ? topics.find((topic) => topic.id === topicRoute[1])?.name || "Topic"
    : navigation.find(([path]) =>
        path === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(path),
      )?.[1] || "Practice workspace";
  return (
    <div className="app">
      <aside
        className={`sidebar ${open ? "open" : ""} ${collapsed && !compact ? "collapsed" : ""}`}
        inert={compact && !open}
      >
        <div className="sidebar-heading">
          <Link to="/" className="brand" aria-label="CodeWise2 home">
            <span className="brand-mark">{"{·}"}</span>
            <span className="sidebar-label">CodeWise2</span>
          </Link>
        </div>
        <nav className="nav" aria-label="Main navigation">
          {navigation.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              aria-label={label}
              title={collapsed && !compact ? label : undefined}
            >
              <Icon size={18} />
              <span className="sidebar-label">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div
            title={bootstrap.runner.ready ? "Runner ready" : "Runner not ready"}
            style={{ marginBottom: 9 }}
          >
            <span
              className="status-dot"
              style={{
                background: bootstrap.runner.ready
                  ? "var(--success)"
                  : undefined,
              }}
            />
            <span className="sidebar-label">
              {bootstrap.runner.ready ? "Runner ready" : "Runner not ready"}
            </span>
          </div>
          <button
            className="ghost sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft size={18} />
          </button>
        </div>
        <button className="mobile-close" onClick={() => setOpen(false)}>
          Close navigation <X size={16} />
        </button>
      </aside>
      <main className="main">
        {bootstrap.fixture && (
          <div className="fixture-banner" role="status">
            DEVELOPMENT TEST FIXTURE · Temporary data · No live DeepSeek
            response · Excluded from the released core bank
            {bootstrap.catalogue.preview > 0 &&
              ` · ${bootstrap.catalogue.preview} draft questions in this validation preview`}
          </div>
        )}
        <header className="topbar">
          <button
            className="ghost mobile-menu"
            aria-label="Open navigation"
            onClick={() => setOpen(!open)}
          >
            <Menu size={20} />
          </button>
          <span className="breadcrumb">
            Your workspace <span style={{ margin: "0 9px" }}> / </span> {title}
          </span>
          <div className="topbar-actions">
            <CommandSearch
              topics={topics}
              destinations={navigation.map(([href, label]) => ({
                href,
                label,
              }))}
            />
            <span className="muted" style={{ fontSize: 12 }}>
              <span
                className="status-dot"
                style={{ background: "var(--success)" }}
              />{" "}
              On this device
            </span>
            <button
              className="ghost"
              aria-label="Toggle light and dark theme"
              onClick={() =>
                savePreferences({
                  theme:
                    document.documentElement.dataset.theme === "dark"
                      ? "light"
                      : "dark",
                })
              }
            >
              {document.documentElement.dataset.theme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>
            <span className="avatar">
              {(bootstrap.preferences.displayName || "You")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
        </header>
        {syncError && (
          <div style={{ padding: "16px 24px 0" }}>
            <ErrorNotice error={syncError} retry={refresh} />
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/assessment"
            element={
              <Assessment preferredLanguage={bootstrap.preferences.language} />
            }
          />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/topics/:id" element={<Problems topicDetail />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:id" element={<Workspace />} />
          <Route path="/library" element={<LearningLibrary />} />
          <Route path="/library/:id" element={<Lesson />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sources" element={<Sources />} />
          <Route
            path="*"
            element={
              <div className="page">
                <Empty title="This page could not be found">
                  <Link to="/">Return home</Link>
                </Empty>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
function Home() {
  const { bootstrap, topics } = useApp();
  const progress = useData("progress"),
    recommendation = useData(
      `recommendation?language=${bootstrap.preferences.language}`,
    ),
    library = usePagedData("library", 3);
  const p = progress.data;
  const reviewFirst =
    recommendation.data?.practicePresentation?.first === "review";
  const challengeCard = (
    <section className="hero" key="challenge" data-practice-kind="challenge">
      <div className="eyebrow">
        {recommendation.data?.problemId
          ? "Continue learning"
          : "Choose your focus"}
      </div>
      <h2>
        {recommendation.data?.problemId
          ? "Your next challenge is ready."
          : "Choose a learning path."}
      </h2>
      <p>
        {recommendation.data?.rationale ||
          "Explore the roadmap and choose a topic. Your starting point will follow real practice evidence."}
      </p>
      {recommendation.data?.problemId &&
        recommendation.data?.learningRequirement && (
          <p>
            <strong>What you’ll practise: </strong>
            {recommendation.data.learningRequirement}
          </p>
        )}
      <div className="actions">
        <Link
          className="primary"
          style={{
            padding: "11px 16px",
            borderRadius: 8,
            color: "#fff",
            display: "inline-flex",
            gap: 10,
            alignItems: "center",
          }}
          to={
            recommendation.data?.problemId
              ? `/problems/${recommendation.data.problemId}`
              : "/problems"
          }
        >
          {recommendation.data?.problemId
            ? "Continue learning"
            : "Browse problems"}{" "}
          <ArrowRight size={16} />
        </Link>
        <Link to="/roadmap">Explore roadmap</Link>
      </div>
      <div className="divider" />
      <small>
        One manageable step at a time · no recorded in-app assistance means
        independent evidence
      </small>
    </section>
  );
  const reviewCard = (
    <section className="card" key="review" data-practice-kind="review">
      <div className="row">
        <h2>Review, when you're ready</h2>
        <History size={19} color="var(--muted)" />
      </div>
      {p?.reviewQueue?.length ? (
        <>
          <div className="stat">{p.reviewQueue.length}</div>
          <p className="muted">
            Previously learned questions are ready for a fresh attempt.
          </p>
          <Link to={`/problems/${p.reviewQueue[0].problemId}?mode=review`}>
            Begin a review →
          </Link>
        </>
      ) : (
        <>
          <div className="stat">0</div>
          <p className="muted">
            No reviews due. Your review queue grows from completed practice.
          </p>
          <small>Missing a day never removes your progress.</small>
        </>
      )}
    </section>
  );
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Your next small step</div>
          <h1>
            {bootstrap.preferences.displayName
              ? `Welcome back, ${bootstrap.preferences.displayName}.`
              : "Make room for understanding."}
          </h1>
          <p className="subtitle">
            A focused challenge, a clearer idea, a little more confidence.
          </p>
        </div>
        <span className="badge">
          {languageName(bootstrap.preferences.language)} practice
        </span>
      </div>
      <div
        className="grid two"
        data-practice-first={reviewFirst ? "review" : "challenge"}
      >
        {reviewFirst
          ? [reviewCard, challengeCard]
          : [challengeCard, reviewCard]}
      </div>
      {recommendation.data?.practicePresentation?.reason && (
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          {recommendation.data.practicePresentation.reason}
        </p>
      )}
      {progress.error && <ErrorNotice error={progress.error} />}
      <div className="grid three section">
        <div className="card">
          <span className="metric-label">Solved independently</span>
          <div className="stat">{p?.independent ?? "—"}</div>
          <small>Without recorded in-app assistance</small>
        </div>
        <div className="card">
          <span className="metric-label">Learned with help</span>
          <div className="stat">{p?.assisted ?? "—"}</div>
          <small>Ready for an independent checkpoint</small>
        </div>
        <div className="card">
          <span className="metric-label">Available questions</span>
          <div className="stat">
            {bootstrap.catalogue.published}
            <span className="muted" style={{ fontSize: 16 }}>
              {" "}
              / {bootstrap.catalogue.expected}
            </span>
          </div>
          <small>Published, validated core catalogue</small>
        </div>
      </div>
      <section className="section">
        <div className="section-head">
          <h2>Your learning paths</h2>
          <Link to="/roadmap">View all 18 topics →</Link>
        </div>
        <div className="topic-grid">
          {topics.slice(0, 3).map((t) => (
            <TopicCard key={t.id} topic={t} />
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Recently saved explanations</h2>
          <Link to="/library">Open Learning Library →</Link>
        </div>
        {library.error ? (
          <ErrorNotice error={library.error} retry={library.reload} />
        ) : library.loading ? (
          <Loading />
        ) : library.data?.items.length ? (
          <div className="card list-card">
            {library.data.items.map((l: any) => (
              <LessonRow key={l.id} lesson={l} />
            ))}
          </div>
        ) : (
          <Empty title="A library that grows with you" icon={Library}>
            <p>
              Every tutor answer saves automatically. Your first hint,
              walkthrough, or clarification will appear here.
            </p>
            <Link to="/settings">Set up optional DeepSeek tutoring →</Link>
          </Empty>
        )}
      </section>
    </div>
  );
}
function TopicCard({ topic: t }: { topic: Topic }) {
  return (
    <Link className="topic-card" to={`/topics/${t.id}`}>
      <div className="row">
        <h3>{t.name}</h3>
        <ChevronRight size={16} />
      </div>
      <small>
        {t.count} available · {t.independent} independent · {t.assisted} with
        help
      </small>
      <div className="progress-bar">
        <span
          style={{
            width: `${Math.min(100, ((t.independent + t.assisted) / t.quota) * 100)}%`,
          }}
        />
      </div>
    </Link>
  );
}
function Roadmap() {
  const { topics } = useApp();
  const [list, setList] = useState(() => window.innerWidth < 600),
    [zoom, setZoom] = useState(0.8),
    [offset, setOffset] = useState({ x: 35, y: 25 });
  const drag = useRef<any>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const coordinates = topics.map((_, i) => ({
    x: 60 + (i % 4) * 220,
    y: 45 + Math.floor(i / 4) * 140,
  }));
  const edges = [
    [0, 1],
    [0, 3],
    [0, 4],
    [1, 2],
    [1, 5],
    [4, 6],
    [3, 7],
    [6, 8],
    [8, 9],
    [6, 10],
    [10, 11],
    [8, 12],
    [12, 13],
    [4, 14],
    [1, 15],
    [0, 16],
    [0, 17],
  ];
  const fit = useCallback(() => {
    const v = viewport.current;
    if (!v) return;
    const nodeWidth = 194,
      nodeHeight = 84,
      minX = 60,
      minY = 45,
      maxX = 60 + Math.min(3, topics.length - 1) * 220 + nodeWidth,
      maxY = 45 + Math.floor((topics.length - 1) / 4) * 140 + nodeHeight;
    const w = maxX - minX,
      h = maxY - minY;
    const next = Math.min(
      1.25,
      (v.clientWidth - 56) / w,
      (v.clientHeight - 80) / h,
    );
    setZoom(Math.max(0.2, next));
    setOffset({
      x: (v.clientWidth - w * next) / 2 - minX * next,
      y: (v.clientHeight - h * next) / 2 - minY * next - 12,
    });
  }, [topics.length]);
  useEffect(() => {
    fit();
    const v = viewport.current;
    if (!v) return;
    const observer = new ResizeObserver(fit);
    observer.observe(v);
    return () => observer.disconnect();
  }, [fit, list]);
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">18 connected learning paths</div>
          <h1>See where understanding leads.</h1>
          <p className="subtitle">
            Connections suggest a learning order. Each question's actual
            prerequisites guide your next step.
          </p>
        </div>
        <button onClick={() => setList(!list)}>
          <PanelLeft size={16} />
          {list ? "Map view" : "Accessible list"}
        </button>
      </div>
      {list ? (
        <div className="topic-grid">
          {topics.map((t) => (
            <TopicCard key={t.id} topic={t} />
          ))}
        </div>
      ) : (
        <div
          className="roadmap-viewport"
          ref={viewport}
          aria-label="Connected topic roadmap"
          onWheel={(e) => {
            if (e.ctrlKey) {
              e.preventDefault();
              setZoom((z) =>
                Math.max(0.35, Math.min(1.5, z - e.deltaY * 0.001)),
              );
            }
          }}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("a,button")) return;
            drag.current = { x: e.clientX, y: e.clientY, offset };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (drag.current)
              setOffset({
                x: drag.current.offset.x + e.clientX - drag.current.x,
                y: drag.current.offset.y + e.clientY - drag.current.y,
              });
          }}
          onPointerUp={() => (drag.current = null)}
        >
          <div
            className="roadmap-world"
            style={{
              transform: `translate(${offset.x}px,${offset.y}px) scale(${zoom})`,
            }}
          >
            <svg width="960" height="780">
              {edges.map(([a, b]) =>
                coordinates[a] && coordinates[b] ? (
                  <path
                    key={`${a}-${b}`}
                    d={`M ${coordinates[a].x + 97} ${coordinates[a].y + 84} C ${coordinates[a].x + 97} ${coordinates[a].y + 120}, ${coordinates[b].x + 97} ${coordinates[b].y - 30}, ${coordinates[b].x + 97} ${coordinates[b].y}`}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="2"
                  />
                ) : null,
              )}
            </svg>
            {topics.map((t, i) => (
              <Link
                key={t.id}
                to={`/topics/${t.id}`}
                className="topic-node"
                style={{ left: coordinates[i].x, top: coordinates[i].y }}
              >
                <strong>{t.name}</strong>
                <small>
                  {t.independent + t.assisted
                    ? `${t.independent} independent · ${t.assisted} with help`
                    : "Not assessed"}{" "}
                  · {t.count}/{t.quota}
                </small>
              </Link>
            ))}
          </div>
          <div className="roadmap-controls">
            <button
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(0.35, z - 0.1))}
            >
              <Minus size={16} />
            </button>
            <span style={{ alignSelf: "center", fontSize: 12, padding: 5 }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            >
              <Plus size={16} />
            </button>
            <button aria-label="Fit roadmap" onClick={fit}>
              <Maximize size={16} />
            </button>
          </div>
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>
        Drag to pan · Ctrl + scroll to zoom · use the list for keyboard
        navigation. Completion and independent evidence are shown separately.
      </p>
    </div>
  );
}
function Problems({ topicDetail = false }: { topicDetail?: boolean }) {
  const { id } = useParams();
  const { topics, bootstrap } = useApp();
  const preview = bootstrap.fixture && bootstrap.catalogue.preview > 0;
  const [q, setQ] = useState(""),
    [topic, setTopic] = useState(id || ""),
    [step, setStep] = useState(""),
    [skill, setSkill] = useState(""),
    [completion, setCompletion] = useState(""),
    [assistance, setAssistance] = useState(""),
    [historyLanguage, setHistoryLanguage] = useState(""),
    [bookmarked, setBookmarked] = useState(false);
  useEffect(() => setTopic(id || ""), [id]);
  const result = useData(
    `problems?topic=${encodeURIComponent(topic)}&q=${encodeURIComponent(q)}&completion=${completion}&assistance=${assistance}&historyLanguage=${historyLanguage}&bookmarked=${bookmarked ? "true" : ""}`,
  );
  const t = topics.find((t) => t.id === id);
  const rows = (result.data || []).filter(
    (p: any) =>
      (!step || String(p.step) === step) &&
      (!skill || p.skillIds.includes(skill)),
  );
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            {topicDetail ? "Learning path" : "The core catalogue"}
          </div>
          <h1>{t?.name || "Find your next challenge."}</h1>
          <p className="subtitle">
            {t
              ? `${t.count} ${preview ? "validation preview" : "published"} questions of ${t.quota} planned. Build the underlying skills, then put them together.`
              : "Practical questions that bridge the gap between recognising an idea and using it independently."}
          </p>
        </div>
        {t && (
          <span className="badge">
            {t.independent} independent · {t.assisted} with help
          </span>
        )}
      </div>
      {topicDetail && (
        <div className="notice">
          <GraduationCap size={19} />
          <div>
            Each problem lists its own skills and prerequisites. Choose
            manually, or follow the recommended next challenge on Home.
          </div>
        </div>
      )}
      <div className="filters">
        <div className="search">
          <Search size={17} />
          <input
            aria-label="Search problems"
            placeholder="Search titles and skills…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter internal challenge step"
          value={step}
          onChange={(e) => setStep(e.target.value)}
        >
          <option value="">All challenge steps</option>
          {Array.from(new Set((result.data || []).map((p: any) => p.step)))
            .sort()
            .map((s) => (
              <option key={String(s)} value={String(s)}>
                Step {String(s)}
              </option>
            ))}
        </select>
      </div>
      <div className="filters secondary-filters">
        <select
          aria-label="Filter problem skill"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        >
          <option value="">All skills</option>
          {Array.from(
            new Set((result.data || []).flatMap((p: any) => p.skillIds)),
          ).map((s) => (
            <option key={String(s)} value={String(s)}>
              {String(s).replaceAll(".", " · ").replaceAll("-", " ")}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter completion"
          value={completion}
          onChange={(e) => setCompletion(e.target.value)}
        >
          <option value="">All completion states</option>
          <option value="solved">Solved</option>
          <option value="unsolved">Not solved</option>
        </select>
        <select
          aria-label="Filter assistance"
          value={assistance}
          onChange={(e) => setAssistance(e.target.value)}
        >
          <option value="">All evidence</option>
          <option value="independent">Independent</option>
          <option value="assisted">Learned with help</option>
        </select>
        <select
          aria-label="Filter language history"
          value={historyLanguage}
          onChange={(e) => setHistoryLanguage(e.target.value)}
        >
          <option value="">Any language history</option>
          {["java", "cpp", "python"].map((l) => (
            <option key={l} value={l}>
              {languageName(l)} attempts
            </option>
          ))}
        </select>
        <button
          onClick={() => setBookmarked(!bookmarked)}
          aria-pressed={bookmarked}
          className={bookmarked ? "primary" : ""}
        >
          <Bookmark size={15} />
          Bookmarked
        </button>
      </div>
      {topicDetail && (
        <TopicSuggestion
          topicId={id!}
          topicName={t?.name || "this topic"}
          language={bootstrap.preferences.language}
        />
      )}
      {topicDetail && (
        <div className="card section" style={{ marginBottom: 22 }}>
          <h2>Skills in this path</h2>
          <div className="actions">
            {Array.from(
              new Set((result.data || []).flatMap((p: any) => p.skillIds)),
            ).map((s) => (
              <span className="badge" key={String(s)}>
                {String(s).replaceAll(".", " · ").replaceAll("-", " ")}
              </span>
            ))}
          </div>
          {!result.data?.length && (
            <p className="muted">
              Skill details appear with{" "}
              {preview ? "validation preview" : "validated published"}{" "}
              questions. This path has not been populated yet.
            </p>
          )}
          <p
            className="muted"
            style={{ fontSize: 13, marginTop: 16, marginBottom: 0 }}
          >
            Prerequisite guidance:{" "}
            {Array.from(
              new Set((result.data || []).flatMap((p: any) => p.prerequisites)),
            )
              .map(String)
              .join(" · ") ||
              "Read each problem’s listed prerequisites before starting."}
          </p>
        </div>
      )}
      {result.error ? (
        <ErrorNotice error={result.error} retry={result.reload} />
      ) : result.loading ? (
        <Loading />
      ) : rows.length ? (
        <div className="card list-card">
          <div className="list-head">
            {rows.length} {preview ? "validation preview" : "published"}{" "}
            questions · Java / C++ / Python
          </div>
          {rows.map((p: any, i: number) => (
            <div key={p.id} className="problem-row">
              <span className="problem-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="problem-title">
                <Link to={`/problems/${p.id}`}>{p.title}</Link>
                <small>{p.objective || p.skillIds?.join(" · ")}</small>
              </div>
              <span className="badge">Step {p.step}</span>
              <ChevronRight size={16} color="var(--muted)" />
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title={`No ${preview ? "preview" : "published"} questions match`}
        >
          <p>
            Try a different search or topic.{" "}
            {preview
              ? "These draft questions are available only in this explicitly labelled validation preview."
              : "Only validated, published content appears in the catalogue."}
          </p>
          <button
            onClick={() => {
              setQ("");
              setTopic("");
              setStep("");
              setSkill("");
              setCompletion("");
              setAssistance("");
              setHistoryLanguage("");
              setBookmarked(false);
            }}
          >
            Clear filters
          </button>
        </Empty>
      )}
    </div>
  );
}
function Workspace() {
  const { id } = useParams();
  const location = useLocation(),
    navigate = useNavigate();
  const review = new URLSearchParams(location.search).get("mode") === "review";
  const assessmentMode =
    new URLSearchParams(location.search).get("mode") === "assessment";
  const { bootstrap, notify } = useApp();
  const problem = useData(`problems/${id}`);
  const [language, setLanguage] = useState(bootstrap.preferences.language),
    [code, setCode] = useState(""),
    [revision, setRevision] = useState(0),
    [saved, setSaved] = useState("Loading draft"),
    [tab, setTab] = useState("problem"),
    [resultTab, setResultTab] = useState("results"),
    [custom, setCustom] = useState(""),
    [job, setJob] = useState<any>(null),
    [jobDetailLoading, setJobDetailLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<any>(null),
    [width, setWidth] = useState(43),
    [tutorOpen, setTutorOpen] = useState(false),
    [reset, setReset] = useState(false),
    [draftReady, setDraftReady] = useState(false),
    [draftContext, setDraftContext] = useState(""),
    [assessmentReady, setAssessmentReady] = useState(!assessmentMode),
    [autoGeneration, setAutoGeneration] = useState<any>(null),
    [editorHeight, setEditorHeight] = useState(
      window.innerWidth >= 1700 ? 460 : 370,
    );
  const autoHandled = useRef(new Set<string>()),
    latestSubmitted = useRef("");
  useEffect(() => {
    if (tutorOpen || tab === "tutor")
      document.querySelector<HTMLButtonElement>(".tutor-close")?.focus();
  }, [tutorOpen, tab]);
  const history = usePagedData(`jobs?problemId=${id}`);
  const jobSelection = useRef(0);
  const currentDraftContext = `${id}:${language}`;
  const executionBlocked =
    busy ||
    !draftReady ||
    draftContext !== currentDraftContext ||
    (assessmentMode && !assessmentReady);
  useEffect(() => {
    setAssessmentReady(!assessmentMode);
  }, [id, assessmentMode]);
  useEffect(() => {
    jobSelection.current++;
    setJob(null);
    setBusy(false);
    setJobDetailLoading(false);
    latestSubmitted.current = "";
    return () => {
      jobSelection.current++;
    };
  }, [id]);
  const codeRef = useRef(code),
    revisionRef = useRef(revision),
    initial = useRef(""),
    saveChain = useRef(Promise.resolve());
  useEffect(() => {
    codeRef.current = code;
  }, [code]);
  useEffect(() => {
    revisionRef.current = revision;
  }, [revision]);
  useEffect(() => {
    let current = true;
    setDraftReady(false);
    setDraftContext("");
    setSaved("Loading draft");
    api(`drafts/${id}/${language}`)
      .then((d) => {
        if (!current) return;
        const next = d.code ?? problem.data?.starters?.[language] ?? "";
        setCode(next);
        codeRef.current = next;
        initial.current = next;
        setRevision(d.revision);
        revisionRef.current = d.revision;
        setSaved(d.updatedAt ? "Saved on this device" : "Starter ready");
        setDraftReady(true);
        setDraftContext(`${id}:${language}`);
      })
      .catch((e) => {
        if (current) {
          setError(e);
          setSaved("Could not load draft");
        }
      });
    return () => {
      current = false;
    };
  }, [id, language, problem.data]);
  useEffect(() => {
    if (problem.data?.id === id)
      api("learning/select", "POST", {
        problemId: id,
        mode: review ? "review" : "manual",
      }).catch((e: any) => notify(e.message));
  }, [id, review, problem.data?.id]);
  const save = useCallback(async () => {
    if (!draftReady) return;
    const text = codeRef.current;
    if (text === initial.current) return;
    setSaved("Saving…");
    const task = saveChain.current.then(async () => {
      try {
        const d = await api(`drafts/${id}/${language}`, "PUT", {
          code: text,
          revision: revisionRef.current,
        });
        revisionRef.current = d.revision;
        setRevision(d.revision);
        initial.current = text;
        setSaved(
          codeRef.current === text ? "Saved on this device" : "Changes pending",
        );
      } catch (e: any) {
        setSaved(
          e.code === "DRAFT_CONFLICT"
            ? "Conflict — reload before saving"
            : "Could not save",
        );
        setError(e);
        throw e;
      }
    });
    saveChain.current = task.catch(() => {});
    await task;
  }, [id, language, draftReady]);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest("a");
      if (
        !link ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        link.target === "_blank" ||
        codeRef.current === initial.current
      )
        return;
      const target = new URL(link.href, window.location.href);
      if (
        target.origin !== window.location.origin ||
        (target.pathname === location.pathname &&
          target.search === location.search)
      )
        return;
      event.preventDefault();
      void save()
        .then(() => navigate(target.pathname + target.search + target.hash))
        .catch(() =>
          notify(
            "Navigation paused because the draft could not be saved. Copy your code or resolve the save error.",
          ),
        );
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (codeRef.current !== initial.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    document.addEventListener("click", click, true);
    window.addEventListener("beforeunload", unload);
    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener("beforeunload", unload);
      void save().catch(() => {});
    };
  }, [save, location.pathname, location.search]);
  useEffect(() => {
    if (
      job?.status !== "wrong_answer" ||
      job.mode !== "submit" ||
      job.id !== latestSubmitted.current ||
      !bootstrap.preferences.autoExplain ||
      job.meaningfulConceptualAttempt === false ||
      !bootstrap.key.configured ||
      autoHandled.current.has(job.id)
    )
      return;
    autoHandled.current.add(job.id);
    setTutorOpen(true);
    setTab("tutor");
    api("tutor", "POST", {
      problemId: id,
      language: job.language,
      code: job.code,
      action: "error",
      prompt:
        "Explain this failed submit briefly in simple English. Do not reveal a full solution.",
      submissionId: job.id,
      idempotencyKey: `auto-error-${job.id}`,
      consent: true,
    })
      .then(setAutoGeneration)
      .catch(setError);
  }, [job?.id, job?.status, bootstrap.preferences.autoExplain]);
  useEffect(() => {
    if (!draftReady || code === initial.current) return;
    setSaved("Changes pending");
    const t = setTimeout(() => save().catch(() => {}), 650);
    return () => clearTimeout(t);
  }, [code, draftReady, save]);
  useEffect(() => {
    if (!job || !["queued", "compiling", "running"].includes(job.status))
      return;
    let current = true;
    const t = setInterval(async () => {
      try {
        const next = await api(`jobs/${job.id}`);
        if (!current) return;
        setJob(next);
        if (!["queued", "compiling", "running"].includes(next.status)) {
          setBusy(false);
          void history.reload();
        }
      } catch (e) {
        if (!current) return;
        setError(e);
        setBusy(false);
      }
    }, 600);
    return () => {
      current = false;
      clearInterval(t);
    };
  }, [job?.id, job?.status, id]);
  async function execute(mode: string) {
    if (
      !draftReady ||
      draftContext !== currentDraftContext ||
      (assessmentMode && !assessmentReady)
    ) {
      notify("Wait for the saved assessment selection and language to load.");
      return;
    }
    jobSelection.current++;
    setJobDetailLoading(false);
    setError(null);
    setBusy(true);
    try {
      await save();
      let customInput;
      try {
        if (mode === "custom") customInput = JSON.parse(custom);
      } catch {
        throw new RequestError(
          "CUSTOM_INPUT",
          "Custom input must be valid JSON.",
          "Follow the problem interface and constraints.",
        );
      }
      const created = await api("jobs", "POST", {
        problemId: id,
        language,
        code: codeRef.current,
        mode,
        customInput,
        idempotencyKey: crypto.randomUUID(),
        review,
      });
      latestSubmitted.current = mode === "submit" ? created.id : "";
      setJob(created);
      setResultTab("results");
      setTab("results");
      void history.reload();
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }
  async function changeLanguage(value: string) {
    try {
      await save();
      setLanguage(value);
      setError(null);
    } catch {
      notify(
        "The current draft could not be saved. Copy your code before switching.",
      );
    }
  }
  if (problem.loading) return <Loading />;
  if (problem.error)
    return (
      <div className="page">
        <ErrorNotice error={problem.error} />
      </div>
    );
  const p = problem.data;
  return (
    <div className="workspace">
      <div className="workspace-head">
        <div className="row">
          <div>
            <div className="eyebrow">
              {review ? "Review practice" : p.primaryTopic.replaceAll("-", " ")}{" "}
              · Step {p.step}
            </div>
            <h1 className="workspace-title">{p.title}</h1>
          </div>
          <button
            className="ghost"
            aria-expanded={tutorOpen || tab === "tutor"}
            aria-controls="workspace-tutor"
            onClick={() => {
              if (tutorOpen || tab === "tutor") {
                setTutorOpen(false);
                setTab("code");
              } else {
                setTutorOpen(true);
                setTab("tutor");
              }
            }}
          >
            <GraduationCap size={17} />
            Tutor
          </button>
        </div>
      </div>
      {!bootstrap.runner.ready && (
        <div className="notice">
          <Terminal size={17} />
          <div>
            <strong>Runner not ready.</strong> {bootstrap.runner.message}{" "}
            <Link to="/settings">View diagnostics →</Link>
          </div>
        </div>
      )}
      {error && <ErrorNotice error={error} />}
      {assessmentMode && (
        <AssessmentWorkspacePanel
          problemId={id!}
          language={language}
          job={job}
          draftReady={draftReady && draftContext === currentDraftContext}
          onLanguage={changeLanguage}
          onReady={setAssessmentReady}
        />
      )}
      <div className="tabs mobile-workspace-tabs">
        {["problem", "code", "results", "tutor"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => {
              setTab(t);
              setTutorOpen(t === "tutor");
            }}
          >
            {statusLabel(t)}
          </button>
        ))}
      </div>
      <div
        className="workspace-layout"
        data-tutor-open={tutorOpen || tab === "tutor"}
      >
        <div className="workspace-grid" data-tab={tab}>
          <section className="problem-pane" style={{ width: `${width}%` }}>
            <div className="pane-heading">
              <strong>Problem description</strong>
              <span className="badge">v{p.version}</span>
            </div>
            {(p.learnerRationale || p.objective) && (
              <p className="muted" style={{ fontSize: 13 }}>
                <strong>Learning goal: </strong>
                {p.learnerRationale || p.objective}
              </p>
            )}
            <LessonRenderer markdown={p.statement} />
            <h3 style={{ marginTop: 26 }}>Examples</h3>
            {p.visibleCases.map((c: any, i: number) => (
              <div className="example" key={c.id}>
                <strong>Example {i + 1}</strong>
                <pre>Input: {JSON.stringify(c.input)}</pre>
                <pre>Output: {JSON.stringify(c.expected)}</pre>
                <p>{c.explanation}</p>
              </div>
            ))}
            <h3 style={{ marginTop: 26 }}>Constraints</h3>
            <ul
              className="muted"
              style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}
            >
              {p.constraints.map((s: string) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <h3>Interface</h3>
            <p className="muted" style={{ fontSize: 13 }}>
              {p.interface}
            </p>
            <div className="divider" />
            <ProblemNotes problemId={id!} notify={notify} />
            <div className="divider" />
            <small>
              Skills: {p.skillIds.join(" · ")}
              <br />
              Prerequisites:{" "}
              {p.prerequisites.length
                ? p.prerequisites.join(" · ")
                : "No earlier skills required"}
            </small>
          </section>
          <div
            className="splitter"
            role="separator"
            aria-label="Resize problem panel"
            aria-orientation="vertical"
            aria-valuenow={width}
            aria-valuemin={25}
            aria-valuemax={65}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                setWidth((w) =>
                  Math.max(
                    25,
                    Math.min(65, w + (e.key === "ArrowRight" ? 2 : -2)),
                  ),
                );
              }
            }}
            onPointerDown={(e) => {
              const parent = e.currentTarget.parentElement!;
              e.currentTarget.setPointerCapture(e.pointerId);
              const move = (ev: PointerEvent) => {
                const r = parent.getBoundingClientRect();
                setWidth(
                  Math.max(
                    25,
                    Math.min(65, ((ev.clientX - r.left) / r.width) * 100),
                  ),
                );
              };
              const end = () => {
                document.removeEventListener("pointermove", move);
                document.removeEventListener("pointerup", end);
              };
              document.addEventListener("pointermove", move);
              document.addEventListener("pointerup", end);
            }}
          />
          <section className="editor-pane">
            <div className="editor-toolbar">
              <div className="actions">
                <Code2 size={16} />
                <select
                  aria-label="Programming language"
                  disabled={assessmentMode}
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value)}
                >
                  {["java", "cpp", "python"].map((l) => (
                    <option key={l} value={l}>
                      {languageName(l)}
                    </option>
                  ))}
                </select>
                <small>
                  {bootstrap.runner.languages.find(
                    (l: any) => l.id === language,
                  )?.version || "Runtime not verified"}
                </small>
              </div>
              <Link
                to="/settings?section=Editor"
                className="ghost"
                style={{ fontSize: 12 }}
              >
                Editor settings
              </Link>
              <button
                className="ghost"
                aria-label="Reset draft to starter"
                onClick={() => setReset(true)}
              >
                <RotateCcw size={15} />
              </button>
            </div>
            <div className="editor" style={{ height: editorHeight }}>
              <Editor
                height="100%"
                language={language === "cpp" ? "cpp" : language}
                theme={
                  effectiveTheme(bootstrap.preferences.theme) === "light"
                    ? "codewise-light"
                    : "codewise-dark"
                }
                value={code}
                onChange={(v) => setCode(v || "")}
                loading={
                  <div className="empty">Loading local code editor…</div>
                }
                options={{
                  fontSize: bootstrap.preferences.fontSize,
                  tabSize: bootstrap.preferences.tabWidth,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 18 },
                  wordWrap: "on",
                  fontFamily: "Cascadia Code, Consolas, monospace",
                  readOnly:
                    !draftReady ||
                    draftContext !== currentDraftContext ||
                    (assessmentMode && !assessmentReady),
                  mouseWheelZoom: true,
                }}
              />
            </div>
            <div
              className="horizontal-splitter"
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize code editor height"
              aria-valuenow={editorHeight}
              aria-valuemin={250}
              aria-valuemax={800}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                  setEditorHeight((h) =>
                    Math.max(
                      250,
                      Math.min(800, h + (e.key === "ArrowDown" ? 20 : -20)),
                    ),
                  );
                }
              }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                const start = e.clientY,
                  height = editorHeight;
                const move = (ev: PointerEvent) =>
                  setEditorHeight(
                    Math.max(250, Math.min(800, height + ev.clientY - start)),
                  );
                const end = () => {
                  document.removeEventListener("pointermove", move);
                  document.removeEventListener("pointerup", end);
                };
                document.addEventListener("pointermove", move);
                document.addEventListener("pointerup", end);
              }}
            />
            <div className="editor-actions">
              <span className="muted" role="status">
                {saved}
              </span>
              <button
                disabled={executionBlocked}
                onClick={() => execute("run")}
              >
                <Play size={15} />
                Run
              </button>
              <button
                className="primary"
                disabled={executionBlocked}
                onClick={() => execute("submit")}
              >
                {busy ? (
                  <Loader2 className="spinner" size={15} />
                ) : (
                  <Send size={15} />
                )}
                Submit
              </button>
            </div>
            <div className="results">
              <div className="tabs">
                {["results", "custom input", "history"].map((t) => (
                  <button
                    key={t}
                    className={resultTab === t ? "active" : ""}
                    onClick={() => setResultTab(t)}
                  >
                    {statusLabel(t)}
                  </button>
                ))}
              </div>
              {resultTab === "custom input" ? (
                <>
                  <label htmlFor="custom" className="muted">
                    JSON input · validated against this problem's contract
                  </label>
                  <textarea
                    id="custom"
                    rows={4}
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder="Enter a custom input object"
                    style={{ margin: "12px 0" }}
                  />
                  <button
                    disabled={executionBlocked || !custom.trim()}
                    onClick={() => execute("custom")}
                  >
                    Run custom input
                  </button>
                </>
              ) : resultTab === "history" ? (
                history.error ? (
                  <ErrorNotice error={history.error} retry={history.reload} />
                ) : history.loading ? (
                  <Loading />
                ) : history.data?.items.length ? (
                  <div>
                    {history.data.items.map((h: any) => (
                      <button
                        key={h.id}
                        className="row ghost"
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                        disabled={busy || jobDetailLoading}
                        onClick={async () => {
                          const selected = ++jobSelection.current;
                          setJobDetailLoading(true);
                          try {
                            const detail = await api(`jobs/${h.id}`);
                            if (selected === jobSelection.current) {
                              setJob(detail);
                              setResultTab("results");
                            }
                          } catch (e: any) {
                            if (selected === jobSelection.current)
                              notify(e.message);
                          } finally {
                            if (selected === jobSelection.current)
                              setJobDetailLoading(false);
                          }
                        }}
                      >
                        <span>
                          {statusLabel(h.status)} · {languageName(h.language)}
                        </span>
                        <small>{date(h.createdAt)}</small>
                      </button>
                    ))}
                    {jobDetailLoading && (
                      <p role="status">Opening saved result…</p>
                    )}
                    <PageControls page={history} label="Saved results" />
                  </div>
                ) : (
                  <div>
                    <p className="muted">
                      {history.data?.total
                        ? "No saved results on this page. Return to a newer page."
                        : "No runs or submissions for this problem yet."}
                    </p>
                    <PageControls page={history} label="Saved results" />
                  </div>
                )
              ) : job ? (
                <>
                  <div className="row">
                    <h3
                      style={{
                        color:
                          job.status === "accepted"
                            ? "var(--success)"
                            : job.status === "infrastructure_error"
                              ? "var(--warn)"
                              : undefined,
                        margin: 0,
                      }}
                    >
                      {statusLabel(job.status)}
                    </h3>
                    {["queued", "compiling", "running"].includes(
                      job.status,
                    ) && (
                      <button
                        onClick={async () => {
                          setJob(
                            await api(`jobs/${job.id}/cancel`, "POST", {}),
                          );
                          setBusy(false);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  {job.result ? (
                    <>
                      <p
                        className="muted"
                        style={{ fontSize: 12, margin: "12px 0" }}
                      >
                        {job.result.counts.passed} passed ·{" "}
                        {job.result.counts.failed} failed ·{" "}
                        {job.result.counts.executed} executed ·{" "}
                        {job.result.counts.notRun} not run /{" "}
                        {job.result.counts.total} total
                      </p>
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                          fontSize: 12,
                          lineHeight: 1.6,
                        }}
                      >
                        {job.result.diagnostics}
                      </pre>
                      {job.result.cases?.map((c: any) => (
                        <div className="example" key={c.id}>
                          <strong>
                            {job.mode === "custom"
                              ? "Executed · not graded"
                              : c.passed
                                ? "Passed"
                                : "Failed"}{" "}
                            · {c.id}
                          </strong>
                          {c.input !== undefined && (
                            <pre>Input: {JSON.stringify(c.input)}</pre>
                          )}
                          {c.expected !== undefined && (
                            <pre>Expected: {JSON.stringify(c.expected)}</pre>
                          )}
                          {c.actual !== undefined && (
                            <pre>Actual: {JSON.stringify(c.actual)}</pre>
                          )}
                        </div>
                      ))}
                      {job.mode === "custom" && (
                        <div className="notice">
                          {job.result.counts.unverified ??
                            job.result.counts.executed}{" "}
                          outputs executed without a trusted expected answer.
                          This custom run awards no learning evidence.
                        </div>
                      )}
                      <RuntimeMeasurements runtime={job.result.runtime} />
                      {job.status === "accepted" ? (
                        <Link to="/">View your next step →</Link>
                      ) : (
                        job.status !== "infrastructure_error" && (
                          <button
                            onClick={() => {
                              setTutorOpen(true);
                              setTab("tutor");
                            }}
                          >
                            Understand this result <GraduationCap size={15} />
                          </button>
                        )
                      )}
                    </>
                  ) : (
                    <p className="muted">
                      {job.status === "canceled"
                        ? "Canceled. No learning evidence is awarded; any in-flight isolated task remains bounded by the runner deadline."
                        : job.status === "interrupted"
                          ? "Interrupted. Your code snapshot and earlier history were preserved. Retry explicitly when the runner is ready."
                          : "The isolated runner is processing your code snapshot."}
                    </p>
                  )}
                </>
              ) : (
                <p className="muted">
                  Run the three visible examples, or submit against the full
                  grading suite. Results come from execution.
                </p>
              )}
            </div>
          </section>
        </div>
        <aside
          id="workspace-tutor"
          className="card tutor-drawer"
          aria-label="AI tutor"
          hidden={!tutorOpen && tab !== "tutor"}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setTutorOpen(false);
              setTab("code");
              document
                .querySelector<HTMLButtonElement>(
                  '[aria-controls="workspace-tutor"]',
                )
                ?.focus();
            }
          }}
        >
          <button
            className="ghost tutor-close"
            aria-label="Close tutor"
            onClick={() => {
              setTutorOpen(false);
              setTab("code");
              document
                .querySelector<HTMLButtonElement>(
                  '[aria-controls="workspace-tutor"]',
                )
                ?.focus();
            }}
          >
            Close tutor ×
          </button>
          <Tutor
            key={id}
            problemId={id!}
            language={language}
            code={code}
            submissionId={job?.id}
            existingGeneration={autoGeneration}
          />
        </aside>
      </div>
      {reset && (
        <Confirm
          title="Reset this language's draft?"
          description="The current code will be replaced by the starter for this language. Other language drafts and submission history are preserved."
          label="Reset draft"
          onClose={() => setReset(false)}
          onConfirm={() => {
            setCode(p.starters[language]);
            setReset(false);
          }}
        />
      )}
    </div>
  );
}
function Tutor({
  problemId,
  language,
  code,
  submissionId,
  threadId,
  parentId,
  existingGeneration,
}: {
  problemId: string;
  language: string;
  code: string;
  submissionId?: string;
  threadId?: string;
  parentId?: string;
  existingGeneration?: any;
}) {
  const { bootstrap, notify } = useApp();
  const [prompt, setPrompt] = useState(""),
    [generation, setGeneration] = useState<any>(null),
    [error, setError] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [consent, setConsent] = useState(false),
    [pending, setPending] = useState("");
  const pendingRetry = useRef<any>(null);
  useEffect(() => {
    if (existingGeneration) {
      setGeneration(existingGeneration);
      setBusy(["queued", "streaming"].includes(existingGeneration.status));
    }
  }, [existingGeneration?.id]);
  useEffect(() => {
    if (!generation || !["queued", "streaming"].includes(generation.status))
      return;
    let last = 0;
    const source = new EventSource(
      `/api/tutor/${generation.id}/events?after=${last}`,
    );
    source.onmessage = (e) => {
      last = Number(e.lastEventId) || last;
      try {
        const event = parseTutorEvent(JSON.parse(e.data));
        setGeneration((g: any) => (g ? applyTutorEvent(g, event) : g));
        if (event.status) {
          setGeneration((g: any) => ({ ...g, status: event.status }));
          if (!["queued", "streaming"].includes(event.status)) {
            source.close();
            setBusy(false);
            api(`tutor/${generation.id}`).then(setGeneration).catch(setError);
          }
        }
      } catch {
        setError(
          new Error(
            "A saved response event could not be read. Reopen the lesson to recover its stored content.",
          ),
        );
      }
    };
    source.onerror = () => {
      source.close();
      api(`tutor/${generation.id}`)
        .then((g) => {
          setGeneration(g);
          setBusy(false);
          if (["queued", "streaming"].includes(g.status))
            setError(
              new Error(
                "Connection interrupted. Partial content is available; reopen the saved lesson to check its status.",
              ),
            );
        })
        .catch(setError);
    };
    return () => source.close();
  }, [generation?.id]);
  const active = busy || ["queued", "streaming"].includes(generation?.status);
  async function generate(action: string, retry?: any, confirmed = consent) {
    if (!bootstrap.key.configured) {
      notify("Add a DeepSeek key in Settings to use the tutor.");
      return;
    }
    if (!bootstrap.preferences.model) {
      setError(
        new Error("Test your key and choose an available model in Settings."),
      );
      return;
    }
    if (!confirmed) {
      setPending(action);
      pendingRetry.current = retry;
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setGeneration(
        await api("tutor", "POST", {
          problemId,
          language,
          code,
          action,
          prompt: prompt || statusLabel(action),
          submissionId,
          threadId: threadId || generation?.threadId,
          parentId: parentId || generation?.id,
          ...(retry ? tutorRetryContext(retry) : {}),
          idempotencyKey: crypto.randomUUID(),
          consent: true,
        }),
      );
      setPrompt("");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="row">
        <div>
          <div className="eyebrow">Understand the missing piece</div>
          <h2 style={{ marginBottom: 0 }}>Your learning companion</h2>
        </div>
        <span className="badge">DeepSeek · optional</span>
      </div>
      {!bootstrap.key.configured ? (
        <div className="notice" style={{ marginTop: 20 }}>
          <GraduationCap size={18} />
          <div>
            Practice works without an AI key.{" "}
            <Link to="/settings">Configure DeepSeek in localhost Settings</Link>{" "}
            when you'd like a hint or a guided explanation.
          </div>
        </div>
      ) : !bootstrap.preferences.model ? (
        <div className="notice" style={{ marginTop: 20 }}>
          <div>
            <strong>Choose a tutor model first.</strong> Test your key and
            choose an available model in <Link to="/settings">Settings</Link>.
          </div>
        </div>
      ) : (
        <>
          <div className="tutor-controls">
            {[
              ["hint", "Give me a hint"],
              ["error", "Explain this error"],
              ["simplify", "Explain more simply"],
              ["walkthrough", "Walk through an example"],
              ["solution", "Teach the full solution"],
              ["complexity", "Explain complexity"],
            ].map(([a, label]) => (
              <button key={a} disabled={active} onClick={() => generate(a)}>
                {label}
              </button>
            ))}
          </div>
          <small>
            Hints and walkthroughs record assistance. A full solution records
            exposure for this problem across languages.
          </small>
          <div className="field" style={{ marginTop: 18 }}>
            <label htmlFor="followup">Ask a contextual follow-up</label>
            <textarea
              id="followup"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Which part would you like to understand?"
            />
          </div>
          <div className="actions">
            <button
              className="primary"
              disabled={active || !prompt.trim()}
              onClick={() => generate("followup")}
            >
              Ask DeepSeek <ArrowRight size={15} />
            </button>
            {active && generation && (
              <button
                onClick={async () => {
                  setGeneration(
                    await api(`tutor/${generation.id}/cancel`, "POST", {}),
                  );
                  setBusy(false);
                }}
              >
                Cancel response
              </button>
            )}
          </div>
        </>
      )}
      {error && (
        <>
          <ErrorNotice error={error} />
          <Link to="/settings">Check tutor Settings →</Link>
        </>
      )}{" "}
      {generation && (
        <div style={{ marginTop: 28 }}>
          <div className="lesson-meta">
            <span>{statusLabel(generation.status)}</span>
            <span>
              {generation.status === "complete"
                ? "Stored on this device"
                : generation.markdown?.trim()
                  ? "Partial answer saved on this device"
                  : "Request saved · no answer text yet"}
            </span>
            <Link to={`/library/${generation.id}`}>Open saved lesson →</Link>
          </div>
          {["failed", "interrupted", "canceled"].includes(
            generation.status,
          ) && (
            <div className="notice" role="status">
              <div>
                <strong>
                  {generation.markdown?.trim()
                    ? "Partial answer saved."
                    : "No answer was generated."}
                </strong>
                {generation.error && (
                  <p>
                    {generation.error.message}{" "}
                    <small>({generation.error.code})</small>
                  </p>
                )}
                <div className="actions">
                  <Link to="/settings">Check tutor Settings →</Link>
                  <button
                    disabled={
                      active ||
                      !bootstrap.key.configured ||
                      !bootstrap.preferences.model
                    }
                    onClick={() => generate(generation.action, generation)}
                  >
                    Retry same request
                  </button>
                </div>
                <small>
                  The saved request stays in your library. Retry sends its
                  original prompt and code as a new request.
                </small>
              </div>
            </div>
          )}
          {!generation.markdown?.trim() &&
            ["queued", "streaming"].includes(generation.status) && (
              <p role="status" className="muted">
                Waiting for the first answer text…
              </p>
            )}
          <LiveLesson
            key={generation.id}
            id={generation.id}
            markdown={generation.markdown || ""}
            streaming={generation.status === "streaming"}
            reducedMotion={bootstrap.preferences.reducedMotion}
          />
        </div>
      )}
      {pending && (
        <Confirm
          title="Send this context to DeepSeek?"
          description={`This sends the problem, selected language, your code snapshot, safe result feedback, a short summary of independently demonstrated skills, and relevant messages or selected prior answer (including saved partial text) to DeepSeek. ${pending === "solution" ? "A requested full solution may also include a historically validated reference in the selected language. " : ""}It can consume API usage. The answer saves locally, and algorithmic teaching records assistance.`}
          label="Send request"
          onClose={() => setPending("")}
          onConfirm={() => {
            setConsent(true);
            const a = pending;
            setPending("");
            void generate(a, pendingRetry.current, true);
            pendingRetry.current = null;
          }}
        />
      )}
    </>
  );
}
function LessonRow({
  lesson: l,
  search = "",
}: {
  lesson: any;
  search?: string;
}) {
  return (
    <div className="lesson-row">
      <BookOpen size={19} color="var(--accent)" />
      <div className="problem-title">
        <Link
          to={`/library/${l.id}${search ? `?find=${encodeURIComponent(search)}` : ""}`}
        >
          {l.title || l.document?.title || statusLabel(l.action)}
        </Link>
        <small className="lesson-preview">
          {plainPreview(
            (search ? l.searchExcerpt : l.preview) || l.preview || "",
            search,
          ) || "No preview text. Open the saved answer."}
        </small>
        <small>
          {languageName(l.language)} · {date(l.createdAt)} ·{" "}
          {statusLabel(l.status)}
        </small>
      </div>
      {l.bookmarked && <Bookmark size={16} color="var(--accent)" />}
      <ChevronRight size={16} color="var(--muted)" />
    </div>
  );
}
function LearningLibrary() {
  const { topics } = useApp();
  const problems = useData("problems");
  const [q, setQ] = useState(""),
    [language, setLanguage] = useState(""),
    [status, setStatus] = useState(""),
    [bookmarked, setBookmarked] = useState(false),
    [problemId, setProblemId] = useState(""),
    [topic, setTopic] = useState(""),
    [action, setAction] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const lessons = usePagedData(
    `library?q=${encodeURIComponent(q)}&language=${language}&status=${status}&bookmarked=${bookmarked ? "true" : ""}&problemId=${encodeURIComponent(problemId)}&topic=${topic}&action=${action}&from=${from}&to=${to}`,
  );
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Your understanding, kept</div>
          <h1>Learning Library</h1>
          <p className="subtitle">
            Every tutor answer lives here automatically. Revisit an idea without
            generating it again.
          </p>
        </div>
        <span className="badge">Saved on this device</span>
      </div>
      <div className="filters secondary-filters">
        <select
          aria-label="Filter lessons by question"
          value={problemId}
          onChange={(e) => setProblemId(e.target.value)}
        >
          <option value="">All questions</option>
          {(problems.data || []).map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter lessons by topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter output type"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="">All answer types</option>
          {[
            "hint",
            "error",
            "simplify",
            "walkthrough",
            "solution",
            "complexity",
            "followup",
          ].map((a) => (
            <option key={a} value={a}>
              {statusLabel(a)}
            </option>
          ))}
        </select>
        <label className="date-filter">
          From (UTC)
          <input
            type="date"
            aria-label="Lessons from date (UTC)"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="date-filter">
          Through (UTC)
          <input
            type="date"
            aria-label="Lessons through date (UTC)"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      <div className="filters">
        <div className="search">
          <Search size={17} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search lessons and code"
            maxLength={200}
            placeholder="Search explanations, notes, and code…"
          />
        </div>
        <select
          value={language}
          aria-label="Lesson language"
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="">All languages</option>
          {["java", "cpp", "python"].map((l) => (
            <option key={l} value={l}>
              {languageName(l)}
            </option>
          ))}
        </select>
        <select
          value={status}
          aria-label="Completion status"
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {["complete", "interrupted", "canceled", "failed", "streaming"].map(
            (s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ),
          )}
        </select>
        <button
          className={bookmarked ? "primary" : ""}
          aria-pressed={bookmarked}
          onClick={() => setBookmarked(!bookmarked)}
        >
          <Bookmark size={15} />
          Pinned
        </button>
      </div>
      {lessons.error ? (
        <ErrorNotice error={lessons.error} retry={lessons.reload} />
      ) : lessons.loading ? (
        <Loading />
      ) : lessons.data?.items.length ? (
        <div className="card list-card">
          {lessons.data.items.map((l: any) => (
            <LessonRow key={l.id} lesson={l} search={q} />
          ))}
        </div>
      ) : (
        <Empty
          title={
            lessons.data?.total
              ? "No saved answers on this page"
              : q ||
                  language ||
                  status ||
                  bookmarked ||
                  problemId ||
                  topic ||
                  action ||
                  from ||
                  to
                ? "No saved answers match"
                : "Your first explanation will belong here"
          }
          icon={Library}
        >
          <p>
            {lessons.data?.total
              ? "Use Newer below to return to recent matches."
              : q
                ? "Try a shorter search, or clear a filter."
                : "Hints, walkthroughs, solutions and follow-ups save automatically. Bookmarking simply pins an answer."}
          </p>
          <Link to="/problems">Explore a problem →</Link>
        </Empty>
      )}
      <PageControls page={lessons} label="Saved answers" />
    </div>
  );
}
function Lesson() {
  const { id } = useParams();
  const { notify, bootstrap } = useApp();
  const location = useLocation();
  const lesson = useData(`library/${id}`),
    problem = useData(
      lesson.data?.problemId ? `problems/${lesson.data.problemId}` : "problems",
    );
  const [notes, setNotes] = useState(""),
    [deleting, setDeleting] = useState(false),
    [follow, setFollow] = useState(false),
    [noteStatus, setNoteStatus] = useState(""),
    [regenerate, setRegenerate] = useState(false),
    [regenerating, setRegenerating] = useState(false),
    [compare, setCompare] = useState<any>(null);
  const comparisonRequest = useRef(0);
  const liveReadingSession = useRef<string | null>(null);
  const versions = usePagedData(
    lesson.data?.threadId
      ? `library?threadId=${encodeURIComponent(lesson.data.threadId)}`
      : "library?problemId=__no_selected_thread",
  );
  const navigate = useNavigate();
  useEffect(() => {
    comparisonRequest.current++;
    setCompare(null);
    return () => {
      comparisonRequest.current++;
    };
  }, [id]);
  useEffect(() => {
    if (!lesson.data || !["queued", "streaming"].includes(lesson.data.status))
      return;
    let current = true;
    const timer = setInterval(
      () =>
        api(`library/${id}`)
          .then((next) => {
            if (current) lesson.setData(next);
          })
          .catch((e: any) => {
            if (current) notify(e.message);
          }),
      1000,
    );
    return () => {
      current = false;
      clearInterval(timer);
    };
  }, [id, lesson.data?.status]);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("find");
    if (!q || !lesson.data) return;
    const timer = setTimeout(() => {
      const target = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".lesson-content p,.lesson-content li,.lesson-content code,.lesson-content td",
        ),
      ).find((node) =>
        node.textContent?.toLowerCase().includes(q.toLowerCase()),
      );
      if (target) {
        target.dataset.searchHit = "true";
        target.scrollIntoView({
          block: "center",
          behavior: bootstrap.preferences.reducedMotion ? "instant" : "smooth",
        });
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [id, lesson.data?.id, location.search]);
  useEffect(() => setNotes(lesson.data?.notes || ""), [lesson.data?.id]);
  if (lesson.loading) return <Loading />;
  if (lesson.error)
    return (
      <div className="page">
        <ErrorNotice error={lesson.error} />
      </div>
    );
  const l = lesson.data;
  if (["queued", "streaming"].includes(l.status))
    liveReadingSession.current = l.id;
  const exportLesson = async (format: string) => {
    if (!l.markdown?.trim()) return;
    try {
      const response = await fetch(
        `/api/library/${id}/export?format=${format}`,
      );
      if (!response.ok) throw new Error("Export could not be loaded.");
      download(
        `CodeWise2-${id}.${format === "markdown" ? "md" : "json"}`,
        await response.text(),
      );
    } catch (e: any) {
      notify(e.message);
    }
  };
  return (
    <div className="page lesson-reading">
      <Link to="/library" style={{ fontSize: 13 }}>
        ← Learning Library
      </Link>
      <div className="page-head" style={{ marginTop: 25 }}>
        <div>
          <div className="eyebrow">Saved {statusLabel(l.action)}</div>
          <h1>{l.title || l.document?.title || "Your saved explanation"}</h1>
        </div>
        <button
          aria-pressed={l.bookmarked}
          onClick={async () => {
            await api(`library/${id}`, "PATCH", { bookmarked: !l.bookmarked });
            void lesson.reload();
          }}
        >
          <Bookmark size={16} />
          {l.bookmarked ? "Pinned" : "Pin lesson"}
        </button>
      </div>
      <div className="lesson-meta">
        <span>{languageName(l.language)}</span>
        <span>{date(l.createdAt)}</span>
        <span>{statusLabel(l.status)}</span>
        <span>{l.model || "Model not recorded"}</span>
        <span>Code verification: {l.document?.verification || "not-run"}</span>
      </div>
      {l.status !== "complete" && (
        <div className="notice">
          <div>
            <strong>
              {l.markdown?.trim()
                ? `${statusLabel(l.status)} — partial answer saved.`
                : `${statusLabel(l.status)} — no answer text was generated.`}
            </strong>
            {l.error && (
              <p>
                {l.error.message} <small>({l.error.code})</small>
              </p>
            )}
            <p>
              A new response requires an explicit request.{" "}
              <Link to="/settings">Check tutor Settings →</Link>
            </p>
            {["failed", "interrupted", "canceled"].includes(l.status) && (
              <button onClick={() => setFollow(true)}>
                Retry this request
              </button>
            )}
          </div>
        </div>
      )}
      <div className="actions" style={{ marginBottom: 24 }}>
        {l.markdown?.trim() && (
          <>
            <button
              onClick={() =>
                navigator.clipboard
                  .writeText(l.markdown)
                  .then(() => notify("Answer copied."))
                  .catch(() =>
                    notify(
                      "Clipboard access failed. Select the answer text to copy it.",
                    ),
                  )
              }
            >
              <Copy size={15} />
              Copy answer
            </button>
            <button onClick={() => exportLesson("markdown")}>
              <Download size={15} />
              Markdown
            </button>
            <button onClick={() => exportLesson("json")}>JSON</button>
          </>
        )}
        <Link to={`/problems/${l.problemId}`}>Return to problem →</Link>
      </div>
      <div className="version-controls">
        <label>
          Saved version
          <select
            aria-label="Saved lesson version"
            disabled={versions.loading}
            value={id}
            onChange={(e) => navigate(`/library/${e.target.value}`)}
          >
            {[
              ...(versions.data?.items || []),
              ...((versions.data?.items || []).some((v: any) => v.id === l.id)
                ? []
                : [l]),
            ]
              .slice()
              .sort((a: any, b: any) => (a.version || 1) - (b.version || 1))
              .map((v: any) => (
                <option key={v.id} value={v.id}>
                  Version {v.version || 1} · {statusLabel(v.status)} ·{" "}
                  {date(v.createdAt)}
                </option>
              ))}
          </select>
        </label>
        <label>
          Compare with
          <select
            aria-label="Compare lesson version"
            disabled={versions.loading}
            value={compare?.id || ""}
            onChange={async (e) => {
              const selected = ++comparisonRequest.current;
              if (!e.target.value) {
                setCompare(null);
                return;
              }
              try {
                const detail = await api(`library/${e.target.value}`);
                if (selected === comparisonRequest.current) setCompare(detail);
              } catch (error: any) {
                if (selected === comparisonRequest.current)
                  notify(error.message);
              }
            }}
          >
            <option value="">No comparison</option>
            {(versions.data?.items || [])
              .filter((v: any) => v.id !== id)
              .map((v: any) => (
                <option key={v.id} value={v.id}>
                  Version {v.version || 1} · {statusLabel(v.action)}
                </option>
              ))}
          </select>
        </label>
        <button
          disabled={
            regenerating ||
            !bootstrap.key.configured ||
            ["queued", "streaming"].includes(l.status)
          }
          onClick={() => setRegenerate(true)}
        >
          <RefreshCw size={15} />
          Explain differently
        </button>
      </div>
      {versions.loading && (
        <p role="status" className="muted">
          Loading saved version summaries…
        </p>
      )}
      {versions.error && (
        <ErrorNotice error={versions.error} retry={versions.reload} />
      )}
      <PageControls page={versions} label="Saved versions" />
      <nav className="lesson-nav" aria-label="Lesson sections">
        {lessonSections(l.markdown || "").map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            {s.title}
          </a>
        ))}
      </nav>
      <details className="card lesson-context" style={{ marginBottom: 24 }}>
        <summary>Original request and context</summary>
        <p style={{ marginTop: 16 }}>
          {l.prompt || "No request text recorded"}
        </p>
        <small>
          Problem version {l.problemVersion || "not recorded"} ·{" "}
          {languageName(l.language)} ·{" "}
          {l.submissionId
            ? "Linked to an immutable submission snapshot"
            : "Saved request context"}
        </small>
        {(l.code ?? l.codeSnapshot) && (
          <pre
            style={{
              whiteSpace: "pre",
              overflow: "auto",
              maxHeight: 300,
              fontSize: 12,
              lineHeight: 1.65,
              marginTop: 18,
            }}
          >
            <code>{l.code ?? l.codeSnapshot}</code>
          </pre>
        )}
      </details>
      <div className="card">
        {!l.markdown?.trim() && (
          <p className="muted" role="status">
            {["queued", "streaming"].includes(l.status)
              ? "Waiting for the first answer text…"
              : "This saved request has no answer text."}
          </p>
        )}
        {liveReadingSession.current === l.id ? (
          <LiveLesson
            key={l.id}
            id={l.id}
            markdown={l.markdown || ""}
            streaming={l.status === "streaming"}
            reducedMotion={bootstrap.preferences.reducedMotion}
          />
        ) : (
          <LessonRenderer markdown={l.markdown || ""} />
        )}
        <span id="answer-end" />
      </div>
      {["queued", "streaming"].includes(l.status) && (
        <div className="notice" style={{ marginTop: 16 }}>
          This is the existing saved generation. New text appears without
          another AI request. Use the reader control above the answer to reach
          the latest text.
        </div>
      )}
      {compare && (
        <section className="card section">
          <div className="eyebrow">
            Comparison · Version {compare.version || 1}
          </div>
          <h2>{compare.title || "Earlier saved answer"}</h2>
          <div className="lesson-meta">
            <span>{date(compare.createdAt)}</span>
            <span>{statusLabel(compare.status)}</span>
            <span>{compare.model || "Model not recorded"}</span>
          </div>
          <LessonRenderer markdown={compare.markdown || ""} />
        </section>
      )}
      <div className="card section">
        <h2>Your notes</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          Add your own understanding. The original AI answer stays unchanged.
        </p>
        <textarea
          aria-label="Personal lesson notes"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNoteStatus("Unsaved changes");
          }}
          rows={5}
        />
        <div className="actions" style={{ marginTop: 12 }}>
          <button
            onClick={async () => {
              setNoteStatus("Saving…");
              try {
                await api(`library/${id}`, "PATCH", { notes });
                setNoteStatus("Saved on this device");
              } catch (e: any) {
                setNoteStatus("Could not save");
                notify(e.message);
              }
            }}
          >
            Save notes
          </button>
          <small>{noteStatus}</small>
        </div>
      </div>
      <div className="actions section">
        <button className="primary" onClick={() => setFollow(!follow)}>
          Continue conversation
        </button>
        <button className="danger" onClick={() => setDeleting(true)}>
          Delete lesson
        </button>
      </div>
      {follow && (
        <div className="card section">
          <Tutor
            problemId={l.problemId}
            language={l.language}
            code={
              l.code ??
              l.codeSnapshot ??
              problem.data?.starters?.[l.language] ??
              ""
            }
            threadId={l.threadId}
            parentId={l.id}
            existingGeneration={
              ["failed", "interrupted", "canceled"].includes(l.status)
                ? l
                : undefined
            }
          />
        </div>
      )}
      {regenerate && (
        <Confirm
          title="Generate another explanation?"
          description={`This sends the saved problem/code context, a short summary of independently demonstrated skills, and the selected answer and relevant conversation to DeepSeek again, including saved partial text. ${l.action === "solution" ? "A full-solution request may also include a historically validated reference in the selected language. " : ""}It can consume API usage and record assistance. The current answer stays saved as its own version.`}
          label="Generate new version"
          onClose={() => setRegenerate(false)}
          onConfirm={async () => {
            setRegenerate(false);
            setRegenerating(true);
            try {
              const next = await api("tutor", "POST", {
                problemId: l.problemId,
                language: l.language,
                code: l.code ?? l.codeSnapshot ?? "",
                action: l.action || "simplify",
                prompt: `Explain this differently in simple English. Original request: ${l.prompt || ""}`,
                threadId: l.threadId,
                parentId: l.id,
                submissionId: l.submissionId,
                idempotencyKey: crypto.randomUUID(),
                consent: true,
              });
              navigate(`/library/${next.id}`);
            } catch (error: any) {
              notify(error.message);
            } finally {
              setRegenerating(false);
            }
          }}
        />
      )}
      {deleting && (
        <Confirm
          title="Delete this saved lesson?"
          description="The saved explanation and its notes will be removed. Minimal assistance and progress evidence remain, so deleting an answer does not make an assisted solve independent."
          label="Delete lesson"
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            try {
              await api(`library/${id}`, "DELETE", { confirmation: "DELETE" });
              navigate("/library");
            } catch (e: any) {
              notify(e.message);
              setDeleting(false);
            }
          }}
        />
      )}
    </div>
  );
}
function Progress() {
  const { topics, bootstrap } = useApp();
  const progress = useData("progress");
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Evidence, not a score</div>
          <h1>Your progress</h1>
          <p className="subtitle">
            Independent understanding, supported learning, and review are
            different parts of the same journey.
          </p>
        </div>
      </div>
      {progress.error && <ErrorNotice error={progress.error} />}
      <div className="grid three">
        <div className="card">
          <span className="metric-label">Independent questions</span>
          <div className="stat">{progress.data?.independent ?? "—"}</div>
          <small>Without recorded in-app assistance</small>
        </div>
        <div className="card">
          <span className="metric-label">Learned with help</span>
          <div className="stat">{progress.data?.assisted ?? "—"}</div>
          <small>Consolidate with a fresh checkpoint</small>
        </div>
        <div className="card">
          <span className="metric-label">Due reviews</span>
          <div className="stat">
            {progress.data?.reviewQueue?.length ?? "—"}
          </div>
          <small>Retention evidence, at your own pace</small>
        </div>
      </div>
      <section className="section">
        <div className="section-head">
          <h2>Topic evidence</h2>
          <span className="muted" style={{ fontSize: 12 }}>
            Completion is separate from mastery
          </span>
        </div>
        <div className="topic-grid">
          {topics.map((t) => (
            <TopicCard key={t.id} topic={t} />
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Skills and language evidence</h2>
          <small>Based on recorded outcomes</small>
        </div>
        {progress.data?.skills?.length ? (
          <div className="card list-card">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>Understanding</th>
                    <th>Working step</th>
                    <th>Independent step</th>
                    <th>Java / C++ / Python</th>
                    <th>Supporting evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.data.skills.map((s: any) => (
                    <tr key={s.skillId}>
                      <td>
                        {s.skillId.replaceAll(".", " · ").replaceAll("-", " ")}
                      </td>
                      <td>{statusLabel(s.status)}</td>
                      <td>{s.workingStep ?? "Not assessed"}</td>
                      <td>{s.highestIndependentStep ?? "Not demonstrated"}</td>
                      <td>
                        {["java", "cpp", "python"].map((lang) => (
                          <small key={lang} style={{ display: "block" }}>
                            {languageName(lang)}:{" "}
                            {s.languageEvidence?.[lang]?.length || 0} recorded
                            outcomes
                          </small>
                        ))}
                      </td>
                      <td>
                        <details>
                          <summary>
                            {s.evidenceIds?.length || 0} outcomes
                          </summary>
                          {(s.evidenceIds || []).map((eid: string) => {
                            const e = progress.data.evidence.find(
                              (x: any) => x.id === eid,
                            );
                            return e ? (
                              <p
                                key={eid}
                                style={{ fontSize: 12, margin: "9px 0" }}
                              >
                                <Link to={`/problems/${e.problemId}`}>
                                  {e.problemId}
                                </Link>
                                <br />
                                {statusLabel(
                                  e.classification || e.outcome,
                                )} · {languageName(e.language)}
                                <br />
                                {date(e.createdAt)}
                              </p>
                            ) : null;
                          })}
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Empty title="Skills are not assessed yet" icon={GraduationCap}>
            <p>
              Practice creates specific skill evidence. Topic completion never
              stands in for demonstrated proficiency in every language.
            </p>
          </Empty>
        )}
      </section>
      {progress.data?.scheduledReviews?.length > 0 && (
        <section className="section">
          <h2>Review schedule</h2>
          <div className="card list-card">
            {progress.data.scheduledReviews.map((r: any) => (
              <div className="problem-row" key={r.problemId}>
                <div className="problem-title">
                  <Link to={`/problems/${r.problemId}?mode=review`}>
                    {r.problemId}
                  </Link>
                  <small>Due {date(r.dueAt, r.timezone)}</small>
                </div>
                <span className="badge">Retention practice</span>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="section">
        <h2>Recent learning evidence</h2>
        {progress.data?.evidence?.length ? (
          <div className="card list-card">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Problem / skill</th>
                    <th>Evidence</th>
                    <th>Language</th>
                    <th>Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.data.evidence.map((e: any) => (
                    <tr key={e.id || e.submissionId}>
                      <td>
                        <Link to={`/problems/${e.problemId}`}>
                          {e.problemId}
                        </Link>
                        <small style={{ display: "block" }}>
                          {e.skillId || e.skillIds?.join(", ")}
                        </small>
                      </td>
                      <td>
                        {statusLabel(e.type || e.classification || e.kind)}
                      </td>
                      <td>{languageName(e.language)}</td>
                      <td>{date(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Empty title="Your practice will tell the story" icon={BarChart3}>
            <p>
              No learning evidence yet. A real judged submission creates the
              first record. Canceled jobs and infrastructure errors never reduce
              your understanding.
            </p>
            <Link to="/problems">Choose a first challenge →</Link>
          </Empty>
        )}
      </section>
    </div>
  );
}
function Settings() {
  const { bootstrap, topics, refresh, notify, savePreferences } = useApp();
  const settings = useData("settings");
  const requestedSection = new URLSearchParams(useLocation().search).get(
    "section",
  );
  const [section, setSection] = useState(
      requestedSection &&
        [
          "AI & DeepSeek",
          "Appearance",
          "Editor",
          "Learning",
          "Usage",
          "Data",
          "Diagnostics",
        ].includes(requestedSection)
        ? requestedSection
        : "AI & DeepSeek",
    ),
    [key, setKey] = useState(""),
    [showKey, setShowKey] = useState(false),
    [busy, setBusy] = useState(false),
    [test, setTest] = useState<any>(null),
    [error, setError] = useState<any>(null),
    [confirm, setConfirm] = useState(""),
    [backup, setBackup] = useState<any>(null),
    [preview, setPreview] = useState<any>(null);
  const pref = bootstrap.preferences;
  const recordedUsage = settings.data?.usage;
  const usageText = usageDisplay(recordedUsage);
  async function action(task: () => Promise<any>) {
    setBusy(true);
    setError(null);
    try {
      await task();
      await refresh();
      void settings.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function exportData() {
    await action(async () => {
      download(
        `CodeWise2-backup-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(await api("data/export")),
        "application/json",
      );
    });
  }
  const update = (data: any) =>
    action(async () => {
      await savePreferences(data);
      notify("Preference saved.");
    });
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Make this workspace yours</div>
          <h1>Settings</h1>
          <p className="subtitle">
            Local preferences, optional tutoring, and clear controls for your
            data.
          </p>
        </div>
      </div>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {[
            "AI & DeepSeek",
            "Appearance",
            "Editor",
            "Learning",
            "Usage",
            "Data",
            "Diagnostics",
          ].map((s) => (
            <button
              key={s}
              className={section === s ? "active" : ""}
              onClick={() => setSection(s)}
            >
              {s}
            </button>
          ))}
        </nav>
        <div className="settings-panel">
          {error && (
            <>
              <ErrorNotice error={error} />
              <Link to="/settings">Check tutor Settings →</Link>
            </>
          )}{" "}
          {section === "AI & DeepSeek" ? (
            <>
              <section className="card">
                <div className="row">
                  <h2>DeepSeek connection</h2>
                  <span className="badge">
                    {statusLabel(bootstrap.key.status || "unconfigured")}
                  </span>
                </div>
                <p className="muted" style={{ fontSize: 13 }}>
                  Your key is stored on this device and used only by the
                  backend. It is never fetched back into this field.
                </p>
                {bootstrap.key.configured && (
                  <div className="notice success">
                    <ShieldCheck size={17} />
                    <div>
                      A key is saved on this device: {bootstrap.key.masked}
                      <br />
                      <small>
                        Last successful connection check:{" "}
                        {date(bootstrap.key.lastChecked)}
                      </small>
                    </div>
                  </div>
                )}
                <div className="field">
                  <label htmlFor="deepseek-key">
                    {bootstrap.key.configured
                      ? "Replace saved key"
                      : "DeepSeek API key"}
                  </label>
                  <div className="actions" style={{ flexWrap: "nowrap" }}>
                    <input
                      id="deepseek-key"
                      type={showKey ? "text" : "password"}
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={
                        bootstrap.key.configured
                          ? "Enter a new key to replace the saved one"
                          : "Paste your DeepSeek key here"
                      }
                    />
                    <button
                      aria-label={
                        showKey ? "Hide entered key" : "Show entered key"
                      }
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? "Hide" : "Show"}
                    </button>
                  </div>
                  <small>
                    Saving offline is supported; an unverified key is labelled
                    accordingly.
                  </small>
                </div>
                <div className="actions">
                  <button
                    disabled={busy || (!key && !bootstrap.key.configured)}
                    onClick={() =>
                      action(async () => {
                        const result = await api(
                          "settings/key/test",
                          "POST",
                          key ? { key } : {},
                        );
                        setTest(result);
                      })
                    }
                  >
                    {busy ? (
                      <Loader2 size={15} className="spinner" />
                    ) : (
                      <RefreshCw size={15} />
                    )}
                    Test connection
                  </button>
                  <button
                    className="primary"
                    disabled={busy || !key.trim()}
                    onClick={() =>
                      bootstrap.key.configured
                        ? setConfirm("replace")
                        : action(async () => {
                            await api("settings/key", "PUT", {
                              key,
                              replace: false,
                            });
                            setKey("");
                            setTest(null);
                            notify(
                              "Key saved. Connection status is shown above.",
                            );
                          })
                    }
                  >
                    {bootstrap.key.configured ? "Replace key" : "Save key"}
                  </button>
                  {bootstrap.key.configured && (
                    <button
                      className="danger"
                      disabled={busy}
                      onClick={() => setConfirm("remove")}
                    >
                      Remove key
                    </button>
                  )}
                </div>
                {test && (
                  <div
                    className="notice"
                    style={{ marginTop: 18, marginBottom: 0 }}
                  >
                    <div>
                      <strong>
                        {test.message ||
                          statusLabel(test.status || "Connection checked")}
                      </strong>
                      <div>
                        Model listing checks connectivity; it does not prove a
                        tutor generation works.{" "}
                        {pref.model
                          ? "Your selected model is shown below."
                          : "Next, choose an available tutor model below."}
                      </div>
                    </div>
                  </div>
                )}
              </section>
              <section className="card">
                <h2>Choose your tutor model</h2>
                <div className="field">
                  <label htmlFor="model">Supported DeepSeek model</label>
                  {settings.data?.models?.length ? (
                    <select
                      id="model"
                      value={pref.model || ""}
                      disabled={busy}
                      onChange={(e) => update({ model: e.target.value })}
                    >
                      <option value="">Choose a model…</option>
                      {settings.data.models.map((m: any) => (
                        <option
                          key={typeof m === "string" ? m : m.id}
                          value={typeof m === "string" ? m : m.id}
                        >
                          {typeof m === "string" ? m : m.id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="muted">
                      Test a saved key to discover available models. Current
                      preference: {pref.model || "none"}
                    </p>
                  )}
                </div>
                <small>
                  {pref.model
                    ? `Selected: ${pref.model}`
                    : "Test your saved key, then choose an available model before asking the tutor."}
                </small>
              </section>
              <section className="card">
                <h2>What tutoring sends</h2>
                <p className="muted" style={{ fontSize: 13 }}>
                  A requested explanation sends the relevant problem statement
                  and examples, selected language, your code snapshot, safe
                  diagnostics, a short summary of independently demonstrated
                  skills, and related messages or a selected prior answer to
                  DeepSeek, including saved partial text. A requested full
                  solution may also include a historically validated reference
                  in the selected language. Prompts exclude hidden tests,
                  encryption material and unrelated history; your key is used
                  server-side for provider authentication.
                </p>
                <p className="muted" style={{ fontSize: 13 }}>
                  Reading a saved lesson makes no inference call. Code practice,
                  progress, notes, and the roadmap work without a key.
                </p>
                <button
                  disabled={busy || !bootstrap.key.configured || !pref.model}
                  onClick={() => setConfirm("tutor-test")}
                >
                  Test a small tutor response
                </button>
                <small style={{ display: "block", marginTop: 8 }}>
                  Optional. This can consume DeepSeek API usage.
                </small>
              </section>
            </>
          ) : section === "Appearance" ? (
            <section className="card">
              <h2>A comfortable reading space</h2>
              <div className="field">
                <label htmlFor="theme">Theme</label>
                <select
                  id="theme"
                  value={pref.theme}
                  onChange={(e) => update({ theme: e.target.value })}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">Follow system</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="text-size">Text and editor size</label>
                <select
                  id="text-size"
                  value={pref.fontSize}
                  onChange={(e) => update({ fontSize: Number(e.target.value) })}
                >
                  {[12, 14, 15, 16, 18, 20, 22, 24].map((n) => (
                    <option key={n} value={n}>
                      {n}px
                    </option>
                  ))}
                </select>
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={pref.reducedMotion}
                  onChange={(e) => update({ reducedMotion: e.target.checked })}
                />
                Reduce interface motion
              </label>
            </section>
          ) : section === "Editor" ? (
            <section className="card">
              <h2>Your coding defaults</h2>
              <div className="field">
                <label htmlFor="default-language">Default language</label>
                <select
                  id="default-language"
                  value={pref.language}
                  onChange={(e) => update({ language: e.target.value })}
                >
                  {["java", "cpp", "python"].map((l) => (
                    <option key={l} value={l}>
                      {languageName(l)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="tab-width">Tab width</label>
                <select
                  id="tab-width"
                  value={pref.tabWidth}
                  onChange={(e) => update({ tabWidth: Number(e.target.value) })}
                >
                  {[2, 4, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} spaces
                    </option>
                  ))}
                </select>
              </div>
              <div className="notice success">
                <Check size={17} />
                <div>
                  Drafts autosave after a short pause. Java, C++, and Python
                  drafts stay separate. Conflicting revisions display an error
                  instead of silently overwriting newer work.
                </div>
              </div>
              <p className="muted" style={{ fontSize: 13 }}>
                The local Monaco editor supports ordinary syntax completion and
                standard editor shortcuts. AI solution completion is disabled.
              </p>
            </section>
          ) : section === "Learning" ? (
            <section className="card">
              <h2>Learning at your pace</h2>
              <div className="field">
                <label htmlFor="display-name">Display name</label>
                <input
                  id="display-name"
                  defaultValue={pref.displayName}
                  maxLength={80}
                  onBlur={(e) => {
                    if (e.target.value !== pref.displayName)
                      void update({ displayName: e.target.value });
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="timezone">Timezone for review dates</label>
                <input
                  id="timezone"
                  defaultValue={pref.timezone}
                  onBlur={(e) => {
                    if (e.target.value !== pref.timezone)
                      void update({ timezone: e.target.value });
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="focus-topic">Focus topic</label>
                <select
                  id="focus-topic"
                  value={pref.focusTopic ?? ""}
                  disabled={busy}
                  aria-describedby="focus-topic-help"
                  onChange={(e) =>
                    void update({ focusTopic: e.target.value || null })
                  }
                >
                  <option value="">All topics</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                <small id="focus-topic-help">
                  A default for your next recommendation. Your pending challenge
                  and explicit topic choices take priority.
                </small>
              </div>
              <div className="field">
                <label htmlFor="review-preference">Review preference</label>
                <select
                  id="review-preference"
                  value={pref.reviewPreference ?? "balanced"}
                  disabled={busy}
                  aria-describedby="review-preference-help"
                  onChange={(e) =>
                    void update({ reviewPreference: e.target.value })
                  }
                >
                  <option value="balanced">Balanced</option>
                  <option value="new-first">New challenges first</option>
                  <option value="review-first">Due reviews first</option>
                </select>
                <small id="review-preference-help">
                  Sets the order on Home. Balanced brings reviews first when at
                  least three are due. Your learning evidence and pending goal
                  stay intact.
                </small>
              </div>
              <div className="field">
                <label htmlFor="default-hint-depth">Default hint depth</label>
                <select
                  id="default-hint-depth"
                  value={pref.defaultHintDepth ?? "concept"}
                  disabled={busy}
                  aria-describedby="default-hint-depth-help"
                  onChange={(e) =>
                    void update({ defaultHintDepth: e.target.value })
                  }
                >
                  <option value="nudge">A small nudge</option>
                  <option value="concept">Explain the concept</option>
                  <option value="steps">Walk through the steps</option>
                </select>
                <small id="default-hint-depth-help">
                  Sets the detail of future hints, from a small pointer to a
                  sequence of steps.
                </small>
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={pref.autoExplain}
                  onChange={(e) => {
                    if (e.target.checked) setConfirm("auto-explain");
                    else void update({ autoExplain: false });
                  }}
                />
                Automatic short explanations after failed submissions
              </label>
              <small>
                Off by default. Enabling this can consume API usage and record
                algorithmic assistance.
              </small>
              <div className="divider" />
              <p className="muted" style={{ fontSize: 13 }}>
                Your next challenge comes from deterministic rules and real
                submission evidence. Unknown skills remain unassessed;
                completion is never shown as a mastery probability.
              </p>
              <button onClick={() => setConfirm("onboarding")}>
                Revisit starting preferences
              </button>
            </section>
          ) : section === "Usage" ? (
            <section className="card">
              <h2>Optional AI usage controls</h2>
              <div className="field-inline">
                <div className="field">
                  <label htmlFor="daily-requests">Daily request cap</label>
                  <input
                    type="number"
                    id="daily-requests"
                    min="1"
                    max="100"
                    defaultValue={pref.dailyRequests}
                    onBlur={(e) =>
                      update({ dailyRequests: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="daily-tokens">Daily token cap</label>
                  <input
                    type="number"
                    id="daily-tokens"
                    min="128"
                    max="500000"
                    defaultValue={pref.dailyTokens}
                    onBlur={(e) =>
                      update({ dailyTokens: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="daily-spend">
                  Daily estimated spend cap (USD)
                </label>
                <input
                  type="number"
                  id="daily-spend"
                  min="0.01"
                  max="100000"
                  step="0.01"
                  defaultValue={pref.dailySpendUsd ?? ""}
                  placeholder="No spend cap"
                  onBlur={(e) =>
                    update({
                      dailySpendUsd: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
                <small>
                  Uses the recorded official pricing snapshot. Unknown model
                  prices are not treated as free.
                </small>
              </div>
              <div className="field">
                <label htmlFor="response-length">Maximum response tokens</label>
                <input
                  type="number"
                  id="response-length"
                  min="128"
                  max="8192"
                  defaultValue={pref.maxOutputTokens}
                  onBlur={(e) =>
                    update({ maxOutputTokens: Number(e.target.value) })
                  }
                />
              </div>
              <div className="divider" />
              <h3>Recorded usage</h3>
              <p className="muted">
                Across saved usage history. Daily caps apply separately.
              </p>
              <dl className="usage-counts">
                <dt>Requests sent or delivery unconfirmed</dt>
                <dd>{recordedUsage?.requests ?? "Loading usage records…"}</dd>
                {recordedUsage?.notSentRequests > 0 && (
                  <>
                    <dt>Requests not sent</dt>
                    <dd>
                      {recordedUsage.notSentRequests} · excluded from usage
                      totals
                    </dd>
                  </>
                )}
                {recordedUsage?.pendingRequests > 0 && (
                  <>
                    <dt>Requests still pending</dt>
                    <dd>{recordedUsage.pendingRequests}</dd>
                  </>
                )}
                {recordedUsage?.failedRequests > 0 && (
                  <>
                    <dt>Failed requests</dt>
                    <dd>
                      {recordedUsage.failedRequests} · a failure can still
                      consume provider usage
                    </dd>
                  </>
                )}
                <dt>Provider-reported token subtotal</dt>
                <dd>
                  {usageText.tokens}
                  <small style={{ display: "block" }}>
                    {usageText.tokenCoverage}
                  </small>
                </dd>
                <dt>Estimated local cost subtotal</dt>
                <dd>
                  {usageText.cost}
                  <small style={{ display: "block" }}>
                    {usageText.costCoverage}
                  </small>
                </dd>
              </dl>
              <small>
                Subtotals include only recorded provider usage and locally
                estimated prices. Missing reports are not treated as zero;
                reservations for daily caps can be higher than these subtotals.
              </small>
              <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
                CodeWise2 does not receive your account bill. View billed
                charges in your{" "}
                <a
                  href="https://platform.deepseek.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  DeepSeek account
                </a>
                .
              </p>
            </section>
          ) : section === "Data" ? (
            <>
              <section className="card">
                <h2>Keep a copy of your learning</h2>
                <div className="field">
                  <label>Local storage location</label>
                  <p
                    className="muted"
                    style={{ fontSize: 12, overflowWrap: "anywhere" }}
                  >
                    {bootstrap.storagePath}
                  </p>
                </div>
                <button disabled={busy} onClick={exportData}>
                  <Download size={16} />
                  Export learning backup
                </button>
                <small style={{ display: "block", marginTop: 10 }}>
                  Includes drafts, lessons, notes, preferences and progress.
                  Excludes the DeepSeek key and encryption material.
                </small>
                <div className="divider" />
                <div className="field">
                  <label htmlFor="backup-import">
                    Preview a backup restore
                  </label>
                  <input
                    type="file"
                    id="backup-import"
                    accept="application/json,.json"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 64 * 1024 * 1024) {
                        setError(
                          new Error(
                            "Backup exceeds the 64 MiB import limit. Choose a smaller backup; no data has been changed.",
                          ),
                        );
                        return;
                      }
                      await action(async () => {
                        const parsed = JSON.parse(await f.text());
                        setBackup(parsed);
                        setPreview(
                          await api("data/import/preview", "POST", {
                            backup: parsed,
                          }),
                        );
                      });
                    }}
                  />
                </div>
                {preview && (
                  <>
                    <pre style={{ fontSize: 12 }}>
                      {JSON.stringify(preview.counts, null, 2)}
                    </pre>
                    <button
                      className="danger"
                      onClick={() => setConfirm("restore")}
                    >
                      Restore this backup
                    </button>
                  </>
                )}
              </section>
              <section className="card">
                <h2>Clear saved explanations</h2>
                <p className="muted" style={{ fontSize: 13 }}>
                  Delete all saved AI lessons, versions and lesson notes.
                  Assistance/progress evidence, code drafts and your ordinary
                  problem notes are preserved.
                </p>
                <button
                  className="danger"
                  onClick={() => setConfirm("history")}
                >
                  Delete all saved lessons…
                </button>
              </section>
              <section className="card">
                <h2>Reset progress</h2>
                <p className="muted" style={{ fontSize: 13 }}>
                  Reset learning evidence and review state explicitly. This is a
                  separate action from deleting a saved lesson.
                </p>
                <button
                  className="danger"
                  onClick={() => setConfirm("progress")}
                >
                  Reset progress…
                </button>
              </section>
            </>
          ) : (
            <>
              <section className="card">
                <div className="row">
                  <h2>Local system health</h2>
                  <button
                    className="ghost"
                    onClick={() => {
                      void refresh();
                      void settings.reload();
                    }}
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                </div>
                <dl>
                  <dt className="muted">Application</dt>
                  <dd>{bootstrap.appVersion}</dd>
                  <dt className="muted">Platform / architecture</dt>
                  <dd>
                    {typeof bootstrap.platform === "string"
                      ? bootstrap.platform
                      : `${bootstrap.platform?.os || bootstrap.platform?.platform || "Unknown OS"} / ${bootstrap.platform?.architecture || bootstrap.platform?.arch || "Unknown architecture"}`}
                  </dd>
                  <dt className="muted">Catalogue</dt>
                  <dd>
                    {bootstrap.catalogue.published} /{" "}
                    {bootstrap.catalogue.expected} published
                  </dd>
                  <dt className="muted">Runner</dt>
                  <dd>
                    {bootstrap.runner.ready ? "Ready" : "Not ready"} ·{" "}
                    {bootstrap.runner.message}
                  </dd>
                  <dt className="muted">Isolation verification</dt>
                  <dd>
                    {bootstrap.runner.controlsVerified
                      ? "Verified"
                      : "Not verified"}
                  </dd>
                </dl>
                {bootstrap.runner.languages.length ? (
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Language</th>
                          <th>Verified runtime</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bootstrap.runner.languages.map((l: any) => (
                          <tr key={l.id}>
                            <td>{languageName(l.id)}</td>
                            <td>{l.version}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="notice">
                    No installed language runtime versions have been verified.
                    Untrusted code never falls back to execution on the host.
                  </div>
                )}
                <button
                  onClick={() =>
                    action(async () =>
                      download(
                        "CodeWise2-diagnostics.json",
                        JSON.stringify(await api("health"), null, 2),
                        "application/json",
                      ),
                    )
                  }
                >
                  <Download size={16} />
                  Export sanitized diagnostics
                </button>
              </section>
            </>
          )}
        </div>
      </div>
      {confirm && (
        <Confirm
          confirmationText={
            confirm === "history"
              ? "DELETE ALL LESSONS"
              : confirm === "progress"
                ? "RESET PROGRESS"
                : confirm === "restore"
                  ? "RESTORE"
                  : undefined
          }
          title={
            {
              remove: "Remove saved DeepSeek key?",
              replace: "Replace the saved key?",
              progress: "Reset your learning progress?",
              history: "Delete every saved lesson?",
              restore: "Restore this backup?",
              onboarding: "Revisit starting preferences?",
              "auto-explain": "Enable automatic explanations?",
              "tutor-test": "Test a tutor response?",
            }[confirm] || "Confirm action"
          }
          description={
            {
              remove:
                "New tutoring requests will no longer use this key. Saved answers and code practice remain available.",
              replace:
                "The newly entered key will replace the saved one, even if it has not yet been verified.",
              progress:
                "Learning evidence and review progress will be reset. This action cannot be undone without a backup.",
              history:
                "All saved AI conversations, versions and lesson notes will be deleted. Code drafts, problem notes, minimal assistance evidence and learning progress remain. Export a backup first if you want to keep these explanations.",
              restore:
                "The previewed backup will replace learning data transactionally. A local safety backup is created by the server.",
              onboarding:
                "Return to welcome preferences without clearing code, lessons or progress.",
              "auto-explain":
                "Failed submissions may send relevant problem and code context to DeepSeek automatically, consume usage, and record assistance.",
              "tutor-test":
                "This sends a small request to DeepSeek and can consume API usage. Model listing alone does not verify generation.",
            }[confirm] || ""
          }
          label="Confirm"
          onClose={() => setConfirm("")}
          onConfirm={() => {
            const c = confirm;
            setConfirm("");
            void action(async () => {
              if (c === "remove") {
                await api("settings/key", "DELETE", { confirmation: "REMOVE" });
                setKey("");
              }
              if (c === "replace") {
                await api("settings/key", "PUT", { key, replace: true });
                setKey("");
              }
              if (c === "progress")
                await api("data/reset", "POST", {
                  confirmation: "RESET PROGRESS",
                });
              if (c === "history")
                await api("data/history/reset", "POST", {
                  confirmation: "DELETE ALL LESSONS",
                });
              if (c === "restore")
                await api("data/import", "POST", {
                  backup,
                  token: preview.token,
                  confirmation: "RESTORE",
                });
              if (c === "onboarding")
                await savePreferences({ onboarded: false });
              if (c === "auto-explain")
                await savePreferences({ autoExplain: true });
              if (c === "tutor-test") {
                const r = await api("settings/tutor-test", "POST", {
                  consent: true,
                });
                notify(r.message || "Tutor test request completed.");
              }
            });
          }}
        />
      )}
    </div>
  );
}
