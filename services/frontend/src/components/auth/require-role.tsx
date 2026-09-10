"use client"

import type { ReactNode } from "react"

import type { UserRole } from "@/lib/api/auth"
import { useSession } from "@/lib/auth/session-context"

import { AccessDenied } from "./access-denied"

const LOGIN_ROUTE = "/login"

// pbi-003 (T8/T9): mapeamento único papel → rota de destino. Reusado tanto
// pelo botão "Voltar para minha área" (AccessDenied, via RequireRole) quanto
// pelo redirecionamento pós-login (LoginForm, T9) — mesma fonte de verdade
// nos dois sentidos (E2E-01/E2E-02 e E2E-03), em vez de duas listas de rotas
// que podem divergir.
const ROLE_HOME_ROUTES: Readonly<Record<UserRole, string>> = {
  admin: "/admin",
  adotante: "/cliente",
}

export function roleHomeRoute(role: UserRole | undefined): string {
  return role ? ROLE_HOME_ROUTES[role] : LOGIN_ROUTE
}

export interface RequireRoleProps {
  readonly role: UserRole
  readonly children: ReactNode
}

/**
 * Guard de rota client-side (pbi-003, AUTZ-02).
 *
 * spec.md ("Nota de arquitetura"): a sessão vive só em memória do React
 * (`SessionContext`), inacessível ao middleware/edge do Next.js — por isso a
 * checagem de papel só pode acontecer no client, aqui. Isso cobre a UX
 * (esconder o conteúdo, mostrar `AccessDenied`), mas **não é** uma fronteira
 * de segurança: qualquer endpoint real de admin precisa do `RolesGuard` no
 * backend (AUTZ-03), que é a fronteira de verdade.
 */
export function RequireRole({ role, children }: RequireRoleProps) {
  const { session } = useSession()

  if (session?.role !== role) {
    return <AccessDenied homeRoute={roleHomeRoute(session?.role)} />
  }

  return <>{children}</>
}
