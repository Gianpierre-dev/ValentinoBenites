import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AgregarImagenVarianteDto {
  @IsString()
  @IsNotEmpty({ message: 'La URL de la imagen es obligatoria.' })
  url!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}
