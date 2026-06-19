/**
 * Tipos del dominio FABIOLA, alineados con el schema de Prisma del backend.
 * IMPORTANTE: los campos Decimal de Prisma llegan serializados como `number`
 * (el backend los convierte en sus respuestas).
 */

export type MetodoPago = "WHATSAPP" | "YAPE" | "PLIN";

export type EstadoPedido = "PENDIENTE" | "VALIDADO" | "RECHAZADO";

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ImagenProducto {
  id: string;
  url: string;
  orden: number;
  productoId: string;
}

export interface Producto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio: number;
  precioOferta: number | null;
  stock: number;
  activo: boolean;
  destacado: boolean;
  categoriaId: string;
  categoria?: Categoria;
  imagenes: ImagenProducto[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface ItemPedido {
  id: string;
  pedidoId: string;
  productoId: string;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  codigo: string;
  nombreCliente: string;
  telefono: string;
  total: number;
  metodoPago: MetodoPago;
  estado: EstadoPedido;
  comprobanteUrl: string | null;
  items: ItemPedido[];
  creadoEn: string;
  actualizadoEn: string;
}

/** Banner de la home, guardado en `Configuracion.banners` (Json). */
export interface Banner {
  imagenUrl: string;
  titulo?: string;
  enlace?: string;
}

export interface Configuracion {
  id: string;
  whatsapp: string | null;
  datosYape: string | null;
  datosPlin: string | null;
  banners: Banner[] | null;
  actualizadoEn: string;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string | null;
  creadoEn: string;
}

export interface RespuestaLogin {
  token: string;
  usuario: Usuario;
}

/** Payload para crear un pedido (lo calcula el backend; aqui solo se envia el detalle). */
export interface ItemPedidoEntrada {
  productoId: string;
  cantidad: number;
}

export interface CrearPedidoEntrada {
  nombreCliente: string;
  telefono: string;
  items: ItemPedidoEntrada[];
  metodoPago: MetodoPago;
  comprobanteUrl?: string;
}

/** Filtros del listado publico de productos. */
export interface FiltrosProductos {
  categoria?: string;
  destacados?: boolean;
  q?: string;
}

/** Datos editables de un producto (crear/actualizar desde el admin). */
export interface ProductoEntrada {
  nombre: string;
  slug: string;
  descripcion?: string | null;
  precio: number;
  precioOferta?: number | null;
  stock: number;
  activo: boolean;
  destacado: boolean;
  categoriaId: string;
  imagenes?: { url: string; orden: number }[];
}

/** Datos editables de una categoria (crear/actualizar desde el admin). */
export interface CategoriaEntrada {
  nombre: string;
  slug: string;
  orden: number;
  activo: boolean;
}
