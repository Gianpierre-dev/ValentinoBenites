/**
 * Tipos del dominio FABIOLA, alineados con el schema de Prisma del backend.
 * IMPORTANTE: los campos Decimal de Prisma llegan serializados como `number`
 * (el backend los convierte en sus respuestas).
 */

export type MetodoPago = "WHATSAPP" | "YAPE" | "PLIN" | "IZIPAY";

export type EstadoPedido =
  | "PENDIENTE_PAGO"
  | "PAGADO"
  | "EN_PRODUCCION"
  | "ENVIADO"
  | "CANCELADO"
  | "RECHAZADO";

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  activo: boolean;
  /**
   * Cantidad de productos activos de la categoria. Solo lo expone el listado
   * publico `GET /categorias` (para el filtro con contador); en respuestas de
   * crear/actualizar puede venir ausente.
   */
  cantidadProductos?: number;
  /** Ausentes en el listado publico; presentes al crear/actualizar. */
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface ImagenProducto {
  id: string;
  url: string;
  orden: number;
  productoId: string;
}

export interface ImagenVariante {
  id: string;
  url: string;
  orden: number;
  varianteId: string;
}

/**
 * Imagen resuelta que el backend expone como `imagenesEfectivas`: puede provenir
 * de la variante o del producto (fallback). Comparten la forma minima id/url/orden.
 */
export interface ImagenEfectiva {
  id: string;
  url: string;
  orden: number;
}

/**
 * Variante de color de un producto: es la unidad comprable (hecho a pedido).
 * El backend resuelve y expone los campos "efectivos" (imagenes con fallback al
 * modelo y precio segun la regla de override), para que el front no duplique la
 * cadena de fallback.
 */
export interface Variante {
  id: string;
  productoId: string;
  color: string;
  colorHex: string | null;
  /** Override opcional del precio de la variante; si es null hereda del modelo. */
  precio: number | null;
  precioOferta: number | null;
  activo: boolean;
  orden: number;
  imagenes: ImagenVariante[];
  /** Fotos resueltas: propias de la variante o, si no tiene, las del modelo. */
  imagenesEfectivas: ImagenEfectiva[];
  /** Precio final a cobrar (override de la variante -> precio base del modelo). */
  precioEfectivo: number;
  /** Precio de oferta resuelto; null cuando no hay oferta vigente. */
  precioOfertaEfectivo: number | null;
}

export interface Producto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  /** Ficha tecnica: material principal (ej. "Cuero genuino"); null si no se cargo. */
  material: string | null;
  /** Ficha tecnica: dimensiones (ej. "30 x 20 x 10 cm"); null si no se cargo. */
  dimensiones: string | null;
  precio: number;
  precioOferta: number | null;
  activo: boolean;
  destacado: boolean;
  categoriaId: string | null;
  categoria?: Categoria | null;
  imagenes: ImagenProducto[];
  variantes: Variante[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface ItemPedido {
  id: string;
  pedidoId: string;
  productoId: string;
  varianteId: string | null;
  nombreProducto: string;
  colorElegido: string | null;
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
  qrYape: string | null;
  qrPlin: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  banners: Banner[] | null;
  heroTitulo: string | null;
  heroSubtitulo: string | null;
  heroTextoClaro: boolean;
  /** Prende/apaga la barra de anuncios (marquee) sobre el encabezado. */
  barraActiva: boolean;
  /** Mensajes que se desplazan en la barra superior; null o vacio usa el fallback. */
  barraAnuncios: string[] | null;
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
  /** La variante (color) es la unidad comprable; el backend resuelve el precio. */
  varianteId: string;
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
  /** Precio minimo (soles) para el rango del catalogo. */
  precioMin?: number;
  /** Precio maximo (soles) para el rango del catalogo. */
  precioMax?: number;
}

/** Datos editables de un producto (crear/actualizar desde el admin). */
export interface ProductoEntrada {
  nombre: string;
  slug: string;
  descripcion?: string | null;
  material?: string | null;
  dimensiones?: string | null;
  precio: number;
  precioOferta?: number | null;
  activo: boolean;
  destacado: boolean;
  categoriaId?: string | null;
  imagenes?: { url: string; orden: number }[];
}

/** Datos editables de una variante de color (crear/actualizar desde el admin). */
export interface VarianteEntrada {
  color: string;
  colorHex?: string | null;
  /** Override opcional del precio del modelo; si se omite, hereda del producto. */
  precio?: number | null;
  precioOferta?: number | null;
  activo?: boolean;
  orden?: number;
  imagenes?: { url: string; orden?: number }[];
}

/** Imagen a agregar a una variante existente. */
export interface ImagenVarianteEntrada {
  url: string;
  orden?: number;
}

/* ---- Migracion M2 (agrupacion revisable modelo + colores) ---- */

/** Una variante propuesta por el parser dentro de un grupo. */
export interface VariantePropuesta {
  productoId: string;
  nombreOriginal: string;
  color: string;
  requiereRevision: boolean;
}

/** Grupo de productos que el parser propone fusionar en un solo modelo. */
export interface GrupoPropuesto {
  modelo: string;
  requiereRevision: boolean;
  variantes: VariantePropuesta[];
}

/** Payload para aplicar (fusionar) un grupo revisado por la admin. */
export interface AplicarGrupoEntrada {
  cabeceraProductoId: string;
  modelo: string;
  requiereRevision?: boolean;
  variantes: { productoId: string; color: string; colorHex?: string }[];
}

/** Resultado de aplicar un grupo (M2). */
export interface ResultadoAplicacion {
  cabeceraProductoId: string;
  modelo: string;
  variantesCreadas: number;
  variantesExistentes: number;
  productosAbsorbidos: string[];
}

/** Datos editables de una categoria (crear/actualizar desde el admin). */
export interface CategoriaEntrada {
  nombre: string;
  slug: string;
  orden: number;
  activo: boolean;
}
