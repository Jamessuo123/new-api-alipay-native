import { api } from '@/lib/api'
import type { ApiResponse, QuotaPackagePlan, QuotaPackagePlanPayload } from './types'

export async function getAdminQuotaPackagePlans(): Promise<ApiResponse<QuotaPackagePlan[]>> {
  const res = await api.get('/api/quota_package/admin/plans')
  return res.data
}

export async function createQuotaPackagePlan(
  payload: QuotaPackagePlanPayload
): Promise<ApiResponse<QuotaPackagePlan>> {
  const res = await api.post('/api/quota_package/admin/plans', payload)
  return res.data
}

export async function updateQuotaPackagePlan(
  id: number,
  payload: QuotaPackagePlanPayload
): Promise<ApiResponse> {
  const res = await api.put(`/api/quota_package/admin/plans/${id}`, payload)
  return res.data
}

export async function patchQuotaPackagePlanStatus(
  id: number,
  enabled: boolean
): Promise<ApiResponse> {
  const res = await api.patch(`/api/quota_package/admin/plans/${id}`, { enabled })
  return res.data
}

export async function deleteQuotaPackagePlan(id: number): Promise<ApiResponse> {
  const res = await api.delete(`/api/quota_package/admin/plans/${id}`)
  return res.data
}
