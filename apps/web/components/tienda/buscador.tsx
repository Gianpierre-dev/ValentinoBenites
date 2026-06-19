"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";

/**
 * Buscador del catalogo: sincroniza el termino con el query param `q` navegando
 * a /catalogo. Conserva el filtro de categoria activo.
 */
export function Buscador() {
  const router = useRouter();
  const parametros = useSearchParams();
  const [texto, setTexto] = useState(parametros.get("q") ?? "");

  const buscar = (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const params = new URLSearchParams(parametros.toString());
    const limpio = texto.trim();

    if (limpio) {
      params.set("q", limpio);
    } else {
      params.delete("q");
    }

    router.push(`/catalogo?${params.toString()}`);
  };

  return (
    <form onSubmit={buscar} role="search" className="relative w-full max-w-sm">
      <label htmlFor="buscador-catalogo" className="sr-only">
        Buscar productos
      </label>
      <input
        id="buscador-catalogo"
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder="Buscar productos"
        className="h-11 w-full border border-borde bg-fondo pl-10 pr-3 text-sm text-texto-fuerte outline-none transition-colors placeholder:text-texto/50 focus:border-acento"
      />
      <IconSearch
        size={18}
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto/60"
      />
    </form>
  );
}
