import { IsOptional, IsString } from 'class-validator';

export class ActualizarConfiguracionDto {
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  datosYape?: string;

  @IsOptional()
  @IsString()
  datosPlin?: string;

  @IsOptional()
  banners?: unknown;
}
