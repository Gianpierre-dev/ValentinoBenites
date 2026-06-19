"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerToken } from "@/lib/api";

type EstadoSesion = "verificando" | "autenticado";

/**
 * Protege una vista del panel: si no hay token en localStorage redirige a
 * /admin/login. Devuelve el estado para mostrar un placeholder mientras verifica.
 */
export function useSesionAdmin(): EstadoSesion {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoSesion>("verificando");

  useEffect(() => {
    // El token vive en localStorage: solo es legible en el cliente tras montar,
    // por lo que la verificacion de sesion debe ocurrir aqui. Es una lectura de
    // un sistema externo, no un calculo derivable durante el render.
    if (obtenerToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEstado("autenticado");
      return;
    }
    router.replace("/admin/login");
  }, [router]);

  return estado;
}
