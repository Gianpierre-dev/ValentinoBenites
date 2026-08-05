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
import { listarPedidos, cambiarEstadoPedido, actualizarEnvioPedido } from "@/lib/api";
import type { EstadoPedido, Pedido } from "@/lib/tipos";
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
import { Tarjeta, Etiqueta, Boton, Input } from "@/components/ui";

// El metodo de pago llega como snapshot legible ("WhatsApp", "Yape", "Agora");
// se muestra tal cual. Solo WhatsApp tiene icono propio (coordinacion vs QR).
const METODO_WHATSAPP = "WhatsApp";

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

  async function guardarEnvio(
    pedido: Pedido,
    datos: { costoEnvio: number; direccionEntrega?: string },
  ) {
    if (estado.tipo !== "listo") return;
    setActualizandoId(pedido.id);
    try {
      const actualizado = await actualizarEnvioPedido(pedido.id, datos);
      fijarDatos(
        estado.datos.map((item) => (item.id === actualizado.id ? actualizado : item)),
      );
      mostrarExito(`Envío del pedido ${pedido.codigo} guardado.`);
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
              alGuardarEnvio={guardarEnvio}
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
  alGuardarEnvio: (
    pedido: Pedido,
    datos: { costoEnvio: number; direccionEntrega?: string },
  ) => void;
}

function TarjetaPedido({
  pedido,
  actualizando,
  alCambiarEstado,
  alGuardarEnvio,
}: PropsTarjetaPedido) {
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
            {pedido.metodoPago === METODO_WHATSAPP ? (
              <IconBrandWhatsapp className="h-4 w-4" aria-hidden />
            ) : (
              <IconQrcode className="h-4 w-4" aria-hidden />
            )}
            {pedido.metodoPago} · {formatearFecha(pedido.creadoEn)}
          </p>
        </div>
        <span className="text-lg font-semibold text-texto-fuerte">
          {formatearPrecio(pedido.total)}
        </span>
      </div>

      <ul className="mt-4 divide-y divide-borde border-t border-borde text-sm">
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

      <dl className="border-y border-borde py-3 text-sm">
        <div className="flex justify-between text-texto">
          <dt>Subtotal productos</dt>
          <dd>{formatearPrecio(pedido.subtotal)}</dd>
        </div>
        <div className="mt-1 flex justify-between text-texto">
          <dt>Envío</dt>
          <dd>
            {pedido.costoEnvio > 0
              ? formatearPrecio(pedido.costoEnvio)
              : "Por coordinar"}
          </dd>
        </div>
        <div className="mt-1 flex justify-between font-semibold text-texto-fuerte">
          <dt>Total</dt>
          <dd>{formatearPrecio(pedido.total)}</dd>
        </div>
      </dl>

      <BloqueEnvio
        pedido={pedido}
        actualizando={actualizando}
        alGuardar={alGuardarEnvio}
      />

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

interface PropsBloqueEnvio {
  pedido: Pedido;
  actualizando: boolean;
  alGuardar: (
    pedido: Pedido,
    datos: { costoEnvio: number; direccionEntrega?: string },
  ) => void;
}

// Estados donde el envío ya no se edita (espeja ESTADOS_ENVIO_CERRADO del backend).
const ENVIO_CERRADO: ReadonlySet<EstadoPedido> = new Set([
  "ENVIADO",
  "CANCELADO",
  "RECHAZADO",
]);

/**
 * Registro del envío coordinado por WhatsApp: costo y dirección exacta. Al
 * guardar, el backend recalcula el total (subtotal + envío). Se oculta la
 * edición cuando el pedido ya está despachado o cerrado.
 */
function BloqueEnvio({ pedido, actualizando, alGuardar }: PropsBloqueEnvio) {
  const [costo, setCosto] = useState(
    pedido.costoEnvio > 0 ? String(pedido.costoEnvio) : "",
  );
  const [direccion, setDireccion] = useState(pedido.direccionEntrega ?? "");
  const editable = !ENVIO_CERRADO.has(pedido.estado);

  const guardar = () => {
    const valor = Number(costo);
    if (!Number.isFinite(valor) || valor < 0) return;
    alGuardar(pedido, {
      costoEnvio: valor,
      direccionEntrega: direccion.trim() || undefined,
    });
  };

  return (
    <section className="mt-4 rounded-lg bg-perla p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-texto-fuerte">
        <IconTruck className="h-4 w-4" aria-hidden />
        Envío
      </div>
      {pedido.ciudadEntrega && (
        <p className="mt-1 text-xs text-texto/70">
          Ciudad indicada por el cliente:{" "}
          <span className="font-medium text-texto-fuerte">
            {pedido.ciudadEntrega}
          </span>
        </p>
      )}

      {editable ? (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:w-40">
            <Input
              etiqueta="Costo de envío (S/)"
              type="number"
              min={0}
              step="0.5"
              inputMode="decimal"
              placeholder="0.00"
              value={costo}
              onChange={(evento) => setCosto(evento.target.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              etiqueta="Dirección de entrega"
              placeholder="Av. ..., distrito, ciudad"
              value={direccion}
              onChange={(evento) => setDireccion(evento.target.value)}
            />
          </div>
          <Boton
            variante="secundario"
            tamano="sm"
            cargando={actualizando}
            onClick={guardar}
          >
            Guardar envío
          </Boton>
        </div>
      ) : (
        <p className="mt-2 text-sm text-texto">
          {pedido.direccionEntrega ?? "Sin dirección registrada"}
          {pedido.costoEnvio > 0 && ` · ${formatearPrecio(pedido.costoEnvio)}`}
        </p>
      )}
    </section>
  );
}

function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
