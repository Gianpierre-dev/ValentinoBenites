import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CrearBilleteraDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MinLength(2, { message: 'El nombre es demasiado corto.' })
  @MaxLength(40, { message: 'El nombre es demasiado largo.' })
  // Letras, numeros y espacios: "Agora", "BIM", "Banco de la Nacion".
  @Matches(/^[\p{L}\p{N}][\p{L}\p{N}\s.-]*$/u, {
    message: 'El nombre tiene caracteres no permitidos.',
  })
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Las instrucciones son demasiado largas.' })
  instrucciones?: string;

  // Debe ser una URL https de nuestro storage (POST /storage/upload).
  @IsOptional()
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'El QR debe ser una URL https válida.' },
  )
  @MaxLength(2048)
  qrUrl?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}
