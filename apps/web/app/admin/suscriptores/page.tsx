"use client";

import { useState } from "react";
import { IconCopy, IconMail, IconTrash } from "@tabler/icons-react";
import { eliminarSuscriptor, listarSuscriptores } from "@/lib/api";
import type { Suscriptor } from "@/lib/tipos";
import {
  EncabezadoPagina,
  VistaCargando,
  VistaError,
  VistaVacia,
  useToast,
  useRecurso,
  mensajeDeError,
} from "@/components/admin";
import { Tarjeta, Boton } from "@/components/ui";

/**
 * Lista de suscriptores del newsletter. Incluye "Copiar correos" para que la
 * duena pueda pegarlos en su herramienta de envio (CCO, Mailchimp, etc.).
 */
export default function PaginaSuscriptores() {
  const { mostrarExito, mostrarError } = useToast();
  const { estado, recargar, fijarDatos } =
    useRecurso<Suscriptor[]>(listarSuscriptores);
  const [copiando, setCopiando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  /**
   * Baja solicitada por la persona (Ley 28493): la admin la ejecuta aqui.
   * Se confirma porque el borrado es definitivo.
   */
  async function darDeBaja(suscriptor: Suscriptor) {
    if (estado.tipo !== "listo") return;
    const confirmado = window.confirm(
      `¿Dar de baja a ${suscriptor.email}? Dejará de estar en tu lista de correos.`,
    );
    if (!confirmado) return;

    setEliminandoId(suscriptor.id);
    try {
      await eliminarSuscriptor(suscriptor.id);
      fijarDatos(estado.datos.filter((item) => item.id !== suscriptor.id));
      mostrarExito(`${suscriptor.email} se dio de baja.`);
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setEliminandoId(null);
    }
  }

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
        descripcion="Correos registrados en el newsletter. Si alguien pide darse de baja, elimínalo desde aquí."
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
                <span className="flex min-w-0 items-center gap-2 text-texto-fuerte">
                  <IconMail
                    className="h-4 w-4 shrink-0 text-texto/50"
                    aria-hidden
                  />
                  <span className="truncate">{suscriptor.email}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-texto/60">
                    {formatearFecha(suscriptor.creadoEn)}
                  </span>
                  <Boton
                    variante="fantasma"
                    tamano="sm"
                    cargando={eliminandoId === suscriptor.id}
                    aria-label={`Dar de baja a ${suscriptor.email}`}
                    onClick={() => void darDeBaja(suscriptor)}
                  >
                    <IconTrash className="h-4 w-4 text-oferta" aria-hidden />
                  </Boton>
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
