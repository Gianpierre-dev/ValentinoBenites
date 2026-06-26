import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utilidades";

interface PropsInput extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta?: string;
  error?: string;
}

/** Campo de texto accesible: vincula etiqueta, mensaje de error y aria-invalid. */
export const Input = forwardRef<HTMLInputElement, PropsInput>(function Input(
  { etiqueta, error, className, id, ...resto },
  ref,
) {
  const idGenerado = useId();
  const idCampo = id ?? idGenerado;
  const idError = `${idCampo}-error`;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {etiqueta && (
        <label htmlFor={idCampo} className="text-sm font-medium text-texto-fuerte">
          {etiqueta}
        </label>
      )}
      <input
        ref={ref}
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        className={cn(
          "h-11 w-full rounded-lg border border-borde bg-fondo px-3 text-sm text-texto-fuerte outline-none transition-colors placeholder:text-texto/50 focus:border-acento",
          error && "border-oferta focus:border-oferta",
          className,
        )}
        {...resto}
      />
      {error && (
        <p id={idError} role="alert" className="text-xs text-oferta">
          {error}
        </p>
      )}
    </div>
  );
});
