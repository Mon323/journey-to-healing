import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Sub = {
  id: string;
  question_index: number;
  question_text: string | null;
  text_answer: string | null;
  audio_path: string | null;
  status: "pending" | "approved" | "rejected";
  admin_feedback: string | null;
};

export function StageSubmissionList({ stage }: { stage: string }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Sub[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("stage_submissions")
      .select("id, question_index, question_text, text_answer, audio_path, status, admin_feedback")
      .eq("user_id", user.id)
      .eq("stage", stage)
      .order("created_at", { ascending: true })
      .then(({ data }) => setItems((data as Sub[]) || []));
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
