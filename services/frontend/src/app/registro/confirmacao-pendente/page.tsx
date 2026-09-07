"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

// EXPERIENCE.md (Padrões de Componentes): "Desabilitado com contagem
// regressiva por um cooldown curto após cada envio, para evitar reenvio
// abusivo." 30s é o valor adotado para esse cooldown curto.
const RESEND_COOLDOWN_SECONDS = 30

function ConfirmacaoPendenteContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  // Um único `setInterval` por clique (guardado em ref, não em estado) evita
  // recriar o timer a cada segundo: o efeito só cuida de limpar o intervalo
  // no unmount, e o próprio callback do intervalo se autolimita ao chegar a
  // zero.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  function handleResendClick() {
    // [NOTA] REG-09: o backend ainda não expõe um endpoint de reenvio do
    // e-mail de confirmação (fora do escopo desta feature/PBI — ver T7 em
    // task.md). Este clique inicia apenas o cooldown visual, prevenindo
    // reenvio abusivo conforme EXPERIENCE.md; nenhuma chamada real de API é
    // feita ainda. Revisitar quando o backend expuser esse endpoint.
    setCooldownSeconds(RESEND_COOLDOWN_SECONDS)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      setCooldownSeconds((current) => {
        if (current <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return 0
        }
        return current - 1
      })
    }, 1000)
  }

  const isResendDisabled = cooldownSeconds > 0

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Alert
        className="bg-success-sage text-primary-foreground"
        data-testid="confirmacao-pendente-alert"
      >
        <CheckCircle2 aria-hidden="true" />
        <AlertDescription
          className="text-primary-foreground"
          data-testid="confirmacao-pendente-email"
        >
          Enviamos um e-mail de confirmação para {email}.
        </AlertDescription>
      </Alert>
      <Button
        type="button"
        className="w-full"
        disabled={isResendDisabled}
        onClick={handleResendClick}
        data-testid="resend-confirmation-button"
      >
        {isResendDisabled
          ? `Reenviar confirmação (${cooldownSeconds}s)`
          : "Reenviar confirmação"}
      </Button>
    </div>
  )
}

export default function ConfirmacaoPendentePage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      {/* useSearchParams exige um limite Suspense para não travar a
          prerenderização estática (Next.js 16) — ver
          node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md */}
      <Suspense fallback={null}>
        <ConfirmacaoPendenteContent />
      </Suspense>
    </div>
  )
}
