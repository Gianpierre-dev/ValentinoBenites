import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

/**
 * Notificaciones por email al negocio (no al consumidor final).
 * Fail-safe por diseno: si el SMTP no esta configurado o el envio falla,
 * se registra en el log y la operacion de negocio NUNCA se bloquea.
 *
 * Variables de entorno:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  -> credenciales del correo saliente
 *   NOTIFICACIONES_EMAIL_DESTINO               -> correo de la duena del negocio
 */
@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);
  private readonly transporte: Transporter | null;
  private readonly destino: string | null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const usuario = process.env.SMTP_USER;
    const clave = process.env.SMTP_PASS;
    this.destino = process.env.NOTIFICACIONES_EMAIL_DESTINO ?? null;

    if (host && usuario && clave && this.destino) {
      this.transporte = createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587) === 465,
        auth: { user: usuario, pass: clave },
      });
    } else {
      this.transporte = null;
      this.logger.warn(
        'SMTP no configurado: las notificaciones por email estan desactivadas.',
      );
    }
  }

  /**
   * Avisa a la duena que entro una hoja de reclamacion. El plazo legal de
   * respuesta (15 dias habiles) corre desde el registro, por eso el aviso
   * inmediato es critico. Fire-and-forget: nunca lanza.
   */
  async avisarNuevoReclamo(datos: {
    codigo: string;
    tipo: string;
    nombreCompleto: string;
    telefono: string;
    descripcionBien: string;
  }): Promise<void> {
    if (!this.transporte || !this.destino) return;

    try {
      await this.transporte.sendMail({
        from: `"Valentino Benites" <${process.env.SMTP_USER}>`,
        to: this.destino,
        subject: `Nuevo ${datos.tipo.toLowerCase()} en el Libro de Reclamaciones (${datos.codigo})`,
        text: [
          `Se registró una nueva hoja en el Libro de Reclamaciones.`,
          ``,
          `Código: ${datos.codigo}`,
          `Tipo: ${datos.tipo}`,
          `Consumidor: ${datos.nombreCompleto}`,
          `Teléfono: ${datos.telefono}`,
          `Producto o servicio: ${datos.descripcionBien}`,
          ``,
          `Tienes un plazo máximo de 15 días hábiles para responder.`,
          `Responde desde el panel: /admin/reclamos`,
        ].join('\n'),
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el aviso del reclamo ${datos.codigo}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
