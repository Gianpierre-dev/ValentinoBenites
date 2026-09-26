"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconCurrencyDollar } from "@tabler/icons-react";

/**
 * Filtro por rango de precio del catálogo. Escribe `precioMin`/`precioMax` en la
 * query (conservando categoría y búsqueda) y deja que el server component
 * recargue los productos filtrados. Los valores vacíos se eliminan del filtro.
 */
export function FiltroPrecio() {
  const router = useRouter();
  const parametros = useSearchParams();
  const [minimo, setMinimo] = useState(parametros.get("precioMin") ?? "");
  const [maximo, setMaximo] = useState(parametros.get("precioMax") ?? "");
  const [error, setError] = useState<string | null>(null);
  const hayRangoAplicado = parametros.has("precioMin") || parametros.has("precioMax");

  const navegar = (params: URLSearchParams) => {
    const consulta = params.toString();
    router.push(consulta ? `/catalogo?${consulta}` : "/catalogo");
  };

  const aplicar = (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (minimo.trim() !== "" && maximo.trim() !== "" && Number(minimo) > Number(maximo)) {
      setError("El precio «Desde» no puede ser mayor que «Hasta».");
      return;
    }
    setError(null);
    const params = new URLSearchParams(parametros.toString());
    fijarParametro(params, "precioMin", minimo);
    fijarParametro(params, "precioMax", maximo);
    navegar(params);
  };

  const limpiar = () => {
    setMinimo("");
    setMaximo("");
    setError(null);
    const params = new URLSearchParams(parametros.toString());
    params.delete("precioMin");
    params.delete("precioMax");
    navegar(params);
  };

  return (
    <form
      onSubmit={aplicar}
      aria-label="Filtrar por rango de precio"
      className="flex flex-wrap items-end gap-2"
    >
      <CampoPrecio
        id="precio-min"
        etiqueta="Desde (S/)"
        valor={minimo}
        alCambiar={setMinimo}
      />
      <CampoPrecio
        id="precio-max"
        etiqueta="Hasta (S/)"
        valor={maximo}
        alCambiar={setMaximo}
      />
      <button
        type="submit"
        className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-acento bg-acento px-4 text-sm font-medium text-acento-contraste transition-colors hover:bg-acento-claro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2"
      >
        <IconCurrencyDollar size={16} aria-hidden />
        Aplicar
      </button>
      {hayRangoAplicado && (
        <button
          type="button"
          onClick={limpiar}
          className="inline-flex h-11 items-center rounded-lg border border-borde px-4 text-sm font-medium text-texto-fuerte transition-colors hover:border-acento/40 hover:text-acento focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento"
        >
          Limpiar
        </button>
      )}
      {error && (
        <p role="alert" className="w-full text-sm text-oferta">
          {error}
        </p>
      )}
    </form>
  );
}

interface PropsCampoPrecio {
  id: string;
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
}

function CampoPrecio({ id, etiqueta, valor, alCambiar }: PropsCampoPrecio) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-texto">
        {etiqueta}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step="1"
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
        placeholder="0"
        className="h-11 w-24 rounded-lg border border-borde bg-fondo px-3 text-sm text-texto-fuerte outline-none transition-colors placeholder:text-texto/40 focus:border-acento"
      />
    </div>
  );
}

/** Escribe el parámetro si hay un número válido (> 0); si no, lo elimina. */
function fijarParametro(
  params: URLSearchParams,
  clave: string,
  valor: string,
): void {
  const limpio = valor.trim();
  const numero = Number(limpio);
  if (limpio !== "" && Number.isFinite(numero) && numero >= 0) {
    params.set(clave, String(numero));
  } else {
    params.delete(clave);
  }
}
