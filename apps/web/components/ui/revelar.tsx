"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utilidades";

interface PropsRevelar {
  children: ReactNode;
  /** Retraso del reveal en ms, para escalonar elementos de una misma seccion. */
  delay?: number;
  className?: string;
}

const CONSULTA_MOVIMIENTO = "(prefers-reduced-motion: reduce)";

function suscribirMovimiento(alCambiar: () => void): () => void {
  const consulta = window.matchMedia(CONSULTA_MOVIMIENTO);
  consulta.addEventListener("change", alCambiar);
  return () => consulta.removeEventListener("change", alCambiar);
}

/**
 * Detecta `prefers-reduced-motion` sin setState en efectos: `useSyncExternalStore`
 * se suscribe al media query y devuelve `false` en el servidor (snapshot SSR).
 */
function useMovimientoReducido(): boolean {
  return useSyncExternalStore(
    suscribirMovimiento,
    () => window.matchMedia(CONSULTA_MOVIMIENTO).matches,
    () => false,
  );
}

/**
 * Revela su contenido al entrar en viewport con un fundido + desplazamiento
 * corto. Usa IntersectionObserver (no listeners de scroll) y anima solo
 * opacity/transform para no forzar reflow. Si el usuario pidio movimiento
 * reducido, el contenido queda visible de entrada sin animar.
 */
export function Revelar({ children, delay = 0, className }: PropsRevelar) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMovimiento = useMovimientoReducido();
  const [enVista, setEnVista] = useState(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || reduceMovimiento) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) {
          setEnVista(true);
          observador.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    observador.observe(nodo);
    return () => observador.disconnect();
  }, [reduceMovimiento]);

  const visible = enVista || reduceMovimiento;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-suave motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
