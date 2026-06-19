import Link from "next/link";
import {
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconBrandTiktok,
} from "@tabler/icons-react";

const ANIO_ACTUAL = new Date().getFullYear();

const ENLACES_TIENDA = [
  { etiqueta: "Inicio", href: "/" },
  { etiqueta: "Catalogo", href: "/catalogo" },
  { etiqueta: "Carrito", href: "/carrito" },
];

const ENLACES_AYUDA = [
  { etiqueta: "Como comprar", href: "/catalogo" },
  { etiqueta: "Metodos de pago", href: "/catalogo" },
  { etiqueta: "Envios", href: "/catalogo" },
];

/**
 * Footer multicolumna estilo paez: marca, navegacion, ayuda y redes.
 * Las redes son enlaces base; los datos reales se conectaran desde Configuracion.
 */
export function PieDePagina() {
  return (
    <footer className="mt-16 border-t border-borde bg-fondo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-semibold uppercase tracking-[0.3em] text-texto-fuerte">
              Fabiola
            </p>
            <p className="mt-3 max-w-xs text-sm text-texto">
              Moda y accesorios para mujer. Calidad y estilo en cada detalle.
            </p>
          </div>

          <nav aria-label="Tienda">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
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

          <nav aria-label="Ayuda">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
              Ayuda
            </h2>
            <ul className="mt-4 space-y-2">
              {ENLACES_AYUDA.map((enlace) => (
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

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
              Siguenos
            </h2>
            <ul className="mt-4 flex items-center gap-4">
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-texto transition-colors hover:text-acento"
                >
                  <IconBrandInstagram size={22} stroke={1.5} aria-hidden />
                </a>
              </li>
              <li>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="text-texto transition-colors hover:text-acento"
                >
                  <IconBrandTiktok size={22} stroke={1.5} aria-hidden />
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="text-texto transition-colors hover:text-acento"
                >
                  <IconBrandWhatsapp size={22} stroke={1.5} aria-hidden />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-borde pt-6">
          <p className="text-xs text-texto">
            &copy; {ANIO_ACTUAL} Fabiola. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
