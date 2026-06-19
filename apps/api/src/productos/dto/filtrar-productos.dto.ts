import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

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
}
