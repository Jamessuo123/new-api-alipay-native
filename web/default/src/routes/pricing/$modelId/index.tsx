import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/pricing/$modelId/')({
  beforeLoad: () => {
    throw redirect({ to: '/model-access' })
  },
})
