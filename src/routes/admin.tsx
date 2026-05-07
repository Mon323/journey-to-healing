import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type UserRow = {
  id: string; full_name: string | null; email: string | null;
  account_status: "pending" | "approved" | "rejected";
};

export const Route = createFileRoute("/admin")({
  component: () => <ProtectedShell requireAdmin><Page /></ProtectedShell>,
});

function Page() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const load = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, email, account_status").order("created_at", { ascending: false });
    setUsers((data as UserRow[]) || []);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: UserRow["account_status"]) => {
    const { error } = await supabase.from("profiles").update({ account_status: status }).eq("id", id);
    if (error) return toast.error(error.message);
    if (status === "approved") {
      await supabase.from("user_progress").update({ current_stage: "training_videos" }).eq("user_id", id);
    }
    toast.success(`User ${status}.`);
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Admin</h1>
        <p className="text-muted-foreground">Approve users and review submissions.</p>
      </div>

      <section>
        <h2 className="mb-3 font-serif text-2xl">Users</h2>
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div>
                  <p className="font-medium">{u.full_name || "Unnamed"}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={u.account_status === "approved" ? "default" : u.account_status === "rejected" ? "destructive" : "secondary"}>
                    {u.account_status}
                  </Badge>
                  <Button asChild variant="outline" size="sm"><Link to="/admin/user/$userId" params={{ userId: u.id }}>Review</Link></Button>
                  {u.account_status !== "approved" && <Button size="sm" onClick={() => setStatus(u.id, "approved")}>Approve</Button>}
                  {u.account_status !== "rejected" && <Button size="sm" variant="ghost" onClick={() => setStatus(u.id, "rejected")}>Reject</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
          {!users.length && <p className="text-sm text-muted-foreground">No users yet.</p>}
        </div>
      </section>
    </div>
  );
}
