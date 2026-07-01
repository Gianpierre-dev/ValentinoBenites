import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ImagenVarianteDto {
  @IsString()
  @IsNotEmpty({ message: 'La URL de la imagen es obligatoria.' })
  url!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}

export class CrearVarianteDto {
  @IsString()
  @IsNotEmpty({ message: 'El color es obligatorio.' })
  color!: string;

  @IsOptional()
  @IsString()
  colorHex?: string;

  // Override OPCIONAL del precio del modelo. Si se omite, la variante hereda el
  // precio del producto (ver precioEfectivoVariante).
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioOferta?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => ImagenVarianteDto)
  imagenes?: ImagenVarianteDto[];
}
