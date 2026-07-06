import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, CreditCard, Loader2, PackageCheck, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { SectionPageLayout } from '@/components/layout'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { submitPaymentForm } from '@/features/wallet/lib'
import { getQuotaPackagePlans, requestQuotaPackageAlipayOrder } from './api'
import type { QuotaPackagePaymentResponse, QuotaPackagePlan } from './types'

function formatCny(cents: number): string {
  return `¥${(Number(cents || 0) / 100).toFixed(2).replace(/\.00$/, '')}`
}

function formatUsdCredit(cents: number): string {
  return `$${(Number(cents || 0) / 100).toFixed(2).replace(/\.00$/, '')}`
}

function pickPaymentUrl(payload?: QuotaPackagePaymentResponse): string {
  if (!payload) return ''
  return payload.cashier_url || payload.payment_url || payload.url || ''
}

function submitPackagePayment(payload: QuotaPackagePaymentResponse) {
  const url = pickPaymentUrl(payload)
  if (!url) {
    toast.error('未获取到支付链接')
    return
  }
  submitPaymentForm(url, {
    ...payload,
    cashier_url: payload.cashier_url,
    payment_url: payload.payment_url,
    order_no: payload.order_no || payload.trade_no,
    trade_no: payload.trade_no || payload.order_no,
    pay_money: payload.pay_money || payload.money,
    money: payload.money || payload.pay_money,
    create_time: payload.create_time,
    expire_at: payload.expire_at,
  })
}

function PackagePlanCard({
  plan,
  purchasing,
  onPurchase,
}: {
  plan: QuotaPackagePlan
  purchasing: boolean
  onPurchase: (plan: QuotaPackagePlan) => void
}) {
  const features = Array.isArray(plan.features) ? plan.features : []
  return (
    <Card
      className={cn(
        'relative flex h-full flex-col overflow-hidden',
        plan.recommended && 'border-primary/60 shadow-md shadow-primary/10'
      )}
    >
      {plan.recommended ? (
        <div className='bg-primary text-primary-foreground absolute right-4 top-0 rounded-b-md px-3 py-1 text-xs font-medium'>
          推荐
        </div>
      ) : null}
      <CardHeader className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2 pr-14'>
          <CardTitle className='text-xl'>{plan.name}</CardTitle>
          {plan.badge ? <Badge variant='secondary'>{plan.badge}</Badge> : null}
        </div>
        {plan.subtitle ? (
          <CardDescription className='leading-relaxed'>{plan.subtitle}</CardDescription>
        ) : null}
        <div className='flex items-end gap-2 pt-1'>
          <span className='text-3xl font-semibold tracking-tight'>{formatCny(plan.price_cents)}</span>
          <span className='text-muted-foreground pb-1 text-sm'>/ 次购买</span>
        </div>
        <div className='bg-muted/60 flex items-center justify-between rounded-lg px-3 py-2'>
          <span className='text-muted-foreground text-sm'>到账 API 额度</span>
          <span className='text-lg font-semibold'>{formatUsdCredit(plan.usd_credit_cents)}</span>
        </div>
      </CardHeader>
      <CardContent className='flex-1 space-y-4'>
        {plan.description ? (
          <p className='text-muted-foreground text-sm leading-relaxed'>{plan.description}</p>
        ) : null}
        <div className='space-y-2'>
          {(features.length > 0
            ? features
            : ['额度实时到账', '平台内模型通用', '按模型实际倍率扣费']
          ).map((feature) => (
            <div key={feature} className='flex items-start gap-2 text-sm'>
              <Check className='mt-0.5 size-4 shrink-0 text-emerald-500' />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className='w-full' onClick={() => onPurchase(plan)} disabled={purchasing}>
          {purchasing ? <Loader2 className='mr-2 size-4 animate-spin' /> : <CreditCard className='mr-2 size-4' />}
          立即购买
        </Button>
      </CardFooter>
    </Card>
  )
}

export function QuotaPackages() {
  const [plans, setPlans] = useState<QuotaPackagePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | null>(null)

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getQuotaPackagePlans()
      if (res.success) {
        setPlans(res.data || [])
      }
    } catch {
      toast.error('套餐列表加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchPlans()
  }, [fetchPlans])

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0) || b.id - a.id),
    [plans]
  )

  const handlePurchase = async (plan: QuotaPackagePlan) => {
    setPurchasingPlanId(plan.id)
    try {
      const res = await requestQuotaPackageAlipayOrder(plan.id)
      if (!res.success || !res.data) {
        toast.error(res.message || '创建套餐订单失败')
        return
      }
      submitPackagePayment(res.data)
      toast.success('已打开支付页面，支付成功后额度将自动到账')
    } catch {
      toast.error('创建套餐订单失败')
    } finally {
      setPurchasingPlanId(null)
    }
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>套餐中心</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='mx-auto flex w-full max-w-7xl flex-col gap-5'>
          <Alert>
            <ShieldCheck className='h-4 w-4' />
            <AlertTitle>$ API 额度套餐</AlertTitle>
            <AlertDescription>
              购买后获得固定 API 计费额度，额度进入现有钱包余额，可用于平台支持的文本、图像、视频等模型。不同模型消耗不同，继续按照每个模型当前倍率 / 价格规则扣费。
            </AlertDescription>
          </Alert>

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className='h-[360px]'>
                    <CardHeader>
                      <Skeleton className='h-6 w-28' />
                      <Skeleton className='h-4 w-full' />
                      <Skeleton className='h-10 w-24' />
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <Skeleton className='h-10 w-full' />
                      <Skeleton className='h-4 w-full' />
                      <Skeleton className='h-4 w-4/5' />
                      <Skeleton className='h-4 w-3/5' />
                    </CardContent>
                  </Card>
                ))
              : sortedPlans.map((plan) => (
                  <PackagePlanCard
                    key={plan.id}
                    plan={plan}
                    purchasing={purchasingPlanId === plan.id}
                    onPurchase={handlePurchase}
                  />
                ))}
          </div>

          {!loading && sortedPlans.length === 0 ? (
            <Card data-card-hover='false'>
              <CardContent className='flex flex-col items-center gap-3 py-12 text-center'>
                <PackageCheck className='text-muted-foreground size-10' />
                <div className='text-lg font-medium'>暂无可购买套餐</div>
                <p className='text-muted-foreground max-w-md text-sm'>管理员可以在「套餐管理」中新增并上架套餐。</p>
              </CardContent>
            </Card>
          ) : null}

          <Card data-card-hover='false'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Sparkles className='size-4' />
                计费说明
              </CardTitle>
            </CardHeader>
            <CardContent className='text-muted-foreground grid gap-2 text-sm md:grid-cols-3'>
              <div>套餐只决定到账的 $ API 额度，不改变模型计费规则。</div>
              <div>Claude、GPT、Gemini、图像和视频模型继续按各自倍率扣费。</div>
              <div>额度到账后进入钱包余额，不可提现，不做自动续费。</div>
            </CardContent>
          </Card>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
