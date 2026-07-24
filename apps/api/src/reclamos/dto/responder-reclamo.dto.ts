import { IsString, MaxLength, MinLength } from 'class-validator';

/** Respuesta del proveedor a una hoja de reclamacion (plazo: 15 dias habiles). */
export class ResponderReclamoDto {
  @IsString()
  @MinLength(10, { message: 'La respuesta debe tener al menos 10 caracteres.' })
  @MaxLength(3000)
  respuesta!: string;
}
