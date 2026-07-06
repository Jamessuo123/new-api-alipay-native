import { type ReactNode, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Gift, Link2, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatQuota, formatTimestamp } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getUserInviteDetail } from '../../api'
import type { User } from '../../types'

type UserInviteDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
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

function SummaryCard({
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
    <div className='rounded-xl border bg-card/50 p-4'>
      <div className='flex items-center gap-2 text-muted-foreground text-xs'>
        {icon}
        <span>{title}</span>
      </div>
      <div className='mt-2 text-xl font-semibold tabular-nums'>{value}</div>
      {desc ? <div className='text-muted-foreground mt-1 text-xs'>{desc}</div> : null}
    </div>
  )
}

export function UserInviteDetailDialog({
  open,
  onOpenChange,
  user,
}: UserInviteDetailDialogProps) {
  const { t } = useTranslation()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['user-invite-detail', user.id, open],
    enabled: open,
    queryFn: () => getUserInviteDetail(user.id),
  })

  const detail = data?.success ? data.data : undefined
  const summary = detail?.summary || user.invite_info
  const invitees = detail?.invitees || []
  const rewardLogs = detail?.reward_logs || []
  const inviter = detail?.inviter

  const inviterName = useMemo(() => {
    if (inviter?.username) return `${inviter.username} (#${inviter.id})`
    if (summary?.inviter_username) {
      return `${summary.inviter_username} (#${summary.inviter_user_id})`
    }
    if (summary?.inviter_user_id) return `用户 #${summary.inviter_user_id}`
    return '无邀请人'
  }, [inviter, summary])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-[92vw] sm:max-w-5xl'>
        <SheetHeader>
          <SheetTitle>{t('邀请详情')}：{user.username}</SheetTitle>
          <SheetDescription>
            查看该用户的邀请来源、邀请用户列表和奖励发放明细。当前为兼容旧用户字段的审计视图。
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className='min-h-0 flex-1 px-4 pb-4'>
          <div className='space-y-4 pb-6'>
            <div className='grid gap-3 md:grid-cols-4'>
              <SummaryCard
                icon={<UsersRound className='size-4' />}
                title='已邀请用户'
                value={`${summary?.invited_count || 0} 人`}
                desc='作为邀请人产生的注册'
              />
              <SummaryCard
                icon={<Gift className='size-4' />}
                title='邀请奖励累计'
                value={formatQuota(summary?.inviter_reward_total || 0)}
                desc={`剩余邀请额度 ${formatQuota(summary?.inviter_reward_balance || 0)}`}
              />
              <SummaryCard
                icon={<Gift className='size-4' />}
                title='受邀奖励'
                value={formatQuota(summary?.invitee_reward_total || 0)}
                desc={inviterName}
              />
              <SummaryCard
                icon={<Link2 className='size-4' />}
                title='异常记录'
                value={`${summary?.abnormal_count || 0}`}
                desc={summary?.reward_source || 'legacy_user_fields'}
              />
            </div>

            <Tabs defaultValue='invitees' className='w-full'>
              <TabsList>
                <TabsTrigger value='invitees'>我邀请的用户</TabsTrigger>
                <TabsTrigger value='source'>我的邀请来源</TabsTrigger>
                <TabsTrigger value='logs'>奖励流水</TabsTrigger>
              </TabsList>

              <TabsContent value='invitees'>
                <div className='overflow-hidden rounded-xl border'>
                  <div className='max-h-[420px] overflow-auto'>
                    <table className='min-w-full text-sm'>
                      <thead className='sticky top-0 z-10 bg-muted/95'>
                        <tr className='border-b'>
                          <th className='px-3 py-2 text-left font-medium'>被邀请用户</th>
                          <th className='px-3 py-2 text-left font-medium'>注册时间</th>
                          <th className='px-3 py-2 text-left font-medium'>状态</th>
                          <th className='px-3 py-2 text-left font-medium'>邀请人奖励</th>
                          <th className='px-3 py-2 text-left font-medium'>受邀人奖励</th>
                          <th className='px-3 py-2 text-left font-medium'>奖励状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invitees.map((item) => (
                          <tr key={item.user_id} className='border-b last:border-b-0'>
                            <td className='px-3 py-2'>
                              <div className='font-medium'>{item.username}</div>
                              <div className='text-muted-foreground text-xs'>ID: {item.user_id}</div>
                            </td>
                            <td className='px-3 py-2 text-muted-foreground'>
                              {item.created_at ? formatTimestamp(item.created_at) : '-'}
                            </td>
                            <td className='px-3 py-2'>
                              <Badge variant='outline'>{item.relation_status || 'active'}</Badge>
                            </td>
                            <td className='px-3 py-2 font-medium'>{formatQuota(item.inviter_reward || 0)}</td>
                            <td className='px-3 py-2 font-medium'>{formatQuota(item.invitee_reward || 0)}</td>
                            <td className='px-3 py-2'>
                              <Badge variant='secondary'>{rewardStatusText(item.reward_status)}</Badge>
                            </td>
                          </tr>
                        ))}
                        {!isLoading && invitees.length === 0 ? (
                          <tr>
                            <td colSpan={6} className='text-muted-foreground px-3 py-8 text-center'>
                              该用户暂未邀请其他用户
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='source'>
                <div className='rounded-xl border p-4'>
                  {inviter || summary?.inviter_user_id ? (
                    <div className='space-y-3'>
                      <div className='text-sm font-medium'>该用户由以下用户邀请注册</div>
                      <div className='grid gap-3 md:grid-cols-3'>
                        <SummaryCard
                          icon={<UsersRound className='size-4' />}
                          title='邀请人'
                          value={inviterName}
                        />
                        <SummaryCard
                          icon={<Gift className='size-4' />}
                          title='该用户受邀奖励'
                          value={formatQuota(summary?.invitee_reward_total || 0)}
                        />
                        <SummaryCard
                          icon={<Gift className='size-4' />}
                          title='邀请人累计奖励'
                          value={formatQuota(inviter?.quota || 0)}
                          desc='此项为邀请人当前额度，仅作参考'
                        />
                      </div>
                    </div>
                  ) : (
                    <div className='text-muted-foreground py-8 text-center text-sm'>
                      该用户不是通过邀请链接注册，或历史数据中没有记录邀请人。
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value='logs'>
                <div className='overflow-hidden rounded-xl border'>
                  <div className='max-h-[420px] overflow-auto'>
                    <table className='min-w-full text-sm'>
                      <thead className='sticky top-0 z-10 bg-muted/95'>
                        <tr className='border-b'>
                          <th className='px-3 py-2 text-left font-medium'>接收用户</th>
                          <th className='px-3 py-2 text-left font-medium'>奖励类型</th>
                          <th className='px-3 py-2 text-left font-medium'>奖励额度</th>
                          <th className='px-3 py-2 text-left font-medium'>关联用户</th>
                          <th className='px-3 py-2 text-left font-medium'>状态</th>
                          <th className='px-3 py-2 text-left font-medium'>发放时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rewardLogs.map((log) => (
                          <tr key={log.id} className='border-b last:border-b-0'>
                            <td className='px-3 py-2'>
                              <div className='font-medium'>{log.receiver_username || `#${log.receiver_user_id}`}</div>
                              <div className='text-muted-foreground text-xs'>ID: {log.receiver_user_id}</div>
                            </td>
                            <td className='px-3 py-2'>{rewardRoleText(log.receiver_role)}</td>
                            <td className='px-3 py-2 font-medium'>{formatQuota(log.reward_amount || 0)}</td>
                            <td className='px-3 py-2 text-muted-foreground'>
                              {log.related_username || `#${log.related_user_id}`}
                            </td>
                            <td className='px-3 py-2'>
                              <Badge variant='secondary'>{rewardStatusText(log.status)}</Badge>
                            </td>
                            <td className='px-3 py-2 text-muted-foreground'>
                              {log.issued_at ? formatTimestamp(log.issued_at) : '-'}
                            </td>
                          </tr>
                        ))}
                        {!isLoading && rewardLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className='text-muted-foreground px-3 py-8 text-center'>
                              暂无邀请奖励流水。旧系统仅保存聚合字段时，会在有邀请关系后展示兼容流水。
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {isFetching ? (
              <div className='text-muted-foreground text-xs'>正在刷新邀请详情...</div>
            ) : null}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
