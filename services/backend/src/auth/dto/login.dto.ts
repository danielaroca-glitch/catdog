import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'e-mail inválido' })
  email: string;

  @IsNotEmpty({ message: 'senha é obrigatória' })
  senha: string;
}
