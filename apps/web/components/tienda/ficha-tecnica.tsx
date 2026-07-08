"use client";

import { useId, useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/utilidades";

interface ItemFicha {
  titulo: string;
  contenido: string;
}

interface PropsFichaTecnica {
  descripcion: string | null;
  material: string | null;
  dimensiones: string | null;
}

/**
 * Acordeón "Detalle del producto" de la ficha: agrupa descripción, material y
 * dimensiones en secciones colapsables. Solo renderiza los datos que existen; si
 * no hay ninguno, no muestra nada. Cada sección es un botón accesible con
 * aria-expanded y su panel asociado.
 */
export function FichaTecnica({ descripcion, material, dimensiones }: PropsFichaTecnica) {
  const items: ItemFicha[] = [];
  if (descripcion?.trim()) {
    items.push({ titulo: "Descripción", contenido: descripcion });
  }
  if (material?.trim()) {
    items.push({ titulo: "Material", contenido: material });
  }
  if (dimensiones?.trim()) {
    items.push({ titulo: "Dimensiones", contenido: dimensiones });
  }

  // La primera sección abierta por defecto para no ocultar el dato más relevante.
  const [abierto, setAbierto] = useState(0);

  if (items.length === 0) return null;

  return (
    <section
      aria-label="Detalle del producto"
      className="overflow-hidden rounded-2xl border border-borde bg-fondo shadow-[0_1px_3px_rgba(17,17,17,0.04)]"
    >
      <h2 className="titulo-ui border-b border-borde bg-perla px-6 py-4 text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
        Detalle del producto
      </h2>
      <ul className="divide-y divide-borde">
        {items.map((item, indice) => (
          <ItemAcordeon
            key={item.titulo}
            item={item}
            abierto={abierto === indice}
            alAlternar={() => setAbierto((actual) => (actual === indice ? -1 : indice))}
          />
        ))}
      </ul>
    </section>
  );
}

interface PropsItemAcordeon {
  item: ItemFicha;
  abierto: boolean;
  alAlternar: () => void;
}

function ItemAcordeon({ item, abierto, alAlternar }: PropsItemAcordeon) {
  const idPanel = useId();

  return (
    <li>
      <h3>
        <button
          type="button"
          onClick={alAlternar}
          aria-expanded={abierto}
          aria-controls={idPanel}
          className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-perla/60"
        >
          <span className="text-sm font-medium text-texto-fuerte">{item.titulo}</span>
          <IconChevronDown
            size={18}
            aria-hidden
            className={cn(
              "shrink-0 text-texto/50 transition-transform duration-200",
              abierto && "rotate-180 text-acento",
            )}
          />
        </button>
      </h3>
      <div id={idPanel} hidden={!abierto} className="px-6 pb-5">
        <p className="whitespace-pre-line leading-relaxed text-texto">
          {item.contenido}
        </p>
      </div>
    </li>
  );
}
