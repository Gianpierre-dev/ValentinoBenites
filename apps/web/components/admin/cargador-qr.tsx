"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { IconLoader2, IconTrash, IconUpload } from "@tabler/icons-react";
import { subirArchivo } from "@/lib/api";
import { Boton } from "@/components/ui";
import { mensajeDeError } from "./errores";

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

/**
 * Lado minimo recomendado para un QR de pago. Se muestra a 224 px en el
 * checkout; por debajo de esto la imagen se estira, los modulos se emborronan
 * y la camara del cliente no logra leerlo.
 */
export const LADO_MINIMO_QR = 500;

/** Mide una imagen en el navegador antes de subirla. */
function medirImagen(archivo: File): Promise<{ ancho: number; alto: number }> {
  return new Promise((resolver, rechazar) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new window.Image();
    imagen.onload = () => {
      URL.revokeObjectURL(url);
      resolver({ ancho: imagen.naturalWidth, alto: imagen.naturalHeight });
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      rechazar(new Error("No se pudo leer la imagen."));
    };
    imagen.src = url;
  });
}

interface PropsCargadorQR {
  etiqueta: string;
  url: string | null;
  alCambiar: (url: string | null) => void;
  alError: (mensaje: string) => void;
}

/**
 * Sube/previsualiza una imagen de QR de pago (una sola, opcional). Si la imagen
 * es menor al minimo recomendado avisa (sin bloquear): un QR chico se emborrona
 * en el checkout y la camara del cliente no puede escanearlo.
 */
export function CargadorQR({ etiqueta, url, alCambiar, alError }: PropsCargadorQR) {
  const refInput = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function subir(archivos: FileList | null) {
    const archivo = archivos?.[0];
    if (!archivo) return;
    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      alError("El archivo no es una imagen valida.");
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      alError("La imagen supera el limite de 5 MB.");
      return;
    }

    // Aviso (no bloqueante): un QR pequeño se sube igual, pero es probable que
    // el cliente no pueda escanearlo desde su celular.
    setAviso(null);
    try {
      const { ancho, alto } = await medirImagen(archivo);
      const lado = Math.min(ancho, alto);
      if (lado < LADO_MINIMO_QR) {
        setAviso(
          `Esta imagen mide ${ancho}×${alto} px. Puede verse borrosa y que no se pueda escanear. Recomendado: al menos ${LADO_MINIMO_QR}×${LADO_MINIMO_QR} px.`,
        );
      }
    } catch {
      // Si no se pudo medir, se continúa: la subida no depende de esta ayuda.
    }

    setSubiendo(true);
    try {
      const subido = await subirArchivo(archivo);
      alCambiar(subido.url);
    } catch (error) {
      alError(mensajeDeError(error));
    } finally {
      setSubiendo(false);
      if (refInput.current) refInput.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-texto-fuerte">{etiqueta}</span>
      <div className="flex items-center gap-3">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-borde bg-black/[.02]">
          {url ? (
            <Image src={url} alt={etiqueta} fill sizes="112px" className="object-contain p-1" />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-texto/40">
              Sin QR
            </span>
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <Boton
            type="button"
            variante="secundario"
            tamano="sm"
            onClick={() => refInput.current?.click()}
            disabled={subiendo}
          >
            {subiendo ? (
              <IconLoader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <IconUpload className="h-4 w-4" aria-hidden />
            )}
            {url ? "Cambiar" : "Subir QR"}
          </Boton>
          {url && (
            <Boton
              type="button"
              variante="fantasma"
              tamano="sm"
              onClick={() => alCambiar(null)}
            >
              <IconTrash className="h-4 w-4 text-oferta" aria-hidden />
              Quitar
            </Boton>
          )}
        </div>
      </div>
      {aviso && (
        <p
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
        >
          {aviso}
        </p>
      )}
      <input
        ref={refInput}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(evento) => subir(evento.target.files)}
      />
    </div>
  );
}
