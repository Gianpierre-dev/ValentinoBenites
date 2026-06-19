import { ErrorApi } from "@/lib/api";

/** Extrae un mensaje legible de un error desconocido lanzado por la API. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi) return error.message;
  if (error instanceof Error) return error.message;
  return "Ocurrio un error inesperado. Intenta nuevamente.";
}
