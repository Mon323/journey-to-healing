import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { progress as progressApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/journey/audio")({
  component: () => <ProtectedShell><Page /></ProtectedShell>,
});

const LESSONS = [
  { id: "a1", title: "Lesson 1: Grounding", url: "" },
];

function Page() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [done, setDone] = useState<Set<string>>(new Set());
  const submit = () => {
    if (!user) return;
    if (done.size !== LESSONS.length) return toast.error("Listen to each lesson first.");
    progressApi.set(user.id, "knowledge_test");
    toast.success("Saved.");
    nav({ to: "/journey/test" });
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wider text-primary">Stage 2</p>
        <h1 className="font-serif text-4xl">Audio Lessons</h1>
        <p className="mt-2 text-muted-foreground">Find a quiet space. Listen with intention.</p>
      </div>
      {LESSONS.map((l) => (
        <Card key={l.id}>
          <CardHeader><CardTitle>{l.title}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {l.url ? <audio controls src={l.url} className="w-full" /> :
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Audio file will be added by your guide.</p>}
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={done.has(l.id)} onCheckedChange={(c) => setDone((p) => {
                const n = new Set(p); if (c) n.add(l.id); else n.delete(l.id); return n;
              })} />
              I've listened
            </label>
          </CardContent>
        </Card>
      ))}
      <Button onClick={submit} size="lg">Continue to reflection test</Button>
    </div>
  );
}
