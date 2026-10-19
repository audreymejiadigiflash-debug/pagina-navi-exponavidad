"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { NavCategory } from "@/lib/navigation";

/*
 * Mega menu: opens on hover or keyboard focus. Closes on Escape, on pointer leave
 * and after navigating, so a panel never stays stuck open on the next page.
 */
export function DesktopNav({ navigation }: { navigation: NavCategory[] }) {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const [lastPathname, setLastPathname] = useState(pathname);
  const closeTimer = useRef<number | undefined>(undefined);
  const navRef = useRef<HTMLElement>(null);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpenId(null);
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !navRef.current?.contains(document.activeElement)) return;
      const trigger = navRef.current.querySelector<HTMLAnchorElement>(`[data-nav-trigger="${openId}"]`);
      setOpenId(null);
      trigger?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openId]);

  const open = (id: string) => {
    window.clearTimeout(closeTimer.current);
    setOpenId(id);
  };
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenId(null), 120);
  };

  return (
    <nav ref={navRef} aria-label="Categorías" className="hidden border-t border-line lg:block" onMouseLeave={scheduleClose}>
      <ul className="container-page flex items-center justify-center gap-1">
        {navigation.map((item) => {
          const isOpen = openId === item.id;
          const active = pathname.startsWith(item.href);
          return (
            <li
              key={item.id}
              onMouseEnter={() => open(item.id)}
              onFocus={() => open(item.id)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleClose();
              }}
            >
              <Link
                href={item.href}
                data-nav-trigger={item.id}
                aria-expanded={isOpen}
                aria-current={active ? "page" : undefined}
                className={`label-caps relative inline-flex min-h-[52px] items-center px-5 text-[0.75rem] text-ink after:absolute after:inset-x-5 after:bottom-3 after:h-px after:origin-left after:bg-ink after:transition-transform after:duration-300 ${isOpen || active ? "after:scale-x-100" : "after:scale-x-0"}`}
              >
                {item.label}
              </Link>
              <div
                className={`absolute inset-x-0 top-full z-40 border-t border-line bg-white shadow-[0_24px_40px_-24px_rgba(28,28,26,0.25)] transition-opacity duration-200 ${isOpen ? "visible opacity-100" : "invisible opacity-0"}`}
              >
                <div className="container-page grid grid-cols-[1fr_1fr_1fr_minmax(0,1.3fr)] gap-10 py-10">
                  {item.columns.map((column) => (
                    <div key={column.title}>
                      <p className="eyebrow mb-4">{column.title}</p>
                      <ul className="space-y-2.5">
                        {column.links.map((link) => (
                          <li key={link.href}>
                            <Link href={link.href} className="text-[0.95rem] text-ink hover:underline hover:underline-offset-4">
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - item.columns.length) }, (_, index) => (
                    <div key={`spacer-${index}`} aria-hidden="true" />
                  ))}
                  <Link href={item.href} className="group/feature flex gap-6 no-underline">
                    {item.imageUrl ? (
                      <span className="relative block aspect-[4/5] w-40 shrink-0 overflow-hidden bg-ivory">
                        <Image
                          src={item.imageUrl}
                          alt=""
                          fill
                          sizes="160px"
                          className="object-cover transition-transform duration-700 group-hover/feature:scale-105"
                        />
                      </span>
                    ) : null}
                    <span className="flex flex-col justify-end">
                      <span className="font-serif text-2xl text-ink">{item.label}</span>
                      <span className="mt-2 text-sm text-ink-soft">{item.description}</span>
                      <span className="label-caps mt-4 text-[0.6875rem] text-ink underline underline-offset-4">
                        Descubrir
                      </span>
                    </span>
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
        <li>
          <Link
            href="/tienda?oferta=1"
            className="label-caps inline-flex min-h-[52px] items-center px-5 text-[0.75rem] text-claret"
          >
            Ofertas
          </Link>
        </li>
      </ul>
    </nav>
  );
}
