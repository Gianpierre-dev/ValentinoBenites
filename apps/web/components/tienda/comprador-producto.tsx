"use client";

import { useState } from "react";
import { IconClockHour4 } from "@tabler/icons-react";
import { Etiqueta } from "@/components/ui";
import type { Producto, Variante } from "@/lib/tipos";
import { formatearPrecio, precioMostrableVariante } from "@/lib/utilidades";
import { AccionesProducto } from "./acciones-producto";
import { BloqueConfianza } from "./bloque-confianza";
import { BotonFavorito } from "./boton-favorito";
import { FichaTecnica } from "./ficha-tecnica";
import { GaleriaProducto } from "./galeria-producto";
import { SelectorColor } from "./selector-color";

interface PropsCompradorProducto {
  producto: Producto;
}

/**
 * Bloque interactivo de compra del detalle de producto. Mantiene el estado de la
 * variante (color) seleccionada y sincroniza galeria, precio efectivo y la accion
 * de agregar al carrito. Se hidrata en cliente; la ficha (breadcrumb, titulo,
 * descripcion, relacionados) vive en el server component de la pagina.
 */
export function CompradorProducto({ producto }: PropsCompradorProducto) {
  const variantes = producto.variantes;
  const [varianteId, setVarianteId] = useState<string>(
    variantes[0]?.id ?? "",
  );

  const seleccionada: Variante | undefined =
    variantes.find((variante) => variante.id === varianteId) ?? variantes[0];

  // Producto sin variantes activas: degradamos a la galeria del modelo sin compra.
  if (!seleccionada) {
    return (
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <GaleriaProducto imagenes={producto.imagenes} nombre={producto.nombre} />
        <div className="flex flex-col gap-4 lg:pt-4">
          <EncabezadoProducto producto={producto} />
          <p className="rounded-xl border border-borde bg-perla px-4 py-3 text-sm text-texto">
            Este producto aun no tiene colores disponibles.
          </p>
        </div>
      </div>
    );
  }

  const precio = precioMostrableVariante(seleccionada, producto);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      {/* La galeria se remonta al cambiar de variante (key) para reiniciar la
          miniatura activa a la primera foto del color elegido. */}
      <GaleriaProducto
        key={seleccionada.id}
        imagenes={seleccionada.imagenesEfectivas}
        nombre={`${producto.nombre} - ${seleccionada.color}`}
      />

      <div className="flex flex-col gap-7 lg:pt-4">
        <EncabezadoProducto producto={producto} />

        <div className="flex flex-wrap items-center gap-3">
          {precio.precioAntes !== null ? (
            <>
              <span className="font-display text-3xl font-semibold text-acento">
                {formatearPrecio(precio.precioFinal)}
              </span>
              <span className="text-xl text-texto/50 line-through">
                {formatearPrecio(precio.precioAntes)}
              </span>
              {precio.descuento !== null && (
                <Etiqueta variante="oferta">-{precio.descuento}%</Etiqueta>
              )}
            </>
          ) : (
            <span className="font-display text-3xl font-semibold text-acento">
              {formatearPrecio(precio.precioFinal)}
            </span>
          )}
        </div>

        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-acento">
          <IconClockHour4 size={16} aria-hidden />
          Hecho a pedido, listo en ~24 h
        </p>

        <SelectorColor
          variantes={variantes}
          varianteSeleccionadaId={seleccionada.id}
          alSeleccionar={(variante) => setVarianteId(variante.id)}
        />

        <AccionesProducto producto={producto} variante={seleccionada} />

        <BloqueConfianza variante="tarjetas" />

        <FichaTecnica
          descripcion={producto.descripcion}
          material={producto.material}
          dimensiones={producto.dimensiones}
        />
      </div>
    </div>
  );
}

function EncabezadoProducto({ producto }: { producto: Producto }) {
  return (
    <div>
      {producto.categoria && (
        <p className="titulo-ui text-xs font-semibold uppercase tracking-[0.2em] text-acento">
          {producto.categoria.nombre}
        </p>
      )}
      <div className="mt-3 flex items-start justify-between gap-4">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-texto-fuerte sm:text-5xl">
          {producto.nombre}
        </h1>
        {/* El favorito es a nivel modelo (no variante) y funciona incluso sin variantes activas. */}
        <BotonFavorito
          producto={producto}
          className="mt-2 shrink-0 border border-borde bg-fondo hover:border-acento/40"
        />
      </div>
    </div>
  );
}
