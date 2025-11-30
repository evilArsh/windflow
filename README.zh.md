<p align='center'>
<img src='./resources/icon.png' width="150" height="150" alt="WindFlow Icon" />
</p>

![vue](https://img.shields.io/badge/vue-3.x-brightgreen.svg) ![vite](https://img.shields.io/badge/vite-7.x-blue.svg) ![electron](https://img.shields.io/badge/electron-38.x-brightgreen.svg)

# WindFlow

🍃 WindFlow - 通过多个AI提供商增强您的自动化工作流程

## 🌟 功能特性

### AI驱动的开发

- **多模型支持**: 连接到各种LLM提供商，包括OpenAI、DeepSeek、SiliconFlow等
- **本地知识库(RAG)**: 通过文档解析和向量嵌入构建和搜索本地知识库
- **模型上下文协议(MCP)**: 通过标准化工具协议扩展AI功能，提升工作效率

### 桌面应用程序功能

- **跨平台**: 在Windows、macOS和Linux上运行
- **持久化存储**: 本地存储对话、设置和知识库
- **可定制主题**: 浅色/深色/系统主题，自动适应标题栏

### 开发者体验

- **集成环境**: 统一的聊天、编码和知识管理界面
- **上下文感知**: 维护对话历史和文档上下文
- **可扩展架构**: 插件系统用于添加自定义工具和集成
- **性能监控**: 跟踪令牌使用情况和性能指标

## 👀 预览

![chat](./docs/preview.png)

![chat-dark](./docs/preview-dark.png)

## ⚙️ 安装

### 先决条件

- Node.js >= 22.10.0
- pnpm >= 10.12.4
- Git

### 设置开发环境

```bash
# 克隆仓库
git clone https://github.com/evilArsh/windflow.git
cd windflow

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 📦 生产构建

```bash
# 类型检查
pnpm typecheck

# 构建应用程序
pnpm build

# 为特定平台打包
pnpm build:win    # Windows
pnpm build:mac    # macOS
pnpm build:linux  # Linux
```

## 🏗️ 架构

WindFlow采用典型的Electron多进程架构：

### 渲染进程

- **Vue 3前端**: 使用Composition API构建的现代响应式UI
- **Pinia状态管理**: 应用程序数据的集中状态管理
- **Element Plus UI**: 功能丰富的组件库
- **Monaco编辑器**: 具有语法高亮的高级代码编辑器

### 核心组件

#### RAG (检索增强生成) 服务

RAG服务支持本地知识库的创建和查询：

- 多种格式的文档解析 (Word, PDF, CSV, Excel)
- 文本分块和向量嵌入
- 使用LanceDB的本地向量数据库
- 用于上下文感知响应的相似性搜索

#### MCP (模型上下文协议) 服务

通过标准化协议扩展AI功能：

- 与外部工具和服务集成
- AI工具的标准化通信协议
- 支持stdio、HTTP和SSE传输

#### 主题服务

提供可定制的UI外观：

- 浅色、深色和系统主题
- 自动标题栏覆盖适配
- 原生主题更改检测

## 🤝 贡献

欢迎为WindFlow做出贡献！您可以这样帮助我们：

1. Fork仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 发起Pull Request

请确保您的代码遵循我们的编码标准并通过所有测试。

## 📄 许可证

本项目采用Apache-2.0许可证 - 详情请见[LICENSE](LICENSE)文件。

## 🙏 致谢

- [lobe-icons](https://github.com/lobehub/lobe-icons.git) - LLM提供商图标
- [iconify](https://iconify.design/) - SVG图标集
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [LanceDB](https://lancedb.com/) - 现代AI应用向量数据库

## 💬 支持

如需支持，请在GitHub上提交issue或联系维护人员。