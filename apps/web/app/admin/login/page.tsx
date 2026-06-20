"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconLock } from "@tabler/icons-react";
import { iniciarSesion, obtenerToken } from "@/lib/api";
import { Boton, Input } from "@/components/ui";
import { mensajeDeError } from "@/components/admin";

const esquemaLogin = z.object({
  email: z.string().min(1, "Ingresa tu correo").email("Correo no valido"),
  password: z.string().min(1, "Ingresa tu contrasena"),
});

type DatosLogin = z.infer<typeof esquemaLogin>;

export default function PaginaLogin() {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DatosLogin>({ resolver: zodResolver(esquemaLogin) });

  useEffect(() => {
    if (obtenerToken()) router.replace("/admin");
  }, [router]);

  async function alEnviar(datos: DatosLogin) {
    setErrorGeneral(null);
    try {
      await iniciarSesion(datos.email, datos.password);
      router.replace("/admin");
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-fondo px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-xl font-semibold uppercase tracking-[0.25em] text-texto-fuerte">
            Valentino Benites
          </span>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-texto/70">
            <IconLock className="h-4 w-4" aria-hidden />
            Panel de gestion
          </p>
        </div>

        <form
          onSubmit={handleSubmit(alEnviar)}
          noValidate
          className="flex flex-col gap-4 border border-borde p-6"
        >
          <Input
            etiqueta="Correo"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            etiqueta="Contrasena"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          {errorGeneral && (
            <p role="alert" className="text-sm text-oferta">
              {errorGeneral}
            </p>
          )}

          <Boton type="submit" cargando={isSubmitting} className="mt-2 w-full">
            Iniciar sesion
          </Boton>
        </form>
      </div>
    </main>
  );
}
