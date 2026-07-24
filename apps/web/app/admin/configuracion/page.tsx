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
  razonSocial: string;
  ruc: string;
  direccion: string;
  datosYape: string;
  datosPlin: string;
  qrYape: string | null;
  qrPlin: string | null;
  instagram: string;
  facebook: string;
  tiktok: string;
  heroTitulo: string;
  heroSubtitulo: string;
  heroTextoClaro: boolean;
  banners: Banner[];
  barraActiva: boolean;
  barraAnuncios: string[];
}

async function cargarFormulario(): Promise<FormularioConfig> {
  const config = await obtenerConfiguracion();
  return {
    whatsapp: config.whatsapp ?? "",
    razonSocial: config.razonSocial ?? "",
    ruc: config.ruc ?? "",
    direccion: config.direccion ?? "",
    datosYape: config.datosYape ?? "",
    datosPlin: config.datosPlin ?? "",
    qrYape: config.qrYape,
    qrPlin: config.qrPlin,
    instagram: config.instagram ?? "",
    facebook: config.facebook ?? "",
    tiktok: config.tiktok ?? "",
    heroTitulo: config.heroTitulo ?? "",
    heroSubtitulo: config.heroSubtitulo ?? "",
    heroTextoClaro: config.heroTextoClaro,
    banners: config.banners ?? [],
    barraActiva: config.barraActiva,
    barraAnuncios: config.barraAnuncios ?? [],
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
      const {
        whatsapp,
        razonSocial,
        ruc,
        direccion,
        datosYape,
        datosPlin,
        qrYape,
        qrPlin,
        instagram,
        facebook,
        tiktok,
        heroTitulo,
        heroSubtitulo,
        heroTextoClaro,
        banners,
        barraActiva,
        barraAnuncios,
      } = estado.datos;
      await actualizarConfiguracion({
        whatsapp: whatsapp.trim() || null,
        razonSocial: razonSocial.trim() || null,
        ruc: ruc.trim() || null,
        direccion: direccion.trim() || null,
        datosYape: datosYape.trim() || null,
        datosPlin: datosPlin.trim() || null,
        qrYape,
        qrPlin,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        tiktok: tiktok.trim() || null,
        heroTitulo: heroTitulo.trim() || null,
        heroSubtitulo: heroSubtitulo.trim() || null,
        heroTextoClaro,
        banners,
        barraActiva,
        barraAnuncios: barraAnuncios
          .map((mensaje) => mensaje.trim())
          .filter((mensaje) => mensaje.length > 0),
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
              Datos legales del negocio
            </h2>
            <p className="text-sm text-texto/60">
              Se muestran en el pie de página y en el Libro de Reclamaciones,
              como exige la normativa de protección al consumidor.
            </p>
            <Input
              etiqueta="Razón social o nombre del titular"
              placeholder="Ej. Valentino Benites E.I.R.L."
              value={estado.datos.razonSocial}
              onChange={(evento) => actualizarCampo("razonSocial", evento.target.value)}
            />
            <Input
              etiqueta="RUC"
              placeholder="20XXXXXXXXX"
              inputMode="numeric"
              value={estado.datos.ruc}
              onChange={(evento) => actualizarCampo("ruc", evento.target.value)}
            />
            <Input
              etiqueta="Domicilio fiscal"
              placeholder="Av. ..., distrito, Lima"
              value={estado.datos.direccion}
              onChange={(evento) => actualizarCampo("direccion", evento.target.value)}
            />
          </section>

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

            <p className="text-sm text-texto/60">
              Sube el QR de cada billetera. El cliente lo ve en el checkout para
              escanear y pagar.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CargadorQR
                etiqueta="QR de Yape"
                url={estado.datos.qrYape}
                alCambiar={(url) => actualizarCampo("qrYape", url)}
                alError={mostrarError}
              />
              <CargadorQR
                etiqueta="QR de Plin"
                url={estado.datos.qrPlin}
                alCambiar={(url) => actualizarCampo("qrPlin", url)}
                alError={mostrarError}
              />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="border-b border-borde pb-2 text-sm font-semibold uppercase tracking-wide text-texto/70">
              Redes sociales
            </h2>
            <p className="text-sm text-texto/60">
              Escribe solo el usuario, sin la URL completa. Si dejas un campo
              vacio, esa red no aparece en la tienda.
            </p>
            <Input
              etiqueta="Instagram"
              placeholder="valentinobenites.pe"
              value={estado.datos.instagram}
              onChange={(evento) => actualizarCampo("instagram", evento.target.value)}
            />
            <Input
              etiqueta="Facebook"
              placeholder="valentinobenites"
              value={estado.datos.facebook}
              onChange={(evento) => actualizarCampo("facebook", evento.target.value)}
            />
            <Input
              etiqueta="TikTok"
              placeholder="valentinobenites"
              value={estado.datos.tiktok}
              onChange={(evento) => actualizarCampo("tiktok", evento.target.value)}
            />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="border-b border-borde pb-2 text-sm font-semibold uppercase tracking-wide text-texto/70">
              Hero / Portada
            </h2>
            <Input
              etiqueta="Titulo del hero"
              placeholder="Moda que te *acompaña* todos los días"
              value={estado.datos.heroTitulo}
              onChange={(evento) => actualizarCampo("heroTitulo", evento.target.value)}
            />
            <p className="text-sm text-texto/60">
              Usa *asteriscos* para resaltar una palabra en color, ej: Moda que
              te *acompaña* todos los días
            </p>
            <div className="flex w-full flex-col gap-1.5">
              <label
                htmlFor="hero-subtitulo"
                className="text-sm font-medium text-texto-fuerte"
              >
                Subtitulo del hero
              </label>
              <textarea
                id="hero-subtitulo"
                rows={3}
                placeholder="Carteras y accesorios de cuero para mujer..."
                value={estado.datos.heroSubtitulo}
                onChange={(evento) => actualizarCampo("heroSubtitulo", evento.target.value)}
                className="w-full rounded-lg border border-borde bg-fondo px-3 py-2 text-sm text-texto-fuerte outline-none transition-colors placeholder:text-texto/50 focus:border-acento"
              />
            </div>
            <label className="flex items-center gap-3 text-sm text-texto-fuerte">
              <input
                type="checkbox"
                checked={estado.datos.heroTextoClaro}
                onChange={(evento) => actualizarCampo("heroTextoClaro", evento.target.checked)}
                className="h-4 w-4 rounded border-borde text-acento focus:ring-acento"
              />
              <span>
                Texto claro (para banners oscuros)
                <span className="block text-xs font-normal text-texto/60">
                  Actívalo si tus banners son oscuros; desactívalo si son claros.
                </span>
              </span>
            </label>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="border-b border-borde pb-2 text-sm font-semibold uppercase tracking-wide text-texto/70">
              Barra de anuncios
            </h2>
            <label className="flex items-center gap-3 text-sm text-texto-fuerte">
              <input
                type="checkbox"
                checked={estado.datos.barraActiva}
                onChange={(evento) => actualizarCampo("barraActiva", evento.target.checked)}
                className="h-4 w-4 rounded border-borde text-acento focus:ring-acento"
              />
              <span>Mostrar barra de anuncios</span>
            </label>
            <EditorAnuncios
              mensajes={estado.datos.barraAnuncios}
              alCambiar={(mensajes) => actualizarCampo("barraAnuncios", mensajes)}
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

interface PropsCargadorQR {
  etiqueta: string;
  url: string | null;
  alCambiar: (url: string | null) => void;
  alError: (mensaje: string) => void;
}

/** Sube/previsualiza una imagen de QR de pago (una sola, opcional). */
function CargadorQR({ etiqueta, url, alCambiar, alError }: PropsCargadorQR) {
  const refInput = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function subir(archivos: FileList | null) {
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
      const subido = await subirArchivo(archivo);
      alCambiar(subido.url);
    } catch (error) {
      alError(mensajeDeError(error));
    } finally {
      setSubiendo(false);
      if (refInput.current) refInput.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-texto-fuerte">{etiqueta}</span>
      <div className="flex items-center gap-3">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-borde bg-black/[.02]">
          {url ? (
            <Image src={url} alt={etiqueta} fill sizes="112px" className="object-contain p-1" />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-texto/40">
              Sin QR
            </span>
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <Boton
            type="button"
            variante="secundario"
            tamano="sm"
            onClick={() => refInput.current?.click()}
            disabled={subiendo}
          >
            {subiendo ? (
              <IconLoader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <IconUpload className="h-4 w-4" aria-hidden />
            )}
            {url ? "Cambiar" : "Subir QR"}
          </Boton>
          {url && (
            <Boton
              type="button"
              variante="fantasma"
              tamano="sm"
              onClick={() => alCambiar(null)}
            >
              <IconTrash className="h-4 w-4 text-oferta" aria-hidden />
              Quitar
            </Boton>
          )}
        </div>
      </div>
      <input
        ref={refInput}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(evento) => subir(evento.target.files)}
      />
    </div>
  );
}

interface PropsEditorAnuncios {
  mensajes: string[];
  alCambiar: (mensajes: string[]) => void;
}

/** Editor de la lista de mensajes que se desplazan en la barra superior. */
function EditorAnuncios({ mensajes, alCambiar }: PropsEditorAnuncios) {
  function actualizarMensaje(indice: number, valor: string) {
    alCambiar(mensajes.map((mensaje, posicion) => (posicion === indice ? valor : mensaje)));
  }

  function quitar(indice: number) {
    alCambiar(mensajes.filter((_, posicion) => posicion !== indice));
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-texto/60">
        Estos mensajes se desplazan en la barra superior del sitio.
      </p>

      {mensajes.length === 0 && (
        <p className="text-sm text-texto/60">
          Aun no hay mensajes. Agrega el primero.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {mensajes.map((mensaje, indice) => (
          <div key={indice} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                aria-label={`Mensaje ${indice + 1}`}
                placeholder="Envíos gratis a todo el Perú"
                value={mensaje}
                onChange={(evento) => actualizarMensaje(indice, evento.target.value)}
              />
            </div>
            <Boton
              type="button"
              variante="fantasma"
              tamano="sm"
              aria-label={`Quitar mensaje ${indice + 1}`}
              onClick={() => quitar(indice)}
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
          onClick={() => alCambiar([...mensajes, ""])}
        >
          <IconPlus className="h-4 w-4" aria-hidden />
          Agregar mensaje
        </Boton>
      </div>
    </div>
  );
}

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
