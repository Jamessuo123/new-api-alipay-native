import { createFileRoute } from '@tanstack/react-router'
import { CommerceStudioProjectsPage } from '@/features/creative/commerce-studio'

export const Route = createFileRoute('/_fx-public/creative/projects/')({
  component: CommerceStudioProjectsPage,
})
