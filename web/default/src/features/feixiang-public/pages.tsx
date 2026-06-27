import { Link, useRouterState } from '@tanstack/react-router'
import { isValidElement, useEffect, useState, createContext, useContext, type ReactNode } from 'react'

type Tone = 'pink' | 'orange' | 'purple' | 'cyan' | 'green'
type WorkflowNode = {
  name: string
  logo?: string
  icon?: ReactNode
  tone?: Tone
}

type WorkflowStep = {
  title: string
  desc: string
  icon: ReactNode
}

const BRAND = 'FeiXiangApi'
const BRAND_LOGO_SRC = '/images/feixiang-logo.png'
const BASE_URL = 'https://api.tokenapi168.com'


// FX_DOCS_SOURCE_TO_TSX_START
const FX_SOURCE_DOCS: any[] = [{"id":"getting-started","group":"入门","title":"快速开始","source_file":"粘贴的文本 (1)(101).txt","html":"<h1 id=\"快速开始\">快速开始 </h1>\n<p>欢迎使用 <strong>FeiXiangApi</strong>，本文档将帮助你快速接入各种 AI 编程工具。</p>\n<h2 id=\"基础信息\">基础信息 </h2>\n<table><thead><tr><th>项目</th><th>值</th></tr></thead><tbody><tr><td><strong>API Base URL</strong></td><td><code>https://api.tokenapi168.com/v1</code></td></tr><tr><td><strong>API Key</strong></td><td>在控制台获取，格式为 <code>sk-xxxxxxxxxxxx</code></td></tr><tr><td><strong>支持协议</strong></td><td>OpenAI API 兼容 / Anthropic API 兼容</td></tr><tr><td><strong>支持模型</strong></td><td>GPT-4o、GPT-4.1、Claude 4 Sonnet、Claude 4 Opus、Gemini 2.5 Pro 等</td></tr></tbody></table>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">提示</div><p>所有支持 OpenAI API 格式的工具，均可通过修改 Base URL 和 API Key 来接入本中转站。</p></div>\n<h2 id=\"获取-api-key\">获取 API Key </h2>\n<ol><li>访问 <a href=\"https://api.tokenapi168.com\" target=\"_blank\" rel=\"noreferrer\">FeiXiangApi 控制台</a></li><li>注册 / 登录账号</li><li>进入 <strong>API Key 管理</strong> 页面</li><li>点击 <strong>创建 API Key</strong>，复制生成的 Key</li></ol>\n<div class=\"fx-callout fx-callout-warning\"><div class=\"fx-callout-title\">注意</div><p>请妥善保管你的 API Key，不要泄露到公开仓库或分享给他人。</p></div>\n<h2 id=\"验证连接\">验证连接 </h2>\n<p>使用以下代码快速验证中转站是否可用：</p>\n<div class=\"fx-code-group\"><div class=\"fx-code-tab-label\">cURL</div><pre data-lang=\"bash\"><code>curl --location &#x27;https://api.tokenapi168.com/v1/chat/completions&#x27; \\\n--header &#x27;Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&#x27; \\\n--header &#x27;Content-Type: application/json&#x27; \\\n--data &#x27;{\n    &quot;model&quot;: &quot;deepseek-chat&quot;,\n    &quot;messages&quot;: [\n        {\n            &quot;role&quot;: &quot;user&quot;,\n            &quot;content&quot;: &quot;你是什么大模型？&quot;\n        }\n    ]\n  }&#x27;</code></pre><div class=\"fx-code-tab-label\">Python</div><pre data-lang=\"python\"><code>import requests\n\nurl = &quot;https://api.tokenapi168.com/v1/chat/completions&quot;\nheaders = {\n    &quot;Authorization&quot;: &quot;Bearer sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&quot;,\n    &quot;Content-Type&quot;: &quot;application/json&quot;\n}\ndata = {\n    &quot;model&quot;: &quot;deepseek-chat&quot;,\n    &quot;messages&quot;: [\n        {&quot;role&quot;: &quot;user&quot;, &quot;content&quot;: &quot;你是什么大模型？&quot;}\n    ]\n}\n\nresponse = requests.post(url, headers=headers, json=data)\nprint(response.json())</code></pre><div class=\"fx-code-tab-label\">Go</div><pre data-lang=\"go\"><code>package main\n\nimport (\n\t&quot;bytes&quot;\n\t&quot;encoding/json&quot;\n\t&quot;fmt&quot;\n\t&quot;io&quot;\n\t&quot;net/http&quot;\n)\n\nfunc main() {\n\turl := &quot;https://api.tokenapi168.com/v1/chat/completions&quot;\n\tbody := map[string]interface{}{\n\t\t&quot;model&quot;: &quot;deepseek-chat&quot;,\n\t\t&quot;messages&quot;: []map[string]string{\n\t\t\t{&quot;role&quot;: &quot;user&quot;, &quot;content&quot;: &quot;你是什么大模型？&quot;},\n\t\t},\n\t}\n\tjsonData, _ := json.Marshal(body)\n\n\treq, _ := http.NewRequest(&quot;POST&quot;, url, bytes.NewBuffer(jsonData))\n\treq.Header.Set(&quot;Authorization&quot;, &quot;Bearer sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&quot;)\n\treq.Header.Set(&quot;Content-Type&quot;, &quot;application/json&quot;)\n\n\tresp, err := http.DefaultClient.Do(req)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tdefer resp.Body.Close()\n\n\tresult, _ := io.ReadAll(resp.Body)\n\tfmt.Println(string(result))\n}</code></pre><div class=\"fx-code-tab-label\">Java</div><pre data-lang=\"java\"><code>import java.net.URI;\nimport java.net.http.HttpClient;\nimport java.net.http.HttpRequest;\nimport java.net.http.HttpResponse;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        String json = &quot;&quot;&quot;\n                {\n                    &quot;model&quot;: &quot;deepseek-chat&quot;,\n                    &quot;messages&quot;: [\n                        {&quot;role&quot;: &quot;user&quot;, &quot;content&quot;: &quot;你是什么大模型？&quot;}\n                    ]\n                }\n                &quot;&quot;&quot;;\n\n        HttpRequest request = HttpRequest.newBuilder()\n                .uri(URI.create(&quot;https://api.tokenapi168.com/v1/chat/completions&quot;))\n                .header(&quot;Authorization&quot;, &quot;Bearer sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&quot;)\n                .header(&quot;Content-Type&quot;, &quot;application/json&quot;)\n                .POST(HttpRequest.BodyPublishers.ofString(json))\n                .build();\n\n        HttpResponse&lt;String&gt; response = HttpClient.newHttpClient()\n                .send(request, HttpResponse.BodyHandlers.ofString());\n\n        System.out.println(response.body());\n    }\n}</code></pre><div class=\"fx-code-tab-label\">C#</div><pre data-lang=\"csharp\"><code>using System.Net.Http.Headers;\nusing System.Text;\n\nvar client = new HttpClient();\nclient.DefaultRequestHeaders.Authorization =\n    new AuthenticationHeaderValue(&quot;Bearer&quot;, &quot;sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&quot;);\n\nvar json = &quot;&quot;&quot;\n    {\n        &quot;model&quot;: &quot;deepseek-chat&quot;,\n        &quot;messages&quot;: [\n            {&quot;role&quot;: &quot;user&quot;, &quot;content&quot;: &quot;你是什么大模型？&quot;}\n        ]\n    }\n    &quot;&quot;&quot;;\n\nvar content = new StringContent(json, Encoding.UTF8, &quot;application/json&quot;);\nvar response = await client.PostAsync(&quot;https://api.tokenapi168.com/v1/chat/completions&quot;, content);\nvar result = await response.Content.ReadAsStringAsync();\n\nConsole.WriteLine(result);</code></pre></div>\n<p>如果返回正常的 JSON 响应，说明连接正常。</p>\n<h2 id=\"支持的工具一览\">支持的工具一览 </h2>\n<table><thead><tr><th>工具</th><th>类型</th><th>推荐指数</th></tr></thead><tbody><tr><td><a href=\"#\">Cursor</a></td><td>AI 代码编辑器</td><td>⭐⭐⭐⭐⭐</td></tr><tr><td><a href=\"#\">Claude Code</a></td><td>命令行 AI 编程助手</td><td>⭐⭐⭐⭐⭐</td></tr><tr><td><a href=\"#\">Cline</a></td><td>VS Code 插件</td><td>⭐⭐⭐⭐</td></tr><tr><td><a href=\"#\">Continue</a></td><td>VS Code / JetBrains 插件</td><td>⭐⭐⭐⭐</td></tr><tr><td><a href=\"#\">Aider</a></td><td>终端 AI 编程助手</td><td>⭐⭐⭐⭐</td></tr><tr><td><a href=\"#\">ChatBox</a></td><td>跨平台对话客户端</td><td>⭐⭐⭐</td></tr><tr><td><a href=\"#\">OpenAI API</a></td><td>SDK 直接调用</td><td>⭐⭐⭐⭐⭐</td></tr><tr><td><a href=\"#\">Gemini API</a></td><td>Gemini 原生 REST 路径调用</td><td>⭐⭐⭐⭐</td></tr><tr><td><a href=\"#\">Windsurf</a></td><td>AI 代码编辑器</td><td>⭐⭐⭐⭐</td></tr><tr><td><a href=\"#\">Cherry Studio</a></td><td>桌面 AI 客户端</td><td>⭐⭐⭐</td></tr></tbody></table>\n<p>选择你使用的工具，按照对应的配置指南进行设置即可。</p>","h2_count":4,"h3_count":0,"code_count":11,"table_count":2,"char_count":6368},{"id":"faq","group":"入门","title":"常见问题","source_file":"粘贴的文本 (2)(2).txt","html":"<h1 id=\"常见问题\">常见问题 </h1>\n<h2 id=\"连接问题\">连接问题 </h2>\n<h3 id=\"如何确认中转站连接正常\">如何确认中转站连接正常？ </h3>\n<p>使用 cURL 快速测试：</p>\n<pre data-lang=\"bash\"><code>curl https://api.tokenapi168.com/v1/models \\\n  -H &quot;Authorization: Bearer sk-xxxxxxxxxxxx&quot;</code></pre>\n<p>如果返回模型列表 JSON，说明连接正常。</p>\n<h3 id=\"遇到-401-unauthorized-错误\">遇到 <code>401 Unauthorized</code> 错误 </h3>\n<div class=\"fx-callout fx-callout-danger\"><div class=\"fx-callout-title\">可能原因</div><ul><li>API Key 填写不正确（注意前后不能有空格）</li><li>API Key 已过期或被禁用</li><li>API Key 没有对应模型的调用权限</li></ul></div>\n<p><strong>解决方法：</strong> 登录控制台检查 API Key 状态，必要时重新生成。</p>\n<h3 id=\"遇到-429-too-many-requests-错误\">遇到 <code>429 Too Many Requests</code> 错误 </h3>\n<div class=\"fx-callout fx-callout-warning\"><div class=\"fx-callout-title\">说明</div><p>请求频率超出了速率限制。</p></div>\n<p><strong>解决方法：</strong></p>\n<ul><li>稍后重试</li><li>在控制台查看当前速率限制配额</li><li>如需更高配额，请联系管理员</li></ul>\n<h3 id=\"遇到-502-503-错误\">遇到 <code>502 / 503</code> 错误 </h3>\n<p><strong>可能原因：</strong> 上游 API 服务暂时不可用。</p>\n<p><strong>解决方法：</strong> 等待几分钟后重试，如果持续出现请联系管理员。</p>\n<h2 id=\"配置问题\">配置问题 </h2>\n<h3 id=\"base-url-需不需要加-v1\">Base URL 需不需要加 <code>/v1</code>？ </h3>\n<p>取决于使用的工具：</p>\n<table><thead><tr><th>工具</th><th>Base URL 格式</th></tr></thead><tbody><tr><td>Cursor</td><td><code>https://api.tokenapi168.com/v1</code> ✅ 需要 <code>/v1</code></td></tr><tr><td>Claude Code</td><td><code>https://api.tokenapi168.com</code> ✅ 不需要 <code>/v1</code></td></tr><tr><td>Cline</td><td><code>https://api.tokenapi168.com/v1</code> ✅ 需要 <code>/v1</code></td></tr><tr><td>Continue</td><td><code>https://api.tokenapi168.com/v1</code> ✅ 需要 <code>/v1</code></td></tr><tr><td>Aider</td><td><code>https://api.tokenapi168.com/v1</code> ✅ 需要 <code>/v1</code></td></tr><tr><td>ChatBox</td><td><code>https://api.tokenapi168.com</code> ✅ 不需要 <code>/v1</code></td></tr><tr><td>Cherry Studio</td><td><code>https://api.tokenapi168.com</code> ✅ 不需要 <code>/v1</code></td></tr></tbody></table>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">经验法则</div><p>大部分工具需要 <code>/v1</code> 后缀。Anthropic 系工具和部分桌面客户端会自动拼接，所以不需要。</p></div>\n<h3 id=\"环境变量和应用内设置冲突了怎么办\">环境变量和应用内设置冲突了怎么办？ </h3>\n<p>应用内设置通常优先级更高。建议只使用一种方式配置，避免混淆。如果不确定，先清除环境变量，只用应用内设置。</p>\n<h3 id=\"支持哪些模型\">支持哪些模型？ </h3>\n<p>请访问控制台或调用 <code>/v1/models</code> 接口查看当前支持的完整模型列表。常用模型包括：</p>\n<table><thead><tr><th>模型</th><th>说明</th></tr></thead><tbody><tr><td><code>gpt-4o</code></td><td>OpenAI GPT-4o，多模态</td></tr><tr><td><code>gpt-4.1</code></td><td>OpenAI GPT-4.1，最新版</td></tr><tr><td><code>gpt-4o-mini</code></td><td>GPT-4o 轻量版，适合补全</td></tr><tr><td><code>claude-sonnet-4-20250514</code></td><td>Claude 4 Sonnet，编程能力强</td></tr><tr><td><code>claude-opus-4-20250514</code></td><td>Claude 4 Opus，最强推理</td></tr><tr><td><code>gemini-2.5-pro</code></td><td>Google Gemini 2.5 Pro</td></tr></tbody></table>","h2_count":2,"h3_count":7,"code_count":2,"table_count":2,"char_count":2798},{"id":"cursor","group":"AI 编辑器","title":"Cursor 配置","source_file":"粘贴的文本 (1)(100).txt","html":"<h1 id=\"cursor-配置\">Cursor 配置 </h1>\n<p><a href=\"https://cursor.com\" target=\"_blank\" rel=\"noreferrer\">Cursor</a> 是目前最流行的 AI 代码编辑器，基于 VS Code 深度集成了 AI 能力，支持自定义 OpenAI API 端点。</p>\n<h2 id=\"方式一-设置界面配置\">方式一：设置界面配置 [推荐] </h2>\n<ol><li>打开 Cursor，进入 <code>Settings</code> → <code>Models</code></li><li>找到 <strong>OpenAI API Key</strong> 输入框，填入：</li></ol>\n<pre data-lang=\"text\"><code>hb-xxxxxxxxxxxx</code></pre>\n<ol><li>点击 <strong>Override OpenAI Base URL</strong>，填入：</li></ol>\n<pre data-lang=\"text\"><code>https://api.tokenapi168.com/v1</code></pre>\n<ol><li>在模型列表中勾选需要使用的模型（如 <code>gpt-4o</code>、<code>claude-sonnet-4-20250514</code> 等）</li><li>点击右侧 <strong>Verify</strong> 按钮验证连接</li></ol>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">提示</div><p>如果需要使用列表中没有的模型，可以点击 <strong>+ Add Model</strong> 手动添加模型名称。</p></div>\n<h2 id=\"方式二-环境变量配置\">方式二：环境变量配置 </h2>\n<p>在终端配置文件中添加环境变量：</p>\n<div class=\"fx-code-group\"><div class=\"fx-code-tab-label\">~/.zshrc</div><pre data-lang=\"bash\"><code>export OPENAI_API_KEY=&quot;sk-xxxxxxxxxxxx&quot;\nexport OPENAI_BASE_URL=&quot;https://api.tokenapi168.com/v1&quot;</code></pre><div class=\"fx-code-tab-label\">~/.bashrc</div><pre data-lang=\"bash\"><code>export OPENAI_API_KEY=&quot;sk-xxxxxxxxxxxx&quot;\nexport OPENAI_BASE_URL=&quot;https://api.tokenapi168.com/v1&quot;</code></pre></div>\n<p>使配置生效后重启 Cursor：</p>\n<pre data-lang=\"bash\"><code>source ~/.zshrc</code></pre>\n<div class=\"fx-callout fx-callout-warning\"><div class=\"fx-callout-title\">注意</div><p>环境变量方式会影响所有读取这些变量的程序，如果你只想为 Cursor 配置，建议使用方式一。</p></div>\n<h2 id=\"验证配置\">验证配置 </h2>\n<p>配置完成后，在 Cursor 中打开一个文件，按 <code>Cmd + L</code>（macOS）或 <code>Ctrl + L</code>（Windows/Linux）打开 Chat 面板，发送一条消息测试是否正常响应。</p>","h2_count":3,"h3_count":0,"code_count":11,"table_count":0,"char_count":1697},{"id":"windsurf","group":"AI 编辑器","title":"Windsurf 配置","source_file":"粘贴的文本 (4)(1).txt","html":"<h1 id=\"windsurf-配置\">Windsurf 配置 </h1>\n<p><a href=\"https://codeium.com/windsurf\" target=\"_blank\" rel=\"noreferrer\">Windsurf</a> 是 Codeium 推出的 AI 代码编辑器（原 Codeium Editor），内置了 Cascade AI 助手。</p>\n<h2 id=\"配置步骤\">配置步骤 </h2>\n<ol><li>打开 Windsurf → <code>Settings</code>（设置）</li><li>搜索 <code>openai</code> 相关配置项</li><li>填入以下信息： <ul><li><strong>API Key</strong>: <code>sk-xxxxxxxxxxxx</code></li><li><strong>Base URL</strong>: <code>https://api.tokenapi168.com/v1</code></li></ul></li><li>选择需要使用的模型</li></ol>\n<h2 id=\"环境变量方式\">环境变量方式 </h2>\n<p>也可以通过环境变量配置：</p>\n<div class=\"fx-code-group\"><div class=\"fx-code-tab-label\">~/.zshrc</div><pre data-lang=\"bash\"><code>export OPENAI_API_KEY=&quot;sk-xxxxxxxxxxxx&quot;\nexport OPENAI_BASE_URL=&quot;https://api.tokenapi168.com/v1&quot;</code></pre><div class=\"fx-code-tab-label\">~/.bashrc</div><pre data-lang=\"bash\"><code>export OPENAI_API_KEY=&quot;sk-xxxxxxxxxxxx&quot;\nexport OPENAI_BASE_URL=&quot;https://api.tokenapi168.com/v1&quot;</code></pre></div>\n<p>配置完成后重启 Windsurf。</p>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">提示</div><p>Windsurf 同时支持自带的 Cascade 模型和自定义 API 模型，配置中转站后可以切换使用不同的模型。</p></div>","h2_count":2,"h3_count":0,"code_count":5,"table_count":0,"char_count":1155},{"id":"claude-code","group":"命令行工具","title":"Claude Code 配置","source_file":"粘贴的文本 (2)(1).txt","html":"<h1 id=\"claude-code-配置\">Claude Code 配置 </h1>\n<p><a href=\"https://docs.anthropic.com/en/docs/claude-code\" target=\"_blank\" rel=\"noreferrer\">Claude Code</a> 是 Anthropic 官方推出的命令行 AI 编程助手，可以直接在终端中进行代码编写、调试和重构。</p>\n<h2 id=\"前置条件\">前置条件 </h2>\n<p>确保已安装 Claude Code CLI：</p>\n<pre data-lang=\"bash\"><code>npm install -g @anthropic-ai/claude-code</code></pre>\n<h2 id=\"方式一-环境变量配置\">方式一：环境变量配置 [推荐] </h2>\n<p>在终端配置文件中添加：</p>\n<div class=\"fx-code-group\"><div class=\"fx-code-tab-label\">~/.zshrc</div><pre data-lang=\"bash\"><code>export ANTHROPIC_BASE_URL=&quot;https://api.tokenapi168.com&quot;\nexport ANTHROPIC_API_KEY=&quot;sk-xxxxxxxxxxxx&quot;</code></pre><div class=\"fx-code-tab-label\">~/.bashrc</div><pre data-lang=\"bash\"><code>export ANTHROPIC_BASE_URL=&quot;https://api.tokenapi168.com&quot;\nexport ANTHROPIC_API_KEY=&quot;sk-xxxxxxxxxxxx&quot;</code></pre></div>\n<p>使配置生效：</p>\n<pre data-lang=\"bash\"><code>source ~/.zshrc</code></pre>\n<p>然后正常启动：</p>\n<pre data-lang=\"bash\"><code>claude</code></pre>\n<h2 id=\"方式二-启动时指定\">方式二：启动时指定 </h2>\n<p>适合临时使用或多账号切换场景：</p>\n<pre data-lang=\"bash\"><code>ANTHROPIC_BASE_URL=&quot;https://api.tokenapi168.com&quot; \\\nANTHROPIC_API_KEY=&quot;sk-xxxxxxxxxxxx&quot; \\\nclaude</code></pre>\n<h2 id=\"方式三-配置文件\">方式三：配置文件 </h2>\n<p>编辑 <code>~/.claude/settings.json</code>：</p>\n<pre data-lang=\"json\"><code>{\n  &quot;env&quot;: {\n    &quot;ANTHROPIC_BASE_URL&quot;: &quot;https://api.tokenapi168.com&quot;,\n    &quot;ANTHROPIC_API_KEY&quot;: &quot;sk-xxxxxxxxxxxx&quot;\n  }\n}</code></pre>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">配置优先级</div><p>启动参数 &gt; 环境变量 &gt; 配置文件。如果同时设置了多种方式，优先级高的会覆盖低的。</p></div>\n<div class=\"fx-callout fx-callout-danger\"><div class=\"fx-callout-title\">注意</div><p><code>ANTHROPIC_BASE_URL</code> 不需要加 <code>/v1</code> 后缀，Claude Code 会自动拼接路径。这与 OpenAI 的 <code>OPENAI_BASE_URL</code> 不同。</p></div>\n<h2 id=\"验证配置\">验证配置 </h2>\n<p>启动 Claude Code 后，输入一个简单的问题测试：</p>\n<pre data-lang=\"bash\"><code>claude &quot;你好，请用中文回复&quot;</code></pre>\n<p>如果正常返回内容，说明配置成功。</p>","h2_count":5,"h3_count":0,"code_count":17,"table_count":0,"char_count":2002},{"id":"cc-switch","group":"命令行工具","title":"CC Switch 配置","source_file":"粘贴的文本 (6).txt","html":"<h1 id=\"cc-switch-配置\">CC Switch 配置 </h1>\n<p><a href=\"https://github.com/farion1231/cc-switch\" target=\"_blank\" rel=\"noreferrer\">CC Switch</a> 是一款跨平台桌面工具，可以统一管理和切换多个 AI 编程助手（Claude Code、Codex、OpenCode、Gemini CLI 等）的 API 配置，支持一键切换服务商和模型。</p>\n<h2 id=\"安装\">安装 </h2>\n<div class=\"fx-code-group\"><div class=\"fx-code-tab-label\">macOS（Homebrew）</div><pre data-lang=\"bash\"><code>brew tap farion1231/ccswitch\nbrew install --cask cc-switch</code></pre></div>\n<p>也可以直接在 <a href=\"https://github.com/farion1231/cc-switch/releases\" target=\"_blank\" rel=\"noreferrer\">Releases 页面</a> 下载安装包：</p>\n<table><thead><tr><th>系统</th><th>安装包</th></tr></thead><tbody><tr><td>Windows</td><td><code>.msi</code> 安装程序 或 便携版 <code>.zip</code></td></tr><tr><td>macOS</td><td><code>.dmg</code>（已签名）</td></tr><tr><td>Linux</td><td><code>.deb</code> / <code>.rpm</code> / <code>.AppImage</code></td></tr></tbody></table>\n<h2 id=\"添加自定义服务商\">添加自定义服务商 </h2>\n<ol><li>打开 CC Switch，点击 <strong>Add Provider</strong>（添加服务商）</li><li>类型选择 <strong>Custom</strong></li><li>填入以下信息：</li></ol>\n<table><thead><tr><th>字段</th><th>值</th></tr></thead><tbody><tr><td><strong>Name</strong></td><td>自定义名称，如 <code>FeiXiangApiAI</code></td></tr><tr><td><strong>Base URL</strong></td><td><code>https://api.tokenapi168.com</code></td></tr><tr><td><strong>API Key</strong></td><td><code>sk-xxxxxxxxxxxx</code></td></tr></tbody></table>\n<ol><li>点击 <strong>Save</strong> 保存</li><li>在主界面启用该服务商</li><li>重启终端或对应的 CLI 工具使配置生效</li></ol>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">Base URL 无需加 <code>/v1</code></div><p>CC Switch 会自动拼接 <code>/v1</code> 路径，填写时只需填域名即可，无需手动添加后缀。</p></div>\n<h2 id=\"支持的工具\">支持的工具 </h2>\n<p>配置完成后，CC Switch 可以统一管理以下工具的 API 配置：</p>\n<ul><li><strong>Claude Code</strong> — Anthropic 官方 CLI</li><li><strong>Codex</strong> — OpenAI CLI</li><li><strong>OpenCode</strong> — 开源 AI 编码助手</li><li><strong>Gemini CLI</strong> — Google Gemini 命令行工具</li></ul>\n<p>切换服务商后相关工具会自动读取新配置，Claude Code 支持热切换无需重启。</p>","h2_count":3,"h3_count":0,"code_count":3,"table_count":2,"char_count":1967},{"id":"cc-site","group":"命令行工具","title":"CC MAX 站点接入文档","source_file":"粘贴的文本 (7).txt","html":"<h1 id=\"cc-max-站点接入文档\">CC MAX 站点接入文档 </h1>\n<p>本站点为 Claude Code 专用中转站，仅支持通过 Claude Code 命令行工具或 VSCode 官方插件接入，不支持其他客户端（如网页版、SDK 直连、第三方聊天软件等）。</p>\n<hr />\n<h2 id=\"一-支持范围\">一、支持范围 </h2>\n<table><thead><tr><th>项目</th><th>说明</th></tr></thead><tbody><tr><td>接入客户端</td><td>Claude Code 命令行工具 / VSCode 官方插件（Claude Code for VS Code）</td></tr><tr><td>已知支持版本</td><td>2.1.140 ~ 2.1.160</td></tr><tr><td>接入协议</td><td>Anthropic Messages API</td></tr></tbody></table>\n<div class=\"fx-callout fx-callout-warning\"><div class=\"fx-callout-title\">版本说明</div><p>2.1.140 ~ 2.1.159 为已知可正常使用的版本区间。区间外的版本并非一定不支持，但未经验证，可能因请求头或协议差异出现兼容问题。如遇异常，建议优先切换到该区间内的版本。</p></div>\n<h3 id=\"检查与安装指定版本\">检查与安装指定版本 </h3>\n<pre data-lang=\"bash\"><code># 查看当前版本\nclaude --version\n\n# 安装已知支持区间内的指定版本（以 2.1.159 为例）\nnpm install -g @anthropic-ai/claude-code@2.1.159</code></pre>\n<hr />\n<h2 id=\"二-基础信息\">二、基础信息 </h2>\n<p>接入前请先准备好以下信息（向站点管理员获取）：</p>\n<table><thead><tr><th>名称</th><th>说明</th><th>示例</th></tr></thead><tbody><tr><td>API 地址（Base URL）</td><td>站点中转地址</td><td><code>https://api.tokenapi168.com</code></td></tr><tr><td>API 令牌（API Key）</td><td>站点分配的密钥</td><td><code>sk-xxxxxxxxxxxxxxxx</code></td></tr></tbody></table>\n<hr />\n<h2 id=\"三-newapi-接入额外配置\">三、NewAPI 接入额外配置 </h2>\n<p>如果本站点基于 NewAPI 搭建，需要在 NewAPI 的渠道设置中额外配置以下三项，以保证 Claude Code 的请求头能被正确透传，避免被识别拦截或协议异常。</p>\n<h3 id=\"_1-参数覆盖-parameter-override\">1. 参数覆盖（Parameter Override） </h3>\n<p>将以下配置粘贴到渠道的<strong>参数覆盖</strong>字段中。它的作用是透传（<code>pass_headers</code>）Claude Code 发出的关键请求头，并保留原始值（<code>keep_origin: true</code>）。</p>\n<pre data-lang=\"json\"><code>{\n  &quot;operations&quot;: [\n    {\n      &quot;mode&quot;: &quot;pass_headers&quot;,\n      &quot;value&quot;: [\n        &quot;X-Stainless-Arch&quot;,\n        &quot;X-Stainless-Lang&quot;,\n        &quot;X-Stainless-Os&quot;,\n        &quot;X-Stainless-Package-Version&quot;,\n        &quot;X-Stainless-Retry-Count&quot;,\n        &quot;X-Stainless-Runtime&quot;,\n        &quot;X-Stainless-Runtime-Version&quot;,\n        &quot;X-Stainless-Timeout&quot;,\n        &quot;User-Agent&quot;,\n        &quot;X-App&quot;,\n        &quot;Anthropic-Beta&quot;,\n        &quot;Anthropic-Dangerous-Direct-Browser-Access&quot;,\n        &quot;Anthropic-Version&quot;\n      ],\n      &quot;keep_origin&quot;: true\n    }\n  ]\n}</code></pre>\n<h3 id=\"_2-请求头覆盖-header-override\">2. 请求头覆盖（Header Override） </h3>\n<p>将以下配置粘贴到渠道的<strong>请求头覆盖</strong>字段中。<code>&quot;*&quot;: false</code> 表示不覆盖任何请求头，完全使用客户端（Claude Code）发来的原始请求头。</p>\n<pre data-lang=\"json\"><code>{\n  &quot;*&quot;: false\n}</code></pre>\n<h3 id=\"_3-开启透传请求体\">3. 开启透传请求体 </h3>\n<p>在渠道编辑的<strong>渠道额外设置</strong>中，找到并开启<strong>透传请求体</strong>功能。</p>\n<div class=\"fx-callout fx-callout-warning\"><div class=\"fx-callout-title\">重要</div><p>此项必须开启，否则 Claude Code 发出的原始请求体会被 NewAPI 重新序列化，导致关键字段丢失或格式变更，引发上游拒绝请求。</p></div>\n<h3 id=\"配置要点说明\">配置要点说明 </h3>\n<ul><li><strong>透传请求体</strong>必须开启，确保 Claude Code 的原始请求体不被 NewAPI 重新处理，原样转发给上游。</li><li><strong>参数覆盖</strong>中列出的请求头是 Claude Code（基于 Stainless SDK）发出的标识与协议头，必须原样透传，否则上游可能因请求头缺失或不一致而拒绝请求。</li><li><strong>请求头覆盖</strong>设为 <code>{&quot;*&quot;: false}</code>，确保 NewAPI 不会用自身默认值替换这些关键头部。</li><li>以上三项配置需同时生效，缺一可能导致请求失败或返回异常。</li></ul>\n<hr />\n<h2 id=\"四-claude-code-接入方式\">四、Claude Code 接入方式 </h2>\n<p>通过设置环境变量将 Claude Code 指向本站点。</p>\n<h3 id=\"方式-a-临时设置-当前终端会话有效\">方式 A：临时设置（当前终端会话有效） </h3>\n<div class=\"fx-code-group\"><div class=\"fx-code-tab-label\">Windows（PowerShell）</div><pre data-lang=\"powershell\"><code>$env:ANTHROPIC_BASE_URL = &quot;https://api.tokenapi168.com&quot;\n$env:ANTHROPIC_AUTH_TOKEN = &quot;sk-xxxxxxxxxxxxxxxx&quot;\nclaude</code></pre><div class=\"fx-code-tab-label\">Windows（CMD）</div><pre data-lang=\"bat\"><code>set ANTHROPIC_BASE_URL=https://api.tokenapi168.com\nset ANTHROPIC_AUTH_TOKEN=sk-xxxxxxxxxxxxxxxx\nclaude</code></pre><div class=\"fx-code-tab-label\">macOS / Linux（bash / zsh）</div><pre data-lang=\"bash\"><code>export ANTHROPIC_BASE_URL=&quot;https://api.tokenapi168.com&quot;\nexport ANTHROPIC_AUTH_TOKEN=&quot;sk-xxxxxxxxxxxxxxxx&quot;\nclaude</code></pre></div>\n<h3 id=\"方式-b-持久化设置-推荐\">方式 B：持久化设置（推荐） </h3>\n<p>编辑 Claude Code 配置文件 <code>~/.claude/settings.json</code>（Windows 为 <code>C:\\Users\\&lt;用户名&gt;\\.claude\\settings.json</code>），加入：</p>\n<pre data-lang=\"json\"><code>{\n  &quot;env&quot;: {\n    &quot;ANTHROPIC_BASE_URL&quot;: &quot;https://api.tokenapi168.com&quot;,\n    &quot;ANTHROPIC_AUTH_TOKEN&quot;: &quot;sk-xxxxxxxxxxxxxxxx&quot;\n  }\n}</code></pre>\n<p>保存后重新启动 Claude Code 即可生效。</p>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">说明</div><p><code>ANTHROPIC_AUTH_TOKEN</code> 用于以 Bearer 方式携带令牌；若站点要求使用 <code>ANTHROPIC_API_KEY</code>，请按管理员说明替换。</p></div>\n<h3 id=\"验证接入\">验证接入 </h3>\n<pre data-lang=\"bash\"><code>claude\n# 进入交互界面后随意发送一条消息，能正常返回即表示接入成功</code></pre>\n<hr />\n<h2 id=\"五-vscode-官方插件接入方式\">五、VSCode 官方插件接入方式 </h2>\n<p>VSCode 官方插件（Claude Code for VS Code）与命令行工具共用同一套配置，接入方式如下。</p>\n<h3 id=\"_1-安装插件\">1. 安装插件 </h3>\n<p>在 VS Code 扩展市场搜索 <strong>Claude Code</strong>（发布者为 Anthropic），安装官方插件。插件依赖本地的 Claude Code，请确保已安装命令行工具且版本在已知支持区间内（见第一节）。</p>\n<h3 id=\"_2-配置站点地址与令牌-二选一\">2. 配置站点地址与令牌（二选一） </h3>\n<p><strong>方式 A：复用 <code>settings.json</code>（推荐）</strong></p>\n<p>插件会读取与命令行相同的配置文件 <code>~/.claude/settings.json</code>（Windows 为 <code>C:\\Users\\&lt;用户名&gt;\\.claude\\settings.json</code>）。只要按第四节方式 B 配置过 <code>env</code>，插件即可直接复用，无需重复设置：</p>\n<pre data-lang=\"json\"><code>{\n  &quot;env&quot;: {\n    &quot;ANTHROPIC_BASE_URL&quot;: &quot;https://api.tokenapi168.com&quot;,\n    &quot;ANTHROPIC_AUTH_TOKEN&quot;: &quot;sk-xxxxxxxxxxxxxxxx&quot;\n  }\n}</code></pre>\n<p><strong>方式 B：通过环境变量启动 VS Code</strong></p>\n<p>若希望仅对某个项目生效，可在已设置环境变量的终端中启动 VS Code，插件会继承这些变量：</p>\n<div class=\"fx-code-group\"><div class=\"fx-code-tab-label\">macOS / Linux</div><pre data-lang=\"bash\"><code>export ANTHROPIC_BASE_URL=&quot;https://api.tokenapi168.com&quot;\nexport ANTHROPIC_AUTH_TOKEN=&quot;sk-xxxxxxxxxxxxxxxx&quot;\ncode .</code></pre><div class=\"fx-code-tab-label\">Windows（PowerShell）</div><pre data-lang=\"powershell\"><code>$env:ANTHROPIC_BASE_URL = &quot;https://api.tokenapi168.com&quot;\n$env:ANTHROPIC_AUTH_TOKEN = &quot;sk-xxxxxxxxxxxxxxxx&quot;\ncode .</code></pre></div>\n<h3 id=\"_3-验证接入\">3. 验证接入 </h3>\n<p>打开 VS Code 侧边栏的 Claude Code 面板，发送一条消息，能正常返回即表示接入成功。</p>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">说明</div><p>插件底层走与命令行相同的 Anthropic Messages API，因此 NewAPI 的渠道配置（见第三节）对插件同样适用，无需额外处理。</p></div>\n<hr />\n<h2 id=\"六-常见问题-faq\">六、常见问题（FAQ） </h2>\n<p><strong>Q1：提示版本不支持 / 请求被拒绝？</strong></p>\n<p>本站点仅在 2.1.140 ~ 2.1.159 区间内验证过。若你使用的是区间外版本且出现异常，建议先切换到该区间内的版本；同时确认 NewAPI 渠道已正确配置上述两项覆盖。</p>\n<p><strong>Q2：能否用网页版、Cherry Studio、SDK 等接入？</strong></p>\n<p>不支持。本站点仅面向 Claude Code 命令行工具及 VSCode 官方插件。</p>\n<p><strong>Q3：设置了环境变量仍连接官方地址？</strong></p>\n<p>检查是否同时存在系统级与配置文件级的环境变量冲突；<code>settings.json</code> 中的 <code>env</code> 优先级较高，建议统一在一处配置。</p>\n<hr />\n<p>如接入过程中遇到问题，请联系站点管理员，并提供 <code>claude --version</code> 输出及具体报错信息。</p>","h2_count":6,"h3_count":11,"code_count":24,"table_count":2,"char_count":6853},{"id":"aider","group":"命令行工具","title":"Aider 配置","source_file":"粘贴的文本 (8).txt","html":"<h1 id=\"aider-配置\">Aider 配置 </h1>\n<p><a href=\"https://aider.chat\" target=\"_blank\" rel=\"noreferrer\">Aider</a> 是一款强大的终端 AI 结对编程工具，可以直接在终端中与 AI 协作修改代码。</p>\n<h2 id=\"安装-aider\">安装 Aider </h2>\n<pre data-lang=\"bash\"><code>pip install aider-chat</code></pre>\n<h2 id=\"方式一-环境变量配置\">方式一：环境变量配置 [推荐] </h2>\n<div class=\"fx-code-group\"><div class=\"fx-code-tab-label\">~/.zshrc</div><pre data-lang=\"bash\"><code>export OPENAI_API_KEY=&quot;sk-xxxxxxxxxxxx&quot;\nexport OPENAI_API_BASE=&quot;https://api.tokenapi168.com/v1&quot;</code></pre><div class=\"fx-code-tab-label\">~/.bashrc</div><pre data-lang=\"bash\"><code>export OPENAI_API_KEY=&quot;sk-xxxxxxxxxxxx&quot;\nexport OPENAI_API_BASE=&quot;https://api.tokenapi168.com/v1&quot;</code></pre></div>\n<p>使配置生效后启动 Aider：</p>\n<pre data-lang=\"bash\"><code>source ~/.zshrc\naider --model gpt-4o</code></pre>\n<h2 id=\"方式二-命令行参数\">方式二：命令行参数 </h2>\n<pre data-lang=\"bash\"><code>aider \\\n  --openai-api-key sk-xxxxxxxxxxxx \\\n  --openai-api-base https://api.tokenapi168.com/v1 \\\n  --model gpt-4o</code></pre>\n<h2 id=\"方式三-配置文件\">方式三：配置文件 </h2>\n<p>创建 <code>~/.aider.conf.yml</code>：</p>\n<pre data-lang=\"yaml\"><code>openai-api-key: sk-xxxxxxxxxxxx\nopenai-api-base: https://api.tokenapi168.com/v1\nmodel: gpt-4o</code></pre>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">常用模型参数</div><pre data-lang=\"bash\"><code>aider --model gpt-4o              # 使用 GPT-4o\naider --model gpt-4.1             # 使用 GPT-4.1\naider --model claude-sonnet-4-20250514   # 使用 Claude 4 Sonnet</code></pre></div>\n<h2 id=\"验证配置\">验证配置 </h2>\n<pre data-lang=\"bash\"><code>aider --model gpt-4o --message &quot;说一句你好&quot;</code></pre>","h2_count":5,"h3_count":0,"code_count":17,"table_count":0,"char_count":1627},{"id":"codex","group":"命令行工具","title":"Codex CLI 接入指南","source_file":"粘贴的文本 (9).txt","html":"<h1 id=\"codex-cli-接入指南\">Codex CLI 接入指南 </h1>\n<p>本教程将指导你如何在本地使用 Codex CLI，并完成 API 接入与配置。</p>\n<hr />\n<h2 id=\"一-什么是-codex-cli\">一、什么是 Codex CLI </h2>\n<p>Codex CLI 是一个运行在本地终端的 AI 编程助手，可以帮助你完成：</p>\n<ul><li>代码生成</li><li>代码修改</li><li>自动执行命令</li><li>项目分析</li></ul>\n<p>安装完成后，可直接在终端中使用。</p>\n<hr />\n<h2 id=\"二-环境准备\">二、环境准备 </h2>\n<h3 id=\"_1-安装-node-js\">1. 安装 Node.js </h3>\n<p>建议版本：Node.js 20 及以上</p>\n<p>下载地址：<a href=\"https://nodejs.org/\" target=\"_blank\" rel=\"noreferrer\">https://nodejs.org</a></p>\n<hr />\n<h3 id=\"_2-安装-codex-cli\">2. 安装 Codex CLI </h3>\n<pre data-lang=\"bash\"><code>npm install -g @openai/codex</code></pre>\n<p>验证安装：</p>\n<pre data-lang=\"bash\"><code>codex --version</code></pre>\n<hr />\n<h2 id=\"三-配置-api\">三、配置 API </h2>\n<p>Codex 使用配置文件进行接口连接。</p>\n<h3 id=\"_1-配置文件位置\">1. 配置文件位置 </h3>\n<p>默认路径：</p>\n<ul><li>Windows：</li></ul>\n<pre data-lang=\"text\"><code>C:\\Users\\你的用户名\\.codex\\config.toml</code></pre>\n<ul><li>macOS / Linux：</li></ul>\n<pre data-lang=\"text\"><code>~/.codex/config.toml</code></pre>\n<hr />\n<h3 id=\"_2-基础配置示例\">2. 基础配置示例 </h3>\n<p>编辑 <code>config.toml</code>：</p>\n<pre data-lang=\"toml\"><code>model = &quot;gpt-4o&quot;\n\n[model_providers.default]\nname = &quot;default&quot;\nbase_url = &quot;https://api.tokenapi168.com/v1&quot;\nenv_key = &quot;OPENAI_API_KEY&quot;</code></pre>\n<p>说明：</p>\n<ul><li><code>model</code>：使用的模型名称</li><li><code>base_url</code>：API 地址（必须包含 <code>/v1</code>）</li><li><code>env_key</code>：环境变量名称</li></ul>\n<hr />\n<h3 id=\"_3-设置-api-key\">3. 设置 API Key </h3>\n<h4 id=\"macos-linux\">macOS / Linux </h4>\n<pre data-lang=\"bash\"><code>export OPENAI_API_KEY=&quot;你的API_KEY&quot;</code></pre>\n<h4 id=\"windows-powershell\">Windows（PowerShell） </h4>\n<pre data-lang=\"powershell\"><code>setx OPENAI_API_KEY &quot;你的API_KEY&quot;</code></pre>\n<hr />\n<h2 id=\"四-启动-codex\">四、启动 Codex </h2>\n<p>进入你的项目目录：</p>\n<pre data-lang=\"bash\"><code>cd your-project</code></pre>\n<p>启动：</p>\n<pre data-lang=\"bash\"><code>codex</code></pre>\n<hr />\n<h2 id=\"五-基础使用\">五、基础使用 </h2>\n<h3 id=\"_1-交互模式\">1. 交互模式 </h3>\n<pre data-lang=\"bash\"><code>codex</code></pre>\n<p>示例：</p>\n<pre data-lang=\"text\"><code>写一个 Python 爬虫</code></pre>\n<hr />\n<h3 id=\"_2-单次执行\">2. 单次执行 </h3>\n<pre data-lang=\"bash\"><code>codex &quot;写一个登录接口&quot;</code></pre>\n<hr />\n<h3 id=\"_3-指定模型\">3. 指定模型 </h3>\n<pre data-lang=\"bash\"><code>codex -m gpt-4o &quot;优化这段代码&quot;</code></pre>\n<hr />\n<h3 id=\"_4-图片输入-多模态\">4. 图片输入（多模态） </h3>\n<pre data-lang=\"bash\"><code>codex --image &quot;./demo.png&quot;</code></pre>\n<p>支持对图片内容进行分析和处理。</p>\n<hr />\n<h2 id=\"六-常见问题\">六、常见问题 </h2>\n<h3 id=\"_1-401-403-错误\">1. 401 / 403 错误 </h3>\n<p>检查：</p>\n<ul><li>API Key 是否正确</li><li>环境变量是否生效</li></ul>\n<hr />\n<h3 id=\"_2-404-错误\">2. 404 错误 </h3>\n<p>检查：</p>\n<ul><li>API 地址是否正确</li><li>是否包含 <code>/v1</code> 路径</li></ul>\n<hr />\n<h3 id=\"_3-模型不可用\">3. 模型不可用 </h3>\n<p>检查：</p>\n<ul><li>模型名称是否正确</li><li>当前账户是否已开通该模型</li></ul>\n<hr />\n<h2 id=\"七-进阶配置\">七、进阶配置 </h2>\n<h3 id=\"多模型配置\">多模型配置 </h3>\n<pre data-lang=\"toml\"><code>model = &quot;gpt-4o&quot;\n\n[model_providers.main]\nbase_url = &quot;https://api.tokenapi168.com/v1&quot;\nenv_key = &quot;OPENAI_API_KEY&quot;\n\n[models]\ngpt-4o = { provider = &quot;main&quot; }\ngpt-4.1 = { provider = &quot;main&quot; }</code></pre>\n<hr />\n<h2 id=\"八-最佳实践\">八、最佳实践 </h2>\n<ul><li>使用环境变量管理 API Key（更安全）</li><li>统一模型命名，方便切换</li><li>为不同项目使用不同配置</li><li>定期检查用量与日志</li></ul>\n<hr />\n<h2 id=\"九-总结\">九、总结 </h2>\n<p>完成以上配置后，你即可：</p>\n<ul><li>在本地终端使用 AI 编程</li><li>接入统一 API 服务</li><li>灵活切换模型</li></ul>\n<hr />","h2_count":9,"h3_count":13,"code_count":30,"table_count":0,"char_count":3427},{"id":"cline","group":"IDE 插件","title":"Cline 配置","source_file":"粘贴的文本 (1)(102).txt","html":"<h1 id=\"cline-配置\">Cline 配置 </h1>\n<p><a href=\"https://github.com/cline/cline\" target=\"_blank\" rel=\"noreferrer\">Cline</a> 是 VS Code 上非常流行的 AI 编程插件，支持自主编写代码、执行命令、管理文件等。</p>\n<h2 id=\"安装插件\">安装插件 </h2>\n<p>在 VS Code 扩展市场搜索 <strong>Cline</strong> 并安装，或通过命令行安装：</p>\n<pre data-lang=\"bash\"><code>code --install-extension saoudrizwan.claude-dev</code></pre>\n<h2 id=\"配置步骤\">配置步骤 </h2>\n<ol><li>安装完成后，点击侧边栏的 <strong>Cline</strong> 图标打开面板</li><li>点击右上角 <strong>设置图标</strong></li><li>在 <strong>API Provider</strong> 下拉框中选择 <code>OpenAI Compatible</code></li><li>填入以下信息：</li></ol>\n<table><thead><tr><th>字段</th><th>值</th></tr></thead><tbody><tr><td><strong>Base URL</strong></td><td><code>https://api.tokenapi168.com/v1</code></td></tr><tr><td><strong>API Key</strong></td><td><code>sk-xxxxxxxxxxxx</code></td></tr><tr><td><strong>Model ID</strong></td><td>填入模型名称，如 <code>claude-sonnet-4-20250514</code></td></tr></tbody></table>\n<ol><li>点击 <strong>Save</strong> 保存</li></ol>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">模型选择建议</div><ul><li>日常编码：<code>gpt-4o</code> 或 <code>claude-sonnet-4-20250514</code>（性价比高）</li><li>复杂任务：<code>claude-opus-4-20250514</code> 或 <code>gpt-4.1</code>（能力更强）</li></ul></div>\n<h2 id=\"验证配置\">验证配置 </h2>\n<p>在 Cline 面板中发送一条消息，如果正常返回响应，说明配置成功。</p>","h2_count":3,"h3_count":0,"code_count":2,"table_count":1,"char_count":1275},{"id":"continue","group":"IDE 插件","title":"Continue 配置","source_file":"粘贴的文本 (2)(3).txt","html":"<h1 id=\"continue-配置\">Continue 配置 </h1>\n<p><a href=\"https://continue.dev\" target=\"_blank\" rel=\"noreferrer\">Continue</a> 是一款开源的 AI 代码助手插件，同时支持 <strong>VS Code</strong> 和 <strong>JetBrains</strong> 系列 IDE。</p>\n<h2 id=\"安装插件\">安装插件 </h2>\n<div class=\"fx-code-group\"><div class=\"fx-code-tab-label\">VS Code</div><pre data-lang=\"bash\"><code>code --install-extension Continue.continue</code></pre><div class=\"fx-code-tab-label\">JetBrains</div><pre data-lang=\"text\"><code>在 JetBrains IDE 中：Settings → Plugins → Marketplace → 搜索 &quot;Continue&quot; → Install</code></pre></div>\n<h2 id=\"配置步骤\">配置步骤 </h2>\n<p>编辑配置文件 <code>~/.continue/config.yaml</code>：</p>\n<pre data-lang=\"yaml\"><code>models:\n  - model: gpt-4o\n    title: GPT-4o (FeiXiangApi)\n    provider: openai\n    apiKey: sk-xxxxxxxxxxxx\n    apiBase: https://api.tokenapi168.com/v1\n\n  - model: claude-sonnet-4-20250514\n    title: Claude 4 Sonnet (FeiXiangApi)\n    provider: openai\n    apiKey: sk-xxxxxxxxxxxx\n    apiBase: https://api.tokenapi168.com/v1\n\n  - model: claude-opus-4-20250514\n    title: Claude 4 Opus (FeiXiangApi)\n    provider: openai\n    apiKey: sk-xxxxxxxxxxxx\n    apiBase: https://api.tokenapi168.com/v1</code></pre>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">提示</div><p>保存配置文件后 Continue 会自动重新加载，无需重启 IDE。</p></div>\n<h2 id=\"配置-tab-自动补全\">配置 Tab 自动补全 </h2>\n<p>如果需要使用 Tab 自动补全功能，在 <code>config.yaml</code> 中添加：</p>\n<pre data-lang=\"yaml\"><code>tabAutocompleteModel:\n  model: gpt-4o-mini\n  title: Autocomplete (FeiXiangApi)\n  provider: openai\n  apiKey: sk-xxxxxxxxxxxx\n  apiBase: https://api.tokenapi168.com/v1</code></pre>\n<h2 id=\"验证配置\">验证配置 </h2>\n<p>在 IDE 中按 <code>Cmd + L</code>（macOS）或 <code>Ctrl + L</code>（Windows/Linux）打开 Continue 面板，发送消息测试。</p>","h2_count":4,"h3_count":0,"code_count":9,"table_count":0,"char_count":1729},{"id":"chatbox","group":"桌面客户端","title":"ChatBox 配置","source_file":"粘贴的文本 (3)(2).txt","html":"<h1 id=\"chatbox-配置\">ChatBox 配置 </h1>\n<p><a href=\"https://chatboxai.app\" target=\"_blank\" rel=\"noreferrer\">ChatBox</a> 是一款跨平台的桌面 AI 对话客户端，支持 Windows、macOS、Linux。</p>\n<h2 id=\"下载安装\">下载安装 </h2>\n<p>访问 <a href=\"https://chatboxai.app\" target=\"_blank\" rel=\"noreferrer\">ChatBox 官网</a> 下载对应平台的安装包。</p>\n<h2 id=\"配置步骤\">配置步骤 </h2>\n<ol><li>打开 ChatBox → 点击左下角 <strong>设置</strong></li><li>选择 <strong>AI 模型提供方</strong> 为 <code>OpenAI API</code></li><li>配置以下信息：</li></ol>\n<table><thead><tr><th>字段</th><th>值</th></tr></thead><tbody><tr><td><strong>API Domain</strong></td><td><code>https://api.tokenapi168.com</code></td></tr><tr><td><strong>API Key</strong></td><td><code>sk-xxxxxxxxxxxx</code></td></tr><tr><td><strong>Model</strong></td><td>手动输入模型名称，如 <code>gpt-4o</code></td></tr></tbody></table>\n<ol><li>点击 <strong>保存</strong></li></ol>\n<div class=\"fx-callout fx-callout-warning\"><div class=\"fx-callout-title\">注意</div><p>ChatBox 的 API Domain 字段不需要加 <code>/v1</code> 后缀，应用会自动拼接。</p></div>\n<h2 id=\"验证配置\">验证配置 </h2>\n<p>保存配置后，在对话框中发送一条消息，正常收到回复即表示配置成功。</p>","h2_count":3,"h3_count":0,"code_count":0,"table_count":1,"char_count":1036},{"id":"cherry-studio","group":"桌面客户端","title":"Cherry Studio 配置","source_file":"粘贴的文本 (4)(2).txt","html":"<h1 id=\"cherry-studio-配置\">Cherry Studio 配置 </h1>\n<p><a href=\"https://cherry-ai.com\" target=\"_blank\" rel=\"noreferrer\">Cherry Studio</a> 是一款功能丰富的桌面 AI 客户端，支持多模型对话、知识库、AI 绘图等功能。</p>\n<h2 id=\"下载安装\">下载安装 </h2>\n<p>访问 <a href=\"https://cherry-ai.com\" target=\"_blank\" rel=\"noreferrer\">Cherry Studio 官网</a> 下载安装。</p>\n<h2 id=\"配置步骤\">配置步骤 </h2>\n<ol><li>打开 Cherry Studio → 点击左侧 <strong>设置</strong> 图标</li><li>选择 <strong>模型服务</strong> 标签</li><li>点击 <strong>添加自定义提供商</strong>，或选择已有的 <code>OpenAI</code> 或者 <code>Anthropic</code><br /><code>注意：</code>需要使用Claude就选择Anthropic, 除Claude以外的模型就选OpenAI</li><li>配置以下信息：</li></ol>\n<table><thead><tr><th>字段</th><th>值</th></tr></thead><tbody><tr><td><strong>提供商名称</strong></td><td><code>FeiXiangApi</code>（自定义名称）</td></tr><tr><td><strong>API 地址</strong></td><td><code>https://api.tokenapi168.com</code></td></tr><tr><td><strong>API Key</strong></td><td><code>sk-xxxxxxxxxxxx</code></td></tr></tbody></table>\n<ol><li>点击 <strong>添加</strong> 按钮，</li><li>模型广场复制模型名称 <code>注意:请选择对应的你创建API key分组的模型</code> ，点击 <strong>保存</strong></li></ol>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">提示</div><p>Cherry Studio 支持同时配置多个 API 提供商，你可以在对话时自由切换不同的提供商和模型。</p></div>\n<h2 id=\"验证配置\">验证配置 </h2>\n<p>返回对话界面，在右上角切换到刚配置的模型，发送消息测试。</p>","h2_count":3,"h3_count":0,"code_count":0,"table_count":1,"char_count":1258},{"id":"openai-api","group":"OpenAI API","title":"OpenAI API 直接调用","source_file":"粘贴的文本 (5)(1).txt","html":"<h1 id=\"openai-api-直接调用\">OpenAI API 直接调用 </h1>\n<p>如果你直接通过 SDK 或 HTTP 请求调用 API，只需将 Base URL 指向中转站地址即可。</p>\n<ul><li>Base URL: <code>https://api.tokenapi168.com/v1</code></li><li>认证方式: <code>Authorization: Bearer sk-xxxxxxxxxxxx</code></li></ul>\n<h2 id=\"接口目录\">接口目录 </h2>\n<p>当前 OpenAI 兼容接口文档已拆分为两个子页面，便于在左侧导航中按接口类型查看：</p>\n<table><thead><tr><th>文档</th><th>说明</th></tr></thead><tbody><tr><td><a href=\"#\">Chat Completions</a></td><td><code>/v1/chat/completions</code> 的请求参数、SDK 示例和流式输出</td></tr><tr><td><a href=\"#\">Videos</a></td><td><code>/v1/videos</code> 的创建、进度查询、下载和 webhook</td></tr></tbody></table>\n<h2 id=\"已支持的-openai-兼容接口\">已支持的 OpenAI 兼容接口 </h2>\n<table><thead><tr><th>接口</th><th>方法</th><th>说明</th></tr></thead><tbody><tr><td><code>/v1/chat/completions</code></td><td><code>POST</code></td><td>对话补全，支持普通输出和流式输出</td></tr><tr><td><code>/v1/videos</code></td><td><code>POST</code></td><td>创建视频生成任务</td></tr><tr><td><code>/v1/videos/{video_id}</code></td><td><code>GET</code></td><td>查询视频任务状态与进度</td></tr><tr><td><code>/v1/videos/{video_id}/content</code></td><td><code>GET</code></td><td>下载视频、缩略图或 spritesheet</td></tr></tbody></table>\n<h2 id=\"使用建议\">使用建议 </h2>\n<ul><li>已有 OpenAI SDK 项目，优先看 <a href=\"#\">Chat Completions</a></li><li>需要生成视频或查看视频任务进度，直接看 <a href=\"#\">Videos</a></li><li>第三方工具接入时，只需要替换 Base URL 和 API Key</li></ul>","h2_count":3,"h3_count":0,"code_count":0,"table_count":2,"char_count":1322},{"id":"videos","group":"OpenAI API","title":"Videos","source_file":"粘贴的文本 (7)(1).txt","html":"<h1 id=\"videos\">Videos </h1>\n<p><code>/v1/videos</code> 是异步视频生成接口。发起创建请求后，服务会先返回一个视频任务对象；随后通过 <code>GET /v1/videos/{video_id}</code> 查询状态与进度；任务完成后再通过 <code>GET /v1/videos/{video_id}/content</code> 下载文件。</p>\n<div class=\"fx-callout fx-callout-warning\"><div class=\"fx-callout-title\">WARNING</div><p>视频接口是异步任务模式，不会像文本接口一样直接返回最终内容。</p></div>\n<h2 id=\"请求地址\">请求地址 </h2>\n<ul><li>创建任务：<code>POST https://api.tokenapi168.com/v1/videos</code></li><li>查询进度：<code>GET https://api.tokenapi168.com/v1/videos/{video_id}</code></li><li>下载内容：<code>GET https://api.tokenapi168.com/v1/videos/{video_id}/content</code></li></ul>\n<h2 id=\"创建视频任务\">创建视频任务 </h2>\n<h3 id=\"常用请求字段\">常用请求字段 </h3>\n<table><thead><tr><th>字段</th><th>必填</th><th>说明</th></tr></thead><tbody><tr><td><code>prompt</code></td><td>是</td><td>视频生成提示词</td></tr><tr><td><code>model</code></td><td>否</td><td>视频模型，常用 <code>sora-2</code> 或 <code>sora-2-pro</code>，默认 <code>sora-2</code></td></tr><tr><td><code>seconds</code></td><td>否</td><td>视频时长，可选 <code>4</code>、<code>8</code>、<code>12</code>，默认 <code>4</code></td></tr><tr><td><code>size</code></td><td>否</td><td>分辨率，可选 <code>720x1280</code>、<code>1280x720</code>、<code>1024x1792</code>、<code>1792x1024</code>，默认 <code>720x1280</code></td></tr><tr><td><code>input_reference</code></td><td>否</td><td>参考图对象，传 <code>image_url</code> 或 <code>file_id</code> 二选一</td></tr></tbody></table>\n<h3 id=\"curl-示例\">cURL 示例 </h3>\n<pre data-lang=\"bash\"><code>curl https://api.tokenapi168.com/v1/videos \\\n  -H &quot;Authorization: Bearer sk-xxxxxxxxxxxx&quot; \\\n  -F &quot;model=sora-2&quot; \\\n  -F &quot;prompt=A calico cat playing a piano on stage&quot; \\\n  -F &quot;seconds=8&quot; \\\n  -F &quot;size=1280x720&quot;</code></pre>\n<h3 id=\"node-js-sdk-示例\">Node.js SDK 示例 </h3>\n<pre data-lang=\"javascript\"><code>import OpenAI from &quot;openai&quot;;\n\nconst client = new OpenAI({\n  apiKey: &quot;sk-xxxxxxxxxxxx&quot;,\n  baseURL: &quot;https://api.tokenapi168.com/v1&quot;,\n});\n\nconst video = await client.videos.create({\n  model: &quot;sora-2&quot;,\n  prompt: &quot;A calico cat playing a piano on stage&quot;,\n  seconds: &quot;8&quot;,\n  size: &quot;1280x720&quot;,\n});\n\nconsole.log(video);</code></pre>\n<h3 id=\"创建成功返回示例\">创建成功返回示例 </h3>\n<pre data-lang=\"json\"><code>{\n  &quot;id&quot;: &quot;video_123&quot;,\n  &quot;object&quot;: &quot;video&quot;,\n  &quot;model&quot;: &quot;sora-2&quot;,\n  &quot;status&quot;: &quot;queued&quot;,\n  &quot;progress&quot;: 0,\n  &quot;created_at&quot;: 1712697600,\n  &quot;size&quot;: &quot;1280x720&quot;,\n  &quot;seconds&quot;: &quot;8&quot;,\n  &quot;quality&quot;: &quot;standard&quot;\n}</code></pre>\n<h2 id=\"查询视频任务进度\">查询视频任务进度 </h2>\n<p>建议轮询间隔为 <code>10</code> 到 <code>20</code> 秒。<code>progress</code> 为近似进度百分比，<code>status</code> 为任务状态。</p>\n<h3 id=\"常见返回字段\">常见返回字段 </h3>\n<table><thead><tr><th>字段</th><th>说明</th></tr></thead><tbody><tr><td><code>id</code></td><td>视频任务 ID</td></tr><tr><td><code>object</code></td><td>固定为 <code>video</code></td></tr><tr><td><code>status</code></td><td>任务状态：<code>queued</code>、<code>in_progress</code>、<code>completed</code>、<code>failed</code></td></tr><tr><td><code>progress</code></td><td>近似完成百分比</td></tr><tr><td><code>created_at</code></td><td>任务创建时间，Unix 时间戳（秒）</td></tr><tr><td><code>completed_at</code></td><td>任务完成时间，完成后返回</td></tr><tr><td><code>expires_at</code></td><td>下载内容过期时间，返回下载资源时可能出现</td></tr><tr><td><code>prompt</code></td><td>本次视频任务的提示词</td></tr><tr><td><code>error.code</code></td><td>失败时的错误码</td></tr><tr><td><code>error.message</code></td><td>失败时的错误描述</td></tr></tbody></table>\n<h3 id=\"进度返回示例\">进度返回示例 </h3>\n<p>排队中：</p>\n<pre data-lang=\"json\"><code>{\n  &quot;id&quot;: &quot;video_123&quot;,\n  &quot;object&quot;: &quot;video&quot;,\n  &quot;status&quot;: &quot;queued&quot;,\n  &quot;progress&quot;: 0,\n  &quot;created_at&quot;: 1712697600,\n  &quot;model&quot;: &quot;sora-2&quot;,\n  &quot;seconds&quot;: &quot;8&quot;,\n  &quot;size&quot;: &quot;1280x720&quot;\n}</code></pre>\n<p>处理中：</p>\n<pre data-lang=\"json\"><code>{\n  &quot;id&quot;: &quot;video_123&quot;,\n  &quot;object&quot;: &quot;video&quot;,\n  &quot;status&quot;: &quot;in_progress&quot;,\n  &quot;progress&quot;: 33,\n  &quot;created_at&quot;: 1712697600,\n  &quot;model&quot;: &quot;sora-2&quot;,\n  &quot;seconds&quot;: &quot;8&quot;,\n  &quot;size&quot;: &quot;1280x720&quot;\n}</code></pre>\n<p>已完成：</p>\n<pre data-lang=\"json\"><code>{\n  &quot;id&quot;: &quot;video_123&quot;,\n  &quot;object&quot;: &quot;video&quot;,\n  &quot;status&quot;: &quot;completed&quot;,\n  &quot;progress&quot;: 100,\n  &quot;created_at&quot;: 1712697600,\n  &quot;completed_at&quot;: 1712697815,\n  &quot;expires_at&quot;: 1712701415,\n  &quot;model&quot;: &quot;sora-2&quot;,\n  &quot;prompt&quot;: &quot;A calico cat playing a piano on stage&quot;,\n  &quot;seconds&quot;: &quot;8&quot;,\n  &quot;size&quot;: &quot;1280x720&quot;\n}</code></pre>\n<p>失败：</p>\n<pre data-lang=\"json\"><code>{\n  &quot;id&quot;: &quot;video_123&quot;,\n  &quot;object&quot;: &quot;video&quot;,\n  &quot;status&quot;: &quot;failed&quot;,\n  &quot;progress&quot;: 12,\n  &quot;created_at&quot;: 1712697600,\n  &quot;model&quot;: &quot;sora-2&quot;,\n  &quot;seconds&quot;: &quot;8&quot;,\n  &quot;size&quot;: &quot;1280x720&quot;,\n  &quot;error&quot;: {\n    &quot;code&quot;: &quot;invalid_reference_image&quot;,\n    &quot;message&quot;: &quot;Input images with human faces are currently rejected.&quot;\n  }\n}</code></pre>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">TIP</div><p>上面的已完成、失败示例是根据 OpenAI 官方返回字段整理的文档示例，具体字段组合和数值请以实际接口返回为准。</p></div>\n<h2 id=\"下载视频内容\">下载视频内容 </h2>\n<p>默认返回 MP4 视频内容，也支持通过 <code>variant</code> 查询不同下载内容：</p>\n<table><thead><tr><th>参数</th><th>说明</th></tr></thead><tbody><tr><td><code>variant=video</code></td><td>下载视频文件，默认值</td></tr><tr><td><code>variant=thumbnail</code></td><td>下载缩略图</td></tr><tr><td><code>variant=spritesheet</code></td><td>下载 spritesheet</td></tr></tbody></table>\n<h3 id=\"下载视频\">下载视频 </h3>\n<pre data-lang=\"bash\"><code>curl https://api.tokenapi168.com/v1/videos/video_123/content \\\n  -H &quot;Authorization: Bearer sk-xxxxxxxxxxxx&quot; \\\n  --output video.mp4</code></pre>\n<h3 id=\"下载缩略图\">下载缩略图 </h3>\n<pre data-lang=\"bash\"><code>curl &quot;https://api.tokenapi168.com/v1/videos/video_123/content?variant=thumbnail&quot; \\\n  -H &quot;Authorization: Bearer sk-xxxxxxxxxxxx&quot; \\\n  --output thumbnail.webp</code></pre>\n<h2 id=\"可选-webhook-回调\">可选：Webhook 回调 </h2>\n<p>如果不想轮询，也可以配置 webhook 接收任务结果通知。OpenAI 官方文档中视频任务会触发以下事件：</p>\n<ul><li><code>video.completed</code></li><li><code>video.failed</code></li></ul>\n<p>示例回调：</p>\n<pre data-lang=\"json\"><code>{\n  &quot;id&quot;: &quot;evt_abc123&quot;,\n  &quot;object&quot;: &quot;event&quot;,\n  &quot;created_at&quot;: 1758941485,\n  &quot;type&quot;: &quot;video.completed&quot;,\n  &quot;data&quot;: {\n    &quot;id&quot;: &quot;video_abc123&quot;\n  }\n}</code></pre>\n<h2 id=\"参考文档\">参考文档 </h2>\n<ul><li>OpenAI Video Generation Guide: <a href=\"https://platform.openai.com/docs/guides/video-generation/\" target=\"_blank\" rel=\"noreferrer\">https://platform.openai.com/docs/guides/video-generation/</a></li><li>OpenAI Videos API Reference: <a href=\"https://developers.openai.com/api/reference/resources/videos/methods/create\" target=\"_blank\" rel=\"noreferrer\">https://developers.openai.com/api/reference/resources/videos/methods/create</a></li></ul>","h2_count":6,"h3_count":8,"code_count":20,"table_count":3,"char_count":7292},{"id":"gemini-api","group":"Gemini API","title":"Gemini API","source_file":"粘贴的文本 (8)(1).txt","html":"<h1 id=\"gemini-api\">Gemini API </h1>\n<p>如果你需要按 Gemini 原生 REST 路径调用接口，可以使用 Gemini API 兼容文档。</p>\n<h2 id=\"接口目录\">接口目录 </h2>\n<table><thead><tr><th>文档</th><th>说明</th></tr></thead><tbody><tr><td><a href=\"#\">Generate Content</a></td><td><code>POST /v1beta/models/{model}:generateContent</code> 文本与多模态理解接口</td></tr><tr><td><a href=\"#\">Veo 3.1 Fast 视频生成</a></td><td><code>veo-3.1-fast-generate-preview</code> 视频生成、异步轮询和下载</td></tr></tbody></table>\n<h2 id=\"说明\">说明 </h2>\n<ul><li>Gemini 原生 REST 路径通常以 <code>/v1beta/models/...</code> 开头</li><li>文本与多模态理解，优先看 <a href=\"#\">Generate Content</a></li><li>Veo 视频生成属于异步任务，不会像普通文本接口那样立即返回最终视频</li><li>预览模型可能会调整，接入前建议先确认模型名和可用性</li></ul>","h2_count":2,"h3_count":0,"code_count":0,"table_count":1,"char_count":663},{"id":"generate-content","group":"Gemini API","title":"Generate Content","source_file":"粘贴的文本 (9)(1).txt","html":"<h1 id=\"generate-content\">Generate Content </h1>\n<p><code>generateContent</code> 是 Gemini 原生 REST API 里最常用的生成接口，适合文本问答、多轮对话、结构化输出以及多模态理解场景。</p>\n<h2 id=\"请求地址\">请求地址 </h2>\n<pre data-lang=\"text\"><code>POST https://api.tokenapi168.com/v1beta/models/{model}:generateContent</code></pre>\n<p>示例模型：</p>\n<ul><li><code>gemini-3-flash-preview</code></li><li><code>gemini-3-pro-preview</code></li><li><code>gemini-2.5-flash</code></li></ul>\n<h2 id=\"鉴权\">鉴权 </h2>\n<ul><li>Google 官方原生示例使用 <code>x-goog-api-key: $GEMINI_API_KEY</code></li><li>如果通过FeiXiangApi中转调用，可使用平台 API Key；下方示例按FeiXiangApi网关地址编写</li></ul>\n<h2 id=\"最小请求示例\">最小请求示例 </h2>\n<p>这是你要的 <code>generateContent</code> 接口写法，对应模型 <code>gemini-3-flash-preview</code>：</p>\n<pre data-lang=\"bash\"><code>curl &quot;https://api.tokenapi168.com/v1beta/models/gemini-3-flash-preview:generateContent&quot; \\\n  -H &quot;Authorization: Bearer sk-xxxxxxxxxxxx&quot; \\\n  -H &quot;Content-Type: application/json&quot; \\\n  -X POST \\\n  -d &#x27;{\n    &quot;contents&quot;: [\n      {\n        &quot;parts&quot;: [\n          {\n            &quot;text&quot;: &quot;Explain how AI works in a few words&quot;\n          }\n        ]\n      }\n    ]\n  }&#x27;</code></pre>\n<p>对应 Google 官方原生写法：</p>\n<pre data-lang=\"bash\"><code>curl &quot;https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent&quot; \\\n  -H &quot;x-goog-api-key: $GEMINI_API_KEY&quot; \\\n  -H &quot;Content-Type: application/json&quot; \\\n  -X POST \\\n  -d &#x27;{\n    &quot;contents&quot;: [\n      {\n        &quot;parts&quot;: [\n          {\n            &quot;text&quot;: &quot;Explain how AI works in a few words&quot;\n          }\n        ]\n      }\n    ]\n  }&#x27;</code></pre>\n<h2 id=\"常用请求字段\">常用请求字段 </h2>\n<table><thead><tr><th>字段</th><th>必填</th><th>说明</th></tr></thead><tbody><tr><td><code>contents</code></td><td>是</td><td>对话内容数组，至少包含一条消息</td></tr><tr><td><code>contents[].role</code></td><td>否</td><td>角色，常见为 <code>user</code> 或 <code>model</code></td></tr><tr><td><code>contents[].parts</code></td><td>是</td><td>消息内容片段数组</td></tr><tr><td><code>parts[].text</code></td><td>否</td><td>文本输入</td></tr><tr><td><code>parts[].inlineData</code></td><td>否</td><td>Base64 编码的图片、音频、视频等内联数据</td></tr><tr><td><code>parts[].fileData</code></td><td>否</td><td>已上传文件引用</td></tr><tr><td><code>system_instruction</code></td><td>否</td><td>系统提示词；部分 SDK 中对应 <code>systemInstruction</code></td></tr><tr><td><code>generationConfig</code></td><td>否</td><td>生成配置，例如温度、输出格式、思考配置</td></tr><tr><td><code>safetySettings</code></td><td>否</td><td>安全过滤配置</td></tr><tr><td><code>tools</code></td><td>否</td><td>工具定义，例如 Google Search、函数调用等</td></tr></tbody></table>\n<h2 id=\"请求体示例\">请求体示例 </h2>\n<h3 id=\"纯文本生成\">纯文本生成 </h3>\n<pre data-lang=\"json\"><code>{\n  &quot;contents&quot;: [\n    {\n      &quot;parts&quot;: [\n        {\n          &quot;text&quot;: &quot;Explain how AI works in a few words&quot;\n        }\n      ]\n    }\n  ]\n}</code></pre>\n<h3 id=\"带系统提示词\">带系统提示词 </h3>\n<pre data-lang=\"json\"><code>{\n  &quot;system_instruction&quot;: {\n    &quot;parts&quot;: [\n      {\n        &quot;text&quot;: &quot;You are a concise assistant.&quot;\n      }\n    ]\n  },\n  &quot;contents&quot;: [\n    {\n      &quot;parts&quot;: [\n        {\n          &quot;text&quot;: &quot;Explain how AI works in a few words&quot;\n        }\n      ]\n    }\n  ]\n}</code></pre>\n<h3 id=\"带生成参数\">带生成参数 </h3>\n<pre data-lang=\"json\"><code>{\n  &quot;contents&quot;: [\n    {\n      &quot;parts&quot;: [\n        {\n          &quot;text&quot;: &quot;Explain how AI works in a few words&quot;\n        }\n      ]\n    }\n  ],\n  &quot;generationConfig&quot;: {\n    &quot;temperature&quot;: 0.7,\n    &quot;topP&quot;: 0.8,\n    &quot;topK&quot;: 20,\n    &quot;maxOutputTokens&quot;: 256,\n    &quot;responseMimeType&quot;: &quot;text/plain&quot;\n  }\n}</code></pre>\n<h3 id=\"多轮对话\">多轮对话 </h3>\n<pre data-lang=\"json\"><code>{\n  &quot;contents&quot;: [\n    {\n      &quot;role&quot;: &quot;user&quot;,\n      &quot;parts&quot;: [\n        {\n          &quot;text&quot;: &quot;Hello&quot;\n        }\n      ]\n    },\n    {\n      &quot;role&quot;: &quot;model&quot;,\n      &quot;parts&quot;: [\n        {\n          &quot;text&quot;: &quot;Great to meet you. What would you like to know?&quot;\n        }\n      ]\n    },\n    {\n      &quot;role&quot;: &quot;user&quot;,\n      &quot;parts&quot;: [\n        {\n          &quot;text&quot;: &quot;Explain how AI works in a few words&quot;\n        }\n      ]\n    }\n  ]\n}</code></pre>\n<h2 id=\"返回结构示例\">返回结构示例 </h2>\n<pre data-lang=\"json\"><code>{\n  &quot;candidates&quot;: [\n    {\n      &quot;content&quot;: {\n        &quot;parts&quot;: [\n          {\n            &quot;text&quot;: &quot;AI learns patterns from data and uses them to make predictions.&quot;\n          }\n        ],\n        &quot;role&quot;: &quot;model&quot;\n      },\n      &quot;finishReason&quot;: &quot;STOP&quot;,\n      &quot;avgLogprobs&quot;: -0.12\n    }\n  ],\n  &quot;usageMetadata&quot;: {\n    &quot;promptTokenCount&quot;: 8,\n    &quot;candidatesTokenCount&quot;: 14,\n    &quot;totalTokenCount&quot;: 22\n  },\n  &quot;modelVersion&quot;: &quot;gemini-3-flash-preview&quot;\n}</code></pre>\n<h2 id=\"常见返回字段\">常见返回字段 </h2>\n<table><thead><tr><th>字段</th><th>说明</th></tr></thead><tbody><tr><td><code>candidates</code></td><td>候选结果数组</td></tr><tr><td><code>candidates[].content.parts[].text</code></td><td>模型输出文本</td></tr><tr><td><code>candidates[].finishReason</code></td><td>停止原因，常见如 <code>STOP</code></td></tr><tr><td><code>usageMetadata</code></td><td>token 统计信息</td></tr><tr><td><code>modelVersion</code></td><td>实际返回的模型版本</td></tr><tr><td><code>promptFeedback</code></td><td>提示词过滤或阻止信息</td></tr></tbody></table>\n<h2 id=\"流式输出\">流式输出 </h2>\n<p>如果你要流式返回，需要使用：</p>\n<pre data-lang=\"text\"><code>POST /v1beta/models/{model}:streamGenerateContent?alt=sse</code></pre>\n<p>示例：</p>\n<pre data-lang=\"bash\"><code>curl &quot;https://api.tokenapi168.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse&quot; \\\n  -H &quot;Authorization: Bearer sk-xxxxxxxxxxxx&quot; \\\n  -H &quot;Content-Type: application/json&quot; \\\n  --no-buffer \\\n  -d &#x27;{\n    &quot;contents&quot;: [\n      {\n        &quot;parts&quot;: [\n          {\n            &quot;text&quot;: &quot;Explain how AI works&quot;\n          }\n        ]\n      }\n    ]\n  }&#x27;</code></pre>\n<h2 id=\"适用场景\">适用场景 </h2>\n<ul><li>文本问答</li><li>多轮聊天</li><li>图文理解</li><li>音频、视频、PDF 理解后输出文本</li><li>JSON 结构化输出</li><li>工具调用和搜索增强</li></ul>\n<h2 id=\"注意事项\">注意事项 </h2>\n<ul><li><code>generateContent</code> 通常是同步接口，直接返回生成结果</li><li>如果输入的是图片、音频、视频等多模态内容，输出仍然通常是文本</li><li>如果需要视频生成，不应使用这个接口，而应看 <a href=\"#\">Veo 3.1 Fast 视频生成</a></li><li>如果需要流式文本输出，使用 <code>streamGenerateContent</code></li></ul>\n<h2 id=\"参考文档\">参考文档 </h2>\n<ul><li>Gemini Text Generation: <a href=\"https://ai.google.dev/gemini-api/docs/text-generation\" target=\"_blank\" rel=\"noreferrer\">https://ai.google.dev/gemini-api/docs/text-generation</a></li><li>Gemini 3 Developer Guide: <a href=\"https://ai.google.dev/gemini-api/docs/gemini-3\" target=\"_blank\" rel=\"noreferrer\">https://ai.google.dev/gemini-api/docs/gemini-3</a></li></ul>","h2_count":11,"h3_count":4,"code_count":20,"table_count":2,"char_count":7036},{"id":"veo-fast","group":"Gemini API","title":"Veo 3.1 Fast 视频生成","source_file":"粘贴的文本 (10).txt","html":"<h1 id=\"veo-3-1-fast-视频生成\">Veo 3.1 Fast 视频生成 </h1>\n<p>本文档说明FeiXiangApi兼容的 Gemini 视频生成接口：</p>\n<pre data-lang=\"text\"><code>POST /v1beta/models/veo-3.1-fast-generate-preview:generateContent</code></pre>\n<p>它的请求体风格与 Gemini <code>generateContent</code> 一致，使用 <code>contents[].parts[]</code> 传入内容，而不是 Google 官方 Veo 原生 REST 文档里的 <code>instances/parameters</code> 结构。</p>\n<h2 id=\"请求地址\">请求地址 </h2>\n<pre data-lang=\"text\"><code>POST https://api.tokenapi168.com/v1beta/models/veo-3.1-fast-generate-preview:generateContent</code></pre>\n<h2 id=\"鉴权\">鉴权 </h2>\n<ul><li>FeiXiangApi网关：<code>Authorization: Bearer sk-xxxxxxxxxxxx</code></li><li>Google 官方原生 Gemini API：通常使用 <code>x-goog-api-key: $GEMINI_API_KEY</code></li></ul>\n<h2 id=\"最小请求示例\">最小请求示例 </h2>\n<p>如果你只是传一个视频提示词，请求体就是这种结构：</p>\n<pre data-lang=\"bash\"><code>curl &quot;https://api.tokenapi168.com/v1beta/models/veo-3.1-fast-generate-preview:generateContent&quot; \\\n  -H &quot;Authorization: Bearer sk-xxxxxxxxxxxx&quot; \\\n  -H &quot;Content-Type: application/json&quot; \\\n  -X POST \\\n  -d &#x27;{\n    &quot;contents&quot;: [\n      {\n        &quot;parts&quot;: [\n          {\n            &quot;text&quot;: &quot;A cinematic shot of a majestic lion in the savannah.&quot;\n          }\n        ]\n      }\n    ]\n  }&#x27;</code></pre>\n<h2 id=\"请求体结构\">请求体结构 </h2>\n<pre data-lang=\"json\"><code>{\n  &quot;contents&quot;: [\n    {\n      &quot;parts&quot;: [\n        {\n          &quot;text&quot;: &quot;A cinematic shot of a majestic lion in the savannah.&quot;\n        }\n      ]\n    }\n  ]\n}</code></pre>\n<h2 id=\"常用请求字段\">常用请求字段 </h2>\n<table><thead><tr><th>字段</th><th>必填</th><th>说明</th></tr></thead><tbody><tr><td><code>contents</code></td><td>是</td><td>输入内容数组</td></tr><tr><td><code>contents[].role</code></td><td>否</td><td>角色，常见为 <code>user</code></td></tr><tr><td><code>contents[].parts</code></td><td>是</td><td>内容片段数组</td></tr><tr><td><code>parts[].text</code></td><td>是</td><td>视频生成提示词</td></tr><tr><td><code>parts[].inlineData</code></td><td>否</td><td>内联图片、音频或视频数据；如平台支持，可用于图生视频或参考素材</td></tr><tr><td><code>parts[].fileData</code></td><td>否</td><td>文件引用；如平台支持，可用于引用已上传素材</td></tr><tr><td><code>generationConfig</code></td><td>否</td><td>生成配置；如平台支持，可放宽高比、时长、输出偏好等扩展参数</td></tr><tr><td><code>safetySettings</code></td><td>否</td><td>安全过滤设置</td></tr></tbody></table>\n<div class=\"fx-callout fx-callout-tip\"><div class=\"fx-callout-title\">TIP</div><p>这类兼容接口的关键点是：入口仍然叫 <code>generateContent</code>，但模型本身是视频模型，所以最终结果通常不是一段文本，而是一个异步视频任务或视频结果引用。</p></div>\n<h2 id=\"示例\">示例 </h2>\n<h3 id=\"纯文本提示词生成视频\">纯文本提示词生成视频 </h3>\n<pre data-lang=\"json\"><code>{\n  &quot;contents&quot;: [\n    {\n      &quot;parts&quot;: [\n        {\n          &quot;text&quot;: &quot;A drone shot flying over snowy mountains at sunrise, cinematic, realistic lighting.&quot;\n        }\n      ]\n    }\n  ]\n}</code></pre>\n<h3 id=\"带系统提示词\">带系统提示词 </h3>\n<pre data-lang=\"json\"><code>{\n  &quot;system_instruction&quot;: {\n    &quot;parts&quot;: [\n      {\n        &quot;text&quot;: &quot;Generate concise, high-motion cinematic video prompts.&quot;\n      }\n    ]\n  },\n  &quot;contents&quot;: [\n    {\n      &quot;parts&quot;: [\n        {\n          &quot;text&quot;: &quot;A cat surfing on ocean waves at sunset.&quot;\n        }\n      ]\n    }\n  ]\n}</code></pre>\n<h3 id=\"带参考图片\">带参考图片 </h3>\n<pre data-lang=\"json\"><code>{\n  &quot;contents&quot;: [\n    {\n      &quot;parts&quot;: [\n        {\n          &quot;text&quot;: &quot;Animate this character walking through a neon-lit city street.&quot;\n        },\n        {\n          &quot;fileData&quot;: {\n            &quot;mimeType&quot;: &quot;image/png&quot;,\n            &quot;fileUri&quot;: &quot;https://example.com/reference.png&quot;\n          }\n        }\n      ]\n    }\n  ]\n}</code></pre>\n<h2 id=\"返回说明\">返回说明 </h2>\n<p>该接口虽然使用 <code>generateContent</code> 风格的请求体，但视频生成通常仍然按异步任务处理。</p>\n<p>也就是说，首次请求通常不会直接返回最终视频文件，而是先返回一个任务对象、操作对象，或者包含视频结果引用的响应。由于这是平台兼容接口，实际返回字段请以网关真实响应为准。</p>\n<h3 id=\"兼容任务返回示例\">兼容任务返回示例 </h3>\n<p>下面是适合文档展示的兼容示例：</p>\n<pre data-lang=\"json\"><code>{\n  &quot;id&quot;: &quot;video_task_123&quot;,\n  &quot;object&quot;: &quot;video.task&quot;,\n  &quot;model&quot;: &quot;veo-3.1-fast-generate-preview&quot;,\n  &quot;status&quot;: &quot;queued&quot;,\n  &quot;progress&quot;: 0,\n  &quot;created_at&quot;: 1712697600\n}</code></pre>\n<h3 id=\"处理中示例\">处理中示例 </h3>\n<pre data-lang=\"json\"><code>{\n  &quot;id&quot;: &quot;video_task_123&quot;,\n  &quot;object&quot;: &quot;video.task&quot;,\n  &quot;model&quot;: &quot;veo-3.1-fast-generate-preview&quot;,\n  &quot;status&quot;: &quot;processing&quot;,\n  &quot;progress&quot;: 42,\n  &quot;created_at&quot;: 1712697600\n}</code></pre>\n<h3 id=\"完成示例\">完成示例 </h3>\n<pre data-lang=\"json\"><code>{\n  &quot;id&quot;: &quot;video_task_123&quot;,\n  &quot;object&quot;: &quot;video.task&quot;,\n  &quot;model&quot;: &quot;veo-3.1-fast-generate-preview&quot;,\n  &quot;status&quot;: &quot;completed&quot;,\n  &quot;progress&quot;: 100,\n  &quot;created_at&quot;: 1712697600,\n  &quot;completed_at&quot;: 1712697815,\n  &quot;result&quot;: {\n    &quot;video_url&quot;: &quot;https://example.com/output.mp4&quot;\n  }\n}</code></pre>\n<h3 id=\"失败示例\">失败示例 </h3>\n<pre data-lang=\"json\"><code>{\n  &quot;id&quot;: &quot;video_task_123&quot;,\n  &quot;object&quot;: &quot;video.task&quot;,\n  &quot;model&quot;: &quot;veo-3.1-fast-generate-preview&quot;,\n  &quot;status&quot;: &quot;failed&quot;,\n  &quot;progress&quot;: 15,\n  &quot;error&quot;: {\n    &quot;code&quot;: &quot;generation_blocked&quot;,\n    &quot;message&quot;: &quot;The request was blocked by a safety filter.&quot;\n  }\n}</code></pre>\n<div class=\"fx-callout fx-callout-warning\"><div class=\"fx-callout-title\">WARNING</div><p>上面的任务返回示例是按“平台兼容的 generateContent 视频接口”整理的文档示例，不是 Google 官方逐字返回。你的网关如果已有固定字段，应以实际返回为准继续细化。</p></div>\n<h2 id=\"建议文档口径\">建议文档口径 </h2>\n<p>如果你的平台就是这种接口风格，文档建议统一写成：</p>\n<ul><li>请求入口：<code>POST /v1beta/models/veo-3.1-fast-generate-preview:generateContent</code></li><li>请求体结构：<code>contents[].parts[].text</code></li><li>结果类型：异步视频任务</li><li>状态字段：<code>status</code>、<code>progress</code></li><li>成功结果：返回视频地址或文件引用</li></ul>\n<h2 id=\"与-google-官方原生接口的差异\">与 Google 官方原生接口的差异 </h2>\n<p>截至 <code>2026-03-23</code>，Google AI for Developers 在 <code>2026-03-05 UTC</code> 更新的 Veo 3.1 文档里，原生 REST 主示例仍是：</p>\n<pre data-lang=\"text\"><code>POST /v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning</code></pre>\n<p>也就是说：</p>\n<ul><li>Google 官方原生：偏 <code>predictLongRunning</code> 风格</li><li>你当前需要的FeiXiangApi兼容文档：偏 <code>generateContent</code> 风格</li></ul>\n<p>这两者不是同一套请求体格式，文档里需要明确区分。</p>\n<h2 id=\"参考文档\">参考文档 </h2>\n<ul><li>Gemini Veo 3.1 视频生成文档: <a href=\"https://ai.google.dev/gemini-api/docs/video?hl=zh-CN\" target=\"_blank\" rel=\"noreferrer\">https://ai.google.dev/gemini-api/docs/video?hl=zh-CN</a></li><li>Gemini Text Generation: <a href=\"https://ai.google.dev/gemini-api/docs/text-generation\" target=\"_blank\" rel=\"noreferrer\">https://ai.google.dev/gemini-api/docs/text-generation</a></li></ul>","h2_count":10,"h3_count":7,"code_count":24,"table_count":1,"char_count":6894},{"id":"openclaw","group":"OpenClaw","title":"OpenClaw 从安装到入门的完全指南（2026-02-04）","source_file":"粘贴的文本 (11).txt","html":"<h1 id=\"openclaw-从安装到入门的完全指南-2026-02-04\">OpenClaw 从安装到入门的完全指南（2026-02-04） </h1>\n<blockquote><p>版本说明：本文基于 OpenClaw 最新版本编写，最后更新：2026-02-04 适用平台：Windows（推荐 WSL2）、macOS、Linux</p></blockquote>\n<hr />\n<p>你可能已经体验过&quot;AI 写得很像，但事还是得自己做&quot;：邮件写好了还得你点发送，日历建议给了还得你自己改，Bug 分析完了还得你开 IDE 修。</p>\n<p>OpenClaw 的定位更像一个&quot;能动手的同事&quot;：你在聊天里发一句话，它在你自己的机器上执行（读写文件、跑命令、调邮箱/日历/浏览器），然后把结果回你。</p>\n<p>这篇文章只做一件事：带你从 0 安装到跑通第一个可用闭环，并把新手最容易踩的坑提前标出来。</p>\n<hr />\n<h2 id=\"快速通关路径-20-分钟\">🚀 快速通关路径（20 分钟） </h2>\n<p>如果你只想最快跑通，按这个顺序：</p>\n<ol><li><strong>安装</strong>：<code>curl -fsSL https://openclaw.ai/install.sh | bash</code></li><li><strong>配置</strong>：<code>openclaw onboard --install-daemon</code><ul><li>选择模型（Anthropic/Moonshot）</li><li>选择 Telegram</li><li>安装 daemon</li></ul></li><li><strong>配对</strong>：在 Telegram 私聊 bot，运行 <code>openclaw pairing approve telegram</code></li><li><strong>测试</strong>：发消息给 bot，看是否回复</li></ol>\n<p>详细说明见下文各章节。如果卡住，直接跳到 <a href=\"#_9-常见问题排查80-的问题在这里\">常见问题排查</a>。</p>\n<hr />\n<h2 id=\"目录\">目录 </h2>\n<ol><li><a href=\"#_1-开装前先搞清楚你要的是什么\">开装前先搞清楚：你要的是什么</a></li><li><a href=\"#_2-openclaw-架构全景gatewayagentchannelstools-如何协作\">OpenClaw 架构全景：Gateway、Agent、Channels、Tools 如何协作</a></li><li><a href=\"#_3-环境准备\">环境准备</a></li><li><a href=\"#_4-安装-openclaw两种路线\">安装 OpenClaw（两种路线）</a></li><li><a href=\"#_5-首次配置onboard-向导逐项填写指南含命令行视图\">首次配置：onboard 向导逐项填写指南（含命令行视图）</a></li><li><a href=\"#_6-接入-kimi-moonshot从获取-api-key-到验证\">6. 接入 FeiXiangApi (FeiXiangApi)：从获取 API Key 到验证</a></li><li><a href=\"#_7-跑通最小闭环从能回复到真执行\">跑通最小闭环：从&quot;能回复&quot;到&quot;真执行&quot;</a></li><li><a href=\"#_8-新手最佳实践先只接一个能力\">新手最佳实践：先只接一个能力</a></li><li><a href=\"#_9-常见问题排查80-的问题在这里\">常见问题排查（80% 的问题在这里）</a></li><li><a href=\"#_10-安全与隐私越能干活越要克制\">安全与隐私：越能干活越要克制</a></li><li><a href=\"#_11-下一步从能用到好用\">下一步：从&quot;能用&quot;到&quot;好用&quot;</a></li></ol>\n<hr />\n<h2 id=\"_1-开装前先搞清楚-你要的是什么\">1. 开装前先搞清楚：你要的是什么 </h2>\n<p>OpenClaw 不是&quot;又一个聊天机器人&quot;，更像一个自托管的个人智能体：</p>\n<ul><li><strong>入口</strong>：你用 Telegram / WhatsApp 等聊天应用发指令</li><li><strong>大脑</strong>：背后接一个大模型（可能是云端 API，也可能是本地模型）</li><li><strong>双手</strong>：在你机器上执行你授权过的动作（终端、浏览器、邮件、日历……）</li><li><strong>记忆</strong>：能跨会话保存配置与上下文（取决于你怎么部署与配置）</li></ul>\n<p>你装它的正确理由只有一个：你手上有一件重复、琐碎、需要切来切去的事，想用&quot;发一句话&quot;替代&quot;打开 5 个 App 点 20 次&quot;。</p>\n<hr />\n<h2 id=\"_2-openclaw-架构全景-gateway-agent-channels-tools-如何协作\">2. OpenClaw 架构全景：Gateway、Agent、Channels、Tools 如何协作 </h2>\n<p>在开始安装前，先理解 OpenClaw 的架构能帮你少走弯路。</p>\n<h3 id=\"核心组件\">核心组件 </h3>\n<pre data-lang=\"text\"><code>┌─────────────────────────────────────────────────────────────┐\n│                     你的聊天应用                              │\n│  (Telegram / WhatsApp / Discord / Signal / WebChat)        │\n└────────────────────┬──────────────────────────────────────┘\n                      │ 消息流入/流出\n                      ▼\n┌─────────────────────────────────────────────────────────────┐\n│                    Gateway (守护进程)                         │\n│  • 管理所有 Channels（Telegram、WhatsApp 等）                │\n│  • 暴露 WebSocket API (默认 127.0.0.1:18789)                 │\n│  • 处理配对（pairing）、认证、事件分发                        │\n│  • 一个 Gateway 控制一台机器上的所有会话                      │\n└────────────────────┬──────────────────────────────────────┘\n                      │ RPC 调用\n                      ▼\n┌─────────────────────────────────────────────────────────────┐\n│                    Agent Runtime (智能体运行时)               │\n│  • 维护会话（Session）与上下文（Context）                      │\n│  • 执行 Agent Loop：接收消息 → 调用模型 → 执行工具 → 返回    │\n│  • 管理持久记忆（Memory）                                     │\n│  • 可配置多个 Agent（不同 workspace、不同模型）              │\n└────────────────────┬──────────────────────────────────────┘\n                      │ 工具调用\n        ┌─────────────┼─────────────┬─────────────┐\n        ▼             ▼             ▼             ▼\n┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐\n│  Browser │  │   Exec   │  │   Web    │  │  Skills  │\n│  (浏览器) │  │ (终端命令) │  │ (网页搜索) │  │ (插件)   │\n└──────────┘  └──────────┘  └──────────┘  └──────────┘\n        │             │             │             │\n        └─────────────┴─────────────┴─────────────┘\n                      │\n                      ▼\n┌─────────────────────────────────────────────────────────────┐\n│                     Model Provider                           │\n│  (Anthropic / OpenAI / Moonshot / 本地模型)                 │\n└─────────────────────────────────────────────────────────────┘</code></pre>\n<h3 id=\"数据流向-一次完整对话\">数据流向（一次完整对话） </h3>\n<ol><li><strong>消息流入</strong>：你在 Telegram 发&quot;清一下今天的邮件&quot; <ul><li>Gateway 接收消息 → 标准化为内部消息格式 → 路由到对应 Agent</li></ul></li><li><strong>Agent Loop</strong>： <ul><li>Agent 读取会话历史 + 系统提示词（System Prompt）</li><li>调用模型 API（例如 moonshot/kimi-k2.5）</li><li>模型返回&quot;需要调用 Gmail API&quot;</li><li>Agent 执行工具（例如 gmail.list）</li><li>工具返回结果 → Agent 再次调用模型 → 生成回复</li></ul></li><li><strong>消息流出</strong>：Agent 的回复 → Gateway → Telegram → 你看到结果</li></ol>\n<h3 id=\"关键概念\">关键概念 </h3>\n<ul><li><strong>Gateway</strong>：唯一的长驻进程（daemon），管理所有 Channels 和连接 <ul><li>类比：Gateway 就像&quot;总机&quot;，所有消息都经过它</li><li>位置：运行在后台，通过 systemd（Linux/WSL2）/ LaunchAgent（macOS）管理</li><li>端口：默认 127.0.0.1:18789（WebSocket API）</li></ul></li><li><strong>Agent</strong>：处理对话逻辑的运行时，可以有多个（不同用途） <ul><li>类比：Agent 是&quot;接线员&quot;，负责理解你的意图并执行</li><li>配置：每个 Agent 有独立的 workspace 和模型</li><li>存储：配置在 <code>~/.openclaw/agents/&lt;agent_id&gt;/</code></li></ul></li><li><strong>Session</strong>：一次对话的上下文容器（跨消息保持） <ul><li>存储位置：<code>~/.openclaw/agents/&lt;agent_id&gt;/sessions/</code></li><li>生命周期：会话会被定期修剪（可配置保留策略）</li><li>作用：让 Agent 记住之前的对话内容</li></ul></li><li><strong>Workspace</strong>：Agent 的工作目录（文件、脚本、配置） <ul><li>默认位置：<code>~/.openclaw/workspace/</code></li><li>用途：存放 Agent 创建/修改的文件、脚本、配置模板</li><li>结构：包含 BOOT.md、IDENTITY.md、SOUL.md、TOOLS.md 等模板文件</li></ul></li><li><strong>Pairing</strong>：设备/用户配对机制，用于安全接入 <ul><li>流程：首次连接 → 生成配对码（8位） → 用户批准 → 建立信任</li><li>存储：<code>~/.openclaw/credentials/*-pairing.json</code></li><li>用途：防止陌生人把你的机器人当公共服务使用</li></ul></li><li><strong>Tools</strong>：Agent 能调用的能力（浏览器、终端、Skills） <ul><li>内置工具：browser（浏览器）、exec（终端命令）、web（网页搜索）</li><li>Skills：社区插件，扩展能力（如 Gmail、Calendar）</li></ul></li><li><strong>Channels</strong>：消息入口（Telegram、WhatsApp 等） <ul><li>作用：接收和发送消息</li><li>配置：每个 Channel 需要对应的 Token/凭证</li></ul></li></ul>\n<h3 id=\"为什么需要-gateway\">为什么需要 Gateway？ </h3>\n<p>Gateway 的设计让 OpenClaw 能：</p>\n<ul><li><strong>统一管理</strong>：一个进程控制所有聊天渠道</li><li><strong>多客户端</strong>：CLI、Web UI、macOS App 都连同一个 Gateway</li><li><strong>远程访问</strong>：通过 SSH 隧道或 Tailscale 访问远程 Gateway</li><li><strong>设备配对</strong>：iOS/Android 节点通过配对机制安全接入</li></ul>\n<h3 id=\"配置文件位置\">配置文件位置 </h3>\n<table><thead><tr><th>类型</th><th>路径</th></tr></thead><tbody><tr><td>主配置</td><td><code>~/.openclaw/openclaw.json</code></td></tr><tr><td>凭证</td><td><code>~/.openclaw/credentials/</code>（OAuth、API Keys）</td></tr><tr><td>会话</td><td><code>~/.openclaw/agents/&lt;agent_id&gt;/sessions/</code></td></tr><tr><td>Workspace</td><td><code>~/.openclaw/workspace/</code>（默认）</td></tr></tbody></table>\n<hr />\n<h2 id=\"_3-环境准备\">3. 环境准备 </h2>\n<p>下面按&quot;能跑起来优先&quot;的顺序来。你不需要一次装齐所有东西，但缺关键依赖会导致安装/构建失败。</p>\n<h3 id=\"必备-所有平台\">必备（所有平台） </h3>\n<ul><li><strong>Node.js</strong>：官方要求 <strong>Node &gt;= 22</strong></li><li><strong>Git</strong>：走源码路线时需要</li><li><strong>可用的模型 API</strong>：比如 Anthropic / OpenAI / Moonshot 等（或你已有本地推理环境）</li></ul>\n<h3 id=\"平台特定要求\">平台特定要求 </h3>\n<h4 id=\"windows\">Windows </h4>\n<ul><li><strong>WSL2（强烈建议）</strong>：官方明确推荐 Windows 通过 WSL2（Ubuntu 推荐）运行；原生 Windows &quot;未充分测试&quot;，工具兼容性更差</li><li><strong>PowerShell 5.1+</strong> 或 <strong>PowerShell Core 7+</strong>（用于安装脚本）</li></ul>\n<p>如果你还没装 WSL2（可选，但很值得）：</p>\n<p>PowerShell（管理员）：</p>\n<pre data-lang=\"powershell\"><code>wsl --install\n# 或者指定发行版：\nwsl --list --online\nwsl --install -d Ubuntu-24.04</code></pre>\n<p>为 WSL2 开启 systemd：</p>\n<pre data-lang=\"bash\"><code>sudo tee /etc/wsl.conf &gt;/dev/null &lt;&lt;&#x27;EOF&#x27;\n[boot]\nsystemd=true\nEOF</code></pre>\n<p>回到 PowerShell 执行：</p>\n<pre data-lang=\"powershell\"><code>wsl --shutdown</code></pre>\n<p>再打开 Ubuntu 终端，验证：</p>\n<pre data-lang=\"bash\"><code>systemctl --user status</code></pre>\n<h4 id=\"macos\">macOS </h4>\n<ul><li><strong>macOS 14+</strong>（如果要用 macOS 伴侣应用）</li><li><strong>Xcode Command Line Tools</strong>（如果从源码构建）：<code>xcode-select --install</code></li></ul>\n<h4 id=\"linux\">Linux </h4>\n<ul><li><strong>systemd</strong>（用于 daemon 安装，大多数现代发行版已内置）</li><li><strong>curl</strong> 或 <strong>wget</strong>（用于安装脚本）</li></ul>\n<h3 id=\"可选-但强烈建议\">可选（但强烈建议） </h3>\n<ul><li>密码/密钥管理习惯：至少做到&quot;不要把 Key 直接写进公开文档/截图&quot;</li><li><strong>pnpm</strong>（如果从源码构建，推荐使用 pnpm）</li></ul>\n<h3 id=\"开始前先做两条自检-30-秒\">开始前先做两条自检（30 秒） </h3>\n<pre data-lang=\"bash\"><code>node -v\nnpm -v</code></pre>\n<p>预期输出：</p>\n<pre data-lang=\"text\"><code>v22.0.0  # 或更高版本\n10.0.0   # npm 版本</code></pre>\n<p>如果 Node 版本 &lt; 22，先升级再继续。否则后面你会在各种奇怪的地方卡住。</p>\n<p>各平台升级 Node.js：</p>\n<ul><li><strong>macOS</strong>：<code>brew install node@22</code> 或从 nodejs.org 下载</li><li><strong>Linux/WSL2</strong>：使用 nvm 或从 nodejs.org 下载</li><li><strong>Windows</strong>：从 nodejs.org 下载安装包</li></ul>\n<blockquote><p>参考入口：官网 <a href=\"https://openclaw.ai/%EF%BC%8C%E5%AE%98%E6%96%B9%E6%96%87%E6%A1%A3\" target=\"_blank\" rel=\"noreferrer\">https://openclaw.ai/，官方文档</a> <a href=\"https://docs.openclaw.ai/%EF%BC%88%E4%BB%A5%E6%9C%80%E6%96%B0%E4%B8%BA%E5%87%86%EF%BC%89%E3%80%82\" target=\"_blank\" rel=\"noreferrer\">https://docs.openclaw.ai/（以最新为准）。</a></p></blockquote>\n<hr />\n<h2 id=\"_4-安装-openclaw-两种路线\">4. 安装 OpenClaw（两种路线） </h2>\n<h3 id=\"路线-a-cli-安装-推荐新手\">路线 A：CLI 安装（推荐新手） </h3>\n<p>目标是：最少步骤，先跑通。</p>\n<h4 id=\"方式-1-一键安装脚本-推荐\">方式 1：一键安装脚本（推荐） </h4>\n<p>macOS / Linux / WSL2（bash）：</p>\n<pre data-lang=\"bash\"><code>curl -fsSL https://openclaw.ai/install.sh | bash</code></pre>\n<p>命令行输出示例：</p>\n<pre data-lang=\"text\"><code>🦞 OpenClaw Installer\n─────────────────────────────────────\n\nDetected platform: linux (WSL2)\nNode version: v22.1.0 ✓\nInstalling openclaw@latest...\n✓ Installed successfully\n\nNext step: Run &#x27;openclaw onboard --install-daemon&#x27;</code></pre>\n<p>Windows（PowerShell，原生，不推荐）：</p>\n<pre data-lang=\"powershell\"><code>iwr -useb https://openclaw.ai/install.ps1 | iex</code></pre>\n<blockquote><p>注意：Windows 原生支持有限，强烈建议使用 WSL2。</p></blockquote>\n<h4 id=\"方式-2-手动全局安装-你已经有-node-时\">方式 2：手动全局安装（你已经有 Node 时） </h4>\n<pre data-lang=\"bash\"><code>npm install -g openclaw@latest</code></pre>\n<p>或者（如果你用 pnpm）：</p>\n<pre data-lang=\"bash\"><code>pnpm add -g openclaw@latest\npnpm approve-builds -g</code></pre>\n<h4 id=\"安装后下一步-别跳过\">安装后下一步（别跳过） </h4>\n<pre data-lang=\"bash\"><code>openclaw onboard --install-daemon\nopenclaw doctor\nopenclaw dashboard</code></pre>\n<blockquote><p>官方提示：如果你要用 WhatsApp 或 Telegram，Gateway 运行时建议使用 Node；Bun 在这些渠道上有已知问题。</p></blockquote>\n<h3 id=\"路线-b-源码安装-适合想改代码的人\">路线 B：源码安装（适合想改代码的人） </h3>\n<p>目标是：能调试、能二次开发。</p>\n<pre data-lang=\"bash\"><code>git clone https://github.com/openclaw/openclaw.git\ncd openclaw\npnpm install\npnpm ui:build\npnpm build\nopenclaw onboard --install-daemon</code></pre>\n<hr />\n<h2 id=\"_5-首次配置-onboard-向导逐项填写指南-含命令行视图\">5. 首次配置：onboard 向导逐项填写指南（含命令行视图） </h2>\n<p>新手最常见的失败不是&quot;模型不聪明&quot;，而是消息根本没到你的 OpenClaw。<code>openclaw onboard</code> 是官方推荐的配置方式，下面逐项说明每个步骤该怎么填、为什么这样填。</p>\n<h3 id=\"启动向导\">启动向导 </h3>\n<pre data-lang=\"bash\"><code>openclaw onboard --install-daemon</code></pre>\n<p>命令行输出示例：</p>\n<pre data-lang=\"text\"><code>🦞 OpenClaw Onboarding Wizard\n─────────────────────────────────────\n\nWelcome! This wizard will help you set up OpenClaw.\n\nMode selection:\n  [1] QuickStart (recommended for first-time users)\n  [2] Advanced (full control over every setting)\n\nChoose mode [1]:</code></pre>\n<p>选择建议：第一次用选 1（QuickStart），它会用合理的默认值；想完全控制选 2。</p>\n<h3 id=\"步骤-1-检测现有配置\">步骤 1：检测现有配置 </h3>\n<p>如果之前跑过，向导会检测到：</p>\n<pre data-lang=\"text\"><code>Found existing config at ~/.openclaw/openclaw.json\n\nWhat would you like to do?\n  [1] Keep existing config\n  [2] Modify existing config\n  [3] Reset (start fresh)\n\nChoose [1-3] [1]:</code></pre>\n<p>选择建议：</p>\n<ul><li><strong>1</strong>：保留现有配置，只补充缺失项</li><li><strong>2</strong>：修改部分配置</li><li><strong>3</strong>：清空重来（会提示确认，包括是否删除凭证和会话）</li></ul>\n<h3 id=\"步骤-2-选择模式-local-vs-remote\">步骤 2：选择模式（Local vs Remote） </h3>\n<pre data-lang=\"text\"><code>Gateway mode:\n  [1] Local (run Gateway on this machine)\n  [2] Remote (connect to Gateway elsewhere)\n\nChoose [1-2] [1]:</code></pre>\n<p>选择建议：第一次用选 1（Local）。Remote 模式只配置客户端连接，不安装 Gateway。</p>\n<h3 id=\"步骤-3-模型与认证-最重要\">步骤 3：模型与认证（最重要） </h3>\n<p>这是最容易卡住的地方。向导会先检测环境变量：</p>\n<pre data-lang=\"text\"><code>Checking for existing API keys...\n  ✓ Found ANTHROPIC_API_KEY in environment\n  ✓ Found OPENAI_API_KEY in environment\n  ✗ No MOONSHOT_API_KEY found\n\nAuthentication method:\n  [1] Anthropic API Key (recommended)\n  [2] Anthropic OAuth (Claude Code CLI)\n  [3] Anthropic setup-token (paste)\n  [4] OpenAI Code (Codex) subscription\n  [5] OpenAI API Key\n  [6] Moonshot (Kimi K2)\n  [7] MiniMax M2.1\n  [8] OpenCode Zen\n  [9] Vercel AI Gateway\n  [10] Synthetic\n  [11] Skip (configure later)\n\nChoose [1-11] [1]:</code></pre>\n<p>选择建议（按常见度）：</p>\n<ul><li><strong>1 Anthropic API Key</strong>：如果你有 Claude API Key</li><li><strong>6 Moonshot (Kimi K2)</strong>：如果你要用 Kimi</li><li><strong>2 Anthropic OAuth</strong>：如果你有 Claude Code 订阅</li></ul>\n<h3 id=\"步骤-4-workspace-配置\">步骤 4：Workspace 配置 </h3>\n<pre data-lang=\"text\"><code>Workspace location:\n  Default: ~/.openclaw/workspace\n  [1] Use default\n  [2] Custom path\n\nChoose [1-2] [1]:</code></pre>\n<p>选择建议：第一次用选 1。</p>\n<h3 id=\"步骤-5-gateway-配置\">步骤 5：Gateway 配置 </h3>\n<pre data-lang=\"text\"><code>Gateway settings:\n  Port: 18789\n  Bind: 127.0.0.1 (loopback)\n  Auth: Token (auto-generated)\n\n  [1] Keep defaults\n  [2] Customize\n\nChoose [1-2] [1]:</code></pre>\n<p>选择建议：第一次用选 1。</p>\n<h3 id=\"步骤-6-渠道配置-channels\">步骤 6：渠道配置（Channels） </h3>\n<pre data-lang=\"text\"><code>Channel setup:\n  [1] Telegram\n  [2] WhatsApp\n  [3] Discord\n  [4] Google Chat\n  [5] Signal\n  [6] Skip (configure later)\n\nChoose channels (comma-separated, e.g., 1,3) [1]:</code></pre>\n<p>选择建议：第一次用选 1（Telegram），最简单。</p>\n<p>输入 Token：粘贴你从 BotFather 拿到的 token（类似 <code>123456789:ABCdefGHIjklMNOpqrsTUVwxyz</code>）</p>\n<h3 id=\"步骤-7-daemon-安装-后台服务\">步骤 7：Daemon 安装（后台服务） </h3>\n<pre data-lang=\"text\"><code>Daemon installation:\n  Install Gateway as a background service?\n  This allows Gateway to run automatically on startup.\n\n  [1] Yes (recommended)\n  [2] No (run manually)\n\nChoose [1-2] [1]:</code></pre>\n<p>选择建议：选 1，这样 Gateway 会在后台运行，重启后自动启动。</p>\n<h3 id=\"步骤-8-健康检查\">步骤 8：健康检查 </h3>\n<pre data-lang=\"text\"><code>Running health check...\n  Starting Gateway...\n  ✓ Gateway started\n  ✓ Health check passed\n  ✓ Model API accessible\n  ✓ Telegram channel connected\n\nStatus:\n  Gateway: running (PID 12345)\n  Port: 18789\n  Channels: telegram (connected)\n  Model: anthropic/claude-3.5-sonnet-20241022</code></pre>\n<h3 id=\"步骤-9-skills-安装-可选\">步骤 9：Skills 安装（可选） </h3>\n<pre data-lang=\"text\"><code>Skills installation:\n  Skills are plugins that extend Agent capabilities.\n  Recommended skills:\n    - gmail (email management)\n    - calendar (calendar integration)\n    - web-search (Brave Search API)\n\n  [1] Install recommended skills\n  [2] Skip (install later)\n\nChoose [1-2] [1]:</code></pre>\n<p>选择建议：第一次用可以选 2（跳过），先跑通基本流程再装 Skills。</p>\n<h3 id=\"步骤-10-完成\">步骤 10：完成 </h3>\n<pre data-lang=\"text\"><code>  2. Test the connection:\n     openclaw status\n     openclaw health\n\n  3. Open the dashboard:\n     openclaw dashboard\n     (or visit http://127.0.0.1:18789/)\n\n  4. Configure skills (optional):\n     openclaw configure --section web\n     openclaw configure --section gmail\n\nConfig saved to: ~/.openclaw/openclaw.json</code></pre>\n<h3 id=\"非交互模式-脚本-自动化\">非交互模式（脚本/自动化） </h3>\n<pre data-lang=\"bash\"><code>openclaw onboard --non-interactive \\\n  --mode local \\\n  --auth-choice moonshot-api-key \\\n  --moonshot-api-key &quot;$MOONSHOT_API_KEY&quot; \\\n  --gateway-port 18789 \\\n  --gateway-bind loopback \\\n  --install-daemon \\\n  --daemon-runtime node \\\n  --skip-skills</code></pre>\n<blockquote><p>注意：非交互模式的参数格式可能因 OpenClaw 版本而异。建议先运行 <code>openclaw onboard --help</code> 查看实际可用参数。</p></blockquote>\n<h3 id=\"配置修改-后续调整\">配置修改（后续调整） </h3>\n<p>如果后续想修改配置，用：</p>\n<pre data-lang=\"bash\"><code>openclaw configure</code></pre>\n<h3 id=\"先用-最快路径-验证-不接任何渠道也能先聊天\">先用&quot;最快路径&quot;验证：不接任何渠道也能先聊天 </h3>\n<p>官方给的最快体验方式是直接开 Web 控制台（不需要先配 Telegram/WhatsApp）：</p>\n<pre data-lang=\"bash\"><code>openclaw dashboard</code></pre>\n<p>或直接打开 <a href=\"http://127.0.0.1:18789/%EF%BC%88%E5%9C%A8\" target=\"_blank\" rel=\"noreferrer\">http://127.0.0.1:18789/（在</a> gateway 所在机器上）。</p>\n<hr />\n<h2 id=\"_6-接入-feixiangapiapi-huobao-从获取-api-key-到验证\">6. 接入 FeiXiangApi (FeiXiangApi)：从获取 API Key 到验证 </h2>\n<h3 id=\"步骤-1-获取-huobao-api-key\">步骤 1：获取 FeiXiangApi Key </h3>\n<ol><li>访问 Moonshot 官网：<a href=\"https://api.tokenapi168.com/\" target=\"_blank\" rel=\"noreferrer\">https://api.tokenapi168.com/</a></li><li>注册/登录账号</li><li>创建 API Key：进入控制台 → API Keys → 点击&quot;令牌管理&quot; → 复制 Key（格式类似 <code>sk-...</code>）</li></ol>\n<p>启动openclaw的配置程序</p>\n<pre data-lang=\"text\"><code>openclaw onboard</code></pre>\n<p>选择yes</p>\n<pre data-lang=\"text\"><code>*  I understand this is powerful and inherently risky. Continue?\n|    &gt; Yes /  No</code></pre>\n<p>选择quick Start</p>\n<pre data-lang=\"text\"><code>*  Onboarding mode\n|  &gt; QuickStart (Configure details later via openclaw configure.)\n|    Manual</code></pre>\n<p>选择custom Provider</p>\n<p>这里需要一直往下翻（小键盘下）</p>\n<pre data-lang=\"text\"><code> Model/auth provider\n|  &gt; OpenAI (Codex OAuth + API key)\n|    Anthropic\n|    Chutes\n|    vLLM\n|    MiniMax\n|    Moonshot AI (Kimi K2.5)\n|    Google\n|    xAI (Grok)\n|    Mistral AI\n|    Volcano Engine\n|    BytePlus\n|    OpenRouter\n|    Qwen\n|    Z.AI\n|    Qianfan\n|    Copilot\n|    Vercel AI Gateway\n|    OpenCode Zen\n|    Xiaomi\n|    Synthetic\n|    Together AI\n|    Hugging Face\n|    Venice AI\n|    LiteLLM</code></pre>\n<pre data-lang=\"text\"><code>|    vLLM\n|    MiniMax\n|    Moonshot AI (Kimi K2.5)\n|    Google\n|    xAI (Grok)\n|    Mistral AI\n|    Volcano Engine\n|    BytePlus\n|    OpenRouter\n|    Qwen\n|    Z.AI\n|    Qianfan\n|    Copilot\n|    Vercel AI Gateway\n|    OpenCode Zen\n|    Xiaomi\n|    Synthetic\n|    Together AI\n|    Hugging Face\n|    Venice AI\n|    LiteLLM\n|    Cloudflare AI Gateway\n|  &gt; Custom Provider (Any OpenAI or Anthropic compatible endpoint)\n|    Skip for now</code></pre>\n<p>填写API Base URL (<a href=\"https://api.tokenapi168.com/v1\" target=\"_blank\" rel=\"noreferrer\">https://api.tokenapi168.com/v1</a>)</p>\n<pre data-lang=\"text\"><code>o  API Base URL\n|  https://api.tokenapi168.com/v1</code></pre>\n<p>填写你的API Key</p>\n<pre data-lang=\"text\"><code>API key的获取流程\n1.登录 https://api.tokenapi168.com \n2.进入 (令牌管理)\n3.添加令牌  --》 名称任意 --》 Anthropic Claude分组(这里看你使用什么模型就选择什么分组)\n4.复制令牌填写</code></pre>\n<p>sk开头的密钥</p>\n<pre data-lang=\"text\"><code>o  API Key (leave blank if not required)\n|  sk-z2c8yMCOY4JFc3pUy6RVImo2oXXnAn6UCoXxxxxxxx</code></pre>\n<p>选择是Anthropic 还是 OpenAI 的模型</p>\n<pre data-lang=\"text\"><code>*  Endpoint compatibility\n|  &gt; OpenAI-compatible (Uses /chat/completions)\n|    Anthropic-compatible\n|    Unknown (detect automatically)</code></pre>\n<p>除了 [Anthropic Claude] 和 [Claude] 分组 需要选择Anthropic-compatible ，其他的通通选择OpenAI-compatible , 我们演示的是Claude opus-4-6 所以我们选择Anthropic</p>\n<pre data-lang=\"text\"><code>o  Endpoint compatibility\n|  Anthropic-compatible</code></pre>\n<p>选择你的Model ID ,这里填写的是模型名称 。 你需要去模型广场找到需要使用的模型名称。</p>\n<p>我们这里演示的是 claude-opus-4-6</p>\n<pre data-lang=\"text\"><code>o  Model ID\n|  claude-opus-4-6\n|\no  Verification successful.</code></pre>\n<p>填写Endpoint ID 和model ID 一致</p>\n<pre data-lang=\"text\"><code>claude-opus-4-6</code></pre>\n<p>填写* Model alias (optional) 随意填写 也可以跳过</p>\n<pre data-lang=\"text\"><code>o  Model alias (optional)\n|  c</code></pre>\n<hr />\n<p>上述就是FeiXiangApi配置龙虾Key的全流程</p>\n<hr />\n<h2 id=\"_7-跑通最小闭环-从-能回复-到-真执行\">7. 跑通最小闭环：从&quot;能回复&quot;到&quot;真执行&quot; </h2>\n<p>把它当成&quot;新同事入职考核&quot;，别一上来就让它接 Gmail、改生产库、开 PR。</p>\n<h3 id=\"第一步-确认它能稳定回复\">第一步：确认它能稳定回复 </h3>\n<p>在聊天里发：</p>\n<ul><li>「你是谁？你能做什么？」</li><li>「把你当前的能力用 5 条列出来」</li></ul>\n<p>只要它稳定回复，说明聊天链路基本 OK。</p>\n<h3 id=\"第二步-做一个-低风险的执行任务\">第二步：做一个&quot;低风险的执行任务&quot; </h3>\n<p>挑一个不会造成损失的任务，例如：</p>\n<ul><li>「告诉我现在的时间」</li><li>「把我这段文字改成更清晰的三句话」（纯文本）</li><li>「列出当前工作目录有哪些文件」（如果你允许它访问本机文件）</li></ul>\n<p>关键不是任务大小，而是看到这个闭环：</p>\n<blockquote><p><strong>发消息 → 它执行（调用工具/读取环境） → 结构化返回结果</strong></p></blockquote>\n<p>如果你卡在这一步，先跳到 <a href=\"#_9-常见问题排查80-的问题在这里\">常见问题排查</a>。</p>\n<h3 id=\"_0-成本的-官方自检三连-强烈建议跑一次\">0 成本的&quot;官方自检三连&quot;（强烈建议跑一次） </h3>\n<pre data-lang=\"bash\"><code>openclaw status\nopenclaw health\nopenclaw security audit --deep</code></pre>\n<p>Gateway 运行方式说明：</p>\n<ul><li><code>openclaw gateway run</code>：前台运行，便于调试，按 Ctrl+C 停止</li><li><code>openclaw gateway start</code>：后台启动服务（需要先 <code>openclaw gateway install</code>）</li><li><code>openclaw gateway status</code>：查看服务状态</li></ul>\n<p>想手动前台跑（便于看日志）：</p>\n<pre data-lang=\"bash\"><code>openclaw gateway run --port 18789 --verbose</code></pre>\n<hr />\n<h2 id=\"_8-新手最佳实践-先只接一个能力\">8. 新手最佳实践：先只接一个能力 </h2>\n<p>OpenClaw 的上限很高，但新手最容易犯的错是&quot;第一次就想全自动化人生&quot;。</p>\n<p>我的建议是：<strong>只接一个你明天就会用的能力</strong>，比如二选一：</p>\n<ul><li><strong>邮件</strong>：你每天要清收件箱。任务例子：「把今天所有促销类邮件标已读并归档」</li><li><strong>日历</strong>：你总忘看行程。任务例子：「把我明天的日程按时间顺序整理成 5 行摘要」</li></ul>\n<p>这样做的好处：</p>\n<ul><li><strong>可验证</strong>：你能立刻判断它做对没做对</li><li><strong>可收敛</strong>：出问题也好定位（邮箱问题就看邮箱链路）</li><li><strong>可控风险</strong>：权限越多，误操作代价越大</li></ul>\n<hr />\n<h2 id=\"_9-常见问题排查-80-的问题在这里\">9. 常见问题排查（80% 的问题在这里） </h2>\n<h3 id=\"_1-发消息没反应\">1）发消息没反应 </h3>\n<h4 id=\"场景-a-telegram-bot-完全没反应\">场景 A：Telegram bot 完全没反应 </h4>\n<p>检查步骤：</p>\n<ol><li><strong>Gateway 是否在运行？</strong>bash<code>openclaw gateway status</code>如果显示 &quot;not running&quot;，启动它：bash<code>openclaw gateway run --port 18789 --verbose</code></li><li><strong>Telegram channel 是否连接？</strong>bash<code>openclaw channels status</code>如果显示 &quot;disconnected&quot;，检查：<ul><li>Token 是否正确（<code>openclaw configure --section channels</code>）</li><li>网络是否可达 api.telegram.org（某些地区可能需要代理）</li></ul></li><li><strong>Pairing 是否已批准？</strong>bash<code>openclaw pairing list telegram</code>如果有 pending 的配对码，批准它：bash<code>openclaw pairing approve telegram ABC12345</code></li></ol>\n<h4 id=\"场景-b-能收到配对码-但批准后仍无反应\">场景 B：能收到配对码，但批准后仍无反应 </h4>\n<p>可能原因：Gateway 重启后配置丢失，或 Token 在配置文件中格式错误（多空格/引号）</p>\n<pre data-lang=\"bash\"><code># 检查配置\nopenclaw doctor\n\n# 重新配置 Telegram\nopenclaw configure --section channels</code></pre>\n<h4 id=\"场景-c-web-ui-发消息没回复-moonshot-中国区\">场景 C：Web UI 发消息没回复（Moonshot 中国区） </h4>\n<pre data-lang=\"bash\"><code>openclaw config set models.providers.moonshot.baseUrl &quot;https://api.moonshot.cn/v1&quot;\nopenclaw gateway restart\nopenclaw agent --agent main --message &quot;你好&quot;</code></pre>\n<h4 id=\"场景-d-path-配置问题-所有平台\">场景 D：PATH 配置问题（所有平台） </h4>\n<p>常见错误：<code>bash: openclaw: command not found</code></p>\n<p>Linux/macOS/WSL2：</p>\n<pre data-lang=\"bash\"><code># 检查 openclaw 是否在 PATH\nwhich openclaw\n\n# 如果找不到，添加 npm global bin 到 PATH\nexport PATH=&quot;$(npm prefix -g)/bin:$PATH&quot;\n\n# 永久添加（添加到 ~/.bashrc 或 ~/.zshrc）\necho &#x27;export PATH=&quot;$(npm prefix -g)/bin:$PATH&quot;&#x27; &gt;&gt; ~/.bashrc\nsource ~/.bashrc</code></pre>\n<p>Windows PowerShell：</p>\n<pre data-lang=\"powershell\"><code># 检查 openclaw 是否在 PATH\nwhere.exe openclaw\n\n# 如果找不到，添加 npm global bin 到 PATH\n$npmPath = npm prefix -g\n$env:Path += &quot;;$npmPath&quot;\n\n# 永久添加\n[Environment]::SetEnvironmentVariable(&quot;Path&quot;, $env:Path + &quot;;$npmPath&quot;, &quot;User&quot;)</code></pre>\n<h4 id=\"场景-e-macos-下-launchagent-启动失败\">场景 E：macOS 下 LaunchAgent 启动失败 </h4>\n<pre data-lang=\"bash\"><code># 检查服务状态\nlaunchctl list | grep openclaw\n\n# 查看日志\nopenclaw logs --follow\n\n# 重新安装 daemon\nopenclaw configure --section gateway</code></pre>\n<p>常见问题：权限不足（在&quot;系统设置 &gt; 隐私与安全性&quot;中授权）、环境变量未加载（检查 <code>~/.openclaw/.env</code>）。</p>\n<h4 id=\"场景-f-linux-wsl2-下-systemd-服务启动失败\">场景 F：Linux/WSL2 下 systemd 服务启动失败 </h4>\n<pre data-lang=\"bash\"><code># 检查服务状态\nsystemctl --user status openclaw-gateway\n\n# Lingering 未启用（用户登出后服务停止）\nsudo loginctl enable-linger $USER\n\n# 重启服务\nsystemctl --user restart openclaw-gateway</code></pre>\n<h3 id=\"_2-能回复-但一执行就报错\">2）能回复，但一执行就报错 </h3>\n<h4 id=\"场景-a-模型-api-调用失败\">场景 A：模型 API 调用失败 </h4>\n<pre data-lang=\"bash\"><code>openclaw health</code></pre>\n<p>解决步骤：验证 API Key 是否有效、检查环境变量、重新配置（<code>openclaw configure --section models</code>）。</p>\n<h4 id=\"场景-b-工具调用失败-缺权限\">场景 B：工具调用失败（缺权限） </h4>\n<p>常见错误：<code>Error: Permission denied: /path/to/file</code></p>\n<p>检查 sandbox 配置：</p>\n<pre data-lang=\"bash\"><code>openclaw sandbox explain</code></pre>\n<p>如果需要修改 sandbox 模式，编辑 <code>~/.openclaw/openclaw.json</code>：</p>\n<pre data-lang=\"json\"><code>{\n  &quot;agents&quot;: {\n    &quot;defaults&quot;: {\n      &quot;sandbox&quot;: {\n        &quot;mode&quot;: &quot;off&quot;\n      }\n    }\n  }\n}</code></pre>\n<blockquote><p><code>&quot;off&quot;</code> = 主机运行，<code>&quot;non-main&quot;</code> = 仅非主会话沙箱，<code>&quot;all&quot;</code> = 全部沙箱</p></blockquote>\n<p>修改后重启 Gateway：<code>openclaw gateway restart</code></p>\n<h4 id=\"场景-c-浏览器工具失败-缺依赖\">场景 C：浏览器工具失败（缺依赖） </h4>\n<p>常见错误：<code>Error: Browser launch failed: Chrome/Chromium not found</code></p>\n<ul><li><strong>macOS</strong>：<code>brew install --cask google-chrome</code></li><li><strong>Linux/WSL2</strong>：<code>sudo apt-get install chromium-browser</code></li><li><strong>Windows</strong>：从 chrome.google.com 下载安装</li></ul>\n<h3 id=\"_3-它做了-你没让它做的事\">3）它做了&quot;你没让它做的事&quot; </h3>\n<p>这通常不是&quot;它叛变了&quot;，而是：</p>\n<ul><li>你的指令不够具体：例如&quot;整理文件&quot; vs &quot;把 Downloads 文件夹里超过 30 天的文件移到 Archive&quot;</li><li>它在补全隐含步骤时做了错误假设</li></ul>\n<p>解决方法：</p>\n<ol><li>把目标、范围、禁止项写清楚</li><li>要求它先复述计划再执行</li><li>配置审批流程（见安全章节）</li></ol>\n<h3 id=\"_4-gateway-启动失败\">4）Gateway 启动失败 </h3>\n<h4 id=\"场景-a-端口被占用\">场景 A：端口被占用 </h4>\n<p>错误信息：<code>Error: Port 18789 is already in use</code></p>\n<pre data-lang=\"bash\"><code># Linux/macOS/WSL2\nlsof -i :18789\n\n# Windows PowerShell\nnetstat -ano | findstr :18789</code></pre>\n<p>解决：杀死占用进程或改用其他端口。</p>\n<h4 id=\"场景-b-配置文件格式错误\">场景 B：配置文件格式错误 </h4>\n<pre data-lang=\"bash\"><code>openclaw doctor</code></pre>\n<p>如果 JSON 语法有误，修复或重置配置：</p>\n<pre data-lang=\"bash\"><code>openclaw reset\n# 选择 &quot;Config only&quot; 保留凭证和会话</code></pre>\n<hr />\n<h2 id=\"_10-安全与隐私-越能干活越要克制\">10. 安全与隐私：越能干活越要克制 </h2>\n<p>一句话原则：<strong>先当它是&quot;会犯错的实习生&quot;，再慢慢给权限。</strong></p>\n<h3 id=\"最小权限原则\">最小权限原则 </h3>\n<p>OpenClaw 使用三层权限控制：<strong>Sandbox</strong>（运行位置）、<strong>Tool Policy</strong>（工具可用性）、<strong>Elevated</strong>（主机执行）。</p>\n<p>先查看当前生效配置：</p>\n<pre data-lang=\"bash\"><code>openclaw sandbox explain</code></pre>\n<p>示例：限制工具可用性（只允许读取，不允许写入/删除）</p>\n<p>编辑 <code>~/.openclaw/openclaw.json</code>：</p>\n<pre data-lang=\"json\"><code>{\n  &quot;agents&quot;: {\n    &quot;defaults&quot;: {\n      &quot;sandbox&quot;: {\n        &quot;mode&quot;: &quot;non-main&quot;\n      },\n      &quot;tools&quot;: {\n        &quot;allow&quot;: [&quot;read&quot;, &quot;exec&quot;],\n        &quot;deny&quot;: [&quot;write&quot;, &quot;delete&quot;, &quot;edit&quot;],\n        &quot;sandbox&quot;: {\n          &quot;tools&quot;: {\n            &quot;allow&quot;: [&quot;read&quot;, &quot;exec&quot;],\n            &quot;deny&quot;: [&quot;write&quot;, &quot;delete&quot;]\n          }\n        }\n      }\n    }\n  }\n}</code></pre>\n<p>逐步开放权限：</p>\n<ol><li><strong>第一阶段</strong>：只允许文本处理（<code>allow: [&quot;read&quot;]</code>，禁用 exec）</li><li><strong>第二阶段</strong>：允许读取和执行（<code>allow: [&quot;read&quot;, &quot;exec&quot;]</code>，禁用 write）</li><li><strong>第三阶段</strong>：允许写入特定目录（通过 Sandbox bind mounts 限制范围）</li><li><strong>最后阶段</strong>：根据信任度开放更多权限</li></ol>\n<p>验证配置生效：</p>\n<pre data-lang=\"bash\"><code>openclaw sandbox explain --agent main</code></pre>\n<p>修改后重启 Gateway：<code>openclaw gateway restart</code></p>\n<h3 id=\"不暴露公网\">不暴露公网 </h3>\n<p>检查当前绑定：</p>\n<pre data-lang=\"bash\"><code>openclaw status --all | grep &quot;Bind&quot;</code></pre>\n<p>如果显示 <code>0.0.0.0</code>，改为 <code>127.0.0.1</code>：</p>\n<pre data-lang=\"bash\"><code>openclaw configure --section gateway\n# 选择 bind: 127.0.0.1 (loopback)</code></pre>\n<p>如果需要远程访问，使用 SSH 隧道，不要直接暴露端口：</p>\n<pre data-lang=\"bash\"><code># 在本地机器执行\nssh -N -L 18789:127.0.0.1:18789 user@remote-host\n\n# 然后访问 http://127.0.0.1:18789/（实际连接到远程 Gateway）</code></pre>\n<p>或使用 Tailscale（官方推荐）：</p>\n<pre data-lang=\"bash\"><code>openclaw configure --section gateway\n# 选择 &quot;Enable Tailscale exposure&quot;</code></pre>\n<h3 id=\"敏感信息管理\">敏感信息管理 </h3>\n<p>不要做的事：</p>\n<ul><li>在 Telegram 对话中直接发 API Key</li><li>把 Key 写进公开的配置文件（如 GitHub）</li><li>截图时暴露 Token</li><li>在日志中打印完整 Key</li></ul>\n<p>正确做法：</p>\n<ol><li><strong>使用环境变量</strong>：bash<code># Linux/macOS/WSL2\nexport MOONSHOT_API_KEY=&quot;sk-...&quot;\n\n# Windows PowerShell\n$env:MOONSHOT_API_KEY=&quot;sk-...&quot;</code></li><li><strong>使用 <code>~/.openclaw/.env</code></strong>（daemon 会自动读取）：bash<code>echo &quot;MOONSHOT_API_KEY=sk-...&quot; &gt;&gt; ~/.openclaw/.env</code></li><li><strong>定期轮换 API Key</strong>：每月检查一次 Key 使用情况，发现异常立即轮换。</li></ol>\n<h3 id=\"高风险动作二次确认\">高风险动作二次确认 </h3>\n<p>OpenClaw 使用 <code>exec-approvals.json</code> 文件管理需要审批的命令。</p>\n<pre data-lang=\"bash\"><code># 查看当前配置\nopenclaw approvals get\n\n# 添加危险命令到审批列表\nopenclaw approvals allowlist add &quot;rm -rf&quot;\nopenclaw approvals allowlist add &quot;/usr/bin/dd&quot;\nopenclaw approvals allowlist add &quot;~/.scripts/dangerous.sh&quot;</code></pre>\n<p>或从文件批量导入审批规则：</p>\n<pre data-lang=\"json\"><code>{\n  &quot;allowlist&quot;: [\n    &quot;rm -rf&quot;,\n    &quot;/usr/bin/dd&quot;,\n    &quot;~/.scripts/dangerous.sh&quot;\n  ]\n}</code></pre>\n<pre data-lang=\"bash\"><code>openclaw approvals set --file ./exec-approvals.json</code></pre>\n<p>配置后，执行这些命令时 Agent 会先请求批准，在 Telegram/Dashboard 中会显示审批按钮。</p>\n<blockquote><p>注意：审批机制仅适用于 exec 工具。文件删除、写入等操作需要通过 Sandbox 配置和 Tool Policy 控制。</p></blockquote>\n<h3 id=\"定期安全检查\">定期安全检查 </h3>\n<pre data-lang=\"bash\"><code>openclaw security audit --deep</code></pre>\n<h3 id=\"其他安全建议\">其他安全建议 </h3>\n<ol><li><strong>定期更新</strong>：bash<code>openclaw update</code></li><li><strong>审查日志</strong>：bash<code># 实时查看日志并过滤错误\nopenclaw logs --follow | grep -i &quot;error\\|warning\\|unauthorized&quot;</code>Windows PowerShell：powershell<code>openclaw logs --follow | Select-String -Pattern &quot;error|warning|unauthorized&quot; -CaseSensitive:$false</code></li><li><strong>备份配置</strong>：Linux/macOS/WSL2：bash<code># 备份配置（不包含敏感 Key）\ncp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.backup\n\n# 备份整个配置目录（排除会话和临时文件）\ntar -czf ~/openclaw-backup-$(date +%Y%m%d).tar.gz \\\n  ~/.openclaw/openclaw.json \\\n  ~/.openclaw/credentials/ \\\n  --exclude=&#x27;*.log&#x27; \\\n  --exclude=&#x27;sessions/&#x27;</code>Windows PowerShell：powershell<code>Copy-Item ~\\.openclaw\\openclaw.json ~\\.openclaw\\openclaw.json.backup\n\n$backupName = &quot;openclaw-backup-$(Get-Date -Format &#x27;yyyyMMdd&#x27;).zip&quot;\nCompress-Archive -Path ~\\.openclaw\\* -DestinationPath ~\\$backupName -Exclude *.log,sessions</code></li><li><strong>监控使用情况</strong>：定期检查 API 调用量，设置使用上限（在模型提供商控制台），发现异常立即停止服务。</li></ol>\n<blockquote><p>OpenClaw 的价值是&quot;自托管可控&quot;，但&quot;可控&quot;的另一面是你需要对权限负责。</p></blockquote>","h2_count":12,"h3_count":39,"code_count":158,"table_count":1,"char_count":30823}]


const FX_PREPARED_DOC_HTML_CACHE = new Map<string, string>()

function FeiXiangDocsFullSourceToTsx() {
  const FX_CHAT_COMPLETIONS_DOC = {
    id: 'chat-completions',
    group: 'OpenAI API',
    title: 'Chat Completions',
    source_file: 'generated-openai-chat-completions',
    html: 'Chat Completions /v1/chat/completions 请求字段 返回结构 SDK 示例 Python Node.js Go PHP cURL Streaming 流式输出',
    h2_count: 8,
    h3_count: 4,
    code_count: 8,
    table_count: 3,
    char_count: 4200,
  }

  const allDocs = FX_SOURCE_DOCS.some((doc: any) => doc.id === 'chat-completions')
    ? FX_SOURCE_DOCS
    : [...FX_SOURCE_DOCS, FX_CHAT_COMPLETIONS_DOC]

  const docsById = allDocs.reduce((map: Record<string, any>, doc: any) => {
    map[doc.id] = doc
    return map
  }, {})

  const navGroups: any[] = [
    { id: 'intro', title: '入门', items: ['getting-started', 'faq'] },
    { id: 'ai-editor', title: '人工智能编辑器', items: ['cursor', 'windsurf'] },
    { id: 'cli-tools', title: '命令行工具', items: ['claude-code', 'cc-switch', 'cc-site', 'aider', 'codex'] },
    { id: 'ide-plugins', title: 'IDE 插件', items: ['cline', 'continue'] },
    { id: 'desktop-clients', title: '桌面客户端', items: ['chatbox', 'cherry-studio'] },
    {
      id: 'api',
      title: 'API 调用',
      children: [
        { id: 'openai-api-group', title: 'OpenAI API', items: ['openai-api', 'chat-completions', 'videos'] },
        { id: 'gemini-api-group', title: 'Gemini API', items: ['gemini-api', 'generate-content', 'veo-fast'] },
        { id: 'openclaw-group', title: 'OpenClaw 配置平台 API', items: ['openclaw'], single: true },
      ],
    },
  ]

  const docOrder = [
    'getting-started',
    'faq',
    'cursor',
    'windsurf',
    'claude-code',
    'cc-switch',
    'cc-site',
    'aider',
    'codex',
    'cline',
    'continue',
    'chatbox',
    'cherry-studio',
    'openai-api',
    'chat-completions',
    'videos',
    'gemini-api',
    'generate-content',
    'veo-fast',
    'openclaw',
  ]

  const decodeHashValue = (value: string) => {
    try {
      return decodeURIComponent((value || '').replace(/^#/, '')).trim()
    } catch {
      return (value || '').replace(/^#/, '').trim()
    }
  }

  const normalizeOpenClawLegacyHeading = (value: string) => {
    const raw = decodeHashValue(value)

    if (!raw) return ''
    if (raw === '_1-开装前先搞清楚你要的是什么' || raw.includes('_1-开装前先搞清楚')) return '_1-开装前先搞清楚-你要的是什么'
    if (raw === '_2-openclaw-架构全景gatewayagentchannelstools-如何协作' || raw.includes('_2-openclaw-架构全景')) return '_2-openclaw-架构全景-gateway-agent-channels-tools-如何协作'
    if (raw === '_3-环境准备' || raw.includes('_3-环境准备')) return '_3-环境准备'
    if (raw === '_4-安装-openclaw两种路线' || raw.includes('_4-安装-openclaw')) return '_4-安装-openclaw-两种路线'
    if (raw === '_5-首次配置onboard-向导逐项填写指南含命令行视图' || raw.includes('_5-首次配置')) return '_5-首次配置-onboard-向导逐项填写指南-含命令行视图'
    if (raw.includes('_6-接入') || raw.includes('kimi') || raw.includes('moonshot') || raw.includes('feixiangapi')) return '_6-接入-feixiangapiapi-huobao-从获取-api-key-到验证'
    if (raw === '_7-跑通最小闭环从能回复到真执行' || raw.includes('_7-跑通最小闭环')) return '_7-跑通最小闭环-从-能回复-到-真执行'
    if (raw === '_8-新手最佳实践先只接一个能力' || raw.includes('_8-新手最佳实践')) return '_8-新手最佳实践-先只接一个能力'
    if (raw === '_9-常见问题排查80-的问题在这里' || raw.includes('_9-常见问题排查')) return '_9-常见问题排查-80-的问题在这里'
    if (raw === '_10-安全与隐私越能干活越要克制' || raw.includes('_10-安全与隐私')) return '_10-安全与隐私-越能干活越要克制'

    return raw
  }

  const normalizeHash = () => {
    if (typeof window === 'undefined') return 'getting-started'

    const raw = decodeHashValue(window.location.hash)
    const docId = raw.split(':')[0]

    if (docId && docsById[docId]) return docId
    if (raw.startsWith('_') || raw.includes('moonshot') || raw.includes('kimi')) return 'openclaw'

    return 'getting-started'
  }

  const normalizeHeadingFromHash = () => {
    if (typeof window === 'undefined') return ''

    const raw = decodeHashValue(window.location.hash)
    const parts = raw.split(':')

    if (parts.length > 1) {
      const heading = parts.slice(1).join(':')
      return parts[0] === 'openclaw' ? normalizeOpenClawLegacyHeading(heading) : heading
    }
    if (raw.startsWith('_') || raw.includes('moonshot') || raw.includes('kimi')) return normalizeOpenClawLegacyHeading(raw)

    return ''
  }

  const [activeDocId, setActiveDocId] = useState('getting-started')
  const [query, setQuery] = useState('')
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ intro: true })
  const [outline, setOutline] = useState<Array<{ id: string; text: string; level: number; parentId?: string }>>([])
  const [activeHeadingId, setActiveHeadingId] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false)
  const [codeTabState, setCodeTabState] = useState<Record<string, number>>({})

  const activeDoc = docsById[activeDocId] || docsById['getting-started'] || allDocs[0]
  const normalizedQuery = query.trim().toLowerCase()

  const docMatchesQuery = (docId: string) => {
    const doc = docsById[docId]
    if (!doc) return false
    if (!normalizedQuery) return true

    const plain = `${doc.title} ${doc.group} ${doc.source_file} ${doc.html || ''}`
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase()

    return plain.includes(normalizedQuery)
  }

  const visibleDocsCount = allDocs.filter((doc: any) => docMatchesQuery(doc.id)).length

  const groupContainsActive = (group: any): boolean => {
    if (group.items?.includes(activeDocId)) return true
    return Boolean(group.children?.some((child: any) => groupContainsActive(child)))
  }

  const groupHasVisibleDocs = (group: any): boolean => {
    if (group.items?.some((id: string) => docMatchesQuery(id))) return true
    return Boolean(group.children?.some((child: any) => groupHasVisibleDocs(child)))
  }

  const scrollToHeadingElement = (headingId: string, behavior: ScrollBehavior = 'smooth') => {
    if (typeof document === 'undefined' || !headingId) return

    const heading = document.getElementById(headingId)
    const scrollContainer = document.querySelector('[data-fx-doc-content-scroll]') as HTMLElement | null

    if (!heading || !scrollContainer) return

    const nextTop = heading.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top + scrollContainer.scrollTop - 22
    scrollContainer.scrollTo({ top: Math.max(0, nextTop), behavior })
    setActiveHeadingId(headingId)
  }

  const scheduleScrollToHeading = (headingId: string) => {
    if (typeof window === 'undefined' || !headingId) return

    window.requestAnimationFrame(() => scrollToHeadingElement(headingId))
    window.setTimeout(() => scrollToHeadingElement(headingId), 80)
    window.setTimeout(() => scrollToHeadingElement(headingId), 240)
  }

  const selectDoc = (docId: string, headingId = '') => {
    if (!docsById[docId]) return

    setActiveDocId(docId)
    setMobileNavOpen(false)
    setMobileOutlineOpen(false)

    if (typeof window !== 'undefined') {
      const nextHash = headingId
        ? `#${encodeURIComponent(docId)}:${encodeURIComponent(headingId)}`
        : `#${encodeURIComponent(docId)}`
      window.history.pushState(null, '', nextHash)
    }

    if (headingId) {
      scheduleScrollToHeading(headingId)
    }
  }

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const stripTags = (value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

  const escapeAttr = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const escapeHtml = (value: string) => escapeAttr(value).replace(/'/g, '&#39;')

  const normalizeAnchorKey = (value: string) => {
    const decoded = decodeHashValue(value)
      .replace(/&quot;/g, '"')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&amp;/g, '&')

    return decoded
      .toLowerCase()
      .replace(/<[^>]*>/g, ' ')
      .replace(/[\s\-_:：，,。.%（）()【】\[\]"'“”‘’/\\·→、]+/g, '')
      .trim()
  }

  const getHtmlAttr = (valueHtml: string, attr: string) => {
    const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = String(valueHtml || '').match(new RegExp(`${escaped}=["']([^"']+)["']`, 'i'))
    return match?.[1] || ''
  }

  const collectHtmlHeadings = (rawHtml: string) => {
    const headings: Array<{ id: string; text: string; key: string }> = []
    const headingRegex = /<h([1-4])\b[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/h\1>/g
    let match: RegExpExecArray | null

    while ((match = headingRegex.exec(rawHtml))) {
      const id = decodeHashValue(match[2])
      const text = stripTags(match[3])
      headings.push({ id, text, key: normalizeAnchorKey(`${id} ${text}`) })
    }

    return headings
  }

  const resolveHeadingIdForDoc = (docId: string, rawHeading: string, label = '', rawHtml = '') => {
    if (!docId) return ''

    const heading = docId === 'openclaw' ? normalizeOpenClawLegacyHeading(rawHeading) : decodeHashValue(rawHeading)
    const headings = collectHtmlHeadings(rawHtml || docsById[docId]?.html || '')

    if (!heading && !label) return ''
    if (heading && headings.some((item) => item.id === heading)) return heading

    const targetKeys = [heading, label]
      .filter(Boolean)
      .map((item) => normalizeAnchorKey(item))
      .filter(Boolean)

    const byKey = headings.find((item) => targetKeys.some((key) => key && (item.key.includes(key) || key.includes(normalizeAnchorKey(item.id)))))
    if (byKey) return byKey.id

    if (docId === 'openclaw') return normalizeOpenClawLegacyHeading(heading || label)

    return heading
  }

  const resolveLinkTarget = (currentDocId: string, href: string, label: string, rawHtml = '') => {
    const value = decodeHashValue(href)

    if (!value || value === '#') {
      const docId = resolveInternalDocId(label)
      return docId ? { docId, headingId: '' } : null
    }

    const parts = value.split(':')
    if (parts.length > 1 && docsById[parts[0]]) {
      return { docId: parts[0], headingId: resolveHeadingIdForDoc(parts[0], parts.slice(1).join(':'), label, rawHtml) }
    }

    if (docsById[value]) {
      return { docId: value, headingId: '' }
    }

    if (href.startsWith('#') || value.startsWith('_')) {
      const docId = currentDocId || activeDocId || 'getting-started'
      const headingId = resolveHeadingIdForDoc(docId, value, label, rawHtml)
      return { docId, headingId }
    }

    return null
  }
  const resolveInternalDocId = (label: string) => {
    const normalized = stripTags(label).toLowerCase()

    if (normalized.includes('chat completions') || normalized.includes('聊天记录完成')) return 'chat-completions'
    if (normalized === 'videos' || normalized === '视频' || normalized.includes('/v1/videos')) return 'videos'
    if (normalized.includes('generate content') || normalized.includes('生成内容')) return 'generate-content'
    if (normalized.includes('veo')) return 'veo-fast'
    if (normalized.includes('gemini api')) return 'gemini-api'
    if (normalized.includes('openai api')) return 'openai-api'
    if (normalized.includes('cursor') || normalized.includes('光标')) return 'cursor'
    if (normalized.includes('windsurf') || normalized.includes('风帆')) return 'windsurf'
    if (normalized.includes('cline') || normalized.includes('克莱恩')) return 'cline'
    if (normalized.includes('continue') || normalized.includes('继续')) return 'continue'
    if (normalized.includes('claude code') || normalized.includes('克劳德')) return 'claude-code'
    if (normalized.includes('cc switch') || normalized.includes('cc 开关')) return 'cc-switch'
    if (normalized.includes('codex')) return 'codex'
    if (normalized.includes('chatbox') || normalized.includes('聊天框')) return 'chatbox'
    if (normalized.includes('cherry')) return 'cherry-studio'
    if (normalized.includes('openclaw')) return 'openclaw'

    return ''
  }

  const getPreLang = (preHtml: string, fallback = 'text') => {
    const match = preHtml.match(/<pre\b[^>]*data-lang=["']([^"']+)["'][^>]*>/i)
    return match?.[1] || fallback
  }

  const findMatchingDivEnd = (html: string, openIndex: number) => {
    let index = openIndex
    let depth = 0

    while (index < html.length) {
      const nextOpen = html.indexOf('<div', index)
      const nextClose = html.indexOf('</div>', index)

      if (nextClose === -1) return -1

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1
        index = nextOpen + 4
      } else {
        depth -= 1
        index = nextClose + 6

        if (depth === 0) return index
      }
    }

    return -1
  }

  const renderPreparedCodeTabsHtml = (pairs: Array<{ label: string; preHtml: string }>, idSeed: string) => {
    const nav = pairs.map((pair, index) => {
      const active = index === 0 ? ' fx-code-tab-active' : ''
      return `<button type="button" class="fx-code-tab-button${active}" data-fx-code-tab="${index}" aria-selected="${index === 0 ? 'true' : 'false'}">${pair.label}</button>`
    }).join('')

    const panels = pairs.map((pair, index) => {
      const active = index === 0 ? ' fx-code-panel-active' : ''
      const lang = getPreLang(pair.preHtml, pair.label)
      return `<div class="fx-code-tabs-panel${active}" data-fx-code-panel="${index}" data-lang="${escapeAttr(lang)}">${pair.preHtml}</div>`
    }).join('')

    return `
<div class="fx-code-tabs-real" data-fx-code-tabs="${escapeAttr(idSeed)}">
  <div class="fx-code-tabs-real-head">
    <div class="fx-code-tabs-real-nav" role="tablist">${nav}</div>
    <button type="button" class="fx-copy-button fx-code-copy-button" data-fx-copy="tabs">复制</button>
  </div>
  <div class="fx-code-tabs-real-body">${panels}</div>
</div>`
  }

  const transformCodeGroupsToTabs = (rawHtml: string) => {
    let html = rawHtml
    const placeholders: string[] = []
    let cursor = 0
    let result = ''

    while (cursor < html.length) {
      const openIndex = html.indexOf('<div class="fx-code-group"', cursor)

      if (openIndex === -1) {
        result += html.slice(cursor)
        break
      }

      const openTagEnd = html.indexOf('>', openIndex)
      const groupEnd = findMatchingDivEnd(html, openIndex)

      if (openTagEnd === -1 || groupEnd === -1) {
        result += html.slice(cursor)
        break
      }

      const groupInner = html.slice(openTagEnd + 1, groupEnd - 6)
      const pairs: Array<{ label: string; preHtml: string }> = []
      const pairRegex = /<div class="fx-code-tab-label">([\s\S]*?)<\/div>\s*(<pre\b[^>]*>[\s\S]*?<\/pre>)/g
      let match: RegExpExecArray | null

      while ((match = pairRegex.exec(groupInner))) {
        pairs.push({
          label: stripTags(match[1]) || getPreLang(match[2], `示例 ${pairs.length + 1}`),
          preHtml: match[2],
        })
      }

      result += html.slice(cursor, openIndex)

      if (pairs.length >= 1) {
        const replacement = renderPreparedCodeTabsHtml(pairs, `group-${placeholders.length}`)
        const token = `__FX_CODE_TABS_PLACEHOLDER_${placeholders.length}__`
        placeholders.push(replacement)
        result += token
      } else {
        result += html.slice(openIndex, groupEnd)
      }

      cursor = groupEnd
    }

    return { html: result, placeholders }
  }

  const transformStandalonePreToCodeBlock = (rawHtml: string) => {
    return rawHtml.replace(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/g, (match, attrs, inner) => {
      if (match.includes('data-fx-raw-pre="1"')) return match

      const langMatch = String(attrs || '').match(/data-lang=["']([^"']+)["']/i)
      const lang = langMatch?.[1] || 'text'

      return `
<div class="fx-code-block-real" data-fx-code-block="1">
  <div class="fx-code-block-real-head">
    <span class="fx-code-lang">${escapeAttr(lang)}</span>
    <button type="button" class="fx-copy-button fx-code-copy-button" data-fx-copy="block">复制</button>
  </div>
  <pre${attrs}>${inner}</pre>
</div>`
    })
  }

  const isStrictTabLabel = (label: string) => {
    const value = label
      .replace(/[:：]$/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()

    const exactLabels = new Set([
      'curl',
      'cURL'.toLowerCase(),
      'python',
      'go',
      'golang',
      'java',
      'c#',
      'node.js',
      'node',
      'javascript',
      'typescript',
      'php',
      '~/.zshrc',
      '~/.bashrc',
      '.zshrc',
      '.bashrc',
      'vs code',
      'jetbrains',
      'windows（powershell）',
      'windows（cmd）',
      'windows powershell',
      'windows cmd',
      'cmd',
      'macos / linux',
      'macos / linux（bash / zsh）',
      'macos / linux (bash / zsh)',
      'queued',
      'in_progress',
      'completed',
      'failed',
      '排队中',
      '处理中',
      '已完成',
      '失败',
      '下载视频',
      '下载缩略图',
      'video',
      'thumbnail',
      'spritesheet',
    ])

    return exactLabels.has(value)
  }

  const isStepLikeCodeLabel = (label: string) => {
    const value = label.replace(/[:：]$/, '').replace(/\s+/g, ' ').trim()

    return /管理员|systemd|回到|重新|验证|启动|步骤|安装后|配置修改|健康检查|开启|执行|进入|编辑|保存|选择|检查|Ubuntu|WSL2|PowerShell（管理员）|PowerShell \(管理员\)/i.test(value)
  }

  const transformLooseStatusGroupsToTabs = (rawHtml: string) => {
    const pattern = /<p>([^<]{1,36}[:：])<\/p>\s*(<pre\b[^>]*>[\s\S]*?<\/pre>)\s*<p>([^<]{1,36}[:：])<\/p>\s*(<pre\b[^>]*>[\s\S]*?<\/pre>)(?:\s*<p>([^<]{1,36}[:：])<\/p>\s*(<pre\b[^>]*>[\s\S]*?<\/pre>))?(?:\s*<p>([^<]{1,36}[:：])<\/p>\s*(<pre\b[^>]*>[\s\S]*?<\/pre>))?/g

    return rawHtml.replace(pattern, (match, label1, pre1, label2, pre2, label3, pre3, label4, pre4) => {
      const pairs = [
        { label: String(label1).replace(/[:：]$/, ''), preHtml: pre1 },
        { label: String(label2).replace(/[:：]$/, ''), preHtml: pre2 },
      ]

      if (label3 && pre3) pairs.push({ label: String(label3).replace(/[:：]$/, ''), preHtml: pre3 })
      if (label4 && pre4) pairs.push({ label: String(label4).replace(/[:：]$/, ''), preHtml: pre4 })

      const canMerge = pairs.length >= 2 &&
        pairs.every((pair) => isStrictTabLabel(pair.label)) &&
        !pairs.some((pair) => isStepLikeCodeLabel(pair.label))

      if (!canMerge) return match

      return renderPreparedCodeTabsHtml(pairs, `loose-${Math.random().toString(16).slice(2)}`)
    })
  }

  const transformStepCodeBlocks = (rawHtml: string) => {
    return rawHtml.replace(/<p>([^<]{1,64}[:：])<\/p>\s*(<pre\b[^>]*>[\s\S]*?<\/pre>)/g, (match, rawLabel, preHtml) => {
      const label = String(rawLabel).replace(/[:：]$/, '').replace(/\s+/g, ' ').trim()

      if (isStrictTabLabel(label) || !isStepLikeCodeLabel(label)) {
        return match
      }

      return `
<div class="fx-step-code-block">
  <div class="fx-step-code-title">${escapeAttr(label)}</div>
  ${preHtml}
</div>`
    })
  }

  const parseTableCells = (rowHtml: string) => {
    const cells: string[] = []
    const cellRegex = /<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g
    let match: RegExpExecArray | null

    while ((match = cellRegex.exec(rowHtml))) {
      cells.push(match[1])
    }

    return cells
  }

  const normalizeTableHeader = (value: string) => stripTags(value)
    .replace(/\s+/g, '')
    .replace(/[：:]/g, '')
    .toLowerCase()

  const shouldCopyTableValue = (valueHtml: string) => {
    const text = stripTags(valueHtml)
    return /<code\b|https?:\/\/|sk-|hb-|\/v1|\/v1beta|api\.tokenapi168\.com|\.(msi|zip|dmg|deb|rpm|appimage)/i.test(valueHtml) ||
      /^\/[a-z0-9/_{}.-]+/i.test(text)
  }

  const renderCopyValueButton = (valueHtml: string) => {
    const valueText = stripTags(valueHtml)
    return shouldCopyTableValue(valueHtml)
      ? `<button type="button" class="fx-copy-value-button" data-fx-copy-value="${escapeAttr(valueText)}">复制</button>`
      : ''
  }

  const renderInfoGridTable = (rows: string[][], className = '') => {
    const items = rows.map((row) => {
      const label = stripTags(row[0] || '')
      const valueHtml = row[1] || ''

      return `
<div class="fx-info-item">
  <div class="fx-info-label">${escapeAttr(label)}</div>
  <div class="fx-info-value">
    <span>${valueHtml}</span>
    ${renderCopyValueButton(valueHtml)}
  </div>
</div>`
    }).join('')

    return `<div class="fx-info-grid-real ${className}">${items}</div>`
  }

  const renderDescriptionGridTable = (rows: string[][], className = '') => {
    const cards = rows.map((row) => {
      const title = stripTags(row[0] || '')
      const descHtml = row[1] || ''

      return `
<div class="fx-desc-card">
  <div class="fx-desc-title">${escapeAttr(title)}</div>
  <div class="fx-desc-content">${descHtml}</div>
</div>`
    }).join('')

    return `<div class="fx-desc-grid-real ${className}">${cards}</div>`
  }

  const renderPlatformPackageGrid = (rows: string[][]) => {
    const cards = rows.map((row) => {
      const platform = stripTags(row[0] || '')
      const packagesHtml = row[1] || ''

      return `
<div class="fx-platform-card">
  <div class="fx-platform-name">${escapeAttr(platform)}</div>
  <div class="fx-platform-packages">${packagesHtml}</div>
</div>`
    }).join('')

    return `<div class="fx-platform-grid-real">${cards}</div>`
  }

  const renderEndpointListTable = (headers: string[], rows: string[][]) => {
    const cards = rows.map((row) => {
      const endpoint = row[0] || ''
      const method = stripTags(row[1] || '')
      const desc = row[2] || ''

      return `
<div class="fx-endpoint-list-card">
  <div class="fx-endpoint-list-head">
    <code>${endpoint}</code>
    ${method ? `<span>${escapeAttr(method)}</span>` : ''}
  </div>
  <p>${desc}</p>
  ${renderCopyValueButton(endpoint)}
</div>`
    }).join('')

    return `<div class="fx-endpoint-list-grid">${cards}</div>`
  }

  const renderBaseUrlRuleGrid = (rows: string[][]) => {
    const cards = rows.map((row) => {
      const toolName = stripTags(row[0] || '')
      const valueHtml = row[1] || ''
      const valueText = stripTags(valueHtml)
      const codeMatch = String(valueHtml).match(/<code\b[^>]*>([\s\S]*?)<\/code>/i)
      const baseUrlText = stripTags(codeMatch?.[1] || valueHtml)
      const baseUrlHtml = codeMatch?.[0] || `<code>${escapeHtml(baseUrlText)}</code>`
      const requiresV1 = /不需要\s*\/v1|不需要/.test(valueText) ? '不需要 /v1' : /需要\s*\/v1|需要/.test(valueText) ? '需要 /v1' : ''
      const docId = resolveInternalDocId(toolName)
      const hint = requiresV1
        ? `${toolName} ${requiresV1}，复制后粘贴到工具的 Base URL 配置项。`
        : `复制后粘贴到 ${toolName} 的 Base URL 配置项。`

      return `
<div class="fx-baseurl-card fx-click-card" role="button" tabindex="0" ${docId ? `data-fx-doc-link="${escapeAttr(docId)}"` : ''}>
  <div class="fx-baseurl-head">
    <strong>${escapeAttr(toolName)}</strong>
    ${requiresV1 ? `<span>${escapeAttr(requiresV1)}</span>` : ''}
  </div>
  <div class="fx-baseurl-code-row">
    <span class="fx-baseurl-code">${baseUrlHtml}</span>
    <button type="button" class="fx-copy-value-button" data-fx-copy-value="${escapeAttr(baseUrlText)}">复制</button>
  </div>
  <p class="fx-baseurl-note">${escapeHtml(hint)}</p>
</div>`
    }).join('')

    return `<div class="fx-baseurl-grid-real">${cards}</div>`
  }

  const renderFieldExampleCards = (headers: string[], rows: string[][]) => {
    const cards = rows.map((row) => {
      const name = stripTags(row[0] || '')
      const desc = row[1] || ''
      const example = row[2] || ''

      return `
<div class="fx-field-example-card">
  <div class="fx-field-example-copy">
    <strong>${escapeAttr(name)}</strong>
    <p>${desc}</p>
  </div>
  ${example ? `<div class="fx-field-example-value"><span>${example}</span>${renderCopyValueButton(example)}</div>` : ''}
</div>`
    }).join('')

    return `<div class="fx-field-example-grid">${cards}</div>`
  }

  const renderDocumentLinkGrid = (rows: string[][]) => {
    const cards = rows.map((row) => {
      const titleHtml = row[0] || ''
      const title = stripTags(titleHtml)
      const desc = row[1] || ''
      const docId = getHtmlAttr(titleHtml, 'data-fx-doc-link') || resolveInternalDocId(title)
      const headingId = getHtmlAttr(titleHtml, 'data-fx-heading-id')

      return `
<button type="button" class="fx-doc-link-card fx-click-card" ${docId ? `data-fx-doc-link="${escapeAttr(docId)}"` : ''} ${headingId ? `data-fx-heading-id="${escapeAttr(headingId)}"` : ''}>
  <strong>${escapeAttr(title)}</strong>
  <p>${desc}</p>
</button>`
    }).join('')

    return `<div class="fx-doc-link-grid-real">${cards}</div>`
  }

  const renderPathGridTable = (rows: string[][]) => {
    const cards = rows.map((row) => {
      const type = stripTags(row[0] || '')
      const path = row[1] || ''

      return `
<div class="fx-path-card">
  <div class="fx-path-kind">${escapeAttr(type)}</div>
  <div class="fx-path-value"><span>${path}</span>${renderCopyValueButton(path)}</div>
</div>`
    }).join('')

    return `<div class="fx-path-grid-real">${cards}</div>`
  }

  const renderFieldDescriptionGrid = (rows: string[][], className = '') => {
    const cards = rows.map((row) => {
      const field = row[0] || ''
      const desc = row[1] || ''

      return `
<div class="fx-field-desc-card">
  <div class="fx-field-desc-name">${field}${renderCopyValueButton(field)}</div>
  <p>${desc}</p>
</div>`
    }).join('')

    return `<div class="fx-field-desc-grid ${className}">${cards}</div>`
  }

  const renderParamCardsTable = (headers: string[], rows: string[][], className = '') => {
    const headerKeys = headers.map(normalizeTableHeader)
    const cards = rows.map((row) => {
      const field = row[0] || ''
      const typeIndex = headerKeys.findIndex((header) => header.includes('类型') || header.includes('方法'))
      const requiredIndex = headerKeys.findIndex((header) => header.includes('必填') || header.includes('required'))
      const defaultIndex = headerKeys.findIndex((header) => header.includes('默认'))
      const descIndex = headerKeys.findIndex((header) => header.includes('说明') || header.includes('描述'))
      const type = typeIndex >= 0 ? row[typeIndex] || '' : ''
      const requiredText = requiredIndex >= 0 ? stripTags(row[requiredIndex] || '') : ''
      const desc = descIndex >= 0 ? row[descIndex] || '' : row[row.length - 1] || ''
      const defaultValue = defaultIndex >= 0 ? row[defaultIndex] || '' : ''
      const required = /是|required|true/i.test(requiredText)

      return `
<div class="fx-param-card">
  <div class="fx-param-card-head">
    <code>${field}</code>
    ${requiredText ? `<span class="fx-param-badge ${required ? 'fx-param-required' : 'fx-param-optional'}">${escapeAttr(required ? 'required' : 'optional')}</span>` : ''}
  </div>
  <div class="fx-param-card-meta">
    ${type ? `<span>类型：${type}</span>` : ''}
    ${defaultValue ? `<span>默认：${defaultValue}</span>` : ''}
  </div>
  <p>${desc}</p>
</div>`
    }).join('')

    return `<div class="fx-param-card-grid ${className}">${cards}</div>`
  }

  const renderParamHtmlTable = (headers: string[], rows: string[][], className = '') => {
    const thead = headers.map((header) => `<th>${header}</th>`).join('')
    const tbody = rows.map((row) => `<tr>${row.map((cell, index) => {
      const header = normalizeTableHeader(headers[index] || '')
      const isRequiredColumn = header.includes('必填') || header.includes('required')
      const text = stripTags(cell)
      const content = isRequiredColumn
        ? `<span class="fx-param-badge ${/是|required|true/i.test(text) ? 'fx-param-required' : 'fx-param-optional'}">${escapeAttr(text || '-')}</span>`
        : cell

      return `<td>${content}</td>`
    }).join('')}</tr>`).join('')

    return `
<div class="fx-comfort-table-wrap ${className}">
  <table class="fx-comfort-table">
    <thead><tr>${thead}</tr></thead>
    <tbody>${tbody}</tbody>
  </table>
</div>`
  }

  const renderToolGridTable = (rows: string[][]) => {
    const cards = rows.map((row) => {
      const nameHtml = row[0] || ''
      const name = stripTags(nameHtml)
      const type = row[1] || ''
      const score = row[2] || ''
      const docId = getHtmlAttr(nameHtml, 'data-fx-doc-link') || resolveInternalDocId(name)
      const headingId = getHtmlAttr(nameHtml, 'data-fx-heading-id')

      return `
<button type="button" class="fx-tool-card fx-click-card" ${docId ? `data-fx-doc-link="${escapeAttr(docId)}"` : ''} ${headingId ? `data-fx-heading-id="${escapeAttr(headingId)}"` : ''}>
  <div class="fx-tool-name">${escapeAttr(name)}</div>
  <div class="fx-tool-type">${type}</div>
  ${score ? `<div class="fx-tool-score">${score}</div>` : ''}
</button>`
    }).join('')

    return `<div class="fx-tool-grid-real">${cards}</div>`
  }

  const renderComfortTable = (headers: string[], rows: string[][]) => {
    const headerKey = headers.map(normalizeTableHeader).join('|')

    if (rows.length === 0) return ''

    if (headerKey === '工具|baseurl格式' || headerKey === '工具|baseurl') {
      return renderBaseUrlRuleGrid(rows)
    }

    if (headerKey === '名称|说明|示例' || headerKey === '字段|说明|示例') {
      return renderFieldExampleCards(headers, rows)
    }

    if (headerKey === '文档|说明') {
      return renderDocumentLinkGrid(rows)
    }

    if (headerKey === '类型|路径') {
      return renderPathGridTable(rows)
    }

    if ((headerKey === '字段|说明' || headerKey === '参数|说明') && rows[0]?.length >= 2) {
      return renderFieldDescriptionGrid(rows, 'fx-field-desc-two-col')
    }

    if ((headerKey === '项目|值' || headerKey === '字段|值' || headerKey === '名称|值') && rows[0]?.length >= 2) {
      return renderInfoGridTable(rows, 'fx-info-grid-two-col')
    }

    if ((headerKey === '项目|说明' || headerKey === '名称|说明' || headerKey === '模型|说明') && rows[0]?.length >= 2) {
      return renderDescriptionGridTable(rows, 'fx-desc-grid-two-col')
    }

    if ((headerKey === '系统|安装包' || headerKey === '平台|安装包') && rows[0]?.length >= 2) {
      return renderPlatformPackageGrid(rows)
    }

    if (headerKey.startsWith('工具|类型') && rows[0]?.length >= 2) {
      return renderToolGridTable(rows)
    }

    if (headerKey.startsWith('接口|方法') && rows[0]?.length >= 3) {
      return renderEndpointListTable(headers, rows)
    }

    if ((headerKey.includes('字段') && (headerKey.includes('必填') || headerKey.includes('说明'))) ||
        (headerKey.includes('参数') && headerKey.includes('说明'))) {
      return renderParamCardsTable(headers, rows, 'fx-param-source-table')
    }

    return renderParamHtmlTable(headers, rows, 'fx-generic-source-table')
  }

  const transformInfoTablesToCards = (rawHtml: string) => {
    return rawHtml.replace(/<table\b[^>]*>\s*<thead>\s*<tr>([\s\S]*?)<\/tr>\s*<\/thead>\s*<tbody>([\s\S]*?)<\/tbody>\s*<\/table>/g, (match, headerHtml, bodyHtml) => {
      const headers = parseTableCells(headerHtml)
      const rows: string[][] = []
      const rowRegex = /<tr>([\s\S]*?)<\/tr>/g
      let rowMatch: RegExpExecArray | null

      while ((rowMatch = rowRegex.exec(bodyHtml))) {
        rows.push(parseTableCells(rowMatch[1]))
      }

      if (!headers.length || !rows.length) return match

      return renderComfortTable(headers, rows) || match
    })
  }

  const transformInternalLinks = (docId: string, rawHtml: string) => {
    return rawHtml.replace(/<a\b([^>]*)href=["']([^"']*)["']([^>]*)>([\s\S]*?)<\/a>/g, (match, before, href, after, label) => {
      const external = /^(https?:|mailto:|tel:)/i.test(String(href || ''))
      if (external) return match

      const target = resolveLinkTarget(docId, href, label, rawHtml)
      if (!target?.docId || !docsById[target.docId]) return match

      const headingAttr = target.headingId ? ` data-fx-heading-id="${escapeAttr(target.headingId)}"` : ''
      const nextHref = target.headingId
        ? `#${encodeURIComponent(target.docId)}:${encodeURIComponent(target.headingId)}`
        : `#${encodeURIComponent(target.docId)}`

      return `<a${before || ''} href="${nextHref}"${after || ''} data-fx-doc-link="${escapeAttr(target.docId)}"${headingAttr}>${label}</a>`
    })
  }

  const transformLocalToc = (docId: string, rawHtml: string) => {
    if (docId !== 'openclaw') return rawHtml

    return rawHtml.replace(
      /<h2 id="目录">目录\s*<\/h2>\s*(<ol>[\s\S]*?<\/ol>)/,
      `<details class="fx-doc-local-toc" open><summary>章节概览</summary>$1</details>`,
    )
  }

  const transformOpenClawCleanup = (docId: string, rawHtml: string) => {
    if (docId !== 'openclaw') return rawHtml

    return rawHtml
      .replace(/Moonshot 官网/g, 'FeiXiangApi 控制台')
      .replace(/Moonshot\/Kimi|Kimi\/Moonshot|Moonshot|Kimi/g, 'FeiXiangApi')
      .replace(/huobao/gi, 'feixiangapi')
      .replace(/<li><strong>定期更新<\/strong>：bash<code>([\s\S]*?)<\/code><\/li>/g, (_match, code) => `
<li class="fx-openclaw-action-li"><div class="fx-security-action-card"><strong>定期更新</strong><p>保持 OpenClaw 与依赖处于最新版本。</p><pre data-lang="bash"><code>${code}</code></pre></div></li>`)
      .replace(/<li><strong>审查日志<\/strong>：bash<code>([\s\S]*?)<\/code>Windows PowerShell：powershell<code>([\s\S]*?)<\/code><\/li>/g, (_match, bashCode, psCode) => `
<li class="fx-openclaw-action-li"><div class="fx-security-action-card"><strong>审查日志</strong><p>实时查看日志并过滤错误、告警和未授权访问。</p><div class="fx-code-group"><div class="fx-code-tab-label">Linux / macOS / WSL2</div><pre data-lang="bash"><code>${bashCode}</code></pre><div class="fx-code-tab-label">Windows PowerShell</div><pre data-lang="powershell"><code>${psCode}</code></pre></div></div></li>`)
      .replace(/<li><strong>备份配置<\/strong>：Linux\/macOS\/WSL2：bash<code>([\s\S]*?)<\/code>Windows PowerShell：powershell<code>([\s\S]*?)<\/code><\/li>/g, (_match, bashCode, psCode) => `
<li class="fx-openclaw-action-li"><div class="fx-security-action-card"><strong>备份配置</strong><p>备份主配置和凭证目录，排除日志、会话与临时文件。</p><div class="fx-code-group"><div class="fx-code-tab-label">Linux / macOS / WSL2</div><pre data-lang="bash"><code>${bashCode}</code></pre><div class="fx-code-tab-label">Windows PowerShell</div><pre data-lang="powershell"><code>${psCode}</code></pre></div></div></li>`)
  }

  const normalizeCallouts = (rawHtml: string) => {
    return rawHtml
      .replace(/<div class="fx-callout-title">TIP<\/div>/g, '<div class="fx-callout-title">提示</div>')
      .replace(/<div class="fx-callout-title">WARNING<\/div>/g, '<div class="fx-callout-title">注意</div>')
      .replace(/<div class="fx-callout-title">DANGER<\/div>/g, '<div class="fx-callout-title">重要</div>')
      .replace(/<div class="fx-callout-title">INFO<\/div>/g, '<div class="fx-callout-title">说明</div>')
  }

  const prepareDocHtml = (docId: string, rawHtml: string) => {
    const cached = FX_PREPARED_DOC_HTML_CACHE.get(docId)
    if (cached !== undefined) return cached

    let html = rawHtml || ''

    html = normalizeCallouts(html)
    html = transformOpenClawCleanup(docId, html)
    html = transformLocalToc(docId, html)
    html = transformInternalLinks(docId, html)
    html = transformInfoTablesToCards(html)

    const groupResult = transformCodeGroupsToTabs(html)
    html = groupResult.html

    html = transformLooseStatusGroupsToTabs(html)
    html = transformStepCodeBlocks(html)
    html = transformStandalonePreToCodeBlock(html)

    groupResult.placeholders.forEach((value, index) => {
      html = html.replace(`__FX_CODE_TABS_PLACEHOLDER_${index}__`, value)
    })

    FX_PREPARED_DOC_HTML_CACHE.set(docId, html)
    return html
  }

  const handlePreparedArticleClick = async (event: any) => {
    const target = event.target as HTMLElement | null
    if (!target) return

    const copyValueButton = target.closest('[data-fx-copy-value]') as HTMLButtonElement | null

    if (copyValueButton) {
      const value = copyValueButton.getAttribute('data-fx-copy-value') || ''
      if (!value) return

      event.preventDefault()
      event.stopPropagation()

      const ok = await copyText(value)
      copyValueButton.textContent = ok ? '已复制' : '复制失败'

      window.setTimeout(() => {
        copyValueButton.textContent = '复制'
      }, 1500)

      return
    }

    const docLink = target.closest('[data-fx-doc-link]') as HTMLElement | null

    if (docLink) {
      const docId = docLink.getAttribute('data-fx-doc-link') || ''
      const headingId = docLink.getAttribute('data-fx-heading-id') || ''

      if (docId && docsById[docId]) {
        event.preventDefault()
        selectDoc(docId, headingId)
      }

      return
    }

    const tabButton = target.closest('[data-fx-code-tab]') as HTMLButtonElement | null

    if (tabButton) {
      const shell = tabButton.closest('[data-fx-code-tabs]') as HTMLElement | null
      const index = tabButton.getAttribute('data-fx-code-tab')

      if (!shell || index === null) return

      Array.from(shell.querySelectorAll('[data-fx-code-tab]')).forEach((button) => {
        const active = button.getAttribute('data-fx-code-tab') === index
        button.classList.toggle('fx-code-tab-active', active)
        button.setAttribute('aria-selected', active ? 'true' : 'false')
      })

      Array.from(shell.querySelectorAll('[data-fx-code-panel]')).forEach((panel) => {
        panel.classList.toggle('fx-code-panel-active', panel.getAttribute('data-fx-code-panel') === index)
      })

      return
    }

    const copyButton = target.closest('[data-fx-copy]') as HTMLButtonElement | null

    if (copyButton) {
      const mode = copyButton.getAttribute('data-fx-copy')
      let codeText = ''

      if (mode === 'tabs') {
        const shell = copyButton.closest('[data-fx-code-tabs]') as HTMLElement | null
        const activePanel = shell?.querySelector('.fx-code-panel-active pre') as HTMLElement | null
        codeText = activePanel?.innerText || ''
      } else {
        const shell = copyButton.closest('[data-fx-code-block]') as HTMLElement | null
        const pre = shell?.querySelector('pre') as HTMLElement | null
        codeText = pre?.innerText || ''
      }

      if (!codeText) return

      const ok = await copyText(codeText)
      copyButton.textContent = ok ? '已复制' : '复制失败'

      window.setTimeout(() => {
        copyButton.textContent = '复制'
      }, 1500)
    }
  }

  useEffect(() => {
    const syncFromHash = () => {
      const nextDocId = normalizeHash()
      const headingId = normalizeHeadingFromHash()

      setActiveDocId(nextDocId)
      if (headingId) scheduleScrollToHeading(headingId)
    }

    syncFromHash()

    window.addEventListener('hashchange', syncFromHash)
    window.addEventListener('popstate', syncFromHash)

    return () => {
      window.removeEventListener('hashchange', syncFromHash)
      window.removeEventListener('popstate', syncFromHash)
    }
  }, [])

  useEffect(() => {
    const activeGroups: Record<string, boolean> = {}

    const visit = (group: any) => {
      if (groupContainsActive(group) || normalizedQuery) {
        activeGroups[group.id] = true
      }

      group.children?.forEach(visit)
    }

    navGroups.forEach(visit)
    setOpenGroups((prev) => ({ ...prev, ...activeGroups }))
  }, [activeDocId, normalizedQuery])

  useEffect(() => {
    if (typeof document === 'undefined' || !activeDoc) return

    const timer = window.setTimeout(() => {
      const activeArticle = document.querySelector(`[data-fx-doc-article="${activeDoc.id}"]`) as HTMLElement | null
      const scrollContainer = document.querySelector('[data-fx-doc-content-scroll]') as HTMLElement | null

      if (!activeArticle) return

      const headings = Array.from(activeArticle.querySelectorAll('.fx-source-prose h2, .fx-source-prose h3, .fx-api-article h2, .fx-api-article h3')) as HTMLElement[]
      let currentParent = ''
      const nextOutline = headings.slice(0, 88).map((heading, index) => {
        if (!heading.id) {
          heading.id = `${activeDoc.id}-heading-${index}`
        }

        if (heading.tagName === 'H2') {
          currentParent = heading.id
        }

        return {
          id: heading.id,
          text: (heading.textContent || '').replace(/\s+/g, ' ').trim(),
          level: heading.tagName === 'H3' ? 3 : 2,
          parentId: heading.tagName === 'H3' ? currentParent : undefined,
        }
      })

      setOutline(nextOutline)
      setActiveHeadingId(nextOutline[0]?.id || '')

      const requestedHeading = normalizeHeadingFromHash()
      const headingTarget = requestedHeading ? document.getElementById(requestedHeading) : null

      if (headingTarget) {
        scrollToHeadingElement(headingTarget.id)
      } else if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [activeDocId])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const scrollContainer = document.querySelector('[data-fx-doc-content-scroll]') as HTMLElement | null
    if (!scrollContainer) return

    const applyActiveOutline = () => {
      const buttons = Array.from(document.querySelectorAll('[data-fx-outline-id]')) as HTMLElement[]
      const headings = outline
        .map((item) => document.getElementById(item.id))
        .filter(Boolean) as HTMLElement[]

      if (!headings.length) return

      const containerTop = scrollContainer.getBoundingClientRect().top
      let current = headings[0].id

      headings.forEach((heading) => {
        if (heading.getBoundingClientRect().top - containerTop <= 96) {
          current = heading.id
        }
      })

      setActiveHeadingId(current)

      buttons.forEach((button) => {
        button.classList.toggle('fx-outline-active', button.getAttribute('data-fx-outline-id') === current)
      })
    }

    scrollContainer.addEventListener('scroll', applyActiveOutline, { passive: true })
    applyActiveOutline()

    return () => scrollContainer.removeEventListener('scroll', applyActiveOutline)
  }, [outline, activeDocId])

  const renderDocLink = (docId: string, nested = false) => {
    const doc = docsById[docId]
    if (!doc || !docMatchesQuery(docId)) return null

    const active = doc.id === activeDocId

    return (
      <button
        key={doc.id}
        type='button'
        onClick={() => selectDoc(doc.id)}
        className={cx(
          'fx-docs-nav-link',
          nested && 'fx-docs-nav-link-nested',
          active && 'fx-active-doc-link',
        )}
      >
        {doc.title}
      </button>
    )
  }

  const renderGroup = (group: any, nested = false) => {
    if (!groupHasVisibleDocs(group)) return null

    const containsActive = groupContainsActive(group)
    const isOpen = Boolean(normalizedQuery || openGroups[group.id] || containsActive)
    const visibleItems = group.items?.map((id: string) => renderDocLink(id, nested)).filter(Boolean) || []
    const visibleChildren = group.children?.map((child: any) => renderGroup(child, true)).filter(Boolean) || []

    if (group.single && group.items?.length === 1) {
      return (
        <div key={group.id} className='fx-docs-single-link'>
          {renderDocLink(group.items[0], nested)}
        </div>
      )
    }

    return (
      <div key={group.id} className={cx('fx-docs-nav-group', nested && 'fx-docs-nav-subgroup')}>
        <button
          type='button'
          onClick={() => toggleGroup(group.id)}
          className={cx('fx-docs-group-button', containsActive && 'fx-docs-group-button-active')}
          aria-expanded={isOpen}
        >
          <span>{group.title}</span>
          <span className={cx('fx-docs-chevron', isOpen && 'fx-docs-chevron-open')}>⌄</span>
        </button>

        {isOpen && (
          <div className={cx('fx-docs-group-items', nested && 'fx-docs-subgroup-items')}>
            {visibleItems}
            {visibleChildren}
          </div>
        )}
      </div>
    )
  }

  const scrollToHeading = (headingId: string) => {
    scrollToHeadingElement(headingId)

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${encodeURIComponent(activeDoc.id)}:${encodeURIComponent(headingId)}`)
    }
  }

  const activeOutlineItem = outline.find((item) => item.id === activeHeadingId)
  const activeParentId = activeOutlineItem?.level === 3 ? activeOutlineItem.parentId : activeOutlineItem?.id
  const compactOutline = outline.length > 34
  const visibleOutline = compactOutline
    ? outline.filter((item) => item.level === 2 || item.parentId === activeParentId)
    : outline

  const docBadges = (() => {
    if (activeDoc.id === 'openai-api') return ['OpenAI Compatible', 'SDK 兼容', `${BASE_URL}/v1`]
    if (activeDoc.id === 'chat-completions') return ['API Reference', 'POST /v1/chat/completions', '支持流式']
    if (activeDoc.id === 'videos') return ['API Reference', '异步视频任务', 'POST /v1/videos']
    if (activeDoc.id === 'gemini-api' || activeDoc.id === 'generate-content' || activeDoc.id === 'veo-fast') return ['Gemini API', 'REST 兼容', 'v1beta']
    if (activeDoc.id === 'faq') return ['FAQ', '排障指南']
    if (activeDoc.id === 'openclaw') return ['长教程', '从安装到入门']
    return [activeDoc.group, '工具配置指南']
  })()

  const flatOrder = docOrder.filter((id) => docsById[id])
  const currentIndex = flatOrder.indexOf(activeDoc.id)
  const previousDoc = currentIndex > 0 ? docsById[flatOrder[currentIndex - 1]] : null
  const nextDoc = currentIndex >= 0 && currentIndex < flatOrder.length - 1 ? docsById[flatOrder[currentIndex + 1]] : null

  const DocsCodeBlock = ({ lang, code }: { lang: string; code: string }) => {
    return (
      <div className='fx-native-code-block'>
        <div className='fx-native-code-head'>
          <span>{lang}</span>
          <CopyButton value={code} label='复制' copiedLabel='已复制' className='fx-native-copy' />
        </div>
        <pre><code>{code}</code></pre>
      </div>
    )
  }

  const DocsCodeTabs = ({ id, tabs }: { id: string; tabs: Array<{ label: string; lang: string; code: string }> }) => {
    const currentIndex = codeTabState[id] ?? 0
    const currentTab = tabs[currentIndex] || tabs[0]

    return (
      <div className='fx-native-code-tabs'>
        <div className='fx-native-code-tabs-head'>
          <div className='fx-native-code-tabs-nav' role='tablist'>
            {tabs.map((tab, index) => (
              <button
                key={tab.label}
                type='button'
                className={cx('fx-native-code-tab', index === currentIndex && 'fx-native-code-tab-active')}
                onClick={() => setCodeTabState((prev) => ({ ...prev, [id]: index }))}
                role='tab'
                aria-selected={index === currentIndex}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <CopyButton value={currentTab.code} label='复制' copiedLabel='已复制' className='fx-native-copy' />
        </div>
        <pre><code>{currentTab.code}</code></pre>
      </div>
    )
  }

  const getCopyValueFromNode = (node: ReactNode): string => {
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(getCopyValueFromNode).find(Boolean) || ''
    if (isValidElement(node)) {
      const props = (node as any).props || {}
      const className = String(props.className || '')
      const typeName = typeof node.type === 'string' ? node.type : ''

      if (typeName === 'code' || className.includes('copy-source')) {
        return getCopyValueFromNode(props.children)
      }

      return getCopyValueFromNode(props.children)
    }

    return ''
  }

  const ApiCard = ({ title, desc, children }: { title: string; desc?: string; children?: ReactNode }) => {
    const copyValue = getCopyValueFromNode(children).trim()

    return (
      <div className='fx-api-card'>
        <div className='fx-api-card-top'>
          <strong>{title}</strong>
          {copyValue && <CopyButton value={copyValue} label='复制' copiedLabel='已复制' className='fx-api-card-copy' />}
        </div>
        {desc && <p>{desc}</p>}
        {children}
      </div>
    )
  }

  const DocJumpCard = ({ docId, title, desc }: { docId: string; title: string; desc: string }) => {
    return (
      <button type='button' className='fx-doc-jump-card' onClick={() => selectDoc(docId)}>
        <span>{title}</span>
        <small>{desc}</small>
      </button>
    )
  }

  type NativeParamRow = { name: string; type?: string; required?: boolean; defaultValue?: string; desc: string }

  const isEndpointRow = (row: NativeParamRow) => /^\/v(?:1|1beta)\b/i.test(row.name || '')
  const isErrorCodeRow = (row: NativeParamRow) => Boolean(row.type && /^\d{3}(?:\/\d{3})?$/.test(row.type))

  const EndpointListCards = ({ rows }: { rows: NativeParamRow[] }) => {
    return (
      <div className='fx-native-endpoint-grid'>
        {rows.map((row) => {
          const method = (row.type || 'GET').toUpperCase()
          return (
            <div key={`${row.name}-${method}`} className='fx-native-endpoint-card'>
              <div className='fx-native-endpoint-top'>
                <span className={cx('fx-method-badge', `fx-method-${method.toLowerCase()}`)}>{method}</span>
                <CopyButton value={row.name} label='复制路径' copiedLabel='已复制' className='fx-native-mini-copy' />
              </div>
              <code>{row.name}</code>
              <p>{row.desc}</p>
            </div>
          )
        })}
      </div>
    )
  }

  const ErrorCodeCards = ({ rows }: { rows: NativeParamRow[] }) => {
    return (
      <div className='fx-native-error-grid'>
        {rows.map((row) => (
          <div key={`${row.name}-${row.type}`} className='fx-native-error-card'>
            <div className='fx-native-error-top'>
              <code>{row.name}</code>
              <span>{row.type}</span>
            </div>
            <p>{row.desc}</p>
            <CopyButton value={row.name} label='复制错误码' copiedLabel='已复制' className='fx-native-mini-copy' />
          </div>
        ))}
      </div>
    )
  }

  const ResponsiveFieldCards = ({ rows }: { rows: NativeParamRow[] }) => {
    return (
      <div className='fx-native-field-grid'>
        {rows.map((row) => (
          <div key={`${row.name}-${row.type || ''}`} className='fx-native-field-card'>
            <div className='fx-native-field-head'>
              <code>{row.name}</code>
              <CopyButton value={row.name} label='复制' copiedLabel='已复制' className='fx-native-mini-copy' />
            </div>
            <div className='fx-native-field-meta'>
              {row.type && <span>{row.type}</span>}
              <span className={cx('fx-param-badge', row.required ? 'fx-param-required' : 'fx-param-optional')}>{row.required ? 'required' : 'optional'}</span>
              {row.defaultValue && <span>默认：{row.defaultValue}</span>}
            </div>
            <p>{row.desc}</p>
          </div>
        ))}
      </div>
    )
  }

  const ParamTable = ({ rows }: { rows: NativeParamRow[] }) => {
    if (rows.length && rows.every(isEndpointRow)) return <EndpointListCards rows={rows} />
    if (rows.length && rows.every(isErrorCodeRow)) return <ErrorCodeCards rows={rows} />
    return <ResponsiveFieldCards rows={rows} />
  }

  const EndpointCard = ({ method, path, title, children }: { method: string; path: string; title: string; children: ReactNode }) => {
    return (
      <section className='fx-endpoint-card'>
        <div className='fx-endpoint-head'>
          <span className={cx('fx-method-badge', `fx-method-${method.toLowerCase()}`)}>{method}</span>
          <code>{path}</code>
          <CopyButton value={path} label='复制路径' copiedLabel='已复制' className='fx-native-mini-copy fx-endpoint-copy' />
        </div>
        <h3>{title}</h3>
        {children}
      </section>
    )
  }

  const NextDocPager = () => {
    const relatedByDoc: Record<string, string[]> = {
      'openai-api': ['chat-completions', 'videos', 'gemini-api'],
      'chat-completions': ['openai-api', 'videos', 'generate-content'],
      'videos': ['openai-api', 'chat-completions', 'veo-fast'],
      'gemini-api': ['generate-content', 'veo-fast', 'openai-api'],
      'generate-content': ['gemini-api', 'veo-fast', 'openai-api'],
      'veo-fast': ['gemini-api', 'generate-content', 'videos'],
    }

    const related = (relatedByDoc[activeDoc.id] || [])
      .map((id) => docsById[id])
      .filter(Boolean)

    return (
      <div className='fx-doc-pager'>
        <div className='fx-doc-pager-row'>
          {previousDoc ? (
            <button type='button' className='fx-doc-pager-card' onClick={() => selectDoc(previousDoc.id)}>
              <small>上一篇</small>
              <span>{previousDoc.title}</span>
            </button>
          ) : <div />}
          {nextDoc ? (
            <button type='button' className='fx-doc-pager-card fx-doc-pager-next' onClick={() => selectDoc(nextDoc.id)}>
              <small>下一篇</small>
              <span>{nextDoc.title}</span>
            </button>
          ) : <div />}
        </div>
        {related.length > 0 && (
          <div className='fx-related-docs'>
            <strong>相关文档</strong>
            <div>
              {related.map((doc: any) => (
                <button key={doc.id} type='button' onClick={() => selectDoc(doc.id)}>{doc.title}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const ApiHero = ({ title, desc, children }: { title: string; desc: string; children?: ReactNode }) => {
    return (
      <div className='fx-api-hero'>
        <h1>{title}</h1>
        <p>{desc}</p>
        {children}
      </div>
    )
  }

  const openAiQuickTabs = [
    {
      label: 'cURL',
      lang: 'bash',
      code: `curl https://api.tokenapi168.com/v1/chat/completions \\
  -H "Authorization: Bearer sk-xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "你好，请介绍一下你自己"}
    ]
  }'`,
    },
    {
      label: 'Python',
      lang: 'python',
      code: `from openai import OpenAI

client = OpenAI(
    api_key="sk-xxxxxxxxxxxx",
    base_url="https://api.tokenapi168.com/v1",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "你好，请介绍一下你自己"}
    ],
)

print(response.choices[0].message.content)`,
    },
    {
      label: 'Node.js',
      lang: 'javascript',
      code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-xxxxxxxxxxxx",
  baseURL: "https://api.tokenapi168.com/v1",
});

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "user", content: "你好，请介绍一下你自己" },
  ],
});

console.log(response.choices[0].message.content);`,
    },
  ]

  const chatCompletionTabs = [
    {
      label: 'cURL',
      lang: 'bash',
      code: `curl https://api.tokenapi168.com/v1/chat/completions \\
  -H "Authorization: Bearer sk-xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "你是一个简洁的助手。"},
      {"role": "user", "content": "用三句话解释 API 网关。"}
    ],
    "temperature": 0.7,
    "stream": false
  }'`,
    },
    {
      label: 'Python',
      lang: 'python',
      code: `from openai import OpenAI

client = OpenAI(
    api_key="sk-xxxxxxxxxxxx",
    base_url="https://api.tokenapi168.com/v1",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "你是一个简洁的助手。"},
        {"role": "user", "content": "用三句话解释 API 网关。"},
    ],
    temperature=0.7,
)

print(response.choices[0].message.content)`,
    },
    {
      label: 'Node.js',
      lang: 'javascript',
      code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-xxxxxxxxxxxx",
  baseURL: "https://api.tokenapi168.com/v1",
});

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "你是一个简洁的助手。" },
    { role: "user", content: "用三句话解释 API 网关。" },
  ],
  temperature: 0.7,
});

console.log(response.choices[0].message.content);`,
    },
    {
      label: 'Go',
      lang: 'go',
      code: `package main

import (
  "context"
  "fmt"

  openai "github.com/sashabaranov/go-openai"
)

func main() {
  config := openai.DefaultConfig("sk-xxxxxxxxxxxx")
  config.BaseURL = "https://api.tokenapi168.com/v1"

  client := openai.NewClientWithConfig(config)

  resp, err := client.CreateChatCompletion(
    context.Background(),
    openai.ChatCompletionRequest{
      Model: "gpt-4o",
      Messages: []openai.ChatCompletionMessage{
        {Role: openai.ChatMessageRoleUser, Content: "用三句话解释 API 网关。"},
      },
    },
  )
  if err != nil {
    panic(err)
  }

  fmt.Println(resp.Choices[0].Message.Content)
}`,
    },
  ]

  const chatStreamingTabs = [
    {
      label: 'Python',
      lang: 'python',
      code: `from openai import OpenAI

client = OpenAI(
    api_key="sk-xxxxxxxxxxxx",
    base_url="https://api.tokenapi168.com/v1",
)

stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "分点说明流式输出的优势"}],
    stream=True,
)

for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="")`,
    },
    {
      label: 'Node.js',
      lang: 'javascript',
      code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-xxxxxxxxxxxx",
  baseURL: "https://api.tokenapi168.com/v1",
});

const stream = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "分点说明流式输出的优势" }],
  stream: true,
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content;
  if (delta) process.stdout.write(delta);
}`,
    },
  ]

  const chatResponseTabs = [
    {
      label: '普通响应',
      lang: 'json',
      code: `{
  "id": "chatcmpl_abc123",
  "object": "chat.completion",
  "created": 1712697600,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "API 网关可以统一鉴权、转发请求并记录用量。"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 18,
    "completion_tokens": 24,
    "total_tokens": 42
  }
}`,
    },
    {
      label: '错误响应',
      lang: 'json',
      code: `{
  "error": {
    "message": "Invalid API key provided.",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}`,
    },
  ]

  const videoCreateTabs = [
    {
      label: 'cURL',
      lang: 'bash',
      code: `curl https://api.tokenapi168.com/v1/videos \\
  -H "Authorization: Bearer sk-xxxxxxxxxxxx" \\
  -F "model=sora-2" \\
  -F "prompt=A calico cat playing a piano on stage" \\
  -F "seconds=8" \\
  -F "size=1280x720"`,
    },
    {
      label: 'Node.js',
      lang: 'javascript',
      code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-xxxxxxxxxxxx",
  baseURL: "https://api.tokenapi168.com/v1",
});

const video = await client.videos.create({
  model: "sora-2",
  prompt: "A calico cat playing a piano on stage",
  seconds: "8",
  size: "1280x720",
});

console.log(video);`,
    },
  ]

  const videoStatusTabs = [
    {
      label: 'queued',
      lang: 'json',
      code: `{
  "id": "video_123",
  "object": "video",
  "status": "queued",
  "progress": 0,
  "created_at": 1712697600,
  "model": "sora-2",
  "seconds": "8",
  "size": "1280x720"
}`,
    },
    {
      label: 'in_progress',
      lang: 'json',
      code: `{
  "id": "video_123",
  "object": "video",
  "status": "in_progress",
  "progress": 33,
  "created_at": 1712697600,
  "model": "sora-2",
  "seconds": "8",
  "size": "1280x720"
}`,
    },
    {
      label: 'completed',
      lang: 'json',
      code: `{
  "id": "video_123",
  "object": "video",
  "status": "completed",
  "progress": 100,
  "created_at": 1712697600,
  "completed_at": 1712697815,
  "expires_at": 1712701415,
  "model": "sora-2",
  "prompt": "A calico cat playing a piano on stage",
  "seconds": "8",
  "size": "1280x720"
}`,
    },
    {
      label: 'failed',
      lang: 'json',
      code: `{
  "id": "video_123",
  "object": "video",
  "status": "failed",
  "progress": 12,
  "error": {
    "code": "invalid_reference_image",
    "message": "Input images with human faces are currently rejected."
  }
}`,
    },
  ]

  const videoDownloadTabs = [
    {
      label: '下载视频',
      lang: 'bash',
      code: `curl https://api.tokenapi168.com/v1/videos/video_123/content \\
  -H "Authorization: Bearer sk-xxxxxxxxxxxx" \\
  --output video.mp4`,
    },
    {
      label: '下载缩略图',
      lang: 'bash',
      code: `curl "https://api.tokenapi168.com/v1/videos/video_123/content?variant=thumbnail" \\
  -H "Authorization: Bearer sk-xxxxxxxxxxxx" \\
  --output thumbnail.webp`,
    },
  ]

  const OpenAIOverviewArticle = () => {
    return (
      <div className='fx-source-prose fx-api-article'>
        <ApiHero
          title='OpenAI API 直接调用'
          desc='面向 SDK 与 HTTP 调用场景的 OpenAI 兼容 API。已有 OpenAI SDK 项目通常只需要替换 Base URL 与 API Key，即可通过 FeiXiangApi 网关调用。'
        >
          <div className='fx-api-info-grid'>
            <ApiCard title='Base URL' desc='OpenAI 兼容路径统一使用 /v1。'>
              <code>{`${BASE_URL}/v1`}</code>
            </ApiCard>
            <ApiCard title='认证方式' desc='所有请求通过 Bearer Token 认证。'>
              <code>Authorization: Bearer sk-xxxxxxxxxxxx</code>
            </ApiCard>
            <ApiCard title='SDK 兼容' desc='兼容 OpenAI 官方 SDK 与大部分 OpenAI Compatible 工具。'>
              <code>OpenAI({`{ baseURL, apiKey }`})</code>
            </ApiCard>
            <ApiCard title='流式输出' desc='Chat Completions 支持 stream=true 的 SSE 流式输出。'>
              <code>stream: true</code>
            </ApiCard>
          </div>
        </ApiHero>

        <h2>接口入口</h2>
        <div className='fx-doc-jump-grid'>
          <DocJumpCard docId='chat-completions' title='Chat Completions' desc='对话补全、SDK 调用、多轮消息与流式输出。' />
          <DocJumpCard docId='videos' title='Videos' desc='创建视频任务、查询进度、下载视频与 Webhook。' />
          <DocJumpCard docId='gemini-api' title='Gemini API' desc='Gemini 原生 REST 路径、Generate Content 与 Veo。' />
        </div>

        <h2>快速请求示例</h2>
        <p>下面示例展示如何通过 OpenAI 兼容接口发起一次普通对话请求。</p>
        <DocsCodeTabs id='openai-overview-quick' tabs={openAiQuickTabs} />

        <h2>已支持的 OpenAI 兼容接口</h2>
        <ParamTable
          rows={[
            { name: '/v1/chat/completions', type: 'POST', required: true, desc: '对话补全，支持普通输出和流式输出。' },
            { name: '/v1/videos', type: 'POST', required: true, desc: '创建异步视频生成任务。' },
            { name: '/v1/videos/{video_id}', type: 'GET', required: true, desc: '查询视频任务状态与进度。' },
            { name: '/v1/videos/{video_id}/content', type: 'GET', required: true, desc: '下载视频、缩略图或 spritesheet。' },
          ]}
        />

        <h2>接入建议</h2>
        <div className='fx-api-note-grid'>
          <ApiCard title='已有 OpenAI SDK 项目'>
            <p>优先查看 Chat Completions，确认 Base URL、API Key、模型名和 stream 参数。</p>
          </ApiCard>
          <ApiCard title='需要视频生成'>
            <p>直接查看 Videos。视频接口是异步任务，需要先创建、再轮询、最后下载内容。</p>
          </ApiCard>
          <ApiCard title='第三方工具接入'>
            <p>只要工具支持 OpenAI Compatible Provider，通常配置 Base URL 和 API Key 即可。</p>
          </ApiCard>
        </div>

        <NextDocPager />
      </div>
    )
  }

  const ChatCompletionsArticle = () => {
    return (
      <div className='fx-source-prose fx-api-article'>
        <ApiHero
          title='Chat Completions'
          desc='Chat Completions 是最常用的 OpenAI 兼容对话补全接口，适合聊天、多轮问答、结构化输出、代码生成和流式响应。'
        >
          <div className='fx-api-info-grid'>
            <ApiCard title='请求地址'>
              <code>POST {`${BASE_URL}/v1/chat/completions`}</code>
            </ApiCard>
            <ApiCard title='认证方式'>
              <code>Authorization: Bearer sk-xxxxxxxxxxxx</code>
            </ApiCard>
            <ApiCard title='请求格式'>
              <code>application/json</code>
            </ApiCard>
            <ApiCard title='响应模式'>
              <code>普通 JSON / SSE stream</code>
            </ApiCard>
          </div>
        </ApiHero>

        <EndpointCard method='POST' path='/v1/chat/completions' title='创建对话补全'>
          <p>传入模型名称与消息数组，接口返回模型生成的消息内容。开启 <code>stream</code> 后会以流式方式逐步返回增量内容。</p>
          <h4>常用请求字段</h4>
          <ParamTable
            rows={[
              { name: 'model', type: 'string', required: true, desc: '要调用的模型名称，例如 gpt-4o、gpt-4.1、claude-sonnet-4-20250514。' },
              { name: 'messages', type: 'array', required: true, desc: '对话消息数组，每条消息包含 role 和 content。' },
              { name: 'messages[].role', type: 'string', required: true, desc: '消息角色，常见值为 system、user、assistant。' },
              { name: 'messages[].content', type: 'string | array', required: true, desc: '消息内容。文本场景使用 string，多模态场景可使用数组。' },
              { name: 'temperature', type: 'number', required: false, defaultValue: '1', desc: '采样温度，越高越发散，越低越稳定。' },
              { name: 'top_p', type: 'number', required: false, defaultValue: '1', desc: '核采样参数，通常不建议和 temperature 同时大幅调整。' },
              { name: 'max_tokens', type: 'integer', required: false, desc: '限制本次响应的最大输出 token。' },
              { name: 'stream', type: 'boolean', required: false, defaultValue: 'false', desc: '是否启用 SSE 流式输出。' },
            ]}
          />

          <h4>请求示例</h4>
          <DocsCodeTabs id='chat-completions-create' tabs={chatCompletionTabs} />

          <h4>返回结构</h4>
          <DocsCodeTabs id='chat-completions-response' tabs={chatResponseTabs} />
        </EndpointCard>

        <EndpointCard method='POST' path='/v1/chat/completions · stream=true' title='流式输出'>
          <p>流式输出适合长文本生成、CLI 工具、编辑器插件和实时聊天。客户端可以边接收边渲染，减少等待感。</p>
          <DocsCodeTabs id='chat-completions-streaming' tabs={chatStreamingTabs} />
        </EndpointCard>

        <h2>常见错误码</h2>
        <ParamTable
          rows={[
            { name: 'invalid_api_key', type: '401', required: false, desc: 'API Key 无效、过期或没有权限。' },
            { name: 'model_not_found', type: '404', required: false, desc: '模型名称不存在或当前分组未开通。' },
            { name: 'rate_limit_exceeded', type: '429', required: false, desc: '请求频率或额度超限。' },
            { name: 'upstream_error', type: '502/503', required: false, desc: '上游服务暂时不可用或返回异常。' },
          ]}
        />

        <h2>下一步</h2>
        <div className='fx-doc-jump-grid'>
          <DocJumpCard docId='videos' title='Videos' desc='了解异步视频生成任务。' />
          <DocJumpCard docId='openai-api' title='OpenAI API 概览' desc='回到 OpenAI API 接口入口。' />
          <DocJumpCard docId='generate-content' title='Generate Content' desc='查看 Gemini 原生生成接口。' />
        </div>

        <NextDocPager />
      </div>
    )
  }

  const VideosArticle = () => {
    return (
      <div className='fx-source-prose fx-api-article'>
        <ApiHero
          title='Videos API'
          desc='/v1/videos 是异步视频生成接口。发起创建请求后会先返回任务对象，随后通过查询接口轮询状态，任务完成后再下载视频内容。'
        >
          <div className='fx-api-info-grid'>
            <ApiCard title='创建任务'><code>POST /v1/videos</code></ApiCard>
            <ApiCard title='查询进度'><code>GET /v1/videos/{'{video_id}'}</code></ApiCard>
            <ApiCard title='下载内容'><code>GET /v1/videos/{'{video_id}'}/content</code></ApiCard>
            <ApiCard title='任务模式'><code>queued → in_progress → completed / failed</code></ApiCard>
          </div>
        </ApiHero>

        <EndpointCard method='POST' path='/v1/videos' title='创建视频任务'>
          <p>创建视频生成任务。视频任务通常不会立即返回最终视频文件，而是返回一个可轮询的任务对象。</p>
          <ParamTable
            rows={[
              { name: 'prompt', type: 'string', required: true, desc: '视频生成提示词。' },
              { name: 'model', type: 'string', required: false, defaultValue: 'sora-2', desc: '视频模型，例如 sora-2 或 sora-2-pro。' },
              { name: 'seconds', type: 'string | number', required: false, defaultValue: '4', desc: '视频时长，例如 4、8、12。' },
              { name: 'size', type: 'string', required: false, defaultValue: '720x1280', desc: '视频分辨率，例如 1280x720 或 720x1280。' },
              { name: 'input_reference', type: 'object', required: false, desc: '参考图对象，可传 image_url 或 file_id。' },
            ]}
          />
          <DocsCodeTabs id='videos-create' tabs={videoCreateTabs} />
        </EndpointCard>

        <EndpointCard method='GET' path='/v1/videos/{video_id}' title='查询视频任务进度'>
          <p>建议轮询间隔为 10 到 20 秒。<code>progress</code> 是近似进度百分比，<code>status</code> 表示当前任务状态。</p>
          <ParamTable
            rows={[
              { name: 'id', type: 'string', required: true, desc: '视频任务 ID。' },
              { name: 'status', type: 'string', required: true, desc: '任务状态：queued、in_progress、completed、failed。' },
              { name: 'progress', type: 'number', required: false, desc: '近似完成百分比。' },
              { name: 'created_at', type: 'integer', required: false, desc: '任务创建时间，Unix 时间戳。' },
              { name: 'completed_at', type: 'integer', required: false, desc: '任务完成时间。' },
              { name: 'error', type: 'object', required: false, desc: '失败时返回错误码和错误描述。' },
            ]}
          />
          <DocsCodeTabs id='videos-status' tabs={videoStatusTabs} />
        </EndpointCard>

        <EndpointCard method='GET' path='/v1/videos/{video_id}/content' title='下载视频内容'>
          <p>任务完成后，通过内容接口下载最终视频，也可以通过 <code>variant</code> 获取缩略图或 spritesheet。</p>
          <ParamTable
            rows={[
              { name: 'variant', type: 'string', required: false, defaultValue: 'video', desc: '下载内容类型，可选 video、thumbnail、spritesheet。' },
              { name: 'video_id', type: 'string', required: true, desc: '视频任务 ID。' },
            ]}
          />
          <DocsCodeTabs id='videos-download' tabs={videoDownloadTabs} />
        </EndpointCard>

        <h2>Webhook 回调</h2>
        <p>如果不想轮询，也可以配置 Webhook 接收任务结果。常见事件包括 <code>video.completed</code> 和 <code>video.failed</code>。</p>
        <DocsCodeBlock
          lang='json'
          code={`{
  "id": "evt_abc123",
  "object": "event",
  "created_at": 1758941485,
  "type": "video.completed",
  "data": {
    "id": "video_abc123"
  }
}`}
        />

        <NextDocPager />
      </div>
    )
  }

  const GenericArticle = () => {
    return (
      <div
        className='fx-source-prose'
        onClick={handlePreparedArticleClick}
        dangerouslySetInnerHTML={{ __html: prepareDocHtml(activeDoc.id, activeDoc.html || '') }}
      />
    )
  }

  const renderArticleContent = () => {
    if (activeDoc.id === 'openai-api') return <OpenAIOverviewArticle />
    if (activeDoc.id === 'chat-completions') return <ChatCompletionsArticle />
    if (activeDoc.id === 'videos') return <VideosArticle />

    return (
      <>
        <GenericArticle />
        <NextDocPager />
      </>
    )
  }

  return (
    <section className='fx-docs-vp-shell mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8'>
      <style
        dangerouslySetInnerHTML={{
          __html: `
.fx-docs-vp-shell {
  color: rgba(255,255,255,.74);
}
.fx-docs-vp-shell * {
  box-sizing: border-box;
}
.fx-docs-mobile-bar {
  display: none;
  margin-bottom: 14px;
  gap: 10px;
}
.fx-docs-mobile-button {
  flex: 1;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 14px;
  background: rgba(255,255,255,.055);
  color: rgba(255,255,255,.82);
  padding: 11px 14px;
  font-size: 13px;
  font-weight: 900;
}
.fx-docs-vp-layout {
  display: grid;
  grid-template-columns: 286px minmax(0, 1fr) 238px;
  gap: 20px;
  height: calc(100vh - 96px);
  min-height: 680px;
  overflow: hidden;
  align-items: stretch;
}
.fx-docs-panel {
  min-height: 0;
  border: 1px solid rgba(255,255,255,.10);
  background:
    radial-gradient(circle at top left, rgba(255,91,214,.08), transparent 34%),
    rgba(255,255,255,.030);
  box-shadow: 0 18px 52px rgba(0,0,0,.20), inset 0 1px 0 rgba(255,255,255,.045);
  backdrop-filter: blur(16px);
}
.fx-docs-left-panel,
.fx-docs-right-panel {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 22px;
  padding: 18px;
}
.fx-docs-center-panel {
  height: 100%;
  overflow: hidden;
  border-radius: 22px;
  padding: 0;
  background:
    linear-gradient(180deg, rgba(255,255,255,.042), rgba(255,255,255,.022)),
    rgba(255,255,255,.022);
}
.fx-docs-left-scroll,
.fx-docs-right-scroll,
.fx-docs-content-scroll {
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.22) transparent;
}
.fx-docs-left-scroll,
.fx-docs-right-scroll {
  flex: 1 1 auto;
}
.fx-docs-content-scroll {
  height: 100%;
}
.fx-docs-left-scroll::-webkit-scrollbar,
.fx-docs-right-scroll::-webkit-scrollbar,
.fx-docs-content-scroll::-webkit-scrollbar,
.fx-code-block-real pre::-webkit-scrollbar,
.fx-code-tabs-real pre::-webkit-scrollbar,
.fx-native-code-block pre::-webkit-scrollbar,
.fx-native-code-tabs pre::-webkit-scrollbar {
  width: 6px;
  height: 8px;
}
.fx-docs-left-scroll::-webkit-scrollbar-thumb,
.fx-docs-right-scroll::-webkit-scrollbar-thumb,
.fx-docs-content-scroll::-webkit-scrollbar-thumb,
.fx-code-block-real pre::-webkit-scrollbar-thumb,
.fx-code-tabs-real pre::-webkit-scrollbar-thumb,
.fx-native-code-block pre::-webkit-scrollbar-thumb,
.fx-native-code-tabs pre::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.20);
  border-radius: 999px;
}
.fx-docs-left-title {
  color: #fff;
  font-size: 15px;
  font-weight: 950;
  letter-spacing: -.02em;
}
.fx-docs-left-subtitle {
  margin-top: 8px;
  color: rgba(255,255,255,.40);
  font-size: 12px;
  line-height: 1.7;
}
.fx-docs-search {
  width: 100%;
  margin: 16px 0 8px;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 14px;
  background: rgba(255,255,255,.045);
  color: #fff;
  outline: none;
  padding: 10px 12px;
  font-size: 13px;
}
.fx-docs-search::placeholder {
  color: rgba(255,255,255,.34);
}
.fx-docs-search:focus {
  border-color: rgba(255,143,232,.48);
  box-shadow: 0 0 0 4px rgba(255,91,214,.08);
}
.fx-docs-search-count {
  margin: 0 0 12px;
  color: rgba(255,255,255,.35);
  font-size: 12px;
}
.fx-docs-nav {
  padding-right: 5px;
}
.fx-docs-nav-group {
  border-top: 1px solid rgba(255,255,255,.085);
  padding: 12px 0;
}
.fx-docs-nav-group:first-of-type {
  border-top: 0;
}
.fx-docs-nav-subgroup {
  border-top: 0;
  padding: 4px 0 3px 9px;
}
.fx-docs-group-button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 0;
  background: transparent;
  color: rgba(255,255,255,.72);
  cursor: pointer;
  padding: 5px 2px 7px;
  text-align: left;
  font-size: 13px;
  font-weight: 950;
}
.fx-docs-group-button:hover,
.fx-docs-group-button-active {
  color: #fff;
}
.fx-docs-nav-subgroup .fx-docs-group-button {
  color: rgba(255,255,255,.55);
  font-size: 12.5px;
}
.fx-docs-chevron {
  transform: rotate(-90deg);
  color: rgba(255,255,255,.34);
  transition: transform .16s ease, color .16s ease;
}
.fx-docs-chevron-open {
  transform: rotate(0deg);
  color: rgba(255,255,255,.68);
}
.fx-docs-group-items {
  display: grid;
  gap: 1px;
  margin-top: 4px;
}
.fx-docs-subgroup-items {
  margin-left: 9px;
  border-left: 1px solid rgba(255,255,255,.10);
  padding-left: 8px;
}
.fx-docs-nav-link {
  display: block;
  width: 100%;
  border: 0;
  border-left: 2px solid transparent;
  border-radius: 0 12px 12px 0;
  background: transparent;
  color: rgba(255,255,255,.55);
  cursor: pointer;
  font-size: 13.5px;
  line-height: 1.42;
  padding: 8px 10px;
  text-align: left;
  transition: background .16s ease, color .16s ease, border-color .16s ease;
}
.fx-docs-nav-link:hover {
  color: #fff;
  border-left-color: rgba(255,255,255,.18);
  background: rgba(255,255,255,.04);
}
.fx-docs-nav-link-nested {
  font-size: 12.8px;
  color: rgba(255,255,255,.46);
}
.fx-docs-nav-link.fx-active-doc-link {
  color: #ff9eed;
  border-left-color: rgba(255,143,232,.95);
  background: rgba(255,91,214,.08);
}
.fx-docs-single-link {
  padding: 4px 0;
}
.fx-docs-content-scroll {
  padding: clamp(26px, 4vw, 48px);
}
.fx-docs-article-shell {
  min-height: 100%;
  margin: 0 auto;
  max-width: 880px;
}
.fx-docs-article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}
.fx-docs-pill {
  display: inline-flex;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 999px;
  background: rgba(255,255,255,.042);
  padding: 5px 9px;
  color: rgba(255,255,255,.46);
  font-size: 11.5px;
  font-weight: 900;
}
.fx-source-prose {
  color: rgba(255,255,255,.74);
  font-size: 15px;
  line-height: 1.80;
}
.fx-source-prose h1 {
  margin: 0 0 18px;
  font-size: clamp(33px, 4vw, 40px);
  line-height: 1.10;
  font-weight: 950;
  color: #fff;
  letter-spacing: -.036em;
}
.fx-source-prose h2 {
  margin: 38px 0 14px;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,.085);
  font-size: clamp(22px, 2.5vw, 26px);
  line-height: 1.24;
  font-weight: 930;
  color: #fff;
  letter-spacing: -.025em;
  scroll-margin-top: 24px;
}
.fx-source-prose h3 {
  margin: 28px 0 10px;
  font-size: 18px;
  line-height: 1.35;
  font-weight: 900;
  color: rgba(255,255,255,.95);
  scroll-margin-top: 24px;
}
.fx-source-prose h4 {
  margin: 22px 0 9px;
  font-size: 16px;
  font-weight: 900;
  color: rgba(255,255,255,.90);
}
.fx-source-prose p {
  margin: 10px 0;
}
.fx-source-prose a {
  color: #ff9eed;
  text-decoration: none;
  border-bottom: 1px dashed rgba(255,158,237,.42);
}
.fx-source-prose a:hover {
  color: #ffc0f4;
  border-bottom-color: #ffc0f4;
}
.fx-source-prose code {
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 7px;
  background: rgba(255,255,255,.075);
  padding: .12em .40em;
  color: #bff7ff;
  font-size: .92em;
}
.fx-source-prose pre {
  margin: 0;
}
.fx-source-prose pre code {
  border: 0;
  background: transparent;
  padding: 0;
  color: #c9f6ff;
  font-size: 13px;
  line-height: 1.72;
  white-space: pre;
}
.fx-copy-button {
  pointer-events: auto;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 999px;
  background: rgba(255,255,255,.09);
  padding: 5px 10px;
  color: rgba(255,255,255,.78);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
  transition: background .16s ease, color .16s ease, border-color .16s ease;
}
.fx-copy-button:hover {
  color: #fff;
  border-color: rgba(255,143,232,.34);
  background: rgba(255,91,214,.16);
}
.fx-code-block-real,
.fx-code-tabs-real,
.fx-native-code-block,
.fx-native-code-tabs {
  margin: 14px 0 20px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.085);
  border-radius: 14px;
  background: rgba(0,0,0,.24);
}
.fx-code-block-real-head,
.fx-code-tabs-real-head,
.fx-native-code-head,
.fx-native-code-tabs-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(255,255,255,.10);
  background: rgba(18,18,36,.94);
  padding: 10px 12px;
  backdrop-filter: blur(14px);
}
.fx-code-lang,
.fx-native-code-head span {
  color: rgba(255,255,255,.50);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.fx-code-tabs-real-nav,
.fx-native-code-tabs-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}
.fx-code-tab-button,
.fx-native-code-tab {
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  padding: 6px 11px;
  color: rgba(255,255,255,.54);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}
.fx-code-tab-button:hover,
.fx-native-code-tab:hover {
  color: #fff;
  background: rgba(255,255,255,.06);
}
.fx-code-tab-button.fx-code-tab-active,
.fx-native-code-tab-active {
  border-color: rgba(255,143,232,.34);
  background: rgba(255,91,214,.16);
  color: #fff;
}
.fx-code-tabs-real-panel,
.fx-code-tabs-panel {
  display: none;
}
.fx-code-panel-active {
  display: block;
}
.fx-code-block-real pre,
.fx-code-tabs-real pre,
.fx-native-code-block pre,
.fx-native-code-tabs pre {
  margin: 0 !important;
  overflow: auto;
  border: 0 !important;
  border-radius: 0 !important;
  background: rgba(0,0,0,.44) !important;
  padding: 18px !important;
}
.fx-code-tabs-real pre code,
.fx-code-block-real pre code,
.fx-native-code-tabs pre code,
.fx-native-code-block pre code {
  white-space: pre;
}
.fx-source-prose ul,
.fx-source-prose ol {
  margin: 11px 0 18px;
  padding-left: 24px;
}
.fx-source-prose li {
  margin: 6px 0;
}
.fx-source-prose table {
  display: block;
  width: 100%;
  margin: 16px 0 24px;
  overflow-x: auto;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid rgba(255,255,255,.11);
  border-radius: 15px;
  font-size: 14px;
}
.fx-source-prose th,
.fx-source-prose td {
  border-bottom: 1px solid rgba(255,255,255,.085);
  padding: 10px 12px;
  vertical-align: top;
}
.fx-source-prose th {
  background: rgba(255,255,255,.07);
  color: #fff;
  font-weight: 900;
}
.fx-source-prose tr:last-child td {
  border-bottom: 0;
}
.fx-source-prose blockquote {
  margin: 16px 0 24px;
  border-left: 4px solid rgba(255,123,224,.62);
  border-radius: 13px;
  background: rgba(255,255,255,.048);
  padding: 12px 16px;
  color: rgba(255,255,255,.78);
}
.fx-source-prose hr {
  margin: 28px 0;
  border: 0;
  border-top: 1px solid rgba(255,255,255,.09);
}
.fx-callout {
  margin: 16px 0 22px;
  border-radius: 15px;
  border: 1px solid rgba(255,255,255,.10);
  border-left-width: 4px;
  padding: 13px 16px;
  background: rgba(255,255,255,.048);
}
.fx-callout-title {
  margin-bottom: 7px;
  color: #fff;
  font-weight: 950;
}
.fx-callout-tip {
  border-color: rgba(84,255,190,.22);
  border-left-color: rgba(84,255,190,.62);
  background: rgba(84,255,190,.07);
}
.fx-callout-warning {
  border-color: rgba(255,190,84,.26);
  border-left-color: rgba(255,190,84,.70);
  background: rgba(255,190,84,.07);
}
.fx-callout-danger {
  border-color: rgba(255,84,120,.28);
  border-left-color: rgba(255,84,120,.72);
  background: rgba(255,84,120,.07);
}
.fx-code-group,
.fx-code-tab-label {
  display: none !important;
}
.fx-step-code-block {
  margin: 14px 0 20px;
}
.fx-step-code-title {
  margin: 0 0 8px;
  color: rgba(255,255,255,.76);
  font-size: 13px;
  font-weight: 950;
}
.fx-step-code-block .fx-code-block-real {
  margin: 0;
}
.fx-info-grid-real {
  display: grid;
  overflow: hidden;
  margin: 14px 0 24px;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 16px;
  background: rgba(255,255,255,.032);
}
.fx-info-item {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  border-bottom: 1px solid rgba(255,255,255,.085);
}
.fx-info-item:last-child {
  border-bottom: 0;
}
.fx-info-label {
  border-right: 1px solid rgba(255,255,255,.085);
  background: rgba(255,255,255,.045);
  padding: 13px 14px;
  color: rgba(255,255,255,.68);
  font-size: 13px;
  font-weight: 950;
}
.fx-info-value {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 14px;
  color: rgba(255,255,255,.70);
  font-size: 13px;
  line-height: 1.65;
}
.fx-info-value span {
  min-width: 0;
}
.fx-copy-value-button {
  flex: 0 0 auto;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 999px;
  background: rgba(255,255,255,.055);
  color: rgba(255,255,255,.58);
  cursor: pointer;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 900;
}
.fx-copy-value-button:hover {
  color: #fff;
  border-color: rgba(255,143,232,.28);
  background: rgba(255,91,214,.10);
}
.fx-desc-grid-real {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0 24px;
}
.fx-desc-card {
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 14px;
  background: rgba(255,255,255,.035);
  padding: 13px 14px;
}
.fx-desc-title {
  color: rgba(255,255,255,.84);
  font-size: 13px;
  font-weight: 950;
}
.fx-desc-content {
  margin-top: 6px;
  color: rgba(255,255,255,.58);
  font-size: 13px;
  line-height: 1.65;
}
.fx-platform-grid-real {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0 24px;
}
.fx-platform-card {
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 14px;
  background: rgba(255,255,255,.035);
  padding: 13px 14px;
}
.fx-platform-name {
  color: #fff;
  font-size: 14px;
  font-weight: 950;
}
.fx-platform-packages {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 9px;
  color: rgba(255,255,255,.58);
  font-size: 13px;
  line-height: 1.65;
}
.fx-platform-packages code {
  border-color: rgba(191,247,255,.18);
  background: rgba(191,247,255,.07);
  color: #c9f6ff;
}
.fx-tool-grid-real {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0 24px;
}
.fx-tool-card {
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 14px;
  background: rgba(255,255,255,.035);
  padding: 13px 14px;
}
.fx-tool-name {
  color: #fff;
  font-size: 14px;
  font-weight: 950;
}
.fx-tool-type {
  margin-top: 5px;
  color: rgba(255,255,255,.54);
  font-size: 13px;
}
.fx-tool-score {
  margin-top: 8px;
  color: #ffd36d;
  font-size: 12px;
  letter-spacing: .03em;
}
.fx-endpoint-list-grid {
  display: grid;
  gap: 10px;
  margin: 14px 0 24px;
}
.fx-endpoint-list-card {
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 14px;
  background: rgba(255,255,255,.035);
  padding: 13px 14px;
}
.fx-endpoint-list-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.fx-endpoint-list-head code {
  border: 0;
  background: transparent;
  padding: 0;
  color: #c9f6ff;
}
.fx-endpoint-list-head span {
  border: 1px solid rgba(84,255,190,.20);
  border-radius: 999px;
  background: rgba(84,255,190,.08);
  color: #a9ffdc;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 950;
}
.fx-endpoint-list-card p {
  margin-top: 7px;
  color: rgba(255,255,255,.56);
  font-size: 13px;
}
.fx-comfort-table-wrap {
  margin: 14px 0 24px;
  overflow-x: auto;
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 14px;
  background: rgba(255,255,255,.030);
}
.fx-comfort-table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  font-size: 13px;
}
.fx-comfort-table th,
.fx-comfort-table td {
  border-bottom: 1px solid rgba(255,255,255,.075);
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
}
.fx-comfort-table th {
  background: rgba(255,255,255,.055);
  color: rgba(255,255,255,.86);
  font-weight: 950;
}
.fx-comfort-table tr:last-child td {
  border-bottom: 0;
}
.fx-comfort-table code {
  border-color: rgba(191,247,255,.16);
  background: rgba(191,247,255,.06);
}

.fx-click-card {
  cursor: pointer;
  text-align: left;
}
.fx-click-card:hover,
.fx-doc-link-card:hover,
.fx-baseurl-card:hover,
.fx-field-desc-card:hover,
.fx-param-card:hover,
.fx-path-card:hover,
.fx-field-example-card:hover,
.fx-security-action-card:hover {
  transform: translateY(-1px);
  border-color: rgba(255,143,232,.28);
  background: rgba(255,91,214,.070);
}
.fx-baseurl-grid-real,
.fx-field-example-grid,
.fx-doc-link-grid-real,
.fx-path-grid-real,
.fx-field-desc-grid,
.fx-param-card-grid {
  display: grid;
  gap: 10px;
  margin: 14px 0 24px;
}
.fx-baseurl-grid-real,
.fx-field-example-grid,
.fx-doc-link-grid-real,
.fx-path-grid-real,
.fx-field-desc-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.fx-param-card-grid {
  grid-template-columns: 1fr;
}
.fx-baseurl-card,
.fx-field-example-card,
.fx-doc-link-card,
.fx-path-card,
.fx-field-desc-card,
.fx-param-card,
.fx-security-action-card {
  display: block;
  width: 100%;
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 15px;
  background: rgba(255,255,255,.035);
  padding: 13px 14px;
  color: rgba(255,255,255,.68);
  transition: transform .16s ease, border-color .16s ease, background .16s ease;
}
.fx-baseurl-head,
.fx-param-card-head,
.fx-api-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.fx-baseurl-head strong,
.fx-field-example-card strong,
.fx-doc-link-card strong,
.fx-field-desc-name,
.fx-path-kind,
.fx-param-card-head code {
  color: #fff;
  font-size: 13px;
  font-weight: 950;
}
.fx-baseurl-head span {
  border: 1px solid rgba(84,255,190,.20);
  border-radius: 999px;
  background: rgba(84,255,190,.08);
  color: #a9ffdc;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 950;
}
.fx-baseurl-value,
.fx-field-example-value,
.fx-path-value,
.fx-field-desc-name {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 9px;
}
.fx-baseurl-value span,
.fx-field-example-value span,
.fx-path-value span,
.fx-field-desc-name span {
  min-width: 0;
}
.fx-field-example-copy p,
.fx-doc-link-card p,
.fx-field-desc-card p,
.fx-param-card p,
.fx-security-action-card p {
  margin: 7px 0 0;
  color: rgba(255,255,255,.54);
  font-size: 13px;
  line-height: 1.65;
}
.fx-param-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 9px;
}
.fx-param-card-meta span {
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 999px;
  background: rgba(255,255,255,.045);
  padding: 4px 8px;
  color: rgba(255,255,255,.50);
  font-size: 11.5px;
  font-weight: 900;
}
.fx-openclaw-action-li {
  list-style: none;
  margin-left: -24px !important;
}
.fx-security-action-card .fx-code-tabs-real,
.fx-security-action-card .fx-code-block-real {
  margin-bottom: 0;
}
.fx-api-card-top > strong {
  margin: 0;
}
.fx-api-card-copy {
  min-height: 0 !important;
  padding: 4px 9px !important;
  font-size: 11px !important;
}
.fx-api-card code,
.fx-endpoint-head code,
.fx-info-value code,
.fx-baseurl-value code,
.fx-field-example-value code,
.fx-path-value code {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

@media (max-width: 1023px) {
  .fx-desc-grid-real,
  .fx-platform-grid-real,
  .fx-tool-grid-real,
  .fx-baseurl-grid-real,
  .fx-field-example-grid,
  .fx-doc-link-grid-real,
  .fx-path-grid-real,
  .fx-field-desc-grid {
    grid-template-columns: 1fr;
  }
  .fx-info-item {
    grid-template-columns: 1fr;
  }
  .fx-info-label {
    border-right: 0;
    border-bottom: 1px solid rgba(255,255,255,.075);
  }
}

.fx-doc-local-toc {
  margin: 16px 0 24px;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 16px;
  background: rgba(255,255,255,.042);
  padding: 14px 16px;
}
.fx-doc-local-toc summary {
  cursor: pointer;
  color: #fff;
  font-weight: 950;
}
.fx-doc-local-toc ol {
  margin-top: 12px;
}
.fx-api-hero {
  margin-bottom: 26px;
}
.fx-api-hero h1 {
  margin-bottom: 12px;
}
.fx-api-hero > p {
  max-width: 760px;
  color: rgba(255,255,255,.62);
}
.fx-api-info-grid,
.fx-api-note-grid,
.fx-doc-jump-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0 24px;
}
.fx-api-card,
.fx-doc-jump-card,
.fx-endpoint-card {
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 16px;
  background: rgba(255,255,255,.042);
  padding: 15px;
}
.fx-api-card strong {
  display: block;
  color: #fff;
  font-size: 14px;
  font-weight: 950;
}
.fx-api-card p,
.fx-doc-jump-card small {
  margin: 7px 0 0;
  color: rgba(255,255,255,.50);
  font-size: 13px;
  line-height: 1.65;
}
.fx-api-card code {
  display: inline-flex;
  margin-top: 10px;
}
.fx-doc-jump-card {
  display: block;
  width: 100%;
  cursor: pointer;
  text-align: left;
  transition: border-color .16s ease, background .16s ease, transform .16s ease;
}
.fx-doc-jump-card:hover {
  transform: translateY(-1px);
  border-color: rgba(255,143,232,.30);
  background: rgba(255,91,214,.08);
}
.fx-doc-jump-card span {
  display: block;
  color: #fff;
  font-size: 15px;
  font-weight: 950;
}
.fx-endpoint-card {
  margin: 20px 0 26px;
  padding: 18px;
}
.fx-endpoint-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.fx-method-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 950;
  letter-spacing: .08em;
}
.fx-method-post {
  border: 1px solid rgba(84,255,190,.24);
  background: rgba(84,255,190,.10);
  color: #a9ffdc;
}
.fx-method-get {
  border: 1px solid rgba(112,204,255,.24);
  background: rgba(112,204,255,.10);
  color: #b9edff;
}
.fx-endpoint-head code {
  border: 0;
  background: transparent;
  color: rgba(255,255,255,.78);
  padding: 0;
}
.fx-endpoint-card h3 {
  margin-top: 8px;
}
.fx-param-table-wrap {
  margin: 14px 0 20px;
  overflow-x: auto;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 15px;
}
.fx-param-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: 13px;
}
.fx-param-table th,
.fx-param-table td {
  border-bottom: 1px solid rgba(255,255,255,.085);
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
}
.fx-param-table th {
  background: rgba(255,255,255,.07);
  color: #fff;
  font-weight: 950;
}
.fx-param-table tr:last-child td {
  border-bottom: 0;
}
.fx-param-table code {
  border: 0;
  background: transparent;
  color: #c9f6ff;
  padding: 0;
}
.fx-param-badge {
  display: inline-flex;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 950;
}
.fx-param-required {
  background: rgba(255,91,214,.12);
  color: #ffc2f2;
}
.fx-param-optional {
  background: rgba(255,255,255,.07);
  color: rgba(255,255,255,.52);
}

/* Style bugfix + native API responsive cards */
.fx-baseurl-grid-real {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
}
.fx-baseurl-card {
  position: relative;
  display: grid !important;
  gap: 10px;
  min-width: 0;
  min-height: 122px;
  padding: 15px !important;
  text-align: left;
}
.fx-baseurl-head {
  min-width: 0;
}
.fx-baseurl-head strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fx-baseurl-head span {
  flex: 0 0 auto;
}
.fx-baseurl-code-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.fx-baseurl-code {
  display: block;
  min-width: 0;
  flex: 1 1 auto;
}
.fx-baseurl-code code {
  display: inline-flex;
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.fx-baseurl-note {
  margin: 0 !important;
  color: rgba(255,255,255,.46);
  font-size: 12.5px;
  line-height: 1.6;
}
.fx-baseurl-card .fx-copy-value-button {
  flex: 0 0 auto;
  align-self: center;
}
.fx-native-endpoint-grid,
.fx-native-error-grid,
.fx-native-field-grid {
  display: grid;
  gap: 12px;
  margin: 14px 0 22px;
}
.fx-native-endpoint-grid,
.fx-native-field-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.fx-native-error-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.fx-native-endpoint-card,
.fx-native-error-card,
.fx-native-field-card {
  min-width: 0;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,.052), rgba(255,255,255,.030));
  padding: 15px;
  transition: transform .16s ease, border-color .16s ease, background .16s ease;
}
.fx-native-endpoint-card:hover,
.fx-native-error-card:hover,
.fx-native-field-card:hover {
  transform: translateY(-1px);
  border-color: rgba(255,143,232,.30);
  background: rgba(255,91,214,.075);
}
.fx-native-endpoint-top,
.fx-native-error-top,
.fx-native-field-head {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.fx-native-endpoint-card code,
.fx-native-error-card code,
.fx-native-field-card code {
  display: inline-flex;
  max-width: 100%;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.fx-native-endpoint-card > code {
  border-color: rgba(191,247,255,.16);
  background: rgba(191,247,255,.06);
  color: #c9f6ff;
}
.fx-native-endpoint-card p,
.fx-native-error-card p,
.fx-native-field-card p {
  margin: 10px 0 0;
  color: rgba(255,255,255,.56);
  font-size: 13px;
  line-height: 1.7;
}
.fx-native-error-top span {
  flex: 0 0 auto;
  border: 1px solid rgba(255,190,84,.22);
  border-radius: 999px;
  background: rgba(255,190,84,.08);
  color: #ffdca8;
  padding: 4px 9px;
  font-size: 12px;
  font-weight: 950;
}
.fx-native-field-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.fx-native-field-meta > span:not(.fx-param-badge) {
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 999px;
  background: rgba(255,255,255,.045);
  padding: 4px 8px;
  color: rgba(255,255,255,.56);
  font-size: 11.5px;
  font-weight: 900;
}
.fx-native-mini-copy {
  flex: 0 0 auto !important;
  min-height: 0 !important;
  gap: 4px !important;
  border-radius: 999px !important;
  padding: 5px 9px !important;
  font-size: 11px !important;
  line-height: 1 !important;
  white-space: nowrap !important;
}
.fx-native-mini-copy svg {
  width: 13px !important;
  height: 13px !important;
}
.fx-endpoint-head {
  min-width: 0;
}
.fx-endpoint-head code {
  min-width: 0;
  flex: 1 1 auto;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.fx-endpoint-copy {
  margin-left: auto;
}
.fx-api-card,
.fx-api-card-top {
  min-width: 0;
}
.fx-api-card code {
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}
@media (max-width: 760px) {
  .fx-baseurl-grid-real,
  .fx-native-endpoint-grid,
  .fx-native-error-grid,
  .fx-native-field-grid {
    grid-template-columns: 1fr;
  }
  .fx-baseurl-code-row,
  .fx-native-endpoint-top,
  .fx-native-field-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .fx-baseurl-card .fx-copy-value-button,
  .fx-native-mini-copy,
  .fx-endpoint-copy {
    align-self: flex-end;
  }
}
.fx-doc-pager {
  margin-top: 42px;
  border-top: 1px solid rgba(255,255,255,.09);
  padding-top: 20px;
}
.fx-doc-pager-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.fx-doc-pager-card {
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 15px;
  background: rgba(255,255,255,.04);
  padding: 14px;
  text-align: left;
  cursor: pointer;
}
.fx-doc-pager-card:hover {
  border-color: rgba(255,143,232,.30);
  background: rgba(255,91,214,.08);
}
.fx-doc-pager-card small {
  display: block;
  color: rgba(255,255,255,.38);
  font-size: 12px;
  font-weight: 900;
}
.fx-doc-pager-card span {
  display: block;
  margin-top: 5px;
  color: #fff;
  font-weight: 950;
}
.fx-doc-pager-next {
  text-align: right;
}
.fx-related-docs {
  margin-top: 18px;
}
.fx-related-docs > strong {
  display: block;
  color: rgba(255,255,255,.72);
  font-size: 13px;
  font-weight: 950;
}
.fx-related-docs > div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.fx-related-docs button {
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 999px;
  background: rgba(255,255,255,.045);
  color: rgba(255,255,255,.62);
  cursor: pointer;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 900;
}
.fx-related-docs button:hover {
  color: #fff;
  border-color: rgba(255,143,232,.30);
}
.fx-docs-outline-title {
  color: #fff;
  font-size: 13px;
  font-weight: 950;
}
.fx-docs-outline-current {
  margin: 8px 0 14px;
  color: rgba(255,255,255,.42);
  font-size: 12px;
  line-height: 1.6;
}
.fx-docs-outline-compact-note {
  margin-bottom: 10px;
  color: rgba(255,255,255,.30);
  font-size: 11px;
  line-height: 1.55;
}
.fx-docs-outline-list {
  display: grid;
  gap: 2px;
}
.fx-outline-button {
  display: block;
  width: 100%;
  border: 0;
  border-left: 2px solid transparent;
  border-radius: 0 10px 10px 0;
  background: transparent;
  color: rgba(255,255,255,.46);
  text-align: left;
  font-size: 12px;
  line-height: 1.42;
  padding: 7px 8px;
  cursor: pointer;
  transition: background .16s ease, color .16s ease, border-color .16s ease;
}
.fx-outline-button:hover,
.fx-outline-button.fx-outline-active {
  color: #fff;
  border-left-color: rgba(255,143,232,.82);
  background: rgba(255,255,255,.055);
}
.fx-outline-button[data-level="3"] {
  padding-left: 20px;
  color: rgba(255,255,255,.38);
}
.fx-outline-top {
  margin-top: 16px;
  width: 100%;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 999px;
  background: rgba(255,255,255,.045);
  color: rgba(255,255,255,.62);
  cursor: pointer;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 900;
}
.fx-outline-top:hover {
  color: #fff;
  border-color: rgba(255,143,232,.28);
  background: rgba(255,91,214,.10);
}
@media (max-width: 1279px) {
  .fx-docs-vp-layout {
    grid-template-columns: 270px minmax(0, 1fr);
  }
  .fx-docs-right-panel {
    display: none;
  }
}
@media (max-width: 1023px) {
  .fx-docs-mobile-bar {
    display: flex;
  }
  .fx-docs-vp-layout {
    height: auto;
    min-height: 0;
    overflow: visible;
    grid-template-columns: 1fr;
  }
  .fx-docs-left-panel {
    display: none;
    height: auto;
    max-height: 66vh;
  }
  .fx-docs-left-panel.fx-docs-mobile-open {
    display: flex;
  }
  .fx-docs-right-panel {
    display: none;
    height: auto;
    max-height: 46vh;
  }
  .fx-docs-right-panel.fx-docs-mobile-open {
    display: flex;
  }
  .fx-docs-center-panel {
    height: auto;
  }
  .fx-docs-content-scroll {
    max-height: none;
    overflow: visible;
  }
  .fx-docs-article-shell {
    max-width: none;
  }
  .fx-api-info-grid,
  .fx-api-note-grid,
  .fx-doc-jump-grid,
  .fx-doc-pager-row {
    grid-template-columns: 1fr;
  }
  .fx-code-tabs-real-head,
  .fx-native-code-tabs-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .fx-code-copy-button,
  .fx-native-copy {
    align-self: flex-end;
  }
}
          `,
        }}
      />

      <div className='fx-docs-mobile-bar'>
        <button type='button' className='fx-docs-mobile-button' onClick={() => setMobileNavOpen((value) => !value)}>
          {mobileNavOpen ? '收起目录' : '打开目录'}
        </button>
        <button type='button' className='fx-docs-mobile-button' onClick={() => setMobileOutlineOpen((value) => !value)}>
          {mobileOutlineOpen ? '收起本文目录' : '本文目录'}
        </button>
      </div>

      <div className='fx-docs-vp-layout'>
        <aside className={cx('fx-docs-panel fx-docs-left-panel', mobileNavOpen && 'fx-docs-mobile-open')}>
          <div className='fx-docs-left-brand flex items-center gap-3'>
            <LogoMark />
            <div>
              <div className='fx-docs-left-title'>FeiXiangApi Docs</div>
              <p className='fx-docs-left-subtitle'>全量开发文档，共 {allDocs.length} 个页面。</p>
            </div>
          </div>

          <input
            className='fx-docs-search'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='搜索标题、正文或代码...'
            type='search'
          />

          <div className='fx-docs-search-count'>
            {normalizedQuery ? `找到 ${visibleDocsCount} 个结果` : '按文档类型分组浏览'}
          </div>

          <nav className='fx-docs-left-scroll fx-docs-nav' aria-label='开发文档导航'>
            {navGroups.map((group) => renderGroup(group))}
          </nav>
        </aside>

        <main className='fx-docs-panel fx-docs-center-panel'>
          <div className='fx-docs-content-scroll' data-fx-doc-content-scroll>
            <article className='fx-docs-article-shell' data-fx-doc-article={activeDoc.id}>
              <div className='fx-docs-article-meta'>
                {docBadges.map((badge) => <span key={badge} className='fx-docs-pill'>{badge}</span>)}
              </div>
              {renderArticleContent()}
            </article>
          </div>
        </main>

        <aside className={cx('fx-docs-panel fx-docs-right-panel', mobileOutlineOpen && 'fx-docs-mobile-open')}>
          <div className='fx-docs-right-scroll'>
            <div className='fx-docs-outline-title'>页面导航</div>
            <div className='fx-docs-outline-current'>{activeDoc.title}</div>
            {compactOutline && <div className='fx-docs-outline-compact-note'>当前文档较长，仅展开当前章节下的三级目录。</div>}
            <div className='fx-docs-outline-list'>
              {visibleOutline.length ? (
                visibleOutline.map((item) => (
                  <button
                    key={item.id}
                    type='button'
                    className='fx-outline-button'
                    data-level={item.level}
                    data-fx-outline-id={item.id}
                    onClick={() => scrollToHeading(item.id)}
                  >
                    {item.text}
                  </button>
                ))
              ) : (
                <p className='text-xs leading-6 text-white/35'>当前文档暂无二级目录。</p>
              )}
            </div>
            <button
              type='button'
              className='fx-outline-top'
              onClick={() => {
                const scrollContainer = document.querySelector('[data-fx-doc-content-scroll]') as HTMLElement | null
                scrollContainer?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              回到顶部
            </button>
          </div>
        </aside>
      </div>
    </section>
  )
}
// FX_DOCS_SOURCE_TO_TSX_END

function FeiXiangNavActiveRouteFix() {
  return null
}

const QQ_GROUP = '1026633279'

function cx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(' ')
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch {
      return false
    }
  }
}

function CopyButton({ value, label = '复制', copiedLabel = '已复制', className }: { value: string; label?: string; copiedLabel?: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type='button'
      onClick={async () => {
        const ok = await copyText(value)
        if (ok) {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1600)
        }
      }}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-pink-300/40 hover:bg-white/[0.08] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-pink-400/40',
        copied && 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100',
        className,
      )}
      aria-live='polite'
    >
      <CopyIcon className='h-4 w-4' />
      {copied ? copiedLabel : label}
    </button>
  )
}

function Svg({ children, className = 'h-5 w-5', viewBox = '0 0 24 24' }: { children: ReactNode; className?: string; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
      {children}
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return <Svg className={className}><path d='M12 3l1.7 5.2L19 10l-5.3 1.8L12 17l-1.7-5.2L5 10l5.3-1.8L12 3Z' /><path d='M5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z' /><path d='M19 4v4' /><path d='M21 6h-4' /></Svg>
}
function TerminalIcon({ className }: { className?: string }) { return <Svg className={className}><path d='m4 17 6-6-6-6' /><path d='M12 19h8' /></Svg> }
function CloudIcon({ className }: { className?: string }) { return <Svg className={className}><path d='M12 13v8' /><path d='m8 17 4 4 4-4' /><path d='M4.4 15.3A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.4 8.3' /></Svg> }
function CodeIcon({ className }: { className?: string }) { return <Svg className={className}><path d='m16 18 6-6-6-6' /><path d='m8 6-6 6 6 6' /></Svg> }
function ShieldIcon({ className }: { className?: string }) { return <Svg className={className}><path d='M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z' /><path d='m9 12 2 2 4-4' /></Svg> }
function KeyIcon({ className }: { className?: string }) { return <Svg className={className}><circle cx='7.5' cy='15.5' r='5.5' /><path d='m21 2-9.6 9.6' /><path d='m15 7 2 2' /><path d='m18 4 2 2' /></Svg> }
function PackageIcon({ className }: { className?: string }) { return <Svg className={className}><path d='m21 16-9 5-9-5V8l9-5 9 5Z' /><path d='m3.3 7.6 8.7 5 8.7-5' /><path d='M12 22V12' /></Svg> }
function UsersIcon({ className }: { className?: string }) { return <Svg className={className}><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' /><circle cx='9' cy='7' r='4' /><path d='M22 21v-2a4 4 0 0 0-3-3.9' /><path d='M16 3.1a4 4 0 0 1 0 7.8' /></Svg> }
function CopyIcon({ className }: { className?: string }) { return <Svg className={className}><rect x='8' y='8' width='14' height='14' rx='2' /><path d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' /></Svg> }
function ArrowIcon({ className }: { className?: string }) { return <Svg className={className}><path d='M5 12h14' /><path d='m12 5 7 7-7 7' /></Svg> }
function CheckIcon({ className }: { className?: string }) { return <Svg className={className}><circle cx='12' cy='12' r='10' /><path d='m9 12 2 2 4-4' /></Svg> }
function GridIcon({ className }: { className?: string }) { return <Svg className={className}><rect x='3' y='3' width='7' height='7' rx='1' /><rect x='14' y='3' width='7' height='7' rx='1' /><rect x='3' y='14' width='7' height='7' rx='1' /><rect x='14' y='14' width='7' height='7' rx='1' /></Svg> }
function BookIcon({ className }: { className?: string }) { return <Svg className={className}><path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20' /><path d='M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z' /></Svg> }
function MessageIcon({ className }: { className?: string }) { return <Svg className={className}><path d='M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z' /></Svg> }
function DownloadIcon({ className }: { className?: string }) { return <Svg className={className}><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' /><path d='M7 10l5 5 5-5' /><path d='M12 15V3' /></Svg> }

function LogoMark() {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt={`${BRAND} logo`}
      className='h-9 w-9 shrink-0 object-contain'
      loading='eager'
      decoding='async'
    />
  )
}

type FeiXiangSmartLinkProps = {
  href: string
  children: ReactNode
  className?: string
  target?: string
  rel?: string
  onClick?: () => void
  ariaLabel?: string
}

function isFeiXiangSpaHref(href: string) {
  if (!href) return false
  if (href.startsWith('#')) return false
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return false
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return false
  return href.startsWith('/')
}

function FeiXiangSmartLink({
  href,
  children,
  className,
  target,
  rel,
  onClick,
  ariaLabel,
}: FeiXiangSmartLinkProps) {
  if (!isFeiXiangSpaHref(href) || target) {
    return (
      <a href={href} className={className} target={target} rel={rel} onClick={onClick} aria-label={ariaLabel}>
        {children}
      </a>
    )
  }

  return (
    <Link
      to={href as any}
      preload='intent'
      className={className}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  )
}


function Header() {
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const nav = [
    ['首页', '/'],
    ['控制台', '/dashboard'],
    ['模型广场', '/pricing'],
    ['帮助文档', '/docs'],
  ]

  const isActive = (href: string) => {
    const cleanPath = (pathname || '/').replace(/\/+$/, '') || '/'
    const cleanHref = (href || '/').replace(/\/+$/, '') || '/'

    if (cleanHref === '/') return cleanPath === '/'
    return cleanPath === cleanHref || cleanPath.startsWith(`${cleanHref}/`)
  }

  return (
    <header className='sticky top-0 z-50 border-b border-white/10 bg-[#070718]/88 backdrop-blur-2xl'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        <FeiXiangSmartLink href='/' className='flex items-center gap-3'>
          <LogoMark />
          <span className='flex flex-col leading-none'>
            <strong className='text-base font-black tracking-tight text-white'>{BRAND}</strong>
            <span className='mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-pink-200/70'>AI Gateway</span>
          </span>
        </FeiXiangSmartLink>
        <nav className='hidden items-center gap-8 md:flex'>
          {nav.map(([label, href]) => {
            const active = isActive(href)

            return (
              <FeiXiangSmartLink
                key={href}
                href={href}
                className={cx(
                  'relative py-5 text-sm font-semibold transition-colors hover:text-white',
                  active
                    ? 'text-pink-300 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-gradient-to-r after:from-pink-400 after:to-orange-400'
                    : 'text-white/72',
                )}
              >
                {label}
              </FeiXiangSmartLink>
            )
          })}
        </nav>
        <div className='hidden items-center gap-3 sm:flex'>
          <FeiXiangSmartLink href='/sign-in' className='rounded-xl border border-white/12 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/24 hover:bg-white/[0.05] hover:text-white'>登录</FeiXiangSmartLink>
          <FeiXiangSmartLink href='/dashboard' className='rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-5 py-2.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(244,63,94,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(249,115,22,0.24)]'>进入控制台</FeiXiangSmartLink>
        </div>
        <button
          type='button'
          onClick={() => setOpen((value) => !value)}
          className='inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white md:hidden'
          aria-expanded={open}
          aria-label='打开导航菜单'
        >
          <GridIcon className='h-5 w-5' />
        </button>
      </div>
      {open && (
        <div className='border-t border-white/10 bg-[#09091d] px-4 py-4 md:hidden'>
          <div className='grid gap-2'>
            {nav.map(([label, href]) => (
              <FeiXiangSmartLink
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cx(
                  'rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold',
                  isActive(href) ? 'text-pink-200' : 'text-white/80',
                )}
              >
                {label}
              </FeiXiangSmartLink>
            ))}
            <FeiXiangSmartLink href='/dashboard' onClick={() => setOpen(false)} className='rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-4 py-3 text-center text-sm font-black text-white'>进入控制台</FeiXiangSmartLink>
          </div>
        </div>
      )}
    </header>
  )
}


function Footer() {
  return (
    <footer className='border-t border-white/10 bg-[#070718]'>
      <div className='mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8'>
        <div>
          <div className='flex items-center gap-3'><LogoMark /><strong className='text-lg text-white'>{BRAND}</strong></div>
          <p className='mt-4 max-w-sm text-sm leading-7 text-white/50'>稳定、快速、开放的 AI API 服务平台，让 AI 能力触手可及。</p>
        </div>
        <FooterLinks title='产品' links={[['模型广场', '/pricing'], ['控制台', '/dashboard']]} />
        <FooterLinks title='开发者' links={[['帮助文档', '/docs'], ['快速开始', '/docs'], ['API 状态', '/docs']]} />
        <FooterLinks title='关于我们' links={[['关于', '/about'], ['用户协议', '/user-agreement'], ['隐私政策', '/privacy-policy']]} />
      </div>
      <div className='mx-auto flex max-w-7xl flex-col gap-2 border-t border-white/10 px-4 py-6 text-xs text-white/40 sm:px-6 md:flex-row md:justify-between lg:px-8'>
        <span>© 2026 Feixiang API. All rights reserved.</span>
        <a href='https://beian.miit.gov.cn/' target='_blank' rel='noreferrer' className='hover:text-white/70'>粤ICP备2026061427号</a>
      </div>
    </footer>
  )
}

function FooterLinks({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h3 className='text-sm font-black text-white'>{title}</h3>
      <div className='mt-4 grid gap-3'>
        {links.map(([label, href]) => (
          <FeiXiangSmartLink key={`${label}-${href}`} href={href} className='text-sm text-white/48 transition hover:text-pink-200'>
            {label}
          </FeiXiangSmartLink>
        ))}
      </div>
    </div>
  )
}

const FeiXiangPublicShellContext = createContext(false)

export function FeiXiangPublicLayout({ children }: { children: ReactNode }) {
  return (
    <FeiXiangPublicShellContext.Provider value={true}>
      <main className='relative isolate min-h-screen overflow-x-hidden bg-[#080819] text-white'>
        <div className='pointer-events-none fixed inset-0 z-0'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.20),transparent_34%),radial-gradient(circle_at_15%_35%,rgba(244,63,94,0.14),transparent_28%),radial-gradient(circle_at_85%_55%,rgba(249,115,22,0.12),transparent_30%)]' />
          <div className='absolute inset-0 opacity-[0.065]' style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
          <div className='absolute left-1/2 top-24 h-[1px] w-[90vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-pink-400/45 to-transparent blur-[1px]' />
        </div>
        <div className='relative z-10 flex min-h-screen flex-col'>
          <Header />
          <div className='min-h-0 flex-1'>
            {children}
          </div>
          <Footer />
        </div>
      </main>
    </FeiXiangPublicShellContext.Provider>
  )
}

function PageShell({ children }: { children: ReactNode }) {
  const insidePublicLayout = useContext(FeiXiangPublicShellContext)

  if (insidePublicLayout) {
    return <>{children}</>
  }

  return <FeiXiangPublicLayout>{children}</FeiXiangPublicLayout>
}


function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-2 rounded-full border border-pink-300/18 bg-pink-400/10 px-4 py-2 text-xs font-black text-pink-100', className)}>{children}</span>
}

function GradientText({ children }: { children: ReactNode }) {
  return <span className='bg-gradient-to-r from-pink-400 via-fuchsia-300 to-orange-300 bg-clip-text text-transparent'>{children}</span>
}

function MetricCard({ icon, value, label, desc, tone }: { icon: ReactNode; value: string; label: string; desc: string; tone: Tone }) {
  const color = {
    pink: 'from-pink-500/24 to-pink-500/4 border-pink-300/20 text-pink-200',
    orange: 'from-orange-500/24 to-orange-500/4 border-orange-300/20 text-orange-200',
    purple: 'from-purple-500/24 to-purple-500/4 border-purple-300/20 text-purple-200',
    cyan: 'from-cyan-500/24 to-cyan-500/4 border-cyan-300/20 text-cyan-200',
    green: 'from-emerald-500/24 to-emerald-500/4 border-emerald-300/20 text-emerald-200',
  }[tone]

  return (
    <div className={cx('group rounded-[26px] border bg-gradient-to-br p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.055]', color)}>
      <div className='mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-current/25 bg-white/[0.06]'>{icon}</div>
      <div className='text-3xl font-black text-white'>{value}</div>
      <div className='mt-1 text-base font-black text-white'>{label}</div>
      <p className='mt-2 text-sm leading-6 text-white/46'>{desc}</p>
    </div>
  )
}

function Hero() {
  return (
    <section className='mx-auto max-w-7xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-20 lg:px-8'>
      <Badge className='mb-7'><SparklesIcon className='h-4 w-4' /> 新一代 AI API 基础设施</Badge>
      <h1 className='text-6xl font-black tracking-tight sm:text-7xl lg:text-8xl'><GradientText>FeiXiangApi</GradientText></h1>
      <h2 className='mt-6 text-3xl font-black tracking-[0.25em] text-white sm:text-4xl'>稳定 ・ 快速 ・ 开放的 AI API 服务</h2>
      <p className='mx-auto mt-6 max-w-3xl text-base leading-8 text-white/58 sm:text-lg'>聚合主流优质模型与工具，统一的 API 接口，稳定可靠的服务体验，让 AI 能力轻松集成到你的产品中。</p>
      <div className='mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row'>
        <a href='#quick-start' className='inline-flex min-w-44 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-3.5 text-sm font-black text-white shadow-[0_16px_40px_rgba(244,63,94,0.26)] transition hover:-translate-y-0.5'>开始接入 <ArrowIcon className='h-4 w-4' /></a>
        <FeiXiangSmartLink href='/docs' className='inline-flex min-w-44 items-center justify-center gap-2 rounded-xl border border-white/14 bg-white/[0.035] px-6 py-3.5 text-sm font-black text-white/85 transition hover:border-white/24 hover:bg-white/[0.065]'><BookIcon className='h-4 w-4' />查看文档</FeiXiangSmartLink>
      </div>
      <div className='mt-10 grid gap-4 md:grid-cols-4'>
        <MetricCard icon={<TerminalIcon className='h-6 w-6' />} value='1.02s' label='极速响应' desc='平均响应时间，稳定体验' tone='pink' />
        <MetricCard icon={<ShieldIcon className='h-6 w-6' />} value='99.95%' label='服务可用性' desc='企业级 SLA 保障' tone='orange' />
        <MetricCard icon={<PackageIcon className='h-6 w-6' />} value='80+' label='支持模型' desc='持续接入优质模型' tone='purple' />
        <MetricCard icon={<CloudIcon className='h-6 w-6' />} value='20亿+' label='累计请求次数' desc='海量请求，稳定支撑' tone='cyan' />
      </div>
    </section>
  )
}

function NodeLogo({ node, active }: { node: WorkflowNode; active?: boolean }) {
  return (
    <span
      className={cx(
        'workflow-generated-icon relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border bg-[#10101f] transition-all duration-300',
        active
          ? 'border-pink-200/35 shadow-[0_0_24px_rgba(244,114,182,0.22)]'
          : 'border-white/12 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]',
      )}
    >
      {node.logo ? (
        <img
          src={node.logo}
          alt=''
          className='h-full w-full rounded-[16px] object-cover'
          loading='lazy'
          decoding='async'
        />
      ) : (
        <span className='relative z-10 text-white/82'>{node.icon}</span>
      )}
    </span>
  )
}

function WorkflowNodeCard({ node, active }: { node: WorkflowNode; active?: boolean }) {
  return (
    <div
      className={cx(
        'workflow-generated-card group flex min-h-[76px] items-center justify-center gap-3 rounded-[22px] border px-4 py-4 text-center transition-all duration-300 hover:-translate-y-1',
        'border-white/12 bg-white/[0.045] text-white/88',
        active && 'scale-[1.02] border-pink-300/28 bg-white/[0.075] text-white shadow-[0_18px_48px_rgba(0,0,0,0.22)]',
      )}
    >
      <NodeLogo node={node} active={active} />
      <span className='text-sm font-black leading-tight'>{node.name}</span>
    </div>
  )
}

function WorkflowShowcase() {
  const [activeStep, setActiveStep] = useState(0)
  const [paused, setPaused] = useState(false)

  const steps: WorkflowStep[] = [
    { title: '选择上游模型', desc: '在 OpenAI、Claude、Gemini、MiniMax、DeepSeek 和更多模型里确认目标能力。', icon: <SparklesIcon className='h-5 w-5' /> },
    { title: '通过 CC Switch 统一配置', desc: '把 Base URL、模型和 API Key 收拢到 CC Switch，少写配置少出错。', icon: <CloudIcon className='h-5 w-5' /> },
    { title: '连接开发客户端', desc: 'Codex、Claude Code、Gemini、OpenCode、OpenClaw、Hermes 等工具即可开始调用。', icon: <TerminalIcon className='h-5 w-5' /> },
  ]

  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => {
      setActiveStep((value) => (value + 1) % steps.length)
    }, 2600)
    return () => window.clearInterval(timer)
  }, [paused, steps.length])

  const modelNodes: WorkflowNode[] = [
    { name: 'OpenAI', logo: '/images/llm-logos/openai.webp?v=16110', icon: <SparklesIcon className='h-4 w-4' />, tone: 'cyan' },
    { name: 'Claude', logo: '/images/llm-logos/claude.webp?v=16110', icon: <SparklesIcon className='h-4 w-4' />, tone: 'orange' },
    { name: 'Gemini', logo: '/images/llm-logos/google-gemini.webp?v=16110', icon: <SparklesIcon className='h-4 w-4' />, tone: 'green' },
    { name: 'MiniMax', logo: '/images/llm-logos/minimax.webp?v=16110', icon: <SparklesIcon className='h-4 w-4' />, tone: 'cyan' },
    { name: 'DeepSeek', logo: '/images/llm-logos/deepseek.webp?v=16110', icon: <SparklesIcon className='h-4 w-4' />, tone: 'green' },
    { name: '更多模型', icon: <SparklesIcon className='h-4 w-4' />, tone: 'orange' },
  ]

  const clientNodes: WorkflowNode[] = [
    { name: 'Codex', logo: '/images/tool-logos/codex.webp?v=16110', icon: <TerminalIcon className='h-4 w-4' />, tone: 'cyan' },
    { name: 'Claude Code', logo: '/images/tool-logos/claude-code.webp?v=16110', icon: <CodeIcon className='h-4 w-4' />, tone: 'orange' },
    { name: 'Gemini', logo: '/images/llm-logos/google-gemini.webp?v=16110', icon: <SparklesIcon className='h-4 w-4' />, tone: 'green' },
    { name: 'OpenCode', logo: '/images/tool-logos/opencode.webp?v=16110', icon: <TerminalIcon className='h-4 w-4' />, tone: 'cyan' },
    { name: 'OpenClaw', logo: '/images/tool-logos/openclaw.webp?v=16110', icon: <GridIcon className='h-4 w-4' />, tone: 'green' },
    { name: 'Hermes', logo: '/images/tool-logos/hermes.webp?v=16110', icon: <CloudIcon className='h-4 w-4' />, tone: 'orange' },
  ]

  return (
    <section id='quick-start' className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <div className='rounded-[32px] border border-white/12 bg-white/[0.035] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:p-7'>
        <div className='flex items-center gap-3 border-b border-white/10 pb-5'>
          <span className='h-3 w-3 rounded-full bg-pink-400' /><span className='h-3 w-3 rounded-full bg-orange-300' /><span className='h-3 w-3 rounded-full bg-purple-400' />
          <strong className='ml-2 text-sm font-black text-white'>如何在 3 分钟内完成 FeiXiangApi 接入？</strong>
          <span className='ml-auto hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/55 sm:inline-flex'>
            <span className={cx('h-2 w-2 rounded-full transition-all', paused ? 'bg-white/35' : 'animate-pulse bg-emerald-300')} />
            {paused ? '已暂停' : '自动轮巡'}
          </span>
        </div>
        <div className='grid gap-6 pt-6 lg:grid-cols-[0.9fr_1.1fr]'>
          <div
            className='rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6'
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <div className='mb-5 flex items-center justify-between'>
              <span className='inline-flex items-center gap-2 text-sm font-black text-emerald-200'><CheckIcon className='h-4 w-4' />接入路径已准备好</span>
              <span className='rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-100'>完成</span>
            </div>
            <ol className='grid gap-3' role='tablist' aria-label='接入步骤'>
              {steps.map((step, index) => {
                const active = activeStep === index
                return (
                  <li key={step.title}>
                    <button
                      type='button'
                      role='tab'
                      aria-selected={active}
                      onMouseEnter={() => setActiveStep(index)}
                      onFocus={() => setActiveStep(index)}
                      onClick={() => setActiveStep(index)}
                      className={cx('group relative flex w-full items-center gap-4 overflow-hidden rounded-[24px] border px-4 py-4 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-400/30', active ? 'border-pink-300/35 bg-gradient-to-r from-pink-400/[0.14] to-orange-400/[0.06] shadow-[0_16px_46px_rgba(244,63,94,0.12)]' : 'border-white/10 bg-white/[0.018] hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.04]')}
                    >
                      {active && <span className='absolute inset-y-4 left-0 w-1 rounded-full bg-gradient-to-b from-pink-400 to-orange-400' />}
                      <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-white transition-all', active ? 'bg-gradient-to-br from-pink-500 to-orange-400 shadow-[0_0_24px_rgba(244,63,94,0.35)]' : 'bg-white/[0.08]')}>{String(index + 1).padStart(2, '0')}</span>
                      <span className='min-w-0 flex-1'>
                        <strong className={cx('block text-base font-black transition-colors', active ? 'text-white' : 'text-white/85')}>{step.title}</strong>
                        <small className={cx('mt-1 block text-sm leading-6 transition-colors', active ? 'text-white/64' : 'text-white/42')}>{step.desc}</small>
                      </span>
                      <span className={cx('hidden h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all sm:flex', active ? 'bg-white/[0.10] text-pink-100' : 'text-white/40 group-hover:text-white/70')}>{step.icon}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
            <div className='mt-4 flex items-center justify-center gap-2 sm:justify-start'>
              {steps.map((step, index) => (
                <button
                  key={step.title + '-dot'}
                  type='button'
                  aria-label={`切换到步骤 ${index + 1}`}
                  onClick={() => setActiveStep(index)}
                  className={cx('h-2.5 rounded-full transition-all duration-300', activeStep === index ? 'w-8 bg-gradient-to-r from-pink-500 to-orange-400' : 'w-2.5 bg-white/20 hover:bg-white/40')}
                />
              ))}
            </div>
          </div>

          <div className='rounded-[28px] border border-white/10 bg-[#09091d]/70 p-5 sm:p-6'>
            <div className='grid gap-3 sm:grid-cols-3'>
              {modelNodes.map((node) => <WorkflowNodeCard key={node.name} node={node} active={activeStep === 0} />)}
            </div>
            <div className={cx('mx-auto my-5 h-20 w-px border-l border-dashed transition-colors duration-300', activeStep === 1 ? 'border-orange-300/45' : 'border-pink-300/25')} />
            <div className={cx('mx-auto flex w-fit items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-black text-white shadow-[0_18px_44px_rgba(244,63,94,0.24)] transition-all duration-300 hover:-translate-y-0.5', activeStep === 1 ? 'scale-[1.04] bg-gradient-to-r from-pink-500 to-orange-400' : 'bg-gradient-to-r from-pink-500/85 to-orange-400/85 opacity-85')}>
              <CloudIcon className='h-4 w-4' /> CC Switch
            </div>
            <div className={cx('mx-auto my-5 h-20 w-px border-l border-dashed transition-colors duration-300', activeStep === 1 ? 'border-orange-300/45' : 'border-pink-300/25')} />
            <div className='grid gap-3 sm:grid-cols-3'>
              {clientNodes.map((node) => <WorkflowNodeCard key={node.name} node={node} active={activeStep === 2} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function QuickConfigSection() {
  return (
    <section className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <div className='grid gap-6 rounded-[32px] border border-white/12 bg-white/[0.035] p-6 sm:p-8 lg:grid-cols-[0.85fr_1.15fr]'>
        <div>
          <Badge className='mb-6'>接入方式</Badge>
          <h2 className='text-5xl font-black tracking-tight sm:text-6xl'><GradientText>CC Switch</GradientText><br />一键配置</h2>
          <p className='mt-5 max-w-xl text-base leading-8 text-white/55'>创建令牌后，将 Base URL、模型和 API Key 导入 CC Switch；不支持一键配置的工具，也可以使用下方 Base URL 手动接入。</p>
          <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
            <FeiXiangSmartLink href='/console/token' className='inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5'>前往令牌页 <ArrowIcon className='h-4 w-4' /></FeiXiangSmartLink>
          </div>
        </div>
        <div className='grid gap-5'>
          <div className='rounded-[28px] border border-white/12 bg-white/[0.05] p-5'>
            <div className='mb-4 flex items-center justify-between'><span className='text-sm font-black text-white/62'>桌面端</span><em className='rounded-full bg-white/[0.08] px-3 py-1 text-xs font-black text-pink-100'>v3.16.3</em></div>
            <a href='https://github.com/farion1231/cc-switch/releases/download/v3.16.3/CC-Switch-v3.16.3-Windows.msi' target='_blank' rel='noreferrer' className='flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-pink-300/30 hover:bg-white/[0.075]'>
              <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400'><DownloadIcon className='h-6 w-6' /></span>
              <span className='flex-1'><strong className='block text-lg font-black text-white'>下载 CC Switch</strong><small className='text-sm text-white/48'>Windows · MSI 安装包 · 15.3 MB</small></span>
              <DownloadIcon className='h-6 w-6 text-white/55' />
            </a>
            <div className='mt-4'><span className='text-sm font-black text-white/52'>其他系统</span><div className='mt-3 flex flex-wrap gap-2'>
              {['macOS', 'Linux', '全部版本'].map((item) => <a key={item} href='https://github.com/farion1231/cc-switch/releases/tag/v3.16.3' target='_blank' rel='noreferrer' className='rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm font-semibold text-white/75 transition hover:border-white/20 hover:text-white'>{item}</a>)}
            </div></div>
          </div>
          <div className='rounded-[28px] border border-white/12 bg-white/[0.05] p-5'>
            <div className='mb-3 flex items-center justify-between'><span><strong className='block text-base font-black text-white'>手动 Base URL</strong><small className='text-sm text-white/45'>复制后在你的应用中配置</small></span><CopyButton value={BASE_URL} /></div>
            <code className='block overflow-x-auto rounded-2xl bg-black/35 px-5 py-4 text-sm font-black text-white'>{BASE_URL}</code>
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  const [open, setOpen] = useState(0)
  const items = [
    ['FeiXiangApi 如何收费？', '我们支持按量充值，也提供周卡、月卡套餐；你可以根据真实使用频率和预算灵活选择。'],
    ['这些服务可以在哪些工具和场景中使用？', '可以在 Codex（App、CLI、Cursor 插件、VS Code 插件等）、Claude Code（App、CLI、IDE 插件）、OpenCodex、OpenClaw、Hermes，以及任何支持 OpenAI API 和 Base URL 配置的软件或框架中使用，例如 LangChain、LangGraph 等。'],
    ['目前支持哪些模型？', '当前支持 gpt-5.5、gpt-5.4、gpt-5.4-mini、gpt-5.2、claude-opus-4-7、claude-opus-4-6、claude-sonnet-4-6。我们承诺全部为满血模型，智能水平、思考深度和上下文窗口与官方保持一致；支持使用第三方开源工具进行检测，如发现降智可全额退款。'],
    ['是否支持生图模型？', '有，生图模型已支持。具体模型与调用细节会在后续补充。'],
    ['个人用户是否可以先试用再充值？', '可以。个人用户注册后会赠送 2 美元额度，适合先完成接入和小规模测试；实验室、机构或企业可以加入 QQ 群联系群主获取支持。'],
  ]
  return (
    <section className='mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 lg:px-8'>
      <Badge className='mb-5'>FAQ</Badge>
      <h2 className='text-5xl font-black sm:text-6xl'><GradientText>常见问题</GradientText></h2>
      <p className='mx-auto mt-4 max-w-2xl text-white/55'>更多技术问题请参阅帮助文档，或进入社群寻求帮助。</p>
      <div className='mt-10 grid gap-3 text-left'>
        {items.map(([q, a], index) => {
          const active = open === index
          return (
            <button key={q} type='button' onClick={() => setOpen(active ? -1 : index)} className='rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left transition hover:border-pink-300/22 hover:bg-white/[0.05]'>
              <div className='flex items-center gap-4'><span className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-orange-400 text-sm font-black'>{index + 1}</span><strong className='flex-1 text-base font-black text-white'>{q}</strong><span className='text-xl text-white/50'>{active ? '−' : '+'}</span></div>
              {active && <p className='mt-4 pl-12 text-sm leading-7 text-white/52'>{a}</p>}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function CommunitySection() {
  return (
    <section className='mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
      <div className='grid gap-8 rounded-[32px] border border-white/12 bg-white/[0.035] p-6 sm:p-8 lg:grid-cols-[1.05fr_1fr]'>
        <div>
          <Badge className='mb-6'><UsersIcon className='h-4 w-4' />社区支持</Badge>
          <h2 className='text-5xl font-black leading-tight sm:text-6xl'><GradientText>加入 QQ / Telegram 社区</GradientText><br />与开发者一起成长</h2>
          <p className='mt-5 max-w-2xl text-base leading-8 text-white/55'>获取最新产品动态、技术支持、接入指导和专属优惠，与开发者和合作伙伴共同交流。</p>
          <div className='mt-7 grid gap-3 sm:grid-cols-2'>
            {['技术问答', '产品更新', '专属福利', '同行交流'].map((item) => <div key={item} className='rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4'><strong className='text-white'>{item}</strong><p className='mt-1 text-sm text-white/42'>及时获取信息</p></div>)}
          </div>
        </div>
        <div className='flex justify-center lg:justify-end'>
          <div className='w-full max-w-[360px]'>
            <CommunityCard
              title='飞象api学习交流群'
              subtitle={`群号：${QQ_GROUP}`}
              value={QQ_GROUP}
              copyLabel='复制 QQ 群号'
              tone='purple'
              qrSrc='/images/qq-group-qr.png'
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function CommunityCard({ title, subtitle, value, copyLabel, tone, qrSrc }: { title: string; subtitle: string; value: string; copyLabel: string; tone: 'purple' | 'orange'; qrSrc?: string }) {
  return (
    <div className={cx('rounded-[30px] border p-6 text-center', tone === 'purple' ? 'border-purple-300/20 bg-purple-500/18' : 'border-orange-300/20 bg-orange-500/16')}>
      <div className='mx-auto flex min-h-[108px] max-w-[260px] flex-col items-center justify-start'>
        <h3 className='text-2xl font-black leading-tight text-white sm:text-[2rem]'>{title}</h3>
        <p className='mt-3 text-sm leading-6 text-white/50'>{subtitle}</p>
      </div>
      <div className='mx-auto mt-4 flex h-40 w-40 items-center justify-center rounded-[28px] bg-white p-3'>
        {qrSrc ? (
          <img
            src={qrSrc}
            alt={`${title}二维码`}
            className='h-full w-full rounded-[22px] object-contain'
            loading='lazy'
            decoding='async'
          />
        ) : (
          <GridIcon className='h-12 w-12 text-slate-950' />
        )}
      </div>
      <p className='mx-auto mt-5 max-w-xs text-sm leading-7 text-white/52'>复制后加入社群，获取产品动态和技术支持。</p>
      <CopyButton value={value} label={copyLabel} copiedLabel='已复制' className='mt-5 w-full border-0 bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-[0_14px_34px_rgba(244,63,94,0.22)] hover:from-pink-400 hover:to-orange-300' />
    </div>
  )
}

export function FeiXiangHomePage() {
  return (
    <PageShell><FeiXiangNavActiveRouteFix />
      <Hero />
      <WorkflowShowcase />
      <QuickConfigSection />
      <FaqSection />
      <CommunitySection />
    </PageShell>
  )
}

export function FeiXiangModelPage() {
  return (
    <PageShell><FeiXiangNavActiveRouteFix />
      <section className='mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8'>
        <Badge>Model Access</Badge>
        <h1 className='mt-6 text-5xl font-black'><GradientText>模型广场</GradientText></h1>
        <p className='mt-4 max-w-2xl text-white/55'>统一接入主流模型，按业务场景选择能力。</p>
        <div className='mt-10 grid gap-4 md:grid-cols-3'>{['OpenAI', 'Claude', 'Gemini', 'DeepSeek', 'Qwen', 'MiniMax'].map((m) => <div key={m} className='rounded-3xl border border-white/10 bg-white/[0.04] p-6'><strong className='text-xl'>{m}</strong><p className='mt-2 text-sm text-white/48'>可在控制台配置渠道和分组。</p></div>)}</div>
      </section>
    </PageShell>
  )
}
export const FeiXiangModelsPage = FeiXiangModelPage

export function FeiXiangDocsPage() {
  return (
    <PageShell><FeiXiangNavActiveRouteFix /><FeiXiangDocsFullSourceToTsx /></PageShell>
  )
}
const FEIXIANG_PUBLIC_SUPPORT_EMAIL = 'c.james.suo@gmail.com'
const FEIXIANG_PUBLIC_LEGAL_UPDATED_AT = '2026-06-23'

type FeiXiangStaticLegalSection = {
  title: string
  paragraphs?: string[]
  items?: string[]
  note?: string
}

function FeiXiangStaticPageHero({
  badge,
  title,
  subtitle,
  meta,
}: {
  badge: string
  title: string
  subtitle: string
  meta: Array<[string, string]>
}) {
  return (
    <section className='relative overflow-hidden rounded-[36px] border border-white/12 bg-white/[0.04] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:p-10 lg:p-12'>
      <div className='pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-pink-400/18 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-28 left-12 h-72 w-72 rounded-full bg-orange-400/12 blur-3xl' />
      <div className='relative'>
        <Badge>{badge}</Badge>
        <h1 className='mt-7 max-w-4xl text-5xl font-black leading-tight tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl'>
          <GradientText>{title}</GradientText>
        </h1>
        <p className='mt-6 max-w-3xl text-base leading-8 text-white/58 sm:text-lg'>{subtitle}</p>
        <div className='mt-8 grid gap-3 md:grid-cols-3'>
          {meta.map(([label, value]) => (
            <div key={label} className='rounded-2xl border border-white/10 bg-white/[0.04] p-4'>
              <div className='text-xs font-black uppercase tracking-[0.16em] text-white/35'>{label}</div>
              <div className='mt-2 break-words text-sm font-black leading-6 text-white'>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeiXiangStaticInfoCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className='rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:p-8'>
      <h2 className='text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl'>{title}</h2>
      <div className='mt-4 text-sm leading-8 text-white/62 sm:text-base'>{children}</div>
    </section>
  )
}

function FeiXiangSectionList({ sections }: { sections: FeiXiangStaticLegalSection[] }) {
  return (
    <div className='mt-6 grid gap-4'>
      {sections.map((section) => (
        <section key={section.title} className='rounded-[26px] border border-white/10 bg-white/[0.038] p-6 sm:p-7'>
          <h2 className='text-2xl font-black tracking-[-0.025em] text-white'>{section.title}</h2>
          <div className='mt-4 grid gap-3 text-sm leading-8 text-white/62 sm:text-[15px]'>
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.items && (
              <ul className='grid gap-2 pl-5'>
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
            {section.note && (
              <div className='rounded-2xl border border-orange-300/20 bg-orange-400/10 px-4 py-3 text-orange-50/82'>
                {section.note}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

function FeiXiangContactPanel() {
  return (
    <section className='mt-6 rounded-[30px] border border-cyan-200/18 bg-cyan-300/[0.055] p-6 sm:p-8'>
      <h2 className='text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl'>联系我们</h2>
      <p className='mt-4 max-w-3xl text-sm leading-8 text-white/62 sm:text-base'>
        如果你在账户、充值、模型调用、开发工具接入、文档配置、隐私请求或商务合作方面需要帮助，可以通过邮件联系我们。
      </p>
      <a
        href={`mailto:${FEIXIANG_PUBLIC_SUPPORT_EMAIL}`}
        className='mt-5 inline-flex max-w-full rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2.5 text-sm font-black text-cyan-100 break-all'
      >
        {FEIXIANG_PUBLIC_SUPPORT_EMAIL}
      </a>
    </section>
  )
}

const FEIXIANG_AGREEMENT_SECTIONS: FeiXiangStaticLegalSection[] = [
  {
    title: '一、协议接受',
    paragraphs: [
      '欢迎使用 FeiXiangApi。你访问、注册、登录或使用本平台提供的任何服务，即表示你已阅读、理解并同意遵守本用户协议。',
      '如你不同意本协议中的任何条款，请停止注册、访问或使用本服务。',
    ],
  },
  {
    title: '二、服务内容',
    paragraphs: [
      'FeiXiangApi 提供 AI API 聚合、接口转发、模型调用、开发者文档、控制台管理、用量统计、账户充值及相关技术支持服务。',
      '具体可用模型、接口、价格、额度、速率限制和功能范围，以平台实际展示、控制台配置和最新公告为准。',
    ],
  },
  {
    title: '三、账户与安全',
    items: [
      '你应保证注册信息真实、准确、合法、有效。',
      '你应妥善保管账号、密码、API Key、令牌等凭证，不得泄露、转让、出租或出借。',
      '因你主动泄露或保管不当导致的损失，由你自行承担。',
      '发现账号或 API Key 被盗用、异常调用或存在安全风险时，应立即停止使用并联系平台处理。',
    ],
  },
  {
    title: '四、使用规范',
    paragraphs: ['你承诺不会利用本服务从事违法、违规、侵权或损害第三方权益的活动，包括但不限于：'],
    items: [
      '生成、传播违反法律法规、公序良俗或平台规则的内容。',
      '攻击、扫描、绕过、破坏平台系统、模型服务、上游服务或第三方系统。',
      '批量注册、盗刷额度、滥用优惠、恶意并发或规避速率限制。',
      '未经授权处理他人个人信息、商业秘密、敏感数据或受保护内容。',
      '将本服务用于欺诈、垃圾信息、恶意软件、钓鱼、侵犯知识产权等场景。',
    ],
  },
  {
    title: '五、计费、充值与退款',
    items: [
      '平台可能按照模型、接口、token、请求次数、套餐、周期或其他规则计费。',
      '充值、套餐、赠送额度、有效期和消耗规则以控制台展示为准。',
      '因上游模型价格、汇率、服务成本或业务策略变化，平台可能调整价格或套餐规则。',
      '如发生计费异常、重复扣费或服务不可用导致的争议，你可以联系平台核查处理。',
    ],
    note: '涉及退款、补偿或争议处理的具体结果，以平台核查记录和双方沟通结果为准。',
  },
  {
    title: '六、服务变更、中断与终止',
    paragraphs: [
      '平台会尽力保障服务连续性，但不承诺服务永久无中断。因维护升级、网络故障、上游服务异常、不可抗力、政策调整、攻击事件或第三方原因导致的服务波动，平台将尽合理努力处理。',
      '若你违反本协议或平台规则，平台有权限制、暂停或终止你的账户、API Key、额度或服务访问权限。',
    ],
  },
  {
    title: '七、免责声明',
    items: [
      'AI 模型输出可能存在错误、不完整、延迟、偏差或不可用，你应自行判断并承担使用结果。',
      '你不得将模型输出作为医疗、法律、金融、投资、安全生产等高风险场景中的唯一依据。',
      '第三方模型、上游接口、网络环境、支付渠道或外部工具导致的问题，不完全由平台控制。',
    ],
  },
]

const FEIXIANG_PRIVACY_SECTIONS: FeiXiangStaticLegalSection[] = [
  {
    title: '一、适用范围',
    paragraphs: [
      '本隐私政策适用于你访问、注册、登录、调用或使用 FeiXiangApi 相关网站、控制台、API、文档和技术支持服务时涉及的信息处理活动。',
      '本政策说明我们如何收集、使用、存储、保护和处理你的信息。',
    ],
  },
  {
    title: '二、我们可能收集的信息',
    items: [
      '账户信息：例如账号标识、登录信息、联系方式、账户状态、角色权限。',
      'API 使用信息：例如请求时间、接口路径、模型名称、状态码、消耗额度、调用量、错误日志。',
      '支付与订单信息：例如订单号、支付状态、充值金额、套餐类型、交易时间。',
      '设备与网络信息：例如 IP 地址、浏览器类型、操作系统、访问时间、页面路径和安全日志。',
      '沟通信息：当你通过邮件或社群寻求支持时，我们可能处理你主动提供的问题描述、截图或联系方式。',
    ],
  },
  {
    title: '三、API 请求与模型数据',
    paragraphs: [
      '为完成接口转发、模型调用、故障排查、计费统计和安全风控，我们可能处理与 API 请求相关的必要技术信息。',
      '请不要在请求中提交你无权处理的个人信息、敏感信息、商业秘密或第三方受保护内容。你应对通过 API 提交的数据来源、授权和合法性负责。',
    ],
    note: '平台会尽合理努力限制日志中的敏感信息暴露，并建议用户在业务侧主动脱敏、最小化提交内容。',
  },
  {
    title: '四、信息使用目的',
    items: [
      '提供、维护、优化和改进平台服务。',
      '完成身份验证、API 鉴权、额度扣减、账单统计和订单处理。',
      '进行故障排查、风控审计、安全防护和异常检测。',
      '回复用户咨询、处理争议、发送必要服务通知。',
      '满足适用法律法规、监管要求或合规义务。',
    ],
  },
  {
    title: '五、信息共享与第三方服务',
    paragraphs: [
      '为提供模型调用、支付、统计、安全防护和基础设施服务，我们可能使用第三方服务商。我们只会在实现服务所必需的范围内共享必要信息。',
      '除法律法规要求、获得你的授权、保护平台与用户合法权益或完成服务所必需外，我们不会主动出售你的个人信息。',
    ],
  },
  {
    title: '六、信息存储与保留',
    paragraphs: [
      '我们会在实现本政策所述目的所需的期限内保存相关信息。不同类型数据的保留期限可能因安全、审计、计费、争议处理、法律要求或技术备份需要而不同。',
      '当信息不再必要时，我们会根据实际情况删除、匿名化或进行合理限制处理。',
    ],
  },
  {
    title: '七、信息安全',
    items: [
      '采用访问控制、权限隔离、日志审计、传输加密等措施保护数据安全。',
      '限制内部人员访问敏感数据的范围。',
      '建议用户妥善保管 API Key，并定期轮换密钥。',
      '如发现账号、令牌或调用异常，应及时停用相关 Key 并联系平台。',
    ],
  },
  {
    title: '八、你的权利',
    paragraphs: [
      '在适用法律允许的范围内，你可以请求访问、更正、删除、导出或限制处理你的相关信息，也可以注销账户或停止使用服务。',
      '为保护账户安全，我们可能需要验证你的身份后再处理相关请求。',
    ],
  },
]

export function FeiXiangAboutPage() {
  const capabilityCards = [
    ['统一 API 网关', '统一 Base URL、API Key、模型名称与接口入口，减少多平台切换成本。'],
    ['开发工具接入', '支持编辑器、CLI、桌面客户端、自动化工具和 SDK 调用场景。'],
    ['模型能力聚合', '面向文本、代码、多模态、视频生成等场景持续接入优质模型。'],
    ['用量与密钥管理', '通过控制台管理令牌、额度、分组、模型权限和调用记录。'],
  ]

  return (
    <PageShell><FeiXiangNavActiveRouteFix />
      <section className='mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8'>
        <FeiXiangStaticPageHero
          badge='About'
          title='关于 FeiXiangApi'
          subtitle='FeiXiangApi 面向开发者、团队与企业，提供统一的 AI API 接入、模型转发、开发工具配置、用量管理与技术支持，让 AI 能力像基础设施一样稳定可用。'
          meta={[
            ['品牌名称', 'FeiXiangApi'],
            ['服务定位', '统一 AI API 网关'],
            ['联系邮箱', FEIXIANG_PUBLIC_SUPPORT_EMAIL],
          ]}
        />

        <div className='mt-6 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]'>
          <FeiXiangStaticInfoCard title='我们是谁'>
            <p>FeiXiangApi 是一个面向 AI 开发者的 API 网关服务。平台聚焦于模型接入、接口兼容、工具配置与服务稳定性，帮助用户更快完成从测试、集成到生产调用的全过程。</p>
            <p className='mt-4'>不论你是在接入 Cursor、Claude Code、Cline、Continue、Aider、OpenClaw，还是直接使用 OpenAI Compatible、Gemini API 等接口，FeiXiangApi 都希望提供清晰、稳定、易复制的接入体验。</p>
          </FeiXiangStaticInfoCard>

          <FeiXiangStaticInfoCard title='核心能力'>
            <div className='grid gap-3 sm:grid-cols-2'>
              {capabilityCards.map(([title, desc]) => (
                <div key={title} className='rounded-2xl border border-white/10 bg-white/[0.04] p-4'>
                  <strong className='block text-white'>{title}</strong>
                  <span className='mt-2 block text-sm leading-6 text-white/48'>{desc}</span>
                </div>
              ))}
            </div>
          </FeiXiangStaticInfoCard>
        </div>

        <div className='mt-5 grid gap-5 lg:grid-cols-2'>
          <FeiXiangStaticInfoCard title='服务原则'>
            <ul className='grid gap-2 pl-5'>
              <li><strong className='text-white'>稳定优先：</strong>持续优化请求转发、错误处理和开发者接入体验。</li>
              <li><strong className='text-white'>配置清晰：</strong>让 Base URL、API Key、模型名、代码示例都可直接复制使用。</li>
              <li><strong className='text-white'>安全可控：</strong>提醒用户保护 API Key，并持续完善账户与用量管理能力。</li>
              <li><strong className='text-white'>持续迭代：</strong>根据用户反馈改进文档、控制台、支付、模型和工具适配。</li>
            </ul>
          </FeiXiangStaticInfoCard>

          <FeiXiangStaticInfoCard title='接入流程'>
            <div className='grid gap-3'>
              {[
                ['01', '注册并创建 API Key', '进入控制台创建令牌，按模型分组和使用场景配置权限。'],
                ['02', '选择工具或接口', '按文档选择 Cursor、Claude Code、OpenAI API、Gemini API、OpenClaw 等接入方式。'],
                ['03', '复制配置并验证', '填写 Base URL、API Key 和模型名，执行测试请求确认链路正常。'],
              ].map(([index, title, desc]) => (
                <div key={index} className='grid grid-cols-[44px_minmax(0,1fr)] gap-3'>
                  <span className='flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 text-sm font-black text-white'>{index}</span>
                  <span className='rounded-2xl border border-white/10 bg-white/[0.04] p-4'>
                    <strong className='block text-white'>{title}</strong>
                    <small className='mt-1 block text-sm leading-6 text-white/48'>{desc}</small>
                  </span>
                </div>
              ))}
            </div>
          </FeiXiangStaticInfoCard>
        </div>

        <FeiXiangContactPanel />
      </section>
    </PageShell>
  )
}

function FeiXiangLegalContentPage({ kind }: { kind: 'agreement' | 'privacy' }) {
  const isPrivacy = kind === 'privacy'
  const title = isPrivacy ? '隐私政策' : '用户协议'
  const subtitle = isPrivacy
    ? 'FeiXiangApi 尊重并保护用户隐私。本政策说明我们在提供 AI API、控制台、文档和技术支持服务过程中如何处理相关信息。'
    : '本协议用于明确你与 FeiXiangApi 之间关于账户注册、API 调用、模型转发、充值计费、使用规范和责任边界等事项。'

  return (
    <PageShell><FeiXiangNavActiveRouteFix />
      <section className='mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8'>
        <FeiXiangStaticPageHero
          badge={isPrivacy ? 'Privacy' : 'Terms'}
          title={title}
          subtitle={subtitle}
          meta={[
            ['生效日期', FEIXIANG_PUBLIC_LEGAL_UPDATED_AT],
            ['适用产品', 'FeiXiangApi'],
            ['联系邮箱', FEIXIANG_PUBLIC_SUPPORT_EMAIL],
          ]}
        />
        <FeiXiangSectionList sections={isPrivacy ? FEIXIANG_PRIVACY_SECTIONS : FEIXIANG_AGREEMENT_SECTIONS} />
        <FeiXiangContactPanel />
      </section>
    </PageShell>
  )
}

export function FeiXiangUserAgreementPage() {
  return <FeiXiangLegalContentPage kind='agreement' />
}

export function FeiXiangPrivacyPolicyPage() {
  return <FeiXiangLegalContentPage kind='privacy' />
}

export function FeiXiangLegalPage() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const kind = pathname.includes('privacy') ? 'privacy' : 'agreement'
  return <FeiXiangLegalContentPage kind={kind} />
}
