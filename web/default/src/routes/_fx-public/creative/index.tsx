import { createFileRoute } from '@tanstack/react-router'
import { CommerceStudioDashboardPage } from '@/features/creative/commerce-studio'

export const Route = createFileRoute('/_fx-public/creative/')({
  component: CommerceStudioDashboardPage,
})
