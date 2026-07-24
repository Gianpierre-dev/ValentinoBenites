import { z } from "zod";
import type { LineaCarrito } from "@/store/carrito";
import { formatearPrecio } from "@/lib/utilidades";

/** Esquema de validacion de los datos del cliente en el checkout. */
export const esquemaCheckout = z.object({
  nombreCliente: z
    .string()
    .trim()
    .min(3, "Ingresa tu nombre completo.")
    .max(120, "El nombre es demasiado largo."),
  telefono: z
    .string()
    .trim()
    .regex(/^9\d{8}$/, "Ingresa un celular valido de 9 digitos (empieza en 9)."),
  // Ley 29733: el consentimiento debe ser expreso y previo (checkbox no
  // premarcado). Sin aceptar la politica de privacidad no se registra el pedido.
  aceptaPrivacidad: z.boolean().refine((valor) => valor, {
    message: "Debes aceptar la Política de Privacidad para continuar.",
  }),
});

export type DatosCheckout = z.infer<typeof esquemaCheckout>;

/** Solo deja digitos de un numero (para armar el enlace wa.me). */
function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/**
 * Arma el mensaje de WhatsApp pre-formateado con el detalle del pedido.
 * El total es referencial; el backend recalcula al registrar el pedido.
 */
export function construirMensajeWhatsApp(
  datos: DatosCheckout,
  lineas: LineaCarrito[],
  total: number,
): string {
  const detalle = lineas
    .map(
      (linea) =>
        `• ${linea.nombre} (${linea.color}) x${linea.cantidad} — ${formatearPrecio(
          linea.precioUnitario * linea.cantidad,
        )}`,
    )
    .join("\n");

  return [
    "*Hola, quiero hacer un pedido:*",
    "",
    detalle,
    "",
    `*Total:* ${formatearPrecio(total)}`,
    "",
    "_Productos hechos a pedido, listos en ~24 h._",
    "",
    `Nombre: ${datos.nombreCliente}`,
    `Celular: ${datos.telefono}`,
  ].join("\n");
}

/**
 * Arma el mensaje de WhatsApp de CONSULTA con la lista de favoritos.
 * A diferencia del checkout, no es un pedido: abre una conversacion de venta
 * ("me interesan estos modelos"), sin cantidades ni datos del cliente.
 */
export function construirMensajeFavoritos(
  items: { nombre: string; precio: number; precioOferta: number | null; slug: string }[],
  origenSitio: string,
): string {
  const detalle = items
    .map((item) => {
      const precio = formatearPrecio(item.precioOferta ?? item.precio);
      return `• ${item.nombre} — ${precio}\n  ${origenSitio}/producto/${item.slug}`;
    })
    .join("\n");

  return [
    "*Hola, me interesan estos modelos:*",
    "",
    detalle,
    "",
    "¿Me puedes contar más sobre colores y disponibilidad?",
  ].join("\n");
}

/**
 * Construye el enlace wa.me con el mensaje codificado. Si no hay numero de
 * negocio configurado, devuelve null (el flujo debe avisar al usuario).
 */
export function construirEnlaceWhatsApp(
  numeroNegocio: string | null,
  mensaje: string,
): string | null {
  if (!numeroNegocio) return null;
  const numero = soloDigitos(numeroNegocio);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
