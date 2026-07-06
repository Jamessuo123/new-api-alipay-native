import { createFileRoute } from '@tanstack/react-router'
import { CommerceStudioInsightPage } from '@/features/creative/commerce-studio'

export const Route = createFileRoute('/_fx-public/creative/insight/')({
  component: CommerceStudioInsightPage,
})
