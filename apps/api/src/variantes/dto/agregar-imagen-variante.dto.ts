import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { EsUrlDeStorage } from '../../common/url-storage';

export class AgregarImagenVarianteDto {
  @IsString()
  @IsNotEmpty({ message: 'La URL de la imagen es obligatoria.' })
  @EsUrlDeStorage({ message: 'La imagen debe subirse desde la tienda.' })
  url!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}
