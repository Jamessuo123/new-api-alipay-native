import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard/pricing/')({
  beforeLoad: () => {
    throw redirect({ to: '/pricing' })
  },
})
