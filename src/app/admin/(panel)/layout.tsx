import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "../login/actions";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel NaviExpoNavidad" },
  robots: { index: false, follow: false },
};

function PanelLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando">
      <div className="h-10 w-64 animate-pulse bg-line" />
      <div className="h-40 animate-pulse bg-line/60" />
      <div className="h-40 animate-pulse bg-line/60" />
    </div>
  );
}

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-ivory lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-fir-deep text-white lg:sticky lg:top-0 lg:h-dvh">
        <div className="flex h-full flex-col gap-4 px-3 py-4 lg:py-8">
          <div className="flex items-center justify-between px-4 lg:block">
            <Link href="/admin" className="font-serif text-2xl">
              NaviExpo<span className="italic text-[#d9c08f]">Navidad</span>
            </Link>
            <p className="label-caps hidden text-[0.625rem] text-white/50 lg:mt-1 lg:block">Panel de administración</p>
          </div>
          <Suspense fallback={null}>
            <AdminNav />
          </Suspense>
          <div className="mt-auto hidden space-y-1 lg:block">
            <Link href="/" target="_blank" className="flex min-h-11 items-center px-4 text-[0.875rem] text-white/70 hover:text-white">
              Ver tienda ↗
            </Link>
            <form action={signOut}>
              <button type="submit" className="flex min-h-11 w-full items-center px-4 text-left text-[0.875rem] text-white/70 hover:text-white">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main id="contenido" className="min-w-0 px-4 py-8 md:px-10 lg:py-12">
        <Suspense fallback={<PanelLoading />}>{children}</Suspense>
        <form action={signOut} className="mt-12 lg:hidden">
          <button type="submit" className="label-caps link-underline text-[0.6875rem] text-ink-soft">
            Cerrar sesión
          </button>
        </form>
      </main>
    </div>
  );
}
