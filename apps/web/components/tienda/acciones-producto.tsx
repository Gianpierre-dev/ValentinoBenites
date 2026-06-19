"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconShoppingBagPlus, IconCheck } from "@tabler/icons-react";
import { Boton } from "@/components/ui";
import { useCarrito } from "@/store/carrito";
import type { Producto } from "@/lib/tipos";
import { SelectorCantidad } from "./selector-cantidad";

interface PropsAccionesProducto {
  producto: Producto;
}

/**
 * Bloque de compra del detalle: selector de cantidad y boton "Agregar al carrito".
 * Si el producto no tiene stock, deshabilita la compra.
 */
export function AccionesProducto({ producto }: PropsAccionesProducto) {
  const router = useRouter();
  const agregar = useCarrito((estado) => estado.agregar);
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);

  const sinStock = producto.stock <= 0;

  const alAgregar = () => {
    agregar(producto, cantidad);
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 2500);
  };

  if (sinStock) {
    return (
      <p className="border border-borde bg-black/[.02] px-4 py-3 text-sm text-texto">
        Producto agotado por el momento.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <SelectorCantidad
          cantidad={cantidad}
          alCambiar={setCantidad}
          maximo={producto.stock}
        />
        <span className="text-xs text-texto">{producto.stock} disponibles</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Boton tamano="lg" onClick={alAgregar} className="sm:flex-1">
          {agregado ? (
            <>
              <IconCheck size={18} aria-hidden />
              Agregado
            </>
          ) : (
            <>
              <IconShoppingBagPlus size={18} aria-hidden />
              Agregar al carrito
            </>
          )}
        </Boton>
        <Boton
          variante="secundario"
          tamano="lg"
          onClick={() => router.push("/carrito")}
          className="sm:flex-1"
        >
          Ir al carrito
        </Boton>
      </div>
    </div>
  );
}
