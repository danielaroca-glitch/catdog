import { EditAnimalView } from "@/components/animals/edit-animal-view"
import { RequireRole } from "@/components/auth/require-role"

export interface EditarAnimalPageProps {
  readonly params: Promise<{ id: string }>
}

/**
 * Edição de um animal específico (pbi-002, EDICAO-01/EDICAO-02).
 */
export default async function EditarAnimalPage({
  params,
}: EditarAnimalPageProps) {
  const { id } = await params

  return (
    <RequireRole role="admin">
      <div className="flex flex-1 items-center justify-center p-6">
        <EditAnimalView animalId={id} />
      </div>
    </RequireRole>
  )
}
