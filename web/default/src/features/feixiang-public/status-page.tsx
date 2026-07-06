import { useEffect, useMemo, useState } from 'react'

type StatusItem = {
  model_name?: string
  channel_id?: number
  channel_name?: string
  total: number
  avg_use_time: number
}

type StatusData = {
  source: string
  note: string
  generated_at: string
  window_minutes: number
  platform_status: string
  database_status: string
  recent_requests: number
  recent_errors: number
  success_rate: number
  error_rate: number
  avg_latency_seconds: number
  models: StatusItem[]
  channels: StatusItem[]
  query_errors: string[]
}

type StatusResponse = {
  success: boolean
  data?: StatusData
  error?: string
}

const statusText: Record<string, string> = {
  operational: '正常',
  degraded: '部分异常',
  outage: '异常',
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(value))
  } catch {
    return value
  }
}

function StatusBadge(props: { status?: string }) {
  const value = props.status || 'unknown'
  const label = statusText[value] || '未知'
  const tone = value === 'operational'
    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
    : 'border-amber-400/30 bg-amber-400/10 text-amber-200'

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${tone}`}>
      <span className='h-1.5 w-1.5 rounded-full bg-current' />
      {label}
    </span>
  )
}

function MetricCard(props: { title: string; value: string | number; desc: string }) {
  return (
    <div className='rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl'>
      <div className='text-sm font-bold text-white/55'>{props.title}</div>
      <div className='mt-4 text-3xl font-black tracking-tight text-white'>{props.value}</div>
      <div className='mt-2 text-sm leading-6 text-white/45'>{props.desc}</div>
    </div>
  )
}

function DataList(props: { title: string; empty: string; items: StatusItem[]; kind: 'model' | 'channel' }) {
  return (
    <div className='rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl'>
      <div className='mb-5 flex items-center justify-between gap-4'>
        <h2 className='text-xl font-black text-white'>{props.title}</h2>
        <span className='rounded-full border border-white/10 px-3 py-1 text-xs text-white/45'>被动统计</span>
      </div>
      {props.items.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/45'>{props.empty}</div>
      ) : (
        <div className='space-y-3'>
          {props.items.map((item, index) => {
            const name = props.kind === 'model'
              ? item.model_name || '未知模型'
              : item.channel_name || `渠道 #${item.channel_id || index + 1}`
            return (
              <div key={`${name}-${index}`} className='flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3'>
                <div className='min-w-0'>
                  <div className='truncate text-sm font-bold text-white'>{name}</div>
                  <div className='mt-1 text-xs text-white/40'>最近请求 {item.total} 次</div>
                </div>
                <div className='shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70'>
                  {Number(item.avg_use_time || 0).toFixed(2)}s
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function FeiXiangPublicApiStatusPage() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetch('/api/public/status', { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        const payload = (await response.json()) as StatusResponse
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || `状态接口异常：${response.status}`)
        }
        if (alive) {
          setData(payload.data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : '状态数据加载失败')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const generatedAt = useMemo(() => formatDateTime(data?.generated_at), [data?.generated_at])
  const platformStatus = data?.platform_status || 'unknown'

  return (
    <main className='min-h-screen overflow-hidden bg-[#070718] text-white'>
      <section className='relative border-b border-white/10'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.22),transparent_32%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:auto,auto,64px_64px,64px_64px]' />
        <div className='relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8'>
          <a href='/' className='inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/65 transition hover:border-white/20 hover:text-white'>← 返回首页</a>
          <div className='mt-10 max-w-3xl'>
            <div className='inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-pink-400/10 px-4 py-2 text-sm font-bold text-pink-100'>
              被动 API 状态
            </div>
            <h1 className='mt-6 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl'>
              <span className='bg-gradient-to-r from-pink-400 via-fuchsia-300 to-orange-300 bg-clip-text text-transparent'>FeiXiangApi 状态</span>
            </h1>
            <p className='mt-6 text-lg leading-8 text-white/55'>
              基于最近调用日志计算平台运行状态，不主动探测任何上游渠道或模型，因此不会产生额外模型费用。
            </p>
            <div className='mt-8 flex flex-wrap items-center gap-4'>
              <StatusBadge status={platformStatus} />
              <span className='text-sm text-white/45'>更新时间：{loading ? '加载中...' : generatedAt}</span>
              <span className='text-sm text-white/35'>统计窗口：最近 {data?.window_minutes || 15} 分钟</span>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        {error ? (
          <div className='rounded-[28px] border border-amber-400/20 bg-amber-400/10 p-6 text-amber-100'>
            状态数据暂时不可用：{error}
          </div>
        ) : null}

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <MetricCard title='平台状态' value={loading ? '加载中' : (statusText[platformStatus] || '未知')} desc='数据库与最近日志聚合状态' />
          <MetricCard title='最近请求' value={loading ? '—' : (data?.recent_requests ?? 0)} desc='最近统计窗口内的日志请求数' />
          <MetricCard title='成功率' value={loading ? '—' : `${Number(data?.success_rate ?? 100).toFixed(2)}%`} desc='根据日志中的错误关键词被动估算' />
          <MetricCard title='平均耗时' value={loading ? '—' : `${Number(data?.avg_latency_seconds ?? 0).toFixed(2)}s`} desc='最近请求平均响应耗时' />
        </div>

        <div className='mt-8 grid gap-6 lg:grid-cols-2'>
          <DataList title='最近活跃模型' empty='最近统计窗口内暂无模型调用记录。' items={data?.models || []} kind='model' />
          <DataList title='最近活跃渠道' empty='最近统计窗口内暂无渠道调用记录。' items={data?.channels || []} kind='channel' />
        </div>

        <div className='mt-8 rounded-[28px] border border-white/10 bg-white/[0.035] p-6 text-sm leading-7 text-white/45'>
          <div className='font-bold text-white/70'>说明</div>
          <p className='mt-2'>本页面采用被动统计方案，只读取平台已有日志，不执行渠道测试、不请求模型、不触发视频或图片生成。</p>
          {data?.query_errors?.length ? (
            <div className='mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-amber-100'>
              部分统计项不可用：{data.query_errors.join('；')}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
