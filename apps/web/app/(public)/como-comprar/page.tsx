import type { Metadata } from "next";
import Link from "next/link";
import {
  IconArrowRight,
  IconBrandWhatsapp,
  IconNeedleThread,
  IconQrcode,
  IconShoppingBag,
} from "@tabler/icons-react";
import { BotonPremium, EncabezadoContenido, Revelar } from "@/components/ui";

export const metadata: Metadata = {
  title: "Cómo comprar",
  description:
    "Comprar en Valentino Benites es simple: eliges tu modelo y color, pagas por Yape, Plin o WhatsApp, y confeccionamos tu pieza a pedido en 24 horas.",
  alternates: { canonical: "/como-comprar" },
};

const PASOS = [
  {
    Icono: IconShoppingBag,
    titulo: "Elige tu modelo",
    texto:
      "Recorre el catálogo y agrega al carrito lo que te guste. Si el modelo tiene varios colores, puedes elegir el tuyo dentro del producto o dejarlo como \"A coordinar\" y lo definimos juntos después.",
  },
  {
    Icono: IconQrcode,
    titulo: "Completa tu pedido",
    texto:
      "En el checkout dejas tu nombre y celular, y eliges cómo pagar: con Yape o Plin escaneando el QR y subiendo tu comprobante, o coordinando directamente por WhatsApp.",
  },
  {
    Icono: IconBrandWhatsapp,
    titulo: "Confirmamos contigo",
    texto:
      "Validamos tu pago, cerramos el color si quedó pendiente y coordinamos el envío según tu destino. Todo por WhatsApp, con tu código de pedido a la mano.",
  },
  {
    Icono: IconNeedleThread,
    titulo: "La confeccionamos para ti",
    texto:
      "Recién ahí empieza el trabajo: tu pieza se elabora en aproximadamente 24 horas y se despacha. Por eso cada cartera es única y no una unidad de producción en serie.",
  },
];

export default function PaginaComoComprar() {
  return (
    <div className="bg-gradient-to-b from-perla to-fondo">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20 lg:px-8">
        <Revelar>
          <EncabezadoContenido
            seccion="Guía de compra"
            titulo={
              <>
                Cómo <span className="italic text-acento">comprar</span>
              </>
            }
            descripcion="Nuestras piezas se hacen a pedido. Estos son los cuatro pasos, de principio a fin."
          />
        </Revelar>

        <ol className="mt-12 space-y-5">
          {PASOS.map(({ Icono, titulo, texto }, indice) => (
            <Revelar key={titulo} delay={indice * 60}>
              <li className="flex gap-5 rounded-2xl border border-borde bg-superficie p-6">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-acento/10 text-acento">
                  <Icono size={24} stroke={1.5} aria-hidden />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-acento text-[11px] font-bold text-acento-contraste">
                    {indice + 1}
                  </span>
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-texto-fuerte">
                    {titulo}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-texto">
                    {texto}
                  </p>
                </div>
              </li>
            </Revelar>
          ))}
        </ol>

        <Revelar delay={280}>
          <div className="mt-10 rounded-2xl border border-acento/20 bg-acento/[.04] p-6">
            <h2 className="text-base font-semibold text-texto-fuerte">
              ¿Por qué se hace a pedido?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-texto">
              Porque no mantenemos stock de todos los colores. Trabajamos cada
              pieza cuando alguien la pide, en el color que eligió. Eso nos permite
              ofrecerte más variedad y cuidar el acabado de cada cartera, a cambio
              de un día de elaboración.
            </p>
          </div>
        </Revelar>

        <Revelar delay={340}>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <BotonPremium href="/catalogo" icono={IconArrowRight}>
              Empezar a comprar
            </BotonPremium>
            <Link
              href="/preguntas-frecuentes"
              className="text-sm font-medium text-acento underline underline-offset-4"
            >
              Ver preguntas frecuentes
            </Link>
          </div>
        </Revelar>
      </div>
    </div>
  );
}
