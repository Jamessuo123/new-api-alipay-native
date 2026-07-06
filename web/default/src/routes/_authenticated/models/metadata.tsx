import { createFileRoute } from '@tanstack/react-router'
import { ModelsMetadataOverviewSafePage } from '@/features/models/metadata-overview-safe-page'

export const Route = createFileRoute('/_authenticated/models/metadata')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ModelsMetadataOverviewSafePage />
}
