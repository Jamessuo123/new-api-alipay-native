import { createFileRoute } from '@tanstack/react-router'
import { QuotaPackages } from '@/features/quota-packages'

export const Route = createFileRoute('/_authenticated/quota-packages/')({
  component: QuotaPackages,
})
