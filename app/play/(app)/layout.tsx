import Link from "next/link";
import { logout } from "@/app/actions";

// Every page here reads live, per-request data — never let Next statically
// prerender it at build time.
export const dynamic = "force-dynamic";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-kudos-ink/10 bg-kudos-card px-6 py-4">
        <Link
          href="/play"
          aria-label="Home — family player board"
          className="text-base font-bold text-kudos-ink transition-colors hover:text-kudos-purple-dark"
        >
          Home
        </Link>
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
