"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconBrandWhatsapp,
  IconQrcode,
  IconUpload,
  IconCheck,
  IconLock,
  IconUserCircle,
} from "@tabler/icons-react";
import { Boton, Input, Spinner } from "@/components/ui";
import { useCarrito } from "@/store/carrito";
import { useHidratado } from "@/store/usar-hidratado";
import { crearPedido, subirArchivo, ErrorApi } from "@/lib/api";
import type { Configuracion, MetodoPago } from "@/lib/tipos";
import { cn } from "@/lib/utilidades";
import { BloqueConfianza } from "./bloque-confianza";
import { ResumenPedido } from "./resumen-pedido";
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
 *
 * Layout de dos columnas: datos + metodo de pago a la izquierda, resumen del
 * pedido (con fotos) y confirmacion en una card sticky a la derecha.
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

  // Pestana reservada de forma sincrona para WhatsApp (fix del popup en movil):
  // se abre dentro del gesto del usuario ANTES del await de creacion del pedido.
  const ventanaWhatsAppRef = useRef<Window | null>(null);

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
    return <CarritoVacioCheckout />;
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
    varianteId: linea.varianteId,
    cantidad: linea.cantidad,
  }));

  // Se ejecuta en el onClick del boton (gesto del usuario), sincronamente, antes
  // de cualquier await. Reserva la pestana de WhatsApp para que el navegador movil
  // no la bloquee cuando luego navegamos tras crear el pedido.
  const reservarVentanaWhatsApp = () => {
    if (metodo !== "WHATSAPP") return;
    ventanaWhatsAppRef.current = window.open("about:blank", "_blank");
  };

  const enviarPorWhatsApp = async (datos: DatosCheckout) => {
    const ventana = ventanaWhatsAppRef.current;
    ventanaWhatsAppRef.current = null;

    const numero = configuracion?.whatsapp ?? null;
    const mensajeBase = construirMensajeWhatsApp(datos, lineas, total);
    const enlacePreliminar = construirEnlaceWhatsApp(numero, mensajeBase);

    if (!enlacePreliminar) {
      ventana?.close();
      setErrorEnvio(
        "El número de WhatsApp de la tienda no está configurado. Intenta con Yape o Plin.",
      );
      return;
    }

    try {
      // WhatsApp ahora crea un Pedido real (PENDIENTE_PAGO) antes de abrir el chat.
      const pedido = await crearPedido({
        nombreCliente: datos.nombreCliente,
        telefono: datos.telefono,
        items: itemsPedido,
        metodoPago: "WHATSAPP",
      });

      const mensaje = `${mensajeBase}\n\nCódigo de pedido: ${pedido.codigo}`;
      const enlace = construirEnlaceWhatsApp(numero, mensaje) ?? enlacePreliminar;

      vaciar();

      if (ventana && !ventana.closed) {
        ventana.location.href = enlace;
      } else {
        // La pestana reservada fue bloqueada o cerrada: fallback dentro del flujo.
        window.open(enlace, "_blank", "noopener,noreferrer");
      }

      setCodigoPedido(pedido.codigo);
    } catch (error) {
      ventana?.close();
      setErrorEnvio(
        mensajeError(error, "No pudimos registrar tu pedido. Intenta nuevamente."),
      );
    }
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

  // El manejador se arma dentro del evento (no en render) para que el acceso al
  // ref de la pestana ocurra en tiempo de evento y no dispare la regla de refs.
  const alEnviar = (evento: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(
      (datos) => {
        setErrorEnvio(null);
        if (metodo === "WHATSAPP") {
          return enviarPorWhatsApp(datos);
        }
        return registrarPedidoDigital(datos);
      },
      () => {
        // Validacion fallida: cerramos la pestana reservada en el onClick para no
        // dejar un about:blank huerfano.
        ventanaWhatsAppRef.current?.close();
        ventanaWhatsAppRef.current = null;
      },
    )(evento);
  };

  return (
    <form
      onSubmit={alEnviar}
      noValidate
      className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_minmax(340px,400px)] lg:items-start lg:gap-10"
    >
      <div className="flex flex-col gap-6">
        <BloqueFormulario
          icono={<IconUserCircle size={20} aria-hidden />}
          titulo="Tus datos"
          tituloId="titulo-datos"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              etiqueta="Nombre completo"
              placeholder="Ej. María López"
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
        </BloqueFormulario>

        <BloqueFormulario
          icono={<IconLock size={20} aria-hidden />}
          titulo="Método de pago"
          tituloId="titulo-metodo"
        >
          <div
            role="radiogroup"
            aria-labelledby="titulo-metodo"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <OpcionMetodo
              activa={metodo === "WHATSAPP"}
              onClick={() => setMetodo("WHATSAPP")}
              titulo="Coordinar por WhatsApp"
              descripcion="Te llevamos a un chat con tu pedido listo para enviar."
              icono={<IconBrandWhatsapp size={24} aria-hidden />}
            />
            <OpcionMetodo
              activa={metodo === "DIGITAL"}
              onClick={() => setMetodo("DIGITAL")}
              titulo="Yape o Plin"
              descripcion="Paga con QR y sube tu comprobante para confirmar."
              icono={<IconQrcode size={24} aria-hidden />}
            />
          </div>

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
        </BloqueFormulario>
      </div>

      <aside className="lg:sticky lg:top-24">
        <div className="flex flex-col gap-4">
          <ResumenPedido lineas={lineas} total={total} />

          <BloqueConfianza variante="lista" />

          {errorEnvio && (
            <p
              role="alert"
              className="rounded-xl border border-oferta/30 bg-oferta/5 px-4 py-3 text-sm text-oferta"
            >
              {errorEnvio}
            </p>
          )}

          <Boton
            type="submit"
            tamano="lg"
            cargando={isSubmitting}
            onClick={reservarVentanaWhatsApp}
            className="w-full"
          >
            {metodo === "WHATSAPP" ? (
              <>
                <IconBrandWhatsapp size={20} aria-hidden />
                Enviar pedido por WhatsApp
              </>
            ) : (
              "Confirmar pedido"
            )}
          </Boton>
        </div>
      </aside>
    </form>
  );
}

interface PropsBloqueFormulario {
  icono: React.ReactNode;
  titulo: string;
  tituloId: string;
  children: React.ReactNode;
}

/** Card de seccion del checkout con la misma profundidad que el resto del sitio. */
function BloqueFormulario({ icono, titulo, tituloId, children }: PropsBloqueFormulario) {
  return (
    <section
      aria-labelledby={tituloId}
      className="rounded-2xl border border-borde bg-fondo p-6 shadow-[0_1px_3px_rgba(17,17,17,0.04)] sm:p-7"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-acento/10 text-acento">
          {icono}
        </span>
        <h2
          id={tituloId}
          className="titulo-ui text-sm font-semibold uppercase tracking-wide text-texto-fuerte"
        >
          {titulo}
        </h2>
      </div>
      {children}
    </section>
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
      role="radio"
      aria-checked={activa}
      onClick={onClick}
      className={cn(
        "group flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200",
        activa
          ? "border-acento bg-acento/[.04] shadow-[0_8px_24px_-12px_rgba(125,33,129,0.35)] ring-1 ring-acento"
          : "border-borde hover:-translate-y-0.5 hover:border-acento/40 hover:shadow-[0_8px_20px_-14px_rgba(125,33,129,0.3)]",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
          activa
            ? "bg-acento text-acento-contraste"
            : "bg-perla text-texto-fuerte group-hover:bg-acento/10 group-hover:text-acento",
        )}
      >
        {icono}
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-texto-fuerte">{titulo}</span>
          <span
            aria-hidden
            className={cn(
              "ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              activa ? "border-acento bg-acento" : "border-borde",
            )}
          >
            {activa && <IconCheck size={12} className="text-acento-contraste" />}
          </span>
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-texto">
          {descripcion}
        </span>
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
  const qr = metodoDigital === "YAPE" ? configuracion?.qrYape : configuracion?.qrPlin;
  const billetera = metodoDigital === "YAPE" ? "Yape" : "Plin";

  return (
    <div className="mt-5 rounded-xl border border-borde bg-perla p-5">
      <div className="flex gap-2" role="group" aria-label="Elegir billetera">
        {(["YAPE", "PLIN"] as const).map((opcion) => (
          <button
            key={opcion}
            type="button"
            onClick={() => alElegirMetodo(opcion)}
            aria-pressed={metodoDigital === opcion}
            className={cn(
              "flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-all",
              metodoDigital === opcion
                ? "border-acento bg-acento text-acento-contraste shadow-[0_8px_20px_-12px_rgba(125,33,129,0.5)]"
                : "border-borde bg-fondo text-texto hover:border-acento/40 hover:text-acento",
            )}
          >
            {opcion === "YAPE" ? "Yape" : "Plin"}
          </button>
        ))}
      </div>

      {qr && (
        <figure className="mt-4 flex flex-col items-center rounded-xl border border-borde bg-fondo p-4">
          <Image
            src={qr}
            alt={`Código QR de ${billetera}`}
            width={208}
            height={208}
            className="h-52 w-52 object-contain"
          />
          <figcaption className="mt-2 text-xs text-texto">
            Escanea el QR con tu app de {billetera} para pagar.
          </figcaption>
        </figure>
      )}

      {datos && (
        <p className="mt-4 whitespace-pre-line rounded-lg border border-borde bg-fondo px-4 py-3 text-sm text-texto">
          {datos}
        </p>
      )}

      {!qr && !datos && (
        <p className="mt-4 rounded-lg border border-borde bg-fondo px-4 py-3 text-sm text-texto">
          La tienda aún no ha configurado {billetera}. Usa la opción de WhatsApp.
        </p>
      )}

      <div className="mt-5">
        <label
          htmlFor="comprobante"
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors",
            comprobanteUrl
              ? "border-acento/40 bg-acento/5 text-acento"
              : "border-borde bg-fondo text-texto-fuerte hover:border-acento/40 hover:text-acento",
          )}
        >
          {subiendo ? (
            <Spinner tamano="sm" etiqueta="Subiendo comprobante" />
          ) : comprobanteUrl ? (
            <IconCheck size={18} aria-hidden />
          ) : (
            <IconUpload size={18} aria-hidden />
          )}
          {comprobanteUrl ? "Comprobante cargado · cambiar" : "Subir comprobante"}
        </label>
        <input
          id="comprobante"
          type="file"
          accept="image/*"
          onChange={alSubir}
          disabled={subiendo}
          className="sr-only"
        />

        {errorComprobante && (
          <p role="alert" className="mt-3 text-sm text-oferta">
            {errorComprobante}
          </p>
        )}
      </div>
    </div>
  );
}

function CarritoVacioCheckout() {
  const router = useRouter();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-borde bg-fondo px-6 py-16 text-center shadow-[0_1px_3px_rgba(17,17,17,0.04)]">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-acento/10 text-acento">
        <IconQrcode size={28} aria-hidden />
      </span>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-texto-fuerte">
        Tu carrito está vacío
      </h2>
      <p className="mt-2 text-texto">
        Agrega productos antes de continuar al pago.
      </p>
      <Boton className="mt-6" onClick={() => router.push("/catalogo")}>
        Ver catálogo
      </Boton>
    </div>
  );
}

function Confirmacion({ codigo }: { codigo: string }) {
  const router = useRouter();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-borde bg-fondo py-16 px-6 text-center shadow-[0_18px_50px_-20px_rgba(125,33,129,0.25)]">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-green-600/30">
        <IconCheck size={32} aria-hidden />
      </span>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-texto-fuerte">
        Pedido registrado
      </h2>
      <p className="mt-2 text-texto">
        Tu código de pedido es{" "}
        <span className="font-semibold text-acento">{codigo}</span>.
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
