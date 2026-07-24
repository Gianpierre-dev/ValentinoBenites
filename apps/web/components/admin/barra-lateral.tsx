"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconLayoutDashboard,
  IconShoppingBag,
  IconCategory,
  IconReceipt,
  IconSettings,
  IconLogout,
  IconArrowMerge,
  IconBook2,
} from "@tabler/icons-react";
import { cerrarSesion } from "@/lib/api";
import { cn } from "@/lib/utilidades";

interface EnlaceNav {
  href: string;
  etiqueta: string;
  Icono: typeof IconLayoutDashboard;
}

const ENLACES: readonly EnlaceNav[] = [
  { href: "/admin", etiqueta: "Resumen", Icono: IconLayoutDashboard },
  { href: "/admin/productos", etiqueta: "Productos", Icono: IconShoppingBag },
  { href: "/admin/categorias", etiqueta: "Categorias", Icono: IconCategory },
  { href: "/admin/pedidos", etiqueta: "Pedidos", Icono: IconReceipt },
  { href: "/admin/reclamos", etiqueta: "Reclamos", Icono: IconBook2 },
  { href: "/admin/migracion", etiqueta: "Migracion", Icono: IconArrowMerge },
  { href: "/admin/configuracion", etiqueta: "Configuracion", Icono: IconSettings },
];

/** Navegacion lateral del panel admin con marcado de la ruta activa. */
export function BarraLateral() {
  const pathname = usePathname();
  const router = useRouter();

  function cerrar() {
    cerrarSesion();
    router.replace("/admin/login");
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-borde bg-fondo md:h-screen md:w-60 md:border-r">
      <div className="border-b border-borde px-6 py-5">
        <Link
          href="/admin"
          aria-label="Valentino Benites, ir al panel"
          className="flex items-center gap-2.5 text-texto-fuerte"
        >
          <Image
            src="/logo-valentino.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
          />
          <span className="text-base font-semibold uppercase tracking-[0.2em]">
            Valentino Benites
          </span>
        </Link>
        <p className="mt-1 text-xs uppercase tracking-wide text-texto/60">Panel de gestion</p>
      </div>

      <nav aria-label="Navegacion del panel" className="flex flex-1 flex-col gap-1 p-3">
        {ENLACES.map(({ href, etiqueta, Icono }) => {
          const activo = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                activo
                  ? "bg-acento text-acento-contraste"
                  : "text-texto hover:bg-black/[.04]",
              )}
            >
              <Icono className="h-5 w-5" aria-hidden />
              {etiqueta}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-borde p-3">
        <button
          type="button"
          onClick={cerrar}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-texto transition-colors hover:bg-black/[.04]"
        >
          <IconLogout className="h-5 w-5" aria-hidden />
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
