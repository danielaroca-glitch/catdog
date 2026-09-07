import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from './match.validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'nome é obrigatório' })
  nome: string;

  @IsEmail({}, { message: 'e-mail inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'senha deve ter no mínimo 8 caracteres' })
  senha: string;

  @IsString()
  @Match('senha', { message: 'confirmação de senha deve ser igual à senha' })
  confirmarSenha: string;
}
