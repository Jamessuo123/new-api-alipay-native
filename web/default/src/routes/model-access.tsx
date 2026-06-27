
import { createFileRoute } from '@tanstack/react-router'
import { FeiXiangModelPage } from '../features/feixiang-public/pages'

export const Route = createFileRoute('/model-access')({
  component: FeiXiangModelPage,
})
