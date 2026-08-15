"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/gm", label: "Checkoff" },
  { href: "/gm/week", label: "Huddle" },
] as const;

export function GmNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1" aria-label="Gamemaster sections">
      {tabs.map((tab) => {
        const active =
          tab.href === "/gm"
            ? !pathname.startsWith("/gm/week")
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
              active
                ? "bg-kudos-purple-light text-kudos-purple-dark"
                : "text-kudos-ink/65 hover:bg-kudos-purple-light/50 hover:text-kudos-purple-dark"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
