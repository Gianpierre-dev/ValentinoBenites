import {
  BotonWhatsappFlotante,
  Encabezado,
  PieDePagina,
} from "@/components/layout";
import { CarritoDrawer } from "@/components/tienda";
import { obtenerConfiguracion } from "@/lib/api";
import { construirEnlaceWhatsApp } from "@/lib/checkout";

const MENSAJE_WHATSAPP = "Hola, quiero hacer un pedido de Valentino Benites.";

/**
 * Resuelve el enlace wa.me del FAB a partir del numero de negocio en
 * Configuracion. Degrada sin romper: si la API no responde o no hay numero
 * cargado, devuelve null y el FAB no se renderiza (evita un wa.me roto).
 */
async function resolverEnlaceWhatsapp(): Promise<string | null> {
  try {
    const config = await obtenerConfiguracion();
    return construirEnlaceWhatsApp(config.whatsapp, MENSAJE_WHATSAPP);
  } catch {
    return null;
  }
}

/**
 * Layout del storefront publico: envuelve todas las rutas del grupo (public)
 * con el encabezado (logo, categorias, carrito) y el pie de pagina.
 */
export default async function LayoutPublico({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const enlaceWhatsapp = await resolverEnlaceWhatsapp();

  return (
    <div className="storefront contents">
      <Encabezado />
      <main className="flex-1">{children}</main>
      <PieDePagina />
      <CarritoDrawer />
      {enlaceWhatsapp && <BotonWhatsappFlotante href={enlaceWhatsapp} />}
    </div>
  );
}
