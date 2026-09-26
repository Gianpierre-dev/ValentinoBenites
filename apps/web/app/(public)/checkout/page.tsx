import { Suspense } from "react";
import type { Metadata } from "next";
import { FormularioCheckout } from "@/components/tienda";
import { Spinner } from "@/components/ui";
import { listarBilleteras, obtenerConfiguracion } from "@/lib/api";
import type { Billetera, Configuracion } from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finaliza tu compra por WhatsApp o pagando con QR.",
};

/**
 * Checkout del storefront. Server component: carga la configuracion (numero de
 * WhatsApp) y las billeteras activas (Yape, Plin, Agora... administrables desde
 * el panel), y delega el flujo en el formulario cliente, que lee el carrito.
 */
export default async function PaginaCheckout() {
  const [configuracion, billeteras] = await Promise.all([
    cargarConfiguracion(),
    cargarBilleteras(),
  ]);

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-rosa-fuerte to-fondo">
      {/* Halo morado difuso para dar profundidad sin recargar. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-acento/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14 lg:px-8">
        {/* El encabezado vive en el formulario: en la confirmación no corresponde. */}
        {/* El formulario lee ?pedido= con useSearchParams: requiere un Suspense. */}
        <Suspense
          fallback={
            <div className="flex justify-center py-24">
              <Spinner tamano="lg" etiqueta="Cargando checkout" />
            </div>
          }
        >
          <FormularioCheckout configuracion={configuracion} billeteras={billeteras} />
        </Suspense>
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

async function cargarBilleteras(): Promise<Billetera[]> {
  try {
    return await listarBilleteras();
  } catch {
    return [];
  }
}
