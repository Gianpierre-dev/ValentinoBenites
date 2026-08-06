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
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { RUTA_STORAGE } from '../../common/url-storage';

export class ImagenProductoDto {
  // La imagen debe ser de nuestro storage (POST /storage/upload), no una URL
  // arbitraria: se guarda en la base y luego el servidor la fetchea al exportar.
  @IsString()
  @IsNotEmpty({ message: 'La URL de la imagen es obligatoria.' })
  @Matches(RUTA_STORAGE, { message: 'La imagen debe subirse desde la tienda.' })
  url!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}

export class CrearProductoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre!: string;

  @IsString()
  @IsNotEmpty({ message: 'El slug es obligatorio.' })
  slug!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  // Ficha tecnica (texto libre, opcional).
  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  dimensiones?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioOferta?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  destacado?: boolean;

  // Categoria opcional: el producto puede quedar sin clasificar.
  @IsOptional()
  @IsString()
  categoriaId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => ImagenProductoDto)
  imagenes?: ImagenProductoDto[];
}
