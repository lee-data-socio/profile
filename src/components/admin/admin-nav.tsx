"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="관리자 메뉴" className="overflow-x-auto px-2 pb-3 md:pb-0">
      <ul className="flex gap-1 md:flex-col">
        {links.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                  active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-line/50 hover:text-fg"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
