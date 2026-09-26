import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class ActualizarCredencialesDto {
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria.' })
  passwordActual!: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo nuevo no es válido.' })
  emailNuevo?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, {
    message: 'La contraseña nueva debe tener al menos 8 caracteres.',
  })
  passwordNueva?: string;
}
