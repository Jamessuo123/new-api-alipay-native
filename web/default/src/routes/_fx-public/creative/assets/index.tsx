import { createFileRoute } from '@tanstack/react-router'
import { CommerceStudioAssetsPage } from '@/features/creative/commerce-studio'

export const Route = createFileRoute('/_fx-public/creative/assets/')({
  component: CommerceStudioAssetsPage,
})
