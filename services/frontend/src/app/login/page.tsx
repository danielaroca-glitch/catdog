import { LoginForm } from "@/components/auth/login-form"

/**
 * `searchParams` é uma prop assíncrona em Server Components no App Router
 * desta versão do Next.js (ver
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
 * — "searchParams" é `Promise<{ [key: string]: string | string[] | undefined }>`).
 */
export interface LoginPageProps {
  readonly searchParams: Promise<{ message?: string }>
}

/**
 * Achado #3 (review pbi-002): `refresh-scheduler.ts` redireciona para
 * `/login?message=...` quando a renovação automática falha (RN-03 — token
 * já rotacionado/inválido), mas nada aqui lia esse parâmetro. `EXPERIENCE.md`
 * ("Sessão expirada durante uso") exige que essa mensagem seja mostrada.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message } = await searchParams

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <LoginForm sessionMessage={message} />
    </div>
  )
}
