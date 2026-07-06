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

export interface QuotaPackageOrder {
  id: number
  trade_no: string
  user_id: number
  plan_id: number
  plan_snapshot_json?: string
  pay_amount_cents: number
  grant_usd_credit_cents: number
  grant_quota: number
  payment_method: string
  payment_provider: string
  status: string
  create_time: number
  complete_time?: number
  fulfilled_at?: number
}

export interface QuotaPackagePaymentResponse {
  url?: string
  cashier_url?: string
  payment_url?: string
  order_no?: string
  trade_no?: string
  payment_method?: string
  payment_provider?: string
  pay_money?: number
  money?: number
  price_cents?: number
  usd_credit_cents?: number
  grant_quota?: number
  create_time?: number
  expire_at?: number
}
