import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

// Una variante revisada del grupo: el producto original que aporta el color y el
// color/hex final que decidio la admin tras revisar la propuesta del parser.
export class VarianteAplicarDto {
  @IsString()
  @IsNotEmpty({ message: 'El productoId de la variante es obligatorio.' })
  productoId!: string;

  @IsString()
  @IsNotEmpty({ message: 'El color es obligatorio.' })
  color!: string;

  @IsOptional()
  @IsString()
  colorHex?: string;
}

// Grupo revisado por la admin, listo para fusionarse. `cabeceraProductoId` es el
// producto que queda como MODELO; los demas se absorben (soft-delete).
export class AplicarGrupoDto {
  @IsString()
  @IsNotEmpty({ message: 'El producto cabecera es obligatorio.' })
  cabeceraProductoId!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del modelo es obligatorio.' })
  modelo!: string;

  // Si sigue en true, el grupo NO se aplica: exige revision humana previa. La admin
  // corrige modelo/colores y envia requiereRevision=false para confirmar.
  @IsOptional()
  @IsBoolean()
  requiereRevision?: boolean;

  @IsArray()
  @ArrayMinSize(1, { message: 'El grupo debe tener al menos una variante.' })
  @ValidateNested({ each: true })
  @Type(() => VarianteAplicarDto)
  variantes!: VarianteAplicarDto[];
}
