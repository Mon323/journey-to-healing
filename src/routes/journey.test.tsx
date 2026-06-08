import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { submissions, progress as progressApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/journey/test")({
  component: () => <ProtectedShell><Page /></ProtectedShell>,
});

const QUESTIONS = [
  "In your own words, what was the main idea of the training?",
];

function Page() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [answers, setAnswers] = useState<string[]>(QUESTIONS.map(() => ""));
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!user) return;
    if (answers.some(a => a.trim().length < 10)) return toast.error("Please write at least 10 characters per answer.");
    setBusy(true);
    submissions.insertMany(QUESTIONS.map((q, i) => ({
      user_id: user.id, stage: "knowledge_test" as const, question_index: i,
      question_text: q, text_answer: answers[i], audio_path: null,
    })));
    progressApi.set(user.id, "voice_answers");
    setBusy(false);
    toast.success("Submitted for review.");
    nav({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wider text-primary">Stage 3</p>
        <h1 className="font-serif text-4xl">Reflection Test</h1>
        <p className="mt-2 text-muted-foreground">Take your time. Your guide will review each answer.</p>
      </div>
      {QUESTIONS.map((q, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 pt-6">
            <Label>{q}</Label>
            <Textarea rows={5} value={answers[i]} onChange={(e) => {
              const next = [...answers]; next[i] = e.target.value; setAnswers(next);
            }} />
          </CardContent>
        </Card>
      ))}
      <Button onClick={submit} disabled={busy} size="lg">Submit for review</Button>
    </div>
  );
}
