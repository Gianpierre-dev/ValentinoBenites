/**
 * Preguntas frecuentes de la tienda. Fuente unica: alimenta tanto la pagina
 * /preguntas-frecuentes como el JSON-LD (FAQPage) que habilita los resultados
 * enriquecidos de Google. Editar aqui actualiza ambos a la vez.
 */

export interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

export interface GrupoPreguntas {
  titulo: string;
  preguntas: PreguntaFrecuente[];
}

export const GRUPOS_PREGUNTAS: GrupoPreguntas[] = [
  {
    titulo: "Sobre los productos",
    preguntas: [
      {
        pregunta: "¿Los productos son hechos a pedido?",
        respuesta:
          "Sí. No trabajamos con stock de todos los colores: cuando eliges tu modelo y color, recién ahí confeccionamos tu pieza. Por eso cada cartera se trabaja de forma individual.",
      },
      {
        pregunta: "¿Cuánto demora la elaboración?",
        respuesta:
          "La elaboración toma aproximadamente 24 horas desde que confirmas tu pedido y el color. A eso se suma el tiempo de envío según tu ubicación, que coordinamos contigo por WhatsApp.",
      },
      {
        pregunta: "¿De qué están hechas las carteras?",
        respuesta:
          "Combinamos cuero trabajado con telares andinos tejidos en el Perú, herrajes metálicos y forro textil interior. El telar es parte del diseño: es nuestra identidad.",
      },
      {
        pregunta: "¿Puedo pedir un color que no aparece en la web?",
        respuesta:
          "Escríbenos por WhatsApp y lo consultamos. Al ser productos hechos a pedido, muchas veces podemos trabajar el color que necesitas.",
      },
      {
        pregunta: "¿El producto que recibo es idéntico a la foto?",
        respuesta:
          "Las fotos son referenciales. Al tratarse de piezas artesanales con telar tejido, pueden existir variaciones menores de tono o de posición del tejido entre una pieza y otra. Eso es justamente lo que hace única a cada cartera.",
      },
    ],
  },
  {
    titulo: "Compra y pagos",
    preguntas: [
      {
        pregunta: "¿Cómo compro?",
        respuesta:
          "Eliges tu producto y lo agregas al carrito, completas tus datos en el checkout y eliges cómo pagar: por Yape o Plin subiendo tu comprobante, o coordinando directamente por WhatsApp.",
      },
      {
        pregunta: "¿Qué medios de pago aceptan?",
        respuesta:
          "Aceptamos Yape y Plin. También puedes coordinar tu pedido por WhatsApp y acordar el pago con nosotros.",
      },
      {
        pregunta: "¿Los precios incluyen el envío?",
        respuesta:
          "No. Los precios publicados corresponden al producto. El costo del envío depende de tu destino y se coordina por WhatsApp al confirmar tu pedido.",
      },
      {
        pregunta: "¿Qué pasa después de que hago mi pedido?",
        respuesta:
          "Recibes un código de pedido en pantalla. Validamos tu pago, confirmamos contigo el color si quedó pendiente y comenzamos la elaboración. Te mantenemos al tanto por WhatsApp.",
      },
      {
        pregunta: "¿Qué significa \"A coordinar\" en mi carrito?",
        respuesta:
          "Significa que agregaste un modelo que tiene varios colores sin elegir uno todavía. Puedes elegirlo entrando al producto, o lo definimos juntos por WhatsApp antes de empezar a confeccionar.",
      },
    ],
  },
  {
    titulo: "Envíos, cambios y atención",
    preguntas: [
      {
        pregunta: "¿Hacen envíos a todo el Perú?",
        respuesta:
          "Sí, enviamos a todo el Perú a través de empresas de transporte y mensajería. El costo y el plazo se coordinan por WhatsApp según tu destino.",
      },
      {
        pregunta: "¿Puedo cambiar o devolver mi producto?",
        respuesta:
          "Si tu producto presenta un defecto de fabricación, escríbenos dentro de los 7 días siguientes a la recepción y gestionamos el cambio o la reparación sin costo. Los productos elaborados a pedido en un color personalizado no admiten cambio por otros motivos.",
      },
      {
        pregunta: "¿Cómo los contacto?",
        respuesta:
          "El canal más rápido es WhatsApp, con el botón verde que verás en todo el sitio. También puedes escribirnos por nuestras redes sociales.",
      },
      {
        pregunta: "¿Dónde presento un reclamo?",
        respuesta:
          "Contamos con un Libro de Reclamaciones virtual, conforme a la Ley N.º 29571. Puedes registrar tu reclamo o queja desde el enlace en el pie de página y te responderemos en un plazo máximo de 15 días hábiles.",
      },
    ],
  },
];

/** Aplana los grupos para el JSON-LD (FAQPage no tiene concepto de secciones). */
export function todasLasPreguntas(): PreguntaFrecuente[] {
  return GRUPOS_PREGUNTAS.flatMap((grupo) => grupo.preguntas);
}
