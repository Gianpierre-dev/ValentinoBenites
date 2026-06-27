import { IconBrandWhatsapp } from "@tabler/icons-react";

interface BotonWhatsappFlotanteProps {
  /** Enlace wa.me ya construido (con numero de negocio y mensaje pre-armado). */
  href: string;
}

/**
 * Boton flotante (FAB) de WhatsApp, fijo abajo a la derecha en todo el
 * storefront publico. Verde de marca WhatsApp (#25D366), accesible y con
 * micro-animacion de hover que respeta prefers-reduced-motion.
 *
 * z-40 deliberado: queda por DEBAJO del overlay del carrito-drawer (z-50) para
 * no competir con el cuando esta abierto. Solo se renderiza si hay numero
 * configurado (la decision se toma en el layout que arma el href).
 */
export function BotonWhatsappFlotante({ href }: BotonWhatsappFlotanteProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Pedir por WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 transition-transform duration-200 ease-out hover:scale-110 hover:shadow-xl focus-visible:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
    >
      <IconBrandWhatsapp size={30} stroke={2} aria-hidden />
    </a>
  );
}
