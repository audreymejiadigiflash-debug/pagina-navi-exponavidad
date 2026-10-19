export function CatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando productos">
      <div className="border-b border-line bg-ivory">
        <div className="container-page flex flex-col items-center gap-4 py-16">
          <div className="h-3 w-32 animate-pulse bg-line" />
          <div className="h-12 w-72 animate-pulse bg-line" />
          <div className="h-4 w-96 max-w-full animate-pulse bg-line" />
        </div>
      </div>
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[240px_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-5 animate-pulse bg-ivory" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:gap-x-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index}>
              <div className="aspect-[4/5] animate-pulse bg-ivory" />
              <div className="mt-4 h-4 w-3/4 animate-pulse bg-ivory" />
              <div className="mt-2 h-4 w-1/3 animate-pulse bg-ivory" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
