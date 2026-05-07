import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Leaf, LogOut } from "lucide-react";

export function AppHeader() {
  const { user, profile, isAdmin, signOut } = useAuth();
  return (
    <header className="border-b border-border bg-card/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="font-serif text-xl">Inner Path</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/dashboard" className="rounded-md px-3 py-1.5 text-sm hover:bg-secondary">
                Dashboard
              </Link>
              {isAdmin && (
                <Link to="/admin" className="rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary">
                  Admin
                </Link>
              )}
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {profile?.full_name || user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth" className="rounded-md px-3 py-1.5 text-sm hover:bg-secondary">Sign in</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
