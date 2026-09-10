import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ProfileRoleLookup, type UserRole } from '../profile-role.lookup';
import { RolesGuard } from './roles.guard';

interface FakeRequest {
  user?: { sub: string };
}

function buildExecutionContext(user?: { sub: string }): ExecutionContext {
  const request: FakeRequest = { user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

async function buildGuard(
  requiredRoles: UserRole[] | undefined,
  roleLookupResult: UserRole,
) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  };
  const profileRoleLookup = {
    execute: jest.fn().mockResolvedValue(roleLookupResult),
  };

  const module = await Test.createTestingModule({
    providers: [
      RolesGuard,
      { provide: Reflector, useValue: reflector },
      { provide: ProfileRoleLookup, useValue: profileRoleLookup },
    ],
  }).compile();

  return {
    guard: module.get(RolesGuard),
    reflector,
    profileRoleLookup,
  };
}

describe('RolesGuard', () => {
  it('permite (no-op) quando o endpoint não tem @Roles()', async () => {
    const { guard, profileRoleLookup } = await buildGuard(undefined, 'admin');
    const context = buildExecutionContext({ sub: 'user-1' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(profileRoleLookup.execute).not.toHaveBeenCalled();
  });

  it('permite quando o papel do usuário bate com @Roles(admin)', async () => {
    const { guard, profileRoleLookup } = await buildGuard(['admin'], 'admin');
    const context = buildExecutionContext({ sub: 'user-1' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(profileRoleLookup.execute).toHaveBeenCalledWith('user-1');
  });

  it('lança ForbiddenException quando o papel do usuário não bate com @Roles(admin) (AUTZ-06)', async () => {
    const { guard } = await buildGuard(['admin'], 'adotante');
    const context = buildExecutionContext({ sub: 'user-1' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('consulta ProfileRoleLookup a cada canActivate — nunca cacheado entre requisições (AUTZ-03)', async () => {
    const { guard, profileRoleLookup } = await buildGuard(['admin'], 'admin');
    const context = buildExecutionContext({ sub: 'user-1' });

    await guard.canActivate(context);
    await guard.canActivate(context);

    expect(profileRoleLookup.execute).toHaveBeenCalledTimes(2);
  });

  it('lança ForbiddenException quando @Roles() exige um papel mas request.user está ausente', async () => {
    const { guard } = await buildGuard(['admin'], 'admin');
    const context = buildExecutionContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
