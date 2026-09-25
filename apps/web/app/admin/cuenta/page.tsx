"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarCredenciales, cerrarSesion } from "@/lib/api";
import { EncabezadoPagina, useToast, mensajeDeError } from "@/components/admin";
import { Boton, Input } from "@/components/ui";

export default function PaginaCuenta() {
  const router = useRouter();
  const { mostrarExito, mostrarError } = useToast();

  const [passwordActual, setPasswordActual] = useState("");
  const [emailNuevo, setEmailNuevo] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();

    const cambiaEmail = emailNuevo.trim() !== "";
    const cambiaPassword = passwordNueva !== "";

    if (!cambiaEmail && !cambiaPassword) {
      mostrarError("Indica un correo nuevo o una contraseña nueva.");
      return;
    }
    if (cambiaPassword && passwordNueva.length < 8) {
      mostrarError("La contraseña nueva debe tener al menos 8 caracteres.");
      return;
    }
    if (cambiaPassword && passwordNueva !== confirmacion) {
      mostrarError("La confirmación no coincide con la contraseña nueva.");
      return;
    }

    setGuardando(true);
    try {
      await actualizarCredenciales({
        passwordActual,
        ...(cambiaEmail ? { emailNuevo: emailNuevo.trim() } : {}),
        ...(cambiaPassword ? { passwordNueva } : {}),
      });

      if (cambiaPassword) {
        mostrarExito("Credenciales actualizadas. Inicia sesión de nuevo.");
        cerrarSesion();
        router.replace("/admin/login");
        return;
      }

      mostrarExito(
        "Correo actualizado. Úsalo en tu próximo inicio de sesión.",
      );
      setPasswordActual("");
      setEmailNuevo("");
    } catch (error) {
      mostrarError(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Mi cuenta"
        descripcion="Cambia el correo o la contraseña con los que entras al panel."
      />

      <form
        onSubmit={guardar}
        className="flex max-w-xl flex-col gap-6 rounded-xl border border-borde bg-superficie p-6"
      >
        <section className="flex flex-col gap-4">
          <h2 className="border-b border-borde pb-2 text-sm font-semibold uppercase tracking-wide text-texto/70">
            Verificación
          </h2>
          <Input
            etiqueta="Contraseña actual"
            type="password"
            autoComplete="current-password"
            required
            value={passwordActual}
            onChange={(evento) => setPasswordActual(evento.target.value)}
          />
          <p className="text-sm text-texto/60">
            Por seguridad, siempre pedimos tu contraseña actual antes de
            aplicar cambios.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="border-b border-borde pb-2 text-sm font-semibold uppercase tracking-wide text-texto/70">
            Nuevos datos
          </h2>
          <Input
            etiqueta="Correo nuevo (opcional)"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={emailNuevo}
            onChange={(evento) => setEmailNuevo(evento.target.value)}
          />
          <Input
            etiqueta="Contraseña nueva (opcional)"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={passwordNueva}
            onChange={(evento) => setPasswordNueva(evento.target.value)}
          />
          <Input
            etiqueta="Confirmar contraseña nueva"
            type="password"
            autoComplete="new-password"
            value={confirmacion}
            onChange={(evento) => setConfirmacion(evento.target.value)}
            disabled={passwordNueva === ""}
          />
        </section>

        <div>
          <Boton type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Boton>
        </div>
      </form>
    </div>
  );
}
