import { createFileRoute } from '@tanstack/react-router'

import { FeiXiangPublicApiStatusPage } from '@/features/feixiang-public/status-page'

export const Route = createFileRoute('/status')({
  component: FeiXiangPublicApiStatusPage,
})
