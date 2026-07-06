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
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import {
  ArrowLeft,
  CalendarClock,
  Code2,
  FileText,
  HeartPulse,
  Info,
  Layers,
  Maximize2,
  Sparkles,
  Timer,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopyButton } from '@/components/copy-button'
import { sideDrawerContentClassName } from '@/components/drawer-layout'
import { GroupBadge } from '@/components/group-badge'
import { PublicLayout } from '@/components/layout'
import { getPerfMetrics } from '@/features/performance-metrics/api'
import {
  formatLatency,
  formatThroughput,
  formatUptimePct,
  getSuccessRateTextClass,
} from '@/features/performance-metrics/lib/format'
import { DEFAULT_TOKEN_UNIT, QUOTA_TYPE_VALUES } from '../constants'
import { usePricingData } from '../hooks/use-pricing-data'
import {
  getDynamicPriceEntries,
  getDynamicPricingSummary,
  getDynamicPricingTiers,
  isDynamicPricingModel,
} from '../lib/dynamic-price'
import { parseTags } from '../lib/filters'
import { getAvailableGroups, isTokenBasedModel } from '../lib/model-helpers'
import { formatFixedPrice, formatGroupPrice } from '../lib/price'
import type {
  ModelCapability,
  PriceType,
  PricingModel,
  TokenUnit,
  VideoResolutionPricing,
  VideoResolutionPricingResolution,
} from '../types'
import { DynamicPricingBreakdown } from './dynamic-pricing-breakdown'
import { ModelDetailsApi } from './model-details-api'
import { ModelDetailsPerformance } from './model-details-performance'

// ----------------------------------------------------------------------------
// Local UI helpers
// ----------------------------------------------------------------------------

function SectionTitle(props: { children: React.ReactNode }) {
  return (
    <h2 className='text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase'>
      {props.children}
    </h2>
  )
}

const CAPABILITY_LABEL_KEYS: Record<ModelCapability, string> = {
  function_calling: 'Function calling',
  streaming: 'Streaming',
  vision: 'Vision',
  json_mode: 'JSON mode',
  structured_output: 'Structured output',
  reasoning: 'Reasoning',
  tools: 'Tools',
  system_prompt: 'System prompt',
  web_search: 'Web search',
  code_interpreter: 'Code interpreter',
  caching: 'Prompt caching',
  embeddings: 'Embeddings',
}

const MODALITY_LABEL_KEYS: Record<string, string> = {
  text: 'Text',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
  file: 'File',
}

const TOKEN_FORMAT = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
})

function formatCatalogTokenCount(tokens: number): string {
  if (!Number.isFinite(tokens) || tokens <= 0) return ''
  if (tokens >= 1_000_000) {
    return `${TOKEN_FORMAT.format(tokens / 1_000_000)}M`
  }
  if (tokens >= 1_000) {
    return `${TOKEN_FORMAT.format(tokens / 1_000)}K`
  }
  return TOKEN_FORMAT.format(tokens)
}

function formatCatalogYearMonth(value?: string): string {
  if (!value) return ''
  const [yearStr, monthStr] = value.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return value
  const date = new Date(Date.UTC(year, month - 1, 1))
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short' })
}

function normalizeCatalogItems(items?: readonly string[]): string[] {
  if (!items) return []
  return items.filter((item) => item.trim().length > 0)
}

function OverviewMetric(props: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  valueClassName?: string
}) {
  const Icon = props.icon

  return (
    <div className='flex min-w-0 items-center gap-2 px-3 py-2'>
      <Icon className='text-muted-foreground/70 size-3.5 shrink-0' />
      <div className='min-w-0 flex-1'>
        <div className='text-muted-foreground truncate text-[10px] font-medium tracking-wider uppercase'>
          {props.label}
        </div>
        <div
          className={cn(
            'text-foreground truncate font-mono text-sm font-semibold tabular-nums',
            props.valueClassName
          )}
        >
          {props.value}
        </div>
      </div>
    </div>
  )
}

function OverviewSummaryGrid(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const metricsQuery = useQuery({
    queryKey: ['perf-metrics', props.model.model_name],
    queryFn: () => getPerfMetrics(props.model.model_name, 24),
    staleTime: 60 * 1000,
  })

  const groups = metricsQuery.data?.data.groups ?? []
  const successRates = groups
    .map((group) => group.success_rate)
    .filter((rate) => Number.isFinite(rate))
  const successRate =
    successRates.length > 0
      ? successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length
      : Number.NaN
  const tpsValues = groups
    .map((group) => group.avg_tps)
    .filter((value) => value > 0)
  const avgTps =
    tpsValues.length > 0
      ? tpsValues.reduce((sum, value) => sum + value, 0) / tpsValues.length
      : 0
  const latencyValues = groups
    .map((group) => group.avg_latency_ms)
    .filter((value) => value > 0)
  const avgLatency =
    latencyValues.length > 0
      ? Math.round(
          latencyValues.reduce((sum, value) => sum + value, 0) /
            latencyValues.length
        )
      : 0

  return (
    <div className='bg-muted/20 grid overflow-hidden rounded-lg border sm:grid-cols-3 sm:divide-x'>
      <OverviewMetric
        icon={Timer}
        label='TPS'
        value={formatThroughput(avgTps)}
      />
      <OverviewMetric
        icon={Timer}
        label={t('Average latency')}
        value={formatLatency(avgLatency)}
      />
      <OverviewMetric
        icon={HeartPulse}
        label={t('Success rate')}
        value={formatUptimePct(successRate)}
        valueClassName={getSuccessRateTextClass(successRate)}
      />
    </div>
  )
}

function CatalogPillList(props: { items: string[] }) {
  return (
    <div className='flex min-w-0 flex-wrap gap-1.5'>
      {props.items.map((item) => (
        <span
          key={item}
          className='bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs font-medium'
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function CatalogTextValue(props: { children: React.ReactNode }) {
  return (
    <span className='text-foreground min-w-0 truncate text-sm font-semibold'>
      {props.children}
    </span>
  )
}

function CatalogInfoCell(props: { label: string; children: React.ReactNode }) {
  return (
    <div className='bg-card flex min-w-0 flex-col gap-1 px-3 py-2.5'>
      <span className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
        {props.label}
      </span>
      {props.children}
    </div>
  )
}

function ModalityLabels(props: { items: string[] }) {
  const { t } = useTranslation()
  if (props.items.length === 0) return null

  return (
    <span className='inline-flex items-center gap-1 align-middle'>
      {props.items.map((item) => (
        <span key={item} className='font-medium'>
          {t(MODALITY_LABEL_KEYS[item] ?? item)}
        </span>
      ))}
    </span>
  )
}

function ModelBackendQuickStats(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const model = props.model
  const inputModalities = normalizeCatalogItems(model.input_modalities)
  const outputModalities = normalizeCatalogItems(model.output_modalities)
  const contextLength = model.context_length ?? 0
  const maxOutput = model.max_output_tokens ?? 0
  const knowledgeCutoff = formatCatalogYearMonth(model.knowledge_cutoff)
  const releaseDate = formatCatalogYearMonth(model.release_date)

  const stats: {
    key: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: React.ReactNode
    hint?: string
  }[] = []

  if (contextLength > 0) {
    stats.push({
      key: 'context',
      icon: Layers,
      label: t('Context'),
      value: formatCatalogTokenCount(contextLength),
      hint: t('Maximum input window'),
    })
  }

  if (maxOutput > 0) {
    stats.push({
      key: 'max-output',
      icon: Maximize2,
      label: t('Max output'),
      value: formatCatalogTokenCount(maxOutput),
      hint: t('Maximum tokens per response'),
    })
  }

  if (inputModalities.length > 0 || outputModalities.length > 0) {
    stats.push({
      key: 'modalities',
      icon: FileText,
      label: t('Modalities'),
      value: (
        <span className='inline-flex items-center gap-1'>
          <ModalityLabels items={inputModalities} />
          {inputModalities.length > 0 && outputModalities.length > 0 && (
            <span className='text-muted-foreground/40'>→</span>
          )}
          <ModalityLabels items={outputModalities} />
        </span>
      ),
    })
  }

  if (knowledgeCutoff) {
    stats.push({
      key: 'knowledge',
      icon: Sparkles,
      label: t('Knowledge cutoff'),
      value: knowledgeCutoff,
    })
  }

  if (releaseDate) {
    stats.push({
      key: 'release',
      icon: CalendarClock,
      label: t('Released'),
      value: releaseDate,
    })
  }

  if (stats.length === 0) return null

  return (
    <div className='bg-muted/20 grid grid-cols-2 gap-px overflow-hidden rounded-lg border @md/details:grid-cols-3 @2xl/details:grid-cols-5'>
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.key}
            className='bg-background flex min-w-0 flex-col gap-0.5 px-3 py-2.5'
          >
            <span className='text-muted-foreground inline-flex min-w-0 items-center gap-1 text-[10px] font-medium tracking-wider uppercase'>
              <Icon className='size-3 shrink-0' />
              <span className='truncate'>{stat.label}</span>
            </span>
            <span className='text-foreground truncate text-sm font-semibold tabular-nums'>
              {stat.value}
            </span>
            {stat.hint && (
              <span className='text-muted-foreground/60 truncate text-[10px]'>
                {stat.hint}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ModelBackendSignalsSection(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const capabilities = normalizeCatalogItems(props.model.capabilities)
  const inputModalities = normalizeCatalogItems(props.model.input_modalities)
  const outputModalities = normalizeCatalogItems(props.model.output_modalities)

  if (
    capabilities.length === 0 &&
    inputModalities.length === 0 &&
    outputModalities.length === 0
  ) {
    return null
  }

  return (
    <section>
      <SectionTitle>
        {t('Capabilities')} / {t('Supported modalities')}
      </SectionTitle>
      <div className='grid gap-3 rounded-xl border p-3 @2xl/details:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]'>
        {capabilities.length > 0 ? (
          <CatalogPillList
            items={capabilities.map((capability) =>
              t(
                CAPABILITY_LABEL_KEYS[capability as ModelCapability] ??
                  capability
              )
            )}
          />
        ) : (
          <div />
        )}
        {(inputModalities.length > 0 || outputModalities.length > 0) && (
          <div className='grid gap-2 sm:grid-cols-2'>
            {inputModalities.length > 0 && (
              <div className='flex items-center justify-between gap-3 rounded-lg border px-3 py-2'>
                <span className='text-muted-foreground text-xs font-medium'>
                  {t('Input')}
                </span>
                <CatalogTextValue>
                  <ModalityLabels items={inputModalities} />
                </CatalogTextValue>
              </div>
            )}
            {outputModalities.length > 0 && (
              <div className='flex items-center justify-between gap-3 rounded-lg border px-3 py-2'>
                <span className='text-muted-foreground text-xs font-medium'>
                  {t('Output')}
                </span>
                <CatalogTextValue>
                  <ModalityLabels items={outputModalities} />
                </CatalogTextValue>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function ModelBackendProviderSection(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const model = props.model
  const groups = normalizeCatalogItems(model.enable_groups)
  const rawEndpoints = normalizeCatalogItems(model.supported_endpoint_types)
  // FEIXIANG_SEEDANCE_DETAILS_ENDPOINT_LABEL_V1
  // Seedance is a video-generation task model. The upstream channel type is
  // DoubaoVideo, and the user-facing API entry should be shown as video
  // generation rather than a generic OpenAI chat endpoint.
  const feiXiangIsSeedanceVideoModel = /^seedance-2\.0/.test(
    model.model_name || ''
  )
  const endpoints = feiXiangIsSeedanceVideoModel
    ? ['视频生成', '/v1/video/generations']
    : rawEndpoints
  const tags = parseTags(model.tags)
  const cells: React.ReactNode[] = []

  if (model.vendor_name) {
    cells.push(
      <CatalogInfoCell key='provider' label={t('Provider')}>
        <CatalogTextValue>{model.vendor_name}</CatalogTextValue>
      </CatalogInfoCell>
    )
  }

  cells.push(
    <CatalogInfoCell key='type' label={t('Type')}>
      <CatalogTextValue>
        {model.quota_type === QUOTA_TYPE_VALUES.TOKEN
          ? t('Token-based')
          : t('Per Request')}
      </CatalogTextValue>
    </CatalogInfoCell>
  )

  if (groups.length > 0) {
    cells.push(
      <CatalogInfoCell key='groups' label={t('Groups')}>
        <CatalogPillList items={groups} />
      </CatalogInfoCell>
    )
  }

  if (endpoints.length > 0) {
    cells.push(
      <CatalogInfoCell key='endpoints' label={t('Endpoints')}>
        <CatalogPillList items={endpoints} />
      </CatalogInfoCell>
    )
  }

  if (tags.length > 0) {
    cells.push(
      <CatalogInfoCell key='tags' label={t('Tags')}>
        <CatalogPillList items={tags} />
      </CatalogInfoCell>
    )
  }

  if (model.parameter_count) {
    cells.push(
      <CatalogInfoCell key='parameters' label={t('Parameters')}>
        <CatalogTextValue>{model.parameter_count}</CatalogTextValue>
      </CatalogInfoCell>
    )
  }

  if (cells.length === 0) return null

  return (
    <section>
      <SectionTitle>{t('Model')}</SectionTitle>
      <div className='border-border/60 bg-border/60 grid grid-cols-1 gap-px overflow-hidden rounded-lg border sm:grid-cols-2'>
        {cells}
      </div>
    </section>
  )
}

function ModelBackendDetailsSection(props: { model: PricingModel }) {
  return (
    <>
      <ModelBackendQuickStats model={props.model} />
      <ModelBackendSignalsSection model={props.model} />
      <ModelBackendProviderSection model={props.model} />
    </>
  )
}

// ----------------------------------------------------------------------------
// Model header (always visible above the detail sections)
// ----------------------------------------------------------------------------

function ModelHeader(props: { model: PricingModel }) {
  const { t } = useTranslation()
  const model = props.model
  const modelIconKey = model.icon || model.vendor_icon
  const modelIcon = modelIconKey ? getLobeIcon(modelIconKey, 20) : null
  const description = model.description || model.vendor_description || null
  const isSpecialExpression =
    model.billing_mode === 'tiered_expr' &&
    Boolean(model.billing_expr) &&
    getDynamicPricingTiers(model).length === 0

  return (
    <header className='pb-4'>
      <div className='flex items-center gap-2.5'>
        {modelIcon}
        <h1 className='font-mono text-xl font-bold tracking-tight sm:text-2xl'>
          {model.model_name}
        </h1>
        <CopyButton
          value={model.model_name || ''}
          className='size-6'
          iconClassName='size-3'
          tooltip={t('Copy model name')}
          successTooltip={t('Copied!')}
          aria-label={t('Copy model name')}
        />
      </div>
      <div className='mt-1 flex flex-wrap items-center gap-1.5 text-xs'>
        {model.vendor_name && (
          <span className='text-muted-foreground'>{model.vendor_name}</span>
        )}
        <span className='text-muted-foreground/30'>·</span>
        <span className='text-muted-foreground/70'>
          {model.quota_type === QUOTA_TYPE_VALUES.TOKEN
            ? t('Token-based')
            : t('Per Request')}
        </span>
        {model.billing_mode === 'tiered_expr' && model.billing_expr && (
          <>
            <span className='text-muted-foreground/30'>·</span>
            <span className='rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'>
              {isSpecialExpression
                ? t('Special billing expression')
                : t('Dynamic Pricing')}
            </span>
          </>
        )}
      </div>
      {description && (
        <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
          {description}
        </p>
      )}
    </header>
  )
}

// ----------------------------------------------------------------------------
// Base price card (used in the Overview tab)
// ----------------------------------------------------------------------------

// FEIXIANG_VIDEO_DUAL_INPUT_PRICING_V1
// Keep the original product pricing strategy unchanged:
// - normal text/token models still show Input / Output / Cache
// - video task models show No-video-input / With-video-input
// - no-video-input uses the existing model_ratio
// - with-video-input uses the independent video_input_ratio when configured

type FeiXiangVideoInputPricingModelV1 = PricingModel & {
  video_input_ratio?: number | null
}

type FeiXiangVideoInputPricingRowV1 = {
  key: string
  label: React.ReactNode
  value: React.ReactNode
  hint?: React.ReactNode
}

function getFeiXiangVideoInputRatioPricingV1(model: PricingModel): number | null {
  const value = (model as FeiXiangVideoInputPricingModelV1).video_input_ratio
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : null
}

function isFeiXiangVideoPricingModelV1(model: PricingModel): boolean {
  const anyModel = model as PricingModel & {
    supported_endpoint_types?: readonly string[]
    input_modalities?: readonly string[]
    output_modalities?: readonly string[]
  }
  const modelName = String(model.model_name || '').toLowerCase()
  const endpointText = Array.isArray(anyModel.supported_endpoint_types)
    ? anyModel.supported_endpoint_types.join(' ').toLowerCase()
    : ''
  const modalityText = [
    ...(Array.isArray(anyModel.input_modalities) ? anyModel.input_modalities : []),
    ...(Array.isArray(anyModel.output_modalities) ? anyModel.output_modalities : []),
  ]
    .join(' ')
    .toLowerCase()

  return (
    /^seedance-2\.0/.test(modelName) ||
    modelName.includes('video') ||
    endpointText.includes('video') ||
    modalityText.includes('video') ||
    getFeiXiangVideoInputRatioPricingV1(model) != null
  )
}

function withFeiXiangVideoInputRatioPricingV1(
  model: PricingModel,
  videoInputRatio: number
): PricingModel {
  return {
    ...model,
    model_ratio: videoInputRatio,
  }
}

function formatFeiXiangVideoInputRatioV1(value: number): string {
  if (!Number.isFinite(value)) return '1x'
  const rounded = Math.round(value * 10_000) / 10_000
  return `${rounded.toFixed(4).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')}x`
}

function getFeiXiangVideoInputGroupNameClassNameV1(group: string): string {
  const value = String(group || '')
  return cn(
    'font-semibold',
    value === 'default' && 'text-primary',
    /逆向|reverse|pro/i.test(value) && 'text-destructive'
  )
}

function FeiXiangVideoInputUnitValueV1(props: {
  children: React.ReactNode
  unit?: React.ReactNode
}) {
  return (
    <span className='inline-flex items-baseline gap-1'>
      <span>{props.children}</span>
      {props.unit ? (
        <span className='text-muted-foreground/40 text-xs font-normal'>
          / {props.unit}
        </span>
      ) : null}
    </span>
  )
}

function FeiXiangVideoInputMissingValueV1() {
  return <span className='text-muted-foreground/60'>未配置</span>
}

function FeiXiangVideoInputPricingRowsV1(props: {
  title: React.ReactNode
  rows: FeiXiangVideoInputPricingRowV1[]
}) {
  if (props.rows.length === 0) return null

  return (
    <section className='space-y-3'>
      <SectionTitle>{props.title}</SectionTitle>
      <div className='overflow-hidden rounded-xl border bg-background/30'>
        {props.rows.map((row) => (
          <div
            key={row.key}
            className='flex items-center justify-between gap-4 border-b border-border/60 px-3 py-3 last:border-0'
          >
            <div className='min-w-0'>
              <div className='text-muted-foreground text-sm'>{row.label}</div>
              {row.hint ? (
                <div className='text-muted-foreground/50 mt-0.5 text-[11px]'>
                  {row.hint}
                </div>
              ) : null}
            </div>
            <div className='text-foreground shrink-0 text-right font-mono text-sm font-semibold tabular-nums'>
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}


// FEIXIANG_VIDEO_RESOLUTION_PRICING_V3_FRONTEND_DETAIL
function hasFeiXiangVideoResolutionPriceV3(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value))
}

function getFeiXiangVideoResolutionPricingV3(
  model: PricingModel
): VideoResolutionPricing | null {
  const pricing = model.video_resolution_pricing
  if (!pricing || !Array.isArray(pricing.resolutions)) return null

  const resolutions = pricing.resolutions.filter((item) => {
    if (!item || !item.resolution) return false
    return (
      hasFeiXiangVideoResolutionPriceV3(item.no_video_input) ||
      hasFeiXiangVideoResolutionPriceV3(item.with_video_input) ||
      hasFeiXiangVideoResolutionPriceV3(item.completion)
    )
  })

  if (resolutions.length === 0) return null
  return { ...pricing, resolutions }
}

function getFeiXiangVideoResolutionOrderV3(resolution: string): number {
  const normalized = String(resolution || '').toLowerCase()
  const order = ['240p', '360p', '480p', '720p', '1080p', '2k', '4k', '8k']
  const index = order.indexOf(normalized)
  return index >= 0 ? index : order.length
}

function sortFeiXiangVideoResolutionRowsV3(
  rows: VideoResolutionPricingResolution[]
): VideoResolutionPricingResolution[] {
  return [...rows].sort((a, b) => {
    const order =
      getFeiXiangVideoResolutionOrderV3(a.resolution) -
      getFeiXiangVideoResolutionOrderV3(b.resolution)
    if (order !== 0) return order
    return String(a.resolution || '').localeCompare(String(b.resolution || ''))
  })
}

function formatFeiXiangVideoResolutionNumberV3(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value === 0) return '0'
  const abs = Math.abs(value)
  const digits = abs >= 1 ? 6 : 8
  return value
    .toFixed(digits)
    .replace(/\.0+$/, '')
    .replace(/(\.\d*?)0+$/, '$1')
}

function formatFeiXiangVideoResolutionUsdV3(
  value: number | null | undefined,
  options: {
    tokenUnit: TokenUnit
    groupRatio?: number
    showRechargePrice?: boolean
    priceRate?: number
    usdExchangeRate?: number
  }
): React.ReactNode {
  if (!hasFeiXiangVideoResolutionPriceV3(value)) return <FeiXiangVideoInputMissingValueV1 />
  const numeric = Number(value)

  const tokenUnitDivisor = options.tokenUnit === 'K' ? 1000 : 1
  let displayValue = (numeric * (options.groupRatio ?? 1)) / tokenUnitDivisor

  if (options.showRechargePrice) {
    const priceRate = Math.max(Number(options.priceRate ?? 1), 0.001)
    const usdExchangeRate = Math.max(Number(options.usdExchangeRate ?? 1), 0.001)
    displayValue = (displayValue * priceRate) / usdExchangeRate
  }

  return `$${formatFeiXiangVideoResolutionNumberV3(displayValue)}`
}

function FeiXiangVideoResolutionPriceCellV3(props: {
  value: number | null | undefined
  tokenUnit: TokenUnit
  groupRatio?: number
  showRechargePrice?: boolean
  priceRate?: number
  usdExchangeRate?: number
}) {
  const tokenUnitLabel = props.tokenUnit === 'K' ? '1K' : '1M'
  return (
    <FeiXiangVideoInputUnitValueV1 unit={tokenUnitLabel}>
      {formatFeiXiangVideoResolutionUsdV3(props.value, props)}
    </FeiXiangVideoInputUnitValueV1>
  )
}

function FeiXiangVideoResolutionPricingTableV3(props: {
  pricing: VideoResolutionPricing
  tokenUnit: TokenUnit
  showRechargePrice?: boolean
  priceRate?: number
  usdExchangeRate?: number
}) {
  const { t } = useTranslation()
  const rows = sortFeiXiangVideoResolutionRowsV3(props.pricing.resolutions || [])
  const thClass =
    'text-muted-foreground whitespace-nowrap px-3 py-2 text-left text-[10px] font-medium tracking-wider uppercase'
  const tdClass = 'whitespace-nowrap px-3 py-2 align-top text-xs'

  return (
    <section className='space-y-3'>
      <SectionTitle>{t('Video Resolution Pricing')}</SectionTitle>
      <div className='overflow-x-auto rounded-xl border bg-background/30'>
        <table className='min-w-full border-collapse text-sm'>
          <thead>
            <tr className='border-b border-border/70 bg-muted/20'>
              <th className={thClass}>{t('Resolution')}</th>
              <th className={`${thClass} text-right`}>无视频输入</th>
              <th className={`${thClass} text-right`}>含视频输入</th>
              <th className={`${thClass} text-right`}>补全价格</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.resolution}
                className='border-b border-border/60 last:border-0 hover:bg-muted/20'
              >
                <td className={tdClass}>
                  <span className='font-semibold'>{row.resolution}</span>
                </td>
                <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>
                  <FeiXiangVideoResolutionPriceCellV3
                    value={row.no_video_input}
                    tokenUnit={props.tokenUnit}
                    showRechargePrice={props.showRechargePrice}
                    priceRate={props.priceRate}
                    usdExchangeRate={props.usdExchangeRate}
                  />
                </td>
                <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>
                  <FeiXiangVideoResolutionPriceCellV3
                    value={row.with_video_input}
                    tokenUnit={props.tokenUnit}
                    showRechargePrice={props.showRechargePrice}
                    priceRate={props.priceRate}
                    usdExchangeRate={props.usdExchangeRate}
                  />
                </td>
                <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>
                  <FeiXiangVideoResolutionPriceCellV3
                    value={row.completion}
                    tokenUnit={props.tokenUnit}
                    showRechargePrice={props.showRechargePrice}
                    priceRate={props.priceRate}
                    usdExchangeRate={props.usdExchangeRate}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className='text-muted-foreground/40 mt-1.5 text-[10px]'>
        {t('Prices shown per')} {props.tokenUnit === 'K' ? '1K' : '1M'} tokens
        {props.pricing.source ? ` · ${props.pricing.source}` : ''}
      </p>
    </section>
  )
}

function FeiXiangVideoResolutionGroupPricingTableV3(props: {
  model: PricingModel
  groupRatio: Record<string, number>
  usableGroup: Record<string, { desc: string; ratio: number }>
  autoGroups: string[]
  tokenUnit: TokenUnit
  showRechargePrice?: boolean
  priceRate?: number
  usdExchangeRate?: number
}) {
  const { t } = useTranslation()
  const pricing = getFeiXiangVideoResolutionPricingV3(props.model)
  if (!pricing) return null

  const availableGroups = getAvailableGroups(props.model, props.usableGroup || {})
  if (availableGroups.length === 0) {
    return (
      <section>
        <SectionTitle>{t('Pricing by Group')}</SectionTitle>
        <AutoGroupChain model={props.model} autoGroups={props.autoGroups} />
        <p className='text-muted-foreground text-sm'>
          {t(
            'This model is not available in any group, or no group pricing information is configured.'
          )}
        </p>
      </section>
    )
  }

  const rows = sortFeiXiangVideoResolutionRowsV3(pricing.resolutions || [])
  const thClass =
    'text-muted-foreground whitespace-nowrap px-3 py-2 text-left text-[10px] font-medium tracking-wider uppercase'
  const tdClass = 'whitespace-nowrap px-3 py-2 align-top text-xs'

  return (
    <section className='space-y-3'>
      <SectionTitle>{t('Pricing by Group')}</SectionTitle>
      <AutoGroupChain model={props.model} autoGroups={props.autoGroups} />
      <div className='overflow-x-auto rounded-xl border bg-background/30'>
        <table className='min-w-full border-collapse text-sm'>
          <thead>
            <tr className='border-b border-border/70 bg-muted/20'>
              <th className={thClass}>{t('Group')}</th>
              <th className={thClass}>{t('Ratio')}</th>
              <th className={thClass}>{t('Resolution')}</th>
              <th className={`${thClass} text-right`}>无视频输入</th>
              <th className={`${thClass} text-right`}>含视频输入</th>
              <th className={`${thClass} text-right`}>补全价格</th>
            </tr>
          </thead>
          <tbody>
            {availableGroups.flatMap((group) => {
              const ratio = props.groupRatio[group] || 1
              return rows.map((row, index) => (
                <tr
                  key={`${group}-${row.resolution}`}
                  className='border-b border-border/60 last:border-0 hover:bg-muted/20'
                >
                  {index === 0 ? (
                    <td className={tdClass} rowSpan={rows.length}>
                      <span className={getFeiXiangVideoInputGroupNameClassNameV1(group)}>
                        {group}
                      </span>
                    </td>
                  ) : null}
                  {index === 0 ? (
                    <td
                      className={`${tdClass} text-muted-foreground font-mono`}
                      rowSpan={rows.length}
                    >
                      {formatFeiXiangVideoInputRatioV1(ratio)}
                    </td>
                  ) : null}
                  <td className={tdClass}>
                    <span className='font-semibold'>{row.resolution}</span>
                  </td>
                  <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>
                    <FeiXiangVideoResolutionPriceCellV3
                      value={row.no_video_input}
                      tokenUnit={props.tokenUnit}
                      groupRatio={ratio}
                      showRechargePrice={props.showRechargePrice}
                      priceRate={props.priceRate}
                      usdExchangeRate={props.usdExchangeRate}
                    />
                  </td>
                  <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>
                    <FeiXiangVideoResolutionPriceCellV3
                      value={row.with_video_input}
                      tokenUnit={props.tokenUnit}
                      groupRatio={ratio}
                      showRechargePrice={props.showRechargePrice}
                      priceRate={props.priceRate}
                      usdExchangeRate={props.usdExchangeRate}
                    />
                  </td>
                  <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>
                    <FeiXiangVideoResolutionPriceCellV3
                      value={row.completion}
                      tokenUnit={props.tokenUnit}
                      groupRatio={ratio}
                      showRechargePrice={props.showRechargePrice}
                      priceRate={props.priceRate}
                      usdExchangeRate={props.usdExchangeRate}
                    />
                  </td>
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
      <p className='text-muted-foreground/40 mt-1.5 text-[10px]'>
        {t('Prices shown per')} {props.tokenUnit === 'K' ? '1K' : '1M'} tokens
      </p>
    </section>
  )
}

function getFeiXiangSeedancePricingProfile(_modelName?: string): null {
  // FEIXIANG_VIDEO_DUAL_INPUT_PRICING_V1_LEGACY_SEEDANCE_DISABLED
  return null
}

function SeedanceVideoPricingSection(_props: {
  model: PricingModel
  tokenUnit: TokenUnit
}) {
  // FEIXIANG_VIDEO_DUAL_INPUT_PRICING_V1_LEGACY_SEEDANCE_DISABLED
  return null
}

function PriceSection(props: {
  model: PricingModel
  priceRate: number
  usdExchangeRate: number
  tokenUnit: TokenUnit
  showRechargePrice: boolean
}) {
  const { t } = useTranslation()
  const isTokenBased = isTokenBasedModel(props.model)
  const tokenUnitLabel = props.tokenUnit === 'K' ? '1K' : '1M'
  const baseGroupKey = '_base'
  const baseGroupRatioMap = { [baseGroupKey]: 1 }

  // FEIXIANG_VIDEO_RESOLUTION_PRICING_V3_PRICE_SECTION_RETURN
  const videoResolutionPricing = getFeiXiangVideoResolutionPricingV3(props.model)
  if (isTokenBased && videoResolutionPricing) {
    return (
      <FeiXiangVideoResolutionPricingTableV3
        pricing={videoResolutionPricing}
        tokenUnit={props.tokenUnit}
        showRechargePrice={props.showRechargePrice}
        priceRate={props.priceRate}
        usdExchangeRate={props.usdExchangeRate}
      />
    )
  }

  const renderBaseGroupPrice = (model: PricingModel, type: PriceType) => (
    <FeiXiangVideoInputUnitValueV1 unit={tokenUnitLabel}>
      {formatGroupPrice(
        model,
        baseGroupKey,
        type,
        props.tokenUnit,
        props.showRechargePrice,
        props.priceRate,
        props.usdExchangeRate,
        baseGroupRatioMap
      )}
    </FeiXiangVideoInputUnitValueV1>
  )

  if (isTokenBased && isFeiXiangVideoPricingModelV1(props.model)) {
    const videoInputRatio = getFeiXiangVideoInputRatioPricingV1(props.model)
    const videoInputModel = videoInputRatio == null
      ? null
      : withFeiXiangVideoInputRatioPricingV1(props.model, videoInputRatio)

    return (
      <FeiXiangVideoInputPricingRowsV1
        title={t('Base Price')}
        rows={[
          {
            key: 'without-video-input',
            label: '无视频输入',
            value: renderBaseGroupPrice(props.model, 'input'),
            hint: '沿用当前输入价格 model_ratio',
          },
          {
            key: 'with-video-input',
            label: '含视频输入',
            value: videoInputModel
              ? renderBaseGroupPrice(videoInputModel, 'input')
              : <FeiXiangVideoInputMissingValueV1 />,
            hint: videoInputModel
              ? '使用独立 VideoInputRatio'
              : '请在后台配置 VideoInputRatio',
          },
        ]}
      />
    )
  }

  const dynamicSummary = getDynamicPricingSummary(props.model, {
    tokenUnit: props.tokenUnit,
    showRechargePrice: props.showRechargePrice,
    priceRate: props.priceRate,
    usdExchangeRate: props.usdExchangeRate,
    groupRatioMultiplier: 1,
  })

  if (dynamicSummary) {
    if (dynamicSummary.isSpecialExpression) {
      return (
        <section>
          <SectionTitle>{t('Base Price')}</SectionTitle>
          <div className='rounded-lg border border-amber-200/70 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10'>
            <div className='text-sm font-medium text-amber-800 dark:text-amber-200'>
              {t('Special billing expression')}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              {t('Unable to parse structured pricing')}
            </p>
            <div className='mt-3'>
              <div className='text-muted-foreground mb-1 text-[10px] font-medium tracking-wider uppercase'>
                {t('Raw expression')}
              </div>
              <code className='text-muted-foreground bg-background/80 block max-h-28 overflow-auto rounded-md border px-2 py-1.5 font-mono text-xs break-all'>
                {dynamicSummary.rawExpression}
              </code>
            </div>
          </div>
        </section>
      )
    }

    const rows: FeiXiangVideoInputPricingRowV1[] = [
      ...dynamicSummary.primaryEntries.map((entry) => ({
        key: entry.key,
        label: t(entry.shortLabel),
        value: (
          <FeiXiangVideoInputUnitValueV1 unit={tokenUnitLabel}>
            {entry.formatted}
          </FeiXiangVideoInputUnitValueV1>
        ),
      })),
      ...dynamicSummary.secondaryEntries.map((entry) => ({
        key: entry.key,
        label: t(entry.shortLabel),
        value: (
          <FeiXiangVideoInputUnitValueV1 unit={tokenUnitLabel}>
            {entry.formatted}
          </FeiXiangVideoInputUnitValueV1>
        ),
      })),
    ]

    if (rows.length === 0) {
      return (
        <section className='space-y-3'>
          <SectionTitle>{t('Base Price')}</SectionTitle>
          <p className='text-muted-foreground text-sm'>{t('Dynamic Pricing')}</p>
        </section>
      )
    }

    return <FeiXiangVideoInputPricingRowsV1 title={t('Base Price')} rows={rows} />
  }

  if (!isTokenBased) {
    return (
      <FeiXiangVideoInputPricingRowsV1
        title={t('Base Price')}
        rows={[
          {
            key: 'per-request',
            label: t('Per request'),
            value: formatFixedPrice(
              props.model,
              baseGroupKey,
              props.showRechargePrice,
              props.priceRate,
              props.usdExchangeRate,
              baseGroupRatioMap
            ),
          },
        ]}
      />
    )
  }

  const primaryPriceTypes: { label: string; type: PriceType }[] = [
    { label: t('Input'), type: 'input' },
    { label: t('Output'), type: 'output' },
  ]
  const secondaryPriceTypes: {
    label: string
    type: PriceType
    available: boolean
  }[] = [
    { label: t('Cached input'), type: 'cache', available: props.model.cache_ratio != null },
    { label: t('Cache write'), type: 'create_cache', available: props.model.create_cache_ratio != null },
    { label: t('Image input'), type: 'image', available: props.model.image_ratio != null },
    { label: t('Audio input'), type: 'audio_input', available: props.model.audio_ratio != null },
    {
      label: t('Audio output'),
      type: 'audio_output',
      available: props.model.audio_ratio != null && props.model.audio_completion_ratio != null,
    },
  ]
  const secondaryItems = secondaryPriceTypes.filter((p) => p.available)
  const rows: FeiXiangVideoInputPricingRowV1[] = [
    ...primaryPriceTypes.map((item) => ({
      key: item.type,
      label: item.label,
      value: renderBaseGroupPrice(props.model, item.type),
    })),
    ...secondaryItems.map((item) => ({
      key: item.type,
      label: item.label,
      value: renderBaseGroupPrice(props.model, item.type),
    })),
  ]

  return <FeiXiangVideoInputPricingRowsV1 title={t('Base Price')} rows={rows} />
}

// ----------------------------------------------------------------------------
// Auto group chain (used inside group pricing section)
// ----------------------------------------------------------------------------

function AutoGroupChain(props: { model: PricingModel; autoGroups: string[] }) {
  const { t } = useTranslation()
  const modelEnableGroups = Array.isArray(props.model.enable_groups)
    ? props.model.enable_groups
    : []
  const autoChain = props.autoGroups.filter((g) =>
    modelEnableGroups.includes(g)
  )

  if (autoChain.length === 0) return null

  return (
    <div className='text-muted-foreground mb-4 flex flex-wrap items-center gap-1 text-xs'>
      <span className='font-medium'>自动分组链</span>
      <span className='text-muted-foreground/40'>→</span>
      {autoChain.map((g, idx) => (
        <span key={g} className='flex items-center gap-1'>
          <GroupBadge group={g} size='sm' />
          {idx < autoChain.length - 1 && (
            <span className='text-muted-foreground/40'>→</span>
          )}
        </span>
      ))}
    </div>
  )
}

type DynamicPriceOptions = Parameters<typeof getDynamicPriceEntries>[1]
type DynamicPricingTier = ReturnType<typeof getDynamicPricingTiers>[number]
type DynamicFormattedPricesByTier = Map<DynamicPricingTier, Map<string, string>>

function getDynamicPriceFields(
  tiers: DynamicPricingTier[],
  options: DynamicPriceOptions
) {
  return Array.from(
    new Map(
      tiers
        .flatMap((tier) => getDynamicPriceEntries(tier, options))
        .map((entry) => [entry.field, entry])
    ).values()
  )
}

function getDynamicFormattedPricesByTier(
  tiers: DynamicPricingTier[],
  options: DynamicPriceOptions
): DynamicFormattedPricesByTier {
  return new Map(
    tiers.map((tier) => [
      tier,
      new Map(
        getDynamicPriceEntries(tier, options).map((entry) => [
          entry.field,
          entry.formatted,
        ])
      ),
    ])
  )
}


// FEIXIANG_SEEDANCE_DETAILS_GROUP_PRICING_COMPARE_V2_1_EXACT
// Seedance uses video-specific prices above. This comparison table keeps the
// original/default price visible and shows how each enabled group ratio produces
// the final displayed price for every resolution/input mode.
function parseFeiXiangSeedanceUsdPrice(value: string): number {
  const parsed = Number(String(value).replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function formatFeiXiangSeedanceUsdPrice(value: number): string {
  if (!Number.isFinite(value)) return '$0'
  const rounded = Math.round(value * 1_000_000) / 1_000_000
  return `$${rounded.toFixed(6).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')}`
}

function formatFeiXiangSeedanceRatio(value: number): string {
  if (!Number.isFinite(value)) return '1x'
  const rounded = Math.round(value * 10_000) / 10_000
  return `${rounded.toFixed(4).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')}x`
}

function getFeiXiangOrderedSeedanceGroups(groups: string[]): string[] {
  const result: string[] = []
  const add = (group: string) => {
    const normalized = String(group || '').trim()
    if (!normalized || result.includes(normalized)) return
    result.push(normalized)
  }
  add('default')
  groups.forEach(add)
  return result
}

// FEIXIANG_SEEDANCE_DETAILS_GROUP_PRICING_COMPARE_V2_2_RESOLUTION_DIVIDER
function FeiXiangSeedanceGroupPricingCompareTable(props: {
  model: PricingModel
  groupRatio: Record<string, number>
  usableGroup: Record<string, { desc: string; ratio: number }>
  autoGroups: string[]
  tokenUnit: TokenUnit
}) {
  const { t } = useTranslation()
  const profile = getFeiXiangSeedancePricingProfile(props.model.model_name)
  if (!profile) return null

  const availableGroups = getFeiXiangOrderedSeedanceGroups(
    getAvailableGroups(props.model, props.usableGroup || {})
  )
  const tokenUnitLabel = props.tokenUnit === 'K' ? '1K' : '1M'

  const thClass =
    'text-muted-foreground whitespace-nowrap px-3 py-2 text-left text-[10px] font-medium tracking-wider uppercase'
  const tdClass = 'whitespace-nowrap px-3 py-2 align-top text-xs'
  const resolutionDivider = 'border-l-2 border-l-primary/35'
  const resolutionHeadClass = `${thClass} ${resolutionDivider} bg-primary/5 text-primary`
  const resolutionSubHeadClass = `${thClass} bg-primary/[0.035]`
  const resolutionCellClass = `${tdClass} bg-primary/[0.025]`

  return (
    <section>
      <SectionTitle>按分组定价对比</SectionTitle>
      <AutoGroupChain model={props.model} autoGroups={props.autoGroups} />
      <div className='rounded-2xl border bg-card/40 p-4'>
        <div className='mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <div className='text-sm font-semibold'>default 基础价 × 最终倍率 = 最终价</div>
            <p className='text-muted-foreground mt-1 text-xs'>
              保留上方视频模型合并价格；这里按分组比例展示 default 基础定价与最终定价，便于对比。
            </p>
          </div>
          <div className='text-muted-foreground text-xs'>价格单位：/{tokenUnitLabel}</div>
        </div>

        <div className='overflow-x-auto rounded-xl border bg-background/30'>
          <table className='min-w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b bg-muted/30'>
                <th className={thClass}>{t('Group')}</th>
                <th className={thClass}>最终倍率</th>
                {profile.rows.map((row) => (
                  <th
                    key={`${row.resolution}-head`}
                    className={resolutionHeadClass}
                    colSpan={4}
                  >
                    <div className='flex items-center gap-2'>
                      <span className='inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary'>
                        {row.resolution}
                      </span>
                      <span className='text-muted-foreground text-[10px] font-normal normal-case'>
                        基础价 / 最终价
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
              <tr className='border-b bg-muted/20'>
                <th className={thClass}></th>
                <th className={thClass}></th>
                {profile.rows.flatMap((row) => [
                  <th
                    key={`${row.resolution}-with-base`}
                    className={`${resolutionSubHeadClass} ${resolutionDivider}`}
                  >
                    基础 含视频
                  </th>,
                  <th key={`${row.resolution}-with-final`} className={resolutionSubHeadClass}>
                    最终 含视频
                  </th>,
                  <th key={`${row.resolution}-without-base`} className={resolutionSubHeadClass}>
                    基础 无视频
                  </th>,
                  <th key={`${row.resolution}-without-final`} className={resolutionSubHeadClass}>
                    最终 无视频
                  </th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {availableGroups.map((group) => {
                const ratio = group === 'default' ? 1 : props.groupRatio[group] || 1
                return (
                  <tr key={group} className='border-b last:border-0 hover:bg-muted/20'>
                    <td className={tdClass}>
                      <GroupBadge group={group} size='sm' />
                    </td>
                    <td className={`${tdClass} font-mono font-semibold`}>
                      {formatFeiXiangSeedanceRatio(ratio)}
                    </td>
                    {profile.rows.flatMap((row) => {
                      const withVideo = parseFeiXiangSeedanceUsdPrice(
                        row.withVideoInput
                      )
                      const withoutVideo = parseFeiXiangSeedanceUsdPrice(
                        row.withoutVideoInput
                      )
                      return [
                        <td
                          key={`${group}-${row.resolution}-with-base`}
                          className={`${resolutionCellClass} ${resolutionDivider} font-mono text-muted-foreground`}
                        >
                          {formatFeiXiangSeedanceUsdPrice(withVideo)}
                        </td>,
                        <td
                          key={`${group}-${row.resolution}-with-final`}
                          className={`${resolutionCellClass} font-mono font-semibold text-primary`}
                        >
                          {formatFeiXiangSeedanceUsdPrice(withVideo * ratio)}
                        </td>,
                        <td
                          key={`${group}-${row.resolution}-without-base`}
                          className={`${resolutionCellClass} font-mono text-muted-foreground`}
                        >
                          {formatFeiXiangSeedanceUsdPrice(withoutVideo)}
                        </td>,
                        <td
                          key={`${group}-${row.resolution}-without-final`}
                          className={`${resolutionCellClass} font-mono font-semibold text-primary`}
                        >
                          {formatFeiXiangSeedanceUsdPrice(withoutVideo * ratio)}
                        </td>,
                      ]
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-[11px]'>
          <span className='inline-block h-3 border-l-2 border-primary/40' />
          <span>每个分辨率区块已用竖向分割线区分，横向滚动时更容易对照。</span>
        </div>
      </div>
    </section>
  )
}

// ----------------------------------------------------------------------------
// Group pricing table
// ----------------------------------------------------------------------------

function GroupPricingSection(props: {
  model: PricingModel
  groupRatio: Record<string, number>
  usableGroup: Record<string, { desc: string; ratio: number }>
  autoGroups: string[]
  priceRate: number
  usdExchangeRate: number
  tokenUnit: TokenUnit
  showRechargePrice?: boolean
}) {
  const { t } = useTranslation()
  const showRechargePrice = props.showRechargePrice ?? false

  const availableGroups = useMemo(
    () => getAvailableGroups(props.model, props.usableGroup || {}),
    [props.model, props.usableGroup]
  )

  const isTokenBased = isTokenBasedModel(props.model)
  const tokenUnitLabel = props.tokenUnit === 'K' ? '1K' : '1M'
  const thClass =
    'text-muted-foreground whitespace-nowrap px-3 py-2 text-left text-[10px] font-medium tracking-wider uppercase'
  const tdClass = 'whitespace-nowrap px-3 py-2 align-top text-xs'

  const extraPriceTypes = useMemo(() => {
    const types: { label: string; type: PriceType }[] = []
    if (props.model.cache_ratio != null)
      types.push({ label: t('Cache'), type: 'cache' })
    if (props.model.create_cache_ratio != null)
      types.push({ label: t('Cache Write'), type: 'create_cache' })
    if (props.model.image_ratio != null)
      types.push({ label: t('Image'), type: 'image' })
    if (props.model.audio_ratio != null)
      types.push({ label: t('Audio In'), type: 'audio_input' })
    if (
      props.model.audio_ratio != null &&
      props.model.audio_completion_ratio != null
    )
      types.push({ label: t('Audio Out'), type: 'audio_output' })
    return types
  }, [props.model, t])

  // FEIXIANG_VIDEO_RESOLUTION_PRICING_V3_GROUP_SECTION_RETURN
  if (isTokenBased && getFeiXiangVideoResolutionPricingV3(props.model)) {
    return (
      <FeiXiangVideoResolutionGroupPricingTableV3
        model={props.model}
        groupRatio={props.groupRatio}
        usableGroup={props.usableGroup}
        autoGroups={props.autoGroups}
        tokenUnit={props.tokenUnit}
        showRechargePrice={showRechargePrice}
        priceRate={props.priceRate}
        usdExchangeRate={props.usdExchangeRate}
      />
    )
  }

  if (availableGroups.length === 0) {
    return (
      <section>
        <SectionTitle>{t('Pricing by Group')}</SectionTitle>
        <AutoGroupChain model={props.model} autoGroups={props.autoGroups} />
        <p className='text-muted-foreground text-sm'>
          {t(
            'This model is not available in any group, or no group pricing information is configured.'
          )}
        </p>
      </section>
    )
  }

  if (isTokenBased && isFeiXiangVideoPricingModelV1(props.model)) {
    const videoInputRatio = getFeiXiangVideoInputRatioPricingV1(props.model)
    const videoInputModel = videoInputRatio == null
      ? null
      : withFeiXiangVideoInputRatioPricingV1(props.model, videoInputRatio)
    const renderNoVideoInputPrice = (group: string) => (
      <FeiXiangVideoInputUnitValueV1 unit={tokenUnitLabel}>
        {formatGroupPrice(
          props.model,
          group,
          'input',
          props.tokenUnit,
          showRechargePrice,
          props.priceRate,
          props.usdExchangeRate,
          props.groupRatio
        )}
      </FeiXiangVideoInputUnitValueV1>
    )
    const renderWithVideoInputPrice = (group: string) =>
      videoInputModel ? (
        <FeiXiangVideoInputUnitValueV1 unit={tokenUnitLabel}>
          {formatGroupPrice(
            videoInputModel,
            group,
            'input',
            props.tokenUnit,
            showRechargePrice,
            props.priceRate,
            props.usdExchangeRate,
            props.groupRatio
          )}
        </FeiXiangVideoInputUnitValueV1>
      ) : (
        <FeiXiangVideoInputMissingValueV1 />
      )

    return (
      <section className='space-y-3'>
        <SectionTitle>{t('Pricing by Group')}</SectionTitle>
        <AutoGroupChain model={props.model} autoGroups={props.autoGroups} />
        <div className='overflow-x-auto rounded-xl border bg-background/30'>
          <table className='min-w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b border-border/70 bg-muted/20'>
                <th className={thClass}>{t('Group')}</th>
                <th className={thClass}>{t('Ratio')}</th>
                <th className={`${thClass} text-right`}>无视频输入</th>
                <th className={`${thClass} text-right`}>含视频输入</th>
              </tr>
            </thead>
            <tbody>
              {availableGroups.map((group) => {
                const ratio = props.groupRatio[group] || 1
                return (
                  <tr
                    key={group}
                    className='border-b border-border/60 last:border-0 hover:bg-muted/20'
                  >
                    <td className={tdClass}>
                      <span className={getFeiXiangVideoInputGroupNameClassNameV1(group)}>
                        {group}
                      </span>
                    </td>
                    <td className={`${tdClass} text-muted-foreground font-mono`}>
                      {formatFeiXiangVideoInputRatioV1(ratio)}
                    </td>
                    <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>
                      {renderNoVideoInputPrice(group)}
                    </td>
                    <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>
                      {renderWithVideoInputPrice(group)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className='text-muted-foreground/40 mt-1.5 text-[10px]'>
          {t('Prices shown per')} {tokenUnitLabel} tokens；无视频输入价格，含视频输入价格使用 VideoInputRatio。
        </p>
      </section>
    )
  }

  if (isDynamicPricingModel(props.model)) {
    const dynamicTiers = getDynamicPricingTiers(props.model)
    if (dynamicTiers.length === 0) {
      return (
        <section>
          <SectionTitle>{t('Pricing by Group')}</SectionTitle>
          <AutoGroupChain model={props.model} autoGroups={props.autoGroups} />
          <div className='rounded-lg border border-amber-200/70 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10'>
            <div className='text-sm font-medium text-amber-800 dark:text-amber-200'>{t('Special billing expression')}</div>
            <p className='text-muted-foreground mt-1 text-xs'>{t('Group prices cannot be expanded because this expression is not a standard tiered pricing expression.')}</p>
            <div className='mt-3'>
              <div className='text-muted-foreground mb-1 text-[10px] font-medium tracking-wider uppercase'>{t('Raw expression')}</div>
              <code className='text-muted-foreground bg-background/80 block max-h-28 overflow-auto rounded-md border px-2 py-1.5 font-mono text-xs break-all'>{props.model.billing_expr}</code>
            </div>
          </div>
        </section>
      )
    }
    const priceFields = getDynamicPriceFields(dynamicTiers, { tokenUnit: props.tokenUnit, showRechargePrice, priceRate: props.priceRate, usdExchangeRate: props.usdExchangeRate, groupRatioMultiplier: 1 })
    const formattedPricesByGroup = new Map(availableGroups.map((group) => {
      const ratio = props.groupRatio[group] || 1
      return [group, getDynamicFormattedPricesByTier(dynamicTiers, { tokenUnit: props.tokenUnit, showRechargePrice, priceRate: props.priceRate, usdExchangeRate: props.usdExchangeRate, groupRatioMultiplier: ratio })] as const
    }))
    return (
      <section className='space-y-3'>
        <SectionTitle>{t('Pricing by Group')}</SectionTitle>
        <AutoGroupChain model={props.model} autoGroups={props.autoGroups} />
        <div className='space-y-3'>
          {availableGroups.map((group) => {
            const ratio = props.groupRatio[group] || 1
            const formattedPricesByTier = formattedPricesByGroup.get(group) ?? new Map<DynamicPricingTier, Map<string, string>>()
            return (
              <div key={group} className='overflow-hidden rounded-xl border bg-background/30'>
                <div className='bg-muted/20 flex items-center justify-between gap-3 border-b px-3 py-2'>
                  <span className={getFeiXiangVideoInputGroupNameClassNameV1(group)}>{group}</span>
                  <span className='text-muted-foreground font-mono text-xs'>{formatFeiXiangVideoInputRatioV1(ratio)}</span>
                </div>
                <div className='overflow-x-auto'>
                  <table className='min-w-full border-collapse text-sm'>
                    <thead><tr className='border-b bg-muted/20'><th className={thClass}>{t('Tier')}</th>{priceFields.map((fieldEntry) => <th key={fieldEntry.field} className={`${thClass} text-right`}>{t(fieldEntry.shortLabel)}</th>)}</tr></thead>
                    <tbody>{dynamicTiers.map((tier, tierIndex) => <tr key={`${group}-${tier.label || tierIndex}`} className='border-b last:border-0 hover:bg-muted/20'><td className={`${tdClass} text-muted-foreground`}>{tier.label || t('Default')}</td>{priceFields.map((fieldEntry) => <td key={fieldEntry.field} className={`${tdClass} text-right font-mono`}>{formattedPricesByTier.get(tier)?.get(fieldEntry.field) ?? '-'}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </div>
            )
          })}
          <p className='text-muted-foreground/40 mt-1.5 text-[10px]'>{t('Prices shown per')} {tokenUnitLabel} tokens</p>
        </div>
      </section>
    )
  }

  const renderGroupPrice = (group: string, type: PriceType) => formatGroupPrice(props.model, group, type, props.tokenUnit, showRechargePrice, props.priceRate, props.usdExchangeRate, props.groupRatio)
  const renderFixedGroupPrice = (group: string) => formatFixedPrice(props.model, group, showRechargePrice, props.priceRate, props.usdExchangeRate, props.groupRatio)
  const priceColumns: { key: string; label: React.ReactNode; render: (group: string) => React.ReactNode }[] = isTokenBased
    ? [
        { key: 'input', label: t('Input'), render: (group: string) => renderGroupPrice(group, 'input') },
        { key: 'output', label: t('Output'), render: (group: string) => renderGroupPrice(group, 'output') },
        ...extraPriceTypes.map((ep) => ({ key: ep.type, label: ep.label, render: (group: string) => renderGroupPrice(group, ep.type) })),
      ]
    : [{ key: 'price', label: t('Price'), render: renderFixedGroupPrice }]
  return (
    <section className='space-y-3'>
      <SectionTitle>{t('Pricing by Group')}</SectionTitle>
      <AutoGroupChain model={props.model} autoGroups={props.autoGroups} />
      <div className='overflow-x-auto rounded-xl border bg-background/30'>
        <table className='min-w-full border-collapse text-sm'>
          <thead><tr className='border-b border-border/70 bg-muted/20'><th className={thClass}>{t('Group')}</th><th className={thClass}>{t('Ratio')}</th>{priceColumns.map((column) => <th key={column.key} className={`${thClass} text-right`}>{column.label}</th>)}</tr></thead>
          <tbody>{availableGroups.map((group) => { const ratio = props.groupRatio[group] || 1; return <tr key={group} className='border-b border-border/60 last:border-0 hover:bg-muted/20'><td className={tdClass}><span className={getFeiXiangVideoInputGroupNameClassNameV1(group)}>{group}</span></td><td className={`${tdClass} text-muted-foreground font-mono`}>{formatFeiXiangVideoInputRatioV1(ratio)}</td>{priceColumns.map((column) => <td key={column.key} className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{column.render(group)}</td>)}</tr> })}</tbody>
        </table>
      </div>
      {isTokenBased ? <p className='text-muted-foreground/40 mt-1.5 text-[10px]'>{t('Prices shown per')} {tokenUnitLabel} tokens</p> : null}
    </section>
  )
}


const TAB_VALUES = ['overview', 'performance', 'api'] as const
type TabValue = (typeof TAB_VALUES)[number]

const TAB_META: Record<
  TabValue,
  { icon: React.ComponentType<{ className?: string }>; labelKey: string }
> = {
  overview: { icon: Info, labelKey: 'Overview' },
  performance: { icon: HeartPulse, labelKey: 'Performance' },
  api: { icon: Code2, labelKey: 'API' },
}

export interface ModelDetailsContentProps {
  model: PricingModel
  groupRatio: Record<string, number>
  usableGroup: Record<string, { desc: string; ratio: number }>
  endpointMap: Record<string, { path?: string; method?: string }>
  autoGroups: string[]
  priceRate: number
  usdExchangeRate: number
  tokenUnit: TokenUnit
  showRechargePrice?: boolean
}

export function ModelDetailsContent(props: ModelDetailsContentProps) {
  const { t } = useTranslation()
  const showRechargePrice = props.showRechargePrice ?? false

  const isDynamic =
    props.model.billing_mode === 'tiered_expr' &&
    Boolean(props.model.billing_expr)

  return (
    <div className='@container/details space-y-4'>
      <ModelHeader model={props.model} />

      <Tabs defaultValue='overview' className='gap-4'>
        <TabsList className='bg-muted/60 grid w-full grid-cols-3 gap-1 rounded-lg p-1 group-data-horizontal/tabs:h-auto'>
          {TAB_VALUES.map((value) => {
            const Icon = TAB_META[value].icon
            return (
              <TabsTrigger
                key={value}
                value={value}
                className='h-8 min-w-0 gap-1.5 rounded-md px-3 text-xs sm:text-sm'
              >
                <Icon className='size-3.5' />
                <span className='truncate'>{t(TAB_META[value].labelKey)}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value='overview' className='space-y-6 outline-none'>
          <OverviewSummaryGrid model={props.model} />

          <section className='bg-card/60 space-y-6 rounded-3xl border border-border/70 p-4 shadow-sm sm:p-5'>
            <SectionTitle>{t('Pricing')}</SectionTitle>
            <PriceSection
              model={props.model}
              priceRate={props.priceRate}
              usdExchangeRate={props.usdExchangeRate}
              tokenUnit={props.tokenUnit}
              showRechargePrice={showRechargePrice}
            />
            {isDynamic && (
              <DynamicPricingBreakdown billingExpr={props.model.billing_expr} />
            )}
            <GroupPricingSection
              model={props.model}
              groupRatio={props.groupRatio}
              usableGroup={props.usableGroup}
              autoGroups={props.autoGroups}
              priceRate={props.priceRate}
              usdExchangeRate={props.usdExchangeRate}
              tokenUnit={props.tokenUnit}
              showRechargePrice={showRechargePrice}
            />
          </section>

          <ModelBackendDetailsSection model={props.model} />
        </TabsContent>

        <TabsContent value='performance' className='outline-none'>
          <ModelDetailsPerformance model={props.model} />
        </TabsContent>

        <TabsContent value='api' className='outline-none'>
          <ModelDetailsApi
            model={props.model}
            endpointMap={props.endpointMap}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Drawer & page wrappers
// ----------------------------------------------------------------------------

export interface ModelDetailsDrawerProps extends ModelDetailsContentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModelDetailsDrawer(props: ModelDetailsDrawerProps) {
  const { t } = useTranslation()
  const { open, onOpenChange, ...contentProps } = props

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className={sideDrawerContentClassName(
          'sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl'
        )}
      >
        <SheetHeader className='sr-only'>
          <SheetTitle>{props.model.model_name}</SheetTitle>
          <SheetDescription>{t('Model details')}</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto px-4 pt-11 pb-5 sm:px-6 sm:pt-12 sm:pb-6'>
          <ModelDetailsContent {...contentProps} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ModelDetails() {
  const { t } = useTranslation()
  const { modelId } = useParams({ from: '/pricing/$modelId/' })
  const search = useSearch({ from: '/pricing/$modelId/' })
  const navigate = useNavigate()

  const {
    models,
    groupRatio,
    usableGroup,
    endpointMap,
    autoGroups,
    isLoading,
    priceRate,
    usdExchangeRate,
  } = usePricingData()

  const tokenUnit: TokenUnit =
    search.tokenUnit === 'K' ? 'K' : DEFAULT_TOKEN_UNIT

  const model = useMemo(() => {
    if (!models || !modelId) return null
    return models.find((m) => m.model_name === modelId) || null
  }, [models, modelId])

  const handleBack = () => {
    navigate({ to: '/pricing', search })
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <div className='mx-auto max-w-5xl px-4 sm:px-6'>
          <Skeleton className='mb-4 h-5 w-16' />
          <div className='space-y-2'>
            <Skeleton className='h-7 w-64' />
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-4 w-full max-w-md' />
          </div>
          <div className='mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
          <div className='mt-6 space-y-3'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-24 w-full' />
            ))}
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (!model) {
    return (
      <PublicLayout>
        <div className='mx-auto max-w-2xl px-4 text-center sm:px-6'>
          <h2 className='mb-1 text-base font-semibold'>
            {t('Model not found')}
          </h2>
          <p className='text-muted-foreground mb-4 text-sm'>
            {t("The model you're looking for doesn't exist.")}
          </p>
          <Button onClick={handleBack} variant='outline' size='sm'>
            {t('Back to Models')}
          </Button>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className='mx-auto max-w-5xl px-4 sm:px-6'>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleBack}
          className='text-muted-foreground hover:text-foreground mb-4 h-auto gap-1 px-0 py-1 text-xs'
        >
          <ArrowLeft className='size-3.5' />
          {t('Back')}
        </Button>

        <ModelDetailsContent
          model={model}
          groupRatio={groupRatio || {}}
          usableGroup={usableGroup || {}}
          autoGroups={autoGroups || []}
          priceRate={priceRate ?? 1}
          usdExchangeRate={usdExchangeRate ?? 1}
          tokenUnit={tokenUnit}
          showRechargePrice={search.rechargePrice ?? false}
          endpointMap={
            (endpointMap as Record<
              string,
              { path?: string; method?: string }
            >) || {}
          }
        />
      </div>
    </PublicLayout>
  )
}
