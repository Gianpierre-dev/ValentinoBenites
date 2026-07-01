"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconShoppingBagPlus, IconCheck } from "@tabler/icons-react";
import { Boton } from "@/components/ui";
import { useCarrito } from "@/store/carrito";
import type { Producto, Variante } from "@/lib/tipos";
import { SelectorCantidad } from "./selector-cantidad";

interface PropsAccionesProducto {
  producto: Producto;
  variante: Variante;
}

/**
 * Bloque de compra del detalle: selector de cantidad y boton "Agregar al carrito".
 * Modelo hecho-a-pedido: no hay stock ni topes, la compra siempre esta disponible.
 * Agrega la variante (color) seleccionada al carrito.
 */
export function AccionesProducto({ producto, variante }: PropsAccionesProducto) {
  const router = useRouter();
  const agregar = useCarrito((estado) => estado.agregar);
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);

  const alAgregar = () => {
    agregar(producto, variante, cantidad);
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 2500);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <SelectorCantidad cantidad={cantidad} alCambiar={setCantidad} />
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
