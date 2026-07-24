import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Términos y condiciones de compra en Valentino Benites: productos hechos a pedido, plazos de entrega, medios de pago y política de cambios.",
};

/**
 * Terminos y condiciones (Codigo de Proteccion y Defensa del Consumidor,
 * Ley 29571): informacion previa a la compra sobre plazos, pagos y cambios.
 * Texto base profesional; la titular del negocio debe validarlo y completar
 * los datos que le corresponden.
 */
export default function PaginaTerminos() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-texto-fuerte sm:text-4xl">
        Términos y Condiciones
      </h1>
      <p className="mt-3 text-sm text-texto">
        Última actualización: julio de 2026
      </p>

      <div className="prosa mt-8 space-y-8 text-sm leading-relaxed text-texto">
        <section>
          <h2 className="text-lg font-semibold text-texto-fuerte">
            1. Sobre la tienda
          </h2>
          <p className="mt-2">
            Valentino Benites es una tienda de carteras y accesorios de moda
            elaborados de manera artesanal en el Perú. Al realizar un pedido en
            este sitio web aceptas los presentes términos y condiciones.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-texto-fuerte">
            2. Productos hechos a pedido
          </h2>
          <p className="mt-2">
            Nuestros productos se elaboran a pedido: cada pieza se confecciona
            en el color que elijas al momento de comprar o que coordines luego
            por WhatsApp. El tiempo estimado de elaboración es de 24 horas desde
            la confirmación del pago y del color, más el tiempo de envío según
            tu ubicación. Los plazos de entrega se coordinan por WhatsApp al
            confirmar el pedido.
          </p>
          <p className="mt-2">
            Las fotos del catálogo son referenciales: al tratarse de productos
            artesanales, pueden existir variaciones menores de tono o acabado
            entre una pieza y otra.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-texto-fuerte">
            3. Precios y medios de pago
          </h2>
          <p className="mt-2">
            Todos los precios se expresan en soles (S/) y corresponden al precio
            final del producto. Aceptamos pagos por Yape y Plin (con envío de
            comprobante) y coordinación directa por WhatsApp. El pedido entra en
            producción una vez confirmado el pago.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-texto-fuerte">
            4. Cambios y devoluciones
          </h2>
          <p className="mt-2">
            Si tu producto presenta un defecto de fabricación, contáctanos por
            WhatsApp dentro de los 7 días siguientes a la recepción y
            gestionaremos el cambio o la reparación sin costo.
          </p>
          <p className="mt-2">
            Los productos elaborados a pedido en un color personalizado no
            admiten cambio ni devolución por motivos distintos a defectos de
            fabricación, al tratarse de bienes confeccionados conforme a las
            especificaciones del consumidor.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-texto-fuerte">
            5. Envíos
          </h2>
          <p className="mt-2">
            Realizamos envíos a todo el Perú a través de empresas de transporte
            y mensajería. El costo y el plazo del envío se coordinan por
            WhatsApp al confirmar el pedido, según el destino.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-texto-fuerte">
            6. Reclamos y quejas
          </h2>
          <p className="mt-2">
            Contamos con un Libro de Reclamaciones virtual conforme a la Ley
            N.º 29571. Puedes registrar tu reclamo o queja en la sección{" "}
            <a
              href="/libro-de-reclamaciones"
              className="font-medium text-acento underline"
            >
              Libro de Reclamaciones
            </a>
            . Responderemos en un plazo máximo de 15 días hábiles.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-texto-fuerte">
            7. Datos personales
          </h2>
          <p className="mt-2">
            El tratamiento de tus datos personales se rige por nuestra{" "}
            <a href="/privacidad" className="font-medium text-acento underline">
              Política de Privacidad
            </a>
            , conforme a la Ley N.º 29733, Ley de Protección de Datos
            Personales.
          </p>
        </section>
      </div>
    </div>
  );
}
