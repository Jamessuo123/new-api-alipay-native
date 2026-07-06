import React, { useMemo, useState } from 'react'

type DocBlock =
  | { type: 'p'; text: React.ReactNode }
  | { type: 'ul'; items: React.ReactNode[] }
  | { type: 'code'; code: string; lang?: string }
  | { type: 'table'; headers: string[]; rows: React.ReactNode[][] }
  | { type: 'note'; text: React.ReactNode }

type DocSection = {
  id: string
  title: string
  desc?: React.ReactNode
  blocks: DocBlock[]
}

const SITE_NAME = 'FeiXiangApi'
const UPDATED_AT = '2026.6.17'

function getOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'https://你的域名'
}

function lines(items: string[]) {
  return items.join('\n')
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="fx-docs-inline-code">{children}</code>
}

function buildDocs(origin: string): DocSection[] {
  const root = origin.replace(/\/$/, '')
  const v1 = `${root}/v1`
  const anthropicBase = root

  return [
    {
      id: 'quick',
      title: '快速接入信息',
      desc: '新用户先看这一节。绝大多数客户端都选择 OpenAI Compatible / OpenAI API / 自定义 OpenAI 地址。',
      blocks: [
        {
          type: 'table',
          headers: ['项目', '填写内容'],
          rows: [
            ['官网 / 控制台', <Code>{root}</Code>],
            ['OpenAI 兼容 Base URL', <Code>{v1}</Code>],
            ['Claude / Anthropic Base URL', <Code>{anthropicBase}</Code>],
            ['API Key', <Code>API_KEY_REDACTED</Code>],
            ['常用聊天接口', <Code>POST /v1/chat/completions</Code>],
            ['模型列表接口', <Code>GET /v1/models</Code>],
          ],
        },
        {
          type: 'code',
          lang: 'txt',
          code: lines([
            `Base URL: ${v1}`,
            'API Key: API_KEY_REDACTED',
            'Model: gpt-5.5 / gpt-5.4 / gpt-5.3-codex / gemini-3.1-pro-preview / claude-opus-4-7',
          ]),
        },
        {
          type: 'note',
          text: '页面内所有域名会自动读取当前网站域名，不硬编码第三方站点域名；部署到你的正式域名后，示例会自动显示你的域名。',
        },
      ],
    },
    {
      id: 'checklist',
      title: '接入前 30 秒检查',
      blocks: [
        {
          type: 'ul',
          items: [
            '客户端类型优先选择 OpenAI Compatible / OpenAI API / 自定义 OpenAI 地址。',
            <>GPT、Gemini、图片生成统一填写 <Code>{v1}</Code>。</>,
            <>Claude Code 或 Anthropic Messages 原生模式填写 <Code>{anthropicBase}</Code>，不要在末尾加 <Code>/v1</Code>。</>,
            '模型 ID 必须完整复制，展示名和真实模型名不要混用。',
            '第一次测试先关闭流式输出，设置 stream: false，确认 PONG 成功后再跑长任务。',
            '排查时不要发送完整 Key，截图里只保留前后 4 位。',
          ],
        },
      ],
    },
    {
      id: 'token',
      title: '创建令牌',
      blocks: [
        {
          type: 'ul',
          items: [
            <>登录 <Code>{root}</Code>。</>,
            '进入控制台的令牌 / API Key 管理页面。',
            '新建令牌，按用途选择对应分组。',
            '复制生成的 sk-... 令牌，放入客户端、代码或环境变量。',
            '先用 /v1/models 或一个最短聊天请求测试，再接入正式业务。',
          ],
        },
        {
          type: 'note',
          text: '不要把真实令牌写进网页前端、公开仓库、截图、微信群或教程文档。令牌泄露后应立即删除并重新生成。',
        },
      ],
    },
    {
      id: 'website-flow',
      title: '网站注册、兑换与使用流程',
      blocks: [
        {
          type: 'table',
          headers: ['页面', '用途'],
          rows: [
            ['首页', '查看站点介绍、可用模型和快速入口'],
            ['控制台', '查看账号、余额、用量、令牌'],
            ['模型广场', '查看当前支持的模型与模型说明'],
            ['令牌 / API Key', '创建 sk- 开头的调用密钥'],
            ['充值 / 兑换', '给账号增加额度，常见地址为 /console/topup'],
            ['日志 / 用量', '检查模型调用记录、错误信息和额度消耗'],
          ],
        },
        {
          type: 'code',
          lang: 'txt',
          code: '注册账号 -> 登录控制台 -> 充值或兑换额度 -> 创建令牌 -> 选择模型 -> 接入客户端或代码 -> 查看用量',
        },
        {
          type: 'ul',
          items: [
            <>兑换码使用：登录后进入 <Code>{root}/console/topup</Code>，输入兑换码并确认兑换。</>,
            <>在线充值：进入 <Code>{root}/console/topup</Code>，选择金额和支付方式，付款完成后回到控制台查看余额。</>,
            '如果支付成功但余额未到账，请保留订单号或支付截图，联系客服核查。',
          ],
        },
      ],
    },
    {
      id: 'groups',
      title: '分组选择',
      desc: '调用失败最常见的原因不是模型坏了，而是令牌分组、模型权限或余额不匹配。',
      blocks: [
        {
          type: 'table',
          headers: ['模型家族', '建议分组 / 用途'],
          rows: [
            ['GPT / OpenAI 兼容', 'ChatGpt 1倍率 / ChatGpt Standard / default'],
            ['Gemini', 'Gemini分组 / Gemini 3.1 / default'],
            ['Claude / Claude Code', 'Claude code / Claude支持任何软件调用分组 / default'],
            ['图片生成', '图片模型专用分组或支持图片模型的高权限分组'],
          ],
        },
        {
          type: 'note',
          text: '建议售卖或发给客户时按模型家族单独创建令牌：GPT 用户给 GPT 分组，Gemini 用户给 Gemini 分组，Claude Code 用户给 Claude 分组。这样更容易排查余额、权限和模型不可用问题。',
        },
      ],
    },
    {
      id: 'models',
      title: '推荐模型列表',
      blocks: [
        {
          type: 'table',
          headers: ['场景', '推荐模型'],
          rows: [
            ['综合能力、长文本、复杂任务', <><Code>gpt-5.5</Code> / <Code>gpt-5.4</Code></>],
            ['低成本、速度优先', <Code>gpt-5.4-mini</Code>],
            ['编程、代码审查、仓库分析', <Code>gpt-5.3-codex</Code>],
            ['稳定通用备用', <Code>gpt-5.2</Code>],
            ['图片生成', <Code>gpt-image-2</Code>],
            ['Gemini 主力', <Code>gemini-3.1-pro-preview</Code>],
            ['Gemini 低成本快速响应', <Code>gemini-3.1-flash-lite</Code>],
            ['Claude Code / 复杂编程', <><Code>claude-opus-4-7</Code> / <Code>claude-sonnet-4-6</Code></>],
          ],
        },
        {
          type: 'note',
          text: '实际可调用模型以控制台模型广场和 /v1/models 返回为准。如果返回列表中没有目标模型，通常是令牌分组不对、模型未授权、余额不足或该模型暂未开放给该令牌。',
        },
      ],
    },
    {
      id: 'models-api',
      title: '检查令牌可用模型',
      blocks: [
        {
          type: 'code',
          lang: 'bash',
          code: lines([
            `curl ${v1}/models \\`,
            '  -H "Authorization: Bearer API_KEY_REDACTED"',
          ]),
        },
      ],
    },
    {
      id: 'openai-chat',
      title: 'OpenAI 兼容聊天接口',
      blocks: [
        {
          type: 'p',
          text: '绝大多数客户端、SDK、低代码平台和 IDE 插件都可以使用 OpenAI 兼容接口接入。',
        },
        {
          type: 'code',
          lang: 'bash',
          code: lines([
            `curl ${v1}/chat/completions \\`,
            '  -H "Content-Type: application/json" \\',
            '  -H "Authorization: Bearer API_KEY_REDACTED" \\',
            "  -d '{",
            '    "model": "gpt-5.5",',
            '    "messages": [',
            '      {"role": "system", "content": "You are a helpful assistant."},',
            '      {"role": "user", "content": "请回复 PONG"}',
            '    ],',
            '    "stream": false',
            "  }'",
          ]),
        },
        {
          type: 'code',
          lang: 'python',
          code: lines([
            'from openai import OpenAI',
            '',
            'client = OpenAI(',
            '    api_key="API_KEY_REDACTED",',
            `    base_url="${v1}",`,
            ')',
            '',
            'response = client.chat.completions.create(',
            '    model="gpt-5.5",',
            '    messages=[',
            '        {"role": "system", "content": "You are a helpful assistant."},',
            '        {"role": "user", "content": "请回复 PONG"},',
            '    ],',
            ')',
            '',
            'print(response.choices[0].message.content)',
          ]),
        },
        {
          type: 'code',
          lang: 'ts',
          code: lines([
            'import OpenAI from "openai";',
            '',
            'const openai = new OpenAI({',
            '  apiKey: "API_KEY_REDACTED",',
            `  baseURL: "${v1}",`,
            '});',
            '',
            'const response = await openai.chat.completions.create({',
            '  model: "gpt-5.5",',
            '  messages: [',
            '    { role: "system", content: "You are a helpful assistant." },',
            '    { role: "user", content: "请回复 PONG" },',
            '  ],',
            '});',
            '',
            'console.log(response.choices[0].message.content);',
          ]),
        },
      ],
    },
    {
      id: 'stream',
      title: '流式输出',
      blocks: [
        {
          type: 'code',
          lang: 'ts',
          code: lines([
            'import OpenAI from "openai";',
            '',
            'const openai = new OpenAI({',
            '  apiKey: "API_KEY_REDACTED",',
            `  baseURL: "${v1}",`,
            '});',
            '',
            'const stream = await openai.chat.completions.create({',
            '  model: "gpt-5.4",',
            '  messages: [{ role: "user", content: "写一段 100 字产品介绍" }],',
            '  stream: true,',
            '});',
            '',
            'for await (const chunk of stream) {',
            '  process.stdout.write(chunk.choices?.[0]?.delta?.content || "");',
            '}',
          ]),
        },
      ],
    },
    {
      id: 'codex',
      title: 'Codex CLI 接入',
      blocks: [
        {
          type: 'p',
          text: 'Codex 适合代码生成、仓库分析、自动修复 Bug、代码审查等开发场景。建议优先使用 gpt-5.3-codex；如暂时不可用，可切换 gpt-5.5、gpt-5.4 或 gpt-5.2。',
        },
        {
          type: 'code',
          lang: 'bash',
          code: lines([
            'npm install -g @openai/codex',
            '',
            '# macOS / Linux',
            'export OPENAI_API_KEY="API_KEY_REDACTED"',
            '',
            '# Windows PowerShell 临时设置',
            '$env:OPENAI_API_KEY="API_KEY_REDACTED"',
          ]),
        },
        {
          type: 'code',
          lang: 'toml',
          code: lines([
            'model = "gpt-5.3-codex"',
            `openai_base_url = "${v1}"`,
          ]),
        },
        {
          type: 'code',
          lang: 'toml',
          code: lines([
            'model = "gpt-5.3-codex"',
            'model_provider = "feixiangapi"',
            '',
            '[model_providers.feixiangapi]',
            `name = "${SITE_NAME}"`,
            `base_url = "${v1}"`,
            'env_key = "OPENAI_API_KEY"',
          ]),
        },
      ],
    },
    {
      id: 'openclaw',
      title: 'OpenClaw（龙虾）接入',
      blocks: [
        {
          type: 'p',
          text: 'OpenClaw 是本地 / 自托管 AI 助手。接入时把 FeiXiangApi 配成一个自定义 provider，例如 feixiangapi。',
        },
        {
          type: 'code',
          lang: 'bash',
          code: lines([
            '# macOS / Linux',
            'curl -fsSL https://openclaw.ai/install.sh | bash',
            '',
            '# Windows PowerShell',
            'iwr -useb https://openclaw.ai/install.ps1 | iex',
            '',
            'openclaw onboard --install-daemon',
            'openclaw gateway status',
            'openclaw dashboard',
          ]),
        },
        {
          type: 'code',
          lang: 'txt',
          code: lines([
            'Provider ID: feixiangapi',
            `Base URL: ${v1}`,
            'API Key: API_KEY_REDACTED',
          ]),
        },
        {
          type: 'code',
          lang: 'js',
          code: lines([
            '{',
            '  agents: {',
            '    defaults: {',
            '      model: {',
            '        primary: "feixiangapi/gpt-5.5",',
            '        fallbacks: ["feixiangapi/gpt-5.4", "feixiangapi/gpt-5.2"]',
            '      },',
            '      imageGenerationModel: {',
            '        primary: "feixiangapi/gpt-image-2"',
            '      }',
            '    }',
            '  },',
            '  models: {',
            '    mode: "merge",',
            '    providers: {',
            '      "feixiangapi": {',
            `        baseUrl: "${v1}",`,
            '        apiKey: "${FEIXIANGAPI_API_KEY}",',
            '        api: "openai-completions",',
            '        models: [',
            '          { id: "gpt-5.5", name: "GPT-5.5" },',
            '          { id: "gpt-5.4", name: "GPT-5.4" },',
            '          { id: "gpt-5.4-mini", name: "GPT-5.4 Mini" },',
            '          { id: "gpt-5.3-codex", name: "GPT-5.3 Codex" },',
            '          { id: "gpt-image-2", name: "GPT Image 2", input: ["text", "image"] }',
            '        ]',
            '      }',
            '    }',
            '  }',
            '}',
          ]),
        },
        {
          type: 'code',
          lang: 'bash',
          code: lines([
            'openclaw models list --provider feixiangapi',
            'openclaw models set feixiangapi/gpt-5.5',
            'openclaw models status',
            'openclaw gateway restart',
          ]),
        },
      ],
    },
    {
      id: 'hermes',
      title: 'Hermes Agent 接入',
      blocks: [
        {
          type: 'table',
          headers: ['项目', '填写内容'],
          rows: [
            ['Provider', 'Custom endpoint'],
            ['API base URL', <Code>{v1}</Code>],
            ['API Key', <Code>API_KEY_REDACTED</Code>],
            ['Model name', <Code>gpt-5.5</Code>],
          ],
        },
        {
          type: 'code',
          lang: 'yaml',
          code: lines([
            'model:',
            '  provider: custom',
            `  base_url: ${v1}`,
            '  api_key: "${FEIXIANGAPI_API_KEY}"',
            '  default: gpt-5.5',
          ]),
        },
        {
          type: 'code',
          lang: 'bash',
          code: lines([
            'hermes config set model.provider custom',
            `hermes config set model.base_url ${v1}`,
            'hermes config set model.api_key API_KEY_REDACTED',
            'hermes config set model.default gpt-5.5',
            'hermes config check',
          ]),
        },
      ],
    },
    {
      id: 'gemini',
      title: 'Gemini 接入',
      blocks: [
        {
          type: 'p',
          text: 'Gemini 模型已按 OpenAI 兼容接口接入。客户端不要选择 Google 原生 Gemini 模式，优先选择 OpenAI Compatible。',
        },
        {
          type: 'code',
          lang: 'bash',
          code: lines([
            `curl ${v1}/chat/completions \\`,
            '  -H "Content-Type: application/json" \\',
            '  -H "Authorization: Bearer API_KEY_REDACTED" \\',
            "  -d '{",
            '    "model": "gemini-3.1-pro-preview",',
            '    "messages": [{"role": "user", "content": "用三句话介绍 Gemini 3.1"}]',
            "  }'",
          ]),
        },
      ],
    },
    {
      id: 'claude-openai',
      title: 'Claude 接入方式一：OpenAI 兼容接口',
      blocks: [
        {
          type: 'p',
          text: '适用于 Cherry Studio、Chatbox、Cline、Roo Code、Continue、Cursor 等支持 OpenAI Compatible 的客户端。',
        },
        {
          type: 'code',
          lang: 'bash',
          code: lines([
            `curl ${v1}/chat/completions \\`,
            '  -H "Content-Type: application/json" \\',
            '  -H "Authorization: Bearer API_KEY_REDACTED" \\',
            "  -d '{",
            '    "model": "claude-opus-4-7",',
            '    "messages": [{"role": "user", "content": "请回复 PONG"}],',
            '    "stream": false',
            "  }'",
          ]),
        },
      ],
    },
    {
      id: 'claude-native',
      title: 'Claude 接入方式二：Anthropic Messages 接口',
      blocks: [
        {
          type: 'p',
          text: '如果客户端明确要求 Anthropic 原生协议，Base URL 使用根地址，不要加 /v1。',
        },
        {
          type: 'code',
          lang: 'bash',
          code: lines([
            `curl ${anthropicBase}/v1/messages \\`,
            '  -H "content-type: application/json" \\',
            '  -H "x-api-key: API_KEY_REDACTED" \\',
            '  -H "anthropic-version: 2023-06-01" \\',
            "  -d '{",
            '    "model": "claude-opus-4-7",',
            '    "max_tokens": 1024,',
            '    "messages": [{"role": "user", "content": "请回复 PONG"}]',
            "  }'",
          ]),
        },
      ],
    },
    {
      id: 'claude-code',
      title: 'Claude Code 接入',
      blocks: [
        {
          type: 'note',
          text: <>Claude Code 不要把 <Code>ANTHROPIC_BASE_URL</Code> 写成 <Code>/v1</Code>，应填写根地址：<Code>{anthropicBase}</Code>。</>,
        },
        {
          type: 'code',
          lang: 'bash',
          code: lines([
            `export ANTHROPIC_BASE_URL="${anthropicBase}"`,
            'export ANTHROPIC_API_KEY="API_KEY_REDACTED"',
            'export ANTHROPIC_DEFAULT_OPUS_MODEL="claude-opus-4-7"',
            'export ANTHROPIC_DEFAULT_SONNET_MODEL="claude-sonnet-4-6"',
            'export ANTHROPIC_DEFAULT_HAIKU_MODEL="claude-haiku-4-5-20251001"',
            'claude',
          ]),
        },
        {
          type: 'code',
          lang: 'powershell',
          code: lines([
            `$env:ANTHROPIC_BASE_URL="${anthropicBase}"`,
            '$env:ANTHROPIC_API_KEY="API_KEY_REDACTED"',
            '$env:ANTHROPIC_DEFAULT_OPUS_MODEL="claude-opus-4-7"',
            '$env:ANTHROPIC_DEFAULT_SONNET_MODEL="claude-sonnet-4-6"',
            '$env:ANTHROPIC_DEFAULT_HAIKU_MODEL="claude-haiku-4-5-20251001"',
            'claude',
          ]),
        },
      ],
    },
    {
      id: 'image',
      title: '图片生成',
      blocks: [
        {
          type: 'code',
          lang: 'bash',
          code: lines([
            `curl ${v1}/images/generations \\`,
            '  -H "Content-Type: application/json" \\',
            '  -H "Authorization: Bearer API_KEY_REDACTED" \\',
            "  -d '{",
            '    "model": "gpt-image-2",',
            '    "prompt": "一张干净高级的商务头像海报，白色背景，真实摄影风格",',
            '    "size": "1024x1024",',
            '    "n": 1',
            "  }'",
          ]),
        },
        {
          type: 'code',
          lang: 'python',
          code: lines([
            'import base64',
            'from openai import OpenAI',
            '',
            `client = OpenAI(api_key="API_KEY_REDACTED", base_url="${v1}")`,
            '',
            'image = client.images.generate(',
            '    model="gpt-image-2",',
            '    prompt="一张干净高级的商务头像海报，白色背景，真实摄影风格",',
            '    size="1024x1024",',
            '    n=1,',
            ')',
            '',
            'item = image.data[0]',
            'if getattr(item, "b64_json", None):',
            '    with open("output.png", "wb") as f:',
            '        f.write(base64.b64decode(item.b64_json))',
            'else:',
            '    print(item.url)',
          ]),
        },
      ],
    },
    {
      id: 'vision',
      title: '图片理解 / 多模态输入',
      blocks: [
        {
          type: 'code',
          lang: 'bash',
          code: lines([
            `curl ${v1}/chat/completions \\`,
            '  -H "Content-Type: application/json" \\',
            '  -H "Authorization: Bearer API_KEY_REDACTED" \\',
            "  -d '{",
            '    "model": "gpt-5.4",',
            '    "messages": [',
            '      {',
            '        "role": "user",',
            '        "content": [',
            '          {"type": "text", "text": "请描述这张图片"},',
            '          {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}',
            '        ]',
            '      }',
            '    ]',
            "  }'",
          ]),
        },
        {
          type: 'p',
          text: '本地图片可先转成 Base64 Data URL，再放入 image_url.url。',
        },
      ],
    },
    {
      id: 'responses',
      title: 'Responses API 可选接入',
      blocks: [
        {
          type: 'code',
          lang: 'bash',
          code: lines([
            `curl ${v1}/responses \\`,
            '  -H "Content-Type: application/json" \\',
            '  -H "Authorization: Bearer API_KEY_REDACTED" \\',
            "  -d '{",
            '    "model": "gpt-5.5",',
            '    "input": "请回复 PONG"',
            "  }'",
          ]),
        },
        {
          type: 'note',
          text: '如果 Responses API 报错，优先切回 /v1/chat/completions，这是目前兼容范围最广的调用方式。',
        },
      ],
    },
    {
      id: 'clients',
      title: '常见软件填写方式',
      blocks: [
        {
          type: 'table',
          headers: ['软件 / 场景', '填写方式'],
          rows: [
            ['Cherry Studio / Chatbox / NextChat / LobeChat', <><Code>Provider: OpenAI Compatible</Code><br /><Code>Base URL: {v1}</Code><br /><Code>API Key: API_KEY_REDACTED</Code></>],
            ['Open WebUI', <><Code>OPENAI_API_BASE_URL={v1}</Code><br /><Code>OPENAI_API_KEY=API_KEY_REDACTED</Code></>],
            ['Cline / Roo Code / Continue', <><Code>Provider: OpenAI Compatible</Code><br /><Code>Model ID: claude-opus-4-7 或 gpt-5.3-codex</Code></>],
            ['Cursor / Windsurf 等 IDE', <><Code>OpenAI Compatible Base URL: {v1}</Code><br /><Code>Model: gpt-5.3-codex</Code></>],
          ],
        },
      ],
    },
    {
      id: 'skills',
      title: '实用 Skill：稳定调用与高质量输出',
      blocks: [
        {
          type: 'code',
          lang: 'txt',
          code: lines([
            '令牌三步自检：',
            `1. curl ${v1}/models -H "Authorization: Bearer API_KEY_REDACTED"`,
            '2. 用 gpt-5.4-mini 发送“只回复 PONG”，stream=false',
            '3. 成功后再切换到目标模型',
          ]),
        },
        {
          type: 'code',
          lang: 'txt',
          code: lines([
            '通用高质量提示词模板：',
            '',
            '你是：[角色，例如资深产品经理 / 合同审阅助手 / 高级设计师]',
            '目标：[一句话说明最终要完成什么]',
            '输入：[粘贴资料、图片说明、表格、客户需求或代码片段]',
            '限制：',
            '1. 不要编造不存在的信息。',
            '2. 不确定的地方标注“需要确认”。',
            '3. 保持语言简洁，优先给可执行结论。',
            '输出格式：',
            '1. 先给结论。',
            '2. 再给步骤或表格。',
            '3. 最后给风险点和下一步建议。',
          ]),
        },
        {
          type: 'code',
          lang: 'txt',
          code: lines([
            '代码与 Agent 工作流：',
            '',
            '请按下面流程完成任务：',
            '1. 先阅读相关文件和配置，说明你理解到的现状。',
            '2. 给出简短计划，列出要改哪些文件和为什么。',
            '3. 实现时保持改动范围最小，不改无关文件。',
            '4. 完成后运行可用的测试、lint 或最小验证命令。',
            '5. 最后输出：改了什么、验证结果、剩余风险。',
            '',
            '任务：',
            '[写清要实现/修复的内容]',
          ]),
        },
      ],
    },
    {
      id: 'troubleshooting',
      title: '排错表',
      blocks: [
        {
          type: 'table',
          headers: ['现象', '常见原因', '处理方式'],
          rows: [
            ['401 unauthorized', 'Key 错误、令牌被删除、认证头不匹配', '重新复制 Key；OpenAI 用 Authorization: Bearer；Anthropic 用 x-api-key 或 ANTHROPIC_API_KEY'],
            ['403 / 无权限', '令牌分组不包含该模型', '换正确分组令牌，或联系管理员确认模型权限'],
            ['model not found', '模型名拼错或该令牌不可见', '用 /v1/models 查看实际可用模型，复制完整模型 ID'],
            ['insufficient quota', '余额不足或额度不足', '充值或更换有余额令牌'],
            ['502 upstream_error', '上游临时异常或模型拥堵', '换同系列模型重试，例如 gpt-5.5 换 gpt-5.4'],
            ['Claude Code 404', 'ANTHROPIC_BASE_URL 写成了 /v1', `改成 ${anthropicBase}`],
            ['Gemini 客户端格式错误', '使用了 Google 原生 Gemini 模式', '改用 OpenAI Compatible，Base URL 填 /v1'],
            ['流式输出卡住', '客户端或网络不支持流式', '先设置 stream: false 测试基础调用'],
          ],
        },
      ],
    },
    {
      id: 'support',
      title: '客服快速话术',
      blocks: [
        {
          type: 'code',
          lang: 'txt',
          code: lines([
            `接口地址：${v1}`,
            '类型：OpenAI Compatible',
            'Key：填写你的 sk- 开头令牌',
            '模型：gpt-5.5 / gpt-5.4 / gpt-5.3-codex / gemini-3.1-pro-preview / claude-opus-4-7',
            '',
            'Claude Code 用户：',
            `ANTHROPIC_BASE_URL=${anthropicBase}`,
            'ANTHROPIC_API_KEY=你的 sk- 令牌',
            '推荐模型：claude-opus-4-7 或 claude-sonnet-4-6',
            '',
            '图片生成用户：',
            `接口地址：${v1}/images/generations`,
            '模型：gpt-image-2',
            '尺寸：1024x1024',
          ]),
        },
      ],
    },
    {
      id: 'security',
      title: '安全建议',
      blocks: [
        {
          type: 'ul',
          items: [
            '每个客户或每个业务单独创建令牌。',
            '令牌只放在服务端或本地客户端，不放浏览器前端。',
            '文档、截图、客服聊天里不要展示完整 Key。',
            '发现泄露后立即删除令牌并重新生成。',
            '长期业务建议按分组隔离 GPT、Claude、Gemini，便于统计和限额。',
          ],
        },
      ],
    },
  ]
}

const scopedCss = `
.fx-docs-dark,
.fx-docs-dark * {
  box-sizing: border-box;
}

.fx-docs-dark {
  min-height: 100vh;
  color: #e6eefc;
  background:
    radial-gradient(circle at 18% -8%, rgba(75, 112, 255, .34), transparent 34rem),
    radial-gradient(circle at 88% 6%, rgba(0, 229, 255, .18), transparent 30rem),
    linear-gradient(180deg, #050816 0%, #080b18 44%, #050816 100%);
  overflow: hidden;
}

.fx-docs-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 42px 0 80px;
}

.fx-docs-hero {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(144, 202, 255, .16);
  border-radius: 32px;
  background:
    linear-gradient(135deg, rgba(18, 26, 50, .88), rgba(7, 11, 24, .92)),
    radial-gradient(circle at 80% 0%, rgba(94, 234, 212, .14), transparent 18rem);
  box-shadow: 0 30px 90px rgba(0, 0, 0, .38);
  padding: 42px 44px;
}

.fx-docs-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px),
    linear-gradient(180deg, rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 42px 42px;
  opacity: .16;
  pointer-events: none;
}

.fx-docs-hero::after {
  content: "";
  position: absolute;
  right: -88px;
  top: -100px;
  width: 260px;
  height: 260px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(64, 150, 255, .28), rgba(64, 150, 255, 0) 68%);
  pointer-events: none;
}

.fx-docs-hero-inner {
  position: relative;
  z-index: 1;
}

.fx-docs-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  color: #7dd3fc;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.fx-docs-eyebrow::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #34d399, #22d3ee);
  box-shadow: 0 0 22px rgba(34, 211, 238, .9);
}

.fx-docs-title {
  margin: 0;
  color: #f8fbff;
  font-size: clamp(38px, 5vw, 64px);
  line-height: 1.04;
  letter-spacing: -.065em;
  font-weight: 950;
}

.fx-docs-title span {
  background: linear-gradient(135deg, #fff, #a5f3fc 52%, #93c5fd);
  -webkit-background-clip: text;
  color: transparent;
}

.fx-docs-desc {
  max-width: 860px;
  margin: 20px 0 0;
  color: #9fb0ca;
  font-size: 16px;
  line-height: 1.95;
}

.fx-docs-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}

.fx-docs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, .22);
  color: #e6eefc;
  background: rgba(15, 23, 42, .72);
  text-decoration: none;
  font-size: 14px;
  font-weight: 850;
  transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
}

.fx-docs-btn:hover {
  transform: translateY(-2px);
  border-color: rgba(125, 211, 252, .62);
  background: rgba(15, 23, 42, .92);
  box-shadow: 0 14px 34px rgba(34, 211, 238, .12);
  color: #fff;
}

.fx-docs-btn-primary {
  border-color: rgba(34, 211, 238, .45);
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  color: #fff;
  box-shadow: 0 14px 38px rgba(37, 99, 235, .28);
}

.fx-docs-quick-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 30px;
}

.fx-docs-quick-card {
  position: relative;
  overflow: hidden;
  min-height: 104px;
  border: 1px solid rgba(148, 163, 184, .18);
  border-radius: 20px;
  background: rgba(8, 13, 29, .68);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06);
  padding: 17px 18px;
  transition: transform .18s ease, border-color .18s ease, background .18s ease;
}

.fx-docs-quick-card:hover {
  transform: translateY(-3px);
  border-color: rgba(34, 211, 238, .5);
  background: rgba(12, 20, 42, .84);
}

.fx-docs-quick-label {
  color: #8092ad;
  font-size: 13px;
  margin-bottom: 8px;
}

.fx-docs-quick-value {
  color: #f8fbff;
  font-size: 15px;
  font-weight: 900;
  overflow-wrap: anywhere;
  line-height: 1.45;
}

.fx-docs-layout {
  display: grid;
  grid-template-columns: 282px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  margin-top: 24px;
}

.fx-docs-toc {
  position: sticky;
  top: 24px;
  max-height: calc(100vh - 48px);
  overflow: auto;
  border: 1px solid rgba(148, 163, 184, .18);
  border-radius: 24px;
  background: rgba(8, 13, 29, .82);
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 70px rgba(0, 0, 0, .28);
  padding: 18px;
}

.fx-docs-toc::-webkit-scrollbar {
  width: 6px;
}

.fx-docs-toc::-webkit-scrollbar-thumb {
  background: rgba(125, 211, 252, .26);
  border-radius: 999px;
}

.fx-docs-toc-title {
  margin: 0 0 12px;
  color: #f8fbff;
  font-size: 15px;
  font-weight: 900;
}

.fx-docs-toc a {
  display: block;
  padding: 9px 10px;
  border-radius: 13px;
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.38;
  text-decoration: none;
  transition: color .16s ease, background .16s ease, transform .16s ease;
}

.fx-docs-toc a:hover {
  color: #e0faff;
  background: rgba(34, 211, 238, .10);
  transform: translateX(3px);
}

.fx-docs-content {
  display: grid;
  gap: 18px;
}

.fx-docs-section {
  border: 1px solid rgba(148, 163, 184, .18);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, .88), rgba(8, 13, 29, .9));
  box-shadow: 0 24px 70px rgba(0, 0, 0, .22);
  padding: 28px;
}

.fx-docs-section-title {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin: 0 0 12px;
  color: #f8fbff;
  font-size: 24px;
  line-height: 1.35;
  letter-spacing: -.035em;
  font-weight: 920;
}

.fx-docs-index {
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #22d3ee);
  color: #fff;
  font-size: 14px;
  font-weight: 900;
  box-shadow: 0 0 28px rgba(34, 211, 238, .18);
}

.fx-docs-section p {
  margin: 10px 0;
  color: #b6c3d7;
  font-size: 15px;
  line-height: 1.88;
}

.fx-docs-section ul {
  margin: 12px 0 0;
  padding-left: 1.35em;
  color: #b6c3d7;
  font-size: 15px;
  line-height: 1.88;
}

.fx-docs-section li {
  margin: 6px 0;
}

.fx-docs-inline-code {
  display: inline-block;
  max-width: 100%;
  padding: 2px 7px;
  border: 1px solid rgba(125, 211, 252, .26);
  border-radius: 8px;
  background: rgba(34, 211, 238, .08);
  color: #a5f3fc;
  font-size: .92em;
  overflow-wrap: anywhere;
}

.fx-docs-code-shell {
  margin: 14px 0 0;
  overflow: hidden;
  border: 1px solid rgba(125, 211, 252, .20);
  border-radius: 18px;
  background: #050816;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
}

.fx-docs-code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, .12);
  background: rgba(15, 23, 42, .85);
}

.fx-docs-code-lang {
  color: #7dd3fc;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.fx-docs-copy {
  border: 1px solid rgba(125, 211, 252, .24);
  border-radius: 999px;
  background: rgba(34, 211, 238, .08);
  color: #dffaff;
  height: 28px;
  padding: 0 11px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: transform .16s ease, background .16s ease, border-color .16s ease;
}

.fx-docs-copy:hover {
  transform: translateY(-1px);
  border-color: rgba(125, 211, 252, .55);
  background: rgba(34, 211, 238, .16);
}

.fx-docs-code-shell pre {
  margin: 0;
  padding: 16px 18px;
  color: #dbeafe;
  font-size: 13px;
  line-height: 1.72;
  overflow-x: auto;
  white-space: pre;
}

.fx-docs-code-shell pre::-webkit-scrollbar {
  height: 8px;
}

.fx-docs-code-shell pre::-webkit-scrollbar-thumb {
  background: rgba(125, 211, 252, .22);
  border-radius: 999px;
}

.fx-docs-note {
  margin-top: 14px;
  padding: 15px 16px;
  border: 1px solid rgba(34, 211, 238, .24);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(8, 145, 178, .13), rgba(37, 99, 235, .10));
  color: #c8f6ff;
  font-size: 14px;
  line-height: 1.82;
}

.fx-docs-table-wrap {
  overflow-x: auto;
  margin-top: 14px;
  border-radius: 18px;
}

.fx-docs-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid rgba(148, 163, 184, .18);
  border-radius: 18px;
  overflow: hidden;
  font-size: 14px;
}

.fx-docs-table th {
  padding: 13px 14px;
  text-align: left;
  color: #eff6ff;
  background: rgba(30, 41, 59, .92);
  border-bottom: 1px solid rgba(148, 163, 184, .16);
  font-weight: 900;
}

.fx-docs-table td {
  padding: 13px 14px;
  color: #b6c3d7;
  border-bottom: 1px solid rgba(148, 163, 184, .10);
  vertical-align: top;
  line-height: 1.68;
  background: rgba(8, 13, 29, .48);
}

.fx-docs-table tr:hover td {
  background: rgba(34, 211, 238, .045);
}

.fx-docs-footer {
  padding: 22px;
  border: 1px solid rgba(148, 163, 184, .18);
  border-radius: 24px;
  background: rgba(8, 13, 29, .82);
  color: #94a3b8;
  text-align: center;
  font-size: 14px;
}

@media (max-width: 980px) {
  .fx-docs-shell {
    width: min(100% - 28px, 1180px);
    padding: 28px 0 56px;
  }

  .fx-docs-hero {
    padding: 30px 22px;
    border-radius: 26px;
  }

  .fx-docs-quick-grid {
    grid-template-columns: 1fr;
  }

  .fx-docs-layout {
    grid-template-columns: 1fr;
  }

  .fx-docs-toc {
    position: static;
    max-height: 320px;
  }

  .fx-docs-section {
    padding: 22px;
  }
}
`

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="fx-docs-code-shell">
      <div className="fx-docs-code-head">
        <span className="fx-docs-code-lang">{lang || 'code'}</span>
        <button className="fx-docs-copy" type="button" onClick={copyCode}>
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  )
}

function renderBlock(block: DocBlock, i: number) {
  if (block.type === 'p') {
    return <p key={i}>{block.text}</p>
  }
  if (block.type === 'ul') {
    return (
      <ul key={i}>
        {block.items.map((item, idx) => <li key={idx}>{item}</li>)}
      </ul>
    )
  }
  if (block.type === 'code') {
    return <CodeBlock key={i} code={block.code} lang={block.lang} />
  }
  if (block.type === 'note') {
    return <div key={i} className="fx-docs-note">{block.text}</div>
  }
  return (
    <div key={i} className="fx-docs-table-wrap">
      <table className="fx-docs-table">
        <thead>
          <tr>
            {block.headers.map((h) => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DocsPage() {
  const origin = useMemo(() => getOrigin(), [])
  const docs = useMemo(() => buildDocs(origin), [origin])
  const root = origin.replace(/\/$/, '')
  const v1 = `${root}/v1`

  return (
    <div className="fx-docs-dark">
      <style>{scopedCss}</style>
      <main className="fx-docs-shell">
        <section className="fx-docs-hero">
          <div className="fx-docs-hero-inner">
            <p className="fx-docs-eyebrow">Developer Docs</p>
            <h1 className="fx-docs-title"><span>{SITE_NAME}</span> 开发文档</h1>
            <p className="fx-docs-desc">
              从注册、充值、兑换码到创建令牌和接入模型，按顺序走一遍即可开始使用。
              本页已补全 OpenAI 兼容接口、Claude / Anthropic、Gemini、Codex CLI、OpenClaw、Hermes Agent、图片生成、多模态、常见软件和排错说明。
            </p>

            <div className="fx-docs-actions">
              <a className="fx-docs-btn fx-docs-btn-primary" href="#quick">立即接入</a>
              <a className="fx-docs-btn" href="/register">注册账号</a>
              <a className="fx-docs-btn" href="/dashboard">进入控制台</a>
              <a className="fx-docs-btn" href="/models">查看模型</a>
            </div>

            <div className="fx-docs-quick-grid">
              <div className="fx-docs-quick-card">
                <div className="fx-docs-quick-label">官网 / 控制台</div>
                <div className="fx-docs-quick-value">{root}</div>
              </div>
              <div className="fx-docs-quick-card">
                <div className="fx-docs-quick-label">OpenAI Base URL</div>
                <div className="fx-docs-quick-value">{v1}</div>
              </div>
              <div className="fx-docs-quick-card">
                <div className="fx-docs-quick-label">API Key</div>
                <div className="fx-docs-quick-value">API_KEY_REDACTED</div>
              </div>
              <div className="fx-docs-quick-card">
                <div className="fx-docs-quick-label">最近更新</div>
                <div className="fx-docs-quick-value">{UPDATED_AT}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="fx-docs-layout">
          <aside className="fx-docs-toc">
            <p className="fx-docs-toc-title">目录</p>
            {docs.map((section, index) => (
              <a key={section.id} href={`#${section.id}`}>
                {index + 1}. {section.title}
              </a>
            ))}
          </aside>

          <article className="fx-docs-content">
            {docs.map((section, index) => (
              <section key={section.id} id={section.id} className="fx-docs-section">
                <h2 className="fx-docs-section-title">
                  <span className="fx-docs-index">{index + 1}</span>
                  {section.title}
                </h2>
                {section.desc ? <p>{section.desc}</p> : null}
                {section.blocks.map(renderBlock)}
              </section>
            ))}

            <footer className="fx-docs-footer">
              © 2026 {SITE_NAME}. 本文档示例中的 <Code>API_KEY_REDACTED</Code> 为占位符，请替换为你在控制台创建的真实令牌。
            </footer>
          </article>
        </section>
      </main>
    </div>
  )
}

export default DocsPage
