/**
 * URL publica del sitio, base de canonicals, sitemap, robots y Open Graph.
 * Configurable via NEXT_PUBLIC_SITE_URL para cuando exista el dominio propio;
 * mientras tanto usa el dominio de Railway. NUNCA apuntar al dominio del sitio
 * viejo (esvalentinobenites.com): es de un tercero y regala la autoridad SEO.
 */
export const URL_SITIO =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://web-production-77a4c.up.railway.app";

export const NOMBRE_SITIO = "Valentino Benites";
