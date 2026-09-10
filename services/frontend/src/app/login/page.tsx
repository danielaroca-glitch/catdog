import { LoginForm } from "@/components/auth/login-form"
import {
  SESSION_EXPIRED_MESSAGE,
  SESSION_EXPIRED_REASON,
} from "@/lib/auth/refresh-scheduler"

/**
 * `searchParams` é uma prop assíncrona em Server Components no App Router
 * desta versão do Next.js (ver
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
 * — "searchParams" é `Promise<{ [key: string]: string | string[] | undefined }>`).
 */
export interface LoginPageProps {
  readonly searchParams: Promise<{ reason?: string | string[] }>
}

/**
 * Achado #3 (review rodada 1) + achado #2 (review rodada 2): `refresh-scheduler.ts`
 * redireciona para `/login?reason=...` quando a renovação automática falha
 * (RN-03 — token já rotacionado/inválido), e `EXPERIENCE.md` ("Sessão
 * expirada durante uso") exige que a mensagem correspondente seja mostrada.
 * O param carrega só um CÓDIGO, nunca texto livre — resolvido aqui contra uma
 * allowlist fixa, para não permitir que um link `/login?reason=<qualquer
 * coisa>` fizesse a app exibir texto arbitrário (phishing) com a aparência
 * oficial em cima do formulário de senha. `reason` fora da allowlist (ou
 * `string[]`, de query params repetidos) resulta em nenhuma mensagem.
 */
const SESSION_MESSAGES_BY_REASON: Readonly<Record<string, string>> = {
  [SESSION_EXPIRED_REASON]: SESSION_EXPIRED_MESSAGE,
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reason } = await searchParams
  const sessionMessage =
    typeof reason === "string" ? SESSION_MESSAGES_BY_REASON[reason] : undefined

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <LoginForm sessionMessage={sessionMessage} />
    </div>
  )
}
