"use client";

import { useState } from "react";
import { IconPlus, IconPencil, IconTrash } from "@tabler/icons-react";
import {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "@/lib/api";
import type { Categoria, CategoriaEntrada } from "@/lib/tipos";
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
import { FormularioCategoria } from "@/components/admin/formulario-categoria";
import { Boton, Etiqueta } from "@/components/ui";

export default function PaginaCategorias() {
  const { mostrarExito, mostrarError } = useToast();
  const { estado, recargar } = useRecurso<Categoria[]>(listarCategorias);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [creando, setCreando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aEliminar, setAEliminar] = useState<Categoria | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = recargar;

  const formularioAbierto = creando || editando !== null;

  function cerrarFormulario() {
    setCreando(false);
    setEditando(null);
  }

  async function guardar(datos: CategoriaEntrada) {
    setEnviando(true);
    try {
      if (editando) {
        await actualizarCategoria(editando.id, datos);
        mostrarExito("Categoria actualizada.");
      } else {
        await crearCategoria(datos);
        mostrarExito("Categoria creada.");
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
      await eliminarCategoria(aEliminar.id);
      mostrarExito("Categoria eliminada.");
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
        titulo="Categorias"
        descripcion="Organiza tu catalogo en categorias."
        acciones={
          <Boton onClick={() => setCreando(true)}>
            <IconPlus className="h-4 w-4" aria-hidden />
            Nueva categoria
          </Boton>
        }
      />

      {estado.tipo === "cargando" && <VistaCargando etiqueta="Cargando categorias" />}
      {estado.tipo === "error" && <VistaError mensaje={estado.mensaje} alReintentar={cargar} />}

      {estado.tipo === "listo" && estado.datos.length === 0 && (
        <VistaVacia>Aun no tienes categorias. Crea la primera.</VistaVacia>
      )}

      {estado.tipo === "listo" && estado.datos.length > 0 && (
        <Tabla etiqueta="Listado de categorias">
          <EncabezadoTabla>
            <tr>
              <Th>Nombre</Th>
              <Th>Slug</Th>
              <Th className="text-center">Orden</Th>
              <Th className="text-center">Estado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </EncabezadoTabla>
          <CuerpoTabla>
            {estado.datos.map((categoria) => (
              <tr key={categoria.id}>
                <Td className="font-medium">{categoria.nombre}</Td>
                <Td className="text-texto/70">{categoria.slug}</Td>
                <Td className="text-center">{categoria.orden}</Td>
                <Td className="text-center">
                  <Etiqueta variante={categoria.activo ? "activo" : "neutral"}>
                    {categoria.activo ? "Activa" : "Inactiva"}
                  </Etiqueta>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Boton
                      variante="fantasma"
                      tamano="sm"
                      aria-label={`Editar ${categoria.nombre}`}
                      onClick={() => setEditando(categoria)}
                    >
                      <IconPencil className="h-4 w-4" aria-hidden />
                    </Boton>
                    <Boton
                      variante="fantasma"
                      tamano="sm"
                      aria-label={`Eliminar ${categoria.nombre}`}
                      onClick={() => setAEliminar(categoria)}
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
        titulo={editando ? "Editar categoria" : "Nueva categoria"}
        alCerrar={cerrarFormulario}
      >
        <FormularioCategoria
          categoria={editando}
          enviando={enviando}
          alGuardar={guardar}
          alCancelar={cerrarFormulario}
        />
      </Modal>

      <ModalConfirmacion
        abierto={aEliminar !== null}
        titulo="Eliminar categoria"
        mensaje={`Se eliminara "${aEliminar?.nombre ?? ""}". Esta accion no se puede deshacer.`}
        cargando={eliminando}
        alConfirmar={confirmarEliminar}
        alCancelar={() => setAEliminar(null)}
      />
    </>
  );
}
