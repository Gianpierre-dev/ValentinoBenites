"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { IconX, IconTrash, IconShoppingBag } from "@tabler/icons-react";
import { Boton } from "@/components/ui";
import { useCarrito } from "@/store/carrito";
import { useHidratado } from "@/store/usar-hidratado";
import { formatearPrecio } from "@/lib/utilidades";
import { SelectorCantidad } from "./selector-cantidad";

/** Selectores enfocables dentro del panel, para el atrapado de foco basico. */
const SELECTOR_ENFOCABLES =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

/**
 * Panel lateral deslizante (drawer / mini-cart) del carrito. Se monta una vez en
 * el layout publico y se controla por el store (`abierto`). Se abre al agregar un
 * producto o desde el icono del header. Accesible: role dialog, Esc para cerrar,
 * cierre por overlay, bloqueo de scroll del body y foco gestionado al abrir.
 */
export function CarritoDrawer() {
  const hidratado = useHidratado();
  const abierto = useCarrito((estado) => estado.abierto);
  const cerrar = useCarrito((estado) => estado.cerrar);
  const lineas = useCarrito((estado) => estado.lineas);
  const cambiarCantidad = useCarrito((estado) => estado.cambiarCantidad);
  const quitar = useCarrito((estado) => estado.quitar);
  const total = useCarrito((estado) => estado.total());

  const panelRef = useRef<HTMLDivElement>(null);
  const botonCerrarRef = useRef<HTMLButtonElement>(null);

  // Solo se considera abierto cuando el store ya hidrato, para evitar abrir el
  // panel durante el render del servidor.
  const visible = hidratado && abierto;

  // Bloquea el scroll del body, cierra con Esc, atrapa el foco y enfoca al abrir.
  useEffect(() => {
    if (!visible) return;

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    botonCerrarRef.current?.focus();

    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        cerrar();
        return;
      }
      if (evento.key !== "Tab" || !panelRef.current) return;

      const enfocables = panelRef.current.querySelectorAll<HTMLElement>(
        SELECTOR_ENFOCABLES,
      );
      if (enfocables.length === 0) return;

      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      const activo = document.activeElement;

      if (evento.shiftKey && activo === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && activo === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [visible, cerrar]);

  const vacio = lineas.length === 0;

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-0 z-50 ${visible ? "" : "pointer-events-none"}`}
    >
      {/* Overlay oscuro */}
      <div
        onClick={cerrar}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 motion-reduce:transition-none ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tu carrito"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-fondo shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-borde px-5 py-4">
          <h2 className="text-lg font-semibold text-texto-fuerte">Tu carrito</h2>
          <button
            ref={botonCerrarRef}
            type="button"
            onClick={cerrar}
            aria-label="Cerrar carrito"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-texto/70 transition-colors hover:bg-black/[.04] hover:text-texto-fuerte"
          >
            <IconX size={20} aria-hidden />
          </button>
        </header>

        {vacio ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <IconShoppingBag
              size={44}
              stroke={1.25}
              aria-hidden
              className="text-texto/40"
            />
            <div>
              <p className="text-base font-semibold text-texto-fuerte">
                Tu carrito esta vacio
              </p>
              <p className="mt-1 text-sm text-texto">
                Descubre nuestros productos y encuentra algo para ti.
              </p>
            </div>
            <Link href="/catalogo" onClick={cerrar}>
              <Boton tamano="md">Ver catalogo</Boton>
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-borde overflow-y-auto px-5">
              {lineas.map((linea) => (
                <li key={linea.productoId} className="flex gap-4 py-4">
                  <Link
                    href={`/producto/${linea.slug}`}
                    onClick={cerrar}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-borde bg-perla"
                  >
                    {linea.imagenUrl ? (
                      <Image
                        src={linea.imagenUrl}
                        alt={linea.nombre}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[10px] uppercase text-texto/50">
                        Sin foto
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/producto/${linea.slug}`}
                        onClick={cerrar}
                        className="text-sm font-medium leading-snug text-texto-fuerte transition-colors hover:text-acento"
                      >
                        {linea.nombre}
                      </Link>
                      <button
                        type="button"
                        onClick={() => quitar(linea.productoId)}
                        aria-label={`Quitar ${linea.nombre} del carrito`}
                        className="shrink-0 text-texto/60 transition-colors hover:text-oferta"
                      >
                        <IconTrash size={18} aria-hidden />
                      </button>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <SelectorCantidad
                        cantidad={linea.cantidad}
                        alCambiar={(cantidad) =>
                          cambiarCantidad(linea.productoId, cantidad)
                        }
                        maximo={linea.stock}
                      />
                      <span className="text-sm font-semibold text-texto-fuerte">
                        {formatearPrecio(linea.precioUnitario * linea.cantidad)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-borde px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
                  Total
                </span>
                <span className="text-lg font-semibold text-texto-fuerte">
                  {formatearPrecio(total)}
                </span>
              </div>
              <p className="mt-1 text-xs text-texto/70">
                Envio y descuentos se calculan al finalizar la compra.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Link href="/checkout" onClick={cerrar} className="block">
                  <Boton tamano="lg" className="w-full">
                    Ir a pagar
                  </Boton>
                </Link>
                <Link href="/carrito" onClick={cerrar} className="block">
                  <Boton variante="secundario" tamano="md" className="w-full">
                    Ver carrito
                  </Boton>
                </Link>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
