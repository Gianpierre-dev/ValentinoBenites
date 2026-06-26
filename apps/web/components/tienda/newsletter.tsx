"use client";

import { useState } from "react";
import { Boton, Input } from "@/components/ui";

/**
 * Bloque de suscripcion al newsletter. En Fase 1 no hay backend de correos:
 * captura el email y muestra confirmacion local. Se conectara en una fase futura.
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const suscribir = (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!email.trim()) return;
    setEnviado(true);
    setEmail("");
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
            onSubmit={suscribir}
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="tu@correo.com"
              aria-label="Correo electronico"
              className="sm:flex-1"
            />
            <Boton type="submit" tamano="lg">
              Suscribirme
            </Boton>
          </form>
        )}
      </div>
    </section>
  );
}
