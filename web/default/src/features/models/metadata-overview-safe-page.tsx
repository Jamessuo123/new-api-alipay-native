import { type ReactNode, useEffect, useMemo, useState } from 'react'

type PricingResolution = {
  resolution?: string
  no_video_input?: number | null
  with_video_input?: number | null
  completion?: number | null
}

type VideoResolutionPricing = {
  model_name?: string
  base_model?: string
  config_model?: string
  default_resolution?: string
  source?: string
  currency?: string
  unit?: string
  resolutions?: PricingResolution[]
}

type PricingModel = {
  model_name?: string
  modelName?: string
  name?: string
  description?: string
  icon?: string
  tags?: string[] | string
  vendor?: string
  vendor_id?: string
  owner_by?: string
  endpoint?: string
  endpoints?: string[] | string | Record<string, unknown>
  supported_endpoint_types?: string[] | string
  model_ratio?: number | null
  model_price?: number | null
  completion_ratio?: number | null
  video_input_ratio?: number | null
  video_resolution_pricing?: VideoResolutionPricing | null
  [key: string]: unknown
}

type LoadState = {
  loading: boolean
  error: string
  models: PricingModel[]
}

const VIDEO_MODEL_RE = /(seedance|veo|kling|sora|wan|hailuo|skyreels|video)/i

function asString(value: unknown): string {
  if (value === undefined || value === null) return ''
  return String(value)
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item)).filter(Boolean)
      if (parsed && typeof parsed === 'object') return Object.keys(parsed)
    } catch {
      return trimmed
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }
  if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>)
  return []
}

function getModelName(model: PricingModel): string {
  return asString(model.model_name || model.modelName || model.name)
}

function getVendor(model: PricingModel): string {
  return (
    asString(model.vendor) ||
    asString(model.owner_by) ||
    asString(model.vendor_id) ||
    '未设置'
  )
}

function getEndpoints(model: PricingModel): string[] {
  const endpoints = [
    ...asArray(model.supported_endpoint_types),
    ...asArray(model.endpoints),
    ...asArray(model.endpoint),
  ]
  return Array.from(new Set(endpoints)).filter(Boolean)
}

function getTags(model: PricingModel): string[] {
  return asArray(model.tags).slice(0, 4)
}

function hasPricing(model: PricingModel): boolean {
  return (
    model.model_ratio !== undefined ||
    model.model_price !== undefined ||
    model.completion_ratio !== undefined ||
    model.video_input_ratio !== undefined ||
    Boolean(model.video_resolution_pricing?.resolutions?.length)
  )
}

function isVideoModel(model: PricingModel): boolean {
  const name = getModelName(model)
  const endpoints = getEndpoints(model).join(' ')
  return (
    VIDEO_MODEL_RE.test(name) ||
    VIDEO_MODEL_RE.test(endpoints) ||
    Boolean(model.video_resolution_pricing?.resolutions?.length)
  )
}

function isMetadataComplete(model: PricingModel): boolean {
  return Boolean(
    getModelName(model) &&
      model.description &&
      (model.icon || getVendor(model) !== '未设置')
  )
}

function formatNumber(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '—'
  return String(Math.round(n * 1_000_000) / 1_000_000)
}

function resolveModels(payload: unknown): PricingModel[] {
  const root = payload as Record<string, unknown>
  const data = Array.isArray(payload)
    ? payload
    : Array.isArray(root?.data)
      ? root.data
      : Array.isArray(root?.models)
        ? root.models
        : []
  return data.filter((item): item is PricingModel =>
    Boolean(item && typeof item === 'object')
  )
}

function StatCard(props: { label: string; value: number | string; hint?: string }) {
  return (
    <div className='rounded-xl border bg-card/60 p-4 shadow-sm'>
      <div className='text-muted-foreground text-xs'>{props.label}</div>
      <div className='mt-2 text-2xl font-semibold tracking-tight'>{props.value}</div>
      {props.hint ? (
        <div className='text-muted-foreground mt-1 text-xs'>{props.hint}</div>
      ) : null}
    </div>
  )
}

function StatusBadge(props: { ok: boolean; children: ReactNode }) {
  return (
    <span
      className={
        props.ok
          ? 'inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-500'
          : 'inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500'
      }
    >
      {props.children}
    </span>
  )
}

function firstResolutionSummary(model: PricingModel): string {
  const rows = model.video_resolution_pricing?.resolutions || []
  if (rows.length === 0) return '—'
  const first = rows[0]
  const rest = rows.length > 1 ? ` 等 ${rows.length} 档` : ''
  return `${first.resolution || '默认'}：无视频 ${formatNumber(
    first.no_video_input
  )} / 含视频 ${formatNumber(first.with_video_input)}${rest}`
}

export function ModelsMetadataOverviewSafePage() {
  const [state, setState] = useState<LoadState>({
    loading: true,
    error: '',
    models: [],
  })
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'complete' | 'missing' | 'video'>(
    'all'
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState((current) => ({ ...current, loading: true, error: '' }))
      try {
        const response = await fetch('/api/pricing', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) {
          throw new Error(`pricing_api_${response.status}`)
        }
        const payload = await response.json()
        const models = resolveModels(payload)
        if (!cancelled) setState({ loading: false, error: '', models })
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            error: error instanceof Error ? error.message : 'load_failed',
            models: [],
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    const total = state.models.length
    const priced = state.models.filter(hasPricing).length
    const video = state.models.filter(isVideoModel).length
    const complete = state.models.filter(isMetadataComplete).length
    const missing = Math.max(total - complete, 0)
    const endpoints = new Set<string>()
    state.models.forEach((model) =>
      getEndpoints(model).forEach((endpoint) => endpoints.add(endpoint))
    )
    return { total, priced, video, complete, missing, endpoints: endpoints.size }
  }, [state.models])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.models
      .filter((model) => {
        if (status === 'complete' && !isMetadataComplete(model)) return false
        if (status === 'missing' && isMetadataComplete(model)) return false
        if (status === 'video' && !isVideoModel(model)) return false
        if (!q) return true
        const haystack = [
          getModelName(model),
          getVendor(model),
          model.description || '',
          getEndpoints(model).join(' '),
          getTags(model).join(' '),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
      .slice(0, 100)
  }, [query, state.models, status])

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-5 p-4 md:p-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
        <div>
          <div className='text-muted-foreground text-sm'>模型管理</div>
          <h1 className='mt-1 text-2xl font-semibold tracking-tight'>
            模型元数据概览
          </h1>
          <p className='text-muted-foreground mt-2 max-w-3xl text-sm'>
            这里只展示模型元数据完整度、端点、供应商和价格摘要；复杂价格配置仍在系统设置的模型定价中维护，模型广场仍负责面向用户的定价展示。
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <a className='rounded-lg border px-3 py-2 text-sm hover:bg-muted' href='/pricing'>
            查看模型广场
          </a>
          <a
            className='rounded-lg border px-3 py-2 text-sm hover:bg-muted'
            href='/system-settings/billing/model-pricing'
          >
            打开模型定价
          </a>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-6'>
        <StatCard label='总模型数' value={stats.total} />
        <StatCard label='已配置定价' value={stats.priced} />
        <StatCard label='视频模型' value={stats.video} />
        <StatCard label='元数据完整' value={stats.complete} />
        <StatCard label='缺失元数据' value={stats.missing} />
        <StatCard label='端点类型' value={stats.endpoints} />
      </div>

      <div className='rounded-xl border bg-card/50 p-3'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <input
            className='border-input bg-background h-10 min-w-0 rounded-lg border px-3 text-sm lg:w-96'
            placeholder='搜索模型、供应商、端点或标签'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className='flex flex-wrap gap-2'>
            {[
              ['all', '全部'],
              ['complete', '元数据完整'],
              ['missing', '缺失元数据'],
              ['video', '视频模型'],
            ].map(([key, label]) => (
              <button
                key={key}
                type='button'
                onClick={() => setStatus(key as typeof status)}
                className={
                  status === key
                    ? 'rounded-lg border bg-primary px-3 py-2 text-sm text-primary-foreground'
                    : 'rounded-lg border px-3 py-2 text-sm hover:bg-muted'
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {state.error ? (
        <div className='rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-500'>
          价格接口暂时不可用：{state.error}。页面已降级为空状态，不再抛出前端 500。
        </div>
      ) : null}

      <div className='min-h-0 overflow-hidden rounded-xl border bg-card/40'>
        <div className='border-b px-4 py-3 text-sm font-medium'>
          模型列表 {state.loading ? '· 加载中…' : `· ${filtered.length} 项`} <span className='text-muted-foreground ml-2 text-xs'>支持上下滚动查看</span>
        </div>
        <div className='max-h-[calc(100vh-360px)] min-h-[360px] overflow-auto overscroll-contain'>
          <table className='min-w-full border-collapse text-sm'>
            <thead className='sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80'>
              <tr>
                <th className='whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground'>模型</th>
                <th className='whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground'>供应商</th>
                <th className='whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground'>类型</th>
                <th className='whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground'>端点</th>
                <th className='whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground'>元数据</th>
                <th className='whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground'>定价摘要</th>
                <th className='whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground'>标签</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((model) => {
                const name = getModelName(model)
                const endpoints = getEndpoints(model)
                const tags = getTags(model)
                const video = isVideoModel(model)
                const complete = isMetadataComplete(model)
                return (
                  <tr key={name || JSON.stringify(model).slice(0, 80)} className='border-t hover:bg-muted/30'>
                    <td className='max-w-[280px] px-4 py-3'>
                      <div className='truncate font-medium'>{name || '未命名模型'}</div>
                      <div className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                        {model.description || '暂无描述'}
                      </div>
                    </td>
                    <td className='whitespace-nowrap px-4 py-3 text-muted-foreground'>{getVendor(model)}</td>
                    <td className='whitespace-nowrap px-4 py-3'>
                      <StatusBadge ok={video}>{video ? '视频/多模态' : '通用模型'}</StatusBadge>
                    </td>
                    <td className='max-w-[260px] px-4 py-3'>
                      <div className='flex flex-wrap gap-1'>
                        {endpoints.length > 0 ? (
                          endpoints.slice(0, 3).map((endpoint) => (
                            <span key={endpoint} className='rounded-md bg-muted px-2 py-0.5 text-xs'>
                              {endpoint}
                            </span>
                          ))
                        ) : (
                          <span className='text-muted-foreground text-xs'>未设置</span>
                        )}
                      </div>
                    </td>
                    <td className='whitespace-nowrap px-4 py-3'>
                      <StatusBadge ok={complete}>{complete ? '完整' : '待补全'}</StatusBadge>
                    </td>
                    <td className='min-w-[240px] px-4 py-3 text-xs'>
                      {model.video_resolution_pricing?.resolutions?.length ? (
                        <div>
                          <div className='font-medium'>
                            视频分辨率：{model.video_resolution_pricing.resolutions.length} 档
                          </div>
                          <div className='text-muted-foreground mt-1'>{firstResolutionSummary(model)}</div>
                        </div>
                      ) : hasPricing(model) ? (
                        <div className='text-muted-foreground'>
                          输入 {formatNumber(model.model_ratio)} · 输出 {formatNumber(model.completion_ratio)}
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>未配置</span>
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex flex-wrap gap-1'>
                        {tags.length > 0 ? (
                          tags.map((tag) => (
                            <span key={tag} className='rounded-md border px-2 py-0.5 text-xs text-muted-foreground'>
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className='text-muted-foreground text-xs'>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!state.loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-4 py-10 text-center text-sm text-muted-foreground'>
                    暂无模型元数据。接口失败时本页会显示空状态，不再触发前端 500。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
