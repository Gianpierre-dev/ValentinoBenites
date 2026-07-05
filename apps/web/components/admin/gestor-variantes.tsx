"use client";

import { useState } from "react";
import Image from "next/image";
import { IconPlus, IconPencil, IconTrash, IconPhoto } from "@tabler/icons-react";
import {
  crearVariante,
  actualizarVariante,
  eliminarVariante,
} from "@/lib/api";
import type { Producto, Variante, VarianteEntrada } from "@/lib/tipos";
import { formatearPrecio } from "@/lib/utilidades";
import { Boton, Etiqueta, Input } from "@/components/ui";
import { CargadorImagenes, type ImagenCargada } from "./cargador-imagenes";
import { ModalConfirmacion } from "./modal";
import { useToast } from "./proveedor-toast";
import { mensajeDeError } from "./errores";

interface PropsGestorVariantes {
  producto: Producto;
  /** Recarga el catalogo del padre tras cada cambio. */
  alCambiar: () => Promise<void>;
}

interface BorradorVariante {
  color: string;
  colorHex: string;
  precio: string;
  activo: boolean;
  imagenes: ImagenCargada[];
}

function borradorDesde(variante: Variante | null): BorradorVariante {
  return {
    color: variante?.color ?? "",
    colorHex: variante?.colorHex ?? "",
    precio: variante?.precio != null ? String(variante.precio) : "",
    activo: variante?.activo ?? true,
    imagenes: variante?.imagenes.map((img) => ({ url: img.url })) ?? [],
  };
}

/**
 * CRUD de variantes de color de un producto (modelo). Cada variante es la unidad
 * comprable: color obligatorio, hex opcional, override de precio opcional y fotos
 * propias opcionales (si no hay, la ficha usa las del modelo como fallback).
 * Modelo hecho-a-pedido: no hay stock.
 */
export function GestorVariantes({ producto, alCambiar }: PropsGestorVariantes) {
  const { mostrarExito, mostrarError } = useToast();
  const [editando, setEditando] = useState<Variante | null>(null);
  const [creando, setCreando] = useState(false);
  const [borrador, setBorrador] = useState<BorradorVariante>(borradorDesde(null));
  const [errorColor, setErrorColor] = useState<string | undefined>();
  const [errorHex, setErrorHex] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [aEliminar, setAEliminar] = useState<Variante | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const formularioAbierto = creando || editando !== null;
  const variantes = [...producto.variantes].sort((a, b) => a.orden - b.orden);

  function abrirNueva() {
    setEditando(null);
    setBorrador(borradorDesde(null));
    setErrorColor(undefined);
    setErrorHex(undefined);
    setCreando(true);
  }

  function abrirEdicion(variante: Variante) {
    setCreando(false);
    setEditando(variante);
    setBorrador(borradorDesde(variante));
    setErrorColor(undefined);
    setErrorHex(undefined);
  }

  function cerrarFormulario() {
    setCreando(false);
    setEditando(null);
    setErrorColor(undefined);
    setErrorHex(undefined);
  }

  function construirEntrada(): VarianteEntrada {
    const precioTexto = borrador.precio.trim();
    const precio = precioTexto === "" ? null : Number(precioTexto);
    return {
      color: borrador.color.trim(),
      colorHex: borrador.colorHex.trim() === "" ? null : borrador.colorHex.trim(),
      precio: precio != null && Number.isFinite(precio) ? precio : null,
      activo: borrador.activo,
      imagenes: borrador.imagenes.map((img, indice) => ({
        url: img.url,
        orden: indice,
      })),
    };
  }

  async function guardar() {
    if (borrador.color.trim() === "") {
      setErrorColor("El color es obligatorio.");
      return;
    }
    // La tienda dibuja la bolita del selector con este hex; sin el, la bolita
    // cae a la primera foto de la variante (y sin fotos quedaria vacia).
    const hex = borrador.colorHex.trim();
    if (hex === "") {
      setErrorHex("El codigo hex es obligatorio: pinta la bolita del color en la tienda.");
      return;
    }
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
      setErrorHex('Formato invalido: usa "#" y 3 o 6 digitos, ej. #7D2181.');
      return;
    }
    const precioTexto = borrador.precio.trim();
    if (precioTexto !== "" && !Number.isFinite(Number(precioTexto))) {
      mostrarError("El precio debe ser un numero valido.");
      return;
    }

    setEnviando(true);
    try {
      if (editando) {
        await actualizarVariante(editando.id, construirEntrada());
        mostrarExito("Variante actualizada.");
      } else {
        await crearVariante(producto.id, construirEntrada());
        mostrarExito("Variante agregada.");
      }
      cerrarFormulario();
      await alCambiar();
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarEliminar() {
    if (!aEliminar) return;
    setEliminando(true);
    try {
      await eliminarVariante(aEliminar.id);
      mostrarExito("Variante eliminada.");
      setAEliminar(null);
      await alCambiar();
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-texto-fuerte">Colores</h3>
          <p className="text-xs text-texto/60">
            Cada color es una variante comprable. Sin fotos propias, se usan las del
            producto.
          </p>
        </div>
        {!formularioAbierto && (
          <Boton variante="secundario" tamano="sm" onClick={abrirNueva}>
            <IconPlus className="h-4 w-4" aria-hidden />
            Agregar color
          </Boton>
        )}
      </div>

      {variantes.length === 0 && !formularioAbierto && (
        <p className="border border-dashed border-borde px-4 py-6 text-center text-sm text-texto/60">
          Este producto aun no tiene colores. Agrega al menos uno para poder venderlo.
        </p>
      )}

      {variantes.length > 0 && (
        <ul className="flex flex-col divide-y divide-borde border-y border-borde">
          {variantes.map((variante) => (
            <li
              key={variante.id}
              className="flex items-center gap-3 py-3"
            >
              <MiniaturaVariante variante={variante} />
              <span
                aria-hidden
                className="h-5 w-5 shrink-0 rounded-full border border-borde"
                style={{ backgroundColor: variante.colorHex ?? "transparent" }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-texto-fuerte">
                  {variante.color}
                </p>
                <p className="text-xs text-texto/60">
                  {variante.precio != null
                    ? `Precio propio: ${formatearPrecio(variante.precio)}`
                    : "Hereda el precio del producto"}
                </p>
              </div>
              {!variante.activo && <Etiqueta variante="neutral">Inactiva</Etiqueta>}
              <div className="flex gap-1">
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  aria-label={`Editar color ${variante.color}`}
                  onClick={() => abrirEdicion(variante)}
                >
                  <IconPencil className="h-4 w-4" aria-hidden />
                </Boton>
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  aria-label={`Eliminar color ${variante.color}`}
                  onClick={() => setAEliminar(variante)}
                >
                  <IconTrash className="h-4 w-4 text-oferta" aria-hidden />
                </Boton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formularioAbierto && (
        <div className="flex flex-col gap-4 border border-borde bg-black/[.015] p-4">
          <p className="text-sm font-semibold text-texto-fuerte">
            {editando ? `Editar color "${editando.color}"` : "Nuevo color"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              etiqueta="Color"
              placeholder="Vino, Rosa, Negro..."
              value={borrador.color}
              error={errorColor}
              onChange={(evento) => {
                setBorrador((actual) => ({ ...actual, color: evento.target.value }));
                setErrorColor(undefined);
              }}
            />
            <Input
              etiqueta="Codigo de color (hex)"
              placeholder="#7D2181"
              value={borrador.colorHex}
              error={errorHex}
              onChange={(evento) => {
                setBorrador((actual) => ({ ...actual, colorHex: evento.target.value }));
                setErrorHex(undefined);
              }}
            />
            <Input
              etiqueta="Precio propio (opcional)"
              type="number"
              min={0}
              step="0.01"
              placeholder="Hereda del producto"
              value={borrador.precio}
              onChange={(evento) =>
                setBorrador((actual) => ({ ...actual, precio: evento.target.value }))
              }
            />
            <label className="flex items-end gap-2 pb-2 text-sm text-texto-fuerte">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={borrador.activo}
                onChange={(evento) =>
                  setBorrador((actual) => ({ ...actual, activo: evento.target.checked }))
                }
              />
              Color visible en la tienda
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-texto-fuerte">
              Fotos del color (opcional)
            </p>
            <CargadorImagenes
              imagenes={borrador.imagenes}
              alCambiar={(imagenes) =>
                setBorrador((actual) => ({ ...actual, imagenes }))
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Boton
              variante="secundario"
              tamano="sm"
              type="button"
              onClick={cerrarFormulario}
              disabled={enviando}
            >
              Cancelar
            </Boton>
            <Boton tamano="sm" type="button" onClick={guardar} cargando={enviando}>
              {editando ? "Guardar cambios" : "Agregar color"}
            </Boton>
          </div>
        </div>
      )}

      <ModalConfirmacion
        abierto={aEliminar !== null}
        titulo="Eliminar color"
        mensaje={`Se ocultara el color "${aEliminar?.color ?? ""}" de la tienda. Los pedidos que ya lo tienen no se ven afectados.`}
        cargando={eliminando}
        alConfirmar={confirmarEliminar}
        alCancelar={() => setAEliminar(null)}
      />
    </div>
  );
}

function MiniaturaVariante({ variante }: { variante: Variante }) {
  const portada = variante.imagenesEfectivas[0] ?? variante.imagenes[0];
  if (!portada) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-borde bg-black/[.02] text-texto/40">
        <IconPhoto className="h-5 w-5" aria-hidden />
      </div>
    );
  }
  return (
    <div className="relative h-12 w-12 shrink-0 border border-borde">
      <Image
        src={portada.url}
        alt={variante.color}
        fill
        sizes="48px"
        className="object-cover"
      />
    </div>
  );
}
