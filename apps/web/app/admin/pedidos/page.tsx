"use client";

import { useState } from "react";
import {
  IconBrandWhatsapp,
  IconQrcode,
  IconExternalLink,
  IconCheck,
  IconX,
  IconTool,
  IconTruck,
  IconBan,
} from "@tabler/icons-react";
import { listarPedidos, cambiarEstadoPedido } from "@/lib/api";
import type { EstadoPedido, MetodoPago, Pedido } from "@/lib/tipos";
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

const ETIQUETA_METODO: Record<MetodoPago, string> = {
  WHATSAPP: "WhatsApp",
  YAPE: "Yape",
  PLIN: "Plin",
  IZIPAY: "Izipay",
};

export default function PaginaPedidos() {
  const { mostrarExito, mostrarError } = useToast();
  const { estado, recargar, fijarDatos } = useRecurso<Pedido[]>(listarPedidos);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  async function cambiarEstado(pedido: Pedido, nuevoEstado: EstadoPedido) {
    if (estado.tipo !== "listo") return;
    setActualizandoId(pedido.id);
    try {
      const actualizado = await cambiarEstadoPedido(pedido.id, nuevoEstado);
      fijarDatos(estado.datos.map((item) => (item.id === actualizado.id ? actualizado : item)));
      mostrarExito(`Pedido ${pedido.codigo} marcado como ${ETIQUETA_ESTADO[nuevoEstado].toLowerCase()}.`);
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Pedidos"
        descripcion="Revisa los pedidos recibidos y valida sus comprobantes."
      />

      {estado.tipo === "cargando" && <VistaCargando etiqueta="Cargando pedidos" />}
      {estado.tipo === "error" && <VistaError mensaje={estado.mensaje} alReintentar={recargar} />}

      {estado.tipo === "listo" && estado.datos.length === 0 && (
        <VistaVacia>Aun no has recibido pedidos.</VistaVacia>
      )}

      {estado.tipo === "listo" && estado.datos.length > 0 && (
        <div className="flex flex-col gap-4">
          {estado.datos.map((pedido) => (
            <TarjetaPedido
              key={pedido.id}
              pedido={pedido}
              actualizando={actualizandoId === pedido.id}
              alCambiarEstado={cambiarEstado}
            />
          ))}
        </div>
      )}
    </>
  );
}

const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagado",
  EN_PRODUCCION: "En producción",
  ENVIADO: "Enviado",
  CANCELADO: "Cancelado",
  RECHAZADO: "Rechazado",
};

const VARIANTE_ESTADO: Record<EstadoPedido, "advertencia" | "exito" | "oferta"> = {
  PENDIENTE_PAGO: "advertencia",
  PAGADO: "exito",
  EN_PRODUCCION: "advertencia",
  ENVIADO: "exito",
  CANCELADO: "oferta",
  RECHAZADO: "oferta",
};

// Espeja la maquina de estados del backend (apps/api/src/pedidos/maquina-estados.ts).
// Las acciones visibles se derivan del estado actual del pedido; los estados
// terminales (ENVIADO, CANCELADO, RECHAZADO) no ofrecen transiciones.
const TRANSICIONES: Record<EstadoPedido, readonly EstadoPedido[]> = {
  PENDIENTE_PAGO: ["PAGADO", "RECHAZADO", "CANCELADO"],
  PAGADO: ["EN_PRODUCCION", "CANCELADO"],
  EN_PRODUCCION: ["ENVIADO", "CANCELADO"],
  ENVIADO: [],
  CANCELADO: [],
  RECHAZADO: [],
};

interface AccionEstado {
  etiqueta: string;
  Icono: typeof IconCheck;
  variante: "secundario" | "peligro";
  destructivo?: boolean;
}

const ACCION_POR_ESTADO: Record<EstadoPedido, AccionEstado> = {
  PAGADO: { etiqueta: "Marcar pagado", Icono: IconCheck, variante: "secundario" },
  EN_PRODUCCION: { etiqueta: "Pasar a produccion", Icono: IconTool, variante: "secundario" },
  ENVIADO: { etiqueta: "Marcar enviado", Icono: IconTruck, variante: "secundario" },
  RECHAZADO: { etiqueta: "Rechazar", Icono: IconX, variante: "peligro", destructivo: true },
  CANCELADO: { etiqueta: "Cancelar", Icono: IconBan, variante: "peligro", destructivo: true },
  PENDIENTE_PAGO: { etiqueta: "Volver a pendiente", Icono: IconCheck, variante: "secundario" },
};

interface PropsTarjetaPedido {
  pedido: Pedido;
  actualizando: boolean;
  alCambiarEstado: (pedido: Pedido, estado: EstadoPedido) => void;
}

function TarjetaPedido({ pedido, actualizando, alCambiarEstado }: PropsTarjetaPedido) {
  return (
    <Tarjeta className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-texto-fuerte">{pedido.codigo}</span>
            <Etiqueta variante={VARIANTE_ESTADO[pedido.estado]}>
              {ETIQUETA_ESTADO[pedido.estado]}
            </Etiqueta>
          </div>
          <p className="mt-1 text-sm text-texto">
            {pedido.nombreCliente} · {pedido.telefono}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-texto/60">
            {pedido.metodoPago === "WHATSAPP" ? (
              <IconBrandWhatsapp className="h-4 w-4" aria-hidden />
            ) : (
              <IconQrcode className="h-4 w-4" aria-hidden />
            )}
            {ETIQUETA_METODO[pedido.metodoPago]} · {formatearFecha(pedido.creadoEn)}
          </p>
        </div>
        <span className="text-lg font-semibold text-texto-fuerte">
          {formatearPrecio(pedido.total)}
        </span>
      </div>

      <ul className="mt-4 divide-y divide-borde border-y border-borde text-sm">
        {pedido.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-2">
            <span className="text-texto">
              {item.cantidad} × {item.nombreProducto}
              {item.colorElegido && (
                <span className="text-texto/60"> · Color: {item.colorElegido}</span>
              )}
            </span>
            <span className="text-texto-fuerte">{formatearPrecio(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {pedido.comprobanteUrl ? (
          <a
            href={pedido.comprobanteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-acento underline underline-offset-4"
          >
            <IconExternalLink className="h-4 w-4" aria-hidden />
            Ver comprobante
          </a>
        ) : (
          <span className="text-sm text-texto/50">Sin comprobante adjunto</span>
        )}

        <div className="flex flex-wrap gap-2">
          {TRANSICIONES[pedido.estado].length === 0 ? (
            <span className="text-sm text-texto/50">Pedido finalizado</span>
          ) : (
            TRANSICIONES[pedido.estado].map((destino) => {
              const accion = ACCION_POR_ESTADO[destino];
              const Icono = accion.Icono;
              return (
                <Boton
                  key={destino}
                  variante={accion.variante}
                  tamano="sm"
                  cargando={actualizando}
                  onClick={() => alCambiarEstado(pedido, destino)}
                >
                  <Icono className="h-4 w-4" aria-hidden />
                  {accion.etiqueta}
                </Boton>
              );
            })
          )}
        </div>
      </div>
    </Tarjeta>
  );
}

function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
