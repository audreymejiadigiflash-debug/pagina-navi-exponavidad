import Link from "next/link";
import { Suspense } from "react";
import { SearchIcon } from "@/components/icons";
import type { NavCategory } from "@/lib/navigation";
import { CartLink } from "./cart-link";
import { DesktopNav } from "./desktop-nav";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

type SiteHeaderProps = {
  navigation: NavCategory[];
  announcement: string;
};

function SearchForm({ id, className = "" }: { id: string; className?: string }) {
  return (
    <form action="/tienda" method="get" role="search" className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Buscar productos
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Buscar"
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 w-full border-0 border-b border-line-strong bg-transparent pl-8 pr-2 text-[0.95rem] placeholder:text-ink-soft focus-visible:border-ink focus-visible:outline-none"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute left-0 top-0 inline-flex h-11 w-7 items-center justify-start text-ink"
      >
        <SearchIcon size={18} />
      </button>
    </form>
  );
}

/* Static stand-in while the client nav (which reads the pathname) streams in. */
function NavFallback({ navigation }: { navigation: NavCategory[] }) {
  return (
    <nav aria-label="Categorías" className="hidden border-t border-line lg:block">
      <ul className="container-page flex items-center justify-center gap-1">
        {navigation.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="label-caps inline-flex min-h-[52px] items-center px-5 text-[0.75rem] text-ink">
              {item.label}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/tienda?oferta=1" className="label-caps inline-flex min-h-[52px] items-center px-5 text-[0.75rem] text-claret">
            Ofertas
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export function SiteHeader({ navigation, announcement }: SiteHeaderProps) {
  return (
    <>
      <a
        href="#contenido"
        className="label-caps absolute left-4 top-[-100px] z-[100] bg-ink px-4 py-3 text-[0.75rem] text-white focus:top-4"
      >
        Saltar al contenido
      </a>
      {announcement ? (
        <div className="bg-fir-deep px-4 py-2.5 text-center">
          <p className="label-caps text-[0.6875rem] text-white/90">{announcement}</p>
        </div>
      ) : null}
      <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur-sm">
        <div className="relative">
          <div className="container-page grid min-h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-4 md:min-h-[96px]">
            <div className="flex items-center gap-2">
              <Suspense fallback={<span className="block h-11 w-11 lg:hidden" aria-hidden="true" />}>
                <MobileMenu navigation={navigation} />
              </Suspense>
              <SearchForm id="search-desktop" className="hidden w-full max-w-[240px] lg:block" />
            </div>
            <Logo />
            <div className="flex items-center justify-end gap-2">
              <CartLink />
            </div>
          </div>
          <div className="container-page pb-3 lg:hidden">
            <SearchForm id="search-mobile" />
          </div>
          <Suspense fallback={<NavFallback navigation={navigation} />}>
            <DesktopNav navigation={navigation} />
          </Suspense>
        </div>
      </header>
    </>
  );
}
