import { useEffect } from 'react'

// FEIXIANG_VIDEO_DUAL_PRICE_V4_INPUTS_HARD_REWRITE
// 这个文件只导出 ModelPricingSheet 使用的 PriceInput / PriceLane。
// 目的：视频模型保留补全价格 CompletionRatio，并独立显示/保存 VideoInputRatio。

type AnyForm = {
  watch?: (name?: any) => any
  getValues?: (name?: any) => any
  setValue?: (name: any, value: any, options?: any) => void
}

type AnyProps = Record<string, any>

const FEIXIANG_VIDEO_DUAL_PRICE_MODEL_RE_V4 =
  /(seedance|veo|kling|sora|wan|hailuo|skyreels|video)/i

const FORM_SET_OPTIONS = {
  shouldDirty: true,
  shouldValidate: true,
}

function isVideoPricingModelV4(modelName?: string | null): boolean {
  return FEIXIANG_VIDEO_DUAL_PRICE_MODEL_RE_V4.test(String(modelName || ''))
}

function readFormValue(form: AnyForm | undefined, fieldName: string): string {
  if (!form || !fieldName) return ''
  try {
    const watched = form.watch?.(fieldName)
    if (watched !== undefined && watched !== null) return String(watched)
  } catch {}
  try {
    const value = form.getValues?.(fieldName)
    if (value !== undefined && value !== null) return String(value)
  } catch {}
  return ''
}

function writeFormValue(
  form: AnyForm | undefined,
  fieldName: string,
  value: string,
  props: AnyProps,
  options?: { mirrorCompletionRatio?: boolean }
) {
  if (form?.setValue && fieldName) {
    form.setValue(fieldName, value, FORM_SET_OPTIONS)
    if (options?.mirrorCompletionRatio && fieldName !== 'completionRatio') {
      form.setValue('completionRatio', value, FORM_SET_OPTIONS)
    }
  }
  if (typeof props.onChange === 'function') props.onChange(value)
  if (typeof props.onValueChange === 'function') props.onValueChange(value)
  if (typeof props.onRatioChange === 'function') props.onRatioChange(value)
}

function getForm(props: AnyProps): AnyForm | undefined {
  return props.form || props.formContext || props.methods
}

function getModelName(props: AnyProps): string {
  const form = getForm(props)
  return (
    String(props.modelName || '') ||
    readFormValue(form, 'name') ||
    String(props.nameValue || '') ||
    String(props.model || '')
  )
}

// FEIXIANG_VIDEO_DUAL_PRICE_V6_INPUT_LANE_FIX

// FEIXIANG_VIDEO_DUAL_PRICE_V7_MODELNAME_LANE_FIX
function getFeiXiangVideoDualPriceModelNameV7(props: AnyProps): string {
  const form = props.form
  const fromGetValues =
    form && typeof form.getValues === 'function' ? form.getValues('name') : ''
  const fromWatch =
    form && typeof form.watch === 'function' ? form.watch('name') : ''

  return String(
    props.modelName ||
      props.currentModelName ||
      props.model_name ||
      props.modelId ||
      props.model ||
      props.editData?.name ||
      fromGetValues ||
      fromWatch ||
      ''
  )
}

function getInputFieldName(props: AnyProps): string {
  return String(
    props.fieldName ||
      props.field ||
      props.name ||
      props.ratioField ||
      props.ratioName ||
      'ratio'
  )
}

function getLaneFieldName(props: AnyProps, isVideo: boolean): string {
  const lane = String(props.lane || props.type || props.kind || '')
  const explicit = String(
    props.fieldName ||
      props.field ||
      props.name ||
      props.ratioField ||
      props.ratioName ||
      ''
  )

  const normalized = `${lane}|${explicit}`
    .toLowerCase()
    .replace(/[\s_-]/g, '')

  // FEIXIANG_VIDEO_DUAL_PRICE_V9_KEEP_COMPLETION_AND_VIDEO_INPUT
  // completion/output 仍然是“补全价格”；只有真实 videoInput lane 才保存到 VideoInputRatio。
  if (
    isVideo &&
    (
      normalized.includes('videoinputratio') ||
      normalized.includes('videoinput') ||
      normalized.includes('withvideo')
    )
  ) {
    return 'videoInputRatio'
  }

  const laneMap: Record<string, string> = {
    prompt: 'ratio',
    input: 'ratio',
    ratio: 'ratio',
    completion: 'completionRatio',
    output: 'completionRatio',
    cache: 'cacheRatio',
    cacheRatio: 'cacheRatio',
    create_cache: 'createCacheRatio',
    createCache: 'createCacheRatio',
    createCacheRatio: 'createCacheRatio',
    image: 'imageRatio',
    imageRatio: 'imageRatio',
    videoInput: 'videoInputRatio',
    video_input: 'videoInputRatio',
    videoInputRatio: 'videoInputRatio',
    withVideoInput: 'videoInputRatio',
    audioInput: 'audioRatio',
    audioOutput: 'audioCompletionRatio',
    audio: 'audioRatio',
    audioRatio: 'audioRatio',
    audio_completion: 'audioCompletionRatio',
    audioCompletion: 'audioCompletionRatio',
    audioCompletionRatio: 'audioCompletionRatio',
  }

  return explicit || laneMap[lane] || lane || 'ratio'
}

function getLabelForInput(props: AnyProps, isVideo: boolean, fieldName: string): string {
  if (isVideo && fieldName === 'ratio') return '无视频输入价格'
  if (fieldName === 'price') return '固定请求价格'

  const label = String(props.label || props.title || '')
  if (label && label !== '输入价格') return label

  return '输入价格'
}

function getLabelForLane(props: AnyProps, isVideo: boolean, fieldName: string): string {
  const field = String(fieldName || '')

  // 字段语义优先级必须高于父组件传入的“附加价格”
  if (isVideo && field === 'videoInputRatio') return '含视频输入价格'
  if (field === 'completionRatio') return '补全价格'
  if (field === 'cacheRatio') return '缓存读取价格'
  if (field === 'createCacheRatio') return '缓存写入价格'
  if (field === 'imageRatio') return '图片输入价格'
  if (field === 'audioRatio') return '音频输入价格'
  if (field === 'audioCompletionRatio') return '音频输出价格'

  const label = String(props.label || props.title || '')
  if (label && label !== '附加价格') return label

  return '附加价格'
}

function getDescriptionForInput(props: AnyProps, isVideo: boolean, fieldName: string): string {
  if (isVideo && fieldName === 'ratio') {
    return '普通文本输入 token 的美元价格，保存到 ModelRatio。'
  }

  const description = String(props.description || props.hint || '')
  if (description) return description

  return '每 100 万输入 token 的美元价格。'
}

function getDescriptionForLane(props: AnyProps, isVideo: boolean, fieldName: string): string {
  const field = String(fieldName || '')

  // 字段语义优先级必须高于父组件传入的通用 description
  if (isVideo && field === 'videoInputRatio') {
    return '带图片 / 视频输入 token 的美元价格，保存到 VideoInputRatio。'
  }
  if (field === 'completionRatio') return '生成内容的输出 token 价格。'
  if (field === 'cacheRatio') return '缓存读取 token 价格。'
  if (field === 'createCacheRatio') return '缓存写入 token 价格。'
  if (field === 'imageRatio') return '图片输入 token 价格。'
  if (field === 'audioRatio') return '音频输入 token 价格。'
  if (field === 'audioCompletionRatio') return '音频输出 token 价格。'

  const description = String(props.description || props.hint || '')
  if (description) return description

  return '可选附加 token 价格。'
}

function PriceNumberInput(props: AnyProps & {
  fieldName: string
  label: string
  description: string
  mirrorCompletionRatio?: boolean
}) {
  const form = getForm(props)
  const valueFromForm = readFormValue(form, props.fieldName)
  const value = valueFromForm || String(props.value ?? '')

  useEffect(() => {
    if (!props.mirrorCompletionRatio) return
    if (!form?.setValue) return
    const mirrored = readFormValue(form, 'completionRatio')
    if (value && mirrored !== value) {
      form.setValue('completionRatio', value, FORM_SET_OPTIONS)
    }
  }, [form, props.mirrorCompletionRatio, value])

  return (
    <div className='space-y-2 rounded-xl border border-border/60 bg-background/45 p-3'>
      <div className='flex items-center justify-between gap-3'>
        <label className='text-sm font-medium text-foreground'>{props.label}</label>
        <span className='text-muted-foreground text-xs'>$/1M</span>
      </div>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground text-sm'>$</span>
        <input
          className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
          type='number'
          step='any'
          min='0'
          value={value}
          placeholder={String(props.placeholder ?? '0')}
          disabled={Boolean(props.disabled || props.isDisabled)}
          onChange={(event) =>
            writeFormValue(form, props.fieldName, event.target.value, props, {
              mirrorCompletionRatio: props.mirrorCompletionRatio,
            })
          }
        />
      </div>
      {props.description ? (
        <p className='text-muted-foreground text-xs leading-5'>{props.description}</p>
      ) : null}
    </div>
  )
}

export function PriceInput(props: AnyProps) {
  const modelName = getModelName(props)
  const isVideo = isVideoPricingModelV4(modelName)
  const fieldName = getInputFieldName(props)
  return (
    <PriceNumberInput
      {...props}
      fieldName={fieldName}
      label={getLabelForInput(props, isVideo, fieldName)}
      description={getDescriptionForInput(props, isVideo, fieldName)}
    />
  )
}

export function PriceLane(props: AnyProps) {
  const modelName = getModelName(props)
  const isVideo = isVideoPricingModelV4(modelName)
  const fieldName = getLaneFieldName(props, isVideo)
  const mirrorCompletionRatio = false // FEIXIANG_VIDEO_DUAL_PRICE_FINAL_NO_MIRROR_COMPLETION

  return (
    <PriceNumberInput
      {...props}
      fieldName={fieldName}
      label={getLabelForLane(props, isVideo, fieldName)}
      description={getDescriptionForLane(props, isVideo, fieldName)}
      mirrorCompletionRatio={mirrorCompletionRatio}
    />
  )
}
