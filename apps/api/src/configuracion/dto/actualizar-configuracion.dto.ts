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
  @IsString()
  qrYape?: string;

  @IsOptional()
  @IsString()
  qrPlin?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  tiktok?: string;

  @IsOptional()
  banners?: unknown;
}
