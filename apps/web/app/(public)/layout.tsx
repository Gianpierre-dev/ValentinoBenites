import { Encabezado, PieDePagina } from "@/components/layout";

/**
 * Layout del storefront publico: envuelve todas las rutas del grupo (public)
 * con el encabezado (logo, categorias, carrito) y el pie de pagina.
 */
export default function LayoutPublico({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="storefront contents">
      <Encabezado />
      <main className="flex-1">{children}</main>
      <PieDePagina />
    </div>
  );
}
