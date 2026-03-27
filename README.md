# BMI MCP Server

一个基于 TypeScript 构建的自定义 MCP (Model Context Protocol) 服务器，提供 BMI 计算、体重单位转换和健康建议功能。

> 本项目是 MCP Server 开发的完整教程示例。

## 📋 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [API 参考](#api-参考)
- [完整教程：从零构建 MCP Server](#完整教程从零构建-mcp-server)
- [发布到 MCP Registry](#发布到-mcp-registry)
- [最佳实践](#最佳实践)
- [官方资源](#官方资源)

## 功能特性

### Tools (工具)

| 工具名 | 描述 |
|--------|------|
| `calculate-bmi` | 根据身高(m)和体重(kg)计算 BMI 值和分类 |
| `convert-weight` | 在千克(kg)和磅(lb)之间转换体重 |
| `get-bmi-recommendations` | 根据 BMI 值获取健康建议 |

### Resources (资源)

| 资源 URI | 描述 |
|----------|------|
| `bmi://categories` | BMI 分类参考表 |

### Prompts (提示)

| 提示名 | 描述 |
|--------|------|
| `analyze-bmi` | 生成 BMI 分析提示词 |

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm 或 yarn

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/opencode/bmi-mcp-server.git
cd bmi-mcp-server

# 2. 安装依赖
npm install

# 3. 直接运行（stdio 模式，用于 opencode 等客户端）
npx tsx src/server.ts
```

### 接入 OpenCode

在 OpenCode 配置文件中添加 MCP Server：

**全局配置** (`~/.config/opencode/opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["oh-my-opencode"],
  "mcpServers": {
    "bmi-mcp-server": {
      "command": "npx",
      "args": [
        "tsx",
        "/path/to/bmi-mcp-server/src/server.ts"
      ],
      "type": "stdio"
    }
  }
}
```

**项目配置** (`.opencode.json` in project root):

```json
{
  "mcpServers": {
    "bmi-mcp-server": {
      "command": "npx",
      "args": ["tsx", "./src/server.ts"],
      "type": "stdio"
    }
  }
}
```

配置完成后，重启 OpenCode 即可使用 BMI 计算工具。

## 项目结构

```
bmi-mcp-server/
├── src/
│   └── server.ts       # 主服务文件（stdio 模式，Tools/Resources/Prompts 定义）
├── dist/                # 编译输出目录
├── package.json         # npm 包配置
├── tsconfig.json        # TypeScript 配置
├── server.json          # MCP Registry 元数据
├── .gitignore           # Git 忽略配置
└── README.md            # 项目文档
```

> **注意**: 本项目使用 **stdio 传输模式**（而非 HTTP），适用于与 OpenCode、Claude Desktop 等 MCP 客户端集成。

## API 参考

### Tool: calculate-bmi

计算身体质量指数 (BMI)。

**输入参数:**

```json
{
  "weightKg": 70,      // 体重（千克）
  "heightM": 1.75      // 身高（米）
}
```

**输出:**

```json
{
  "bmi": 22.86,
  "category": "Normal weight"
}
```

### Tool: convert-weight

在千克和磅之间转换体重。

**输入参数:**

```json
{
  "value": 150,
  "fromUnit": "lb",
  "toUnit": "kg"
}
```

**输出:**

```json
{
  "originalValue": 150,
  "originalUnit": "lb",
  "convertedValue": 68.04,
  "convertedUnit": "kg"
}
```

### Tool: get-bmi-recommendations

根据 BMI 值获取健康建议。

**输入参数:**

```json
{
  "bmi": 28.5
}
```

**输出:**

```json
{
  "category": "Overweight",
  "recommendations": [
    "Aim for gradual weight loss (0.5-1 kg per week)",
    "Increase physical activity to 200+ minutes per week",
    "Focus on whole foods, reduce processed food intake",
    "Monitor portion sizes and practice mindful eating"
  ]
}
```

---

# 完整教程：从零构建 MCP Server

## 第一部分：理解 MCP 生态

### 什么是 MCP？

MCP (Model Context Protocol) 是一个开放协议，为 LLM 应用与外部数据源/工具之间提供标准化的连接方式。类似于 USB-C 为设备提供了标准化的连接接口，MCP 为 AI 模型提供了标准化的方式来连接不同的数据源和工具。

### 核心组件

```
┌─────────────────────────────────────────────────────────────┐
│                        MCP 生态                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐      MCP Protocol      ┌─────────────┐    │
│  │             │  ◄──────────────────►  │             │    │
│  │  MCP Client │                         │  MCP Server │    │
│  │             │                         │             │    │
│  │ (LLM App)   │                         │ (Tools/     │    │
│  │ - Copilot   │                         │  Resources/ │    │
│  │ - Claude    │                         │  Prompts)   │    │
│  │ - Custom    │                         │             │    │
│  └─────────────┘                         └─────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  MCP Registry                        │   │
│  │          (Server 发现和发布平台)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| 组件 | 说明 |
|------|------|
| **Server** | 暴露工具(Tools)、资源(Resources)、提示(Prompts)给 LLM 使用 |
| **Client** | LLM 应用程序，通过 MCP 协议连接 Server |
| **Registry** | 社区驱动的 MCP Server 发现和发布平台 |
| **SDK** | 官方提供的 TypeScript/Python SDK 用于构建 Server 和 Client |

### MCP 的三个核心概念

1. **Tools (工具)** - 可被 LLM 调用的操作，类似函数调用
   - 例如：搜索、计算、数据库查询
   - 类比：REST API 的 POST 端点

2. **Resources (资源)** - 只读的数据源，类似 GET 请求
   - 例如：文件内容、数据库记录、配置信息
   - 类比：REST API 的 GET 端点

3. **Prompts (提示)** - 预定义的提示模板
   - 例如：代码审查模板、文档生成模板
   - 类比：可复用的系统提示

---

## 第二部分：项目初始化

### 2.1 创建项目目录

```bash
mkdir bmi-mcp-server
cd bmi-mcp-server
```

### 2.2 初始化 npm 项目

```bash
npm init -y
```

### 2.3 安装依赖

```bash
# 核心依赖
npm install @modelcontextprotocol/server @modelcontextprotocol/express @modelcontextprotocol/node express zod

# 开发依赖
npm install -D typescript ts-node @types/express @types/node
```

### 2.4 创建 TypeScript 配置

创建 `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 2.5 创建项目结构

```
bmi-mcp-server/
├── src/
│   └── server.ts       # 主服务文件
├── dist/                # 编译输出 (自动生成)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 第三部分：实现 MCP Server

### 3.1 基础框架

创建 `src/server.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/server';
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { z } from 'zod';

// 初始化 MCP Server
const server = new McpServer({
  name: 'bmi-mcp-server',
  version: '1.0.0',
});

// ... Tools/Resources/Prompts 定义 ...

// 创建 Express 应用并挂载 MCP
const app = createMcpExpressApp();

app.post('/mcp', async (req, res) => {
  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(3000, () => {
  console.log('MCP Server running on http://localhost:3000/mcp');
});
```

### 3.2 注册 Tool (工具)

```typescript
server.registerTool(
  'calculate-bmi',                              // 工具 ID
  {
    title: 'BMI Calculator',                     // 显示标题
    description: 'Calculate Body Mass Index',    // 描述
    inputSchema: z.object({                      // 输入参数 Schema
      weightKg: z.number().positive(),
      heightM: z.number().positive(),
    }),
    outputSchema: z.object({                     // 输出 Schema
      bmi: z.number(),
      category: z.string(),
    }),
  },
  async ({ weightKg, heightM }) => {             // 实现函数
    const bmi = weightKg / (heightM * heightM);
    return {
      content: [{ type: 'text', text: JSON.stringify({ bmi, category: getBmiCategory(bmi) }) }],
      structuredContent: { bmi, category: getBmiCategory(bmi) },
    };
  }
);
```

### 3.3 注册 Resource (资源)

```typescript
server.registerResource(
  'bmi-categories',           // 资源 ID
  'bmi://categories',         // 资源 URI
  {
    title: 'BMI Categories',
    description: 'Reference table of BMI categories',
    mimeType: 'application/json',
  },
  async () => ({
    contents: [{
      uri: 'bmi://categories',
      mimeType: 'application/json',
      text: JSON.stringify({ categories: [...] }),
    }],
  })
);
```

### 3.4 注册 Prompt (提示)

```typescript
server.registerPrompt(
  'analyze-bmi',
  {
    title: 'Analyze BMI Results',
    description: 'Generate a prompt for analyzing BMI results',
  },
  async () => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: 'Analyze the BMI results and provide health assessment...',
      },
    }],
  })
);
```

---

## 第四部分：传输层配置

MCP 支持多种传输方式：

### Streamable HTTP (推荐用于 Web 服务)

```typescript
import { createMcpExpressApp } from '@modelcontextprotocol/express';

const app = createMcpExpressApp();
app.post('/mcp', async (req, res) => {
  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
```

### stdio (推荐用于 CLI 工具)

```typescript
import { StdioServerTransport } from '@modelcontextprotocol/server';

const transport = new StdioServerTransport();
await server.connect(transport);
```

### DNS 重绑定防护

使用 `@modelcontextprotocol/express` 提供的 `createMcpExpressApp()` 可以自动启用主机头验证，防止本地服务被恶意域名劫持。

---

## 第五部分：测试 MCP Server

### 5.1 启动服务器

```bash
# 开发模式
npm run dev

# 或构建后运行
npm run build
npm start
```

### 5.2 使用 MCP Client 测试

可以使用官方的 MCP Inspector 或编写简单的测试脚本：

```typescript
import { Client } from '@modelcontextprotocol/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const client = new Client({ name: 'test-client', version: '1.0.0' });
const transport = new StreamableHTTPClientTransport({
  url: 'http://localhost:3000/mcp',
});

await client.connect(transport);

// 调用 calculate-bmi 工具
const result = await client.callTool({
  name: 'calculate-bmi',
  arguments: { weightKg: 70, heightM: 1.75 },
});

console.log(result);
```

### 5.3 健康检查

```bash
curl http://localhost:3000/health
```

响应示例：

```json
{
  "status": "healthy",
  "server": "bmi-mcp-server",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 发布到 MCP Registry

> 📖 官方文档：[Publish Your MCP Server](https://modelcontextprotocol.info/tools/registry/publishing/)

### 6.1 部署方式概述

MCP Server 可以通过以下方式发布：

| 方式 | 说明 |
|------|------|
| **📦 Package Deployment** | 发布到 npm/PyPI/NuGet/Docker，运行在客户端本地 |
| **🌐 Remote Deployment** | 托管为 Web 服务，客户端直接连接 |
| **🔄 Hybrid Deployment** | 同时支持 Package 和 Remote 方式 |

### 6.2 安装 mcp-publisher CLI

**Windows (PowerShell):**

```powershell
$arch = if ([System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture -eq "Arm64") { "arm64" } else { "amd64" }
Invoke-WebRequest -Uri "https://github.com/modelcontextprotocol/registry/releases/download/v1.0.0/mcp-publisher_1.0.0_windows_$arch.tar.gz" -OutFile "mcp-publisher.tar.gz"
tar xf mcp-publisher.tar.gz mcp-publisher.exe
# 将 mcp-publisher.exe 移到 PATH 中的目录
```

**macOS/Linux:**

```bash
brew install mcp-publisher
```

### 6.3 初始化 server.json

```bash
cd /path/to/your/mcp-server
mcp-publisher init
```

这会自动创建带有检测值的 `server.json`。

### 6.4 配置 server.json

#### 选择命名空间

- **`io.github.yourname/*`** - 需要 GitHub 认证
- **`com.yourcompany/*`** - 需要 DNS 验证

#### Package Deployment (NPM 为例)

**1. 更新 package.json 添加 mcpName:**

```json
{
  "name": "@yourname/bmi-mcp-server",
  "version": "1.0.0",
  "mcpName": "io.github.yourname/bmi-mcp-server"
}
```

**2. 配置 server.json:**

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-07-09/server.schema.json",
  "name": "io.github.yourname/bmi-mcp-server",
  "description": "A custom MCP server for BMI calculation, weight conversion, and health recommendations",
  "version": "1.0.0",
  "packages": [
    {
      "registry_type": "npm",
      "identifier": "@yourname/bmi-mcp-server",
      "version": "1.0.0"
    }
  ]
}
```

#### Remote Deployment (可选)

如果需要远程部署：

```json
{
  "name": "io.github.yourname/bmi-mcp-server",
  "description": "Remote BMI MCP Server",
  "version": "1.0.0",
  "remotes": [
    {
      "type": "sse",
      "url": "https://your-server.example.com/sse"
    }
  ]
}
```

### 6.5 发布到 npm (Package 方式)

```bash
# 登录 npm
npm login

# 发布包
npm publish --access public
```

### 6.6 认证 MCP Registry

**GitHub 认证 (用于 io.github.* 命名空间):**

```bash
mcp-publisher login github
```

这会打开浏览器进行 OAuth 认证。

### 6.7 发布服务器

```bash
mcp-publisher publish
```

成功输出：

```
✓ Successfully published
```

### 6.8 验证发布

```bash
curl "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.yourname/bmi-mcp-server"
```

### bmi-mcp-server 完整发布配置示例

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-07-09/server.schema.json",
  "name": "io.github.opencode/bmi-mcp-server",
  "description": "A custom MCP server for BMI calculation, weight conversion, and health recommendations. Built with TypeScript.",
  "version": "1.0.0",
  "packages": [
    {
      "registry_type": "npm",
      "identifier": "@opencode/bmi-mcp-server",
      "version": "1.0.0"
    }
  ],
  "homepage": "https://github.com/opencode/bmi-mcp-server",
  "keywords": ["mcp", "mcp-server", "bmi", "health", "calculator"]
}
```

> 📖 完整发布指南：[modelcontextprotocol.info](https://modelcontextprotocol.info/tools/registry/publishing/)

---

## 最佳实践

### 安全性

| 实践 | 说明 |
|------|------|
| DNS 重绑定防护 | 使用 `createMcpExpressApp()` 自动启用主机头验证 |
| 认证 | 为远程服务器配置 OAuth / Token 认证 |
| 输入验证 | 使用 Zod 严格验证所有输入参数 |

### 类型安全

| 实践 | 说明 |
|------|------|
| Schema 定义 | 为所有 Tools 定义 `inputSchema` 和 `outputSchema` |
| 结构化输出 | 返回 `structuredContent` 便于客户端解析 |
| TypeScript | 使用 TypeScript 保证编译期类型安全 |

### 可维护性

| 实践 | 说明 |
|------|------|
| 版本管理 | 遵循语义化版本 (SemVer) |
| 文档 | 为每个 Tool/Resource/Prompt 提供清晰的描述 |
| 日志 | 使用 MCP SDK 内置的日志 API |
| 健康检查 | 实现 `/health` 端点便于监控 |

### 性能优化

| 实践 | 说明 |
|------|------|
| 传输选择 | Web 服务用 Streamable HTTP，CLI 用 stdio |
| 异步处理 | 所有 Tool 实现使用 async/await |
| 资源清理 | 确保 transport 连接正确关闭 |

---

## 官方资源

| 资源 | 链接 |
|------|------|
| MCP 官方文档 | [modelcontextprotocol.io](https://modelcontextprotocol.io) |
| TypeScript SDK | [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) |
| Python SDK | [github.com/modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk) |
| MCP Registry | [github.com/modelcontextprotocol/registry](https.com/github.com/modelcontextprotocol/registry) |
| Server 开发指南 (TS) | [typescript-sdk/docs/server.md](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md) |
| Registry Quickstart | [registry/quickstart.mdx](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx) |
| GitHub MCP Server 文档 | [docs.github.com - Set up MCP Server](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/set-up-the-github-mcp-server) |
| SDKs 概览页 | [modelcontextprotocol.io/docs/sdk](https://modelcontextprotocol.io/docs/sdk) |

---

## BMI 分类参考

| 分类 | BMI 范围 |
|------|----------|
| 体重不足 (Underweight) | < 18.5 |
| 正常体重 (Normal weight) | 18.5 - 24.9 |
| 超重 (Overweight) | 25 - 29.9 |
| 肥胖 I 级 (Obesity Class I) | 30 - 34.9 |
| 肥胖 II 级 (Obesity Class II) | 35 - 39.9 |
| 肥胖 III 级 (Obesity Class III) | ≥ 40 |

---

## 许可证

MIT License

---

## 贡献

欢迎提交 Issue 和 Pull Request！

---

<p align="center">
  Built with <a href="https://modelcontextprotocol.io">MCP SDK</a> |
  <a href="https://github.com/opencode/bmi-mcp-server">GitHub</a>
</p>
