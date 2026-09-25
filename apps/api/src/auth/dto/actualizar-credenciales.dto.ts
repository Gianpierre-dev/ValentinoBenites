import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class ActualizarCredencialesDto {
  @IsString()
  @IsNotEmpty({ message: 'La contrasena actual es obligatoria.' })
  passwordActual!: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo nuevo no es valido.' })
  emailNuevo?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, {
    message: 'La contrasena nueva debe tener al menos 8 caracteres.',
  })
  passwordNueva?: string;
}
