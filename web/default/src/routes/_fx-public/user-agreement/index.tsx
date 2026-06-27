import { createFileRoute } from '@tanstack/react-router'
import { FeiXiangUserAgreementPage } from '../../../features/feixiang-public/pages'

export const Route = createFileRoute('/_fx-public/user-agreement/')({
  component: FeiXiangUserAgreementPage,
})
