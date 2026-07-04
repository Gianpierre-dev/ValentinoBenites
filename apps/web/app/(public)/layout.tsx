import {
  BarraAnuncios,
  BotonWhatsappFlotante,
  Encabezado,
  PieDePagina,
} from "@/components/layout";
import { CarritoDrawer } from "@/components/tienda";
import { obtenerConfiguracion } from "@/lib/api";
import { construirEnlaceWhatsApp } from "@/lib/checkout";
import type { Configuracion } from "@/lib/tipos";

const MENSAJE_WHATSAPP = "Hola, quiero hacer un pedido de Valentino Benites.";

/** Datos del layout que la clienta administra desde el panel de configuracion. */
interface DatosLayout {
  enlaceWhatsapp: string | null;
  barraActiva: boolean;
  barraAnuncios: string[];
}

/**
 * Resuelve la configuracion que necesita el layout (FAB de WhatsApp y barra de
 * anuncios) en una sola carga. Degrada sin romper: si la API no responde, el FAB
 * se oculta y la barra queda activa con su mensaje por defecto.
 */
async function resolverDatosLayout(): Promise<DatosLayout> {
  try {
    const config: Configuracion = await obtenerConfiguracion();
    return {
      enlaceWhatsapp: construirEnlaceWhatsApp(config.whatsapp, MENSAJE_WHATSAPP),
      barraActiva: config.barraActiva,
      barraAnuncios: config.barraAnuncios ?? [],
    };
  } catch {
    return { enlaceWhatsapp: null, barraActiva: true, barraAnuncios: [] };
  }
}

/**
 * Layout del storefront publico: envuelve todas las rutas del grupo (public)
 * con la barra de anuncios, el encabezado (logo, categorias, carrito) y el pie.
 */
export default async function LayoutPublico({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { enlaceWhatsapp, barraActiva, barraAnuncios } =
    await resolverDatosLayout();

  return (
    <div className="storefront contents">
      <BarraAnuncios mensajes={barraAnuncios} activa={barraActiva} />
      <Encabezado />
      <main className="flex-1">{children}</main>
      <PieDePagina />
      <CarritoDrawer />
      {enlaceWhatsapp && <BotonWhatsappFlotante href={enlaceWhatsapp} />}
    </div>
  );
}
