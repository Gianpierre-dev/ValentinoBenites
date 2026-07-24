import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Hoja de reclamacion del Libro de Reclamaciones virtual (DS 011-2011).
 * Campos minimos exigidos: identificacion del consumidor, bien contratado,
 * detalle del reclamo/queja y pedido del consumidor.
 */
export class CrearReclamoDto {
  @IsIn(['RECLAMO', 'QUEJA'])
  tipo!: 'RECLAMO' | 'QUEJA';

  @IsString()
  @MinLength(3, { message: 'Ingresa tu nombre completo.' })
  @MaxLength(120)
  nombreCompleto!: string;

  @IsString()
  @Matches(/^[0-9A-Za-z-]{8,12}$/, {
    message: 'Ingresa un DNI o carnet de extranjeria valido.',
  })
  documento!: string;

  @IsString()
  @MinLength(5, { message: 'Ingresa tu domicilio.' })
  @MaxLength(200)
  domicilio!: string;

  @IsString()
  @Matches(/^9\d{8}$/, {
    message: 'Ingresa un celular valido de 9 digitos (empieza en 9).',
  })
  telefono!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Ingresa un correo valido.' })
  email?: string;

  @IsOptional()
  @IsBoolean()
  esMenorDeEdad?: boolean;

  // Obligatorio cuando el consumidor es menor de edad (DS 011-2011).
  @ValidateIf((dto: CrearReclamoDto) => dto.esMenorDeEdad === true)
  @IsString()
  @MinLength(3, { message: 'Ingresa el nombre del padre, madre o apoderado.' })
  @MaxLength(120)
  apoderado?: string;

  @IsString()
  @MinLength(3, { message: 'Describe el producto o servicio.' })
  @MaxLength(300)
  descripcionBien!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoReclamado?: number;

  @IsString()
  @MinLength(10, {
    message: 'Detalla tu reclamo o queja (minimo 10 caracteres).',
  })
  @MaxLength(3000)
  detalle!: string;

  @IsString()
  @MinLength(5, { message: 'Indica que solicitas como consumidor.' })
  @MaxLength(1000)
  pedidoConsumidor!: string;
}
