import type { MetadataRoute } from "next";
import { listarProductos } from "@/lib/api";
import { URL_SITIO } from "@/lib/sitio";

/**
 * Sitemap dinamico: paginas estaticas + una URL por producto activo, con
 * lastModified real (actualizadoEn del producto). Si la API no responde, el
 * sitemap degrada a las paginas estaticas en lugar de romper el build.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = [
    { url: URL_SITIO, changeFrequency: "daily", priority: 1 },
    { url: `${URL_SITIO}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${URL_SITIO}/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${URL_SITIO}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${URL_SITIO}/libro-de-reclamaciones`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const productos = await listarProductos();
    const fichas: MetadataRoute.Sitemap = productos.map((producto) => ({
      url: `${URL_SITIO}/producto/${producto.slug}`,
      lastModified: new Date(producto.actualizadoEn),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    return [...estaticas, ...fichas];
  } catch {
    return estaticas;
  }
}
