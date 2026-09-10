import { RequireRole } from "@/components/auth/require-role"

/**
 * Placeholder da área do cliente (pbi-003, AUTZ-01/AUTZ-02).
 *
 * spec.md ("Out of Scope"): o conteúdo real (lista pública, solicitações de
 * adoção) pertence a módulos futuros — esta PBI cobre só o mecanismo de
 * entrada (redirecionamento pós-login, T9) e o bloqueio (`RequireRole`,
 * T8). Página fina, mesmo padrão de `app/login/page.tsx`.
 */
export default function ClientePage() {
  return (
    <RequireRole role="adotante">
      <div className="flex flex-1 items-center justify-center p-6">
        <p
          className="text-muted-foreground"
          data-testid="cliente-page-placeholder"
        >
          Área do cliente
        </p>
      </div>
    </RequireRole>
  )
}
