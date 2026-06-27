import { Outlet, createFileRoute } from '@tanstack/react-router'
import { FeiXiangPublicLayout } from '../features/feixiang-public/pages'

export const Route = createFileRoute('/_fx-public')({
  component: FeiXiangPublicLayoutRoute,
})

function FeiXiangPublicLayoutRoute() {
  return (
    <FeiXiangPublicLayout>
      <Outlet />
    </FeiXiangPublicLayout>
  )
}
