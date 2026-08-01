"use client";

import { useState } from "react";
import Image from "next/image";
import { IconPencil, IconPlus, IconQrcode, IconTrash } from "@tabler/icons-react";
import {
  listarBilleterasAdmin,
  crearBilletera,
  actualizarBilletera,
  eliminarBilletera,
} from "@/lib/api";
import type { Billetera, BilleteraEntrada } from "@/lib/tipos";
import {
  CargadorQR,
  EncabezadoPagina,
  ModalConfirmacion,
  VistaCargando,
  VistaError,
  VistaVacia,
  useToast,
  useRecurso,
  mensajeDeError,
} from "@/components/admin";
import { Boton, Etiqueta, Input, Tarjeta } from "@/components/ui";

interface Borrador {
  nombre: string;
  instrucciones: string;
  qrUrl: string | null;
  activo: boolean;
}

function borradorDesde(billetera: Billetera | null): Borrador {
  return {
    nombre: billetera?.nombre ?? "",
    instrucciones: billetera?.instrucciones ?? "",
    qrUrl: billetera?.qrUrl ?? null,
    activo: billetera?.activo ?? true,
  };
}

/**
 * CRUD de billeteras de pago (Yape, Plin, Agora...). Agregar una billetera aqui
 * la hace aparecer en el checkout SIN tocar codigo: nombre + QR + instrucciones.
 * WhatsApp no se administra aqui (es coordinacion, no billetera).
 */
export default function PaginaMetodosPago() {
  const { mostrarExito, mostrarError } = useToast();
  const { estado, recargar, fijarDatos } =
    useRecurso<Billetera[]>(listarBilleterasAdmin);

  const [editando, setEditando] = useState<Billetera | null>(null);
  const [creando, setCreando] = useState(false);
  const [borrador, setBorrador] = useState<Borrador>(borradorDesde(null));
  const [errorNombre, setErrorNombre] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState<Billetera | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const formularioAbierto = creando || editando !== null;

  function abrirNueva() {
    setEditando(null);
    setBorrador(borradorDesde(null));
    setErrorNombre(undefined);
    setCreando(true);
  }

  function abrirEdicion(billetera: Billetera) {
    setCreando(false);
    setEditando(billetera);
    setBorrador(borradorDesde(billetera));
    setErrorNombre(undefined);
  }

  function cerrarFormulario() {
    setCreando(false);
    setEditando(null);
    setErrorNombre(undefined);
  }

  async function guardar() {
    if (estado.tipo !== "listo") return;
    if (borrador.nombre.trim().length < 2) {
      setErrorNombre("Ingresa el nombre de la billetera.");
      return;
    }

    const entrada: BilleteraEntrada = {
      nombre: borrador.nombre.trim(),
      instrucciones: borrador.instrucciones.trim() || undefined,
      qrUrl: borrador.qrUrl ?? undefined,
      activo: borrador.activo,
    };

    setGuardando(true);
    try {
      if (editando) {
        const actualizada = await actualizarBilletera(editando.id, entrada);
        fijarDatos(
          estado.datos.map((item) =>
            item.id === actualizada.id ? actualizada : item,
          ),
        );
        mostrarExito(`${actualizada.nombre} actualizada.`);
      } else {
        const creada = await crearBilletera(entrada);
        fijarDatos([...estado.datos, creada]);
        mostrarExito(`${creada.nombre} agregada: ya aparece en el checkout.`);
      }
      cerrarFormulario();
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    if (estado.tipo !== "listo" || !aEliminar) return;
    setEliminando(true);
    try {
      await eliminarBilletera(aEliminar.id);
      fijarDatos(estado.datos.filter((item) => item.id !== aEliminar.id));
      mostrarExito(`${aEliminar.nombre} eliminada.`);
      setAEliminar(null);
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setEliminando(false);
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Métodos de pago"
        descripcion="Billeteras con QR que ven tus clientes en el checkout (Yape, Plin, Agora y las que necesites)."
        acciones={
          <Boton onClick={abrirNueva}>
            <IconPlus className="h-4 w-4" aria-hidden />
            Nueva billetera
          </Boton>
        }
      />

      {estado.tipo === "cargando" && (
        <VistaCargando etiqueta="Cargando métodos de pago" />
      )}
      {estado.tipo === "error" && (
        <VistaError mensaje={estado.mensaje} alReintentar={recargar} />
      )}

      {estado.tipo === "listo" && (
        <div className="flex flex-col gap-4">
          {formularioAbierto && (
            <Tarjeta className="flex flex-col gap-4 p-5">
              <p className="text-sm font-semibold text-texto-fuerte">
                {editando ? `Editar ${editando.nombre}` : "Nueva billetera"}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  etiqueta="Nombre"
                  placeholder="Ej. Agora"
                  value={borrador.nombre}
                  error={errorNombre}
                  onChange={(evento) => {
                    setBorrador((actual) => ({
                      ...actual,
                      nombre: evento.target.value,
                    }));
                    setErrorNombre(undefined);
                  }}
                />
                <Input
                  etiqueta="Instrucciones (se muestran bajo el QR)"
                  placeholder="Ej. Agora: 999888777 - Nombre del titular"
                  value={borrador.instrucciones}
                  onChange={(evento) =>
                    setBorrador((actual) => ({
                      ...actual,
                      instrucciones: evento.target.value,
                    }))
                  }
                />
              </div>

              <CargadorQR
                etiqueta="QR de pago"
                url={borrador.qrUrl}
                alCambiar={(url) =>
                  setBorrador((actual) => ({ ...actual, qrUrl: url }))
                }
                alError={mostrarError}
              />

              <label className="flex items-center gap-2 text-sm text-texto-fuerte">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-acento"
                  checked={borrador.activo}
                  onChange={(evento) =>
                    setBorrador((actual) => ({
                      ...actual,
                      activo: evento.target.checked,
                    }))
                  }
                />
                Visible en el checkout
              </label>

              <div className="flex justify-end gap-2">
                <Boton variante="fantasma" onClick={cerrarFormulario}>
                  Cancelar
                </Boton>
                <Boton cargando={guardando} onClick={() => void guardar()}>
                  Guardar
                </Boton>
              </div>
            </Tarjeta>
          )}

          {estado.datos.length === 0 && !formularioAbierto && (
            <VistaVacia>
              Aún no hay billeteras. Agrega la primera para que tus clientes
              puedan pagar con QR.
            </VistaVacia>
          )}

          {estado.datos.length > 0 && (
            <Tarjeta className="p-5">
              <ul className="divide-y divide-borde">
                {estado.datos.map((billetera) => (
                  <li
                    key={billetera.id}
                    className="flex items-center gap-3 py-3"
                  >
                    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-borde bg-black/[.02]">
                      {billetera.qrUrl ? (
                        <Image
                          src={billetera.qrUrl}
                          alt={`QR de ${billetera.nombre}`}
                          fill
                          sizes="48px"
                          className="object-contain p-0.5"
                        />
                      ) : (
                        <IconQrcode
                          className="h-5 w-5 text-texto/40"
                          aria-hidden
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-medium text-texto-fuerte">
                        {billetera.nombre}
                        <Etiqueta
                          variante={billetera.activo ? "exito" : "advertencia"}
                        >
                          {billetera.activo ? "Visible" : "Oculta"}
                        </Etiqueta>
                      </p>
                      <p className="truncate text-xs text-texto/60">
                        {billetera.instrucciones ?? "Sin instrucciones"}
                        {!billetera.qrUrl && " · Sin QR"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Boton
                        variante="fantasma"
                        tamano="sm"
                        aria-label={`Editar ${billetera.nombre}`}
                        onClick={() => abrirEdicion(billetera)}
                      >
                        <IconPencil className="h-4 w-4" aria-hidden />
                      </Boton>
                      <Boton
                        variante="fantasma"
                        tamano="sm"
                        aria-label={`Eliminar ${billetera.nombre}`}
                        onClick={() => setAEliminar(billetera)}
                      >
                        <IconTrash className="h-4 w-4 text-oferta" aria-hidden />
                      </Boton>
                    </div>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          )}
        </div>
      )}

      <ModalConfirmacion
        abierto={aEliminar !== null}
        titulo={`¿Eliminar ${aEliminar?.nombre ?? ""}?`}
        mensaje="Dejará de aparecer en el checkout. Los pedidos ya registrados con esta billetera no se pierden."
        cargando={eliminando}
        alConfirmar={() => void confirmarEliminar()}
        alCancelar={() => setAEliminar(null)}
      />
    </>
  );
}
