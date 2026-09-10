"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Estado de "Acesso negado" (pbi-003, AUTZ-02).
 *
 * DESIGN.md: ícone neutro em `{colors.muted-foreground}` — nunca
 * `{colors.destructive}` (reservado a erros de formulário/credenciais, não
 * a uma tentativa de navegação bloqueada).
 *
 * EXPERIENCE.md (Padrões de Componentes / Piso de Acessibilidade): página
 * inteira (não modal), heading `<h1>` com foco movido para ele ao montar
 * (leitores de tela anunciam o bloqueio imediatamente), e um único botão
 * "Voltar para minha área" que leva ao destino correto do papel do usuário.
 *
 * `homeRoute` é recebido pronto de quem monta este componente (`RequireRole`,
 * T8) — este componente é puramente apresentacional, sem depender de
 * `SessionContext` diretamente.
 */
export interface AccessDeniedProps {
  readonly homeRoute: string
}

export function AccessDenied({ homeRoute }: AccessDeniedProps) {
  const router = useRouter()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <Lock
        className="size-10 text-muted-foreground"
        aria-hidden="true"
        data-testid="access-denied-icon"
      />
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-semibold"
        data-testid="access-denied-heading"
      >
        Você não tem permissão para acessar esta página.
      </h1>
      <Button
        type="button"
        onClick={() => router.push(homeRoute)}
        data-testid="access-denied-back-button"
      >
        Voltar para minha área
      </Button>
    </div>
  )
}
