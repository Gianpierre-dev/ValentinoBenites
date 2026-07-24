"use client";

import { useState } from "react";
import { IconSend } from "@tabler/icons-react";
import { listarReclamos, responderReclamo } from "@/lib/api";
import type { Reclamo, TipoReclamo } from "@/lib/tipos";
import { formatearPrecio } from "@/lib/utilidades";
import {
  EncabezadoPagina,
  VistaCargando,
  VistaError,
  VistaVacia,
  useToast,
  useRecurso,
  mensajeDeError,
} from "@/components/admin";
import { Tarjeta, Etiqueta, Boton } from "@/components/ui";

const ETIQUETA_TIPO: Record<TipoReclamo, string> = {
  RECLAMO: "Reclamo",
  QUEJA: "Queja",
};

/**
 * Gestion del Libro de Reclamaciones (Ley 29571): lista las hojas registradas
 * y permite responderlas. El plazo legal de respuesta es de 15 dias habiles
 * desde el registro; las hojas proximas a vencer se marcan en la lista.
 */
export default function PaginaReclamos() {
  const { mostrarExito, mostrarError } = useToast();
  const { estado, recargar, fijarDatos } = useRecurso<Reclamo[]>(listarReclamos);
  const [respondiendoId, setRespondiendoId] = useState<string | null>(null);

  async function responder(reclamo: Reclamo, respuesta: string) {
    if (estado.tipo !== "listo") return;
    setRespondiendoId(reclamo.id);
    try {
      const actualizado = await responderReclamo(reclamo.id, respuesta);
      fijarDatos(
        estado.datos.map((item) => (item.id === actualizado.id ? actualizado : item)),
      );
      mostrarExito(`Reclamo ${reclamo.codigo} respondido.`);
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setRespondiendoId(null);
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Libro de Reclamaciones"
        descripcion="Responde cada hoja en un plazo máximo de 15 días hábiles (Ley 29571)."
      />

      {estado.tipo === "cargando" && <VistaCargando etiqueta="Cargando reclamos" />}
      {estado.tipo === "error" && (
        <VistaError mensaje={estado.mensaje} alReintentar={recargar} />
      )}

      {estado.tipo === "listo" && estado.datos.length === 0 && (
        <VistaVacia>No hay reclamos ni quejas registrados.</VistaVacia>
      )}

      {estado.tipo === "listo" && estado.datos.length > 0 && (
        <div className="flex flex-col gap-4">
          {estado.datos.map((reclamo) => (
            <TarjetaReclamo
              key={reclamo.id}
              reclamo={reclamo}
              respondiendo={respondiendoId === reclamo.id}
              alResponder={responder}
            />
          ))}
        </div>
      )}
    </>
  );
}

interface PropsTarjetaReclamo {
  reclamo: Reclamo;
  respondiendo: boolean;
  alResponder: (reclamo: Reclamo, respuesta: string) => void;
}

function TarjetaReclamo({ reclamo, respondiendo, alResponder }: PropsTarjetaReclamo) {
  const [respuesta, setRespuesta] = useState("");
  const pendiente = reclamo.estado === "PENDIENTE";

  return (
    <Tarjeta className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-texto-fuerte">{reclamo.codigo}</span>
            <Etiqueta variante={reclamo.tipo === "RECLAMO" ? "oferta" : "advertencia"}>
              {ETIQUETA_TIPO[reclamo.tipo]}
            </Etiqueta>
            <Etiqueta variante={pendiente ? "advertencia" : "exito"}>
              {pendiente ? "Pendiente" : "Respondido"}
            </Etiqueta>
          </div>
          <p className="mt-1 text-sm text-texto">
            {reclamo.nombreCompleto} · Doc. {reclamo.documento} · {reclamo.telefono}
            {reclamo.email ? ` · ${reclamo.email}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-texto/60">
            Registrado el {formatearFecha(reclamo.creadoEn)}
            {pendiente && ` · Responder antes de 15 días hábiles`}
          </p>
        </div>
        {reclamo.montoReclamado !== null && (
          <span className="text-lg font-semibold text-texto-fuerte">
            {formatearPrecio(reclamo.montoReclamado)}
          </span>
        )}
      </div>

      <dl className="mt-4 space-y-3 border-y border-borde py-4 text-sm">
        <div>
          <dt className="font-medium text-texto-fuerte">Producto o servicio</dt>
          <dd className="mt-0.5 text-texto">{reclamo.descripcionBien}</dd>
        </div>
        <div>
          <dt className="font-medium text-texto-fuerte">Detalle</dt>
          <dd className="mt-0.5 whitespace-pre-line text-texto">{reclamo.detalle}</dd>
        </div>
        <div>
          <dt className="font-medium text-texto-fuerte">Pedido del consumidor</dt>
          <dd className="mt-0.5 whitespace-pre-line text-texto">
            {reclamo.pedidoConsumidor}
          </dd>
        </div>
        {reclamo.esMenorDeEdad && reclamo.apoderado && (
          <div>
            <dt className="font-medium text-texto-fuerte">Apoderado (menor de edad)</dt>
            <dd className="mt-0.5 text-texto">{reclamo.apoderado}</dd>
          </div>
        )}
      </dl>

      {pendiente ? (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(evento) => {
            evento.preventDefault();
            if (respuesta.trim().length >= 10) {
              alResponder(reclamo, respuesta.trim());
            }
          }}
        >
          <label
            htmlFor={`respuesta-${reclamo.id}`}
            className="text-sm font-medium text-texto-fuerte"
          >
            Respuesta al consumidor
          </label>
          <textarea
            id={`respuesta-${reclamo.id}`}
            rows={3}
            value={respuesta}
            onChange={(evento) => setRespuesta(evento.target.value)}
            placeholder="Describe la solución ofrecida al consumidor (mínimo 10 caracteres)."
            className="w-full rounded-lg border border-borde bg-fondo px-3 py-2 text-sm text-texto-fuerte outline-none transition-colors placeholder:text-texto/50 focus:border-acento"
          />
          <div className="flex justify-end">
            <Boton
              type="submit"
              tamano="sm"
              cargando={respondiendo}
              disabled={respuesta.trim().length < 10}
            >
              <IconSend className="h-4 w-4" aria-hidden />
              Enviar respuesta
            </Boton>
          </div>
        </form>
      ) : (
        <div className="mt-4 rounded-lg bg-perla px-4 py-3 text-sm">
          <p className="font-medium text-texto-fuerte">Respuesta enviada</p>
          <p className="mt-1 whitespace-pre-line text-texto">{reclamo.respuesta}</p>
          {reclamo.respondidoEn && (
            <p className="mt-1 text-xs text-texto/60">
              Respondido el {formatearFecha(reclamo.respondidoEn)}
            </p>
          )}
        </div>
      )}
    </Tarjeta>
  );
}

function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
