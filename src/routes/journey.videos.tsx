import { createFileRoute } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/journey/videos")({
  component: () => <ProtectedShell><Page /></ProtectedShell>,
});

// Placeholder content — replace with real videos later
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
    supabase.from("stage_submissions").select("question_text, status")
      .eq("user_id", user.id).eq("stage", "training_videos")
      .then(({ data }) => setWatched(new Set((data || []).filter(d => d.status !== "rejected").map(d => d.question_text!))));
  }, [user]);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    const rows = VIDEOS.filter(v => watched.has(v.id)).map((v, i) => ({
      user_id: user.id, stage: "training_videos" as const, question_index: i,
      question_text: v.id, text_answer: `Watched: ${v.title}`,
    }));
    if (rows.length !== VIDEOS.length) { setBusy(false); return toast.error("Mark all videos as watched."); }
    const { error } = await supabase.from("stage_submissions").upsert(rows as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    await supabase.from("user_progress").update({ current_stage: "audio_lessons" }).eq("user_id", user.id);
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
