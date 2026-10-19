import Image from "next/image";

type ProductImageProps = {
  src: string | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** Product photo that fills its (relatively positioned) parent, with an elegant fallback. */
export function ProductImage({ src, alt, sizes, priority = false, className = "" }: ProductImageProps) {
  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-ivory" role="img" aria-label={alt}>
        <span className="font-serif text-5xl text-line-strong" aria-hidden="true">
          N
        </span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
    />
  );
}
