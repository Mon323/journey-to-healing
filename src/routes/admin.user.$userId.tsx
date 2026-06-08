import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import {
  profiles, progress as progressApi, submissions, overts, goals, onLocalChange,
  type Profile, type Progress, type Submission, type Overt, type Goal,
} from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { STAGES, type StageKey } from "@/lib/stages";

export const Route = createFileRoute("/admin/user/$userId")({
  component: () => <ProtectedShell requireAdmin><Page /></ProtectedShell>,
});

function Page() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [overtList, setOvertList] = useState<Overt[]>([]);
  const [goalList, setGoalList] = useState<Goal[]>([]);

  const load = () => {
    setProfile(profiles.get(userId));
    setProgress(progressApi.get(userId));
    setSubs(submissions.list(userId));
    setOvertList(overts.list(userId));
    setGoalList(goals.list(userId));
  };
  useEffect(() => {
    load();
    return onLocalChange(load);
  }, [userId]);

  const updateSub = (id: string, status: "approved" | "rejected", feedback: string) => {
    submissions.update(id, { status, admin_feedback: feedback || null });
    toast.success("Updated.");
  };
  const updateOvert = (id: string, status: "approved" | "rejected", feedback: string) => {
    overts.update(id, { status, admin_feedback: feedback || null });
    toast.success("Updated.");
  };
  const updateGoal = (id: string, status: "approved" | "rejected", feedback: string) => {
    goals.update(id, { status, admin_feedback: feedback || null });
    toast.success("Updated.");
  };
  const advance = (stage: string) => {
    progressApi.set(userId, stage as StageKey);
    toast.success("Stage updated.");
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
          {overtList.map((o) => <ReviewCard key={o.id} title={o.title} body={o.what_happened} status={o.status} feedback={o.admin_feedback}
            onUpdate={(st, fb) => updateOvert(o.id, st, fb)} />)}
          {!overtList.length && <p className="text-sm text-muted-foreground">None yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-2xl">Goals</h2>
        <div className="space-y-3">
          {goalList.map((g) => <ReviewCard key={g.id} title={g.goal_text} body={null} status={g.status} feedback={g.admin_feedback}
            onUpdate={(st, fb) => updateGoal(g.id, st, fb)} />)}
          {!goalList.length && <p className="text-sm text-muted-foreground">None yet.</p>}
        </div>
      </section>
    </div>
  );
}

function SubmissionCard({ sub, onUpdate }: { sub: Submission; onUpdate: (id: string, st: "approved" | "rejected", fb: string) => void }) {
  const [feedback, setFeedback] = useState(sub.admin_feedback || "");
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
        {sub.audio_path && <audio controls src={sub.audio_path} className="w-full" />}
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
