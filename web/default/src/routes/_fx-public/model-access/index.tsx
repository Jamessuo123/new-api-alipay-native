import { createFileRoute } from '@tanstack/react-router'
import { FeiXiangModelPage } from '../../../features/feixiang-public/pages'

export const Route = createFileRoute('/_fx-public/model-access/')({
  component: FeiXiangModelPage,
})
