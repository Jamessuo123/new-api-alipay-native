import { createFileRoute } from '@tanstack/react-router'
import { CommerceStudioSettingsPage } from '@/features/creative/commerce-studio'

export const Route = createFileRoute('/_fx-public/creative/settings/')({
  component: CommerceStudioSettingsPage,
})
