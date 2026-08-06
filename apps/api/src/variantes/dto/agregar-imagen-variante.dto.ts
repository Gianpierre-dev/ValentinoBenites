import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { RUTA_STORAGE } from '../../common/url-storage';

export class AgregarImagenVarianteDto {
  @IsString()
  @IsNotEmpty({ message: 'La URL de la imagen es obligatoria.' })
  @Matches(RUTA_STORAGE, { message: 'La imagen debe subirse desde la tienda.' })
  url!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}
