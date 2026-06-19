"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { IconCircleCheck, IconAlertTriangle, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utilidades";

type TipoToast = "exito" | "error";

interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

interface ValorContextoToast {
  mostrarExito: (mensaje: string) => void;
  mostrarError: (mensaje: string) => void;
}

const ContextoToast = createContext<ValorContextoToast | null>(null);

const DURACION_MS = 4000;

/** Proveedor de notificaciones simples (toasts) para el panel admin. */
export function ProveedorToast({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const descartar = useCallback((id: number) => {
    setToasts((previos) => previos.filter((toast) => toast.id !== id));
  }, []);

  const agregar = useCallback(
    (tipo: TipoToast, mensaje: string) => {
      const id = Date.now() + Math.random();
      setToasts((previos) => [...previos, { id, tipo, mensaje }]);
      window.setTimeout(() => descartar(id), DURACION_MS);
    },
    [descartar],
  );

  const valor = useMemo<ValorContextoToast>(
    () => ({
      mostrarExito: (mensaje) => agregar("exito", mensaje),
      mostrarError: (mensaje) => agregar("error", mensaje),
    }),
    [agregar],
  );

  return (
    <ContextoToast.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastVisible key={toast.id} toast={toast} alCerrar={() => descartar(toast.id)} />
        ))}
      </div>
    </ContextoToast.Provider>
  );
}

function ToastVisible({ toast, alCerrar }: { toast: Toast; alCerrar: () => void }) {
  const esExito = toast.tipo === "exito";
  return (
    <div
      role={esExito ? "status" : "alert"}
      className={cn(
        "pointer-events-auto flex items-start gap-3 border bg-fondo p-3 text-sm shadow-lg",
        esExito ? "border-green-600" : "border-oferta",
      )}
    >
      {esExito ? (
        <IconCircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden />
      ) : (
        <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-oferta" aria-hidden />
      )}
      <p className="flex-1 text-texto-fuerte">{toast.mensaje}</p>
      <button
        type="button"
        onClick={alCerrar}
        aria-label="Cerrar notificacion"
        className="text-texto/60 hover:text-texto-fuerte"
      >
        <IconX className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

/** Acceso a las notificaciones del panel admin. */
export function useToast(): ValorContextoToast {
  const contexto = useContext(ContextoToast);
  if (!contexto) {
    throw new Error("useToast debe usarse dentro de ProveedorToast");
  }
  return contexto;
}
