export type StageKey =
  | "account_approval"
  | "training_videos"
  | "audio_lessons"
  | "knowledge_test"
  | "voice_answers"
  | "overts"
  | "goals"
  | "gratitude"
  | "completed";

export const STAGES: { key: StageKey; label: string; description: string; path: string }[] = [
  { key: "account_approval", label: "Welcome", description: "Account approval by your guide", path: "/dashboard" },
  { key: "training_videos", label: "Training Videos", description: "Watch the introductory videos", path: "/journey/videos" },
  { key: "audio_lessons", label: "Audio Lessons", description: "Listen and absorb", path: "/journey/audio" },
  { key: "knowledge_test", label: "Reflection Test", description: "A short check-in", path: "/journey/test" },
  { key: "voice_answers", label: "Voice Answers", description: "Speak your responses", path: "/journey/voice" },
  { key: "overts", label: "Personal Overts", description: "Write what's on your heart", path: "/journey/overts" },
  { key: "goals", label: "Personal Goals", description: "Define your direction", path: "/journey/goals" },
  { key: "gratitude", label: "Gratitude", description: "List what you're thankful for", path: "/journey/gratitude" },
  { key: "completed", label: "Journey Complete", description: "You've arrived", path: "/dashboard" },
];

export const stageIndex = (k: StageKey) => STAGES.findIndex((s) => s.key === k);
