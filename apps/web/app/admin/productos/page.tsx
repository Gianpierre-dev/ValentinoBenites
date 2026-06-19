"use client";

import { useState } from "react";
import Image from "next/image";
import { IconPlus, IconPencil, IconTrash, IconPhoto } from "@tabler/icons-react";
import {
  listarProductos,
  listarCategorias,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "@/lib/api";
import type { Categoria, Producto, ProductoEntrada } from "@/lib/tipos";
import { formatearPrecio, precioVigente } from "@/lib/utilidades";
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
import { Boton, Etiqueta } from "@/components/ui";

interface DatosVista {
  productos: Producto[];
  categorias: Categoria[];
}

async function cargarVista(): Promise<DatosVista> {
  const [productos, categorias] = await Promise.all([listarProductos(), listarCategorias()]);
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

  const cargar = recargar;

  const formularioAbierto = creando || editando !== null;
  const categorias = estado.tipo === "listo" ? estado.datos.categorias : [];

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
        descripcion="Gestiona el catalogo de tu tienda."
        acciones={
          <Boton onClick={() => setCreando(true)} disabled={estado.tipo === "listo" && categorias.length === 0}>
            <IconPlus className="h-4 w-4" aria-hidden />
            Nuevo producto
          </Boton>
        }
      />

      {estado.tipo === "listo" && categorias.length === 0 && (
        <div role="alert" className="mb-4 border border-amber-500 bg-amber-500/[.06] p-3 text-sm text-texto-fuerte">
          Crea al menos una categoria antes de agregar productos.
        </div>
      )}

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
              <Th className="text-center">Stock</Th>
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
                <Td className="text-center">{producto.stock}</Td>
                <Td className="text-center">
                  <Etiqueta variante={producto.activo ? "exito" : "neutral"}>
                    {producto.activo ? "Activo" : "Inactivo"}
                  </Etiqueta>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
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
  return categorias.find((categoria) => categoria.id === producto.categoriaId)?.nombre ?? "—";
}
