import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizarTexto } from './diccionario-colores';
import { parsearNombre } from './parser-nombre';

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
}
