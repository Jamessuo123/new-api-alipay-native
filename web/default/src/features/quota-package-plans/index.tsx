import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Edit, Loader2, PackagePlus, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SectionPageLayout } from '@/components/layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  createQuotaPackagePlan,
  deleteQuotaPackagePlan,
  getAdminQuotaPackagePlans,
  patchQuotaPackagePlanStatus,
  updateQuotaPackagePlan,
} from './api'
import type { QuotaPackagePlan, QuotaPackagePlanPayload } from './types'

type PlanFormState = {
  name: string
  subtitle: string
  badge: string
  description: string
  featuresText: string
  priceYuan: string
  usdCredit: string
  sortOrder: string
  enabled: boolean
  recommended: boolean
}

const DEFAULT_FORM: PlanFormState = {
  name: '',
  subtitle: '',
  badge: '',
  description: '',
  featuresText: '额度实时到账\n平台内模型通用\n按模型实际倍率扣费',
  priceYuan: '',
  usdCredit: '',
  sortOrder: '0',
  enabled: true,
  recommended: false,
}

function centsToMoney(cents: number): string {
  return (Number(cents || 0) / 100).toFixed(2).replace(/\.00$/, '')
}

function formatCny(cents: number): string {
  return `¥${centsToMoney(cents)}`
}

function formatUsd(cents: number): string {
  return `$${centsToMoney(cents)}`
}

function moneyToCents(value: string): number {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return 0
  return Math.round(num * 100)
}

function planToForm(plan?: QuotaPackagePlan): PlanFormState {
  if (!plan) return DEFAULT_FORM
  return {
    name: plan.name || '',
    subtitle: plan.subtitle || '',
    badge: plan.badge || '',
    description: plan.description || '',
    featuresText: Array.isArray(plan.features) ? plan.features.join('\n') : '',
    priceYuan: centsToMoney(plan.price_cents),
    usdCredit: centsToMoney(plan.usd_credit_cents),
    sortOrder: String(plan.sort_order || 0),
    enabled: plan.enabled,
    recommended: plan.recommended,
  }
}

function formToPayload(form: PlanFormState): QuotaPackagePlanPayload {
  return {
    name: form.name.trim(),
    subtitle: form.subtitle.trim(),
    badge: form.badge.trim(),
    description: form.description.trim(),
    features: form.featuresText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    price_cents: moneyToCents(form.priceYuan),
    usd_credit_cents: moneyToCents(form.usdCredit),
    sort_order: Number.parseInt(form.sortOrder || '0', 10) || 0,
    enabled: form.enabled,
    recommended: form.recommended,
  }
}

function PlanDialog({
  open,
  plan,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  plan?: QuotaPackagePlan
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<PlanFormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(plan?.id)

  useEffect(() => {
    if (open) {
      setForm(planToForm(plan))
    }
  }, [open, plan])

  const setField = <K extends keyof PlanFormState>(key: K, value: PlanFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    const payload = formToPayload(form)
    if (!payload.name) {
      toast.error('套餐名称不能为空')
      return
    }
    if (payload.price_cents <= 0) {
      toast.error('人民币售价必须大于 0')
      return
    }
    if (payload.usd_credit_cents <= 0) {
      toast.error('到账 $ API 额度必须大于 0')
      return
    }

    setSaving(true)
    try {
      const res = isEdit && plan?.id
        ? await updateQuotaPackagePlan(plan.id, payload)
        : await createQuotaPackagePlan(payload)
      if (res.success) {
        toast.success(isEdit ? '套餐已更新' : '套餐已创建')
        onOpenChange(false)
        onSaved()
      } else {
        toast.error(res.message || '保存失败')
      }
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[88vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑套餐' : '新增套餐'}</DialogTitle>
          <DialogDescription>
            前端用户只提交套餐 ID，售价和到账 $ API 额度以这里的后台配置为准。
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-2'>
          <div className='grid gap-2'>
            <Label>套餐名称</Label>
            <Input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder='标准月卡' />
          </div>
          <div className='grid gap-2 md:grid-cols-2'>
            <div className='grid gap-2'>
              <Label>副标题</Label>
              <Input value={form.subtitle} onChange={(e) => setField('subtitle', e.target.value)} placeholder='适合日常开发调用' />
            </div>
            <div className='grid gap-2'>
              <Label>推荐标签</Label>
              <Input value={form.badge} onChange={(e) => setField('badge', e.target.value)} placeholder='最受欢迎' />
            </div>
          </div>
          <div className='grid gap-2 md:grid-cols-3'>
            <div className='grid gap-2'>
              <Label>人民币售价</Label>
              <Input value={form.priceYuan} onChange={(e) => setField('priceYuan', e.target.value)} placeholder='99' inputMode='decimal' />
            </div>
            <div className='grid gap-2'>
              <Label>到账 $ API 额度</Label>
              <Input value={form.usdCredit} onChange={(e) => setField('usdCredit', e.target.value)} placeholder='18' inputMode='decimal' />
            </div>
            <div className='grid gap-2'>
              <Label>排序</Label>
              <Input value={form.sortOrder} onChange={(e) => setField('sortOrder', e.target.value)} placeholder='20' inputMode='numeric' />
            </div>
          </div>
          <div className='grid gap-2'>
            <Label>套餐描述</Label>
            <Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder='购买后获得固定 API 额度，可用于平台支持的全部模型。' rows={3} />
          </div>
          <div className='grid gap-2'>
            <Label>套餐卖点，每行一条</Label>
            <Textarea value={form.featuresText} onChange={(e) => setField('featuresText', e.target.value)} rows={5} />
          </div>
          <div className='grid gap-3 rounded-lg border p-3 md:grid-cols-2'>
            <label className='flex items-center justify-between gap-3'>
              <span>
                <span className='block text-sm font-medium'>上架展示</span>
                <span className='text-muted-foreground text-xs'>关闭后用户侧不可购买</span>
              </span>
              <Switch checked={form.enabled} onCheckedChange={(checked) => setField('enabled', checked)} />
            </label>
            <label className='flex items-center justify-between gap-3'>
              <span>
                <span className='block text-sm font-medium'>设为推荐</span>
                <span className='text-muted-foreground text-xs'>用户侧卡片展示推荐样式</span>
              </span>
              <Switch checked={form.recommended} onCheckedChange={(checked) => setField('recommended', checked)} />
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={saving}>取消</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Check className='mr-2 size-4' />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function QuotaPackagePlans() {
  const [plans, setPlans] = useState<QuotaPackagePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<QuotaPackagePlan | undefined>()
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getAdminQuotaPackagePlans()
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

  const handleCreate = () => {
    setEditingPlan(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (plan: QuotaPackagePlan) => {
    setEditingPlan(plan)
    setDialogOpen(true)
  }

  const handleToggleStatus = async (plan: QuotaPackagePlan) => {
    setUpdatingId(plan.id)
    try {
      const res = await patchQuotaPackagePlanStatus(plan.id, !plan.enabled)
      if (res.success) {
        toast.success(plan.enabled ? '套餐已下架' : '套餐已上架')
        await fetchPlans()
      } else {
        toast.error(res.message || '操作失败')
      }
    } catch {
      toast.error('操作失败')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (plan: QuotaPackagePlan) => {
    if (!window.confirm(`确定删除套餐「${plan.name}」吗？历史订单会保留。`)) return
    setUpdatingId(plan.id)
    try {
      const res = await deleteQuotaPackagePlan(plan.id)
      if (res.success) {
        toast.success('套餐已删除')
        await fetchPlans()
      } else {
        toast.error(res.message || '删除失败')
      }
    } catch {
      toast.error('删除失败')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <>
      <SectionPageLayout fixedContent>
        <SectionPageLayout.Title>套餐管理</SectionPageLayout.Title>
        <SectionPageLayout.Actions>
          <div className='flex items-center gap-2'>
            <Button variant='outline' onClick={() => void fetchPlans()} disabled={loading}>
              <RefreshCw className='mr-2 size-4' />
              刷新
            </Button>
            <Button onClick={handleCreate}>
              <Plus className='mr-2 size-4' />
              新增套餐
            </Button>
          </div>
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <div className='flex h-full min-h-0 flex-col gap-4'>
            <Alert>
              <PackagePlus className='h-4 w-4' />
              <AlertDescription>
                套餐只配置「人民币售价 + 到账 $ API 额度 + 展示文案」。模型实际消耗仍使用现有模型倍率 / 价格规则，不在这里配置。
              </AlertDescription>
            </Alert>

            <Card className='min-h-0 flex-1 overflow-hidden' data-card-hover='false'>
              <CardHeader className='border-b pb-3'>
                <CardTitle className='text-base'>套餐列表</CardTitle>
              </CardHeader>
              <CardContent className='overflow-auto p-0'>
                {loading ? (
                  <div className='space-y-3 p-4'>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} className='h-14 w-full' />
                    ))}
                  </div>
                ) : (
                  <table className='w-full min-w-[900px] text-sm'>
                    <thead className='bg-muted/50 text-muted-foreground'>
                      <tr className='border-b text-left'>
                        <th className='px-4 py-3 font-medium'>套餐</th>
                        <th className='px-4 py-3 font-medium'>售价</th>
                        <th className='px-4 py-3 font-medium'>到账额度</th>
                        <th className='px-4 py-3 font-medium'>状态</th>
                        <th className='px-4 py-3 font-medium'>推荐</th>
                        <th className='px-4 py-3 font-medium'>排序</th>
                        <th className='px-4 py-3 text-right font-medium'>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPlans.map((plan) => (
                        <tr key={plan.id} className='hover:bg-muted/35 border-b transition-colors'>
                          <td className='px-4 py-3'>
                            <div className='font-medium'>{plan.name}</div>
                            <div className='text-muted-foreground mt-1 line-clamp-1 text-xs'>{plan.subtitle || plan.description || '-'}</div>
                            {plan.badge ? <Badge variant='outline' className='mt-2'>{plan.badge}</Badge> : null}
                          </td>
                          <td className='px-4 py-3 font-medium'>{formatCny(plan.price_cents)}</td>
                          <td className='px-4 py-3'>{formatUsd(plan.usd_credit_cents)} API 额度</td>
                          <td className='px-4 py-3'>
                            <Badge variant={plan.enabled ? 'default' : 'secondary'}>{plan.enabled ? '已上架' : '已下架'}</Badge>
                          </td>
                          <td className='px-4 py-3'>
                            {plan.recommended ? <Badge>推荐</Badge> : <span className='text-muted-foreground'>-</span>}
                          </td>
                          <td className='px-4 py-3'>{plan.sort_order}</td>
                          <td className='px-4 py-3'>
                            <div className='flex justify-end gap-2'>
                              <Button variant='outline' size='sm' onClick={() => handleEdit(plan)}>
                                <Edit className='mr-1 size-3.5' />
                                编辑
                              </Button>
                              <Button variant='outline' size='sm' disabled={updatingId === plan.id} onClick={() => void handleToggleStatus(plan)}>
                                {plan.enabled ? '下架' : '上架'}
                              </Button>
                              <Button variant='destructive' size='sm' disabled={updatingId === plan.id} onClick={() => void handleDelete(plan)}>
                                <Trash2 className='mr-1 size-3.5' />
                                删除
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {sortedPlans.length === 0 ? (
                        <tr>
                          <td colSpan={7} className='text-muted-foreground px-4 py-12 text-center'>暂无套餐，点击右上角新增套餐。</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <PlanDialog
        open={dialogOpen}
        plan={editingPlan}
        onOpenChange={setDialogOpen}
        onSaved={() => void fetchPlans()}
      />
    </>
  )
}
