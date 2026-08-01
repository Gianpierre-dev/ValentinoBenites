"use client";

import { IconCheck, IconPalette } from "@tabler/icons-react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utilidades";

/**
 * Paleta de la marca: los colores que realmente se usan en el catalogo, con su
 * tono ya resuelto. Tocar un color completa nombre + tono de una sola vez, para
 * no tener que escribir codigos hexadecimales a mano.
 */
const PALETA: { nombre: string; hex: string }[] = [
  // Neutros
  { nombre: "Negra", hex: "#1A1A1A" },
  { nombre: "Gris", hex: "#8E8E8E" },
  { nombre: "Cemento", hex: "#A3A09A" },
  { nombre: "Taupe", hex: "#8B7E74" },
  { nombre: "Perla", hex: "#EAE6DF" },
  { nombre: "Beige", hex: "#D9C3A9" },
  { nombre: "Arena", hex: "#D6BC94" },
  // Marrones
  { nombre: "Camel", hex: "#C19A6B" },
  { nombre: "Tabaco", hex: "#8A5A2B" },
  { nombre: "Café", hex: "#5D4037" },
  { nombre: "Marrón", hex: "#6B4226" },
  { nombre: "Chocolate", hex: "#4E342E" },
  // Colores
  { nombre: "Vino", hex: "#722F37" },
  { nombre: "Coral", hex: "#E76F51" },
  { nombre: "Naranja", hex: "#E07B39" },
  { nombre: "Fucsia", hex: "#C2185B" },
  { nombre: "Rosa", hex: "#E7A1B0" },
  { nombre: "Morada", hex: "#5E3A87" },
  { nombre: "Berenjena", hex: "#4B2E4C" },
  { nombre: "Azul", hex: "#34558B" },
  { nombre: "Azul Marino", hex: "#1F2A44" },
  { nombre: "Cielo", hex: "#9CC3E5" },
  { nombre: "Turquesa", hex: "#2FA8A0" },
  { nombre: "Verde", hex: "#3E7C4F" },
  { nombre: "Oliva", hex: "#708238" },
];

/** Tono por defecto al abrir el selector libre, si aun no hay uno elegido. */
const TONO_INICIAL = "#7D2181";

interface PropsSelectorColor {
  /** Nombre legible del color ("Vino"). */
  nombre: string;
  /** Tono en hexadecimal ("#722F37"); vacio si aun no se eligio. */
  hex: string;
  /** Se llama con ambos valores: elegir de la paleta completa los dos. */
  alCambiar: (nombre: string, hex: string) => void;
  errorNombre?: string;
  errorHex?: string;
}

/**
 * Selector de color de una variante. Sustituye al par de campos "nombre" +
 * "codigo hex" escritos a mano: se toca un color de la paleta de la marca y
 * quedan completos los dos. Para un tono que no esta en la paleta, el selector
 * libre abre el elegidor de color del sistema; el hexadecimal se muestra solo
 * como referencia y nunca hace falta escribirlo.
 */
export function SelectorColor({
  nombre,
  hex,
  alCambiar,
  errorNombre,
  errorHex,
}: PropsSelectorColor) {
  const hexNormalizado = hex.trim().toLowerCase();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="mb-2 block text-sm font-medium text-texto-fuerte">
          Elige el color
        </span>
        <ul className="flex flex-wrap gap-2">
          {PALETA.map((color) => {
            const elegido = color.hex.toLowerCase() === hexNormalizado;
            return (
              <li key={color.hex}>
                <button
                  type="button"
                  onClick={() => alCambiar(color.nombre, color.hex)}
                  aria-pressed={elegido}
                  title={color.nombre}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2 motion-reduce:transition-none",
                    elegido ? "border-acento" : "border-borde",
                  )}
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="sr-only">{color.nombre}</span>
                  {elegido && (
                    <IconCheck
                      size={18}
                      aria-hidden
                      className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                      style={{ color: esClaro(color.hex) ? "#1A1A1A" : "#FFFFFF" }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          etiqueta="Nombre del color"
          placeholder="Ej. Vino"
          value={nombre}
          error={errorNombre}
          onChange={(evento) => alCambiar(evento.target.value, hex)}
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="selector-tono"
            className="text-sm font-medium text-texto-fuerte"
          >
            ¿Otro tono?
          </label>
          <div className="flex items-center gap-3">
            <label
              htmlFor="selector-tono"
              className="relative inline-flex h-11 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-borde"
              style={{ backgroundColor: hex || "transparent" }}
            >
              {!hex && (
                <IconPalette size={20} aria-hidden className="text-texto/50" />
              )}
              <input
                id="selector-tono"
                type="color"
                value={hex || TONO_INICIAL}
                onChange={(evento) => alCambiar(nombre, evento.target.value.toUpperCase())}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
            <span className="text-xs text-texto/60">
              {hex ? (
                <>
                  Tono elegido
                  <span className="block font-mono text-[11px] text-texto/50">
                    {hex.toUpperCase()}
                  </span>
                </>
              ) : (
                "Toca para elegir un tono libre"
              )}
            </span>
          </div>
          {errorHex && (
            <p role="alert" className="text-sm text-oferta">
              {errorHex}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Luminancia aproximada para decidir el color del tilde sobre la bolita. */
function esClaro(hex: string): boolean {
  const valor = hex.replace("#", "");
  const r = parseInt(valor.slice(0, 2), 16);
  const g = parseInt(valor.slice(2, 4), 16);
  const b = parseInt(valor.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
