/**
 * Cliente HTTP tipado contra el backend FABIOLA (NestJS).
 * Base URL desde NEXT_PUBLIC_API_URL (default http://localhost:3001/api).
 *
 * Maneja el token JWT del admin: se persiste en localStorage y se adjunta
 * automaticamente como cabecera Authorization en cada peticion.
 */

import type {
  AplicarGrupoEntrada,
  Billetera,
  BilleteraEntrada,
  Categoria,
  CategoriaEntrada,
  Configuracion,
  CrearPedidoEntrada,
  EstadoPedido,
  FiltrosProductos,
  GrupoPropuesto,
  ImagenVarianteEntrada,
  Pedido,
  Producto,
  ProductoEntrada,
  Reclamo,
  ReclamoEntrada,
  Suscriptor,
  ResultadoAplicacion,
  RespuestaLogin,
  Variante,
  VarianteEntrada,
} from "./tipos";

export const URL_BASE_API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

const CLAVE_TOKEN = "fabiola.token";

/** Error normalizado de la API, con el codigo HTTP y el mensaje del backend. */
export class ErrorApi extends Error {
  readonly estado: number;
  readonly cuerpo: unknown;

  constructor(estado: number, mensaje: string, cuerpo: unknown) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estado = estado;
    this.cuerpo = cuerpo;
  }
}

/** Lee el token JWT guardado (solo en el navegador). */
export function obtenerToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLAVE_TOKEN);
}

/** Guarda el token JWT del admin. */
export function guardarToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAVE_TOKEN, token);
}

/** Elimina el token (cierre de sesion del admin). */
export function borrarToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CLAVE_TOKEN);
}

interface OpcionesPeticion {
  metodo?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  cuerpo?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Si es true, adjunta el token JWT (rutas de admin). */
  autenticado?: boolean;
}

function construirQuery(query?: OpcionesPeticion["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(query)) {
    if (valor === undefined) continue;
    params.set(clave, String(valor));
  }
  const texto = params.toString();
  return texto ? `?${texto}` : "";
}

async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const { metodo = "GET", cuerpo, query, autenticado = false } = opciones;

  const cabeceras: Record<string, string> = {};
  if (cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";

  if (autenticado) {
    const token = obtenerToken();
    if (token) cabeceras["Authorization"] = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${URL_BASE_API}${ruta}${construirQuery(query)}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    cache: "no-store",
  });

  if (respuesta.status === 204) return undefined as T;

  const datos = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    const mensaje = extraerMensaje(datos) ?? `Error ${respuesta.status}`;
    throw new ErrorApi(respuesta.status, mensaje, datos);
  }

  return datos as T;
}

async function leerCuerpo(respuesta: Response): Promise<unknown> {
  const tipo = respuesta.headers.get("content-type") ?? "";
  if (tipo.includes("application/json")) return respuesta.json();
  const texto = await respuesta.text();
  return texto.length > 0 ? texto : null;
}

function extraerMensaje(datos: unknown): string | null {
  if (typeof datos === "string") return datos;
  if (datos && typeof datos === "object" && "message" in datos) {
    const mensaje = (datos as { message: unknown }).message;
    if (typeof mensaje === "string") return mensaje;
    if (Array.isArray(mensaje)) return mensaje.join(", ");
  }
  return null;
}

/* ---------------------------------------------------------------- */
/* Auth                                                             */
/* ---------------------------------------------------------------- */

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<RespuestaLogin> {
  const respuesta = await peticion<RespuestaLogin>("/auth/login", {
    metodo: "POST",
    cuerpo: { email, password },
  });
  guardarToken(respuesta.token);
  return respuesta;
}

export function cerrarSesion(): void {
  borrarToken();
}

/* ---------------------------------------------------------------- */
/* Productos                                                        */
/* ---------------------------------------------------------------- */

export function listarProductos(filtros: FiltrosProductos = {}): Promise<Producto[]> {
  return peticion<Producto[]>("/productos", {
    query: {
      categoria: filtros.categoria,
      destacados: filtros.destacados ? true : undefined,
      q: filtros.q,
      precioMin: filtros.precioMin,
      precioMax: filtros.precioMax,
    },
  });
}

export function obtenerProducto(slug: string): Promise<Producto> {
  return peticion<Producto>(`/productos/${slug}`);
}

/** Todos los productos (activos e inactivos) para la gestión del panel. */
export function listarProductosAdmin(): Promise<Producto[]> {
  return peticion<Producto[]>("/productos/admin/todos", { autenticado: true });
}

/** Descarga el catálogo completo como archivo Excel (.xlsx). */
export async function exportarCatalogoExcel(): Promise<void> {
  const cabeceras: Record<string, string> = {};
  const token = obtenerToken();
  if (token) cabeceras["Authorization"] = `Bearer ${token}`;

  const respuesta = await fetch(`${URL_BASE_API}/productos/admin/exportar`, {
    headers: cabeceras,
  });
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, "No se pudo generar el Excel.", null);
  }
  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "catalogo-valentino-benites.xlsx";
  enlace.click();
  URL.revokeObjectURL(url);
}

export function crearProducto(datos: ProductoEntrada): Promise<Producto> {
  return peticion<Producto>("/productos", {
    metodo: "POST",
    cuerpo: datos,
    autenticado: true,
  });
}

export function actualizarProducto(
  id: string,
  datos: Partial<ProductoEntrada>,
): Promise<Producto> {
  return peticion<Producto>(`/productos/${id}`, {
    metodo: "PATCH",
    cuerpo: datos,
    autenticado: true,
  });
}

export function eliminarProducto(id: string): Promise<void> {
  return peticion<void>(`/productos/${id}`, {
    metodo: "DELETE",
    autenticado: true,
  });
}

/* ---------------------------------------------------------------- */
/* Variantes de color (admin)                                       */
/* ---------------------------------------------------------------- */

export function crearVariante(
  productoId: string,
  datos: VarianteEntrada,
): Promise<Variante> {
  return peticion<Variante>(`/admin/productos/${productoId}/variantes`, {
    metodo: "POST",
    cuerpo: datos,
    autenticado: true,
  });
}

export function actualizarVariante(
  id: string,
  datos: Partial<VarianteEntrada>,
): Promise<Variante> {
  return peticion<Variante>(`/admin/variantes/${id}`, {
    metodo: "PATCH",
    cuerpo: datos,
    autenticado: true,
  });
}

export function eliminarVariante(id: string): Promise<Variante> {
  return peticion<Variante>(`/admin/variantes/${id}`, {
    metodo: "DELETE",
    autenticado: true,
  });
}

export function agregarImagenVariante(
  id: string,
  datos: ImagenVarianteEntrada,
): Promise<Variante> {
  return peticion<Variante>(`/admin/variantes/${id}/imagenes`, {
    metodo: "POST",
    cuerpo: datos,
    autenticado: true,
  });
}

export function eliminarImagenVariante(imagenId: string): Promise<void> {
  return peticion<void>(`/admin/variantes/imagenes/${imagenId}`, {
    metodo: "DELETE",
    autenticado: true,
  });
}

/* ---------------------------------------------------------------- */
/* Migracion M2 (agrupacion revisable)                              */
/* ---------------------------------------------------------------- */

export function obtenerPropuestaMigracion(): Promise<GrupoPropuesto[]> {
  return peticion<GrupoPropuesto[]>("/admin/migracion/propuesta", {
    autenticado: true,
  });
}

export function aplicarGrupoMigracion(
  grupo: AplicarGrupoEntrada,
): Promise<ResultadoAplicacion> {
  return peticion<ResultadoAplicacion>("/admin/migracion/aplicar", {
    metodo: "POST",
    cuerpo: grupo,
    autenticado: true,
  });
}

/* ---------------------------------------------------------------- */
/* Categorias                                                       */
/* ---------------------------------------------------------------- */

export function listarCategorias(): Promise<Categoria[]> {
  return peticion<Categoria[]>("/categorias");
}

export function crearCategoria(datos: CategoriaEntrada): Promise<Categoria> {
  return peticion<Categoria>("/categorias", {
    metodo: "POST",
    cuerpo: datos,
    autenticado: true,
  });
}

export function actualizarCategoria(
  id: string,
  datos: Partial<CategoriaEntrada>,
): Promise<Categoria> {
  return peticion<Categoria>(`/categorias/${id}`, {
    metodo: "PATCH",
    cuerpo: datos,
    autenticado: true,
  });
}

export function eliminarCategoria(id: string): Promise<void> {
  return peticion<void>(`/categorias/${id}`, {
    metodo: "DELETE",
    autenticado: true,
  });
}

/* ---------------------------------------------------------------- */
/* Pedidos                                                          */
/* ---------------------------------------------------------------- */

export function crearPedido(datos: CrearPedidoEntrada): Promise<Pedido> {
  return peticion<Pedido>("/pedidos", {
    metodo: "POST",
    cuerpo: datos,
  });
}

export function listarPedidos(): Promise<Pedido[]> {
  return peticion<Pedido[]>("/pedidos", { autenticado: true });
}

export function cambiarEstadoPedido(
  id: string,
  estado: EstadoPedido,
): Promise<Pedido> {
  return peticion<Pedido>(`/pedidos/${id}/estado`, {
    metodo: "PATCH",
    cuerpo: { estado },
    autenticado: true,
  });
}

/** Registra el envío coordinado (costo + dirección); el backend recalcula el total. */
export function actualizarEnvioPedido(
  id: string,
  datos: { costoEnvio: number; direccionEntrega?: string },
): Promise<Pedido> {
  return peticion<Pedido>(`/pedidos/${id}/envio`, {
    metodo: "PATCH",
    cuerpo: datos,
    autenticado: true,
  });
}

/* ---------------------------------------------------------------- */
/* Configuracion                                                    */
/* ---------------------------------------------------------------- */

export function obtenerConfiguracion(): Promise<Configuracion> {
  return peticion<Configuracion>("/configuracion");
}

export function actualizarConfiguracion(
  datos: Partial<Omit<Configuracion, "id" | "actualizadoEn">>,
): Promise<Configuracion> {
  return peticion<Configuracion>("/configuracion", {
    metodo: "PUT",
    cuerpo: datos,
    autenticado: true,
  });
}

/* ---------------------------------------------------------------- */
/* Billeteras (metodos de pago manuales)                            */
/* ---------------------------------------------------------------- */

/** Billeteras activas que se muestran en el checkout (publico). */
export function listarBilleteras(): Promise<Billetera[]> {
  return peticion<Billetera[]>("/billeteras");
}

/** Todas las billeteras, incluidas inactivas (panel admin). */
export function listarBilleterasAdmin(): Promise<Billetera[]> {
  return peticion<Billetera[]>("/billeteras/todas", { autenticado: true });
}

export function crearBilletera(datos: BilleteraEntrada): Promise<Billetera> {
  return peticion<Billetera>("/billeteras", {
    metodo: "POST",
    cuerpo: datos,
    autenticado: true,
  });
}

export function actualizarBilletera(
  id: string,
  datos: Partial<BilleteraEntrada>,
): Promise<Billetera> {
  return peticion<Billetera>(`/billeteras/${id}`, {
    metodo: "PATCH",
    cuerpo: datos,
    autenticado: true,
  });
}

export function eliminarBilletera(id: string): Promise<{ eliminado: boolean }> {
  return peticion<{ eliminado: boolean }>(`/billeteras/${id}`, {
    metodo: "DELETE",
    autenticado: true,
  });
}

/* ---------------------------------------------------------------- */
/* Libro de Reclamaciones                                           */
/* ---------------------------------------------------------------- */

export function crearReclamo(datos: ReclamoEntrada): Promise<Reclamo> {
  return peticion<Reclamo>("/reclamos", { metodo: "POST", cuerpo: datos });
}

export function listarReclamos(): Promise<Reclamo[]> {
  return peticion<Reclamo[]>("/reclamos", { autenticado: true });
}

export function responderReclamo(
  id: string,
  respuesta: string,
): Promise<Reclamo> {
  return peticion<Reclamo>(`/reclamos/${id}/responder`, {
    metodo: "PATCH",
    cuerpo: { respuesta },
    autenticado: true,
  });
}

/* ---------------------------------------------------------------- */
/* Newsletter                                                       */
/* ---------------------------------------------------------------- */

export function suscribirNewsletter(email: string): Promise<{ suscrito: boolean }> {
  return peticion<{ suscrito: boolean }>("/suscriptores", {
    metodo: "POST",
    cuerpo: { email },
  });
}

export function listarSuscriptores(): Promise<Suscriptor[]> {
  return peticion<Suscriptor[]>("/suscriptores", { autenticado: true });
}

/** Da de baja a un suscriptor que lo solicito (Ley 28493). */
export function eliminarSuscriptor(id: string): Promise<{ eliminado: boolean }> {
  return peticion<{ eliminado: boolean }>(`/suscriptores/${id}`, {
    metodo: "DELETE",
    autenticado: true,
  });
}

/* ---------------------------------------------------------------- */
/* Storage (subida de archivos a Wasabi)                            */
/* ---------------------------------------------------------------- */

/** Sube un archivo (multipart, campo `archivo`) y devuelve su URL publica. */
export async function subirArchivo(archivo: File): Promise<{ url: string }> {
  const formulario = new FormData();
  formulario.append("archivo", archivo);

  const cabeceras: Record<string, string> = {};
  const token = obtenerToken();
  if (token) cabeceras["Authorization"] = `Bearer ${token}`;

  const respuesta = await fetch(`${URL_BASE_API}/storage/upload`, {
    method: "POST",
    headers: cabeceras,
    body: formulario,
  });

  const datos = await leerCuerpo(respuesta);
  if (!respuesta.ok) {
    const mensaje = extraerMensaje(datos) ?? `Error ${respuesta.status}`;
    throw new ErrorApi(respuesta.status, mensaje, datos);
  }
  return datos as { url: string };
}
