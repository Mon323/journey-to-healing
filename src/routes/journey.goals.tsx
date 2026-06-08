import { createFileRoute } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { goals, progress as progressApi, onLocalChange, type Goal } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/journey/goals")({
  component: () => <ProtectedShell><Page /></ProtectedShell>,
});

function Page() {
  const { user } = useAuth();
  const [list, setList] = useState<Goal[]>([]);
  const [form, setForm] = useState({ goal_text: "", why_text: "", how_text: "", by_when: "" });

  useEffect(() => {
    if (!user) return;
    const sync = () => setList(goals.list(user.id));
    sync();
    return onLocalChange(sync);
  }, [user]);

  const add = () => {
    if (!user) return;
    if (form.goal_text.trim().length < 3) return toast.error("Write your goal.");
    goals.add({ user_id: user.id, ...form, by_when: form.by_when || null });
    setForm({ goal_text: "", why_text: "", how_text: "", by_when: "" });
    toast.success("Goal submitted.");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wider text-primary">Stage 6</p>
        <h1 className="font-serif text-4xl">Personal Goals</h1>
        <p className="mt-2 text-muted-foreground">Use the structure: <em>What. Why. How. By when.</em></p>
      </div>
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div><Label>Goal</Label><Input value={form.goal_text} onChange={(e) => setForm({ ...form, goal_text: e.target.value })} /></div>
          <div><Label>Why this matters</Label><Textarea rows={3} value={form.why_text} onChange={(e) => setForm({ ...form, why_text: e.target.value })} /></div>
          <div><Label>How you'll do it</Label><Textarea rows={3} value={form.how_text} onChange={(e) => setForm({ ...form, how_text: e.target.value })} /></div>
          <div><Label>By when</Label><Input type="date" value={form.by_when} onChange={(e) => setForm({ ...form, by_when: e.target.value })} /></div>
          <Button onClick={add}>Submit goal</Button>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {list.map((g) => (
          <Card key={g.id}>
            <CardContent className="space-y-2 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg">{g.goal_text}</h3>
                <Badge variant={g.status === "approved" ? "default" : g.status === "rejected" ? "destructive" : "secondary"}>{g.status}</Badge>
              </div>
              {g.why_text && <p className="text-sm"><strong>Why:</strong> {g.why_text}</p>}
              {g.how_text && <p className="text-sm"><strong>How:</strong> {g.how_text}</p>}
              {g.by_when && <p className="text-sm text-muted-foreground">By {g.by_when}</p>}
              {g.admin_feedback && <p className="rounded-md border-l-4 border-warning bg-warning/10 p-2 text-sm"><strong>Guide:</strong> {g.admin_feedback}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <Button variant="outline" onClick={() => {
        if (!user) return;
        progressApi.set(user.id, "gratitude");
        window.location.href = "/journey/gratitude";
      }}>Continue to gratitude</Button>
    </div>
  );
}
