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
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { getPerfMetricsSummary } from '@/features/performance-metrics/api'
import { DEFAULT_PRICING_PAGE_SIZE, DEFAULT_TOKEN_UNIT } from '../constants'
import type { PricingModel, TokenUnit } from '../types'
import { ModelCard } from './model-card'
import type { ModelPerfBadgeData } from './model-perf-badge'

export interface ModelCardGridProps {
  models: PricingModel[]
  onModelClick: (modelName: string) => void
  priceRate?: number
  usdExchangeRate?: number
  tokenUnit?: TokenUnit
  showRechargePrice?: boolean
}

// FEIXIANG_SEEDANCE_PRICING_GROUPED_DISPLAY_V4_2_GRID
type FeiXiangSeedanceGroupedModel = PricingModel & {
  feiXiangDisplayModelName?: string
  feiXiangRepresentativeModelName?: string
  feiXiangSeedanceGroupItems?: PricingModel[]
}

function getFeiXiangSeedanceGroupKey(modelName?: string): string | null {
  const name = (modelName || '').trim()
  if (/^seedance-2\.0-fast-(480p|720p)$/i.test(name)) return 'seedance-2.0-fast'
  if (/^seedance-2\.0-(480p|720p|1080p|4k)$/i.test(name)) return 'seedance-2.0'
  return null
}

function getFeiXiangSeedanceResolutionWeight(modelName?: string): number {
  const name = (modelName || '').toLowerCase()
  if (name.endsWith('-480p')) return 10
  if (name.endsWith('-720p')) return 20
  if (name.endsWith('-1080p')) return 30
  if (name.endsWith('-4k')) return 40
  return 999
}

function buildFeiXiangSeedanceGroupedModels(
  models: PricingModel[]
): FeiXiangSeedanceGroupedModel[] {
  const groupMap = new Map<string, PricingModel[]>()
  const output: Array<PricingModel | { feiXiangSeedanceGroupKey: string }> = []

  for (const model of models) {
    const groupKey = getFeiXiangSeedanceGroupKey(model.model_name)
    if (!groupKey) {
      output.push(model)
      continue
    }

    const existing = groupMap.get(groupKey)
    if (existing) {
      existing.push(model)
      continue
    }

    groupMap.set(groupKey, [model])
    output.push({ feiXiangSeedanceGroupKey: groupKey })
  }

  return output.map((item) => {
    const groupKey = 'feiXiangSeedanceGroupKey' in item
      ? item.feiXiangSeedanceGroupKey
      : null

    if (!groupKey) return item as FeiXiangSeedanceGroupedModel

    const groupItems = [...(groupMap.get(groupKey) || [])].sort(
      (a, b) =>
        getFeiXiangSeedanceResolutionWeight(a.model_name) -
        getFeiXiangSeedanceResolutionWeight(b.model_name)
    )
    const representative = groupItems[0]

    if (!representative) return item as FeiXiangSeedanceGroupedModel

    return {
      ...representative,
      feiXiangDisplayModelName: groupKey,
      feiXiangRepresentativeModelName: representative.model_name,
      feiXiangSeedanceGroupItems: groupItems,
    }
  })
}





export function ModelCardGrid(props: ModelCardGridProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const pageSize = DEFAULT_PRICING_PAGE_SIZE
  const tokenUnit = props.tokenUnit ?? DEFAULT_TOKEN_UNIT
  const groupedModels = useMemo(
    () => buildFeiXiangSeedanceGroupedModels(props.models),
    [props.models]
  )
  const totalPages = Math.max(1, Math.ceil(groupedModels.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const perfQuery = useQuery({
    queryKey: ['perf-metrics-summary', 24],
    queryFn: () => getPerfMetricsSummary(24),
    staleTime: 60 * 1000,
    retry: false,
  })

  const pagedModels = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return groupedModels.slice(start, start + pageSize)
  }, [currentPage, groupedModels, pageSize])

  const perfMap = useMemo(() => {
    const map = new Map<string, ModelPerfBadgeData>()
    for (const model of perfQuery.data?.data?.models ?? []) {
      map.set(model.model_name, model)
    }
    return map
  }, [perfQuery.data])

  if (groupedModels.length === 0) {
    return null
  }

  return (
    <div className='space-y-4 sm:space-y-5'>
      <div className='grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {pagedModels.map((model) => (
          <ModelCard
            key={model.id ?? model.model_name}
            model={model}
            tokenUnit={tokenUnit}
            priceRate={props.priceRate}
            usdExchangeRate={props.usdExchangeRate}
            showRechargePrice={props.showRechargePrice}
            perf={perfMap.get(model.model_name || '')}
            onClick={() =>
              props.onModelClick(
                model.feiXiangRepresentativeModelName || model.model_name || ''
              )
            }
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className='text-muted-foreground flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:flex-row'>
          <p className='text-muted-foreground'>
            {t('Page {{current}} of {{total}}', {
              current: currentPage,
              total: totalPages,
            })}
          </p>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1}
              className='gap-1.5'
            >
              <ChevronLeft className='size-4' />
              {t('Previous page')}
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={currentPage >= totalPages}
              className='gap-1.5'
            >
              {t('Next page')}
              <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
