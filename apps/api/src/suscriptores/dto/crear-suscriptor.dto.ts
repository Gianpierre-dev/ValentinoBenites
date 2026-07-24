import { IsEmail } from 'class-validator';

export class CrearSuscriptorDto {
  @IsEmail({}, { message: 'Ingresa un correo valido.' })
  email!: string;
}
