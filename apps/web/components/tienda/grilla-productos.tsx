import type { Producto } from "@/lib/tipos";
import { TarjetaProducto } from "./tarjeta-producto";

interface PropsGrillaProductos {
  productos: Producto[];
  /** Mensaje cuando no hay productos que mostrar. */
  mensajeVacio?: string;
}

/**
 * Grilla responsive de productos: 4 columnas en desktop, 2 en tablet, 2 en mobile.
 * La foto del producto manda; estetica minimalista con mucho espacio en blanco.
 */
export function GrillaProductos({
  productos,
  mensajeVacio = "No hay productos disponibles.",
}: PropsGrillaProductos) {
  if (productos.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-texto">{mensajeVacio}</p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {productos.map((producto) => (
        <li key={producto.id}>
          <TarjetaProducto producto={producto} />
        </li>
      ))}
    </ul>
  );
}
