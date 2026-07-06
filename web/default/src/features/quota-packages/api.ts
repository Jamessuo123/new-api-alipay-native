import { api } from '@/lib/api'
import type {
  ApiResponse,
  QuotaPackageOrder,
  QuotaPackagePaymentResponse,
  QuotaPackagePlan,
} from './types'

export async function getQuotaPackagePlans(): Promise<
  ApiResponse<QuotaPackagePlan[]>
> {
  const res = await api.get('/api/quota_package/plans')
  return res.data
}

export async function requestQuotaPackageAlipayOrder(
  planId: number
): Promise<ApiResponse<QuotaPackagePaymentResponse>> {
  const res = await api.post(
    '/api/quota_package/orders/alipay_pc',
    {
      plan_id: planId,
      payment_method: 'alipay_pc',
    },
    {
      skipBusinessError: true,
    } as Record<string, unknown>
  )
  return res.data
}

export async function getSelfQuotaPackageOrders(): Promise<
  ApiResponse<QuotaPackageOrder[]>
> {
  const res = await api.get('/api/quota_package/orders/self')
  return res.data
}
