import { logout } from "@/app/actions";
import { GmNav } from "@/components/GmNav";

// Every page here reads live, per-request data (habit checks, session role) —
// never let Next statically prerender it at build time.
export const dynamic = "force-dynamic";

export default function GmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-kudos-ink/10 bg-kudos-card px-4 py-3">
        <GmNav />
        <form action={logout}>
          <button type="submit" className="text-sm text-kudos-ink/50">
            Log out
          </button>
        </form>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
