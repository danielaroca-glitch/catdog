import { AnimalForm } from "@/components/animals/animal-form"
import { RequireRole } from "@/components/auth/require-role"

/**
 * Página de cadastro de animal (pbi-001-alta-de-animal, ALTA-01).
 *
 * Protegida por `RequireRole role="admin"` (já existente, módulo de
 * Autenticação) — mesmo padrão de `app/admin/page.tsx`.
 */
export default function NovoAnimalPage() {
  return (
    <RequireRole role="admin">
      <div className="flex flex-1 items-center justify-center p-6">
        <AnimalForm />
      </div>
    </RequireRole>
  )
}
