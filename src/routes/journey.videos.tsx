import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { submissions, progress as progressApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/journey/videos")({
  component: () => <ProtectedShell><Page /></ProtectedShell>,
});

const VIDEOS = [
  { id: "v1", title: "Introduction", url: "https://www.youtube.com/embed/inpok4MKVLM" },
];

function Page() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const prev = submissions.list(user.id, "training_videos")
      .filter(d => d.status !== "rejected" && d.question_text)
      .map(d => d.question_text!);
    setWatched(new Set(prev));
  }, [user]);

  const submit = () => {
    if (!user) return;
    setBusy(true);
    const rows = VIDEOS.filter(v => watched.has(v.id)).map((v, i) => ({
      user_id: user.id, stage: "training_videos" as const, question_index: i,
      question_text: v.id, text_answer: `Watched: ${v.title}`, audio_path: null,
    }));
    if (rows.length !== VIDEOS.length) { setBusy(false); return toast.error("Mark all videos as watched."); }
    submissions.upsertByQuestionText(rows);
    progressApi.set(user.id, "audio_lessons");
    setBusy(false);
    toast.success("Progress saved.");
    nav({ to: "/journey/audio" });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wider text-primary">Stage 1</p>
        <h1 className="font-serif text-4xl">Training Videos</h1>
        <p className="mt-2 text-muted-foreground">Watch each video, then mark it as complete.</p>
      </div>
      {VIDEOS.map((v) => (
        <Card key={v.id}>
          <CardHeader><CardTitle>{v.title}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <iframe src={v.url} title={v.title} className="h-full w-full" allow="encrypted-media" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={watched.has(v.id)}
                onCheckedChange={(c) => setWatched((prev) => {
                  const n = new Set(prev); if (c) n.add(v.id); else n.delete(v.id); return n;
                })}
              />
              I've finished watching
            </label>
          </CardContent>
        </Card>
      ))}
      <Button onClick={submit} disabled={busy} size="lg">Continue to audio lessons</Button>
    </div>
  );
}
