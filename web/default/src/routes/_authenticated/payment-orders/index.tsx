import { createFileRoute } from '@tanstack/react-router'
import { PaymentOrders } from '@/features/payment-orders'
export const Route = createFileRoute('/_authenticated/payment-orders/')({ component: PaymentOrders })
