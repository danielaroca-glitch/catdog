"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

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
   * Chamado com os dados validados no submit. A integração real com a API de
   * registro (POST /auth/register) é feita em uma task separada (T9) — aqui
   * o formulário apenas garante que só dados válidos chegam a este callback.
   */
  onSubmit?: (values: RegisterFormValues) => void | Promise<void>
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
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
    await onSubmit?.(values)
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
          {isSubmitting ? "Registrando..." : "Registrar"}
        </Button>
      </CardFooter>
    </Card>
  )
}
