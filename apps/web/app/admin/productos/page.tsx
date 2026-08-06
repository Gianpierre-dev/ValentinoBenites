"use client";

import { useState } from "react";
import Image from "next/image";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconPhoto,
  IconPalette,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import {
  listarProductosAdmin,
  listarCategorias,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  exportarCatalogoExcel,
} from "@/lib/api";
import type { Categoria, Producto, ProductoEntrada } from "@/lib/tipos";
import { cn, formatearPrecio, precioVigente } from "@/lib/utilidades";
import {
  EncabezadoPagina,
  VistaCargando,
  VistaError,
  VistaVacia,
  Tabla,
  EncabezadoTabla,
  CuerpoTabla,
  Th,
  Td,
  Modal,
  ModalConfirmacion,
  useToast,
  useRecurso,
  mensajeDeError,
} from "@/components/admin";
import { FormularioProducto } from "@/components/admin/formulario-producto";
import { GestorVariantes } from "@/components/admin/gestor-variantes";
import { Boton, Etiqueta } from "@/components/ui";

interface DatosVista {
  productos: Producto[];
  categorias: Categoria[];
}

async function cargarVista(): Promise<DatosVista> {
  const [productos, categorias] = await Promise.all([
    listarProductosAdmin(),
    listarCategorias(),
  ]);
  return { productos, categorias };
}

export default function PaginaProductos() {
  const { mostrarExito, mostrarError } = useToast();
  const { estado, recargar } = useRecurso<DatosVista>(cargarVista);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [creando, setCreando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aEliminar, setAEliminar] = useState<Producto | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [gestionandoColores, setGestionandoColores] = useState<Producto | null>(null);
  const [alternandoId, setAlternandoId] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const cargar = recargar;

  /** Prende/apaga un producto (lo trabaja o no) sin abrir el editor. */
  async function alternarActivo(producto: Producto) {
    setAlternandoId(producto.id);
    try {
      await actualizarProducto(producto.id, { activo: !producto.activo });
      mostrarExito(
        producto.activo
          ? `"${producto.nombre}" ya no se muestra en la tienda.`
          : `"${producto.nombre}" ahora se muestra en la tienda.`,
      );
      await cargar();
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setAlternandoId(null);
    }
  }

  async function descargarExcel() {
    setExportando(true);
    try {
      await exportarCatalogoExcel();
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setExportando(false);
    }
  }

  const formularioAbierto = creando || editando !== null;
  const categorias = estado.tipo === "listo" ? estado.datos.categorias : [];
  const productoColores =
    gestionandoColores && estado.tipo === "listo"
      ? estado.datos.productos.find((p) => p.id === gestionandoColores.id) ?? null
      : null;

  function cerrarFormulario() {
    setCreando(false);
    setEditando(null);
  }

  async function guardar(datos: ProductoEntrada) {
    setEnviando(true);
    try {
      if (editando) {
        await actualizarProducto(editando.id, datos);
        mostrarExito("Producto actualizado.");
      } else {
        await crearProducto(datos);
        mostrarExito("Producto creado.");
      }
      cerrarFormulario();
      await cargar();
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
      await eliminarProducto(aEliminar.id);
      mostrarExito("Producto eliminado.");
      setAEliminar(null);
      await cargar();
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setEliminando(false);
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Productos"
        descripcion="Activa o desactiva los productos que trabajas. Descarga el catálogo en Excel para revisarlo."
        acciones={
          <div className="flex gap-2">
            <Boton
              variante="secundario"
              cargando={exportando}
              onClick={() => void descargarExcel()}
            >
              <IconFileSpreadsheet className="h-4 w-4" aria-hidden />
              Descargar Excel
            </Boton>
            <Boton onClick={() => setCreando(true)}>
              <IconPlus className="h-4 w-4" aria-hidden />
              Nuevo producto
            </Boton>
          </div>
        }
      />

      {estado.tipo === "cargando" && <VistaCargando etiqueta="Cargando productos" />}
      {estado.tipo === "error" && <VistaError mensaje={estado.mensaje} alReintentar={cargar} />}

      {estado.tipo === "listo" && estado.datos.productos.length === 0 && (
        <VistaVacia>Aun no tienes productos. Crea el primero.</VistaVacia>
      )}

      {estado.tipo === "listo" && estado.datos.productos.length > 0 && (
        <Tabla etiqueta="Listado de productos">
          <EncabezadoTabla>
            <tr>
              <Th>Producto</Th>
              <Th>Categoria</Th>
              <Th className="text-right">Precio</Th>
              <Th className="text-center">Colores</Th>
              <Th className="text-center">Estado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </EncabezadoTabla>
          <CuerpoTabla>
            {estado.datos.productos.map((producto) => (
              <tr key={producto.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Miniatura producto={producto} />
                    <div>
                      <p className="font-medium">{producto.nombre}</p>
                      {producto.destacado && (
                        <Etiqueta variante="acento" className="mt-1">
                          Destacado
                        </Etiqueta>
                      )}
                    </div>
                  </div>
                </Td>
                <Td className="text-texto/70">{nombreCategoria(producto, categorias)}</Td>
                <Td className="text-right">
                  {formatearPrecio(precioVigente(producto.precio, producto.precioOferta))}
                  {producto.precioOferta !== null && producto.precioOferta < producto.precio && (
                    <span className="ml-2 text-xs text-texto/50 line-through">
                      {formatearPrecio(producto.precio)}
                    </span>
                  )}
                </Td>
                <Td className="text-center">
                  {producto.variantes.filter((v) => v.activo).length}
                </Td>
                <Td className="text-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={producto.activo}
                    aria-label={`${producto.activo ? "Desactivar" : "Activar"} ${producto.nombre}`}
                    disabled={alternandoId === producto.id}
                    onClick={() => void alternarActivo(producto)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento focus-visible:ring-offset-2 disabled:opacity-50",
                      producto.activo ? "bg-acento" : "bg-borde",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                        producto.activo ? "translate-x-6" : "translate-x-1",
                      )}
                    />
                  </button>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Boton
                      variante="fantasma"
                      tamano="sm"
                      aria-label={`Gestionar colores de ${producto.nombre}`}
                      onClick={() => setGestionandoColores(producto)}
                    >
                      <IconPalette className="h-4 w-4" aria-hidden />
                    </Boton>
                    <Boton
                      variante="fantasma"
                      tamano="sm"
                      aria-label={`Editar ${producto.nombre}`}
                      onClick={() => setEditando(producto)}
                    >
                      <IconPencil className="h-4 w-4" aria-hidden />
                    </Boton>
                    <Boton
                      variante="fantasma"
                      tamano="sm"
                      aria-label={`Eliminar ${producto.nombre}`}
                      onClick={() => setAEliminar(producto)}
                    >
                      <IconTrash className="h-4 w-4 text-oferta" aria-hidden />
                    </Boton>
                  </div>
                </Td>
              </tr>
            ))}
          </CuerpoTabla>
        </Tabla>
      )}

      <Modal
        abierto={formularioAbierto}
        titulo={editando ? "Editar producto" : "Nuevo producto"}
        alCerrar={cerrarFormulario}
        anchoMaximo="max-w-2xl"
      >
        <FormularioProducto
          producto={editando}
          categorias={categorias}
          enviando={enviando}
          alGuardar={guardar}
          alCancelar={cerrarFormulario}
        />
      </Modal>

      <ModalConfirmacion
        abierto={aEliminar !== null}
        titulo="Eliminar producto"
        mensaje={`Se eliminara "${aEliminar?.nombre ?? ""}". Esta accion no se puede deshacer.`}
        cargando={eliminando}
        alConfirmar={confirmarEliminar}
        alCancelar={() => setAEliminar(null)}
      />

      <Modal
        abierto={gestionandoColores !== null}
        titulo={`Colores de "${gestionandoColores?.nombre ?? ""}"`}
        alCerrar={() => setGestionandoColores(null)}
        anchoMaximo="max-w-2xl"
      >
        {productoColores && (
          <GestorVariantes producto={productoColores} alCambiar={cargar} />
        )}
      </Modal>
    </>
  );
}

function Miniatura({ producto }: { producto: Producto }) {
  const portada = producto.imagenes[0];
  if (!portada) {
    return (
      <div className="flex h-12 w-12 items-center justify-center border border-borde bg-black/[.02] text-texto/40">
        <IconPhoto className="h-5 w-5" aria-hidden />
      </div>
    );
  }
  return (
    <div className="relative h-12 w-12 shrink-0 border border-borde">
      <Image
        src={portada.url}
        alt={producto.nombre}
        fill
        sizes="48px"
        className="object-cover"
      />
    </div>
  );
}

function nombreCategoria(producto: Producto, categorias: Categoria[]): string {
  if (producto.categoria) return producto.categoria.nombre;
  if (!producto.categoriaId) return "Sin categoria";
  return categorias.find((categoria) => categoria.id === producto.categoriaId)?.nombre ?? "Sin categoria";
}
