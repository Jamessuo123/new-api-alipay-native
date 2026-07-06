import { createFileRoute } from '@tanstack/react-router'
import { CommerceStudioPublishPage } from '@/features/creative/commerce-studio'

export const Route = createFileRoute('/_fx-public/creative/publish/')({
  component: CommerceStudioPublishPage,
})
