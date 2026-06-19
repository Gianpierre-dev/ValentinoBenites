"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { IconUpload, IconX, IconLoader2 } from "@tabler/icons-react";
import { subirArchivo } from "@/lib/api";
import { mensajeDeError } from "./errores";
import { useToast } from "./proveedor-toast";

export interface ImagenCargada {
  url: string;
}

interface PropsCargadorImagenes {
  imagenes: ImagenCargada[];
  alCambiar: (imagenes: ImagenCargada[]) => void;
}

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

/**
 * Sube imagenes de producto a /api/storage/upload (Wasabi) y mantiene la lista
 * ordenada. El orden se deriva de la posicion en el arreglo.
 */
export function CargadorImagenes({ imagenes, alCambiar }: PropsCargadorImagenes) {
  const { mostrarError } = useToast();
  const refInput = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function alSeleccionar(archivos: FileList | null) {
    if (!archivos || archivos.length === 0) return;

    const validos = Array.from(archivos).filter((archivo) => {
      if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
        mostrarError(`"${archivo.name}" no es una imagen valida.`);
        return false;
      }
      if (archivo.size > TAMANO_MAXIMO_BYTES) {
        mostrarError(`"${archivo.name}" supera el limite de 5 MB.`);
        return false;
      }
      return true;
    });

    if (validos.length === 0) return;

    setSubiendo(true);
    try {
      const subidas = await Promise.all(validos.map((archivo) => subirArchivo(archivo)));
      alCambiar([...imagenes, ...subidas.map((respuesta) => ({ url: respuesta.url }))]);
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setSubiendo(false);
      if (refInput.current) refInput.current.value = "";
    }
  }

  function quitar(indice: number) {
    alCambiar(imagenes.filter((_, posicion) => posicion !== indice));
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-texto-fuerte">Imagenes</span>

      <div className="flex flex-wrap gap-3">
        {imagenes.map((imagen, indice) => (
          <div
            key={`${imagen.url}-${indice}`}
            className="relative h-24 w-24 border border-borde bg-black/[.02]"
          >
            <Image
              src={imagen.url}
              alt={`Imagen ${indice + 1} del producto`}
              fill
              sizes="96px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => quitar(indice)}
              aria-label={`Quitar imagen ${indice + 1}`}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/70 text-white hover:bg-black"
            >
              <IconX className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => refInput.current?.click()}
          disabled={subiendo}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 border border-dashed border-borde text-xs text-texto/70 transition-colors hover:border-acento hover:text-texto-fuerte disabled:opacity-60"
        >
          {subiendo ? (
            <IconLoader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <IconUpload className="h-5 w-5" aria-hidden />
          )}
          {subiendo ? "Subiendo" : "Subir"}
        </button>
      </div>

      <input
        ref={refInput}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(evento) => alSeleccionar(evento.target.files)}
      />
      <p className="text-xs text-texto/60">JPG, PNG, WebP o AVIF. Maximo 5 MB por imagen.</p>
    </div>
  );
}
