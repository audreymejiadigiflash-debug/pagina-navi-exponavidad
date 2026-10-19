"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CloseIcon, FilterIcon } from "@/components/icons";
import type { AttributeOption } from "@/lib/catalog-query";

export type FilterGroup = { key: string; label: string; options: AttributeOption[] };

type CatalogFiltersProps = {
  groups: FilterGroup[];
  resultCount: number;
};

function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const search = params.toString();
    startTransition(() => {
      router.replace(`${pathname}${search ? `?${search}` : ""}`, { scroll: false });
    });
  };

  return { searchParams, update, isPending };
}

function FilterPanel({ groups }: { groups: FilterGroup[] }) {
  const { searchParams, update } = useFilterNavigation();
  const [priceError, setPriceError] = useState("");
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);

  const toggleValue = (key: string, value: string, checked: boolean) =>
    update((params) => {
      const values = params.getAll(key).filter((item) => item !== value);
      params.delete(key);
      for (const item of checked ? [...values, value] : values) params.append(key, item);
    });

  const toggleFlag = (key: string, checked: boolean) =>
    update((params) => {
      if (checked) params.set(key, "1");
      else params.delete(key);
    });

  const applyPrice = (event: React.FormEvent) => {
    event.preventDefault();
    const min = minRef.current?.value.trim() ?? "";
    const max = maxRef.current?.value.trim() ?? "";
    if (min && max && Number(min) > Number(max)) {
      setPriceError("El mínimo no puede ser mayor que el máximo.");
      return;
    }
    setPriceError("");
    update((params) => {
      if (min) params.set("precio_min", min);
      else params.delete("precio_min");
      if (max) params.set("precio_max", max);
      else params.delete("precio_max");
    });
  };

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <fieldset key={group.key} className="border-b border-line pb-6">
          <legend className="label-caps mb-4 text-[0.6875rem] text-ink">{group.label}</legend>
          <ul className="space-y-1">
            {group.options.map((option) => {
              const checked = searchParams.getAll(group.key).includes(option.value);
              return (
                <li key={option.value}>
                  <label className="flex min-h-9 cursor-pointer items-center gap-3 text-[0.925rem]">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={checked}
                      onChange={(event) => toggleValue(group.key, option.value, event.target.checked)}
                    />
                    <span className="flex-1">{option.value}</span>
                    <span className="text-[0.8125rem] text-ink-soft">{option.count}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}

      <fieldset className="border-b border-line pb-6">
        <legend className="label-caps mb-4 text-[0.6875rem] text-ink">Precio (MXN)</legend>
        {/* Remount when the URL changes (e.g. "Limpiar") so the uncontrolled inputs reset. */}
        <form
          key={`${searchParams.get("precio_min") ?? ""}-${searchParams.get("precio_max") ?? ""}`}
          onSubmit={applyPrice}
          noValidate
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="precio-min" className="field-label">
                Desde
              </label>
              <input
                ref={minRef}
                id="precio-min"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={searchParams.get("precio_min") ?? ""}
                placeholder="$0"
                className="input"
                aria-invalid={Boolean(priceError)}
                aria-describedby={priceError ? "precio-error" : undefined}
              />
            </div>
            <div>
              <label htmlFor="precio-max" className="field-label">
                Hasta
              </label>
              <input
                ref={maxRef}
                id="precio-max"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={searchParams.get("precio_max") ?? ""}
                placeholder="Sin límite"
                className="input"
                aria-invalid={Boolean(priceError)}
                aria-describedby={priceError ? "precio-error" : undefined}
              />
            </div>
          </div>
          {priceError ? (
            <p id="precio-error" className="field-error" role="alert">
              {priceError}
            </p>
          ) : null}
          <button type="submit" className="btn btn-outline btn-sm mt-4 w-full">
            Aplicar precio
          </button>
        </form>
      </fieldset>

      <fieldset>
        <legend className="label-caps mb-4 text-[0.6875rem] text-ink">Disponibilidad</legend>
        <label className="flex min-h-9 cursor-pointer items-center gap-3 text-[0.925rem]">
          <input
            type="checkbox"
            className="checkbox"
            checked={searchParams.get("oferta") === "1"}
            onChange={(event) => toggleFlag("oferta", event.target.checked)}
          />
          Solo ofertas
        </label>
        <label className="flex min-h-9 cursor-pointer items-center gap-3 text-[0.925rem]">
          <input
            type="checkbox"
            className="checkbox"
            checked={searchParams.get("disponible") === "1"}
            onChange={(event) => toggleFlag("disponible", event.target.checked)}
          />
          Ocultar agotados
        </label>
      </fieldset>
    </div>
  );
}

export function CatalogFilters({ groups, resultCount }: CatalogFiltersProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { update } = useFilterNavigation();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const clearAll = () =>
    update((params) => {
      for (const key of [...params.keys()]) if (key !== "q" && key !== "orden") params.delete(key);
    });

  return (
    <>
      <aside aria-label="Filtros" className="hidden lg:block">
        <div className="sticky top-[200px] max-h-[calc(100dvh-220px)] overflow-y-auto pr-2">
          <FilterPanel groups={groups} />
          <button type="button" onClick={clearAll} className="label-caps link-underline mt-8 text-[0.6875rem]">
            Limpiar filtros
          </button>
        </div>
      </aside>

      <button
        type="button"
        className="btn btn-outline btn-sm lg:hidden"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <FilterIcon size={18} />
        Filtrar
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Filtros"
        onClose={() => setOpen(false)}
        className="m-0 ml-auto h-full max-h-none w-[min(420px,100vw)] max-w-none bg-white p-0 backdrop:bg-ink/40"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="font-serif text-2xl">Filtrar</span>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center"
              aria-label="Cerrar filtros"
              onClick={() => setOpen(false)}
            >
              <CloseIcon size={22} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <FilterPanel groups={groups} />
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-line px-5 py-4">
            <button type="button" className="btn btn-outline btn-sm" onClick={clearAll}>
              Limpiar
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
              Ver {resultCount}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

export function SortSelect({ options, value }: { options: readonly { value: string; label: string }[]; value: string }) {
  const { update, isPending } = useFilterNavigation();
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="orden" className="label-caps hidden text-[0.6875rem] text-ink-soft sm:block">
        Ordenar
      </label>
      <select
        id="orden"
        className="input h-11 min-h-11 w-auto py-0 text-[0.9rem]"
        value={value}
        aria-busy={isPending}
        onChange={(event) =>
          update((params) => {
            if (event.target.value === "destacados") params.delete("orden");
            else params.set("orden", event.target.value);
          })
        }
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
