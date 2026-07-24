import Image from "next/image";
import Link from "next/link";
import {
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandWhatsapp,
  IconBrandTiktok,
} from "@tabler/icons-react";
import type { ComponentType } from "react";
import { obtenerConfiguracion } from "@/lib/api";

const ANIO_ACTUAL = new Date().getFullYear();

const ENLACES_TIENDA = [
  { etiqueta: "Inicio", href: "/" },
  { etiqueta: "Catalogo", href: "/catalogo" },
  { etiqueta: "Carrito", href: "/carrito" },
];

// Informacion legal exigida por la normativa peruana (Ley 29571 / Ley 29733).
const ENLACES_LEGALES = [
  { etiqueta: "Términos y Condiciones", href: "/terminos" },
  { etiqueta: "Política de Privacidad", href: "/privacidad" },
  { etiqueta: "Libro de Reclamaciones", href: "/libro-de-reclamaciones" },
];

interface RedSocial {
  nombre: string;
  url: string;
  Icono: ComponentType<{ size?: number; stroke?: number; "aria-hidden"?: boolean }>;
}

/**
 * Construye la lista de redes a partir de la configuracion (administrable desde
 * el panel admin). Solo se incluyen las redes con un usuario/numero cargado.
 * Se guarda el handle; aqui se arma la URL final.
 */
function construirRedes(config: {
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  whatsapp: string | null;
}): RedSocial[] {
  const redes: RedSocial[] = [];
  if (config.instagram) {
    redes.push({
      nombre: "Instagram",
      url: `https://instagram.com/${config.instagram}`,
      Icono: IconBrandInstagram,
    });
  }
  if (config.facebook) {
    redes.push({
      nombre: "Facebook",
      url: `https://facebook.com/${config.facebook}`,
      Icono: IconBrandFacebook,
    });
  }
  if (config.tiktok) {
    redes.push({
      nombre: "TikTok",
      url: `https://tiktok.com/@${config.tiktok}`,
      Icono: IconBrandTiktok,
    });
  }
  if (config.whatsapp) {
    redes.push({
      nombre: "WhatsApp",
      url: `https://wa.me/${config.whatsapp.replace(/\D/g, "")}`,
      Icono: IconBrandWhatsapp,
    });
  }
  return redes;
}

/**
 * Footer multicolumna estilo paez: marca, navegacion, ayuda y redes.
 * Las redes se leen de Configuracion; degrada sin romper si la API no responde.
 */
export async function PieDePagina() {
  let redes: RedSocial[] = [];
  let razonSocial: string | null = null;
  let ruc: string | null = null;
  try {
    const config = await obtenerConfiguracion();
    redes = construirRedes(config);
    razonSocial = config.razonSocial;
    ruc = config.ruc;
  } catch {
    redes = [];
  }

  return (
    <footer className="mt-16 border-t border-acento/10 bg-rosa-fuerte">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-valentino.png"
                alt="Valentino Benites"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
              <p className="text-base font-semibold uppercase tracking-[0.25em] text-texto-fuerte">
                Valentino Benites
              </p>
            </div>
            <p className="mt-3 max-w-xs text-sm text-texto">
              Moda y accesorios para mujer. Calidad y estilo en cada detalle.
            </p>
          </div>

          <nav aria-label="Tienda">
            <h2 className="titulo-ui text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
              Tienda
            </h2>
            <ul className="mt-4 space-y-2">
              {ENLACES_TIENDA.map((enlace) => (
                <li key={enlace.etiqueta}>
                  <Link
                    href={enlace.href}
                    className="text-sm text-texto transition-colors hover:text-acento"
                  >
                    {enlace.etiqueta}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className="titulo-ui text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
              Legal
            </h2>
            <ul className="mt-4 space-y-2">
              {ENLACES_LEGALES.map((enlace) => (
                <li key={enlace.etiqueta}>
                  <Link
                    href={enlace.href}
                    className="text-sm text-texto transition-colors hover:text-acento"
                  >
                    {enlace.etiqueta}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {redes.length > 0 && (
            <div>
              <h2 className="titulo-ui text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
                Siguenos
              </h2>
              <ul className="mt-4 flex items-center gap-4">
                {redes.map(({ nombre, url, Icono }) => (
                  <li key={nombre}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={nombre}
                      className="text-texto transition-colors hover:text-acento"
                    >
                      <Icono size={22} stroke={1.5} aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-10 border-t border-acento/10 pt-6">
          <p className="text-xs text-texto">
            &copy; {ANIO_ACTUAL} {razonSocial ?? "Valentino Benites"}
            {ruc ? ` · RUC ${ruc}` : ""}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
