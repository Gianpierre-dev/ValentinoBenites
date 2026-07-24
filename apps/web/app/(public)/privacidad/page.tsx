import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Política de privacidad de Valentino Benites conforme a la Ley N.º 29733, Ley de Protección de Datos Personales del Perú.",
};

/**
 * Politica de privacidad (Ley 29733 y su reglamento): informa que datos se
 * recopilan, con que finalidad, por cuanto tiempo y como ejercer los derechos
 * ARCO. Texto base profesional; la titular del negocio debe validarlo.
 */
export default function PaginaPrivacidad() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-texto-fuerte sm:text-4xl">
        Política de Privacidad
      </h1>
      <p className="mt-3 text-sm text-texto">
        Última actualización: julio de 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-texto">
        <section>
          <h2 className="text-lg font-semibold text-texto-fuerte">
            1. Responsable del tratamiento
          </h2>
          <p className="mt-2">
            Valentino Benites, con domicilio en el Perú, es responsable del
            tratamiento de los datos personales que nos proporcionas a través de
            este sitio web, conforme a la Ley N.º 29733, Ley de Protección de
            Datos Personales, y su reglamento.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-texto-fuerte">
            2. Qué datos recopilamos y para qué
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium text-texto-fuerte">
                Datos de pedido (nombre y celular):
              </span>{" "}
              se usan exclusivamente para registrar, confirmar, producir y
              entregar tu pedido, y para contactarte sobre su estado.
            </li>
            <li>
              <span className="font-medium text-texto-fuerte">
                Comprobantes de pago:
              </span>{" "}
              la imagen que subes al pagar con Yape o Plin se usa únicamente
              para validar tu pago.
            </li>
            <li>
              <span className="font-medium text-texto-fuerte">
                Datos del Libro de Reclamaciones:
              </span>{" "}
              se usan únicamente para atender y responder tu reclamo o queja,
              conforme a la Ley N.º 29571.
            </li>
            <li>
              <span className="font-medium text-texto-fuerte">
                Correo del newsletter:
              </span>{" "}
              si te suscribes voluntariamente, usamos tu correo solo para
              enviarte novedades y ofertas de la tienda, conforme a la Ley
              N.º 28493. Puedes darte de baja en cualquier momento
              escribiéndonos por nuestros canales de contacto.
            </li>
          </ul>
          <p className="mt-2">
            No vendemos ni cedemos tus datos personales a terceros. No usamos
            tus datos para publicidad sin tu consentimiento previo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-texto-fuerte">
            3. Almacenamiento local en tu navegador
          </h2>
          <p className="mt-2">
            El carrito de compras y la lista de favoritos se guardan únicamente
            en tu propio navegador (almacenamiento local). Esa información no se
            envía a nuestros servidores hasta que decides realizar un pedido o
            una consulta. Este sitio no utiliza cookies de publicidad ni de
            seguimiento de terceros.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-texto-fuerte">
            4. Plazo de conservación
          </h2>
          <p className="mt-2">
            Conservamos los datos de pedidos y reclamos por el tiempo necesario
            para cumplir las obligaciones legales, contables y de atención al
            consumidor aplicables.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-texto-fuerte">
            5. Tus derechos (ARCO)
          </h2>
          <p className="mt-2">
            Puedes ejercer tus derechos de acceso, rectificación, cancelación y
            oposición sobre tus datos personales escribiéndonos por WhatsApp o a
            nuestros canales de contacto indicados en el pie de página.
            Atenderemos tu solicitud en los plazos que establece la ley. También
            puedes presentar una reclamación ante la Autoridad Nacional de
            Protección de Datos Personales.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-texto-fuerte">
            6. Seguridad
          </h2>
          <p className="mt-2">
            Aplicamos medidas técnicas y organizativas razonables para proteger
            tus datos personales contra el acceso no autorizado, la pérdida o la
            alteración.
          </p>
        </section>
      </div>
    </div>
  );
}
