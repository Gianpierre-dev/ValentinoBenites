"use client";

import { useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconCheck,
  IconArrowMerge,
} from "@tabler/icons-react";
import { obtenerPropuestaMigracion, aplicarGrupoMigracion } from "@/lib/api";
import type { GrupoPropuesto } from "@/lib/tipos";
import {
  EncabezadoPagina,
  VistaCargando,
  VistaError,
  VistaVacia,
  useToast,
  useRecurso,
  mensajeDeError,
} from "@/components/admin";
import { Tarjeta, Etiqueta, Boton, Input } from "@/components/ui";

/** Estado editable de un grupo mientras la admin lo revisa antes de aplicarlo. */
interface BorradorGrupo {
  modelo: string;
  cabeceraProductoId: string;
  variantes: { productoId: string; color: string; colorHex: string }[];
}

function borradorDesde(grupo: GrupoPropuesto): BorradorGrupo {
  return {
    modelo: grupo.modelo,
    cabeceraProductoId: grupo.variantes[0]?.productoId ?? "",
    variantes: grupo.variantes.map((v) => ({
      productoId: v.productoId,
      color: v.color,
      colorHex: "",
    })),
  };
}

/** Clave estable del grupo (los productoId ordenados) para trackear su estado. */
function claveGrupo(grupo: GrupoPropuesto): string {
  return grupo.variantes
    .map((v) => v.productoId)
    .sort()
    .join("|");
}

export default function PaginaMigracion() {
  const { mostrarExito, mostrarError } = useToast();
  const { estado, recargar } = useRecurso<GrupoPropuesto[]>(
    obtenerPropuestaMigracion,
  );

  return (
    <>
      <EncabezadoPagina
        titulo="Migracion a colores"
        descripcion="Revisa como se agruparan tus productos en modelos con variantes de color y aplica cada grupo cuando estes conforme. Nada se aplica sin tu confirmacion."
      />

      {estado.tipo === "cargando" && (
        <VistaCargando etiqueta="Cargando propuesta" />
      )}
      {estado.tipo === "error" && (
        <VistaError mensaje={estado.mensaje} alReintentar={recargar} />
      )}

      {estado.tipo === "listo" && estado.datos.length === 0 && (
        <VistaVacia>No hay productos por agrupar.</VistaVacia>
      )}

      {estado.tipo === "listo" && estado.datos.length > 0 && (
        <ListaGrupos
          grupos={estado.datos}
          alAplicar={async (borrador) => {
            const resultado = await aplicarGrupoMigracion({
              cabeceraProductoId: borrador.cabeceraProductoId,
              modelo: borrador.modelo.trim(),
              requiereRevision: false,
              variantes: borrador.variantes.map((v) => ({
                productoId: v.productoId,
                color: v.color.trim(),
                colorHex: v.colorHex.trim() === "" ? undefined : v.colorHex.trim(),
              })),
            });
            mostrarExito(
              `Modelo "${resultado.modelo}" aplicado: ${resultado.variantesCreadas} color(es) nuevo(s).`,
            );
          }}
          alError={(error) => mostrarError(mensajeDeError(error))}
        />
      )}
    </>
  );
}

interface PropsListaGrupos {
  grupos: GrupoPropuesto[];
  alAplicar: (borrador: BorradorGrupo) => Promise<void>;
  alError: (error: unknown) => void;
}

function ListaGrupos({ grupos, alAplicar, alError }: PropsListaGrupos) {
  const [aplicados, setAplicados] = useState<Set<string>>(new Set());

  const pendientes = grupos.filter(
    (g) => !aplicados.has(claveGrupo(g)),
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-texto/70">
        {pendientes} grupo(s) por aplicar de {grupos.length}.
      </p>
      {grupos.map((grupo) => (
        <TarjetaGrupo
          key={claveGrupo(grupo)}
          grupo={grupo}
          aplicado={aplicados.has(claveGrupo(grupo))}
          alAplicar={async (borrador) => {
            try {
              await alAplicar(borrador);
              setAplicados((actual) => new Set(actual).add(claveGrupo(grupo)));
            } catch (error) {
              alError(error);
            }
          }}
        />
      ))}
    </div>
  );
}

interface PropsTarjetaGrupo {
  grupo: GrupoPropuesto;
  aplicado: boolean;
  alAplicar: (borrador: BorradorGrupo) => Promise<void>;
}

function TarjetaGrupo({ grupo, aplicado, alAplicar }: PropsTarjetaGrupo) {
  const [borrador, setBorrador] = useState<BorradorGrupo>(() =>
    borradorDesde(grupo),
  );
  const [aplicando, setAplicando] = useState(false);

  const colorPorProducto = useMemo(
    () => new Map(borrador.variantes.map((v) => [v.productoId, v])),
    [borrador.variantes],
  );

  function actualizarVariante(
    productoId: string,
    campo: "color" | "colorHex",
    valor: string,
  ) {
    setBorrador((actual) => ({
      ...actual,
      variantes: actual.variantes.map((v) =>
        v.productoId === productoId ? { ...v, [campo]: valor } : v,
      ),
    }));
  }

  const colorVacio = borrador.variantes.some((v) => v.color.trim() === "");
  const modeloVacio = borrador.modelo.trim() === "";

  async function aplicar() {
    setAplicando(true);
    try {
      await alAplicar(borrador);
    } finally {
      setAplicando(false);
    }
  }

  return (
    <Tarjeta className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconArrowMerge className="h-5 w-5 text-acento" aria-hidden />
          <span className="font-semibold text-texto-fuerte">
            {grupo.variantes.length} producto(s) → 1 modelo
          </span>
        </div>
        {aplicado ? (
          <Etiqueta variante="exito">Aplicado</Etiqueta>
        ) : grupo.requiereRevision ? (
          <Etiqueta variante="advertencia">
            <IconAlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Requiere revision
          </Etiqueta>
        ) : (
          <Etiqueta variante="neutral">Pendiente</Etiqueta>
        )}
      </div>

      {grupo.requiereRevision && !aplicado && (
        <p className="mt-3 text-sm text-texto/70">
          El detector no pudo separar el color con seguridad. Revisa el nombre del
          modelo y el color de cada producto antes de aplicar.
        </p>
      )}

      <fieldset
        disabled={aplicado || aplicando}
        className="mt-4 flex flex-col gap-4"
      >
        <Input
          etiqueta="Nombre del modelo"
          value={borrador.modelo}
          onChange={(evento) =>
            setBorrador((actual) => ({ ...actual, modelo: evento.target.value }))
          }
        />

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-texto-fuerte">
            Productos y su color
          </p>
          {grupo.variantes.map((variante) => {
            const dato = colorPorProducto.get(variante.productoId);
            const esCabecera =
              borrador.cabeceraProductoId === variante.productoId;
            return (
              <div
                key={variante.productoId}
                className="grid items-end gap-3 border border-borde p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <div>
                  <p className="text-xs text-texto/60">Producto original</p>
                  <p className="text-sm font-medium text-texto-fuerte">
                    {variante.nombreOriginal}
                  </p>
                </div>
                <Input
                  etiqueta="Color"
                  value={dato?.color ?? ""}
                  onChange={(evento) =>
                    actualizarVariante(
                      variante.productoId,
                      "color",
                      evento.target.value,
                    )
                  }
                />
                <label className="flex items-center gap-2 pb-2 text-sm text-texto-fuerte">
                  <input
                    type="radio"
                    name={`cabecera-${claveGrupo(grupo)}`}
                    className="h-4 w-4"
                    checked={esCabecera}
                    onChange={() =>
                      setBorrador((actual) => ({
                        ...actual,
                        cabeceraProductoId: variante.productoId,
                      }))
                    }
                  />
                  Modelo base
                </label>
              </div>
            );
          })}
          <p className="text-xs text-texto/60">
            El &quot;modelo base&quot; es el producto que se conserva; los demas se
            fusionan como colores y quedan ocultos (no se borran).
          </p>
        </div>
      </fieldset>

      {!aplicado && (
        <div className="mt-4 flex justify-end">
          <Boton
            onClick={aplicar}
            cargando={aplicando}
            disabled={modeloVacio || colorVacio}
          >
            <IconCheck className="h-4 w-4" aria-hidden />
            Aplicar grupo
          </Boton>
        </div>
      )}
    </Tarjeta>
  );
}
