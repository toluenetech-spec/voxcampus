import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, GraduationCap, Headphones, Mic, Radio, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

/* ------------------------------------------------------------------ copy */

const FEATURES = [
  {
    icon: Radio,
    title: 'Live rooms',
    body: 'Your instructor goes live, you get a push-in join. Host controls, listener counts, and the room closes when the class does.',
  },
  {
    icon: Headphones,
    title: 'A library per course',
    body: 'Every lecture lands in its course, newest first. Private to enrolled students unless your instructor publishes it.',
  },
  {
    icon: Sparkles,
    title: 'An assistant that read the syllabus',
    body: 'Ask it about your courses, get a lecture outline, generate a quiz, or turn a topic into flashcards — grounded in your own material.',
  },
  {
    icon: BookOpen,
    title: 'Assignments that close the loop',
    body: 'Submit text or a file against a deadline. Your instructor grades it in place and it shows up against the assignment.',
  },
];

const STEPS = [
  {
    title: 'Join with a code',
    body: 'Your instructor shares a six-character code. Paste it in and the course appears on your dashboard.',
  },
  {
    title: 'Listen on your own schedule',
    body: 'Stream at whatever speed gets you through it. Pick up mid-commute, finish on the bus home.',
  },
  {
    title: 'Turn up when it goes live',
    body: 'Live rooms are announced on your dashboard. Join as a listener, or host one if you teach.',
  },
];

const AUDIENCES = [
  {
    icon: GraduationCap,
    who: 'If you study',
    points: [
      'Every lecture for your courses in one place',
      'Playback speed and background listening',
      'Join live rooms without installing anything',
      'Ask the assistant instead of re-scrubbing a recording',
    ],
  },
  {
    icon: Mic,
    who: 'If you teach',
    points: [
      'Publish a lecture to just your enrolled students',
      'Go live for office hours or a revision session',
      'Set assignments with real deadlines and collect submissions',
      'Grade in place, with the submission alongside the rubric',
    ],
  },
];

/* ------------------------------------------------------- product preview */

/** A still of the real product — the dashboard, roughly as it ships. */
const ProductPreview = () => (
  <div className="relative mx-auto w-full max-w-4xl">
    <div className="material-thick rounded-sheet overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b hairline">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-600/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-600/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-600/60" />
        <span className="ml-3 text-xs text-slate-500">voxcampus.app/dashboard</span>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-[200px_1fr]">
        {/* Sidebar */}
        <div className="hidden sm:flex flex-col gap-1.5">
          {['Home', 'Library', 'Live', 'AI Assistant', 'Profile'].map((item, index) => (
            <div
              key={item}
              className={`rounded-card px-3 py-2 text-xs font-medium ${
                index === 0 ? 'bg-aqua-500/12 text-aqua-300' : 'text-slate-500'
              }`}
            >
              {item}
            </div>
          ))}
          <div className="mt-auto rounded-card bg-slate-800/60 p-3">
            <div className="h-2 w-16 rounded-full bg-slate-600" />
            <div className="mt-2 h-2 w-24 rounded-full bg-slate-700" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div>
            <div className="h-4 w-40 rounded-full bg-slate-700" />
            <div className="mt-2 h-2.5 w-64 rounded-full bg-slate-800" />
          </div>

          {/* Course cards */}
          {[
            { title: 'Signals & Systems 301', meta: 'Dr. Amara Okafor', live: true },
            { title: 'Introduction to Machine Learning', meta: 'Dr. Amara Okafor', live: false },
          ].map((course) => (
            <div key={course.title} className="rounded-card border border-white/[0.06] bg-slate-900/60 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-200">{course.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{course.meta}</p>
                </div>
                {course.live && (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-500/12 px-2 py-1 text-[11px] font-medium text-rose-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    Live
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Player */}
          <div className="rounded-card border border-white/[0.06] bg-slate-900/60 p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aqua-500/15 text-aqua-300">
                <Headphones size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-300">Lecture 03 — The Fourier series</p>
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 28 }).map((_, index) => (
                    <span
                      key={index}
                      className={`w-full rounded-full ${index < 11 ? 'bg-aqua-400' : 'bg-slate-700'}`}
                      style={{ height: `${6 + ((index * 7) % 9)}px` }}
                    />
                  ))}
                </div>
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-slate-500">18:24</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Soft light source behind the panel */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-x-16 -top-16 -z-10 h-64 rounded-full bg-aqua-500/15 blur-[100px]"
    />
  </div>
);

/* ------------------------------------------------------------------ view */

const LandingView = () => {
  const { currentUser, startDemo } = useAppContext();
  const navigate = useNavigate();
  const [startingDemo, setStartingDemo] = useState(false);

  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser, navigate]);

  return (
    <div className="material-force-dark relative min-h-screen overflow-x-hidden bg-slate-950 text-white">
      {/* Ambient wash — static, so it costs nothing to scroll. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-[600px] bg-[radial-gradient(120%_100%_at_50%_0%,rgba(34,211,238,0.10),transparent_70%)]"
      />

      <div className="relative z-10 flex flex-col">
        {/* ---------------------------------------------------------- nav */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/70 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Logo className="scale-[0.62] origin-left" />
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/login"
                className="rounded-card px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-card bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-200"
              >
                Create account
              </Link>
            </div>
          </nav>
        </header>

        {/* --------------------------------------------------------- hero */}
        <main className="flex flex-col">
          <section className="relative px-6 pb-16 pt-20 sm:pt-28">
            <div className="relative z-10 mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-slate-300">
                <Sparkles size={13} className="text-aqua-400" />
                Now with an AI assistant for every course
              </span>

              <h1 className="mt-7 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
                Every lecture,
                <br />
                on your own schedule.
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-400">
                VoxCampus puts your course audio somewhere you'll actually use it — stream lectures at your own speed,
                drop into a live room when your instructor goes on air, and ask the assistant about anything you missed.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-card bg-aqua-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-aqua-400 sm:w-auto"
                >
                  Create an account
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center rounded-card border border-white/15 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.06] sm:w-auto"
                >
                  I already have one
                </Link>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setStartingDemo(true);
                  try {
                    await startDemo('student');
                    navigate('/dashboard', { replace: true });
                  } catch (error) {
                    console.error(error);
                    setStartingDemo(false);
                  }
                }}
                disabled={startingDemo}
                className="mt-5 text-sm text-slate-500 underline underline-offset-4 transition-colors hover:text-slate-300 disabled:opacity-60"
              >
                {startingDemo ? 'Opening the demo…' : 'Or look around the demo workspace first'}
              </button>
            </div>

            <div className="mt-16">
              <ProductPreview />
            </div>
          </section>

          {/* ----------------------------------------------------- features */}
          <section className="px-6 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Built around how a course actually runs
              </h2>
              <p className="mt-4 max-w-xl text-slate-400">
                Not a podcast app with a login screen. Lectures belong to courses, deadlines belong to assignments, and
                live rooms belong to the person teaching.
              </p>

              <div className="mt-12 grid gap-4 sm:grid-cols-2">
                {FEATURES.map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    className="material-regular rounded-panel p-6 transition-colors hover:bg-white/[0.06]"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-card bg-aqua-500/12 text-aqua-400">
                      <Icon size={19} />
                    </span>
                    <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* -------------------------------------------------------- steps */}
          <section className="border-y border-white/[0.06] bg-white/[0.02] px-6 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Three steps, then you're caught up</h2>
              <div className="mt-12 grid gap-8 sm:grid-cols-3">
                {STEPS.map((step, index) => (
                  <div key={step.title}>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-aqua-400">
                      {index + 1}
                    </span>
                    <h3 className="mt-5 text-base font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------- audiences */}
          <section className="px-6 py-20 sm:py-28">
            <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-2">
              {AUDIENCES.map(({ icon: Icon, who, points }) => (
                <div key={who} className="material-regular rounded-panel p-8">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-card bg-white/[0.06] text-slate-300">
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-white">{who}</h3>
                  <ul className="mt-5 space-y-3">
                    {points.map((point) => (
                      <li key={point} className="flex gap-3 text-sm text-slate-400">
                        <Check size={16} className="mt-0.5 shrink-0 text-aqua-400" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ---------------------------------------------------------- cta */}
          <section className="px-6 pb-24">
            <div className="mx-auto max-w-3xl rounded-sheet border border-white/[0.08] bg-white/[0.03] px-8 py-14 text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Start with one course</h2>
              <p className="mx-auto mt-4 max-w-md text-slate-400">
                Create an account, join with a code, and see whether it survives a week of your actual timetable.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex w-full items-center justify-center rounded-card bg-aqua-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-aqua-400 sm:w-auto"
                >
                  Create an account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center rounded-card border border-white/15 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.06] sm:w-auto"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default LandingView;
