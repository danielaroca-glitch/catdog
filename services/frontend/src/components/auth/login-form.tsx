"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import * as z from "zod"

import { ApiError, EMAIL_NOT_CONFIRMED_CODE, loginUser } from "@/lib/api/auth"
import { useSession } from "@/lib/auth/session-context"
import { roleHomeRoute } from "@/components/auth/require-role"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const HTTP_STATUS_UNAUTHORIZED = 401
const HTTP_STATUS_FORBIDDEN = 403

// EXPERIENCE.md (Voz e Tom): "E-mail ou senha incorretos." — nunca indica
// qual campo está errado (CA-04). Texto fixo no frontend (independente do
// texto retornado pelo backend), mesmo padrão de RegisterForm para 409.
const INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha incorretos."
const GENERIC_SUBMIT_ERROR_MESSAGE =
  "Não foi possível entrar. Tente novamente mais tarde."
// EXPERIENCE.md (Voz e Tom): "Confirme seu e-mail para continuar."
const EMAIL_NOT_CONFIRMED_MESSAGE = "Confirme seu e-mail para continuar."

// EXPERIENCE.md (Padrões de Componentes): "Desabilitado com contagem
// regressiva por um cooldown curto após cada envio, para evitar reenvio
// abusivo." Mesmo valor e padrão de interação adotados em
// `app/registro/confirmacao-pendente/page.tsx` (pbi-001).
const RESEND_COOLDOWN_SECONDS = 30

// LOGIN-05: espelha 1:1 o LoginDto do backend
// (services/backend/src/auth/dto/login.dto.ts) — email (@IsEmail) e senha
// (@IsNotEmpty) — client-side, mesmo padrão de register-form.tsx.
const loginFormSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  senha: z.string().min(1, "Senha é obrigatória."),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>

export interface LoginFormProps {
  /**
   * Callback opcional chamado com os dados validados no submit, no lugar da
   * integração padrão com a API de login (`loginUser`, ver
   * `src/lib/api/auth.ts`). Usado principalmente em testes para observar o
   * submit sem depender de `fetch` (mesmo padrão de `RegisterForm`). Quando
   * omitido, o formulário chama `POST /auth/login`, trata os três desfechos
   * (sucesso, e-mail não confirmado, credenciais inválidas) e, em caso de
   * sucesso, define a sessão e navega.
   */
  readonly onSubmit?: (values: LoginFormValues) => void | Promise<void>
  /**
   * Mensagem propagada via query string `?message=` (achado #3 do review da
   * pbi-002) — hoje usada pelo redirect de `refresh-scheduler.ts` quando a
   * renovação automática de sessão falha (RN-03). Renderizada acima do
   * formulário, no mesmo padrão visual (`Alert`/`AlertDescription`,
   * `aria-live="polite"`) já usado abaixo para os demais estados.
   */
  readonly sessionMessage?: string
}

export function LoginForm({ onSubmit, sessionMessage }: LoginFormProps) {
  const router = useRouter()
  const { setSession } = useSession()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false)
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0)
  // Um único `setInterval` por clique (guardado em ref, não em estado) evita
  // recriar o timer a cada segundo — mesmo padrão de
  // `app/registro/confirmacao-pendente/page.tsx`.
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  )
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      senha: "",
    },
  })

  const isSubmitting = form.formState.isSubmitting
  const emailValue = useWatch({ control: form.control, name: "email" })
  const senhaValue = useWatch({ control: form.control, name: "senha" })
  // EXPERIENCE.md (Padrões de Componentes): "Submit desabilitado enquanto
  // algum campo está vazio."
  const isSubmitDisabled = isSubmitting || !emailValue || !senhaValue
  const isResendDisabled = resendCooldownSeconds > 0

  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current)
      }
    }
  }, [])

  function handleResendClick() {
    // [NOTA] Mesma ressalva de `confirmacao-pendente/page.tsx` (REG-09): o
    // backend ainda não expõe um endpoint de reenvio do e-mail de
    // confirmação. Este clique inicia apenas o cooldown visual, prevenindo
    // reenvio abusivo conforme EXPERIENCE.md; nenhuma chamada real de API é
    // feita ainda.
    setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS)

    if (resendIntervalRef.current) {
      clearInterval(resendIntervalRef.current)
    }

    resendIntervalRef.current = setInterval(() => {
      setResendCooldownSeconds((current) => {
        if (current <= 1) {
          if (resendIntervalRef.current) {
            clearInterval(resendIntervalRef.current)
            resendIntervalRef.current = null
          }
          return 0
        }
        return current - 1
      })
    }, 1000)
  }

  function isEmailNotConfirmedError(error: unknown): boolean {
    return (
      error instanceof ApiError &&
      error.status === HTTP_STATUS_FORBIDDEN &&
      error.code === EMAIL_NOT_CONFIRMED_CODE
    )
  }

  function handleLoginError(error: unknown) {
    if (isEmailNotConfirmedError(error)) {
      setIsEmailNotConfirmed(true)
      return
    }

    if (error instanceof ApiError && error.status === HTTP_STATUS_UNAUTHORIZED) {
      setSubmitError(INVALID_CREDENTIALS_MESSAGE)
      return
    }

    setSubmitError(GENERIC_SUBMIT_ERROR_MESSAGE)
  }

  async function submitViaLoginApi(values: LoginFormValues) {
    try {
      const authenticatedSession = await loginUser(values)
      setSession(authenticatedSession)
      // AUTZ-01: redireciona à área correspondente ao papel retornado pelo
      // login (E2E-01 adotante → /cliente, E2E-02 admin → /admin) — mesmo
      // mapeamento usado pelo botão "Voltar para minha área" de
      // AccessDenied (T8), via `roleHomeRoute`.
      router.push(roleHomeRoute(authenticatedSession.role))
    } catch (error) {
      handleLoginError(error)
    }
  }

  async function submitViaCallback(values: LoginFormValues) {
    if (!onSubmit) {
      return
    }

    try {
      await onSubmit(values)
    } catch {
      setSubmitError(GENERIC_SUBMIT_ERROR_MESSAGE)
    }
  }

  async function handleValidSubmit(values: LoginFormValues) {
    setSubmitError(null)
    setIsEmailNotConfirmed(false)

    if (onSubmit) {
      await submitViaCallback(values)
      return
    }

    await submitViaLoginApi(values)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Acesse sua conta para ver os animais disponíveis para adoção.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessionMessage && (
          <div className="mb-4">
            <Alert aria-live="polite" data-testid="login-session-message-alert">
              <AlertDescription data-testid="login-session-message">
                {sessionMessage}
              </AlertDescription>
            </Alert>
          </div>
        )}
        {isEmailNotConfirmed && (
          <div className="mb-4">
            <Alert aria-live="polite" data-testid="login-email-not-confirmed-alert">
              <AlertDescription data-testid="login-email-not-confirmed-message">
                {EMAIL_NOT_CONFIRMED_MESSAGE}
              </AlertDescription>
              <Button
                type="button"
                className="mt-2 w-full"
                disabled={isResendDisabled}
                onClick={handleResendClick}
                data-testid="resend-confirmation-button"
              >
                {isResendDisabled
                  ? `Reenviar confirmação (${resendCooldownSeconds}s)`
                  : "Reenviar confirmação"}
              </Button>
            </Alert>
          </div>
        )}
        <form
          id="login-form"
          noValidate
          onSubmit={form.handleSubmit(handleValidSubmit)}
        >
          <FieldGroup>
            {submitError && (
              <div
                role="alert"
                aria-live="polite"
                data-testid="login-form-error"
                className="text-sm font-normal text-destructive"
              >
                {submitError}
              </div>
            )}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-form-email">E-mail</FieldLabel>
                  <Input
                    {...field}
                    id="login-form-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    aria-invalid={fieldState.invalid}
                    data-testid="login-email-input"
                  />
                  {fieldState.invalid && (
                    <FieldError
                      aria-live="polite"
                      errors={[fieldState.error]}
                      data-testid="login-email-error"
                    />
                  )}
                </Field>
              )}
            />
            <Controller
              name="senha"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-form-senha">Senha</FieldLabel>
                  <Input
                    {...field}
                    id="login-form-senha"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                    data-testid="login-senha-input"
                  />
                  {fieldState.invalid && (
                    <FieldError
                      aria-live="polite"
                      errors={[fieldState.error]}
                      data-testid="login-senha-error"
                    />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="login-form"
          className="w-full"
          disabled={isSubmitDisabled}
          data-testid="login-submit-button"
        >
          {isSubmitting && (
            <Loader2
              className="animate-spin"
              aria-hidden="true"
              data-testid="login-submit-spinner"
            />
          )}
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </CardFooter>
    </Card>
  )
}
