import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProtectedShell } from "@/components/protected-shell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { STAGES, stageIndex, type StageKey } from "@/lib/stages";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, Lock } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: () => <ProtectedShell><Dashboard /></ProtectedShell>,
});

function Dashboard() {
  const { profile, user } = useAuth();
  const [stage, setStage] = useState<StageKey>("account_approval");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_progress").select("current_stage").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => data && setStage(data.current_stage));
    supabase.from("stage_submissions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending")
      .then(({ count }) => setPendingCount(count || 0));
  }, [user]);

  const isPending = profile?.account_status === "pending";
  const idx = stageIndex(stage);
  const total = STAGES.length - 1;
  const pct = Math.round((idx / total) * 100);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="font-serif text-4xl">{profile?.full_name || "Friend"}</h1>
      </div>

      {isPending && (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="flex items-start gap-4 pt-6">
            <Clock className="mt-1 h-5 w-5 text-warning-foreground" />
            <div>
              <h3 className="font-semibold">Awaiting approval</h3>
              <p className="text-sm text-muted-foreground">
                Your guide will review your account shortly. You'll be able to begin once approved.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-[var(--shadow-soft)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-serif text-2xl">Your journey</CardTitle>
              <CardDescription>Step {idx + 1} of {STAGES.length}</CardDescription>
            </div>
            {pendingCount > 0 && <Badge variant="secondary">{pendingCount} awaiting review</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={pct} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">{pct}% complete</p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {STAGES.filter((s) => s.key !== "account_approval").map((s, i) => {
          const sIdx = stageIndex(s.key);
          const status =
            profile?.account_status !== "approved" ? "locked"
            : sIdx < idx ? "done"
            : sIdx === idx ? "current"
            : "locked";
          return (
            <Card
              key={s.key}
              className={status === "current" ? "border-primary shadow-[var(--shadow-soft)]" : ""}
            >
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <div className="flex items-start gap-4">
                  {status === "done" ? <CheckCircle2 className="h-6 w-6 text-success" />
                    : status === "current" ? <Circle className="h-6 w-6 text-primary" />
                    : <Lock className="h-6 w-6 text-muted-foreground" />}
                  <div>
                    <h3 className="font-serif text-xl">{s.label}</h3>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </div>
                </div>
                {status === "current" && (
                  <Button asChild><Link to={s.path}>Continue</Link></Button>
                )}
                {status === "done" && <Badge variant="outline">Approved</Badge>}
                {status === "locked" && <Badge variant="secondary">Locked</Badge>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
