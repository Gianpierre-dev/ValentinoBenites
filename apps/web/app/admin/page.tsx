"use client";

import Link from "next/link";
import {
  IconShoppingBag,
  IconCategory,
  IconReceipt,
  IconClockHour4,
} from "@tabler/icons-react";
import { listarProductos, listarCategorias, listarPedidos } from "@/lib/api";
import { EncabezadoPagina, VistaCargando, VistaError, useRecurso } from "@/components/admin";
import { Tarjeta } from "@/components/ui";

interface Conteos {
  productos: number;
  categorias: number;
  pedidos: number;
  pedidosPendientes: number;
}

async function cargarConteos(): Promise<Conteos> {
  const [productos, categorias, pedidos] = await Promise.all([
    listarProductos(),
    listarCategorias(),
    listarPedidos(),
  ]);
  return {
    productos: productos.length,
    categorias: categorias.length,
    pedidos: pedidos.length,
    pedidosPendientes: pedidos.filter((pedido) => pedido.estado === "PENDIENTE").length,
  };
}

export default function PaginaResumen() {
  const { estado, recargar } = useRecurso<Conteos>(cargarConteos);

  return (
    <>
      <EncabezadoPagina titulo="Resumen" descripcion="Estado general de tu tienda." />

      {estado.tipo === "cargando" && <VistaCargando etiqueta="Cargando resumen" />}
      {estado.tipo === "error" && <VistaError mensaje={estado.mensaje} alReintentar={recargar} />}

      {estado.tipo === "listo" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TarjetaConteo
            href="/admin/productos"
            etiqueta="Productos"
            valor={estado.datos.productos}
            Icono={IconShoppingBag}
          />
          <TarjetaConteo
            href="/admin/categorias"
            etiqueta="Categorias"
            valor={estado.datos.categorias}
            Icono={IconCategory}
          />
          <TarjetaConteo
            href="/admin/pedidos"
            etiqueta="Pedidos"
            valor={estado.datos.pedidos}
            Icono={IconReceipt}
          />
          <TarjetaConteo
            href="/admin/pedidos"
            etiqueta="Pedidos pendientes"
            valor={estado.datos.pedidosPendientes}
            Icono={IconClockHour4}
            resaltar={estado.datos.pedidosPendientes > 0}
          />
        </div>
      )}
    </>
  );
}

interface PropsTarjetaConteo {
  href: string;
  etiqueta: string;
  valor: number;
  Icono: typeof IconShoppingBag;
  resaltar?: boolean;
}

function TarjetaConteo({ href, etiqueta, valor, Icono, resaltar = false }: PropsTarjetaConteo) {
  return (
    <Link href={href} className="block">
      <Tarjeta className="h-full p-5 transition-colors hover:bg-black/[.02]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-texto/70">{etiqueta}</span>
          <Icono className="h-5 w-5 text-texto/50" aria-hidden />
        </div>
        <p
          className={
            resaltar
              ? "mt-3 text-3xl font-semibold text-oferta"
              : "mt-3 text-3xl font-semibold text-texto-fuerte"
          }
        >
          {valor}
        </p>
      </Tarjeta>
    </Link>
  );
}
