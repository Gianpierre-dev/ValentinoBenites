"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconBrandWhatsapp,
  IconQrcode,
  IconUpload,
  IconCheck,
} from "@tabler/icons-react";
import { Boton, Input, Spinner } from "@/components/ui";
import { useCarrito } from "@/store/carrito";
import { useHidratado } from "@/store/usar-hidratado";
import { crearPedido, subirArchivo, ErrorApi } from "@/lib/api";
import type { Configuracion, MetodoPago } from "@/lib/tipos";
import { formatearPrecio } from "@/lib/utilidades";
import {
  construirEnlaceWhatsApp,
  construirMensajeWhatsApp,
  esquemaCheckout,
  type DatosCheckout,
} from "@/lib/checkout";

interface PropsFormularioCheckout {
  configuracion: Configuracion | null;
}

type MetodoSeleccionado = "WHATSAPP" | "DIGITAL";

/**
 * Checkout dual del storefront:
 * - WhatsApp: arma un mensaje pre-formateado con el pedido y abre wa.me del negocio.
 * - Yape/Plin: muestra los datos de pago, permite subir el comprobante y registra
 *   el pedido via POST /api/pedidos.
 */
export function FormularioCheckout({ configuracion }: PropsFormularioCheckout) {
  const hidratado = useHidratado();
  const lineas = useCarrito((estado) => estado.lineas);
  const total = useCarrito((estado) => estado.total());
  const vaciar = useCarrito((estado) => estado.vaciar);

  const [metodo, setMetodo] = useState<MetodoSeleccionado>("WHATSAPP");
  const [metodoDigital, setMetodoDigital] = useState<MetodoPago>("YAPE");
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorComprobante, setErrorComprobante] = useState<string | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [codigoPedido, setCodigoPedido] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DatosCheckout>({
    resolver: zodResolver(esquemaCheckout),
    defaultValues: { nombreCliente: "", telefono: "" },
  });

  if (!hidratado) {
    return (
      <div className="flex justify-center py-24">
        <Spinner tamano="lg" etiqueta="Cargando checkout" />
      </div>
    );
  }

  if (codigoPedido) {
    return <Confirmacion codigo={codigoPedido} />;
  }

  if (lineas.length === 0) {
    return (
      <p className="border border-borde bg-black/[.02] px-4 py-6 text-center text-sm text-texto">
        Tu carrito esta vacio. Agrega productos antes de continuar al pago.
      </p>
    );
  }

  const subirComprobante = async (
    evento: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    setErrorComprobante(null);
    setSubiendo(true);
    try {
      const { url } = await subirArchivo(archivo);
      setComprobanteUrl(url);
    } catch (error) {
      setErrorComprobante(mensajeError(error, "No pudimos subir el comprobante."));
    } finally {
      setSubiendo(false);
    }
  };

  const itemsPedido = lineas.map((linea) => ({
    productoId: linea.productoId,
    cantidad: linea.cantidad,
  }));

  const enviarPorWhatsApp = (datos: DatosCheckout) => {
    const mensaje = construirMensajeWhatsApp(datos, lineas, total);
    const enlace = construirEnlaceWhatsApp(configuracion?.whatsapp ?? null, mensaje);

    if (!enlace) {
      setErrorEnvio(
        "El numero de WhatsApp de la tienda no esta configurado. Intenta con Yape o Plin.",
      );
      return;
    }

    window.open(enlace, "_blank", "noopener,noreferrer");
  };

  const registrarPedidoDigital = async (datos: DatosCheckout) => {
    if (!comprobanteUrl) {
      setErrorComprobante("Sube el comprobante de pago para continuar.");
      return;
    }

    setErrorEnvio(null);
    try {
      const pedido = await crearPedido({
        nombreCliente: datos.nombreCliente,
        telefono: datos.telefono,
        items: itemsPedido,
        metodoPago: metodoDigital,
        comprobanteUrl,
      });
      vaciar();
      setCodigoPedido(pedido.codigo);
    } catch (error) {
      setErrorEnvio(
        mensajeError(error, "No pudimos registrar tu pedido. Intenta nuevamente."),
      );
    }
  };

  const alEnviar = handleSubmit((datos) => {
    setErrorEnvio(null);
    if (metodo === "WHATSAPP") {
      enviarPorWhatsApp(datos);
      return;
    }
    return registrarPedidoDigital(datos);
  });

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-8" noValidate>
      <section aria-labelledby="titulo-datos">
        <h2
          id="titulo-datos"
          className="text-sm font-semibold uppercase tracking-wide text-texto-fuerte"
        >
          Tus datos
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            etiqueta="Nombre completo"
            placeholder="Ej. Maria Lopez"
            autoComplete="name"
            error={errors.nombreCliente?.message}
            {...register("nombreCliente")}
          />
          <Input
            etiqueta="Celular"
            placeholder="9XXXXXXXX"
            inputMode="numeric"
            autoComplete="tel"
            error={errors.telefono?.message}
            {...register("telefono")}
          />
        </div>
      </section>

      <section aria-labelledby="titulo-metodo">
        <h2
          id="titulo-metodo"
          className="text-sm font-semibold uppercase tracking-wide text-texto-fuerte"
        >
          Metodo de pago
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <OpcionMetodo
            activa={metodo === "WHATSAPP"}
            onClick={() => setMetodo("WHATSAPP")}
            titulo="Coordinar por WhatsApp"
            descripcion="Te llevamos a un chat con tu pedido listo para enviar."
            icono={<IconBrandWhatsapp size={22} aria-hidden />}
          />
          <OpcionMetodo
            activa={metodo === "DIGITAL"}
            onClick={() => setMetodo("DIGITAL")}
            titulo="Yape o Plin"
            descripcion="Paga con QR y sube tu comprobante para confirmar."
            icono={<IconQrcode size={22} aria-hidden />}
          />
        </div>
      </section>

      {metodo === "DIGITAL" && (
        <PagoDigital
          configuracion={configuracion}
          metodoDigital={metodoDigital}
          alElegirMetodo={setMetodoDigital}
          comprobanteUrl={comprobanteUrl}
          subiendo={subiendo}
          errorComprobante={errorComprobante}
          alSubir={subirComprobante}
        />
      )}

      <section className="border-t border-borde pt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
            Total
          </span>
          <span className="text-lg font-semibold text-texto-fuerte">
            {formatearPrecio(total)}
          </span>
        </div>
        <p className="mt-1 text-xs text-texto">
          El monto final se confirma al validar tu pedido.
        </p>

        {errorEnvio && (
          <p role="alert" className="mt-4 text-sm text-oferta">
            {errorEnvio}
          </p>
        )}

        <Boton
          type="submit"
          tamano="lg"
          cargando={isSubmitting}
          className="mt-6 w-full"
        >
          {metodo === "WHATSAPP" ? "Enviar pedido por WhatsApp" : "Confirmar pedido"}
        </Boton>
      </section>
    </form>
  );
}

interface PropsOpcionMetodo {
  activa: boolean;
  onClick: () => void;
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
}

function OpcionMetodo({ activa, onClick, titulo, descripcion, icono }: PropsOpcionMetodo) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={`flex items-start gap-3 border p-4 text-left transition-colors ${
        activa ? "border-acento" : "border-borde hover:border-texto/40"
      }`}
    >
      <span className="mt-0.5 text-texto-fuerte">{icono}</span>
      <span>
        <span className="block text-sm font-medium text-texto-fuerte">{titulo}</span>
        <span className="mt-1 block text-xs text-texto">{descripcion}</span>
      </span>
    </button>
  );
}

interface PropsPagoDigital {
  configuracion: Configuracion | null;
  metodoDigital: MetodoPago;
  alElegirMetodo: (metodo: MetodoPago) => void;
  comprobanteUrl: string | null;
  subiendo: boolean;
  errorComprobante: string | null;
  alSubir: (evento: React.ChangeEvent<HTMLInputElement>) => void;
}

function PagoDigital({
  configuracion,
  metodoDigital,
  alElegirMetodo,
  comprobanteUrl,
  subiendo,
  errorComprobante,
  alSubir,
}: PropsPagoDigital) {
  const datos = metodoDigital === "YAPE" ? configuracion?.datosYape : configuracion?.datosPlin;

  return (
    <section aria-labelledby="titulo-digital" className="border border-borde p-6">
      <h3
        id="titulo-digital"
        className="text-sm font-semibold uppercase tracking-wide text-texto-fuerte"
      >
        Paga con Yape o Plin
      </h3>

      <div className="mt-4 flex gap-2" role="group" aria-label="Elegir billetera">
        {(["YAPE", "PLIN"] as const).map((opcion) => (
          <button
            key={opcion}
            type="button"
            onClick={() => alElegirMetodo(opcion)}
            aria-pressed={metodoDigital === opcion}
            className={`border px-4 py-2 text-sm uppercase tracking-wide transition-colors ${
              metodoDigital === opcion
                ? "border-acento bg-acento text-acento-contraste"
                : "border-borde text-texto hover:border-texto/40"
            }`}
          >
            {opcion === "YAPE" ? "Yape" : "Plin"}
          </button>
        ))}
      </div>

      <p className="mt-4 whitespace-pre-line text-sm text-texto">
        {datos
          ? datos
          : "La tienda aun no ha configurado estos datos de pago. Usa la opcion de WhatsApp."}
      </p>

      <div className="mt-6">
        <label
          htmlFor="comprobante"
          className="inline-flex cursor-pointer items-center gap-2 border border-borde px-4 py-2 text-sm text-texto-fuerte transition-colors hover:bg-black/[.04]"
        >
          {subiendo ? (
            <Spinner tamano="sm" etiqueta="Subiendo comprobante" />
          ) : (
            <IconUpload size={18} aria-hidden />
          )}
          {comprobanteUrl ? "Cambiar comprobante" : "Subir comprobante"}
        </label>
        <input
          id="comprobante"
          type="file"
          accept="image/*"
          onChange={alSubir}
          disabled={subiendo}
          className="sr-only"
        />

        {comprobanteUrl && (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-texto-fuerte">
            <IconCheck size={16} aria-hidden className="text-green-600" />
            Comprobante cargado
          </p>
        )}

        {errorComprobante && (
          <p role="alert" className="mt-3 text-sm text-oferta">
            {errorComprobante}
          </p>
        )}
      </div>
    </section>
  );
}

function Confirmacion({ codigo }: { codigo: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center border border-borde py-16 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white">
        <IconCheck size={28} aria-hidden />
      </span>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-texto-fuerte">
        Pedido registrado
      </h2>
      <p className="mt-2 text-texto">
        Tu codigo de pedido es{" "}
        <span className="font-semibold text-texto-fuerte">{codigo}</span>.
      </p>
      <p className="mt-1 max-w-sm text-sm text-texto">
        Validaremos tu pago y nos pondremos en contacto contigo a la brevedad.
      </p>
      <Boton className="mt-6" onClick={() => router.push("/catalogo")}>
        Seguir comprando
      </Boton>
    </div>
  );
}

function mensajeError(error: unknown, respaldo: string): string {
  if (error instanceof ErrorApi) return error.message;
  return respaldo;
}
