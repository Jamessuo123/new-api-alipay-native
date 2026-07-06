import { createFileRoute } from '@tanstack/react-router'
import { FeiXiangInviteRewardsPage } from '@/features/feixiang-public/pages'

export const Route = createFileRoute('/invite-rewards/')({
  component: FeiXiangInviteRewardsPage,
})
