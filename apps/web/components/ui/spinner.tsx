import { cn } from "@/lib/utilidades";

interface PropsSpinner {
  tamano?: "sm" | "md" | "lg";
  className?: string;
  etiqueta?: string;
}

const TAMANOS: Record<NonNullable<PropsSpinner["tamano"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

/** Indicador de carga accesible (role=status). */
export function Spinner({ tamano = "md", className, etiqueta = "Cargando" }: PropsSpinner) {
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex", className)}>
      <span
        aria-hidden
        className={cn(
          "animate-spin rounded-full border-acento border-t-transparent",
          TAMANOS[tamano],
        )}
      />
      <span className="sr-only">{etiqueta}</span>
    </span>
  );
}
