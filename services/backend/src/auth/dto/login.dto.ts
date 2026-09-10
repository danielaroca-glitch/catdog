import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'e-mail inválido' })
  @MaxLength(255, { message: 'e-mail excede o tamanho máximo permitido' })
  email: string;

  @IsString({ message: 'senha deve ser uma string' })
  @IsNotEmpty({ message: 'senha é obrigatória' })
  @MaxLength(128, { message: 'senha excede o tamanho máximo permitido' })
  senha: string;
}
