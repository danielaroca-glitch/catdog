import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateAnimalDto {
  @IsOptional()
  @IsString({ message: 'name deve ser uma string' })
  @IsNotEmpty({ message: 'name não pode ser vazio quando informado' })
  @MaxLength(120, { message: 'name excede o tamanho máximo permitido' })
  name?: string;

  @IsOptional()
  @IsUUID('4', { message: 'species_id deve ser um UUID válido' })
  species_id?: string;
}
