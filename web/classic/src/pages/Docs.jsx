import React from 'react'

function getOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'https://你的域名'
}

export default function Docs() {
  const origin = getOrigin()
  const root = origin.replace(/\/$/, '')
  const v1 = `${root}/v1`

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg,#050816,#080b18 45%,#050816)',
      color: '#e6eefc',
      padding: '48px 24px 80px',
    }}>
      <section style={{
        maxWidth: 1120,
        margin: '0 auto',
        border: '1px solid rgba(148,163,184,.18)',
        borderRadius: 30,
        background: 'linear-gradient(135deg,rgba(18,26,50,.9),rgba(7,11,24,.92))',
        boxShadow: '0 30px 90px rgba(0,0,0,.38)',
        padding: 40,
      }}>
        <p style={{ margin: '0 0 10px', color: '#7dd3fc', fontWeight: 900, letterSpacing: '.14em' }}>DEVELOPER DOCS</p>
        <h1 style={{ margin: 0, fontSize: 56, lineHeight: 1.05, letterSpacing: '-.06em' }}>FeiXiangApi 开发文档</h1>
        <p style={{ color: '#9fb0ca', lineHeight: 1.95 }}>从注册、充值、兑换码到创建令牌和接入模型，按顺序走一遍即可开始使用。</p>
        <pre style={{ padding: 18, borderRadius: 18, background: '#050816', color: '#dbeafe', overflowX: 'auto' }}>{`Base URL: ${v1}
API Key: API_KEY_REDACTED
Model: gpt-5.5 / gpt-5.3-codex / gemini-3.1-pro-preview / claude-opus-4-7`}</pre>
      </section>

      <section style={{ maxWidth: 1120, margin: '20px auto 0', display: 'grid', gap: 16 }}>
        {[
          ['快速接入', `OpenAI Compatible Base URL 填 ${v1}，Key 填控制台创建的 sk- 令牌。`],
          ['创建令牌', '登录控制台，进入令牌/API Key 页面，新建令牌并按用途选择分组。'],
          ['测试模型', `curl ${v1}/models -H "Authorization: Bearer API_KEY_REDACTED"`],
          ['Claude Code', `ANTHROPIC_BASE_URL=${root}，不要加 /v1。`],
        ].map(([title, body]) => (
          <article key={title} style={{
            border: '1px solid rgba(148,163,184,.18)',
            borderRadius: 24,
            background: 'rgba(8,13,29,.82)',
            padding: 26,
          }}>
            <h2 style={{ marginTop: 0, color: '#f8fbff' }}>{title}</h2>
            <p style={{ color: '#b6c3d7', lineHeight: 1.9 }}>{body}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
