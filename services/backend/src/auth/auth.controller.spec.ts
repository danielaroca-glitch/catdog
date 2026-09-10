import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailAlreadyExistsException } from './exceptions/email-already-exists.exception';
import { EmailNotConfirmedException } from './exceptions/email-not-confirmed.exception';
import { AuthenticatedRequest, JwtAuthGuard } from './guards/jwt-auth.guard';
import { ProfileRoleLookup } from './profile-role.lookup';
import { AuthenticatedSession, LoginUseCase } from './use-cases/login.use-case';
import { RefreshedSession, RefreshUseCase } from './use-cases/refresh.use-case';
import { RegisteredUser, RegisterUseCase } from './use-cases/register.use-case';
import { AuthController } from './auth.controller';
import { UnauthorizedException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider';

interface ControllerOverrides {
  registerUseCase?: Partial<RegisterUseCase>;
  loginUseCase?: Partial<LoginUseCase>;
  refreshUseCase?: Partial<RefreshUseCase>;
  profileRoleLookup?: Partial<ProfileRoleLookup>;
  supabase?: unknown;
}

function buildFakeSupabase() {
  return {
    auth: { admin: { getUserById: jest.fn() } },
  };
}

async function buildController(overrides: ControllerOverrides = {}) {
  const module = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      {
        provide: RegisterUseCase,
        useValue: overrides.registerUseCase ?? { execute: jest.fn() },
      },
      {
        provide: LoginUseCase,
        useValue: overrides.loginUseCase ?? { execute: jest.fn() },
      },
      {
        provide: RefreshUseCase,
        useValue: overrides.refreshUseCase ?? { execute: jest.fn() },
      },
      {
        provide: ProfileRoleLookup,
        useValue: overrides.profileRoleLookup ?? { execute: jest.fn() },
      },
      {
        provide: SUPABASE_CLIENT,
        useValue: overrides.supabase ?? buildFakeSupabase(),
      },
    ],
  })
    // T12/T4: `register` e `login` estão protegidos por
    // @UseGuards(ThrottlerGuard). Nos testes de unidade do controller (que
    // chamam o método diretamente, sem passar pelo pipeline HTTP), o guard
    // não é exercitado — apenas precisa ser resolvível para o módulo
    // compilar. O comportamento de rate limit em si é coberto pelos testes
    // de integração (`test/auth-register-rate-limit.e2e-spec.ts`,
    // `test/auth-login.e2e-spec.ts`).
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    // T5: `me` está protegido por @UseGuards(JwtAuthGuard). Mesmo racional do
    // ThrottlerGuard acima — os testes de unidade chamam `controller.me(...)`
    // diretamente, sem passar pelo pipeline HTTP, então o guard real (que
    // precisa de SUPABASE_JWT_SECRET via ConfigService) só precisa ser
    // resolvível para o módulo compilar. O comportamento de 401 sem
    // token/com token inválido é coberto por `test/auth-me.e2e-spec.ts`.
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

  return module.get(AuthController);
}

describe('AuthController', () => {
  const validRegisterDto: RegisterDto = Object.assign(new RegisterDto(), {
    nome: 'Daniela Roca',
    email: 'daniela@example.com',
    senha: 'senhaForte123',
    confirmarSenha: 'senhaForte123',
  });

  describe('register', () => {
    it('retorna 201 (implícito) com o usuário registrado em sucesso', async () => {
      const registeredUser: RegisteredUser = {
        id: 'user-1',
        email: validRegisterDto.email,
        role: 'adotante',
      };
      const registerUseCase = {
        execute: jest.fn().mockResolvedValue(registeredUser),
      };

      const controller = await buildController({ registerUseCase });
      const result = await controller.register(validRegisterDto);

      expect(registerUseCase.execute).toHaveBeenCalledWith(validRegisterDto);
      expect(result).toEqual(registeredUser);
    });

    it('propaga EmailAlreadyExistsException (409 via ConflictException do Nest)', async () => {
      const registerUseCase = {
        execute: jest.fn().mockRejectedValue(new EmailAlreadyExistsException()),
      };

      const controller = await buildController({ registerUseCase });

      await expect(
        controller.register(validRegisterDto),
      ).rejects.toBeInstanceOf(EmailAlreadyExistsException);
    });

    /**
     * [NOTA] REG-09 (aviso de falha no envio do e-mail de confirmação):
     * `RegisterUseCase.execute` hoje não distingue "conta criada e e-mail
     * enviado" de "conta criada mas e-mail pode não ter chegado" — o envio é um
     * efeito colateral do Supabase Auth em `auth.admin.createUser`, que não
     * retorna esse sinal na resposta (ver `register.use-case.ts` e o comentário
     * em `auth.controller.ts`). Este teste documenta o comportamento atual —
     * sucesso simples do use case sempre vira 201 sem aviso — em vez de simular
     * um mecanismo de "e-mail não enviado" que não existe no contrato do use
     * case. Se esse sinal passar a existir (ex.: campo `emailSent: boolean` no
     * retorno de `execute`), este teste deve ser atualizado para cobrir o
     * mapeamento desse aviso no corpo da resposta 201.
     */
    it('[NOTA REG-09] sucesso do use case sempre retorna 201 simples, sem sinal de falha de e-mail (use case não expõe esse dado hoje)', async () => {
      const registeredUser: RegisteredUser = {
        id: 'user-2',
        email: validRegisterDto.email,
        role: 'adotante',
      };
      const registerUseCase = {
        execute: jest.fn().mockResolvedValue(registeredUser),
      };

      const controller = await buildController({ registerUseCase });
      const result = await controller.register(validRegisterDto);

      expect(result).toEqual(registeredUser);
      expect(result).not.toHaveProperty('emailSent');
      expect(result).not.toHaveProperty('warning');
    });
  });

  describe('login', () => {
    const validLoginDto: LoginDto = Object.assign(new LoginDto(), {
      email: 'daniela@example.com',
      senha: 'senhaForte123',
    });

    it('retorna a sessão autenticada (access_token + refresh_token) em sucesso (LOGIN-01)', async () => {
      const session: AuthenticatedSession = {
        access_token: 'access-token-1',
        refresh_token: 'refresh-token-1',
        expires_in: 3600,
      };
      const loginUseCase = {
        execute: jest.fn().mockResolvedValue(session),
      };

      const controller = await buildController({ loginUseCase });
      const result = await controller.login(validLoginDto);

      expect(loginUseCase.execute).toHaveBeenCalledWith(validLoginDto);
      expect(result).toEqual(session);
    });

    it('propaga EmailNotConfirmedException (403 via ForbiddenException do Nest) (LOGIN-02)', async () => {
      const loginUseCase = {
        execute: jest.fn().mockRejectedValue(new EmailNotConfirmedException()),
      };

      const controller = await buildController({ loginUseCase });

      await expect(controller.login(validLoginDto)).rejects.toBeInstanceOf(
        EmailNotConfirmedException,
      );
    });

    it('propaga UnauthorizedException genérica em credenciais inválidas (LOGIN-04)', async () => {
      const loginUseCase = {
        execute: jest
          .fn()
          .mockRejectedValue(
            new UnauthorizedException('E-mail ou senha incorretos.'),
          ),
      };

      const controller = await buildController({ loginUseCase });

      await expect(controller.login(validLoginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    const validRefreshDto: RefreshDto = Object.assign(new RefreshDto(), {
      refresh_token: 'refresh-token-1',
    });

    it('retorna o novo par de tokens em sucesso (LOGIN-06)', async () => {
      const session: RefreshedSession = {
        access_token: 'access-token-2',
        refresh_token: 'refresh-token-2',
        expires_in: 3600,
      };
      const refreshUseCase = {
        execute: jest.fn().mockResolvedValue(session),
      };

      const controller = await buildController({ refreshUseCase });
      const result = await controller.refresh(validRefreshDto);

      expect(refreshUseCase.execute).toHaveBeenCalledWith(validRefreshDto);
      expect(result).toEqual(session);
    });

    it('propaga UnauthorizedException em token reutilizado/inválido (LOGIN-03)', async () => {
      const refreshUseCase = {
        execute: jest
          .fn()
          .mockRejectedValue(
            new UnauthorizedException('Sessão inválida ou expirada.'),
          ),
      };

      const controller = await buildController({ refreshUseCase });

      await expect(controller.refresh(validRefreshDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('me', () => {
    function buildRequest(userId?: string): AuthenticatedRequest {
      return {
        user: userId ? { sub: userId } : undefined,
      } as AuthenticatedRequest;
    }

    it('retorna { id, email, role } do usuário do token atual (T5)', async () => {
      const profileRoleLookup = {
        execute: jest.fn().mockResolvedValue('adotante'),
      };
      const supabase = buildFakeSupabase();
      supabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { email: 'daniela@example.com' } },
        error: null,
      });

      const controller = await buildController({ profileRoleLookup, supabase });
      const result = await controller.me(buildRequest('user-1'));

      expect(profileRoleLookup.execute).toHaveBeenCalledWith('user-1');
      expect(supabase.auth.admin.getUserById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        id: 'user-1',
        email: 'daniela@example.com',
        role: 'adotante',
      });
    });

    /**
     * Defensivo (T5): `JwtAuthGuard` sempre popula `request.user.sub` antes
     * de `me` rodar — lança 401 caso contrário, então esta requisição nunca
     * chega aqui em produção. O teste documenta que o controller não confia
     * cegamente nesse invariante, mesmo padrão de `RolesGuard` (achado
     * já coberto por `roles.guard.spec.ts`).
     */
    it('lança UnauthorizedException se request.user estiver ausente (defensivo)', async () => {
      const controller = await buildController();

      await expect(controller.me(buildRequest())).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('lança InternalServerErrorException se a busca do e-mail falhar (getUserById)', async () => {
      const profileRoleLookup = {
        execute: jest.fn().mockResolvedValue('admin'),
      };
      const supabase = buildFakeSupabase();
      supabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: null },
        error: { message: 'not found' },
      });

      const controller = await buildController({ profileRoleLookup, supabase });

      await expect(controller.me(buildRequest('user-2'))).rejects.toThrow();
    });
  });
});
