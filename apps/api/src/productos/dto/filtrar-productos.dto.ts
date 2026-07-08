import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class FiltrarProductosDto {
  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  destacados?: boolean;

  @IsOptional()
  @IsString()
  q?: string;

  // Rango de precio sobre el precio base del modelo. Query params opcionales,
  // numericos y no negativos; @Type convierte el string del query a number.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMax?: number;
}
