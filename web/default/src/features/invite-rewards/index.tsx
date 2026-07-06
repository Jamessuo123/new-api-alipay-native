/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { type ReactNode, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  BarChart3,
  Gift,
  Link2,
  Loader2,
  RefreshCw,
  Share2,
  ShieldCheck,
  TrendingUp,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { formatQuota, formatTimestamp } from '@/lib/format'
import { CopyButton } from '@/components/copy-button'
import { SectionPageLayout } from '@/components/layout'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TransferDialog } from '@/features/wallet/components/dialogs/transfer-dialog'
import { QUOTA_PER_DOLLAR } from '@/features/wallet/constants'
import {
  getAffiliateCode,
  getInviteConsumptionOverview,
  getInviteRewardConfig,
  getSelfInviteDetail,
  getSelfInviteRewardsUser,
  transferAffiliateQuota,
} from './api'
import type {
  InviteConsumptionOverview,
  InviteDetail,
  InviteRewardConfig,
  InviteRewardsUser,
} from './types'


const INVITE_QUERY_KEYS = [
  ['invite-rewards', 'self'],
  ['invite-rewards', 'aff-code'],
  ['invite-rewards', 'detail'],
  ['invite-rewards', 'config'],
] as const

type IdentityUser = {
  id?: number
  user_id?: number
  username?: string
  email?: string
}

function buildInviteLink(affCode: string): string {
  const code = affCode.trim()
  if (!code || typeof window === 'undefined') return ''
  return `${window.location.origin}/register?aff=${encodeURIComponent(code)}`
}

function maskRawText(value: string): string {
  const text = value.trim()
  if (!text) return '-'
  if (text.length <= 2) return `${text[0] || '*'}*`
  return `${text.slice(0, 2)}***${text.slice(-1)}`
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  if (!name || !domain) return maskRawText(email)
  const head = name.slice(0, 2)
  return `${head}${name.length > 2 ? '***' : '*'}@${domain}`
}

function maskText(value: string): string {
  const text = value.trim()
  if (!text) return '-'
  if (text.includes('@')) return maskEmail(text)
  return maskRawText(text)
}

function userDisplayName(user?: IdentityUser | null): string {
  if (!user) return '-'
  const id = user.id ?? user.user_id
  const rawName = user.username || user.email || ''
  const maskedName = rawName ? maskText(rawName) : ''
  if (!maskedName) return id ? `用户 #${id}` : '-'
  return id ? `${maskedName} (#${id})` : maskedName
}

function rewardStatusText(status?: string) {
  switch (status) {
    case 'issued':
    case 'issued_legacy':
      return '已发放'
    case 'pending':
      return '待发放'
    case 'failed':
      return '发放失败'
    case 'blocked':
      return '风控拦截'
    case 'reversed':
      return '已撤销'
    default:
      return status || '未知'
  }
}

function relationStatusText(status?: string) {
  switch (status) {
    case 'active':
      return '有效邀请'
    case 'self':
      return '当前用户'
    case 'abnormal':
      return '异常记录'
    default:
      return status || '有效邀请'
  }
}

function rewardRoleText(role?: string) {
  switch (role) {
    case 'inviter':
      return '邀请人奖励'
    case 'invitee':
      return '受邀人奖励'
    case 'new_user':
      return '新用户奖励'
    default:
      return role || '奖励'
  }
}

function formatRuleAmount(display?: string, fallbackQuota?: number): string {
  const text = display?.trim()
  if (text) return text
  if (typeof fallbackQuota === 'number' && Number.isFinite(fallbackQuota)) {
    return formatQuota(fallbackQuota)
  }
  return '-'
}

function StatCard({
  icon,
  title,
  value,
  desc,
}: {
  icon: ReactNode
  title: string
  value: string
  desc?: string
}) {
  return (
    <Card data-card-hover='false' className='min-w-0 py-0'>
      <CardContent className='p-4'>
        <div className='text-muted-foreground flex items-center gap-2 text-xs'>
          {icon}
          <span className='truncate'>{title}</span>
        </div>
        <div className='mt-2 truncate text-2xl font-semibold tabular-nums'>
          {value}
        </div>
        {desc ? (
          <div className='text-muted-foreground mt-1 truncate text-xs'>
            {desc}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function RuleCard({
  title,
  value,
  desc,
}: {
  title: string
  value: string
  desc: string
}) {
  return (
    <div className='min-w-0 rounded-xl border bg-card/40 p-4'>
      <div className='text-muted-foreground truncate text-xs'>{title}</div>
      <div className='mt-2 truncate text-lg font-semibold'>{value}</div>
      <p className='text-muted-foreground mt-1 text-xs leading-5'>{desc}</p>
    </div>
  )
}

function RewardRules({
  detail,
  publicConfig,
}: {
  detail?: InviteDetail | null
  publicConfig?: InviteRewardConfig
}) {
  const summary = detail?.summary
  return (
    <div className='grid gap-3 md:grid-cols-3'>
      <RuleCard
        title='新用户奖励'
        value={formatRuleAmount(publicConfig?.new_user_quota_display)}
        desc='新用户注册成功后可获得的基础额度奖励。'
      />
      <RuleCard
        title='邀请人奖励'
        value={formatRuleAmount(publicConfig?.inviter_reward_display)}
        desc='每个有效邀请给邀请人的奖励，按系统配置展示。'
      />
      <RuleCard
        title='受邀人奖励'
        value={formatRuleAmount(publicConfig?.invitee_reward_display)}
        desc={`累计已获得 ${formatQuota(summary?.invitee_reward_total || 0)}。`}
      />
    </div>
  )
}


type ConsumptionRange = 'today' | '7d' | '30d' | 'all'

const CONSUMPTION_RANGE_OPTIONS: Array<{
  value: ConsumptionRange
  label: string
}> = [
  { value: 'today', label: '今天' },
  { value: '7d', label: '最近 7 天' },
  { value: '30d', label: '最近 30 天' },
  { value: 'all', label: '全部' },
]

function formatPlainNumber(value?: number): string {
  return new Intl.NumberFormat('zh-CN').format(value || 0)
}

function usageStatusText(status?: string): string {
  switch (status) {
    case 'active':
      return '活跃'
    case 'inactive':
      return '低活跃'
    case 'silent':
      return '沉默'
    case 'unused':
      return '未使用'
    default:
      return status || '未知'
  }
}

function userAccountStatusText(status?: number): string {
  switch (status) {
    case 1:
      return '正常'
    case 2:
      return '禁用'
    default:
      return typeof status === 'number' ? `状态 ${status}` : '未知'
  }
}

function ConsumptionOverviewTab({
  data,
  loading,
  loadFailed,
  affiliateLink,
  range,
  onRangeChange,
}: {
  data?: InviteConsumptionOverview | null
  loading: boolean
  loadFailed: boolean
  affiliateLink: string
  range: ConsumptionRange
  onRangeChange: (value: ConsumptionRange) => void
}) {
  const summary = data?.summary
  const items = data?.items || []

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h3 className='text-base font-semibold'>受邀用户 API 消耗</h3>
          <p className='text-muted-foreground mt-1 text-sm'>
            只统计你邀请来的用户产生的 API 消耗，不展示请求内容、API Key、IP 或完整隐私信息。
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          {CONSUMPTION_RANGE_OPTIONS.map((item) => (
            <Button
              key={item.value}
              variant={range === item.value ? 'default' : 'outline'}
              size='sm'
              onClick={() => onRangeChange(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {loadFailed ? (
        <Alert variant='destructive'>
          <ShieldCheck className='size-4' />
          <AlertTitle>API 消耗数据加载失败</AlertTitle>
          <AlertDescription>
            请刷新页面重试；如果仍然失败，请检查 /api/user/invite-consumption 接口。
          </AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <LoadingGrid />
      ) : (
        <div className='grid gap-3 md:grid-cols-4'>
          <StatCard
            icon={<UsersRound className='size-4' />}
            title='受邀用户数'
            value={`${summary?.invitee_count || 0} 人`}
            desc='当前账号邀请来的用户'
          />
          <StatCard
            icon={<Activity className='size-4' />}
            title='活跃受邀用户'
            value={`${summary?.active_invitee_count || 0} 人`}
            desc='筛选范围内有调用'
          />
          <StatCard
            icon={<BarChart3 className='size-4' />}
            title='总 API 请求'
            value={`${formatPlainNumber(summary?.total_requests)} 次`}
            desc={`${formatPlainNumber(summary?.total_tokens)} tokens`}
          />
          <StatCard
            icon={<WalletCards className='size-4' />}
            title='总消耗额度'
            value={summary?.total_amount_display || formatQuota(0)}
            desc={
              summary?.last_used_at
                ? `最近调用 ${formatTimestamp(summary.last_used_at)}`
                : '暂无调用'
            }
          />
        </div>
      )}

      <Card data-card-hover='false' className='overflow-hidden py-0'>
        <CardHeader className='border-b p-4 sm:p-5'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <BarChart3 className='size-4' />
            受邀用户消耗明细
          </CardTitle>
          <CardDescription>
            按消耗额度排序，只展示聚合数据；具体请求内容和密钥信息不会暴露。
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table className='min-w-[920px]'>
              <TableHeader>
                <TableRow>
                  <TableHead>受邀用户</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead>API 请求</TableHead>
                  <TableHead>Token 用量</TableHead>
                  <TableHead>消耗额度</TableHead>
                  <TableHead>最近调用</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.user_id}>
                    <TableCell>
                      <div className='font-medium'>{userDisplayName(item)}</div>
                      <div className='text-muted-foreground text-xs'>
                        ID: {item.user_id} · {userAccountStatusText(item.status)}
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {item.created_at ? formatTimestamp(item.created_at) : '-'}
                    </TableCell>
                    <TableCell className='font-medium'>
                      {formatPlainNumber(item.request_count)} 次
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      <div>{formatPlainNumber(item.total_tokens)} tokens</div>
                      <div className='text-xs'>
                        输入 {formatPlainNumber(item.prompt_tokens)} / 输出{' '}
                        {formatPlainNumber(item.completion_tokens)}
                      </div>
                    </TableCell>
                    <TableCell className='font-medium'>
                      {item.used_amount_display || formatQuota(0)}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {item.last_used_at ? formatTimestamp(item.last_used_at) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.usage_status === 'active' ? 'secondary' : 'outline'}>
                        {usageStatusText(item.usage_status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState
                        title='暂无 API 消耗数据'
                        description='受邀用户完成 API 调用后，请求次数、Token 用量和消耗额度会显示在这里。'
                      >
                        {affiliateLink ? (
                          <CopyButton
                            value={affiliateLink}
                            variant='outline'
                            size='sm'
                            className='bg-background/60 hover:bg-muted h-8 rounded-full px-3 text-xs font-medium shadow-none'
                            iconClassName='size-3.5'
                            tooltip='复制邀请链接'
                            successTooltip='已复制邀请链接'
                          >
                            复制邀请链接
                          </CopyButton>
                        ) : null}
                      </EmptyState>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className='grid gap-3 md:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} data-card-hover='false' className='py-0'>
          <CardContent className='p-4'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='mt-3 h-7 w-28' />
            <Skeleton className='mt-2 h-3 w-36' />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className='flex flex-col items-center justify-center gap-2 px-3 py-8 text-center sm:py-9'>
      <div className='bg-muted/70 flex size-9 items-center justify-center rounded-full'>
        <Gift className='text-muted-foreground size-4' />
      </div>
      <div className='text-sm font-medium'>{title}</div>
      <p className='text-muted-foreground max-w-md text-sm leading-6'>
        {description}
      </p>
      {children ? <div className='mt-1 flex justify-center'>{children}</div> : null}
    </div>
  )
}

export function InviteRewards() {
  const queryClient = useQueryClient()
  const [transferOpen, setTransferOpen] = useState(false)
  const [consumptionRange, setConsumptionRange] =
    useState<ConsumptionRange>('30d')

  const selfQuery = useQuery({
    queryKey: ['invite-rewards', 'self'],
    queryFn: getSelfInviteRewardsUser,
  })
  const affCodeQuery = useQuery({
    queryKey: ['invite-rewards', 'aff-code'],
    queryFn: getAffiliateCode,
  })
  const detailQuery = useQuery({
    queryKey: ['invite-rewards', 'detail'],
    queryFn: getSelfInviteDetail,
  })
  const configQuery = useQuery({
    queryKey: ['invite-rewards', 'config'],
    queryFn: getInviteRewardConfig,
  })
  const consumptionQuery = useQuery({
    queryKey: ['invite-rewards', 'consumption', consumptionRange],
    queryFn: () => getInviteConsumptionOverview(consumptionRange),
  })

  const transferMutation = useMutation({
    mutationFn: transferAffiliateQuota,
    onSuccess: async (res) => {
      if (res.success) {
        toast.success(res.message || '返利已转入余额')
        await Promise.all([
          ...INVITE_QUERY_KEYS.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey })
          ),
          queryClient.invalidateQueries({
            queryKey: ['invite-rewards', 'consumption'],
          }),
        ])
        return
      }
      toast.error(res.message || '返利转入失败')
    },
    onError: () => {
      toast.error('返利转入失败，请稍后重试')
    },
  })

  const user = selfQuery.data?.success ? selfQuery.data.data : undefined
  const detail = detailQuery.data?.success ? detailQuery.data.data : undefined
  const publicConfig = configQuery.data?.success
    ? configQuery.data.data
    : undefined
  const consumption = consumptionQuery.data?.success
    ? consumptionQuery.data.data
    : undefined
  const affCode = (affCodeQuery.data?.data || user?.aff_code || '').trim()
  const affiliateLink = useMemo(() => buildInviteLink(affCode), [affCode])
  const invitees = detail?.invitees || []
  const rewardLogs = detail?.reward_logs || []
  const summary = detail?.summary
  const availableRewards = user?.aff_quota ?? 0
  const canTransferRewards = availableRewards >= QUOTA_PER_DOLLAR
  const loading = selfQuery.isLoading || detailQuery.isLoading
  const isRefreshing = selfQuery.isFetching || detailQuery.isFetching
  const loadFailed =
    selfQuery.isError ||
    detailQuery.isError ||
    selfQuery.data?.success === false ||
    detailQuery.data?.success === false
  const loadFailedMessage =
    selfQuery.data?.message || detailQuery.data?.message || '邀请返利数据加载失败'
  const inviterLabel = detail?.inviter
    ? userDisplayName(detail.inviter)
    : summary?.inviter_username
      ? userDisplayName({
          id: summary.inviter_user_id,
          username: summary.inviter_username,
        })
      : '暂无邀请人'

  const refresh = async () => {
    await Promise.all([
      ...INVITE_QUERY_KEYS.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      ),
      queryClient.invalidateQueries({
        queryKey: ['invite-rewards', 'consumption'],
      }),
    ])
  }

  const transferRewards = async (quota: number) => {
    if (!Number.isFinite(quota) || quota <= 0) {
      toast.error('请输入有效的转入金额')
      return false
    }
    if (quota < QUOTA_PER_DOLLAR) {
      toast.error(`最低转入金额为 ${formatQuota(QUOTA_PER_DOLLAR)}`)
      return false
    }
    if (quota > availableRewards) {
      toast.error('转入金额不能超过可转入返利')
      return false
    }
    const res = await transferMutation.mutateAsync({ quota: Math.floor(quota) })
    return res.success === true
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>邀请返利</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button
          variant='outline'
          onClick={() => void refresh()}
          disabled={isRefreshing}
        >
          {isRefreshing ? <Loader2 className='mr-1 size-4 animate-spin' /> : null}
          {isRefreshing ? '刷新中' : '刷新'}
          {!isRefreshing ? <RefreshCw data-icon='inline-end' /> : null}
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='space-y-4 pb-8'>
          {loadFailed ? (
            <Alert variant='destructive'>
              <ShieldCheck className='size-4' />
              <AlertTitle>邀请返利数据加载失败</AlertTitle>
              <AlertDescription>
                {loadFailedMessage}。请刷新页面重试，如果仍然失败，请检查登录状态和
                /api/user/invite-detail 接口。
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <ShieldCheck className='size-4' />
              <AlertTitle>邀请奖励规则</AlertTitle>
              <AlertDescription>
                邀请链接会自动使用当前站点域名生成；奖励规则使用后台配置展示，余额和可转入返利使用实际账户额度计算。
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <LoadingGrid />
          ) : (
            <div className='grid gap-3 md:grid-cols-4'>
              <StatCard
                icon={<UsersRound className='size-4' />}
                title='受邀用户'
                value={`${summary?.invited_count ?? user?.aff_count ?? 0} 人`}
                desc='通过你的邀请链接注册'
              />
              <StatCard
                icon={<WalletCards className='size-4' />}
                title='可转入返利'
                value={formatQuota(availableRewards)}
                desc={
                  canTransferRewards
                    ? '可转入主余额'
                    : `最低 ${formatQuota(QUOTA_PER_DOLLAR)} 起转`
                }
              />
              <StatCard
                icon={<TrendingUp className='size-4' />}
                title='累计返利'
                value={formatQuota(user?.aff_history_quota ?? 0)}
                desc='历史累计邀请奖励'
              />
              <StatCard
                icon={<Gift className='size-4' />}
                title='邀请人奖励'
                value={formatRuleAmount(publicConfig?.inviter_reward_display)}
                desc='按当前系统配置展示'
              />
            </div>
          )}

          <Tabs defaultValue='invite' className='w-full'>
            <TabsList className='h-auto max-w-full flex-wrap justify-start'>
              <TabsTrigger value='invite'>我的邀请</TabsTrigger>
              <TabsTrigger value='consumption'>API 消耗</TabsTrigger>
              <TabsTrigger value='records'>返利记录</TabsTrigger>
              <TabsTrigger value='manage'>返利管理</TabsTrigger>
            </TabsList>

            <TabsContent value='invite' className='space-y-4'>
              <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]'>
                <Card data-card-hover='false' className='min-w-0 py-0'>
                  <CardHeader className='border-b p-4 sm:p-5'>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <Share2 className='size-4' />
                      我的邀请链接
                    </CardTitle>
                    <CardDescription>
                      复制链接发给新用户，注册成功后系统会按邀请规则发放奖励。
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4 p-4 sm:p-5'>
                    <div className='grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]'>
                      <div className='min-w-0 space-y-2'>
                        <div className='text-muted-foreground text-xs font-medium'>
                          邀请码
                        </div>
                        <div className='bg-muted/50 flex h-10 items-center rounded-lg border px-3 font-mono text-sm font-semibold'>
                          {affCode || '正在生成'}
                        </div>
                      </div>
                      <div className='min-w-0 space-y-2'>
                        <div className='text-muted-foreground text-xs font-medium'>
                          邀请链接
                        </div>
                        <div className='flex min-w-0 flex-col gap-2 sm:flex-row'>
                          <Input
                            value={affiliateLink}
                            readOnly
                            placeholder='正在生成邀请链接'
                            className='min-w-0 font-mono text-xs'
                          />
                          {affiliateLink ? (
                            <CopyButton
                              value={affiliateLink}
                              variant='outline'
                              tooltip='复制邀请链接'
                              successTooltip='已复制邀请链接'
                              aria-label='复制邀请链接'
                            />
                          ) : (
                            <Button variant='outline' disabled>
                              复制
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <RewardRules detail={detail || null} publicConfig={publicConfig} />

                    <div className='grid gap-3 md:grid-cols-3'>
                      <RuleCard
                        title='邀请来源'
                        value={inviterLabel}
                        desc='显示当前账号是否通过邀请链接注册。'
                      />
                      <RuleCard
                        title='已到账邀请奖励'
                        value={formatQuota(summary?.inviter_reward_total || 0)}
                        desc='当前账号作为邀请人累计获得的奖励。'
                      />
                      <RuleCard
                        title='可转入返利'
                        value={formatQuota(availableRewards)}
                        desc={
                          canTransferRewards
                            ? '可在返利管理中转入主余额。'
                            : `未达到最低转入金额 ${formatQuota(QUOTA_PER_DOLLAR)}。`
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card data-card-hover='false' className='min-w-0 py-0'>
                  <CardHeader className='border-b p-4 sm:p-5'>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <Link2 className='size-4' />
                      邀请二维码
                    </CardTitle>
                    <CardDescription>扫码打开注册邀请链接。</CardDescription>
                  </CardHeader>
                  <CardContent className='flex flex-col items-center gap-4 p-5'>
                    <div className='rounded-2xl border bg-white p-4'>
                      {affiliateLink ? (
                        <QRCodeSVG value={affiliateLink} size={192} />
                      ) : (
                        <div className='bg-muted flex size-48 items-center justify-center rounded-xl text-sm text-muted-foreground'>
                          暂无邀请码
                        </div>
                      )}
                    </div>
                    <div className='text-muted-foreground text-center text-xs leading-5'>
                      当前登录用户：{user ? userDisplayName(user) : '-'}
                      <br />
                      邀请来源：{inviterLabel}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='consumption' className='space-y-4'>
              <ConsumptionOverviewTab
                data={consumption || null}
                loading={consumptionQuery.isLoading}
                loadFailed={
                  consumptionQuery.isError ||
                  consumptionQuery.data?.success === false
                }
                affiliateLink={affiliateLink}
                range={consumptionRange}
                onRangeChange={setConsumptionRange}
              />
            </TabsContent>

            <TabsContent value='records' className='space-y-4'>
              <Card data-card-hover='false' className='overflow-hidden py-0'>
                <CardHeader className='border-b p-4 sm:p-5'>
                  <CardTitle className='text-base'>我邀请的用户</CardTitle>
                  <CardDescription>
                    这里只展示当前账号邀请注册的用户，用户名会做基础脱敏处理。
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-0'>
                  <Table className='min-w-[760px]'>
                    <TableHeader>
                      <TableRow>
                        <TableHead>被邀请用户</TableHead>
                        <TableHead>注册时间</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>邀请人奖励</TableHead>
                        <TableHead>受邀人奖励</TableHead>
                        <TableHead>奖励状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitees.map((item) => (
                        <TableRow key={item.user_id}>
                          <TableCell>
                            <div className='font-medium'>{userDisplayName(item)}</div>
                            <div className='text-muted-foreground text-xs'>
                              ID: {item.user_id}
                            </div>
                          </TableCell>
                          <TableCell className='text-muted-foreground'>
                            {item.created_at ? formatTimestamp(item.created_at) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline'>
                              {relationStatusText(item.relation_status)}
                            </Badge>
                          </TableCell>
                          <TableCell className='font-medium'>
                            {formatQuota(item.inviter_reward || 0)}
                          </TableCell>
                          <TableCell className='font-medium'>
                            {formatQuota(item.invitee_reward || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant='secondary'>
                              {rewardStatusText(item.reward_status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!detailQuery.isLoading && invitees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <EmptyState
                              title='暂无邀请记录'
                              description='复制邀请链接发给好友，新用户通过链接注册后会出现在这里。'
                            >
                              {affiliateLink ? (
                                <CopyButton
                                  value={affiliateLink}
                                  variant='outline'
                                  size='sm'
                                  className='bg-background/60 hover:bg-muted h-8 rounded-full px-3 text-xs font-medium shadow-none'
                                  iconClassName='size-3.5'
                                  tooltip='复制邀请链接'
                                  successTooltip='已复制邀请链接'
                                >
                                  复制邀请链接
                                </CopyButton>
                              ) : null}
                            </EmptyState>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card data-card-hover='false' className='overflow-hidden py-0'>
                <CardHeader className='border-b p-4 sm:p-5'>
                  <CardTitle className='text-base'>奖励流水</CardTitle>
                  <CardDescription>
                    只展示当前登录用户自己收到的奖励流水，不暴露其他用户隐私。
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-0'>
                  <Table className='min-w-[720px]'>
                    <TableHeader>
                      <TableRow>
                        <TableHead>奖励类型</TableHead>
                        <TableHead>奖励额度</TableHead>
                        <TableHead>关联用户</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>发放时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rewardLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{rewardRoleText(log.receiver_role)}</TableCell>
                          <TableCell className='font-medium'>
                            {formatQuota(log.reward_amount || 0)}
                          </TableCell>
                          <TableCell className='text-muted-foreground'>
                            {userDisplayName({
                              id: log.related_user_id,
                              username: log.related_username,
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant='secondary'>
                              {rewardStatusText(log.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-muted-foreground'>
                            {log.issued_at ? formatTimestamp(log.issued_at) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!detailQuery.isLoading && rewardLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <EmptyState
                              title='暂无奖励流水'
                              description='旧版系统只保存聚合字段时，可能不会生成逐条奖励流水；返利余额和累计返利仍以账户实际字段为准。'
                            />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='manage' className='space-y-4'>
              <Card data-card-hover='false' className='py-0'>
                <CardHeader className='border-b p-4 sm:p-5'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <WalletCards className='size-4' />
                    返利管理
                  </CardTitle>
                  <CardDescription>
                    当前版本沿用现有转余额接口，将待处理返利转入主余额；不新增订单级审批表。
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 p-4 sm:p-5'>
                  <div className='grid gap-3 md:grid-cols-3'>
                    <StatCard
                      icon={<WalletCards className='size-4' />}
                      title='可转入返利'
                      value={formatQuota(availableRewards)}
                      desc='账户 aff_quota'
                    />
                    <StatCard
                      icon={<TrendingUp className='size-4' />}
                      title='历史累计返利'
                      value={formatQuota(user?.aff_history_quota ?? 0)}
                      desc='账户 aff_history_quota'
                    />
                    <StatCard
                      icon={<UsersRound className='size-4' />}
                      title='累计邀请'
                      value={`${summary?.invited_count ?? user?.aff_count ?? 0} 人`}
                      desc='账户 aff_count'
                    />
                  </div>

                  <div className='flex flex-col gap-3 rounded-xl border bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='min-w-0'>
                      <div className='font-medium'>转入余额</div>
                      <p className='text-muted-foreground mt-1 text-sm leading-6'>
                        将待处理返利转入主余额后，可直接用于模型调用。最低转入金额为{' '}
                        {formatQuota(QUOTA_PER_DOLLAR)}。
                      </p>
                    </div>
                    <Button
                      onClick={() => setTransferOpen(true)}
                      disabled={!canTransferRewards || transferMutation.isPending}
                      className='shrink-0'
                    >
                      {transferMutation.isPending ? (
                        <Loader2 className='mr-1 size-4 animate-spin' />
                      ) : null}
                      申请返利到余额
                    </Button>
                  </div>

                  {!canTransferRewards ? (
                    <Alert>
                      <ShieldCheck className='size-4' />
                      <AlertTitle>暂未达到最低转入金额</AlertTitle>
                      <AlertDescription>
                        当前可转入返利为 {formatQuota(availableRewards)}，达到{' '}
                        {formatQuota(QUOTA_PER_DOLLAR)} 后即可转入主余额。
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <TransferDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          onConfirm={transferRewards}
          availableQuota={availableRewards}
          transferring={transferMutation.isPending}
        />
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
