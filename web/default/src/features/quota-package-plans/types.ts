export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export interface QuotaPackagePlan {
  id: number
  name: string
  subtitle?: string
  badge?: string
  description?: string
  features?: string[]
  price_cents: number
  usd_credit_cents: number
  grant_quota: number
  sort_order: number
  enabled: boolean
  recommended: boolean
  created_at?: number
  updated_at?: number
}

export interface QuotaPackagePlanPayload {
  name: string
  subtitle: string
  badge: string
  description: string
  features: string[]
  price_cents: number
  usd_credit_cents: number
  sort_order: number
  enabled: boolean
  recommended: boolean
}
