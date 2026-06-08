import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { submissions, onLocalChange, type Submission } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { StageKey } from "@/lib/stages";

export function StageSubmissionList({ stage }: { stage: StageKey }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Submission[]>([]);

  useEffect(() => {
    if (!user) return;
    const sync = () => setItems(submissions.list(user.id, stage));
    sync();
    return onLocalChange(sync);
  }, [user, stage]);

  if (!items.length) return null;

  return (
    <div className="mt-8 space-y-3">
      <h3 className="font-serif text-xl">Your submissions</h3>
      {items.map((s) => (
        <Card key={s.id}>
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{s.question_text || `Submission ${s.question_index + 1}`}</p>
              <Badge variant={s.status === "approved" ? "default" : s.status === "rejected" ? "destructive" : "secondary"}>
                {s.status}
              </Badge>
            </div>
            {s.text_answer && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.text_answer}</p>}
            {s.admin_feedback && (
              <p className="rounded-md border-l-4 border-warning bg-warning/10 p-2 text-sm">
                <strong>Guide note:</strong> {s.admin_feedback}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
