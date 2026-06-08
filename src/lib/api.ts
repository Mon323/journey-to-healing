// =====================================================================
// Local frontend-only data layer (replaces backend).
// Persists to localStorage. Swap this file with real API calls to
// your own MariaDB/Node API later — keep the same exported functions.
// =====================================================================

import type { StageKey } from "./stages";

export type AccountStatus = "pending" | "approved" | "rejected";
export type ReviewStatus = "pending" | "approved" | "rejected";

export type User = { id: string; email: string };
export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  account_status: AccountStatus;
  created_at: string;
};
export type Progress = { user_id: string; current_stage: StageKey };
export type Submission = {
  id: string;
  user_id: string;
  stage: StageKey;
  question_index: number;
  question_text: string | null;
  text_answer: string | null;
  audio_path: string | null; // blob: URL (in-memory only)
  status: ReviewStatus;
  admin_feedback: string | null;
  created_at: string;
};
export type Overt = {
  id: string;
  user_id: string;
  title: string;
  what_happened: string | null;
  who_involved: string | null;
  emotions: string | null;
  status: ReviewStatus;
  admin_feedback: string | null;
  created_at: string;
};
export type Goal = {
  id: string;
  user_id: string;
  goal_text: string;
  why_text: string | null;
  how_text: string | null;
  by_when: string | null;
  status: ReviewStatus;
  admin_feedback: string | null;
  created_at: string;
};
export type Gratitude = { id: string; user_id: string; content: string; created_at: string };

type Credentials = { email: string; password: string };
type StoredAccount = Credentials & { id: string };

type DB = {
  accounts: StoredAccount[];
  profiles: Profile[];
  admins: string[]; // user ids
  progress: Progress[];
  submissions: Submission[];
  overts: Overt[];
  goals: Goal[];
  gratitude: Gratitude[];
  session: { userId: string } | null;
};

const KEY = "inner_path_db_v1";

const empty = (): DB => ({
  accounts: [],
  profiles: [],
  admins: [],
  progress: [],
  submissions: [],
  overts: [],
  goals: [],
  gratitude: [],
  session: null,
});

function load(): DB {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

function save(db: DB) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event("local-api-change"));
}

const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36));

// ----------------------- Auth -----------------------

export const auth = {
  getUser(): User | null {
    const db = load();
    if (!db.session) return null;
    const acc = db.accounts.find((a) => a.id === db.session!.userId);
    return acc ? { id: acc.id, email: acc.email } : null;
  },
  signUp({ email, password, full_name }: Credentials & { full_name: string }) {
    const db = load();
    const e = email.trim().toLowerCase();
    if (db.accounts.some((a) => a.email === e)) {
      throw new Error("An account with that email already exists.");
    }
    const id = uid();
    db.accounts.push({ id, email: e, password });
    const isFirst = db.profiles.length === 0;
    db.profiles.push({
      id,
      email: e,
      full_name,
      account_status: isFirst ? "approved" : "pending",
      created_at: new Date().toISOString(),
    });
    db.progress.push({ user_id: id, current_stage: isFirst ? "training_videos" : "account_approval" });
    if (isFirst) db.admins.push(id); // first user becomes admin
    db.session = { userId: id };
    save(db);
    return { id, email: e };
  },
  signIn({ email, password }: Credentials) {
    const db = load();
    const e = email.trim().toLowerCase();
    const acc = db.accounts.find((a) => a.email === e && a.password === password);
    if (!acc) throw new Error("Invalid email or password.");
    db.session = { userId: acc.id };
    save(db);
    return { id: acc.id, email: acc.email };
  },
  signOut() {
    const db = load();
    db.session = null;
    save(db);
  },
  isAdmin(userId: string) {
    return load().admins.includes(userId);
  },
};

// ----------------------- Profiles / Users -----------------------

export const profiles = {
  get(userId: string): Profile | null {
    return load().profiles.find((p) => p.id === userId) ?? null;
  },
  list(): Profile[] {
    return [...load().profiles].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  setStatus(userId: string, status: AccountStatus) {
    const db = load();
    const p = db.profiles.find((x) => x.id === userId);
    if (p) p.account_status = status;
    if (status === "approved") {
      const pr = db.progress.find((x) => x.user_id === userId);
      if (pr && pr.current_stage === "account_approval") pr.current_stage = "training_videos";
    }
    save(db);
  },
};

// ----------------------- Progress -----------------------

export const progress = {
  get(userId: string): Progress | null {
    return load().progress.find((p) => p.user_id === userId) ?? null;
  },
  set(userId: string, stage: StageKey) {
    const db = load();
    const pr = db.progress.find((p) => p.user_id === userId);
    if (pr) pr.current_stage = stage;
    else db.progress.push({ user_id: userId, current_stage: stage });
    save(db);
  },
};

// ----------------------- Submissions -----------------------

export const submissions = {
  list(userId: string, stage?: StageKey): Submission[] {
    return load()
      .submissions.filter((s) => s.user_id === userId && (!stage || s.stage === stage))
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  },
  listForUser(userId: string): Submission[] {
    return this.list(userId);
  },
  countPending(userId: string) {
    return load().submissions.filter((s) => s.user_id === userId && s.status === "pending").length;
  },
  insertMany(rows: Array<Omit<Submission, "id" | "status" | "admin_feedback" | "created_at">>) {
    const db = load();
    rows.forEach((r) => {
      db.submissions.push({
        ...r,
        id: uid(),
        status: "pending",
        admin_feedback: null,
        created_at: new Date().toISOString(),
      });
    });
    save(db);
  },
  upsertByQuestionText(rows: Array<Omit<Submission, "id" | "status" | "admin_feedback" | "created_at">>) {
    const db = load();
    rows.forEach((r) => {
      const existing = db.submissions.find(
        (s) => s.user_id === r.user_id && s.stage === r.stage && s.question_text === r.question_text,
      );
      if (existing) {
        Object.assign(existing, r, { status: "pending", admin_feedback: null });
      } else {
        db.submissions.push({
          ...r,
          id: uid(),
          status: "pending",
          admin_feedback: null,
          created_at: new Date().toISOString(),
        });
      }
    });
    save(db);
  },
  update(id: string, patch: Partial<Pick<Submission, "status" | "admin_feedback">>) {
    const db = load();
    const s = db.submissions.find((x) => x.id === id);
    if (s) Object.assign(s, patch);
    save(db);
  },
};

// ----------------------- Overts -----------------------

export const overts = {
  list(userId: string): Overt[] {
    return load()
      .overts.filter((o) => o.user_id === userId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  add(row: Omit<Overt, "id" | "status" | "admin_feedback" | "created_at">) {
    const db = load();
    db.overts.push({
      ...row,
      id: uid(),
      status: "pending",
      admin_feedback: null,
      created_at: new Date().toISOString(),
    });
    save(db);
  },
  update(id: string, patch: Partial<Pick<Overt, "status" | "admin_feedback">>) {
    const db = load();
    const o = db.overts.find((x) => x.id === id);
    if (o) Object.assign(o, patch);
    save(db);
  },
};

// ----------------------- Goals -----------------------

export const goals = {
  list(userId: string): Goal[] {
    return load()
      .goals.filter((g) => g.user_id === userId)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  },
  add(row: Omit<Goal, "id" | "status" | "admin_feedback" | "created_at">) {
    const db = load();
    db.goals.push({
      ...row,
      id: uid(),
      status: "pending",
      admin_feedback: null,
      created_at: new Date().toISOString(),
    });
    save(db);
  },
  update(id: string, patch: Partial<Pick<Goal, "status" | "admin_feedback">>) {
    const db = load();
    const g = db.goals.find((x) => x.id === id);
    if (g) Object.assign(g, patch);
    save(db);
  },
};

// ----------------------- Gratitude -----------------------

export const gratitude = {
  list(userId: string): Gratitude[] {
    return load()
      .gratitude.filter((e) => e.user_id === userId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  add(userId: string, content: string) {
    const db = load();
    db.gratitude.push({ id: uid(), user_id: userId, content, created_at: new Date().toISOString() });
    save(db);
  },
  remove(id: string) {
    const db = load();
    db.gratitude = db.gratitude.filter((e) => e.id !== id);
    save(db);
  },
};

// ----------------------- Audio (blob URLs, in-memory only) -----------------------

export const audioStore = {
  store(blob: Blob): string {
    return URL.createObjectURL(blob);
  },
};

// Listen for cross-tab / in-tab changes
export function onLocalChange(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("local-api-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("local-api-change", handler);
    window.removeEventListener("storage", handler);
  };
}
