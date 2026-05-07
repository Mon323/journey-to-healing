import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { STAGES } from "@/lib/stages";

export const Route = createFileRoute("/admin/user/$userId")({
  component: () => <ProtectedShell requireAdmin><Page /></ProtectedShell>,
});

type Submission = {
  id: string; stage: string; question_index: number; question_text: string | null;
  text_answer: string | null; audio_path: string | null;
  status: "pending" | "approved" | "rejected"; admin_feedback: string | null; created_at: string;
};
type Overt = { id: string; title: string; what_happened: string | null; status: string; admin_feedback: string | null };
type Goal = { id: string; goal_text: string; status: string; admin_feedback: string | null };

function Page() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [overts, setOverts] = useState<Overt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const load = async () => {
    const [{ data: p }, { data: pr }, { data: s }, { data: o }, { data: g }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_progress").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("stage_submissions").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("overts").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("goals").select("*").eq("user_id", userId).order("created_at"),
    ]);
    setProfile(p); setProgress(pr); setSubs((s as Submission[]) || []);
    setOverts((o as Overt[]) || []); setGoals((g as Goal[]) || []);
  };
  useEffect(() => { load(); }, [userId]);

  const updateSub = async (id: string, status: "approved" | "rejected", feedback: string) => {
    const { error } = await supabase.from("stage_submissions").update({ status, admin_feedback: feedback || null }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated.");
    load();
  };
  const updateOvert = async (id: string, status: "approved" | "rejected", feedback: string) => {
    await supabase.from("overts").update({ status, admin_feedback: feedback || null }).eq("id", id);
    toast.success("Updated."); load();
  };
  const updateGoal = async (id: string, status: "approved" | "rejected", feedback: string) => {
    await supabase.from("goals").update({ status, admin_feedback: feedback || null }).eq("id", id);
    toast.success("Updated."); load();
  };
  const advance = async (stage: string) => {
    await supabase.from("user_progress").update({ current_stage: stage as any }).eq("user_id", userId);
    toast.success("Stage updated."); load();
  };

  return (
    <div className="space-y-8">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to admin
      </Link>
      <div>
        <h1 className="font-serif text-4xl">{profile?.full_name || "User"}</h1>
        <p className="text-muted-foreground">{profile?.email}</p>
        <div className="mt-3 flex items-center gap-3">
          <Badge>{profile?.account_status}</Badge>
          {progress && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current stage:</span>
              <Select value={progress.current_stage} onValueChange={advance}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-serif text-2xl">Submissions</h2>
        <div className="space-y-3">
          {subs.map((s) => <SubmissionCard key={s.id} sub={s} onUpdate={updateSub} />)}
          {!subs.length && <p className="text-sm text-muted-foreground">No submissions yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-2xl">Overts</h2>
        <div className="space-y-3">
          {overts.map((o) => <ReviewCard key={o.id} title={o.title} body={o.what_happened} status={o.status} feedback={o.admin_feedback}
            onUpdate={(st, fb) => updateOvert(o.id, st, fb)} />)}
          {!overts.length && <p className="text-sm text-muted-foreground">None yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-2xl">Goals</h2>
        <div className="space-y-3">
          {goals.map((g) => <ReviewCard key={g.id} title={g.goal_text} body={null} status={g.status} feedback={g.admin_feedback}
            onUpdate={(st, fb) => updateGoal(g.id, st, fb)} />)}
          {!goals.length && <p className="text-sm text-muted-foreground">None yet.</p>}
        </div>
      </section>
    </div>
  );
}

function SubmissionCard({ sub, onUpdate }: { sub: Submission; onUpdate: (id: string, st: "approved" | "rejected", fb: string) => void }) {
  const [feedback, setFeedback] = useState(sub.admin_feedback || "");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!sub.audio_path) return;
    supabase.storage.from("recordings").createSignedUrl(sub.audio_path, 3600)
      .then(({ data }) => data && setAudioUrl(data.signedUrl));
  }, [sub.audio_path]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>{sub.stage} · {sub.question_text || `#${sub.question_index + 1}`}</span>
          <Badge variant={sub.status === "approved" ? "default" : sub.status === "rejected" ? "destructive" : "secondary"}>{sub.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sub.text_answer && <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{sub.text_answer}</p>}
        {audioUrl && <audio controls src={audioUrl} className="w-full" />}
        <Textarea placeholder="Feedback (e.g. 'redo question 3 — say more about…')" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onUpdate(sub.id, "approved", feedback)}>Approve</Button>
          <Button size="sm" variant="destructive" onClick={() => onUpdate(sub.id, "rejected", feedback)}>Send back</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewCard({ title, body, status, feedback: initial, onUpdate }: {
  title: string; body: string | null; status: string; feedback: string | null;
  onUpdate: (st: "approved" | "rejected", fb: string) => void;
}) {
  const [fb, setFb] = useState(initial || "");
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <p className="font-medium">{title}</p>
          <Badge variant={status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"}>{status}</Badge>
        </div>
        {body && <p className="text-sm text-muted-foreground">{body}</p>}
        <Textarea value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Feedback…" />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onUpdate("approved", fb)}>Approve</Button>
          <Button size="sm" variant="destructive" onClick={() => onUpdate("rejected", fb)}>Send back</Button>
        </div>
      </CardContent>
    </Card>
  );
}
