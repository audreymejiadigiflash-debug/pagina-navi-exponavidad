export function AdminHeading({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[2.25rem] md:text-[2.75rem]">{title}</h1>
        {description ? <p className="mt-1 text-[0.95rem] text-ink-soft">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
