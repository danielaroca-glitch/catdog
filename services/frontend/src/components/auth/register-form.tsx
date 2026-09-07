"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"

import { ApiError, registerUser } from "@/lib/api/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const REGISTER_CONFIRMATION_PENDING_ROUTE = "/registro/confirmacao-pendente"

// REG-05: uma vez que o backend já respondeu 409, sabemos que a única causa
// possível é e-mail duplicado — por isso a mensagem aqui é específica, mesmo
// que a mensagem retornada pelo backend seja deliberadamente genérica (para
// não revelar o estado de confirmação da conta existente).
const DUPLICATE_EMAIL_MESSAGE =
  "Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha."
const GENERIC_SUBMIT_ERROR_MESSAGE =
  "Não foi possível concluir o cadastro. Tente novamente mais tarde."

const registerFormSchema = z
  .object({
    nome: z.string().min(1, "Informe seu nome."),
    email: z.email("Informe um e-mail válido."),
    senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmarSenha: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  })

export type RegisterFormValues = z.infer<typeof registerFormSchema>

export interface RegisterFormProps {
  /**
   * Callback opcional chamado com os dados validados no submit, no lugar da
   * integração padrão com a API de registro (`registerUser`, ver
   * `src/lib/api/auth.ts`). Usado principalmente em testes para observar o
   * submit sem depender de `fetch`. Quando omitido, o formulário chama
   * `POST /auth/register`, trata o 409 (REG-05) e redireciona para
   * `/registro/confirmacao-pendente` em caso de sucesso (REG-02).
   */
  readonly onSubmit?: (values: RegisterFormValues) => void | Promise<void>
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: "onBlur",
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      confirmarSenha: "",
    },
  })

  const isSubmitting = form.formState.isSubmitting

  async function handleValidSubmit(values: RegisterFormValues) {
    setSubmitError(null)

    if (onSubmit) {
      await onSubmit(values)
      return
    }

    try {
      await registerUser(values)
      // T10: o e-mail viaja como query string para a tela de confirmação
      // pendente exibir "Enviamos um e-mail de confirmação para {email}."
      // App Router não tem um mecanismo simples de state entre páginas sem
      // sessionStorage/contexto — query string é a opção mais simples e não
      // quebra a navegação existente (REG-03).
      router.push(
        `${REGISTER_CONFIRMATION_PENDING_ROUTE}?email=${encodeURIComponent(values.email)}`
      )
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setSubmitError(DUPLICATE_EMAIL_MESSAGE)
      } else {
        setSubmitError(GENERIC_SUBMIT_ERROR_MESSAGE)
      }
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Cadastre-se para ver os animais disponíveis para adoção.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="register-form"
          noValidate
          onSubmit={form.handleSubmit(handleValidSubmit)}
        >
          <FieldGroup>
            {submitError && (
              <div
                role="alert"
                aria-live="polite"
                data-testid="register-form-error"
                className="text-sm font-normal text-destructive"
              >
                {submitError}
              </div>
            )}
            <Controller
              name="nome"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-form-nome">Nome</FieldLabel>
                  <Input
                    {...field}
                    id="register-form-nome"
                    autoComplete="name"
                    autoFocus
                    aria-invalid={fieldState.invalid}
                    data-testid="register-nome-input"
                  />
                  {fieldState.invalid && (
                    <FieldError
                      aria-live="polite"
                      errors={[fieldState.error]}
                      data-testid="register-nome-error"
                    />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-form-email">
                    E-mail
                  </FieldLabel>
                  <Input
                    {...field}
                    id="register-form-email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                    data-testid="register-email-input"
                  />
                  {fieldState.invalid && (
                    <FieldError
                      aria-live="polite"
                      errors={[fieldState.error]}
                      data-testid="register-email-error"
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
                  <FieldLabel htmlFor="register-form-senha">Senha</FieldLabel>
                  <Input
                    {...field}
                    id="register-form-senha"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    data-testid="register-senha-input"
                  />
                  <FieldDescription>Mínimo de 8 caracteres.</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError
                      aria-live="polite"
                      errors={[fieldState.error]}
                      data-testid="register-senha-error"
                    />
                  )}
                </Field>
              )}
            />
            <Controller
              name="confirmarSenha"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-form-confirmar-senha">
                    Confirmar senha
                  </FieldLabel>
                  <Input
                    {...field}
                    id="register-form-confirmar-senha"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    data-testid="register-confirmar-senha-input"
                  />
                  {fieldState.invalid && (
                    <FieldError
                      aria-live="polite"
                      errors={[fieldState.error]}
                      data-testid="register-confirmar-senha-error"
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
          form="register-form"
          className="w-full"
          disabled={isSubmitting}
          data-testid="register-submit-button"
        >
          {isSubmitting && (
            <Loader2
              className="animate-spin"
              aria-hidden="true"
              data-testid="register-submit-spinner"
            />
          )}
          {isSubmitting ? "Registrando..." : "Registrar"}
        </Button>
      </CardFooter>
    </Card>
  )
}
