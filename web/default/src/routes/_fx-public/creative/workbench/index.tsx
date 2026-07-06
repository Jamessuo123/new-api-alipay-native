import { createFileRoute } from '@tanstack/react-router'
import { CommerceStudioWorkbenchPage } from '@/features/creative/commerce-studio'

export const Route = createFileRoute('/_fx-public/creative/workbench/')({
  component: CommerceStudioWorkbenchPage,
})
