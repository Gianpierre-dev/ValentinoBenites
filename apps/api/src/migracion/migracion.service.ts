import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizarTexto } from './diccionario-colores';
import { parsearNombre } from './parser-nombre';
import { AplicarGrupoDto } from './dto/aplicar-grupo.dto';

export interface VariantePropuesta {
  productoId: string;
  nombreOriginal: string;
  color: string;
  requiereRevision: boolean;
}

export interface GrupoPropuesto {
  modelo: string;
  requiereRevision: boolean;
  variantes: VariantePropuesta[];
}

export interface ResultadoAplicacion {
  cabeceraProductoId: string;
  modelo: string;
  variantesCreadas: number;
  variantesExistentes: number;
  productosAbsorbidos: string[];
}

/**
 * Fase M2 (agrupacion) — SOLO PROPUESTA, no destructiva. Corre el parser sobre
 * los productos actuales y agrupa por modelo. El resultado es un borrador que la
 * admin revisa y corrige; NADA se aplica aqui (la fusion real es Batch 4 admin).
 */
@Injectable()
export class MigracionService {
  constructor(private readonly prisma: PrismaService) {}

  async proponerAgrupacion(): Promise<GrupoPropuesto[]> {
    const productos = await this.prisma.producto.findMany({
      orderBy: { nombre: 'asc' },
    });

    const grupos = new Map<string, GrupoPropuesto>();

    for (const producto of productos) {
      const { modelo, color, requiereRevision } = parsearNombre(
        producto.nombre,
      );
      const clave = normalizarTexto(modelo);
      const grupo = grupos.get(clave) ?? {
        modelo,
        requiereRevision: false,
        variantes: [],
      };
      grupo.variantes.push({
        productoId: producto.id,
        nombreOriginal: producto.nombre,
        color,
        requiereRevision,
      });
      grupo.requiereRevision = grupo.requiereRevision || requiereRevision;
      grupos.set(clave, grupo);
    }

    return [...grupos.values()];
  }

  /**
   * Fase M2 (aplicacion) — fusiona un grupo revisado en su producto cabecera.
   * NO destructiva (los absorbidos quedan activo=false), idempotente (por color
   * normalizado ya presente en la cabecera) y grupo por grupo. Respeta el flag
   * requiereRevision: si sigue en true, no fuerza la fusion (humano en el loop).
   */
  async aplicarAgrupacion(
    grupo: AplicarGrupoDto,
  ): Promise<ResultadoAplicacion> {
    if (grupo.requiereRevision) {
      throw new BadRequestException(
        'El grupo requiere revision manual antes de aplicarse. Corrige el modelo y los colores, luego confirma.',
      );
    }
    if (!grupo.variantes?.length) {
      throw new BadRequestException('El grupo no tiene variantes para aplicar.');
    }

    return this.prisma.$transaction(async (tx) => {
      const cabecera = await tx.producto.findUnique({
        where: { id: grupo.cabeceraProductoId },
      });
      if (!cabecera) {
        throw new NotFoundException('El producto cabecera no existe.');
      }

      // Renombra la cabecera al modelo final (idempotente: solo si cambio).
      if (cabecera.nombre !== grupo.modelo) {
        await tx.producto.update({
          where: { id: cabecera.id },
          data: { nombre: grupo.modelo },
        });
      }

      // Colores ya presentes en la cabecera → idempotencia por color normalizado.
      const variantesActuales = await tx.variante.findMany({
        where: { productoId: cabecera.id },
      });
      const coloresExistentes = new Set(
        variantesActuales.map((v) => normalizarTexto(v.color)),
      );

      let variantesCreadas = 0;
      let variantesExistentes = 0;
      let orden = variantesActuales.length;

      for (const entrada of grupo.variantes) {
        const claveColor = normalizarTexto(entrada.color);
        if (coloresExistentes.has(claveColor)) {
          variantesExistentes += 1;
          continue;
        }

        const origen = await tx.producto.findUnique({
          where: { id: entrada.productoId },
          include: { imagenes: { orderBy: { orden: 'asc' } } },
        });
        const esAbsorbido = !!origen && origen.id !== cabecera.id;

        await tx.variante.create({
          data: {
            productoId: cabecera.id,
            color: entrada.color,
            colorHex: entrada.colorHex ?? null,
            // Preserva el precio del producto absorbido como override para no perder
            // informacion. El color propio de la cabecera hereda (precio null).
            precio: esAbsorbido ? origen.precio : null,
            precioOferta: esAbsorbido ? origen.precioOferta : null,
            orden: orden++,
            // Reapunta las fotos del producto absorbido como imagenes de variante
            // para no perderlas cuando el producto quede inactivo.
            imagenes:
              esAbsorbido && origen.imagenes?.length
                ? {
                    create: origen.imagenes.map((img) => ({
                      url: img.url,
                      orden: img.orden,
                    })),
                  }
                : undefined,
          },
        });
        coloresExistentes.add(claveColor);
        variantesCreadas += 1;
      }

      // Soft-delete no destructivo de los productos absorbidos (nunca la cabecera).
      const productosAbsorbidos = [
        ...new Set(
          grupo.variantes
            .map((v) => v.productoId)
            .filter((id) => id !== cabecera.id),
        ),
      ];
      if (productosAbsorbidos.length) {
        await tx.producto.updateMany({
          where: { id: { in: productosAbsorbidos }, activo: true },
          data: { activo: false },
        });
      }

      return {
        cabeceraProductoId: cabecera.id,
        modelo: grupo.modelo,
        variantesCreadas,
        variantesExistentes,
        productosAbsorbidos,
      };
    });
  }
}
