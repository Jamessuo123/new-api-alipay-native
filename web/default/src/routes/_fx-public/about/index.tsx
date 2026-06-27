import { createFileRoute } from '@tanstack/react-router'
import { FeiXiangAboutPage } from '../../../features/feixiang-public/pages'

export const Route = createFileRoute('/_fx-public/about/')({
  component: FeiXiangAboutPage,
})
