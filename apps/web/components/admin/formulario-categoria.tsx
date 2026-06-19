"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Categoria, CategoriaEntrada } from "@/lib/tipos";
import { Boton, Input } from "@/components/ui";
import { generarSlug } from "./slug";

const esquemaCategoria = z.object({
  nombre: z.string().min(1, "Ingresa el nombre"),
  slug: z.string().min(1, "Ingresa el slug"),
  orden: z.coerce.number().int("Debe ser un numero entero").min(0, "No puede ser negativo"),
  activo: z.boolean(),
});

type EntradaCategoria = z.input<typeof esquemaCategoria>;
type SalidaCategoria = z.output<typeof esquemaCategoria>;

interface PropsFormularioCategoria {
  categoria: Categoria | null;
  enviando: boolean;
  alGuardar: (datos: CategoriaEntrada) => void;
  alCancelar: () => void;
}

export function FormularioCategoria({
  categoria,
  enviando,
  alGuardar,
  alCancelar,
}: PropsFormularioCategoria) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<EntradaCategoria, unknown, SalidaCategoria>({
    resolver: zodResolver(esquemaCategoria),
    defaultValues: {
      nombre: categoria?.nombre ?? "",
      slug: categoria?.slug ?? "",
      orden: categoria?.orden ?? 0,
      activo: categoria?.activo ?? true,
    },
  });

  // Autocompleta el slug a partir del nombre solo si esta vacio (categoria nueva).
  function alCambiarNombre(valor: string) {
    if (!categoria && !getValues("slug")) {
      setValue("slug", generarSlug(valor));
    }
  }

  return (
    <form onSubmit={handleSubmit((datos) => alGuardar(datos))} noValidate className="flex flex-col gap-4">
      <Input
        etiqueta="Nombre"
        error={errors.nombre?.message}
        {...register("nombre", {
          onChange: (evento) => alCambiarNombre(evento.target.value),
        })}
      />
      <Input etiqueta="Slug" error={errors.slug?.message} {...register("slug")} />
      <Input
        etiqueta="Orden"
        type="number"
        min={0}
        error={errors.orden?.message}
        {...register("orden")}
      />

      <label className="flex items-center gap-2 text-sm text-texto-fuerte">
        <input type="checkbox" className="h-4 w-4 accent-acento" {...register("activo")} />
        Categoria activa
      </label>

      <div className="mt-2 flex justify-end gap-2">
        <Boton type="button" variante="secundario" onClick={alCancelar} disabled={enviando}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={enviando}>
          Guardar
        </Boton>
      </div>
    </form>
  );
}
