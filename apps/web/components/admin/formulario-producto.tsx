"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Categoria, Producto, ProductoEntrada } from "@/lib/tipos";
import { Boton, Input } from "@/components/ui";
import { generarSlug } from "./slug";
import { CargadorImagenes, type ImagenCargada } from "./cargador-imagenes";

/** Convierte cadenas vacias de inputs numericos opcionales en undefined. */
const numeroOpcional = z.preprocess(
  (valor) => (valor === "" || valor === null || valor === undefined ? undefined : valor),
  z.coerce.number().positive("La oferta debe ser mayor a 0").optional(),
);

const esquemaProducto = z
  .object({
    nombre: z.string().min(1, "Ingresa el nombre"),
    slug: z.string().min(1, "Ingresa el slug"),
    descripcion: z.string().optional(),
    precio: z.coerce.number().positive("El precio debe ser mayor a 0"),
    precioOferta: numeroOpcional,
    stock: z.coerce.number().int("Debe ser un numero entero").min(0, "No puede ser negativo"),
    categoriaId: z.string().min(1, "Selecciona una categoria"),
    activo: z.boolean(),
    destacado: z.boolean(),
  })
  .refine(
    (datos) => datos.precioOferta === undefined || datos.precioOferta < datos.precio,
    { message: "La oferta debe ser menor al precio", path: ["precioOferta"] },
  );

type EntradaProducto = z.input<typeof esquemaProducto>;
type SalidaProducto = z.output<typeof esquemaProducto>;

interface PropsFormularioProducto {
  producto: Producto | null;
  categorias: Categoria[];
  enviando: boolean;
  alGuardar: (datos: ProductoEntrada) => void;
  alCancelar: () => void;
}

export function FormularioProducto({
  producto,
  categorias,
  enviando,
  alGuardar,
  alCancelar,
}: PropsFormularioProducto) {
  const [imagenes, setImagenes] = useState<ImagenCargada[]>(
    producto?.imagenes.map((imagen) => ({ url: imagen.url })) ?? [],
  );

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<EntradaProducto, unknown, SalidaProducto>({
    resolver: zodResolver(esquemaProducto),
    defaultValues: {
      nombre: producto?.nombre ?? "",
      slug: producto?.slug ?? "",
      descripcion: producto?.descripcion ?? "",
      precio: producto?.precio ?? undefined,
      precioOferta: producto?.precioOferta ?? undefined,
      stock: producto?.stock ?? 0,
      categoriaId: producto?.categoriaId ?? "",
      activo: producto?.activo ?? true,
      destacado: producto?.destacado ?? false,
    },
  });

  function alCambiarNombre(valor: string) {
    if (!producto && !getValues("slug")) {
      setValue("slug", generarSlug(valor));
    }
  }

  function enviar(datos: SalidaProducto) {
    const entrada: ProductoEntrada = {
      nombre: datos.nombre,
      slug: datos.slug,
      descripcion: datos.descripcion?.trim() ? datos.descripcion.trim() : null,
      precio: datos.precio,
      precioOferta: datos.precioOferta ?? null,
      stock: datos.stock,
      categoriaId: datos.categoriaId,
      activo: datos.activo,
      destacado: datos.destacado,
      imagenes: imagenes.map((imagen, orden) => ({ url: imagen.url, orden })),
    };
    alGuardar(entrada);
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="flex flex-col gap-4">
      <Input
        etiqueta="Nombre"
        error={errors.nombre?.message}
        {...register("nombre", { onChange: (evento) => alCambiarNombre(evento.target.value) })}
      />
      <Input etiqueta="Slug" error={errors.slug?.message} {...register("slug")} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="campo-descripcion" className="text-sm font-medium text-texto-fuerte">
          Descripcion
        </label>
        <textarea
          id="campo-descripcion"
          rows={3}
          className="w-full border border-borde bg-fondo px-3 py-2 text-sm text-texto-fuerte outline-none transition-colors placeholder:text-texto/50 focus:border-acento"
          {...register("descripcion")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          etiqueta="Precio (S/)"
          type="number"
          step="0.01"
          min={0}
          error={errors.precio?.message}
          {...register("precio")}
        />
        <Input
          etiqueta="Precio oferta (S/) — opcional"
          type="number"
          step="0.01"
          min={0}
          error={errors.precioOferta?.message}
          {...register("precioOferta")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          etiqueta="Stock"
          type="number"
          min={0}
          error={errors.stock?.message}
          {...register("stock")}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="campo-categoria" className="text-sm font-medium text-texto-fuerte">
            Categoria
          </label>
          <select
            id="campo-categoria"
            aria-invalid={errors.categoriaId ? true : undefined}
            className="h-11 w-full border border-borde bg-fondo px-3 text-sm text-texto-fuerte outline-none transition-colors focus:border-acento"
            {...register("categoriaId")}
          >
            <option value="">Selecciona una categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
          {errors.categoriaId && (
            <p role="alert" className="text-xs text-oferta">
              {errors.categoriaId.message}
            </p>
          )}
        </div>
      </div>

      <CargadorImagenes imagenes={imagenes} alCambiar={setImagenes} />

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-texto-fuerte">
          <input type="checkbox" className="h-4 w-4 accent-acento" {...register("activo")} />
          Producto activo
        </label>
        <label className="flex items-center gap-2 text-sm text-texto-fuerte">
          <input type="checkbox" className="h-4 w-4 accent-acento" {...register("destacado")} />
          Destacado en la home
        </label>
      </div>

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
