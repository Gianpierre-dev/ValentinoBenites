"use client";

import { useState } from "react";
import Link from "next/link";
import { Boton, Input } from "@/components/ui";
import { suscribirNewsletter, ErrorApi } from "@/lib/api";

/**
 * Bloque de suscripcion al newsletter. Registra el email via POST /suscriptores.
 * El envio del formulario constituye el consentimiento informado (Ley 28493):
 * la leyenda bajo el campo lo declara y enlaza a la politica de privacidad.
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suscribir = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!email.trim() || enviando) return;

    setError(null);
    setEnviando(true);
    try {
      await suscribirNewsletter(email.trim());
      setEnviado(true);
      setEmail("");
    } catch (errorEnvio) {
      setError(
        errorEnvio instanceof ErrorApi
          ? errorEnvio.message
          : "No pudimos registrar tu suscripción. Intenta nuevamente.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section
      aria-labelledby="titulo-newsletter"
      className="border-t border-borde bg-gradient-to-b from-perla to-[#f3e8f6]"
    >
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2
          id="titulo-newsletter"
          className="text-3xl font-extrabold sm:text-4xl"
        >
          Suscribete y entérate primero
        </h2>
        <p className="mt-3 text-texto">
          Recibe novedades, lanzamientos y ofertas exclusivas en tu correo.
        </p>

        {enviado ? (
          <p
            role="status"
            className="mt-6 text-sm font-medium text-texto-fuerte"
          >
            Gracias por suscribirte. Pronto tendras noticias nuestras.
          </p>
        ) : (
          <form
            onSubmit={(evento) => void suscribir(evento)}
            className="mt-6 flex flex-col gap-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                required
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="tu@correo.com"
                aria-label="Correo electronico"
                className="sm:flex-1"
              />
              <Boton type="submit" tamano="lg" cargando={enviando}>
                Suscribirme
              </Boton>
            </div>

            {error && (
              <p role="alert" className="text-sm text-oferta">
                {error}
              </p>
            )}

            <p className="text-xs text-texto/70">
              Al suscribirte aceptas recibir novedades por correo, según nuestra{" "}
              <Link
                href="/privacidad"
                className="font-medium text-acento underline"
              >
                Política de Privacidad
              </Link>
              . Puedes darte de baja cuando quieras.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
