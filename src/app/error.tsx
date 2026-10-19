"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-ivory px-4 py-24 text-center">
      <p className="eyebrow">Algo salió mal</p>
      <h1 className="mt-3 text-[2.75rem] md:text-[3.25rem]">No pudimos cargar esta página</h1>
      <p className="mt-4 max-w-md text-ink-soft">Puede ser un problema momentáneo de conexión. Intenta de nuevo en unos segundos.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Reintentar
        </button>
        <Link href="/" className="btn btn-outline">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
