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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-texto-fuerte">
        Finalizar compra
      </h1>
      <p className="mt-2 text-texto">
        Completa tus datos y elige como quieres pagar.
      </p>

      <div className="mt-10">
        <FormularioCheckout configuracion={configuracion} />
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
