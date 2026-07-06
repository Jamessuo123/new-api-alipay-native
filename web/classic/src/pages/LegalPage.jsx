import React from 'react'

const wrapperStyle = {
  maxWidth: 980,
  margin: '0 auto',
  padding: '48px 24px 80px',
  color: '#122334',
}

const cardStyle = {
  border: '1px solid #dbe8f6',
  borderRadius: 22,
  background: '#fff',
  boxShadow: '0 14px 34px rgba(18,35,52,.045)',
  padding: 28,
  marginTop: 18,
}

export default function LegalPage({ type = 'privacy' }) {
  const isPrivacy = type === 'privacy'
  return (
    <main style={wrapperStyle}>
      <section style={{ ...cardStyle, background: 'linear-gradient(135deg,#fff,#f1f7ff)' }}>
        <p style={{ margin: '0 0 10px', color: '#1677ff', fontWeight: 800, letterSpacing: '.12em' }}>LEGAL DOCUMENT</p>
        <h1 style={{ margin: 0, fontSize: 46, lineHeight: 1.1, letterSpacing: '-.05em' }}>
          {isPrivacy ? '隐私政策' : '用户协议'}
        </h1>
        <p style={{ color: '#52667d', lineHeight: 1.9 }}>
          本页面为 FeiXiangApi 法律文档展示页，样式只作用于当前页面正文，不覆盖顶部导航和其他页面。
        </p>
        <p style={{ color: '#52667d' }}>最后更新日期：2026.6.17　生效日期：2026.6.17</p>
      </section>

      <section style={cardStyle}>
        <h2>阅读提示</h2>
        <p style={{ lineHeight: 1.9 }}>
          请将【运营主体名称】、【联系邮箱】、【客服电话】、【网站域名】等占位符替换为真实信息。
        </p>
      </section>

      <section style={cardStyle}>
        <h2>{isPrivacy ? '隐私政策正文' : '用户协议正文'}</h2>
        <p style={{ lineHeight: 1.9 }}>
          当前 classic 前端只提供兜底排版。default 前端会展示完整的用户协议和隐私政策正文。
        </p>
      </section>
    </main>
  )
}

