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
  IconCash,
} from "@tabler/icons-react";
import {
  listarPedidos,
  cambiarEstadoPedido,
  actualizarEnvioPedido,
  registrarPagoEnvio,
} from "@/lib/api";
import type { EstadoEnvio, EstadoPedido, Pedido } from "@/lib/tipos";
import { colorVisible, formatearPrecio } from "@/lib/utilidades";
import {
  EncabezadoPagina,
  VistaCargando,
  VistaError,
  VistaVacia,
  ModalConfirmacion,
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
  // Cambio de estado a la espera de confirmación: todos son irreversibles.
  const [porConfirmar, setPorConfirmar] = useState<{
    pedido: Pedido;
    destino: EstadoPedido;
  } | null>(null);
  // Pedido cuyo pago del envío se va a registrar, a la espera de confirmación.
  const [envioPorCobrar, setEnvioPorCobrar] = useState<Pedido | null>(null);

  function reemplazarPedido(actualizado: Pedido) {
    if (estado.tipo !== "listo") return;
    fijarDatos(estado.datos.map((item) => (item.id === actualizado.id ? actualizado : item)));
  }

  async function cambiarEstado(pedido: Pedido, nuevoEstado: EstadoPedido) {
    if (estado.tipo !== "listo") return;
    setActualizandoId(pedido.id);
    try {
      reemplazarPedido(await cambiarEstadoPedido(pedido.id, nuevoEstado));
      mostrarExito(`Pedido ${pedido.codigo} marcado como ${ETIQUETA_ESTADO[nuevoEstado].toLowerCase()}.`);
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setActualizandoId(null);
    }
  }

  async function guardarEnvio(pedido: Pedido, datos: DatosEnvio) {
    if (estado.tipo !== "listo") return;
    setActualizandoId(pedido.id);
    try {
      reemplazarPedido(await actualizarEnvioPedido(pedido.id, datos));
      mostrarExito(`Envío del pedido ${pedido.codigo} guardado.`);
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setActualizandoId(null);
    }
  }

  async function cobrarEnvio(pedido: Pedido) {
    if (estado.tipo !== "listo") return;
    setActualizandoId(pedido.id);
    try {
      reemplazarPedido(await registrarPagoEnvio(pedido.id, pedido.costoEnvio));
      mostrarExito(`Pago del envío del pedido ${pedido.codigo} registrado.`);
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
        <VistaVacia>Aún no has recibido pedidos.</VistaVacia>
      )}

      {estado.tipo === "listo" && estado.datos.length > 0 && (
        <div className="flex flex-col gap-4">
          {estado.datos.map((pedido) => (
            <TarjetaPedido
              key={pedido.id}
              pedido={pedido}
              actualizando={actualizandoId === pedido.id}
              alCambiarEstado={(p, destino) => setPorConfirmar({ pedido: p, destino })}
              alGuardarEnvio={guardarEnvio}
              alCobrarEnvio={setEnvioPorCobrar}
            />
          ))}
        </div>
      )}

      <ModalConfirmacion
        abierto={envioPorCobrar !== null}
        titulo="Registrar pago del envío"
        mensaje={
          envioPorCobrar
            ? `Vas a registrar que el cliente pagó ${formatearPrecio(envioPorCobrar.costoEnvio)} por el envío del pedido ${envioPorCobrar.codigo}. Verifica antes que el pago haya llegado. No se puede deshacer.`
            : ""
        }
        textoConfirmar="Registrar pago"
        textoDescartar="Volver"
        cargando={envioPorCobrar !== null && actualizandoId === envioPorCobrar.id}
        alConfirmar={() => {
          if (!envioPorCobrar) return;
          void cobrarEnvio(envioPorCobrar).then(() => setEnvioPorCobrar(null));
        }}
        alCancelar={() => setEnvioPorCobrar(null)}
      />

      <ModalConfirmacion
        abierto={porConfirmar !== null}
        titulo={porConfirmar ? ACCION_POR_ESTADO[porConfirmar.destino].etiqueta : ""}
        mensaje={porConfirmar ? mensajeConfirmacion(porConfirmar.pedido, porConfirmar.destino) : ""}
        textoConfirmar={porConfirmar ? ACCION_POR_ESTADO[porConfirmar.destino].etiqueta : undefined}
        textoDescartar="Volver"
        destructivo={porConfirmar ? Boolean(ACCION_POR_ESTADO[porConfirmar.destino].destructivo) : false}
        cargando={porConfirmar !== null && actualizandoId === porConfirmar.pedido.id}
        alConfirmar={() => {
          if (!porConfirmar) return;
          void cambiarEstado(porConfirmar.pedido, porConfirmar.destino).then(() =>
            setPorConfirmar(null),
          );
        }}
        alCancelar={() => setPorConfirmar(null)}
      />
    </>
  );
}

/** Qué implica cada cambio de estado; todos son irreversibles. */
function mensajeConfirmacion(pedido: Pedido, destino: EstadoPedido): string {
  switch (destino) {
    case "PAGADO":
      // El pago del checkout cubre los productos; el envío se registra aparte.
      return pedido.estadoEnvio === "COTIZADO"
        ? `Vas a marcar el pedido ${pedido.codigo} como pagado por ${formatearPrecio(pedido.subtotal)} (productos). Verifica antes el comprobante. Si el cliente también pagó el envío, regístralo después con "Registrar pago del envío". No se puede deshacer.`
        : `Vas a marcar el pedido ${pedido.codigo} como pagado por ${formatearPrecio(pedido.subtotal)} (productos). Verifica antes el comprobante. No se puede deshacer.`;
    case "EN_PRODUCCION":
      return `Vas a pasar el pedido ${pedido.codigo} a producción. No se puede volver a "Pagado".`;
    case "ENVIADO":
      return `Vas a marcar el pedido ${pedido.codigo} como enviado. Después ya no podrás editar el envío ni el estado.`;
    case "CANCELADO":
      return pedido.estado === "PENDIENTE_PAGO"
        ? `Vas a cancelar el pedido ${pedido.codigo}. No se puede deshacer.`
        : `Vas a cancelar el pedido ${pedido.codigo}, que ya estaba pagado: coordina con el cliente la devolución de ${formatearPrecio(pedido.montoPagado ?? pedido.total)}. No se puede deshacer.`;
    case "RECHAZADO":
      return `Vas a rechazar el pago del pedido ${pedido.codigo} (por ejemplo, si el comprobante no es válido). No se puede deshacer.`;
    default:
      return `Vas a cambiar el estado del pedido ${pedido.codigo}.`;
  }
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
  EN_PRODUCCION: { etiqueta: "Pasar a producción", Icono: IconTool, variante: "secundario" },
  ENVIADO: { etiqueta: "Marcar enviado", Icono: IconTruck, variante: "secundario" },
  RECHAZADO: { etiqueta: "Rechazar pago", Icono: IconX, variante: "peligro", destructivo: true },
  CANCELADO: { etiqueta: "Cancelar pedido", Icono: IconBan, variante: "peligro", destructivo: true },
  PENDIENTE_PAGO: { etiqueta: "Volver a pendiente", Icono: IconCheck, variante: "secundario" },
};

interface DatosEnvio {
  costoEnvio?: number;
  direccionEntrega?: string;
  pagoEnDestino?: boolean;
}

interface PropsTarjetaPedido {
  pedido: Pedido;
  actualizando: boolean;
  alCambiarEstado: (pedido: Pedido, estado: EstadoPedido) => void;
  alGuardarEnvio: (pedido: Pedido, datos: DatosEnvio) => void;
  alCobrarEnvio: (pedido: Pedido) => void;
}

function TarjetaPedido({
  pedido,
  actualizando,
  alCambiarEstado,
  alGuardarEnvio,
  alCobrarEnvio,
}: PropsTarjetaPedido) {
  const saldo = saldoPendiente(pedido);
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
              {colorVisible(item.nombreProducto, item.colorElegido) && (
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
          <dd className="flex items-center gap-2">
            {Number(pedido.costoEnvio) > 0 && formatearPrecio(pedido.costoEnvio)}
            <Etiqueta variante={varianteEnvio(pedido)}>{etiquetaEnvio(pedido)}</Etiqueta>
          </dd>
        </div>
        <div className="mt-1 flex justify-between font-semibold text-texto-fuerte">
          <dt>Total</dt>
          <dd>{formatearPrecio(pedido.total)}</dd>
        </div>
        {pedido.montoPagado !== null && (
          <div className="mt-1 flex justify-between text-texto">
            <dt>Pagado</dt>
            <dd>{formatearPrecio(pedido.montoPagado)}</dd>
          </div>
        )}
        {saldo > 0 && (
          <div className="mt-1 flex justify-between font-semibold text-amber-700">
            <dt>Saldo pendiente</dt>
            <dd>{formatearPrecio(saldo)}</dd>
          </div>
        )}
      </dl>

      <BloqueEnvio
        pedido={pedido}
        actualizando={actualizando}
        alGuardar={alGuardarEnvio}
        alCobrar={alCobrarEnvio}
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
  alGuardar: (pedido: Pedido, datos: DatosEnvio) => void;
  alCobrar: (pedido: Pedido) => void;
}

// Estados donde el envío ya no se edita (espeja ESTADOS_ENVIO_CERRADO del backend).
const ENVIO_CERRADO: ReadonlySet<EstadoPedido> = new Set([
  "ENVIADO",
  "CANCELADO",
  "RECHAZADO",
]);

// Estados en los que el pedido ya registró un pago (espeja ESTADOS_CON_PAGO).
const PEDIDO_CON_PAGO: ReadonlySet<EstadoPedido> = new Set([
  "PAGADO",
  "EN_PRODUCCION",
  "ENVIADO",
]);

const ETIQUETA_ENVIO: Record<EstadoEnvio, string> = {
  POR_COORDINAR: "Por coordinar",
  COTIZADO: "Por cobrar",
  PAGADO: "Pagado",
  PAGO_EN_DESTINO: "Pago en destino",
  SIN_COSTO: "Sin costo",
};

const VARIANTE_ENVIO: Record<EstadoEnvio, "neutral" | "advertencia" | "exito"> = {
  POR_COORDINAR: "neutral",
  COTIZADO: "advertencia",
  PAGADO: "exito",
  PAGO_EN_DESTINO: "neutral",
  SIN_COSTO: "neutral",
};

/**
 * Registro del envío coordinado por WhatsApp: costo y dirección exacta. Al
 * guardar, el backend recalcula el total (subtotal + envío) sin tocar lo ya
 * pagado. Con pago en destino el cliente le paga a la agencia y la tienda no lo
 * cobra. La edición se oculta con el pedido despachado o cerrado, o con el
 * envío ya cobrado.
 */
function BloqueEnvio({ pedido, actualizando, alGuardar, alCobrar }: PropsBloqueEnvio) {
  const [costo, setCosto] = useState(
    Number(pedido.costoEnvio) > 0 ? String(pedido.costoEnvio) : "",
  );
  const [direccion, setDireccion] = useState(pedido.direccionEntrega ?? "");
  const [pagoEnDestino, setPagoEnDestino] = useState(
    pedido.estadoEnvio === "PAGO_EN_DESTINO",
  );
  const editable =
    !ENVIO_CERRADO.has(pedido.estado) && pedido.estadoEnvio !== "PAGADO";
  // El envío se cobra aparte solo si el pedido ya se pagó sin incluirlo.
  const cobrable =
    pedido.estadoEnvio === "COTIZADO" &&
    pedido.montoPagado !== null &&
    PEDIDO_CON_PAGO.has(pedido.estado);

  const guardar = () => {
    // Sin costo escrito el envío sigue por coordinar; un 0 explícito es gratis.
    const valor = pagoEnDestino || costo.trim() === "" ? undefined : Number(costo);
    if (valor !== undefined && (!Number.isFinite(valor) || valor < 0)) return;
    alGuardar(pedido, {
      costoEnvio: valor,
      direccionEntrega: direccion.trim() || undefined,
      pagoEnDestino,
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
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={pagoEnDestino ? "" : costo}
              disabled={pagoEnDestino}
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
          {Number(pedido.costoEnvio) > 0 && ` · ${formatearPrecio(pedido.costoEnvio)}`}
        </p>
      )}

      {editable && (
        <label className="mt-3 flex items-center gap-2 text-sm text-texto">
          <input
            type="checkbox"
            className="h-4 w-4 accent-acento"
            checked={pagoEnDestino}
            onChange={(evento) => setPagoEnDestino(evento.target.checked)}
          />
          Pago en destino (el cliente le paga el envío a la agencia al recibir)
        </label>
      )}

      {cobrable && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-borde pt-3">
          <p className="text-sm text-texto">
            El cliente debe {formatearPrecio(pedido.costoEnvio)} por el envío.
          </p>
          <Boton
            variante="secundario"
            tamano="sm"
            cargando={actualizando}
            onClick={() => alCobrar(pedido)}
          >
            <IconCash className="h-4 w-4" aria-hidden />
            Registrar pago del envío
          </Boton>
        </div>
      )}
    </section>
  );
}

// Pedidos anulados: lo que no se cobró ya no se va a cobrar.
const PEDIDO_ANULADO: ReadonlySet<EstadoPedido> = new Set(["CANCELADO", "RECHAZADO"]);

/** En un pedido anulado, un envío sin cobrar ya no está "por cobrar". */
function etiquetaEnvio(pedido: Pedido): string {
  const sinCobrar = pedido.estadoEnvio === "COTIZADO" || pedido.estadoEnvio === "POR_COORDINAR";
  if (PEDIDO_ANULADO.has(pedido.estado) && sinCobrar) return "No cobrado";
  return ETIQUETA_ENVIO[pedido.estadoEnvio];
}

function varianteEnvio(pedido: Pedido): "neutral" | "advertencia" | "exito" {
  return PEDIDO_ANULADO.has(pedido.estado) ? "neutral" : VARIANTE_ENVIO[pedido.estadoEnvio];
}

/**
 * Lo que falta cobrar: total menos lo ya pagado. 0 si aún no hay pagos o si el
 * pedido se anuló (ahí corresponde una devolución, no un cobro).
 */
function saldoPendiente(pedido: Pedido): number {
  if (pedido.montoPagado === null || PEDIDO_ANULADO.has(pedido.estado)) return 0;
  // Redondeo a céntimos: la resta en coma flotante deja restos como 1e-14.
  const saldo = Math.round((Number(pedido.total) - Number(pedido.montoPagado)) * 100) / 100;
  return Math.max(0, saldo);
}

function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
