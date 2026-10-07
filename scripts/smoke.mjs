/**
 * Headless smoke test.
 *
 * Boots the real application in jsdom against the in-memory demo backend and
 * walks every route, asserting that each screen renders the content it should
 * and that nothing logs a React error along the way.
 *
 *   npm run smoke
 *
 * It needs no network and no Firebase credentials, which makes it a quick
 * regression net while working on the UI.
 */
import { JSDOM } from 'jsdom';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/dashboard',
  pretendToBeVisual: true,
});
const { window } = dom;

globalThis.window = window;
globalThis.document = window.document;
Object.defineProperty(globalThis, 'navigator', {
  value: window.navigator,
  configurable: true,
  writable: true,
});
globalThis.HTMLElement = window.HTMLElement;
globalThis.HTMLCanvasElement = window.HTMLCanvasElement;
globalThis.Element = window.Element;
globalThis.Node = window.Node;
globalThis.Event = window.Event;
globalThis.CustomEvent = window.CustomEvent;
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.localStorage = window.localStorage;
globalThis.sessionStorage = window.sessionStorage;
Object.defineProperty(globalThis, 'location', { value: window.location, configurable: true, writable: true });
globalThis.history = window.history;
window.matchMedia =
  window.matchMedia ||
  ((q) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  }));
class IO {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.IntersectionObserver = window.IntersectionObserver = IO;
window.ResizeObserver = globalThis.ResizeObserver = IO;
window.speechSynthesis = { speak() {}, cancel() {}, getVoices: () => [] };
globalThis.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance = class {
  constructor(t) {
    this.text = t;
  }
};
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no layout/canvas; those "Not implemented" notices are noise here.
const IGNORED = /Not implemented|not wrapped in act|HTMLCanvasElement's getContext/;

let errors = [];
const originalError = console.error;
console.error = (...args) => {
  const message = args.map(String).join(' ');
  if (!IGNORED.test(message)) errors.push(message);
};

const vite = await import('vite');
const server = await vite.createServer({
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');

const { default: App } = await server.ssrLoadModule('/src/App.jsx');
const { localDb } = await server.ssrLoadModule('/src/lib/localDb.js');

let root = null;
let container = null;

// Fresh mount per route: BrowserRouter only reads the URL when it mounts.
const visit = async (path) => {
  if (root) {
    await act(async () => {
      root.unmount();
    });
  }
  window.history.pushState({}, '', path);
  container = document.createElement('div');
  container.id = 'root';
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(App));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
  return container.textContent || '';
};

const checks = [];
const expect = (label, ok, detail = '') => checks.push([label, Boolean(ok), detail]);

/** Clicks the first button whose text matches, then lets effects settle. */
const clickText = async (pattern) => {
  // Badges (e.g. "Tasks+6") are stripped before matching.
  const normalise = (b) => (b.textContent || '').replace(/[+\d]/g, '').trim();
  const button = [...document.querySelectorAll('button')].find((b) => pattern.test(normalise(b)));
  if (!button) return false;
  await act(async () => {
    button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
  return true;
};

/* ---------------- student persona ---------------- */
localStorage.setItem('voxcampus_mode', 'demo');
localStorage.setItem('voxcampus_demo_user', JSON.stringify({ uid: 'demo-student', role: 'student' }));
localStorage.setItem('voxcampus_theme', 'dark');
localStorage.setItem('voxcampus_tour_done', 'true');

const dashboardText = await visit('/dashboard');
expect('dashboard renders', dashboardText.length > 200);
expect('dashboard greets the student', /Welcome back, Tunde Bakare/i.test(dashboardText), dashboardText.slice(0, 200));
expect('enrolled courses listed', /Signals & Systems 301/i.test(dashboardText), dashboardText.slice(0, 400));
expect('sidebar rendered', /Home/.test(dashboardText) && /Library/.test(dashboardText));
expect('demo banner visible', /Demo workspace/i.test(dashboardText));
expect('demo store seeded', localDb.rawDocs('courses').length === 3, `courses=${localDb.rawDocs('courses').length}`);
expect('no console errors on dashboard', errors.length === 0, errors.join(' | '));

const routeExpectations = [
  ['/library', /Global Discovery Hub/i, /Entropy explained properly/i],
  ['/live', /Live Audio Rooms/i, /Exam revision/i],
  ['/course/demo-course-signals', /Signals & Systems 301/i, /Enrolled Students/i],
  ['/profile', /Your Profile/i, /Tunde Bakare/i],
  ['/ai', /AI Assistant/i, /Ask anything about your studies/i],
  ['/room/LR7KX9', /Exam revision/i, /Live Room/i],
  // With no VITE_ZEGO_* credentials (and none in demo mode) the room page must
  // degrade to the explanatory panel rather than load the 5 MB live-audio SDK.
  ['/room/LR7KX9', /audio bridge is not/i, /Sign in with an account/i],
  // Already signed in, so the auth layout bounces you to the dashboard.
  ['/login', /Dashboard/i, /Welcome back/i],
  ['/nope', /Page not found/i, /Page not found/i],
];

for (const [path, ...patterns] of routeExpectations) {
  errors = [];
  let text;
  try {
    text = await visit(path);
  } catch (error) {
    expect(`${path} renders`, false, error.message);
    continue;
  }
  expect(
    `${path} renders expected content`,
    patterns.every((pattern) => pattern.test(text)),
    `pathname=${window.location.pathname} :: ${text.slice(0, 300)}`,
  );
  expect(`${path} logs no errors`, errors.length === 0, errors.join(' | '));
}

/* ---------------- AI assistant tools ---------------- */
await visit('/ai');
const toolChecks = [];
for (const label of ['Outline', 'Quiz', 'Flashcards']) {
  const switched = await clickText(new RegExp(`^${label}$`));
  toolChecks.push([`AI tool tab "${label}" switches`, switched, 'tab button not found']);
}
const afterTools = container.textContent || '';
expect('AI assistant keeps its course context line', /course/i.test(afterTools), afterTools.slice(0, 300));
for (const [label, ok, detail] of toolChecks) expect(label, ok, detail);

/* ---------------- design system ---------------- */
// Guards the material system: if the shell or panels fall back to ad-hoc
// backgrounds the glass treatment has silently regressed.
await visit('/ai');
const shellHtml = container.innerHTML;
expect('shell uses the chrome material', shellHtml.includes('material-chrome'), 'material-chrome not rendered');
expect('panels use the material tiers', /material-(regular|thick)/.test(shellHtml), 'no material-* panel found');
expect('hairline borders applied', shellHtml.includes('hairline'), 'hairline not rendered');

/* ---------------- instructor persona ---------------- */
localStorage.setItem('voxcampus_demo_user', JSON.stringify({ uid: 'demo-instructor', role: 'instructor' }));
const instructorText = await visit('/dashboard');
expect('instructor sees Create Course', /Create Course/i.test(instructorText), instructorText.slice(0, 300));
await visit('/course/demo-course-signals');
expect('tasks tab is reachable', await clickText(/^Tasks$/), 'no Tasks tab button found');
const tasksText = container.textContent || '';
expect('instructor sees grading controls', /Grade Submissions/i.test(tasksText), tasksText.slice(400, 900));
expect('assignments listed', /Problem Set 2/i.test(tasksText), tasksText.slice(400, 900));

/* ---------------- signed out ---------------- */
localStorage.removeItem('voxcampus_demo_user');
localStorage.removeItem('voxcampus_mode');
const landingText = await visit('/');
expect('landing page renders hero', /Every lecture/i.test(landingText), landingText.slice(0, 300));
expect(
  'landing page shows the product preview',
  /voxcampus.app\/dashboard/i.test(landingText),
  landingText.slice(0, 400),
);
expect(
  'landing page makes no fabricated social claims',
  !/Trusted by|10,000|50,000/.test(landingText),
  'fabricated stats or vendor-logos-as-customers are back',
);
const signInText = await visit('/login');
expect('sign-in form renders', /Sign in to VoxCampus/i.test(signInText), signInText.slice(0, 300));
const signUpText = await visit('/signup');
expect('sign-up form renders', /Create your account/i.test(signUpText), signUpText.slice(0, 300));

// Class-string hygiene. Collapsed whitespace can weld two utilities into one
// dead token ("duration-300 flex" -> "duration-300flex"): neither half applies
// and nothing throws, so this has to be caught by scanning the source.
const SRC = join(process.cwd(), 'src');
const listFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)],
  );
const WELDED = /(?:^|["'\s])((?:[a-z]+(?:-[a-z0-9.]+)*)-\d+(?:\.\d+)?[a-z]{3,})(?=["'\s])/;
const welds = [];
for (const file of listFiles(SRC).filter((f) => /\.jsx?$/.test(f))) {
  readFileSync(file, 'utf8')
    .split(/\n/)
    .forEach((line, i) => {
      const m = line.match(WELDED);
      if (m) welds.push(`${file.slice(SRC.length + 1)}:${i + 1} ${m[1]}`);
    });
}
expect('no welded class tokens in source', welds.length === 0, welds.slice(0, 6).join(' | '));

/* ---------------- report ---------------- */
let failed = false;
for (const [label, ok, detail] of checks) {
  console.log(`${ok ? 'ok   -' : 'FAIL -'} ${label}`);
  if (!ok) {
    failed = true;
    if (detail) console.log(`       ${String(detail).slice(0, 500)}`);
  }
}
console.log(`\n${checks.filter(([, ok]) => ok).length}/${checks.length} checks passed`);

await server.close();
process.exit(failed ? 1 : 0);
