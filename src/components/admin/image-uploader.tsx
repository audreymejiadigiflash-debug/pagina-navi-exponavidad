"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { uploadProductImage } from "@/app/admin/actions";
import { MAX_PRODUCT_IMAGES } from "@/lib/constants";

const MAX_IMAGE_SIDE = 1600;
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

/** Resizes and re-encodes a photo in the browser so uploads stay small and fast. */
async function optimizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await toBlob("image/webp", 0.85);
  // Some browsers cannot encode WebP and silently return PNG; JPEG keeps the file small.
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg", 0.85);
  if (!jpeg) throw new Error("encode");
  return jpeg;
}

type ImageUploaderProps = {
  images: string[];
  onChange: (images: string[]) => void;
  error?: string;
  onBusyChange: (busy: boolean) => void;
};

export function ImageUploader({ images, onChange, error, onBusyChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const room = MAX_PRODUCT_IMAGES - images.length;

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList).slice(0, Math.max(room, 0));
    const problems: string[] = [];
    if (fileList.length > room) problems.push(`Solo se agregaron ${Math.max(room, 0)} (máximo ${MAX_PRODUCT_IMAGES} fotos).`);
    setUploading(true);
    onBusyChange(true);
    let next = [...images];
    for (const [index, file] of files.entries()) {
      setStatus(`Subiendo foto ${index + 1} de ${files.length}…`);
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        problems.push(`“${file.name}” no es JPG, PNG ni WebP.`);
        continue;
      }
      if (file.size > MAX_SOURCE_BYTES) {
        problems.push(`“${file.name}” pesa más de 25 MB.`);
        continue;
      }
      try {
        const optimized = await optimizeImage(file);
        const formData = new FormData();
        formData.append("file", new File([optimized], file.name, { type: optimized.type }));
        const result = await uploadProductImage(formData);
        if (result.ok) {
          next = [...next, result.data.url];
          onChange(next);
        } else {
          problems.push(`“${file.name}”: ${result.message}`);
        }
      } catch {
        problems.push(`No se pudo procesar “${file.name}”.`);
      }
    }
    setUploading(false);
    onBusyChange(false);
    setStatus(problems.join(" "));
    if (inputRef.current) inputRef.current.value = "";
  };

  const move = (from: number, to: number) => {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <fieldset className="border border-line bg-white p-5">
      <legend className="px-1 text-[0.8125rem] font-medium">Fotos</legend>
      <p className="field-hint mt-0">
        La primera foto es la principal: es la portada de la tarjeta y, si hay más fotos, no se repite dentro
        del producto. JPG, PNG o WebP; se optimizan automáticamente. Máximo {MAX_PRODUCT_IMAGES}.
      </p>
      {images.length ? (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((src, index) => (
            <li key={src} className="space-y-1.5">
              <span className={`relative block aspect-[4/5] overflow-hidden bg-ivory ${index === 0 ? "outline outline-1 outline-offset-2 outline-gold" : ""}`}>
                <Image src={src} alt={`Foto ${index + 1}`} fill sizes="120px" className="object-cover" />
              </span>
              {index === 0 ? <span className="label-caps block text-[0.5625rem] text-gold-ink">Principal</span> : null}
              <span className="flex gap-1">
                {index > 0 ? (
                  <button
                    type="button"
                    className="min-h-9 flex-1 border border-line text-[0.6875rem] hover:border-ink"
                    onClick={() => move(index, 0)}
                    aria-label={`Usar foto ${index + 1} como principal`}
                  >
                    Principal
                  </button>
                ) : null}
                <button
                  type="button"
                  className="min-h-9 flex-1 border border-line text-[0.6875rem] hover:border-error hover:text-error"
                  onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
                  aria-label={`Quitar foto ${index + 1}`}
                >
                  Quitar
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <input
          ref={inputRef}
          id="product-images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="peer sr-only"
          disabled={uploading || room <= 0}
          onChange={(event) => handleFiles(event.target.files)}
        />
        <label
          htmlFor="product-images"
          className={`btn btn-outline btn-sm peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold ${uploading || room <= 0 ? "pointer-events-none opacity-50" : ""}`}
        >
          {uploading ? "Subiendo…" : "Subir fotos"}
        </label>
        <span className="text-[0.8125rem] text-ink-soft" aria-live="polite">
          {status}
        </span>
      </div>
      {error ? <p className="field-error">{error}</p> : null}
    </fieldset>
  );
}
