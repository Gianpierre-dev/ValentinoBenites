"use client";

import { useCallback, useEffect, useState } from "react";
import { mensajeDeError } from "./errores";

export type EstadoRecurso<T> =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "listo"; datos: T };

interface Recurso<T> {
  estado: EstadoRecurso<T>;
  recargar: () => Promise<void>;
  /** Reemplaza los datos en memoria sin volver a pedirlos (mutaciones locales). */
  fijarDatos: (datos: T) => void;
}

/**
 * Carga un recurso asincrono y expone su estado (cargando/error/listo).
 * Evita disparar setState sincrono dentro del efecto: la primera actualizacion
 * ocurre siempre despues del await del obtenedor.
 */
export function useRecurso<T>(obtenedor: () => Promise<T>): Recurso<T> {
  const [estado, setEstado] = useState<EstadoRecurso<T>>({ tipo: "cargando" });

  const ejecutar = useCallback(async () => {
    try {
      const datos = await obtenedor();
      setEstado({ tipo: "listo", datos });
    } catch (error) {
      setEstado({ tipo: "error", mensaje: mensajeDeError(error) });
    }
  }, [obtenedor]);

  const recargar = useCallback(async () => {
    setEstado({ tipo: "cargando" });
    await ejecutar();
  }, [ejecutar]);

  useEffect(() => {
    // Carga de datos al montar: el panel admin es client-only (depende del JWT
    // en localStorage), por lo que no puede resolverse en un Server Component.
    // El setState ocurre tras el await del obtenedor; la advertencia no aplica.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void ejecutar();
  }, [ejecutar]);

  const fijarDatos = useCallback((datos: T) => {
    setEstado({ tipo: "listo", datos });
  }, []);

  return { estado, recargar, fijarDatos };
}
