import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_fx-public/creative/history/')({
  beforeLoad: () => {
    throw redirect({ to: '/creative/assets' })
  },
  component: () => null,
})
