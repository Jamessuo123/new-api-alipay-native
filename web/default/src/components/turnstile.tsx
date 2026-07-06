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

import { useEffect, useRef, useState } from 'react'

type TurnstileTheme = 'light' | 'dark' | 'auto'
type ResolvedTurnstileTheme = Exclude<TurnstileTheme, 'auto'>
type TurnstileSize = 'normal' | 'compact' | 'flexible'
type TurnstileAppearance = 'always' | 'execute' | 'interaction-only'

interface TurnstileRenderOptions {
  sitekey: string
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  theme?: TurnstileTheme
  size?: TurnstileSize
  appearance?: TurnstileAppearance
  'refresh-expired'?: 'auto' | 'manual' | 'never'
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string
      reset?: (widgetId?: string) => void
      remove?: (widgetId?: string) => void
    }
  }
}

interface TurnstileProps {
  siteKey: string
  onVerify: (token: string) => void
  onExpire?: () => void
  className?: string
  theme?: TurnstileTheme
  size?: TurnstileSize
}


function resolveTurnstileTheme(theme: TurnstileTheme): ResolvedTurnstileTheme {
  if (theme === 'light' || theme === 'dark') return theme

  if (typeof document === 'undefined') return 'light'

  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// FEIXIANG_AUTH_TURNSTILE_POLISH_V1
// FEIXIANG_AUTH_TURNSTILE_POLISH_V1_1_INNER_FIT: keep the inner shell fitted to the Cloudflare widget size.
// FEIXIANG_AUTH_TURNSTILE_LIGHT_THEME_V1: align wrapper and Cloudflare widget with light/dark app theme.
export function Turnstile({
  siteKey,
  onVerify,
  onExpire,
  className = '',
  theme = 'auto',
  size = 'normal',
}: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTurnstileTheme>(() =>
    resolveTurnstileTheme(theme)
  )

  useEffect(() => {
    const updateTheme = () => setResolvedTheme(resolveTurnstileTheme(theme))

    updateTheme()

    if (
      theme !== 'auto' ||
      typeof document === 'undefined' ||
      typeof MutationObserver === 'undefined'
    ) {
      return
    }

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [theme])

  useEffect(() => {
    if (!siteKey) return

    let disposed = false

    const clearWidget = () => {
      if (!ref.current) return

      try {
        if (widgetIdRef.current && window.turnstile?.remove) {
          window.turnstile.remove(widgetIdRef.current)
        }
      } catch {
        // Ignore Cloudflare iframe teardown errors and rebuild the node below.
      }

      widgetIdRef.current = null
      ref.current.innerHTML = ''
    }

    const renderTurnstile = () => {
      if (disposed || !ref.current || !window.turnstile) return

      setIsReady(true)
      clearWidget()

      const widgetId = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme: resolvedTheme,
        size,
        appearance: 'always',
        'refresh-expired': 'auto',
        callback: (token: string) => {
          setIsVerified(true)
          onVerify(token)
        },
        'expired-callback': () => {
          setIsVerified(false)
          onVerify('')
          onExpire?.()
        },
        'error-callback': () => {
          setIsVerified(false)
          onVerify('')
        },
      })

      widgetIdRef.current = String(widgetId)
    }

    if (window.turnstile) {
      renderTurnstile()
    } else {
      const scriptId = 'cf-turnstile'
      const existingScript = document.getElementById(
        scriptId
      ) as HTMLScriptElement | null

      if (existingScript) {
        existingScript.addEventListener('load', renderTurnstile, { once: true })
      } else {
        const script = document.createElement('script')
        script.id = scriptId
        script.src =
          'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        script.async = true
        script.defer = true
        script.addEventListener('load', renderTurnstile, { once: true })
        document.body.appendChild(script)
      }
    }

    return () => {
      disposed = true
      clearWidget()
    }
  }, [siteKey, onVerify, onExpire, resolvedTheme, size])

  const statusText = isVerified ? '已通过' : isReady ? '待验证' : '加载中'
  const isDarkTheme = resolvedTheme === 'dark'
  const wrapperToneClassName = isDarkTheme
    ? 'border-white/10 bg-white/[0.04] shadow-[0_16px_48px_rgba(0,0,0,0.28)]'
    : 'border-slate-200/80 bg-white/95 shadow-[0_18px_54px_rgba(15,23,42,0.14)]'
  const pendingStatusClassName = isDarkTheme
    ? 'border-white/10 bg-white/[0.06] text-muted-foreground'
    : 'border-slate-200 bg-slate-50 text-slate-500'
  const verifiedStatusClassName = isDarkTheme
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : 'border-emerald-200 bg-emerald-50 text-emerald-600'
  const widgetShellClassName = isDarkTheme
    ? 'border-white/10 bg-[#1f1f1f]'
    : 'border-slate-200 bg-white shadow-inner shadow-slate-200/50'
  const verifiedTextClassName = isDarkTheme ? 'text-emerald-300' : 'text-emerald-600'

  return (
    <div
      className={`w-[min(100%,420px)] rounded-2xl border p-3 backdrop-blur-xl transition-colors ${wrapperToneClassName} ${className}`}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='text-foreground text-sm font-semibold'>安全验证</div>
          <p className='text-muted-foreground mt-0.5 text-xs leading-relaxed'>
            请完成 Cloudflare 验证后继续操作
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            isVerified ? verifiedStatusClassName : pendingStatusClassName
          }`}
        >
          {statusText}
        </span>
      </div>

      <div className='mt-3 flex justify-center overflow-hidden'>
        <div
          ref={ref}
          className={`fx-turnstile-widget-shell w-[300px] max-w-full overflow-hidden rounded-xl border transition-colors ${widgetShellClassName}`}
        />
      </div>

      {isVerified && (
        <div
          className={`mt-2 flex items-center gap-1.5 text-xs ${verifiedTextClassName}`}
        >
          <span className='inline-flex size-1.5 rounded-full bg-emerald-400' />
          已通过安全验证
        </div>
      )}
    </div>
  )
}
