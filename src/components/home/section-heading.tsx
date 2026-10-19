import Link from "next/link";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  id?: string;
  description?: string;
  link?: { href: string; label: string };
  align?: "center" | "left";
};

export function SectionHeading({ eyebrow, title, id, description, link, align = "center" }: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div className={`mb-10 flex flex-col gap-3 md:mb-14 ${centered ? "items-center text-center" : "items-start"}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id} className="text-[2.25rem] md:text-[3rem]">
        {title}
      </h2>
      <span className="rule-gold mt-1" aria-hidden="true" />
      {description ? <p className="mt-2 max-w-[60ch] text-ink-soft">{description}</p> : null}
      {link ? (
        <Link href={link.href} className="label-caps link-underline mt-2 text-[0.75rem] text-ink">
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}
