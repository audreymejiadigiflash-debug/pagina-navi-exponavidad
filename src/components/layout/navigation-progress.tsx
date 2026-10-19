type NavigationProgressProps = {
  active: boolean;
  /** Positioning; defaults to the bottom edge of the nearest positioned parent. */
  className?: string;
};

/** Thin bar shown while a menu navigation is pending. */
export function NavigationProgress({ active, className = "absolute inset-x-0 bottom-0" }: NavigationProgressProps) {
  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none ${className} z-50 h-0.5 overflow-hidden transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
      >
        {active ? <div className="animate-progress h-full w-1/3 bg-gold" /> : null}
      </div>
      <span role="status" className="sr-only">
        {active ? "Cargando productos…" : ""}
      </span>
    </>
  );
}
