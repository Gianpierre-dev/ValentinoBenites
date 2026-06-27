import type { Metadata } from "next";
import { FormularioCheckout } from "@/components/tienda";
import { obtenerConfiguracion } from "@/lib/api";
import type { Configuracion } from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finaliza tu compra por WhatsApp o con Yape y Plin.",
};

/**
 * Checkout del storefront. Server component: carga la configuracion de la tienda
 * (numero de WhatsApp y datos Yape/Plin) y delega el flujo en el formulario cliente,
 * que lee el carrito persistido.
 */
export default async function PaginaCheckout() {
  const configuracion = await cargarConfiguracion();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-perla to-fondo">
      {/* Halo morado difuso para dar profundidad sin recargar. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-acento/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14 lg:px-8">
        <header className="max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight text-texto-fuerte sm:text-4xl">
            Finalizar compra
          </h1>
          <p className="mt-3 text-texto">
            Completa tus datos y elige cómo quieres pagar. Revisa tu pedido en el
            resumen antes de confirmar.
          </p>
        </header>

        <div className="mt-10">
          <FormularioCheckout configuracion={configuracion} />
        </div>
      </div>
    </div>
  );
}

async function cargarConfiguracion(): Promise<Configuracion | null> {
  try {
    return await obtenerConfiguracion();
  } catch {
    return null;
  }
}
