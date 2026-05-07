import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Heart, Leaf, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-calm)" }}
      >
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-primary">
            A guided counseling journey
          </p>
          <h1 className="font-serif text-5xl leading-tight text-foreground sm:text-6xl">
            Healing, one gentle step at a time
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            A structured path through reflection, voice, and gratitude — guided personally by your counselor at every stage.
          </p>
          <div className="mt-10 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Begin your journey</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">I have an account</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-20 sm:grid-cols-3">
        {[
          { icon: Leaf, title: "Step by step", text: "Each stage opens only when you're ready." },
          { icon: ShieldCheck, title: "Personal guidance", text: "Your counselor reviews and approves every step." },
          { icon: Heart, title: "Gentle pace", text: "Redo what needs work — never start over." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-serif text-xl">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
