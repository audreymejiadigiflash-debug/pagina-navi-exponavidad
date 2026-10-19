"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, CloseIcon, MenuIcon } from "@/components/icons";
import type { NavCategory } from "@/lib/navigation";
import { NavigationProgress } from "./navigation-progress";
import { useMenuNavigation } from "./use-menu-navigation";

export function MobileMenu({ navigation }: { navigation: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Filter links keep the same pathname (only ?color=… changes), so closing on route
  // change alone would leave the drawer covering the results.
  const { isNavigating, handleClickCapture } = useMenuNavigation(() => setOpen(false));

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // A native <dialog> gives us focus trapping, Escape to close and focus return for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <NavigationProgress active={isNavigating} className="fixed inset-x-0 top-0 lg:hidden" />
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center text-ink lg:hidden"
        aria-label="Abrir menú"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
      >
        <MenuIcon size={24} />
      </button>
      <dialog
        id="mobile-menu"
        ref={dialogRef}
        aria-label="Menú"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className="m-0 h-full max-h-none w-[min(380px,88vw)] max-w-none bg-white p-0 backdrop:bg-ink/40 open:animate-fade-up"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="font-serif text-xl">Menú</span>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
            >
              <CloseIcon size={22} />
            </button>
          </div>
          <nav aria-label="Categorías" className="flex-1 overflow-y-auto px-5 py-2" onClickCapture={handleClickCapture}>
            <ul>
              {navigation.map((item) => {
                const isExpanded = expanded === item.id;
                return (
                  <li key={item.id} className="border-b border-line">
                    <div className="flex items-center justify-between">
                      <Link href={item.href} className="flex min-h-14 flex-1 items-center font-serif text-xl">
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center"
                        aria-expanded={isExpanded}
                        aria-controls={`mobile-sub-${item.id}`}
                        aria-label={`${isExpanded ? "Ocultar" : "Mostrar"} opciones de ${item.label}`}
                        onClick={() => setExpanded(isExpanded ? null : item.id)}
                      >
                        <ChevronDownIcon className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                    <div id={`mobile-sub-${item.id}`} hidden={!isExpanded} className="pb-4">
                      {item.columns.map((column) => (
                        <div key={column.title} className="mt-3">
                          <p className="eyebrow mb-1">{column.title}</p>
                          <ul>
                            {column.links.map((link) => (
                              <li key={link.href}>
                                <Link href={link.href} className="flex min-h-10 items-center gap-2 text-[0.95rem] text-ink-soft">
                                  {link.label}
                                  {link.count !== undefined ? (
                                    <span className="text-[0.8125rem]">
                                      ({link.count}
                                      <span className="sr-only">{link.count === 1 ? " pieza" : " piezas"}</span>)
                                    </span>
                                  ) : null}
                                </Link>
                              </li>
                            ))}
                          </ul>
                          {column.more ? (
                            <Link href={column.more.href} className="flex min-h-10 items-center text-[0.875rem] text-ink underline underline-offset-4">
                              {column.more.label}
                            </Link>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
              <li className="border-b border-line">
                <Link href="/tienda?oferta=1" className="flex min-h-14 items-center font-serif text-xl text-claret">
                  Ofertas
                </Link>
              </li>
              <li>
                <Link href="/tienda" className="flex min-h-14 items-center font-serif text-xl">
                  Toda la tienda
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </dialog>
    </>
  );
}
