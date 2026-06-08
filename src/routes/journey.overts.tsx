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
import { overts, progress as progressApi, onLocalChange, type Overt } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/journey/overts")({
  component: () => <ProtectedShell><Page /></ProtectedShell>,
});

function Page() {
  const { user } = useAuth();
  const [list, setList] = useState<Overt[]>([]);
  const [form, setForm] = useState({ title: "", what_happened: "", who_involved: "", emotions: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const sync = () => setList(overts.list(user.id));
    sync();
    return onLocalChange(sync);
  }, [user]);

  const add = () => {
    if (!user) return;
    if (form.title.trim().length < 2) return toast.error("Give it a short title.");
    setBusy(true);
    overts.add({ user_id: user.id, ...form });
    setBusy(false);
    setForm({ title: "", what_happened: "", who_involved: "", emotions: "" });
    toast.success("Submitted for review.");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wider text-primary">Stage 5</p>
        <h1 className="font-serif text-4xl">Personal Overts</h1>
        <p className="mt-2 text-muted-foreground">Add each one separately. Your guide reviews them one at a time.</p>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>What happened?</Label><Textarea rows={4} value={form.what_happened} onChange={(e) => setForm({ ...form, what_happened: e.target.value })} /></div>
          <div><Label>Who was involved?</Label><Input value={form.who_involved} onChange={(e) => setForm({ ...form, who_involved: e.target.value })} /></div>
          <div><Label>Emotions you felt</Label><Input value={form.emotions} onChange={(e) => setForm({ ...form, emotions: e.target.value })} /></div>
          <Button onClick={add} disabled={busy}>Submit overt</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {list.map((o) => (
          <Card key={o.id}>
            <CardContent className="space-y-2 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg">{o.title}</h3>
                <Badge variant={o.status === "approved" ? "default" : o.status === "rejected" ? "destructive" : "secondary"}>{o.status}</Badge>
              </div>
              {o.what_happened && <p className="text-sm text-muted-foreground">{o.what_happened}</p>}
              {o.admin_feedback && <p className="rounded-md border-l-4 border-warning bg-warning/10 p-2 text-sm"><strong>Guide:</strong> {o.admin_feedback}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={() => {
        if (!user) return;
        progressApi.set(user.id, "goals");
        window.location.href = "/journey/goals";
      }}>I'm done with overts — continue to goals</Button>
    </div>
  );
}
