import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-ivory px-4 py-24 text-center">
      <Logo compact />
      <p className="eyebrow mt-12">Error 404</p>
      <h1 className="mt-3 text-[2.75rem] md:text-[3.5rem]">No encontramos esta página</h1>
      <p className="mt-4 max-w-md text-ink-soft">Es posible que el producto ya no esté disponible o que la dirección esté incompleta.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/tienda" className="btn btn-primary">
          Ir a la tienda
        </Link>
        <Link href="/" className="btn btn-outline">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
