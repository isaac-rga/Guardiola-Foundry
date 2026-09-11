import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { useBillOfMaterials } from './api/bills-of-materials'
import { BomBuilderPage } from './create-bom-template-page'

export function DeriveTemplateBuilder({
  originId,
  onExit,
}: {
  originId: string
  onExit: () => void
}) {
  const { session } = useAppShell()
  const origin = useBillOfMaterials(session.token, originId)

  if (origin.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading origin...</p>
  }
  if (origin.error || !origin.data) {
    return <p role="alert">{origin.error?.message ?? 'Unable to load the BOM origin.'}</p>
  }

  return (
    <BomBuilderPage
      context={{ kind: 'template', sourceBillOfMaterials: origin.data }}
      onCancel={onExit}
      onSaved={onExit}
    />
  )
}
