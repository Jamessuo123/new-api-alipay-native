import { createFileRoute, redirect } from '@tanstack/react-router'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'
import { PaymentOrders } from '@/features/payment-orders'
export const Route = createFileRoute('/_authenticated/admin/payment-orders/')({ beforeLoad: () => { const { auth } = useAuthStore.getState(); if (!auth.user || auth.user.role < ROLE.ADMIN) { throw redirect({ to: '/403' }) } }, component: PaymentOrders })
