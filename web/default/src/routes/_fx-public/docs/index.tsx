import { createFileRoute } from '@tanstack/react-router'
import { FeiXiangDocsPage } from '../../../features/feixiang-public/pages'

export const Route = createFileRoute('/_fx-public/docs/')({
  component: FeiXiangDocsPage,
})
