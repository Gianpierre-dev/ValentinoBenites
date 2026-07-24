"use client";

import { useState } from "react";
import { IconCopy, IconMail } from "@tabler/icons-react";
import { listarSuscriptores } from "@/lib/api";
import type { Suscriptor } from "@/lib/tipos";
import {
  EncabezadoPagina,
  VistaCargando,
  VistaError,
  VistaVacia,
  useToast,
  useRecurso,
} from "@/components/admin";
import { Tarjeta, Boton } from "@/components/ui";

/**
 * Lista de suscriptores del newsletter. Incluye "Copiar correos" para que la
 * duena pueda pegarlos en su herramienta de envio (CCO, Mailchimp, etc.).
 */
export default function PaginaSuscriptores() {
  const { mostrarExito, mostrarError } = useToast();
  const { estado, recargar } = useRecurso<Suscriptor[]>(listarSuscriptores);
  const [copiando, setCopiando] = useState(false);

  async function copiarCorreos() {
    if (estado.tipo !== "listo") return;
    setCopiando(true);
    try {
      await navigator.clipboard.writeText(
        estado.datos.map((s) => s.email).join(", "),
      );
      mostrarExito("Correos copiados al portapapeles.");
    } catch {
      mostrarError("No se pudieron copiar los correos.");
    } finally {
      setCopiando(false);
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Suscriptores"
        descripcion="Correos registrados en el newsletter de la tienda."
      />

      {estado.tipo === "cargando" && (
        <VistaCargando etiqueta="Cargando suscriptores" />
      )}
      {estado.tipo === "error" && (
        <VistaError mensaje={estado.mensaje} alReintentar={recargar} />
      )}

      {estado.tipo === "listo" && estado.datos.length === 0 && (
        <VistaVacia>Aún no hay suscriptores.</VistaVacia>
      )}

      {estado.tipo === "listo" && estado.datos.length > 0 && (
        <Tarjeta className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-texto">
              {estado.datos.length}{" "}
              {estado.datos.length === 1 ? "suscriptor" : "suscriptores"}
            </p>
            <Boton
              variante="secundario"
              tamano="sm"
              cargando={copiando}
              onClick={() => void copiarCorreos()}
            >
              <IconCopy className="h-4 w-4" aria-hidden />
              Copiar correos
            </Boton>
          </div>

          <ul className="mt-4 divide-y divide-borde border-t border-borde text-sm">
            {estado.datos.map((suscriptor) => (
              <li
                key={suscriptor.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-texto-fuerte">
                  <IconMail className="h-4 w-4 text-texto/50" aria-hidden />
                  {suscriptor.email}
                </span>
                <span className="text-xs text-texto/60">
                  {formatearFecha(suscriptor.creadoEn)}
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}
    </>
  );
}

function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}
