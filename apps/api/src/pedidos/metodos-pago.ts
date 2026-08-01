/**
 * Metodos de pago con FLUJO DE CODIGO propio. Las billeteras (Yape, Plin,
 * Agora...) NO estan aca: son filas de la tabla `billeteras` y el pedido guarda
 * su nombre como snapshot. Estas constantes son los unicos valores "fijos" que
 * puede tomar Pedido.metodoPago ademas de un nombre de billetera.
 */
export const METODO_WHATSAPP = 'WhatsApp';
export const METODO_IZIPAY = 'Izipay';
