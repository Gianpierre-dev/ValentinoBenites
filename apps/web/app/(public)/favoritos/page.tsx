import type { Metadata } from "next";
import { obtenerConfiguracion } from "@/lib/api";
import { ListaFavoritos } from "./lista-favoritos";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Tus productos favoritos de Valentino Benites.",
};

/**
 * Pagina de favoritos. Resuelve en el servidor el numero de WhatsApp del
 * negocio (Configuracion) y delega la grilla al componente cliente, que lee
 * los favoritos persistidos en localStorage.
 */
export default async function PaginaFavoritos() {
  let numeroWhatsapp: string | null = null;
  try {
    const config = await obtenerConfiguracion();
    numeroWhatsapp = config.whatsapp;
  } catch {
    // Sin configuracion disponible: la pagina funciona igual, sin el boton.
  }

  return <ListaFavoritos numeroWhatsapp={numeroWhatsapp} />;
}
