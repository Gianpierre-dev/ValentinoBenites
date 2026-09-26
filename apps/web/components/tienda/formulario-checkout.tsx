"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconAlertTriangle,
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
import { crearPedido, subirComprobante as subirComprobanteApi, ErrorApi } from "@/lib/api";
import type { Billetera, Configuracion, Cotizacion } from "@/lib/tipos";
import { cn, formatearPrecio, normalizarCelular } from "@/lib/utilidades";
import {
  construirEnlaceWhatsApp,
  construirMensajeWhatsApp,
  esquemaCheckout,
  type DatosCheckout,
} from "@/lib/checkout";
import {
  guardarConfirmacion,
  leerConfirmacionDeUrl,
  PARAMETRO_PEDIDO,
  type ConfirmacionPedido,
} from "@/lib/confirmacion-pedido";
import { BloqueConfianza } from "./bloque-confianza";
import { ResumenPedido } from "./resumen-pedido";
import { itemsDelCarrito, useCotizacion } from "./usar-cotizacion";

/** Un celular peruano tiene 9 digitos. */
const LARGO_CELULAR = 9;

/** Formatos que acepta el servidor para el comprobante. */
const TIPOS_COMPROBANTE = "image/jpeg,image/png,image/webp";

interface PropsFormularioCheckout {
  configuracion: Configuracion | null;
  /** Billeteras activas (Yape, Plin, Agora...) administradas desde el panel. */
  billeteras: Billetera[];
}

type MetodoSeleccionado = "WHATSAPP" | "DIGITAL";

/**
 * Checkout del storefront, con dos caminos:
 * - WhatsApp: registra el pedido y abre el chat con el pedido ya armado.
 * - Billetera (Yape, Plin...): muestra el QR con el monto que calculó el
 *   servidor, pide el comprobante y registra el pedido.
 *
 * El carrito se cotiza contra el servidor al entrar y antes de confirmar: los
 * precios que ve y paga el cliente son los que se registran, y los productos
 * que ya no se venden se quitan con aviso.
 */
export function FormularioCheckout({
  configuracion,
  billeteras,
}: PropsFormularioCheckout) {
  const hidratado = useHidratado();
  const pedidoEnUrl = useSearchParams().get(PARAMETRO_PEDIDO);
  const lineas = useCarrito((estado) => estado.lineas);
  const totalLocal = useCarrito((estado) => estado.total());
  const vaciar = useCarrito((estado) => estado.vaciar);
  const {
    cotizacion,
    cargando: cotizando,
    error: errorCotizacion,
    quitados,
    refrescar,
  } = useCotizacion(lineas);

  const [metodo, setMetodo] = useState<MetodoSeleccionado>("WHATSAPP");
  // Billetera elegida dentro del panel digital (la primera activa por defecto).
  const [billeteraId, setBilleteraId] = useState<string | null>(
    billeteras[0]?.id ?? null,
  );
  const billeteraElegida =
    billeteras.find((billetera) => billetera.id === billeteraId) ??
    billeteras[0] ??
    null;
  // El comprobante recuerda el monto que se mostraba al subirlo: si el pedido
  // cambia después, ese comprobante ya no corresponde y hay que subir otro.
  const [comprobante, setComprobante] = useState<{ url: string; monto: number } | null>(
    null,
  );
  const [subiendo, setSubiendo] = useState(false);
  const [errorComprobante, setErrorComprobante] = useState<string | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionPedido | null>(
    leerConfirmacionDeUrl,
  );
  // Una clave por intento de compra: si la respuesta se pierde y el cliente
  // reintenta, el servidor devuelve el mismo pedido en vez de duplicarlo.
  const [claveIdempotencia] = useState(generarClaveIdempotencia);

  // Pestana reservada de forma sincrona para WhatsApp (fix del popup en movil):
  // se abre dentro del gesto del usuario ANTES del await de creacion del pedido.
  const ventanaWhatsAppRef = useRef<Window | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DatosCheckout>({
    resolver: zodResolver(esquemaCheckout),
    defaultValues: {
      nombreCliente: "",
      telefono: "",
      ciudadEntrega: "",
      aceptaPrivacidad: false,
    },
  });

  if (!hidratado) {
    return (
      <div className="flex justify-center py-24">
        <Spinner tamano="lg" etiqueta="Cargando checkout" />
      </div>
    );
  }

  // La confirmación se muestra solo mientras la URL apunta a ese pedido: al
  // volver a /checkout (el router no remonta la página por un cambio de query)
  // vuelve el formulario.
  if (confirmacion && pedidoEnUrl === confirmacion.codigo) {
    return <Confirmacion confirmacion={confirmacion} />;
  }

  if (lineas.length === 0) {
    return <CarritoVacioCheckout quitados={quitados} />;
  }

  // Monto que ve el cliente: el del servidor en cuanto está disponible.
  const montoMostrado = cotizacion?.subtotal ?? null;
  const comprobanteVigente =
    comprobante !== null && comprobante.monto === montoMostrado ? comprobante : null;
  const comprobanteDesactualizado = comprobante !== null && comprobanteVigente === null;
  // Con billetera no se puede pagar ni confirmar sin el monto confirmado por el servidor.
  const pagoDigitalBloqueado = metodo === "DIGITAL" && (cotizando || montoMostrado === null);

  const subirComprobante = async (
    evento: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;
    if (montoMostrado === null) {
      setErrorComprobante("Espera a que calculemos el monto a pagar antes de subir el comprobante.");
      return;
    }
    const montoPagado = montoMostrado;

    setErrorComprobante(null);
    setSubiendo(true);
    try {
      const { url } = await subirComprobanteApi(archivo);
      setComprobante({ url, monto: montoPagado });
    } catch (error) {
      setErrorComprobante(mensajeError(error, "No pudimos subir el comprobante."));
    } finally {
      setSubiendo(false);
    }
  };

  // Se ejecuta en el onClick del boton (gesto del usuario), sincronamente, antes
  // de cualquier await. Reserva la pestana de WhatsApp para que el navegador movil
  // no la bloquee cuando luego navegamos tras crear el pedido.
  const reservarVentanaWhatsApp = () => {
    if (metodo !== "WHATSAPP") return;
    // Un doble clic no debe abrir dos pestañas.
    if (ventanaWhatsAppRef.current && !ventanaWhatsAppRef.current.closed) return;
    ventanaWhatsAppRef.current = window.open("about:blank", "_blank");
  };

  /** Vuelve a cotizar justo antes de registrar; devuelve un error legible o null. */
  const validarAntesDeConfirmar = async (
    esWhatsApp: boolean,
  ): Promise<string | null> => {
    let vigente: Cotizacion;
    try {
      vigente = await refrescar(esWhatsApp ? undefined : billeteraElegida?.id);
    } catch (error) {
      return mensajeError(error, "No pudimos confirmar los precios de tu pedido.");
    }
    if (!vigente.metodoPagoDisponible) {
      return "Ese medio de pago ya no está disponible. Elige otro para continuar.";
    }
    if (!vigente.disponible) {
      return "Actualizamos tu carrito porque algunos productos ya no están disponibles. Revisa el resumen antes de confirmar.";
    }
    if (!esWhatsApp && comprobante && vigente.subtotal !== comprobante.monto) {
      return `El total de tu pedido cambió a ${formatearPrecio(vigente.subtotal)} y tu comprobante es de ${formatearPrecio(comprobante.monto)}. Sube un comprobante por el monto correcto para continuar.`;
    }
    return null;
  };

  const confirmarPedido = async (datos: DatosCheckout) => {
    const ventana = ventanaWhatsAppRef.current;
    ventanaWhatsAppRef.current = null;
    const esWhatsApp = metodo === "WHATSAPP";
    const numeroTienda = configuracion?.whatsapp ?? null;

    const cancelar = (mensaje: string) => {
      ventana?.close();
      setErrorEnvio(mensaje);
    };

    if (esWhatsApp && !construirEnlaceWhatsApp(numeroTienda, "")) {
      cancelar(
        billeteras.length > 0
          ? `El WhatsApp de la tienda no está disponible por ahora. Puedes pagar con ${billeteras.map((b) => b.nombre).join(" o ")}.`
          : "El WhatsApp de la tienda no está disponible por ahora. Intenta más tarde.",
      );
      return;
    }
    if (!esWhatsApp && !billeteraElegida) {
      cancelar("No hay medios de pago disponibles. Usa la opción de WhatsApp.");
      return;
    }
    if (!esWhatsApp && !comprobanteVigente) {
      ventana?.close();
      setErrorComprobante(
        comprobanteDesactualizado
          ? "El total de tu pedido cambió. Sube un comprobante por el monto actual para continuar."
          : "Sube el comprobante de pago para continuar.",
      );
      return;
    }

    const errorValidacion = await validarAntesDeConfirmar(esWhatsApp);
    if (errorValidacion) {
      cancelar(errorValidacion);
      return;
    }

    try {
      const pedido = await crearPedido({
        nombreCliente: datos.nombreCliente,
        telefono: datos.telefono,
        ciudadEntrega: datos.ciudadEntrega || undefined,
        items: itemsDelCarrito(useCarrito.getState().lineas),
        aceptaTerminos: datos.aceptaPrivacidad,
        claveIdempotencia,
        ...(esWhatsApp
          ? {}
          : { billeteraId: billeteraElegida?.id, comprobanteUrl: comprobanteVigente?.url }),
      });

      const enlaceWhatsApp = esWhatsApp
        ? construirEnlaceWhatsApp(numeroTienda, construirMensajeWhatsApp(pedido))
        : null;
      if (enlaceWhatsApp && ventana && !ventana.closed) {
        ventana.location.href = enlaceWhatsApp;
      } else {
        // Si el navegador bloqueó la pestaña, el botón de la confirmación
        // permite abrir el chat.
        ventana?.close();
      }

      const nueva: ConfirmacionPedido = {
        codigo: pedido.codigo,
        total: pedido.total,
        metodoPago: pedido.metodoPago,
        telefono: pedido.telefono,
        enlaceWhatsApp,
      };
      guardarConfirmacion(nueva);
      vaciar();
      setConfirmacion(nueva);
      window.history.replaceState(null, "", `?${PARAMETRO_PEDIDO}=${pedido.codigo}`);
    } catch (error) {
      cancelar(mensajeError(error, "No pudimos registrar tu pedido. Intenta nuevamente."));
    }
  };

  // El manejador se arma dentro del evento (no en render) para que el acceso al
  // ref de la pestana ocurra en tiempo de evento y no dispare la regla de refs.
  const alEnviar = (evento: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(
      (datos) => {
        setErrorEnvio(null);
        return confirmarPedido(datos);
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
    <>
      <EncabezadoCheckout />

      {quitados.length > 0 && (
        <p
          role="status"
          className="mt-6 flex items-start gap-2 rounded-xl border border-oferta/30 bg-oferta/5 px-4 py-3 text-sm text-oferta"
        >
          <IconAlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
          Quitamos de tu carrito {quitados.join(", ")} porque ya no{" "}
          {quitados.length === 1 ? "está disponible" : "están disponibles"}.
        </p>
      )}

      <form
        onSubmit={alEnviar}
        noValidate
        className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_minmax(340px,400px)] lg:items-start lg:gap-10"
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
                {...register("telefono", {
                  // Se limpia al vuelo: acepta el número pegado con espacios o
                  // con +51 y deja solo los 9 dígitos del celular.
                  onChange: (evento: React.ChangeEvent<HTMLInputElement>) => {
                    evento.target.value = normalizarCelular(
                      evento.target.value,
                      LARGO_CELULAR,
                    );
                  },
                })}
              />
              <Input
                etiqueta="Ciudad o departamento (opcional)"
                placeholder="Ej. Arequipa"
                autoComplete="address-level2"
                error={errors.ciudadEntrega?.message}
                {...register("ciudadEntrega")}
              />
            </div>
            <p className="mt-2 text-xs text-texto/70">
              El costo del envío se coordina por WhatsApp según tu destino. Indicar
              tu ciudad nos ayuda a cotizarlo más rápido.
            </p>
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
              {billeteras.length > 0 && (
                <OpcionMetodo
                  activa={metodo === "DIGITAL"}
                  onClick={() => setMetodo("DIGITAL")}
                  titulo={billeteras.map((billetera) => billetera.nombre).join(", ")}
                  descripcion="Paga con QR y sube tu comprobante para confirmar."
                  icono={<IconQrcode size={24} aria-hidden />}
                />
              )}
            </div>

            {metodo === "DIGITAL" && billeteraElegida && (
              <PagoDigital
                billeteras={billeteras}
                elegida={billeteraElegida}
                alElegir={setBilleteraId}
                monto={montoMostrado}
                errorMonto={errorCotizacion}
                comprobante={comprobante}
                comprobanteDesactualizado={comprobanteDesactualizado}
                subiendo={subiendo}
                errorComprobante={errorComprobante}
                alSubir={subirComprobante}
              />
            )}
          </BloqueFormulario>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="flex flex-col gap-4">
            <ResumenPedido
              lineas={lineas}
              total={montoMostrado ?? totalLocal}
              calculando={cotizando}
            />

            <BloqueConfianza variante="lista" />

            <div>
              <label className="flex items-start gap-3 text-sm text-texto">
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 shrink-0 accent-acento"
                  {...register("aceptaPrivacidad")}
                />
                <span>
                  He leído y acepto la{" "}
                  <a
                    href="/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-acento underline"
                  >
                    Política de Privacidad
                  </a>{" "}
                  y los{" "}
                  <a
                    href="/terminos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-acento underline"
                  >
                    Términos y Condiciones
                  </a>
                  .
                </span>
              </label>
              {errors.aceptaPrivacidad && (
                <p role="alert" className="mt-2 text-sm text-oferta">
                  {errors.aceptaPrivacidad.message}
                </p>
              )}
            </div>

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
              disabled={pagoDigitalBloqueado}
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
    </>
  );
}

function EncabezadoCheckout() {
  return (
    <header className="max-w-xl">
      <h1 className="text-3xl font-semibold tracking-tight text-texto-fuerte sm:text-4xl">
        Finalizar compra
      </h1>
      <p className="mt-3 text-texto">
        Completa tus datos y elige cómo quieres pagar. Revisa tu pedido en el
        resumen antes de confirmar.
      </p>
    </header>
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
  billeteras: Billetera[];
  elegida: Billetera;
  alElegir: (billeteraId: string) => void;
  /** Monto calculado por el servidor; null mientras se calcula. */
  monto: number | null;
  errorMonto: string | null;
  comprobante: { url: string; monto: number } | null;
  comprobanteDesactualizado: boolean;
  subiendo: boolean;
  errorComprobante: string | null;
  alSubir: (evento: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Panel de pago manual por billetera. Las pestañas se pintan desde la lista
 * administrable (Yape, Plin, Agora...): agregar una billetera nueva en el panel
 * la hace aparecer aqui sin tocar codigo. El QR se muestra junto al monto que
 * calculó el servidor, recién cuando ese monto está confirmado.
 */
function PagoDigital({
  billeteras,
  elegida,
  alElegir,
  monto,
  errorMonto,
  comprobante,
  comprobanteDesactualizado,
  subiendo,
  errorComprobante,
  alSubir,
}: PropsPagoDigital) {
  const datos = elegida.instrucciones;
  const qr = elegida.qrUrl;
  const billetera = elegida.nombre;
  const comprobanteUrl = comprobante?.url ?? null;

  return (
    <div className="mt-5 rounded-xl border border-borde bg-perla p-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Elegir billetera">
        {billeteras.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            onClick={() => alElegir(opcion.id)}
            aria-pressed={elegida.id === opcion.id}
            className={cn(
              "min-w-24 flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-all",
              elegida.id === opcion.id
                ? "border-acento bg-acento text-acento-contraste shadow-[0_8px_20px_-12px_rgba(125,33,129,0.5)]"
                : "border-borde bg-fondo text-texto hover:border-acento/40 hover:text-acento",
            )}
          >
            {opcion.nombre}
          </button>
        ))}
      </div>

      <div
        aria-live="polite"
        className="mt-4 rounded-xl border border-acento/30 bg-fondo px-4 py-3 text-center"
      >
        {monto !== null ? (
          <>
            <p className="text-xs uppercase tracking-wide text-texto">Monto a pagar</p>
            <p className="font-display text-2xl font-semibold text-acento">
              {formatearPrecio(monto)}
            </p>
            <p className="mt-1 text-xs text-texto">
              Solo productos. El envío se coordina después según tu destino.
            </p>
          </>
        ) : errorMonto ? (
          <p role="alert" className="text-sm text-oferta">
            {errorMonto} Recarga la página para intentar de nuevo.
          </p>
        ) : (
          <p className="flex items-center justify-center gap-2 text-sm text-texto">
            <Spinner tamano="sm" etiqueta="Calculando el monto" />
            Calculando el monto a pagar…
          </p>
        )}
      </div>

      {monto !== null && qr && (
        <figure className="mt-4 flex flex-col items-center rounded-xl border border-borde bg-fondo p-4">
          {/*
            `unoptimized`: un QR no debe pasar por el optimizador. La recompresion
            con perdida emborrona los modulos (los cuadraditos) y la camara deja
            de leerlo. Se sirve el archivo original tal cual.
          */}
          <Image
            src={qr}
            alt={`Código QR de ${billetera}`}
            width={224}
            height={224}
            unoptimized
            className="h-56 w-56 object-contain"
          />
          <figcaption className="mt-2 text-xs text-texto">
            Escanea el QR con tu app de {billetera} y paga {formatearPrecio(monto)}.
          </figcaption>
        </figure>
      )}

      {monto !== null && datos && (
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
          accept={TIPOS_COMPROBANTE}
          onChange={alSubir}
          disabled={subiendo || monto === null}
          className="sr-only"
        />

        {comprobanteUrl && (
          <div className="relative mt-3 h-40 w-32 overflow-hidden rounded-lg border border-borde bg-fondo">
            <Image
              src={comprobanteUrl}
              alt="Vista previa del comprobante subido"
              fill
              sizes="128px"
              unoptimized
              className="object-contain"
            />
          </div>
        )}

        {comprobanteDesactualizado && comprobante && monto !== null && (
          <p role="alert" className="mt-3 text-sm text-oferta">
            Tu pedido cambió: el comprobante que subiste es de{" "}
            {formatearPrecio(comprobante.monto)} y el total ahora es{" "}
            {formatearPrecio(monto)}. Sube un comprobante por el monto correcto.
          </p>
        )}

        {errorComprobante && (
          <p role="alert" className="mt-3 text-sm text-oferta">
            {errorComprobante}
          </p>
        )}
      </div>
    </div>
  );
}

function CarritoVacioCheckout({ quitados }: { quitados: string[] }) {
  const router = useRouter();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-borde bg-fondo px-6 py-16 text-center shadow-[0_1px_3px_rgba(17,17,17,0.04)]">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-acento/10 text-acento">
        <IconQrcode size={28} aria-hidden />
      </span>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-texto-fuerte">
        Tu carrito está vacío
      </h2>
      {quitados.length > 0 ? (
        <p className="mt-2 text-texto">
          Quitamos {quitados.join(", ")} porque ya no{" "}
          {quitados.length === 1 ? "está disponible" : "están disponibles"}.
        </p>
      ) : (
        <p className="mt-2 text-texto">Agrega productos antes de continuar al pago.</p>
      )}
      <Boton className="mt-6" onClick={() => router.push("/catalogo")}>
        Ver catálogo
      </Boton>
    </div>
  );
}

function Confirmacion({ confirmacion }: { confirmacion: ConfirmacionPedido }) {
  const router = useRouter();
  const esWhatsApp = confirmacion.enlaceWhatsApp !== null;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-borde bg-fondo px-6 py-16 text-center shadow-[0_18px_50px_-20px_rgba(125,33,129,0.25)]">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-green-600/30">
        <IconCheck size={32} aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-texto-fuerte">
        {esWhatsApp ? "Pedido registrado" : "Recibimos tu pedido"}
      </h1>
      <p className="mt-2 text-texto">
        Tu código de pedido es{" "}
        <span className="font-semibold text-acento">{confirmacion.codigo}</span>.
      </p>
      <p className="mt-1 text-texto">
        Total de productos:{" "}
        <span className="font-semibold text-texto-fuerte">
          {formatearPrecio(confirmacion.total)}
        </span>
      </p>

      {esWhatsApp ? (
        <>
          <p className="mt-4 max-w-sm text-sm text-texto">
            Para terminar, envíanos el mensaje por WhatsApp: ahí coordinamos el
            pago y el costo del envío según tu destino.
          </p>
          <a
            href={confirmacion.enlaceWhatsApp ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5"
          >
            <IconBrandWhatsapp size={20} aria-hidden />
            Abrir WhatsApp
          </a>
        </>
      ) : (
        <p className="mt-4 max-w-sm text-sm text-texto">
          Recibimos tu comprobante de {confirmacion.metodoPago}. Validaremos el
          pago y te escribiremos al {confirmacion.telefono} para coordinar el
          envío, cuyo costo depende de tu destino.
        </p>
      )}

      <Boton
        variante={esWhatsApp ? "secundario" : "primario"}
        className="mt-4"
        onClick={() => router.push("/catalogo")}
      >
        Seguir comprando
      </Boton>
    </div>
  );
}

/**
 * Clave por intento de compra. crypto.randomUUID solo existe en contextos seguros
 * (https o localhost): al probar desde otro equipo de la red local por http se
 * arma un UUID v4 con getRandomValues, que sí está disponible.
 */
function generarClaveIdempotencia(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function mensajeError(error: unknown, respaldo: string): string {
  if (error instanceof ErrorApi) return error.message;
  return respaldo;
}
