"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconCheck } from "@tabler/icons-react";
import { Boton, Input } from "@/components/ui";
import { crearReclamo, ErrorApi } from "@/lib/api";
import { cn } from "@/lib/utilidades";
import type { TipoReclamo } from "@/lib/tipos";

/**
 * Hoja de reclamacion del Libro de Reclamaciones virtual. Campos segun el
 * DS 011-2011: identificacion del consumidor, bien contratado, detalle del
 * reclamo/queja y pedido del consumidor. RECLAMO = disconformidad con el
 * producto o servicio; QUEJA = malestar con la atencion.
 */
const esquemaReclamo = z.object({
  tipo: z.enum(["RECLAMO", "QUEJA"]),
  nombreCompleto: z
    .string()
    .trim()
    .min(3, "Ingresa tu nombre completo.")
    .max(120, "El nombre es demasiado largo."),
  documento: z
    .string()
    .trim()
    .regex(/^[0-9A-Za-z-]{8,12}$/, "Ingresa un DNI o carnet de extranjería válido."),
  domicilio: z
    .string()
    .trim()
    .min(5, "Ingresa tu domicilio.")
    .max(200, "El domicilio es demasiado largo."),
  telefono: z
    .string()
    .trim()
    .regex(/^9\d{8}$/, "Ingresa un celular válido de 9 dígitos (empieza en 9)."),
  email: z
    .string()
    .trim()
    .email("Ingresa un correo válido.")
    .optional()
    .or(z.literal("")),
  esMenorDeEdad: z.boolean(),
  apoderado: z.string().trim().max(120).optional(),
  descripcionBien: z
    .string()
    .trim()
    .min(3, "Describe el producto o servicio.")
    .max(300, "La descripción es demasiado larga."),
  montoReclamado: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Ingresa un monto válido.")
    .optional()
    .or(z.literal("")),
  detalle: z
    .string()
    .trim()
    .min(10, "Detalla tu reclamo o queja (mínimo 10 caracteres).")
    .max(3000, "El detalle es demasiado largo."),
  pedidoConsumidor: z
    .string()
    .trim()
    .min(5, "Indica qué solicitas como consumidor.")
    .max(1000, "El pedido es demasiado largo."),
}).refine(
  (datos) => !datos.esMenorDeEdad || (datos.apoderado ?? "").length >= 3,
  {
    path: ["apoderado"],
    message: "Ingresa el nombre del padre, madre o apoderado.",
  },
);

type DatosReclamo = z.infer<typeof esquemaReclamo>;

export function FormularioReclamo() {
  const [codigoRegistrado, setCodigoRegistrado] = useState<string | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DatosReclamo>({
    resolver: zodResolver(esquemaReclamo),
    defaultValues: {
      tipo: "RECLAMO",
      esMenorDeEdad: false,
      email: "",
      montoReclamado: "",
    },
  });

  const tipo = watch("tipo");
  const esMenorDeEdad = watch("esMenorDeEdad");

  if (codigoRegistrado) {
    return <ReclamoRegistrado codigo={codigoRegistrado} />;
  }

  const alEnviar = handleSubmit(async (datos) => {
    setErrorEnvio(null);
    try {
      const reclamo = await crearReclamo({
        tipo: datos.tipo,
        nombreCompleto: datos.nombreCompleto,
        documento: datos.documento,
        domicilio: datos.domicilio,
        telefono: datos.telefono,
        email: datos.email || undefined,
        esMenorDeEdad: datos.esMenorDeEdad,
        apoderado: datos.esMenorDeEdad ? datos.apoderado : undefined,
        descripcionBien: datos.descripcionBien,
        montoReclamado: datos.montoReclamado
          ? Number(datos.montoReclamado)
          : undefined,
        detalle: datos.detalle,
        pedidoConsumidor: datos.pedidoConsumidor,
      });
      setCodigoRegistrado(reclamo.codigo);
    } catch (error) {
      setErrorEnvio(
        error instanceof ErrorApi
          ? error.message
          : "No pudimos registrar tu hoja de reclamación. Intenta nuevamente.",
      );
    }
  });

  return (
    <form
      onSubmit={(evento) => void alEnviar(evento)}
      noValidate
      className="flex flex-col gap-6 rounded-2xl border border-borde bg-fondo p-6 shadow-[0_1px_3px_rgba(17,17,17,0.04)] sm:p-7"
    >
      <fieldset>
        <legend className="titulo-ui text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
          Tipo de solicitud
        </legend>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(
            [
              {
                valor: "RECLAMO",
                titulo: "Reclamo",
                descripcion: "Disconformidad con el producto o servicio.",
              },
              {
                valor: "QUEJA",
                titulo: "Queja",
                descripcion: "Malestar con la atención al cliente.",
              },
            ] as { valor: TipoReclamo; titulo: string; descripcion: string }[]
          ).map((opcion) => (
            <label
              key={opcion.valor}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                tipo === opcion.valor
                  ? "border-acento bg-acento/[.04] ring-1 ring-acento"
                  : "border-borde hover:border-acento/40",
              )}
            >
              <input
                type="radio"
                value={opcion.valor}
                className="mt-1 accent-acento"
                {...register("tipo")}
              />
              <span>
                <span className="block text-sm font-semibold text-texto-fuerte">
                  {opcion.titulo}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-texto">
                  {opcion.descripcion}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="titulo-ui text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
          Tus datos
        </legend>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            etiqueta="Nombre completo"
            autoComplete="name"
            error={errors.nombreCompleto?.message}
            {...register("nombreCompleto")}
          />
          <Input
            etiqueta="DNI o carnet de extranjería"
            inputMode="numeric"
            error={errors.documento?.message}
            {...register("documento")}
          />
          <Input
            etiqueta="Domicilio"
            autoComplete="street-address"
            error={errors.domicilio?.message}
            {...register("domicilio")}
          />
          <Input
            etiqueta="Celular"
            placeholder="9XXXXXXXX"
            inputMode="numeric"
            autoComplete="tel"
            error={errors.telefono?.message}
            {...register("telefono")}
          />
          <Input
            etiqueta="Correo electrónico (opcional)"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-texto">
          <input
            type="checkbox"
            className="h-4 w-4 accent-acento"
            {...register("esMenorDeEdad")}
          />
          Soy menor de edad
        </label>
        {esMenorDeEdad && (
          <div className="mt-3">
            <Input
              etiqueta="Nombre del padre, madre o apoderado"
              error={errors.apoderado?.message}
              {...register("apoderado")}
            />
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="titulo-ui text-sm font-semibold uppercase tracking-wide text-texto-fuerte">
          Detalle de tu {tipo === "RECLAMO" ? "reclamo" : "queja"}
        </legend>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            etiqueta="Producto o servicio"
            placeholder="Ej. Cartera Bandolera Andina"
            error={errors.descripcionBien?.message}
            {...register("descripcionBien")}
          />
          <Input
            etiqueta="Monto reclamado en soles (opcional)"
            inputMode="decimal"
            placeholder="Ej. 84.90"
            error={errors.montoReclamado?.message}
            {...register("montoReclamado")}
          />
        </div>
        <div className="mt-4">
          <AreaTexto
            etiqueta="Detalle"
            filas={5}
            error={errors.detalle?.message}
            {...register("detalle")}
          />
        </div>
        <div className="mt-4">
          <AreaTexto
            etiqueta="Pedido del consumidor (qué solicitas)"
            filas={3}
            error={errors.pedidoConsumidor?.message}
            {...register("pedidoConsumidor")}
          />
        </div>
      </fieldset>

      <p className="text-xs leading-relaxed text-texto">
        Al enviar este formulario aceptas el tratamiento de tus datos personales
        para atender tu reclamo o queja, según nuestra{" "}
        <Link href="/privacidad" className="font-medium text-acento underline">
          Política de Privacidad
        </Link>
        . La respuesta se enviará al contacto indicado en un plazo máximo de 15
        días hábiles.
      </p>

      {errorEnvio && (
        <p
          role="alert"
          className="rounded-xl border border-oferta/30 bg-oferta/5 px-4 py-3 text-sm text-oferta"
        >
          {errorEnvio}
        </p>
      )}

      <Boton type="submit" tamano="lg" cargando={isSubmitting} className="w-full sm:w-auto">
        Enviar hoja de reclamación
      </Boton>
    </form>
  );
}

interface PropsAreaTexto
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta: string;
  filas: number;
  error?: string;
}

/** Textarea con la misma anatomia visual que el Input del sistema de UI. */
function AreaTexto({ etiqueta, filas, error, id, ...props }: PropsAreaTexto) {
  const idCampo = id ?? props.name;
  return (
    <div>
      <label
        htmlFor={idCampo}
        className="mb-1.5 block text-sm font-medium text-texto-fuerte"
      >
        {etiqueta}
      </label>
      <textarea
        id={idCampo}
        rows={filas}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full rounded-xl border bg-fondo px-4 py-3 text-sm text-texto-fuerte placeholder:text-texto/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento",
          error ? "border-oferta" : "border-borde",
        )}
        {...props}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-oferta">
          {error}
        </p>
      )}
    </div>
  );
}

function ReclamoRegistrado({ codigo }: { codigo: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-borde bg-fondo px-6 py-16 text-center shadow-[0_18px_50px_-20px_rgba(125,33,129,0.25)]">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-green-600/30">
        <IconCheck size={32} aria-hidden />
      </span>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-texto-fuerte">
        Hoja de reclamación registrada
      </h2>
      <p className="mt-2 text-texto">
        Tu código de registro es{" "}
        <span className="font-semibold text-acento">{codigo}</span>.
      </p>
      <p className="mt-1 max-w-sm text-sm text-texto">
        Guarda este código. Te responderemos al contacto indicado en un plazo
        máximo de 15 días hábiles.
      </p>
    </div>
  );
}
