import { createFileRoute } from '@tanstack/react-router'
import { FeiXiangHomePage } from '../../features/feixiang-public/pages'

export const Route = createFileRoute('/_fx-public/')({
  component: FeiXiangHomePage,
})
