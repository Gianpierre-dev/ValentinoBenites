import { IsBoolean, IsOptional, IsString } from 'class-validator';

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
  @IsString()
  heroTitulo?: string;

  @IsOptional()
  @IsString()
  heroSubtitulo?: string;

  @IsOptional()
  @IsBoolean()
  heroTextoClaro?: boolean;

  @IsOptional()
  banners?: unknown;
}
