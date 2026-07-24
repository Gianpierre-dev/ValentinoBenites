import type { MetadataRoute } from "next";
import { URL_SITIO } from "@/lib/sitio";

/**
 * robots.txt: se indexa el catalogo publico; quedan fuera el panel admin y las
 * paginas transaccionales/personales (carrito, checkout, favoritos), que no
 * aportan a la busqueda y generan contenido delgado o duplicado.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/carrito", "/checkout", "/favoritos"],
    },
    sitemap: `${URL_SITIO}/sitemap.xml`,
  };
}
