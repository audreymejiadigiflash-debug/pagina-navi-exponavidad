"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Panel">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center whitespace-nowrap px-4 text-[0.925rem] ${active ? "bg-white/10 text-white" : "text-white/70 hover:text-white"}`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
