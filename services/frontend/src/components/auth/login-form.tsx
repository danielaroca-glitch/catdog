"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import * as z from "zod"

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

const GENERIC_SUBMIT_ERROR_MESSAGE =
  "Não foi possível entrar. Tente novamente mais tarde."

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
   * Callback chamado com os dados validados no submit. A integração com
   * `POST /auth/login` (sucesso, e-mail não confirmado, credenciais
   * inválidas) é responsabilidade da T8 (`lib/api/auth.ts` + wiring aqui);
   * esta task cobre apenas o formulário e seus estados de envio/erro
   * genérico, testáveis sem depender de `fetch` (mesmo padrão de
   * `RegisterForm`).
   */
  readonly onSubmit?: (values: LoginFormValues) => void | Promise<void>
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
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

  async function handleValidSubmit(values: LoginFormValues) {
    setSubmitError(null)

    if (!onSubmit) {
      return
    }

    try {
      await onSubmit(values)
    } catch {
      setSubmitError(GENERIC_SUBMIT_ERROR_MESSAGE)
    }
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
