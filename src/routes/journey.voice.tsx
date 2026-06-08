import { createFileRoute } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { submissions, progress as progressApi, audioStore, onLocalChange } from "@/lib/api";
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
    const sync = () => {
      const items = submissions.list(user.id, "voice_answers");
      setRejected(new Set(items.filter(d => d.status === "rejected").map(d => d.question_index)));
    };
    sync();
    return onLocalChange(sync);
  }, [user]);

  const submit = (i: number) => {
    if (!user || !blobs[i]) return toast.error("Record your answer first.");
    setBusy(true);
    const audioPath = audioStore.store(blobs[i]!);
    submissions.insertMany([{
      user_id: user.id, stage: "voice_answers", question_index: i,
      question_text: QUESTIONS[i], text_answer: null, audio_path: audioPath,
    }]);
    progressApi.set(user.id, "overts");
    setBusy(false);
    toast.success("Recording submitted.");
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
