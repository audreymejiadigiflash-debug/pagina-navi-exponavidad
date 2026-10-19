import Link from "next/link";

/* Brand mark ("árbol-pabellón"): three pavilion roofs stacked into a tree, with a star on top. */
function TreeMark({ light, className }: { light: boolean; className: string }) {
  // On the dark footer the original greens disappear, so the tiers step up one shade.
  const tiers = light ? ["#2B8458", "#35A06A", "#46B87C"] : ["#1F5C3A", "#24704A", "#2B8458"];
  return (
    <svg viewBox="14 6 122 139" className={className} aria-hidden="true" focusable="false">
      <polygon points="75,8 82,22 97,22 85,31 89,45 75,37 61,45 65,31 53,22 68,22" fill="#C9A227" />
      <polygon points="75,40 110,72 40,72" fill={tiers[0]} />
      <rect x="44" y="72" width="62" height="4" fill="#B3282D" />
      <polygon points="75,64 122,104 28,104" fill={tiers[1]} />
      <rect x="32" y="104" width="86" height="4" fill="#B3282D" />
      <polygon points="75,96 134,138 16,138" fill={tiers[2]} />
      <rect x="20" y="138" width="110" height="5" fill="#B3282D" />
    </svg>
  );
}

export function Logo({ tone = "dark", compact = false }: { tone?: "dark" | "light"; compact?: boolean }) {
  const light = tone === "light";
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 leading-none no-underline md:gap-3"
      aria-label="NaviExpo Navidad, ir al inicio"
    >
      <TreeMark light={light} className={compact ? "h-11 w-auto" : "h-11 w-auto md:h-14"} />
      <span className="flex flex-col items-center font-logo">
        <span
          className={`font-extrabold tracking-[-0.02em] ${compact ? "text-[1.6rem]" : "text-[1.55rem] md:text-[2rem]"} ${light ? "text-white" : "text-[#1F5C3A]"}`}
        >
          Navi<span className={light ? "text-[#F07A7E]" : "text-[#B3282D]"}>Expo</span>
        </span>
        <span
          className={`mt-1 mr-[-0.5em] font-medium tracking-[0.5em] ${compact ? "text-[0.6rem]" : "text-[0.6rem] md:text-[0.75rem]"} ${light ? "text-[#d9c08f]" : "text-[#8A6D10]"}`}
        >
          NAVIDAD
        </span>
      </span>
    </Link>
  );
}
