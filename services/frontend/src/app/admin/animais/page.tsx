import { AnimalsListView } from "@/components/animals/animals-list-view"
import { RequireRole } from "@/components/auth/require-role"

/**
 * Listagem de animais (pbi-002, EDICAO-10 — gap confirmado com o usuário).
 */
export default function AnimaisPage() {
  return (
    <RequireRole role="admin">
      <div className="flex flex-1 items-center justify-center p-6">
        <AnimalsListView />
      </div>
    </RequireRole>
  )
}
