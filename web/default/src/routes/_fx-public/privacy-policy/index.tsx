import { createFileRoute } from '@tanstack/react-router'
import { FeiXiangPrivacyPolicyPage } from '../../../features/feixiang-public/pages'

export const Route = createFileRoute('/_fx-public/privacy-policy/')({
  component: FeiXiangPrivacyPolicyPage,
})
