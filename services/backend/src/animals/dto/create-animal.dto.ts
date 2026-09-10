import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAnimalDto {
  @IsString({ message: 'name deve ser uma string' })
  @IsNotEmpty({ message: 'name é obrigatório' })
  @MaxLength(120, { message: 'name excede o tamanho máximo permitido' })
  name: string;

  @IsUUID('4', { message: 'species_id deve ser um UUID válido' })
  species_id: string;
}
