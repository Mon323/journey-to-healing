import { createFileRoute } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VoiceRecorder } from "@/components/voice-recorder";
import { StageSubmissionList } from "@/components/stage-submission-list";

export const Route = createFileRoute("/journey/voice")({
  component: () => <ProtectedShell><Page /></ProtectedShell>,
});

const QUESTIONS = [
  "Describe a moment this week when you felt most yourself.",
];

function Page() {
  const { user } = useAuth();
  const [blobs, setBlobs] = useState<(Blob | null)[]>(QUESTIONS.map(() => null));
  const [busy, setBusy] = useState(false);
  const [rejected, setRejected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase.from("stage_submissions").select("question_index, status")
      .eq("user_id", user.id).eq("stage", "voice_answers")
      .then(({ data }) => {
        setRejected(new Set((data || []).filter(d => d.status === "rejected").map(d => d.question_index)));
      });
  }, [user]);

  const submit = async (i: number) => {
    if (!user || !blobs[i]) return toast.error("Record your answer first.");
    setBusy(true);
    const path = `${user.id}/voice_${i}_${Date.now()}.webm`;
    const { error: upErr } = await supabase.storage.from("recordings").upload(path, blobs[i]!, { contentType: "audio/webm" });
    if (upErr) { setBusy(false); return toast.error(upErr.message); }
    const { error } = await supabase.from("stage_submissions").insert({
      user_id: user.id, stage: "voice_answers", question_index: i,
      question_text: QUESTIONS[i], audio_path: path,
    } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Recording submitted.");
    await supabase.from("user_progress").update({ current_stage: "overts" }).eq("user_id", user.id);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wider text-primary">Stage 4</p>
        <h1 className="font-serif text-4xl">Voice Answers</h1>
        <p className="mt-2 text-muted-foreground">Speak from the heart. You can re-record before submitting.</p>
      </div>
      {QUESTIONS.map((q, i) => (
        <Card key={i} className={rejected.has(i) ? "border-destructive/40" : ""}>
          <CardContent className="space-y-4 pt-6">
            <Label>{q}</Label>
            <VoiceRecorder onRecorded={(b) => setBlobs((p) => { const n = [...p]; n[i] = b; return n; })} />
            <Button onClick={() => submit(i)} disabled={busy}>Submit answer</Button>
          </CardContent>
        </Card>
      ))}
      <StageSubmissionList stage="voice_answers" />
    </div>
  );
}
