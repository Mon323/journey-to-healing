import { createFileRoute } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { gratitude, onLocalChange, type Gratitude } from "@/lib/api";
import { Heart, X } from "lucide-react";

export const Route = createFileRoute("/journey/gratitude")({
  component: () => <ProtectedShell><Page /></ProtectedShell>,
});

function Page() {
  const { user } = useAuth();
  const [list, setList] = useState<Gratitude[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!user) return;
    const sync = () => setList(gratitude.list(user.id));
    sync();
    return onLocalChange(sync);
  }, [user]);

  const add = () => {
    if (!user) return;
    if (text.trim().length < 2) return;
    gratitude.add(user.id, text.trim());
    setText("");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wider text-primary">Stage 7</p>
        <h1 className="font-serif text-4xl flex items-center gap-3"><Heart className="h-7 w-7 text-primary" /> Gratitude</h1>
        <p className="mt-2 text-muted-foreground">Add as many things as you like. There's no end — just keep going.</p>
      </div>
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Textarea rows={3} placeholder="I'm grateful for…" value={text} onChange={(e) => setText(e.target.value)} />
          <Button onClick={add}>Add to my gratitude list</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {list.map((e) => (
          <Card key={e.id}>
            <CardContent className="flex items-start justify-between gap-4 pt-6">
              <p className="text-sm">{e.content}</p>
              <button onClick={() => gratitude.remove(e.id)} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
