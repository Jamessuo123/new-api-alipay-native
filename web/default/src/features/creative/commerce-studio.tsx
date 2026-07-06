import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  Film,
  FolderOpen,
  Grid3X3,
  Heart,
  HelpCircle,
  ImageIcon,
  Layers3,
  List,
  Loader2,
  Menu,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Video,
  WandSparkles,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getCommonHeaders } from '@/lib/api'
import './creative-firefly.css'

type CreativePage = 'home' | 'workbench' | 'projects' | 'assets' | 'publish' | 'settings'
type CreativeMode = 'image' | 'video' | 'main'
type VideoReferenceMode = 'multi' | 'frames'
type Notice = { type: 'success' | 'error' | 'info'; text: string } | null

type CreativeTask = {
  id: number | string
  task_no?: string
  type?: string
  status?: string
  model?: string
  prompt?: string
  negative_prompt?: string
  params?: Record<string, unknown>
  result_assets?: unknown
  error_message?: string
  created_at?: number
  updated_at?: number
}

type CreativeAsset = {
  id: number | string
  task_id?: number | string
  type?: string
  source?: string
  model?: string
  url?: string
  thumbnail_url?: string
  prompt_snapshot?: string
  favorite?: boolean
  created_at?: number
  updated_at?: number
}

type CreativeProject = {
  id: number | string
  name?: string
  title?: string
  status?: string
  platform?: string
  category?: string
  asset_count?: number
  updated_at?: number
  created_at?: number
}

type ImageRatio = '1:1' | '3:4' | '4:5' | '16:9' | '9:16'
type VideoRatio = '16:9' | '9:16' | '1:1'
type ImageResolution = '1K' | '2K' | '4K'
type VideoResolution = '720p' | '1080p'

type GeneratorSettings = {
  imageModel: string
  videoModel: string
  imageRatio: ImageRatio
  videoRatio: VideoRatio
  imageResolution: ImageResolution
  videoResolution: VideoResolution
  count: 1 | 2 | 4
  duration: 5 | 10 | 15
  quality: 'standard' | 'high'
  style: '默认' | '摄影' | '插画' | '电影感' | '电商'
  platform: '淘宝' | '小红书' | '抖音' | '闲鱼'
}

const DEFAULT_SETTINGS: GeneratorSettings = {
  imageModel: 'gpt-image-2',
  videoModel: 'seedance-2.0-720p',
  imageRatio: '1:1',
  videoRatio: '16:9',
  imageResolution: '1K',
  videoResolution: '720p',
  count: 4,
  duration: 10,
  quality: 'standard',
  style: '默认',
  platform: '淘宝',
}

const imageModels = ['gpt-image-2', 'gpt-image-1', 'dall-e-3']
const videoModels = ['seedance-2.0-720p', 'veo-3.1', 'kling-3.0', 'sora-2']
const imageRatios: ImageRatio[] = ['1:1', '3:4', '4:5', '16:9', '9:16']
const videoRatios: VideoRatio[] = ['16:9', '9:16', '1:1']
const imageResolutions: ImageResolution[] = ['1K', '2K', '4K']
const videoResolutions: VideoResolution[] = ['720p', '1080p']

const inspirationItems = [
  { src: '/creative-firefly/astronaut.webp', title: '星际探索', prompt: '宇航员坐在月球表面，电影级光影，超现实摄影' },
  { src: '/creative-firefly/house.webp', title: '现代建筑', prompt: '暮色中的现代住宅，温暖室内灯光，建筑摄影' },
  { src: '/creative-firefly/cat.webp', title: '萌宠摄影', prompt: '毛茸茸的猫咪商业肖像，柔光，高级质感' },
  { src: '/creative-firefly/landscape.webp', title: '幻想世界', prompt: '云端城堡与山谷湖泊，史诗奇幻概念艺术' },
  { src: '/creative-firefly/aurora.webp', title: '极光秘境', prompt: '森林上空的绿色极光，梦幻夜景' },
  { src: '/creative-firefly/robot.webp', title: '未来机器人', prompt: '可爱机器人角色，电影概念设计' },
  { src: '/creative-firefly/interior.webp', title: '室内空间', prompt: '高端客厅室内设计，温暖自然光' },
  { src: '/creative-firefly/portrait.webp', title: '人物肖像', prompt: '电影感女性肖像，柔和轮廓光' },
]

function cx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(' ')
}

function getModeFromLocation(): CreativeMode {
  if (typeof window === 'undefined') return 'image'
  const value = new URLSearchParams(window.location.search).get('mode')
  return value === 'image' || value === 'video' || value === 'main' ? value : 'image'
}

function getPromptFromLocation() {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('prompt') || ''
}

function setModeQuery(mode: CreativeMode) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set('mode', mode)
  window.history.replaceState(null, '', url.toString())
}

function safeTime(ts?: number) {
  if (!ts) return '刚刚'
  return new Date(ts * 1000).toLocaleString('zh-CN', { hour12: false })
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message || '请求失败，请稍后重试'
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    for (const key of ['message', 'error', 'msg', 'detail']) {
      const value = record[key]
      if (typeof value === 'string' && value.trim()) return value
      if (value && typeof value === 'object') {
        const nested = formatError(value)
        if (nested !== '请求失败，请稍后重试') return nested
      }
    }
  }
  return '请求失败，请稍后重试'
}

function normalizeCreativeApiUrl(url: string) {
  return url
    .replace('/api/creative/assets/self', '/api/creative/assets')
    .replace('/api/creative/generations/self', '/api/creative/tasks')
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const requestUrl = normalizeCreativeApiUrl(url)
  const response = await fetch(requestUrl, {
    credentials: 'same-origin',
    headers: { ...getCommonHeaders(), ...(init?.headers || {}) },
    ...init,
  })
  const text = await response.text()
  let payload: unknown = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = text
  }
  if (!response.ok) throw new Error(formatError(payload) || `请求失败：${response.status}`)
  if (payload && typeof payload === 'object') {
    const wrapped = payload as { success?: boolean; message?: string; data?: T }
    if (wrapped.success === false) throw new Error(wrapped.message || '请求失败，请稍后重试')
    if ('data' in wrapped) return wrapped.data as T
  }
  return payload as T
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (!payload || typeof payload !== 'object') return []
  const record = payload as Record<string, unknown>
  for (const key of ['items', 'list', 'records', 'rows']) {
    if (Array.isArray(record[key])) return record[key] as T[]
  }
  if (record.data && typeof record.data === 'object') return unwrapList<T>(record.data)
  return []
}

function collectUrls(value: unknown, urls = new Set<string>(), depth = 0): string[] {
  if (depth > 5 || value == null) return [...urls]
  if (typeof value === 'string') {
    if (/^(https?:\/\/|\/|data:image|data:video)/i.test(value)) urls.add(value)
    return [...urls]
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectUrls(item, urls, depth + 1))
    return [...urls]
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['url', 'image_url', 'video_url', 'thumbnail_url', 'src', 'output']) {
      collectUrls(record[key], urls, depth + 1)
    }
    Object.values(record).forEach((item) => collectUrls(item, urls, depth + 1))
  }
  return [...urls]
}

function taskStatusLabel(status?: string) {
  const normalized = (status || '').toLowerCase()
  if (['success', 'succeeded', 'completed', 'done'].includes(normalized)) return '已完成'
  if (['failed', 'error'].includes(normalized)) return '失败'
  if (['running', 'processing', 'in_progress'].includes(normalized)) return '生成中'
  return '排队中'
}

function NoticeBar({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  if (!notice) return null
  return (
    <div className={cx('fxc-notice', `fxc-notice--${notice.type}`)}>
      <span>{notice.text}</span>
      <button type='button' onClick={onClose} aria-label='关闭提示'><X size={15} /></button>
    </div>
  )
}

function CreativeShell({ active, children, home = false }: { active: CreativePage; children: ReactNode; home?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const nav = [
    { key: 'workbench' as const, label: '工作台', href: '/creative/workbench?mode=image', icon: WandSparkles },
    { key: 'assets' as const, label: '素材库', href: '/creative/assets', icon: Layers3 },
    { key: 'projects' as const, label: '项目', href: '/creative/projects', icon: FolderOpen },
    { key: 'publish' as const, label: '发布', href: '/creative/publish', icon: Download },
    { key: 'settings' as const, label: '设置', href: '/creative/settings', icon: Settings },
  ]

  if (home) {
    return <div className='fxc-root fxc-root--home'><main className='fxc-home-main'>{children}</main></div>
  }

  return (
    <div className='fxc-root fxc-root--app'>
      <header className='fxc-app-header'>
        <div className='fxc-app-header__inner'>
          <a href='/creative' className='fxc-app-brand' aria-label='返回 FeiXiangApi AI 创作中心'>
            <span className='fxc-app-brand__logo'><img src='/images/feixiang-logo.png' alt='' /></span>
            <span className='fxc-app-brand__copy'><strong>FeiXiangApi</strong><small>创作中心</small></span>
          </a>

          <nav className='fxc-app-nav' aria-label='创作中心导航'>
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <a key={item.key} href={item.href} className={cx(active === item.key && 'is-active')}>
                  <Icon size={15} />
                  <span>{item.label}</span>
                </a>
              )
            })}
          </nav>

          <div className='fxc-app-actions'>
            <a href='/docs' className='fxc-app-action fxc-app-action--quiet'><HelpCircle size={16} /><span>帮助</span></a>
            <a href='/dashboard' className='fxc-app-action fxc-app-action--primary'><ArrowRight size={16} /><span>API 控制台</span></a>
            <button type='button' className='fxc-app-menu-button' onClick={() => setMobileOpen((current) => !current)} aria-expanded={mobileOpen} aria-label='打开创作中心导航'>
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className='fxc-app-mobile-panel'>
            <nav aria-label='移动端创作中心导航'>
              {nav.map((item) => {
                const Icon = item.icon
                return (
                  <a key={item.key} href={item.href} className={cx(active === item.key && 'is-active')} onClick={() => setMobileOpen(false)}>
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </a>
                )
              })}
            </nav>
            <div>
              <a href='/docs' onClick={() => setMobileOpen(false)}><HelpCircle size={16} />帮助文档</a>
              <a href='/dashboard' onClick={() => setMobileOpen(false)}><ArrowRight size={16} />API 控制台</a>
            </div>
          </div>
        )}
      </header>
      <main className='fxc-main'>{children}</main>
    </div>
  )
}

function ToolCard({ mode, title, description, icon }: { mode: CreativeMode; title: string; description: string; icon: ReactNode }) {
  return (
    <a href={`/creative/workbench?mode=${mode}`} className={`fxc-tool-card fxc-tool-card--${mode}`}>
      <span className='fxc-tool-card__icon'>{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className='fxc-tool-card__cta'>立即创作 <ArrowRight size={15} /></span>
    </a>
  )
}

function CreativeHome() {
  const [quickMode, setQuickMode] = useState<CreativeMode>('image')
  const [quickPrompt, setQuickPrompt] = useState('')
  const startQuick = () => {
    const promptQuery = quickPrompt.trim() ? `&prompt=${encodeURIComponent(quickPrompt.trim())}` : ''
    window.location.href = `/creative/workbench?mode=${quickMode}${promptQuery}`
  }

  return (
    <CreativeShell active='home' home>
      <section className='fxc-home-hero'>
        <div className='fxc-home-art' aria-hidden='true'>
          <i className='fxc-planet fxc-planet--one' />
          <i className='fxc-planet fxc-planet--two' />
          <i className='fxc-wave fxc-wave--one' />
          <i className='fxc-wave fxc-wave--two' />
          <i className='fxc-wave fxc-wave--three' />
        </div>
        <div className='fxc-home-copy'>
          <span className='fxc-eyebrow'><Sparkles size={14} /> AI 创作中心</span>
          <h1>AI <em>创作中心</em></h1>
          <p>释放你的创意，轻松生成高质量图片与视频</p>
          <div className='fxc-feature-pills'>
            <span>简单易用</span><span>高质量输出</span><span>多模型支持</span><span>商用可用</span>
          </div>
        </div>

        <div className='fxc-home-tools'>
          <ToolCard mode='image' title='AI 生图' description='从文本生成高质量图片，支持多种风格和比例' icon={<ImageIcon size={24} />} />
          <ToolCard mode='video' title='AI 生视频' description='生成商品短视频、动态展示和创意片段' icon={<Video size={24} />} />
          <ToolCard mode='main' title='商品主图' description='一键生成电商主图，适配多平台尺寸规范' icon={<Package size={24} />} />
        </div>
      </section>

      <section className='fxc-inspiration'>
        <div className='fxc-section-heading'>
          <div><span>灵感探索</span><h2>热门创作风格</h2></div>
          <a href='/creative/assets'>查看素材库 <ArrowRight size={15} /></a>
        </div>
        <div className='fxc-inspiration-row'>
          {inspirationItems.slice(0, 6).map((item) => (
            <a key={item.title} href={`/creative/workbench?mode=image&prompt=${encodeURIComponent(item.prompt)}`} className='fxc-inspiration-card'>
              <img src={item.src} alt={item.title} />
              <span>{item.title}</span>
            </a>
          ))}
        </div>
      </section>
    </CreativeShell>
  )
}

function WorkspaceTabs({ mode, onChange }: { mode: CreativeMode; onChange: (mode: CreativeMode) => void }) {
  const tabs = [
    { key: 'image' as const, label: 'AI 生图', icon: ImageIcon },
    { key: 'video' as const, label: 'AI 生视频', icon: Video },
    { key: 'main' as const, label: '商品主图', icon: Package },
  ]
  return (
    <div className='fxc-workspace-tabs'>
      {tabs.map((tab) => {
        const Icon = tab.icon
        return <button type='button' key={tab.key} onClick={() => onChange(tab.key)} className={mode === tab.key ? 'is-active' : ''}><Icon size={16} />{tab.label}</button>
      })}
    </div>
  )
}

function ResultCard({ src, task, index }: { src?: string; task?: CreativeTask; index: number }) {
  const fallback = inspirationItems[index % inspirationItems.length]
  const isVideo = task?.type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(src || '')
  return (
    <article className='fxc-result-card'>
      <div className='fxc-result-card__media'>
        {src ? (
          isVideo ? <video src={src} controls preload='metadata' /> : <img src={src} alt={task?.prompt || '生成结果'} />
        ) : (
          <img src={fallback.src} alt={fallback.title} />
        )}
        {task && <span className={cx('fxc-status', `is-${(task.status || 'pending').toLowerCase()}`)}>{taskStatusLabel(task.status)}</span>}
        <div className='fxc-result-card__hover'>
          {src && <a href={src} download><Download size={16} />下载</a>}
          <button type='button' onClick={() => navigator.clipboard?.writeText(task?.prompt || fallback.prompt)}><Copy size={16} />复制提示词</button>
        </div>
      </div>
    </article>
  )
}

function EmptyCanvas({ mode }: { mode: CreativeMode }) {
  const data = mode === 'video'
    ? { title: '开始你的第一次视频创作', desc: '在左侧选择参考方式并填写视频描述，生成结果将在这里展示。', firstStep: '添加参考素材' }
    : mode === 'main'
      ? { title: '开始你的第一套商品主图', desc: '在左侧上传商品素材并填写卖点，生成结果将在这里展示。', firstStep: '上传商品图' }
      : { title: '开始你的第一次创作', desc: '在左侧添加参考素材和提示词，生成结果将在这里展示。', firstStep: '上传素材' }

  return (
    <div className='fxc-empty-canvas'>
      <span className='fxc-empty-canvas__brand'><img src='/images/feixiang-logo.png' alt='' /></span>
      <span className='fxc-empty-canvas__eyebrow'>FeiXiangApi Creative</span>
      <h3>{data.title}</h3>
      <p>{data.desc}</p>
      <div className='fxc-empty-steps' aria-label='创作步骤'>
        <span><i>1</i>{data.firstStep}</span>
        <b>→</b>
        <span><i>2</i>填写描述</span>
        <b>→</b>
        <span><i>3</i>开始生成</span>
      </div>
    </div>
  )
}

function CreativeConfigPanel({
  mode,
  prompt,
  onPrompt,
  referenceNames,
  onReferenceNames,
  videoReferenceMode,
  onVideoReferenceMode,
  firstFrameName,
  onFirstFrame,
  lastFrameName,
  onLastFrame,
  settings,
  onChange,
  onSubmit,
  submitting,
}: {
  mode: CreativeMode
  prompt: string
  onPrompt: (value: string) => void
  referenceNames: string[]
  onReferenceNames: (value: string[]) => void
  videoReferenceMode: VideoReferenceMode
  onVideoReferenceMode: (value: VideoReferenceMode) => void
  firstFrameName: string
  onFirstFrame: (value: string) => void
  lastFrameName: string
  onLastFrame: (value: string) => void
  settings: GeneratorSettings
  onChange: (settings: GeneratorSettings) => void
  onSubmit: () => void
  submitting: boolean
}) {
  const isVideo = mode === 'video'
  const isMain = mode === 'main'
  const ratios = isVideo ? videoRatios : imageRatios
  const promptPlaceholder = isVideo
    ? '描述视频主体、动作、镜头运动、场景变化和风格...'
    : isMain
      ? '描述商品主体、核心卖点、目标人群、画面风格和投放场景...'
      : '描述画面主体、场景、风格、光线、构图和细节...'
  const modelHelp = isVideo
    ? '选择用于当前视频任务的生成模型'
    : isMain
      ? '商品主图将使用所选图片模型生成'
      : '选择用于当前图片任务的生成模型'
  const presetItems = isVideo
    ? ['电影运镜', '产品展示', '环绕镜头', '慢动作', '广告短片']
    : isMain
      ? ['白底商品', '促销海报', '高级棚拍', '小红书封面', '电商详情']
      : ['产品摄影', '电影感', '极简海报', '小红书风格', '商业棚拍']
  const settingsSummary = isVideo
    ? `${settings.videoModel} · ${settings.videoRatio} · ${settings.videoResolution} · ${settings.duration} 秒`
    : `${settings.imageModel} · ${settings.imageRatio} · ${settings.imageResolution} · ${settings.count} 张`
  const singleReferenceName = referenceNames[0] || ''
  const referenceSummary = isVideo
    ? videoReferenceMode === 'multi'
      ? referenceNames.length
        ? `多图参考 · 已选 ${referenceNames.length} 张`
        : '多图参考 · 未添加参考图'
      : `${firstFrameName ? '首帧已添加' : '未添加首帧'} · ${lastFrameName ? '尾帧已添加' : '未添加尾帧'}`
    : singleReferenceName || (isMain ? '未添加商品图' : '未添加参考图')

  const SquareUpload = ({
    label,
    selectedLabel,
    value,
    hint,
    multiple = false,
    onFiles,
    onClear,
  }: {
    label: string
    selectedLabel: string
    value: string
    hint: string
    multiple?: boolean
    onFiles: (files: FileList | null) => void
    onClear: () => void
  }) => (
    <div className='fxc-square-upload-wrap'>
      <label className={cx('fxc-square-upload', value && 'has-file')} title={value || label}>
        <input type='file' accept='image/*' multiple={multiple} onChange={(event) => onFiles(event.target.files)} />
        <span className='fxc-square-upload__icon'>{value ? <ImageIcon size={22} /> : <Plus size={24} />}</span>
        <strong>{value ? selectedLabel : label}</strong>
        <small>{value || hint}</small>
      </label>
      {value && (
        <button type='button' className='fxc-square-upload__clear' onClick={onClear} aria-label={`移除${label}`}>
          <X size={13} />
        </button>
      )}
    </div>
  )

  return (
    <aside className='fxc-config-panel'>
      <div className='fxc-config-panel__scroll'>
        <div className='fxc-config-heading'>
          <div><span>创作配置</span></div>
          <SlidersHorizontal size={18} />
        </div>

        <section className='fxc-reference-hero'>
          <div className='fxc-config-label'>
            <label>{isVideo ? '视频参考' : isMain ? '商品图' : '参考图（可选）'}</label>
            <small>{isVideo ? '先选择参考方式' : 'JPG / PNG，建议不超过 10MB'}</small>
          </div>

          {isVideo && (
            <div className='fxc-reference-mode-selector' role='tablist' aria-label='视频参考方式'>
              <button
                type='button'
                role='tab'
                aria-selected={videoReferenceMode === 'multi'}
                className={videoReferenceMode === 'multi' ? 'is-active' : ''}
                onClick={() => onVideoReferenceMode('multi')}
              >
                <Layers3 size={14} />多图参考
              </button>
              <button
                type='button'
                role='tab'
                aria-selected={videoReferenceMode === 'frames'}
                className={videoReferenceMode === 'frames' ? 'is-active' : ''}
                onClick={() => onVideoReferenceMode('frames')}
              >
                <Film size={14} />首尾帧参考
              </button>
            </div>
          )}

          <div className={cx('fxc-square-upload-grid', isVideo && videoReferenceMode === 'frames' ? 'is-double' : 'is-single')}>
            {isVideo ? (
              videoReferenceMode === 'multi' ? (
                <SquareUpload
                  label='添加参考图'
                  selectedLabel={`已选 ${referenceNames.length} 张`}
                  value={referenceNames.length ? referenceNames.join('、') : ''}
                  hint='可一次选择多张'
                  multiple
                  onFiles={(files) => onReferenceNames(Array.from(files || []).map((file) => file.name))}
                  onClear={() => onReferenceNames([])}
                />
              ) : (
                <>
                  <SquareUpload
                    label='上传首帧'
                    selectedLabel='首帧已添加'
                    value={firstFrameName}
                    hint='起始画面'
                    onFiles={(files) => onFirstFrame(files?.[0]?.name || '')}
                    onClear={() => onFirstFrame('')}
                  />
                  <SquareUpload
                    label='上传尾帧'
                    selectedLabel='尾帧已添加'
                    value={lastFrameName}
                    hint='结束画面'
                    onFiles={(files) => onLastFrame(files?.[0]?.name || '')}
                    onClear={() => onLastFrame('')}
                  />
                </>
              )
            ) : (
              <SquareUpload
                label={isMain ? '上传商品图' : '上传参考图'}
                selectedLabel={isMain ? '商品图已添加' : '参考图已添加'}
                value={singleReferenceName}
                hint='点击选择图片'
                onFiles={(files) => onReferenceNames(files?.[0]?.name ? [files[0].name] : [])}
                onClear={() => onReferenceNames([])}
              />
            )}
          </div>
        </section>

        <section className='fxc-prompt-hero'>
          <div className='fxc-config-label'><label>提示词</label><small>{prompt.length}/1000</small></div>
          <textarea
            className='fxc-config-prompt'
            value={prompt}
            maxLength={1000}
            onChange={(event) => onPrompt(event.target.value)}
            placeholder={promptPlaceholder}
          />
          <div className='fxc-config-presets' aria-label='常用提示词风格'>
            {presetItems.map((item) => (
              <button type='button' key={item} onClick={() => onPrompt(prompt ? `${prompt}，${item}` : item)}>{item}</button>
            ))}
          </div>
        </section>

        <details className='fxc-generation-settings'>
          <summary>
            <span className='fxc-generation-settings__icon'><SlidersHorizontal size={16} /></span>
            <span className='fxc-generation-settings__summary'>
              <strong>生成设置</strong>
              <small>{settingsSummary}</small>
              <em title={referenceSummary}>{referenceSummary}</em>
            </span>
            <ChevronRight size={17} className='fxc-generation-settings__chevron' />
          </summary>

          <div className='fxc-generation-settings__body'>
            <section className='fxc-settings-block'>
              <label>模型</label>
              <select
                value={isVideo ? settings.videoModel : settings.imageModel}
                onChange={(event) => onChange({ ...settings, [isVideo ? 'videoModel' : 'imageModel']: event.target.value })}
              >
                {(isVideo ? videoModels : imageModels).map((model) => <option key={model}>{model}</option>)}
              </select>
              <small className='fxc-field-help'>{modelHelp}</small>
            </section>

            <div className='fxc-settings-compact-grid'>
              <label className='fxc-compact-control'>
                <span>{isVideo ? '视频比例' : '图片比例'}</span>
                <select
                  value={isVideo ? settings.videoRatio : settings.imageRatio}
                  onChange={(event) => onChange(isVideo
                    ? { ...settings, videoRatio: event.target.value as VideoRatio }
                    : { ...settings, imageRatio: event.target.value as ImageRatio })}
                >
                  {ratios.map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
                </select>
              </label>

              <label className='fxc-compact-control'>
                <span>{isVideo ? '视频分辨率' : '图片分辨率'}</span>
                <select
                  value={isVideo ? settings.videoResolution : settings.imageResolution}
                  onChange={(event) => onChange(isVideo
                    ? { ...settings, videoResolution: event.target.value as VideoResolution }
                    : { ...settings, imageResolution: event.target.value as ImageResolution })}
                >
                  {(isVideo ? videoResolutions : imageResolutions).map((resolution) => <option key={resolution} value={resolution}>{resolution}</option>)}
                </select>
              </label>

              {isVideo ? (
                <label className='fxc-compact-control'>
                  <span>视频时长</span>
                  <select value={settings.duration} onChange={(event) => onChange({ ...settings, duration: Number(event.target.value) as 5 | 10 | 15 })}>
                    {([5, 10, 15] as const).map((duration) => <option key={duration} value={duration}>{duration} 秒</option>)}
                  </select>
                </label>
              ) : (
                <div className='fxc-compact-control'>
                  <span>生成数量</span>
                  <div className='fxc-stepper'>
                    <button type='button' onClick={() => onChange({ ...settings, count: Math.max(1, settings.count / 2) as 1 | 2 | 4 })}>−</button>
                    <strong>{settings.count}</strong>
                    <button type='button' onClick={() => onChange({ ...settings, count: Math.min(4, settings.count * 2) as 1 | 2 | 4 })}>＋</button>
                  </div>
                </div>
              )}

              {!isVideo && (
                <label className='fxc-compact-control'>
                  <span>图片质量</span>
                  <select value={settings.quality} onChange={(event) => onChange({ ...settings, quality: event.target.value as 'standard' | 'high' })}>
                    <option value='standard'>标准</option>
                    <option value='high'>高质量</option>
                  </select>
                </label>
              )}
            </div>

            {!isVideo && (
              <section className='fxc-settings-block fxc-settings-block--compact'>
                <label>视觉风格</label>
                <div className='fxc-style-chips'>
                  {(['默认', '摄影', '插画', '电影感', '电商'] as const).map((style) => (
                    <button type='button' key={style} className={settings.style === style ? 'is-active' : ''} onClick={() => onChange({ ...settings, style })}>{style}</button>
                  ))}
                </div>
              </section>
            )}

            {isMain && (
              <section className='fxc-settings-block fxc-settings-block--compact'>
                <label>目标平台</label>
                <div className='fxc-style-chips'>
                  {(['淘宝', '小红书', '抖音', '闲鱼'] as const).map((platform) => (
                    <button type='button' key={platform} className={settings.platform === platform ? 'is-active' : ''} onClick={() => onChange({ ...settings, platform })}>{platform}</button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </details>
      </div>

      <div className='fxc-config-footer'>
        <div><strong>{isVideo ? `预计生成 ${settings.duration} 秒视频` : `预计生成 ${settings.count} 张图片`}</strong><small>Ctrl + Enter</small></div>
        <button type='button' className='fxc-generate-button' disabled={submitting} onClick={onSubmit}>
          {submitting ? <Loader2 size={17} className='fxc-spin' /> : <WandSparkles size={17} />}
          {isVideo ? '生成视频' : isMain ? '生成主图' : '生成图片'}
        </button>
      </div>
    </aside>
  )
}

function WorkbenchPage() {
  const [mode, setModeState] = useState<CreativeMode>(() => getModeFromLocation())
  const [prompt, setPrompt] = useState(() => getPromptFromLocation())
  const [imageReferenceNames, setImageReferenceNames] = useState<string[]>([])
  const [videoReferenceNames, setVideoReferenceNames] = useState<string[]>([])
  const [mainReferenceNames, setMainReferenceNames] = useState<string[]>([])
  const [videoReferenceMode, setVideoReferenceMode] = useState<VideoReferenceMode>('multi')
  const [firstFrameName, setFirstFrameName] = useState('')
  const [lastFrameName, setLastFrameName] = useState('')
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [tasks, setTasks] = useState<CreativeTask[]>([])
  const [notice, setNotice] = useState<Notice>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeResultIndex, setActiveResultIndex] = useState(0)

  const referenceNames = mode === 'video'
    ? videoReferenceNames
    : mode === 'main'
      ? mainReferenceNames
      : imageReferenceNames
  const setReferenceNames = mode === 'video'
    ? setVideoReferenceNames
    : mode === 'main'
      ? setMainReferenceNames
      : setImageReferenceNames

  const setMode = (next: CreativeMode) => {
    setModeQuery(next)
    setModeState(next)
  }

  const loadTasks = useCallback(async () => {
    setLoading(true)
    const endpoints = ['/api/creative/tasks?page=1&p=24']
    for (const endpoint of endpoints) {
      try {
        const payload = await apiRequest<unknown>(endpoint)
        setTasks(unwrapList<CreativeTask>(payload))
        setLoading(false)
        return
      } catch {
        // Try the next compatible endpoint. Background history loading must not block creation.
      }
    }
    setTasks([])
    setLoading(false)
  }, [])

  useEffect(() => { void loadTasks() }, [loadTasks])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        void submit()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const modeTasks = useMemo(() => tasks.filter((task) => mode === 'main' ? task.type !== 'video' : task.type === mode), [tasks, mode])
  const results = useMemo(() => modeTasks.flatMap((task) => {
    const urls = collectUrls(task.result_assets)
    return urls.length ? urls.map((url) => ({ task, url })) : [{ task, url: undefined }]
  }).slice(0, 4), [modeTasks])

  useEffect(() => { setActiveResultIndex(0) }, [mode, results.length])

  const activeResult = results[Math.min(activeResultIndex, Math.max(results.length - 1, 0))]
  const showPreviousResult = () => setActiveResultIndex((current) => results.length ? (current - 1 + results.length) % results.length : 0)
  const showNextResult = () => setActiveResultIndex((current) => results.length ? (current + 1) % results.length : 0)

  const submit = async () => {
    if (!prompt.trim()) {
      setNotice({ type: 'error', text: mode === 'main' ? '请先填写商品卖点和主图要求。' : '请先输入生成描述。' })
      return
    }
    const referenceAssets = mode === 'video'
      ? videoReferenceMode === 'multi'
        ? referenceNames.map((name) => ({ name, type: 'image' }))
        : [firstFrameName, lastFrameName].filter(Boolean).map((name) => ({ name, type: 'image' }))
      : referenceNames.slice(0, 1).map((name) => ({ name, type: 'image' }))

    setSubmitting(true)
    try {
      await apiRequest('/api/creative/generations', {
        method: 'POST',
        body: JSON.stringify({
          type: mode === 'video' ? 'video' : 'image',
          status: 'pending',
          model: mode === 'video' ? settings.videoModel : settings.imageModel,
          prompt: prompt.trim(),
          negative_prompt: '',
          params: {
            mode,
            ratio: mode === 'video' ? settings.videoRatio : settings.imageRatio,
            resolution: mode === 'video' ? settings.videoResolution : settings.imageResolution,
            count: settings.count,
            duration: settings.duration,
            quality: settings.quality,
            style: settings.style,
            platform: settings.platform,
            referenceMode: mode === 'video' ? videoReferenceMode : 'single',
            referenceName: referenceNames[0] || '',
            referenceNames: mode === 'video' && videoReferenceMode === 'multi' ? referenceNames : referenceNames.slice(0, 1),
            firstFrameName: mode === 'video' && videoReferenceMode === 'frames' ? firstFrameName : '',
            lastFrameName: mode === 'video' && videoReferenceMode === 'frames' ? lastFrameName : '',
          },
          reference_assets: referenceAssets,
          result_assets: [],
        }),
      })
      setNotice({ type: 'success', text: '生成任务已提交，可在结果区查看状态。' })
      await loadTasks()
    } catch (error) {
      setNotice({ type: 'error', text: formatError(error) })
    } finally {
      setSubmitting(false)
    }
  }

  const title = mode === 'image' ? 'AI 生图' : mode === 'video' ? 'AI 生视频' : '商品主图'
  const desc = mode === 'image' ? '输入描述、选择参数，生成精美图片' : mode === 'video' ? '选择参考方式并描述镜头，生成动态视频' : '上传商品图并描述卖点，生成适配平台的电商主图'

  return (
    <CreativeShell active='workbench'>
      <NoticeBar notice={notice} onClose={() => setNotice(null)} />
      <div className='fxc-workbench-topbar'>
        <div className='fxc-workbench-title'><h1>{title}</h1><p>{desc}</p></div>
        <WorkspaceTabs mode={mode} onChange={setMode} />
        <div className='fxc-heading-actions'>
          <button type='button' onClick={() => void loadTasks()} title='刷新历史任务'>{loading ? <Loader2 size={16} className='fxc-spin' /> : <Clock3 size={16} />}<span>历史记录</span></button>
          <a href='/creative/assets' title='打开素材库'><Heart size={16} /><span>素材库</span></a>
          <button type='button' aria-label='网格视图' title='网格视图'><Grid3X3 size={16} /></button>
        </div>
      </div>

      <div className={cx('fxc-workbench-layout', mode === 'video' && 'is-video')}>
        <CreativeConfigPanel
          mode={mode}
          prompt={prompt}
          onPrompt={setPrompt}
          referenceNames={referenceNames}
          onReferenceNames={setReferenceNames}
          videoReferenceMode={videoReferenceMode}
          onVideoReferenceMode={setVideoReferenceMode}
          firstFrameName={firstFrameName}
          onFirstFrame={setFirstFrameName}
          lastFrameName={lastFrameName}
          onLastFrame={setLastFrameName}
          settings={settings}
          onChange={setSettings}
          onSubmit={() => void submit()}
          submitting={submitting}
        />

        <section className='fxc-canvas-panel'>
          <div className='fxc-canvas-toolbar'>
            <div><span>{results.length ? `${activeResultIndex + 1} / ${results.length} 个结果` : '生成结果'}</span><small>最近任务 {modeTasks.length}</small></div>
            <div>
              <button type='button' onClick={showPreviousResult} disabled={results.length <= 1} title='上一个结果'><ChevronLeft size={16} /></button>
              <button type='button' onClick={showNextResult} disabled={results.length <= 1} title='下一个结果'><ChevronRight size={16} /></button>
            </div>
          </div>

          {activeResult ? (
            <>
              <div className='fxc-preview-stage'>
                <ResultCard src={activeResult.url} task={activeResult.task} index={activeResultIndex} />
              </div>
              {results.length > 1 && (
                <div className='fxc-result-thumbnails' aria-label='生成结果列表'>
                  {results.map((item, index) => {
                    const thumb = item.url || inspirationItems[index % inspirationItems.length].src
                    const isVideoThumb = item.task?.type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(item.url || '')
                    return (
                      <button
                        type='button'
                        key={`${item.task.id}-${item.url || index}`}
                        className={index === activeResultIndex ? 'is-active' : ''}
                        onClick={() => setActiveResultIndex(index)}
                        aria-label={`查看第 ${index + 1} 个结果`}
                      >
                        {isVideoThumb && item.url ? <video src={item.url} muted preload='metadata' /> : <img src={thumb} alt='' />}
                        <span>{index + 1}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <EmptyCanvas mode={mode} />
          )}
        </section>
      </div>

      <section className='fxc-workbench-inspiration'>
        <div className='fxc-section-heading'><div><span>灵感探索</span><h2>点击示例快速开始</h2></div></div>
        <div className='fxc-inspiration-row'>
          {inspirationItems.slice(0, 6).map((item) => <button type='button' key={item.title} className='fxc-inspiration-card' onClick={() => setPrompt(item.prompt)}><img src={item.src} alt={item.title} /><span>{item.title}</span></button>)}
        </div>
      </section>
    </CreativeShell>
  )
}

function AssetsPage() {
  const [assets, setAssets] = useState<CreativeAsset[]>([])
  const [notice, setNotice] = useState<Notice>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'favorite'>('all')
  const [query, setQuery] = useState('')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')

  const loadAssets = useCallback(async () => {
    setLoading(true)
    try {
      const payload = await apiRequest<unknown>('/api/creative/assets?page=1&p=100')
      setAssets(unwrapList<CreativeAsset>(payload))
    } catch (error) {
      setNotice({ type: 'error', text: formatError(error) })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadAssets() }, [loadAssets])

  const visible = useMemo(() => assets.filter((asset) => {
    if (filter === 'image' && asset.type !== 'image') return false
    if (filter === 'video' && asset.type !== 'video') return false
    if (filter === 'favorite' && !asset.favorite) return false
    if (query && !(asset.prompt_snapshot || asset.model || '').toLowerCase().includes(query.toLowerCase())) return false
    return true
  }), [assets, filter, query])

  const removeAsset = async (asset: CreativeAsset) => {
    if (!window.confirm('确定删除这个素材吗？')) return
    try {
      await apiRequest(`/api/creative/assets/${asset.id}`, { method: 'DELETE' })
      setAssets((current) => current.filter((item) => item.id !== asset.id))
      setNotice({ type: 'success', text: '素材已删除。' })
    } catch (error) {
      setNotice({ type: 'error', text: formatError(error) })
    }
  }

  return (
    <CreativeShell active='assets'>
      <NoticeBar notice={notice} onClose={() => setNotice(null)} />
      <div className='fxc-page-heading'>
        <div><span>素材管理</span><h1>素材库</h1><p>管理你的所有创作素材</p></div>
        <button type='button' className='fxc-primary fxc-primary--small' onClick={() => void loadAssets()}>{loading ? <Loader2 size={16} className='fxc-spin' /> : <RefreshCw size={16} />}刷新</button>
      </div>

      <div className='fxc-asset-toolbar'>
        <div className='fxc-asset-tabs'>
          {([['all', '全部'], ['image', '图片'], ['video', '视频'], ['favorite', '收藏']] as const).map(([key, label]) => <button type='button' key={key} onClick={() => setFilter(key)} className={filter === key ? 'is-active' : ''}>{label}</button>)}
        </div>
        <label className='fxc-search'><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='搜索素材名称或关键词' /></label>
        <button type='button' className='fxc-filter-button'><SlidersHorizontal size={16} />筛选</button>
        <button type='button' className='fxc-filter-button'><MoreHorizontal size={16} />排序</button>
        <div className='fxc-layout-toggle'><button type='button' className={layout === 'grid' ? 'is-active' : ''} onClick={() => setLayout('grid')}><Grid3X3 size={16} /></button><button type='button' className={layout === 'list' ? 'is-active' : ''} onClick={() => setLayout('list')}><List size={16} /></button></div>
      </div>

      {visible.length ? (
        <div className={cx('fxc-asset-grid', layout === 'list' && 'is-list')}>
          {visible.map((asset, index) => {
            const src = asset.thumbnail_url || asset.url || inspirationItems[index % inspirationItems.length].src
            return (
              <article className='fxc-asset-card' key={asset.id}>
                <div className='fxc-asset-card__media'>
                  {asset.type === 'video' ? <video src={asset.url || undefined} poster={asset.thumbnail_url || inspirationItems[index % inspirationItems.length].src} controls /> : <img src={src} alt={asset.prompt_snapshot || '创作素材'} />}
                  <span>{asset.type === 'video' ? '视频' : '图片'}</span>
                </div>
                <div className='fxc-asset-card__body'><h3>{asset.prompt_snapshot || '未命名素材'}</h3><p>{asset.model || '默认模型'} · {safeTime(asset.created_at)}</p><div><a href={asset.url || src} download><Download size={14} /></a><button type='button'><Bookmark size={14} /></button><button type='button' onClick={() => void removeAsset(asset)}><Trash2 size={14} /></button></div></div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className='fxc-assets-empty'>
          <span><Layers3 size={28} /></span><h2>暂无素材</h2><p>完成一次 AI 生图或 AI 生视频后，结果会自动进入素材库。</p><a href='/creative/workbench?mode=image' className='fxc-primary'>开始创作</a>
          <div className='fxc-assets-empty__showcase'>{inspirationItems.slice(0, 4).map((item) => <img key={item.title} src={item.src} alt={item.title} />)}</div>
        </div>
      )}
    </CreativeShell>
  )
}

function ProjectsPage() {
  const [projects, setProjects] = useState<CreativeProject[]>([])
  const [notice, setNotice] = useState<Notice>(null)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [projectLayout, setProjectLayout] = useState<'grid' | 'table'>('grid')

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const payload = await apiRequest<unknown>('/api/creative/projects?page=1&p=100')
      setProjects(unwrapList<CreativeProject>(payload))
    } catch (error) {
      setNotice({ type: 'error', text: formatError(error) })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadProjects() }, [loadProjects])

  const visible = projects.filter((project) => (project.name || project.title || '').toLowerCase().includes(query.toLowerCase()))

  const createProject = async () => {
    if (!newName.trim()) return
    try {
      await apiRequest('/api/creative/projects', { method: 'POST', body: JSON.stringify({ name: newName.trim(), title: newName.trim(), status: 'draft' }) })
      setNewName('')
      setShowCreate(false)
      setNotice({ type: 'success', text: '项目已创建。' })
      await loadProjects()
    } catch (error) {
      setNotice({ type: 'error', text: formatError(error) })
    }
  }

  return (
    <CreativeShell active='projects'>
      <NoticeBar notice={notice} onClose={() => setNotice(null)} />
      <div className='fxc-page-heading'>
        <div><span>项目管理</span><h1>项目管理</h1><p>管理你的创作项目，轻松组织和查找</p></div>
        <button type='button' className='fxc-primary fxc-primary--small' onClick={() => setShowCreate(true)}><Plus size={16} />新建项目</button>
      </div>

      <div className='fxc-project-toolbar'>
        <label className='fxc-search'><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='搜索项目名称' /></label>
        <button type='button' className='fxc-filter-button'><SlidersHorizontal size={16} />筛选</button>
        <div className='fxc-layout-toggle'><button type='button' className={projectLayout === 'grid' ? 'is-active' : ''} onClick={() => setProjectLayout('grid')} aria-label='卡片视图'><Grid3X3 size={16} /></button><button type='button' className={projectLayout === 'table' ? 'is-active' : ''} onClick={() => setProjectLayout('table')} aria-label='表格视图'><List size={16} /></button></div>
      </div>
      {loading ? <div className='fxc-table-empty'><Loader2 size={22} className='fxc-spin' />正在加载项目...</div> : visible.length ? (
        projectLayout === 'grid' ? <div className='fxc-project-grid'>{visible.map((project, index) => (
          <article className='fxc-project-card' key={project.id}>
            <img src={inspirationItems[index % inspirationItems.length].src} alt='' />
            <div><span>{project.status || '草稿'}</span><h3>{project.name || project.title || '未命名项目'}</h3><p>{project.asset_count || 0} 个素材 · {safeTime(project.updated_at || project.created_at)}</p></div>
            <button type='button' aria-label='更多操作'><MoreHorizontal size={18} /></button>
          </article>
        ))}</div> : <div className='fxc-project-table'>
          <div className='fxc-project-table__head'><span>项目名称</span><span>素材数量</span><span>最后修改</span><span>状态</span><span>操作</span></div>
          {visible.map((project, index) => <div className='fxc-project-row' key={project.id}><span className='fxc-project-name'><img src={inspirationItems[index % inspirationItems.length].src} alt='' /><strong>{project.name || project.title || '未命名项目'}</strong></span><span>{project.asset_count || 0}</span><span>{safeTime(project.updated_at || project.created_at)}</span><span><i>{project.status || '草稿'}</i></span><span><button type='button'><MoreHorizontal size={17} /></button></span></div>)}
        </div>
      ) : <div className='fxc-table-empty'><FolderOpen size={30} /><strong>暂无项目</strong><p>创建项目后，可以按商品或活动统一整理创作素材。</p></div>}

      {showCreate && <div className='fxc-modal-mask'><div className='fxc-modal'><button type='button' className='fxc-modal__close' onClick={() => setShowCreate(false)}><X size={18} /></button><h2>新建项目</h2><p>输入项目名称，后续素材可以统一归档到该项目。</p><input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} placeholder='例如：618 新品主图设计' /><div><button type='button' className='fxc-secondary' onClick={() => setShowCreate(false)}>取消</button><button type='button' className='fxc-primary' onClick={() => void createProject()}>创建项目</button></div></div></div>}
    </CreativeShell>
  )
}

function PublishPage() {
  const [assets, setAssets] = useState<CreativeAsset[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState<Notice>(null)
  const [platform, setPlatform] = useState('淘宝')

  useEffect(() => {
    apiRequest<unknown>('/api/creative/assets?page=1&p=100').then((payload) => setAssets(unwrapList<CreativeAsset>(payload))).catch((error) => setNotice({ type: 'error', text: formatError(error) }))
  }, [])

  const toggle = (id: number | string) => setSelected((current) => {
    const next = new Set(current)
    const key = String(id)
    if (next.has(key)) next.delete(key); else next.add(key)
    return next
  })

  const exportPackage = () => {
    const chosen = assets.filter((asset) => selected.has(String(asset.id)))
    if (!chosen.length) { setNotice({ type: 'error', text: '请先选择要导出的素材。' }); return }
    const blob = new Blob([JSON.stringify({ platform, createdAt: new Date().toISOString(), assets: chosen }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `feixiang-creative-${platform}-${Date.now()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice({ type: 'success', text: '素材包清单已导出。' })
  }

  return (
    <CreativeShell active='publish'>
      <NoticeBar notice={notice} onClose={() => setNotice(null)} />
      <div className='fxc-page-heading'><div><span>发布导出</span><h1>发布导出</h1><p>整理图片、视频和文案，生成发布素材包</p></div><button type='button' className='fxc-primary fxc-primary--small' onClick={exportPackage}><Download size={16} />导出素材包</button></div>
      <div className='fxc-publish-grid'>
        <section><h2>1. 选择平台</h2><div className='fxc-platform-grid'>{['淘宝', '小红书', '抖音', '闲鱼', 'TikTok Shop', 'Amazon'].map((item) => <button type='button' key={item} className={platform === item ? 'is-active' : ''} onClick={() => setPlatform(item)}><span>{item}</span><small>{item === '小红书' ? '1080×1350' : item === '抖音' ? '1080×1440' : '800×800'}</small></button>)}</div></section>
        <section><h2>2. 选择素材</h2>{assets.length ? <div className='fxc-publish-assets'>{assets.slice(0, 12).map((asset, index) => <button type='button' key={asset.id} className={selected.has(String(asset.id)) ? 'is-active' : ''} onClick={() => toggle(asset.id)}><img src={asset.thumbnail_url || asset.url || inspirationItems[index % inspirationItems.length].src} alt='' /><span>{selected.has(String(asset.id)) && <Check size={15} />}</span></button>)}</div> : <div className='fxc-publish-empty'><Layers3 size={26} /><p>素材库暂无可导出内容</p><a href='/creative/workbench?mode=image'>先去创作</a></div>}</section>
      </div>
    </CreativeShell>
  )
}

function SettingsPage() {
  const [settings, setSettings] = useState<GeneratorSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('fx-creative-settings') || '{}') } } catch { return DEFAULT_SETTINGS }
  })
  const [autoSave, setAutoSave] = useState(true)
  const [qualityCheck, setQualityCheck] = useState(true)
  const [notice, setNotice] = useState<Notice>(null)

  const save = () => {
    localStorage.setItem('fx-creative-settings', JSON.stringify(settings))
    localStorage.setItem('fx-creative-auto-save', String(autoSave))
    localStorage.setItem('fx-creative-quality-check', String(qualityCheck))
    setNotice({ type: 'success', text: '创作偏好已保存。' })
  }

  return (
    <CreativeShell active='settings'>
      <NoticeBar notice={notice} onClose={() => setNotice(null)} />
      <div className='fxc-page-heading'><div><span>创作设置</span><h1>创作设置</h1><p>配置默认模型、比例和工作流偏好</p></div><button type='button' className='fxc-primary fxc-primary--small' onClick={save}><Check size={16} />保存设置</button></div>
      <div className='fxc-settings-grid'>
        <section><h2>默认生成配置</h2><label>默认图片模型<select value={settings.imageModel} onChange={(event) => setSettings({ ...settings, imageModel: event.target.value })}>{imageModels.map((model) => <option key={model}>{model}</option>)}</select></label><label>默认视频模型<select value={settings.videoModel} onChange={(event) => setSettings({ ...settings, videoModel: event.target.value })}>{videoModels.map((model) => <option key={model}>{model}</option>)}</select></label><label>默认图片比例<div className='fxc-style-chips'>{imageRatios.map((ratio) => <button type='button' key={ratio} className={settings.imageRatio === ratio ? 'is-active' : ''} onClick={() => setSettings({ ...settings, imageRatio: ratio })}>{ratio}</button>)}</div></label></section>
        <section><h2>工作流偏好</h2><label className='fxc-switch-row'><span><strong>生成完成后自动入库</strong><small>生成成功后自动保存到素材库</small></span><input type='checkbox' checked={autoSave} onChange={(event) => setAutoSave(event.target.checked)} /></label><label className='fxc-switch-row'><span><strong>开启素材质量检查</strong><small>自动检测清晰度、尺寸和异常结果</small></span><input type='checkbox' checked={qualityCheck} onChange={(event) => setQualityCheck(event.target.checked)} /></label></section>
      </div>
    </CreativeShell>
  )
}

export function CommerceStudioDashboardPage() { return <CreativeHome /> }
export function CommerceStudioWorkbenchPage() { return <WorkbenchPage /> }
export function CommerceStudioProjectsPage() { return <ProjectsPage /> }
export function CommerceStudioAssetsPage() { return <AssetsPage /> }
export function CommerceStudioPublishPage() { return <PublishPage /> }
export function CommerceStudioSettingsPage() { return <SettingsPage /> }
export function CommerceStudioInsightPage() { return <CreativeHome /> }
