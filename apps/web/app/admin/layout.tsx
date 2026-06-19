"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ProveedorToast, BarraLateral, useSesionAdmin } from "@/components/admin";
import { Spinner } from "@/components/ui";

export default function LayoutAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // La pantalla de login no lleva chrome ni proteccion (gestiona su propio acceso).
  if (pathname === "/admin/login") {
    return <ProveedorToast>{children}</ProveedorToast>;
  }

  return (
    <ProveedorToast>
      <AreaProtegida>{children}</AreaProtegida>
    </ProveedorToast>
  );
}

function AreaProtegida({ children }: { children: ReactNode }) {
  const estado = useSesionAdmin();

  if (estado === "verificando") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner tamano="lg" etiqueta="Verificando sesion" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <BarraLateral />
      <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
