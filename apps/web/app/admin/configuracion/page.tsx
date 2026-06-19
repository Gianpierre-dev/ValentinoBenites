"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { IconPlus, IconTrash, IconUpload, IconLoader2 } from "@tabler/icons-react";
import { obtenerConfiguracion, actualizarConfiguracion, subirArchivo } from "@/lib/api";
import type { Banner } from "@/lib/tipos";
import {
  EncabezadoPagina,
  VistaCargando,
  VistaError,
  useToast,
  useRecurso,
  mensajeDeError,
} from "@/components/admin";
import { Boton, Input } from "@/components/ui";

interface FormularioConfig {
  whatsapp: string;
  datosYape: string;
  datosPlin: string;
  banners: Banner[];
}

async function cargarFormulario(): Promise<FormularioConfig> {
  const config = await obtenerConfiguracion();
  return {
    whatsapp: config.whatsapp ?? "",
    datosYape: config.datosYape ?? "",
    datosPlin: config.datosPlin ?? "",
    banners: config.banners ?? [],
  };
}

export default function PaginaConfiguracion() {
  const { mostrarExito, mostrarError } = useToast();
  const { estado, recargar, fijarDatos } = useRecurso<FormularioConfig>(cargarFormulario);
  const [guardando, setGuardando] = useState(false);

  function actualizarCampo<C extends keyof FormularioConfig>(campo: C, valor: FormularioConfig[C]) {
    if (estado.tipo !== "listo") return;
    fijarDatos({ ...estado.datos, [campo]: valor });
  }

  async function guardar() {
    if (estado.tipo !== "listo") return;
    setGuardando(true);
    try {
      const { whatsapp, datosYape, datosPlin, banners } = estado.datos;
      await actualizarConfiguracion({
        whatsapp: whatsapp.trim() || null,
        datosYape: datosYape.trim() || null,
        datosPlin: datosPlin.trim() || null,
        banners,
      });
      mostrarExito("Configuracion guardada.");
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Configuracion"
        descripcion="Datos de contacto, pagos y banners de la tienda."
      />

      {estado.tipo === "cargando" && <VistaCargando etiqueta="Cargando configuracion" />}
      {estado.tipo === "error" && <VistaError mensaje={estado.mensaje} alReintentar={recargar} />}

      {estado.tipo === "listo" && (
        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            void guardar();
          }}
          className="flex max-w-2xl flex-col gap-8"
        >
          <section className="flex flex-col gap-4">
            <h2 className="border-b border-borde pb-2 text-sm font-semibold uppercase tracking-wide text-texto/70">
              Contacto y pagos
            </h2>
            <Input
              etiqueta="Numero de WhatsApp"
              placeholder="51999888777"
              value={estado.datos.whatsapp}
              onChange={(evento) => actualizarCampo("whatsapp", evento.target.value)}
            />
            <Input
              etiqueta="Datos Yape"
              placeholder="Nombre y numero asociado a Yape"
              value={estado.datos.datosYape}
              onChange={(evento) => actualizarCampo("datosYape", evento.target.value)}
            />
            <Input
              etiqueta="Datos Plin"
              placeholder="Nombre y numero asociado a Plin"
              value={estado.datos.datosPlin}
              onChange={(evento) => actualizarCampo("datosPlin", evento.target.value)}
            />
          </section>

          <EditorBanners
            banners={estado.datos.banners}
            alCambiar={(banners) => actualizarCampo("banners", banners)}
            alError={mostrarError}
          />

          <div className="flex justify-end">
            <Boton type="submit" cargando={guardando}>
              Guardar cambios
            </Boton>
          </div>
        </form>
      )}
    </>
  );
}

interface PropsEditorBanners {
  banners: Banner[];
  alCambiar: (banners: Banner[]) => void;
  alError: (mensaje: string) => void;
}

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

function EditorBanners({ banners, alCambiar, alError }: PropsEditorBanners) {
  const refInput = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function agregarDesdeArchivo(archivos: FileList | null) {
    const archivo = archivos?.[0];
    if (!archivo) return;
    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      alError("El archivo no es una imagen valida.");
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      alError("La imagen supera el limite de 5 MB.");
      return;
    }
    setSubiendo(true);
    try {
      const { url } = await subirArchivo(archivo);
      alCambiar([...banners, { imagenUrl: url, titulo: "", enlace: "" }]);
    } catch (error) {
      alError(mensajeDeError(error));
    } finally {
      setSubiendo(false);
      if (refInput.current) refInput.current.value = "";
    }
  }

  function actualizarBanner(indice: number, parcial: Partial<Banner>) {
    alCambiar(banners.map((banner, posicion) => (posicion === indice ? { ...banner, ...parcial } : banner)));
  }

  function quitar(indice: number) {
    alCambiar(banners.filter((_, posicion) => posicion !== indice));
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-b border-borde pb-2 text-sm font-semibold uppercase tracking-wide text-texto/70">
        Banners de la home
      </h2>

      {banners.length === 0 && (
        <p className="text-sm text-texto/60">Aun no hay banners. Agrega el primero.</p>
      )}

      <div className="flex flex-col gap-4">
        {banners.map((banner, indice) => (
          <div key={`${banner.imagenUrl}-${indice}`} className="flex flex-col gap-3 border border-borde p-3 sm:flex-row">
            <div className="relative h-24 w-full shrink-0 overflow-hidden border border-borde bg-black/[.02] sm:w-40">
              <Image
                src={banner.imagenUrl}
                alt={banner.titulo || `Banner ${indice + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, 160px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <Input
                etiqueta="Titulo (opcional)"
                value={banner.titulo ?? ""}
                onChange={(evento) => actualizarBanner(indice, { titulo: evento.target.value })}
              />
              <Input
                etiqueta="Enlace (opcional)"
                placeholder="/catalogo"
                value={banner.enlace ?? ""}
                onChange={(evento) => actualizarBanner(indice, { enlace: evento.target.value })}
              />
            </div>
            <Boton
              type="button"
              variante="fantasma"
              tamano="sm"
              aria-label={`Quitar banner ${indice + 1}`}
              onClick={() => quitar(indice)}
              className="self-start"
            >
              <IconTrash className="h-4 w-4 text-oferta" aria-hidden />
            </Boton>
          </div>
        ))}
      </div>

      <div>
        <Boton
          type="button"
          variante="secundario"
          onClick={() => refInput.current?.click()}
          disabled={subiendo}
        >
          {subiendo ? (
            <IconLoader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <IconPlus className="h-4 w-4" aria-hidden />
          )}
          <IconUpload className="h-4 w-4" aria-hidden />
          {subiendo ? "Subiendo" : "Agregar banner"}
        </Boton>
        <input
          ref={refInput}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(evento) => agregarDesdeArchivo(evento.target.files)}
        />
      </div>
    </section>
  );
}
