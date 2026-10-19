export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="container-page max-w-3xl py-16 md:py-24">
      <header className="mb-10 border-b border-line pb-8 text-center">
        <span className="eyebrow">Información legal</span>
        <h1 className="mt-3 text-[2.6rem] md:text-[3.25rem]">{title}</h1>
        <p className="mt-3 text-[0.875rem] text-ink-soft">Última actualización: {updated}</p>
      </header>
      <div className="prose-legal">{children}</div>
    </article>
  );
}
