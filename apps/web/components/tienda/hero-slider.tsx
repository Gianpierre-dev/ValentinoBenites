"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import type { Banner } from "@/lib/tipos";

/** Tiempo entre transiciones automáticas del carrusel. */
const INTERVALO_AUTOPLAY_MS = 5500;

/** Texto por defecto del hero si la clienta aún no configuró el suyo. */
const TITULO_FALLBACK = "Moda que te *acompaña* todos los días";
const SUBTITULO_FALLBACK =
  "Carteras y accesorios de cuero para mujer. Piezas elegantes, hechas para durar y pensadas para tu día a día.";

interface HeroSliderProps {
  /** Banners administrados por la clienta (Configuración → Banners de la home). */
  banners: Banner[];
  /** Foto de producto destacado, usada como fondo si no hay banners. */
  imagenUrlFallback: string | null;
  /** Título del hero; una palabra entre *asteriscos* se pinta con el acento. */
  titulo?: string | null;
  /** Párrafo subtítulo del hero. */
  subtitulo?: string | null;
  /** true = texto claro (blanco) para banners oscuros; false = texto oscuro. */
  textoClaro?: boolean;
}

/** Segmento del título: texto plano o palabra resaltada (entre asteriscos). */
interface SegmentoTitulo {
  texto: string;
  resaltado: boolean;
}

/**
 * Divide el título en segmentos usando un par de asteriscos para marcar la
 * palabra/frase a resaltar. Ej: `Moda que te *acompaña* hoy` produce tres
 * segmentos, el del medio con `resaltado: true`. Si no hay asteriscos, devuelve
 * un único segmento sin resaltar.
 */
function parsearTitulo(titulo: string): SegmentoTitulo[] {
  return titulo
    .split(/\*([^*]+)\*/)
    .map((texto, indice) => ({ texto, resaltado: indice % 2 === 1 }))
    .filter((segmento) => segmento.texto.length > 0);
}

/**
 * Hero full-width tipo carrusel: las imágenes de banner rotan de fondo mientras
 * el texto y el CTA permanecen fijos superpuestos. Si no hay banners, degrada a
 * un hero estático con el degradado rosa/violáceo de marca (o la foto fallback).
 */
export function HeroSlider({
  banners,
  imagenUrlFallback,
  titulo,
  subtitulo,
  textoClaro = true,
}: HeroSliderProps) {
  const segmentosTitulo = parsearTitulo(
    (titulo?.trim() ? titulo : TITULO_FALLBACK).trim(),
  );
  const textoSubtitulo = subtitulo?.trim() ? subtitulo : SUBTITULO_FALLBACK;

  // El color se aplica inline para ganarle a la regla de globals.css que fuerza
  // color oscuro a los h1/h2 dentro de .storefront (un estilo inline vence a
  // cualquier selector de clase y conserva la fuente Fraunces).
  const colorTexto = textoClaro ? "#ffffff" : "var(--color-texto-fuerte)";
  const colorAcento = textoClaro
    ? "var(--color-acento-claro)"
    : "var(--color-acento)";

  const imagenes = banners
    .map((banner) => banner.imagenUrl)
    .filter((url): url is string => Boolean(url));
  const tieneBanners = imagenes.length > 0;

  // Sin banners cargados: un solo hero estático (foto fallback o degradado).
  const slides = tieneBanners
    ? imagenes
    : imagenUrlFallback
      ? [imagenUrlFallback]
      : [];

  const reduceMovimiento = useMovimientoReducido();
  const autoplayActivo = slides.length > 1 && !reduceMovimiento;

  const [indice, setIndice] = useState(0);
  const [enPausa, setEnPausa] = useState(false);

  const irA = useCallback(
    (siguiente: number) => {
      setIndice((siguiente + slides.length) % slides.length);
    },
    [slides.length],
  );
  const anterior = useCallback(() => irA(indice - 1), [irA, indice]);
  const siguiente = useCallback(() => irA(indice + 1), [irA, indice]);

  useEffect(() => {
    if (!autoplayActivo || enPausa) return;
    const id = window.setInterval(() => {
      setIndice((actual) => (actual + 1) % slides.length);
    }, INTERVALO_AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplayActivo, enPausa, slides.length]);

  const hayFoto = slides.length > 0;

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Destacados de la temporada"
      className="relative isolate overflow-hidden border-b border-borde bg-gradient-to-br from-[#fdf3fb] via-[#fbe9f6] to-[#f1d9ef]"
      onMouseEnter={() => setEnPausa(true)}
      onMouseLeave={() => setEnPausa(false)}
      onFocusCapture={() => setEnPausa(true)}
      onBlurCapture={() => setEnPausa(false)}
    >
      {/* Capa de imágenes que rota; el texto vive fuera y no cambia. */}
      <div className="absolute inset-0 -z-10">
        {hayFoto ? (
          slides.map((url, posicion) => (
            <div
              key={`${url}-${posicion}`}
              aria-hidden={posicion !== indice}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                posicion === indice ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={url}
                alt=""
                fill
                priority={posicion === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))
        ) : (
          // Sin foto alguna: textura de puntos sobre el degradado de marca.
          <span aria-hidden className="fondo-puntos absolute inset-0 opacity-60" />
        )}
      </div>

      {/* Scrim: degradado oscuro para legibilidad del texto claro sobre la foto.
          Solo aplica cuando hay foto y el texto es claro (banner oscuro). */}
      {hayFoto && textoClaro && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/45 to-transparent"
        >
          <span className="absolute inset-0 bg-gradient-to-t from-[#2a0a2c]/70 via-transparent to-transparent" />
        </span>
      )}

      <div className="relative mx-auto flex min-h-[68vh] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex max-w-xl flex-col items-start gap-6">
          <p
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] backdrop-blur ${
              textoClaro
                ? "border-white/40 bg-white/15 text-white"
                : "border-acento/20 bg-white/70 text-acento"
            }`}
          >
            Nueva temporada
          </p>
          <h1
            className="text-4xl font-black leading-[1.05] sm:text-5xl lg:text-6xl"
            style={{ color: colorTexto }}
          >
            {segmentosTitulo.map((segmento, indice) => (
              <span
                key={`${indice}-${segmento.texto}`}
                style={segmento.resaltado ? { color: colorAcento } : undefined}
              >
                {segmento.texto}
              </span>
            ))}
          </h1>
          <p
            className="max-w-md text-lg leading-relaxed"
            style={{ color: colorTexto, opacity: textoClaro ? 0.9 : 1 }}
          >
            {textoSubtitulo}
          </p>
          <Link
            href="/catalogo"
            className="group inline-flex items-center gap-2 rounded-full bg-acento px-7 py-3.5 text-base font-medium text-acento-contraste shadow-lg shadow-acento/30 transition-all hover:-translate-y-0.5 hover:bg-acento/90 hover:shadow-xl hover:shadow-acento/40"
          >
            Ver catálogo
            <IconArrowRight
              size={18}
              stroke={2}
              aria-hidden
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>

      {/* Controles: solo cuando hay más de un banner para rotar. */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={anterior}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/25 p-2 text-white backdrop-blur transition-colors hover:bg-black/45 sm:inline-flex"
          >
            <IconChevronLeft size={22} stroke={2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={siguiente}
            aria-label="Banner siguiente"
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/25 p-2 text-white backdrop-blur transition-colors hover:bg-black/45 sm:inline-flex"
          >
            <IconChevronRight size={22} stroke={2} aria-hidden />
          </button>

          <div
            role="tablist"
            aria-label="Seleccionar banner"
            className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2.5"
          >
            {slides.map((url, posicion) => {
              const activo = posicion === indice;
              return (
                <button
                  key={`dot-${url}-${posicion}`}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  aria-current={activo ? "true" : undefined}
                  aria-label={`Ir al banner ${posicion + 1}`}
                  onClick={() => irA(posicion)}
                  className={`h-2.5 rounded-full transition-all ${
                    activo
                      ? "w-7 bg-white"
                      : "w-2.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

const CONSULTA_MOVIMIENTO = "(prefers-reduced-motion: reduce)";

function suscribirMovimiento(alCambiar: () => void): () => void {
  const consulta = window.matchMedia(CONSULTA_MOVIMIENTO);
  consulta.addEventListener("change", alCambiar);
  return () => consulta.removeEventListener("change", alCambiar);
}

/**
 * Detecta `prefers-reduced-motion` de forma reactiva sin setState en efectos:
 * `useSyncExternalStore` es la API de React para suscribirse a un store externo
 * (aquí, el media query). El prefijo `use` es requisito técnico de React.
 */
function useMovimientoReducido(): boolean {
  return useSyncExternalStore(
    suscribirMovimiento,
    () => window.matchMedia(CONSULTA_MOVIMIENTO).matches,
    () => false,
  );
}
