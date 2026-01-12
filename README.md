<p align='center'>
<img src='./resources/icon.png' width="150" height="150" alt="windflow Icon" />
</p>

![vue](https://img.shields.io/badge/vue-3.x-brightgreen.svg) ![vite](https://img.shields.io/badge/vite-7.x-blue.svg) ![electron](https://img.shields.io/badge/electron-38.x-brightgreen.svg)

<div align="center">
  <a href="./README.zh.md">中文</a> / <a href="./README.md">English</a>
</div>

# windflow

🍃 windflow - Power your automated workflows with multiple AI providers

## 🧽 Download

<div align=left>
<table>
    <thead align=left>
        <tr>
            <th>OS</th>
            <th>Download</th>
        </tr>
    </thead>
    <tbody align=left>
        <tr>
        <tr>
            <td>Windows</td>
            <td>
                <a href="https://github.com/evilArsh/windflow/releases"><img src="https://img.shields.io/badge/Setup-x64-2d7d9a.svg?logo=windows"></a><br>
                <a href="https://github.com/evilArsh/windflow/releases"><img src="https://img.shields.io/badge/Portable-x64-67b7d1.svg?logo=windows"></a>
            </td>
        </tr>
        <tr>
            <td>macOS</td>
            <td>
                <a href="https://github.com/evilArsh/windflow/releases"><img src="https://img.shields.io/badge/DMG-Apple%20Silicon-%23000000.svg?logo=apple"></a><br>
                <!-- <a href="https://github.com/evilArsh/windflow/releases/download/v$$VERSION$$/windflow-$$VERSION$$-macos-amd64.dmg"><img src="https://img.shields.io/badge/DMG-Intel%20X64-%2300A9E0.svg?logo=apple"></a><br> -->
            </td>
        </tr>
        <tr>
            <td>Linux</td>
            <td>
                <a href="https://github.com/evilArsh/windflow/releases"><img src="https://img.shields.io/badge/AppImage-x64-f84e29.svg?logo=linux"> </a><br>
                <a href="https://github.com/evilArsh/windflow/releases"><img src="https://img.shields.io/badge/DebPackage-x64-FF9966.svg?logo=debian"> </a><br>
            </td>
        </tr>
    </tbody>
</table>

## ⚙️ Installation

### Prerequisites

- Node.js >= 22.10.0
- pnpm >= 10.12.4
- Git

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/evilArsh/windflow.git
cd windflow

# Install dependencies
pnpm i -r

# Start development server
pnpm dev
```

### 📦 Building for Production

```bash
# Package for specific platforms
pnpm build:win    # Windows
pnpm build:mac    # macOS
pnpm build:linux  # Linux
```

## 🌟 Features

### AI-Powered Development

- **Multi-model Support**: Connect to various LLM providers including OpenAI, DeepSeek, SiliconFlow, and more
- **Local Knowledge Base (RAG)**: Build and search local knowledge bases with document parsing and vector embeddings
- **Model Context Protocol (MCP)**: Extend AI capabilities with standardized tool protocols for enhanced functionality

### Desktop Application Capabilities

- **Cross-platform**: Runs on Windows, macOS, and Linux
- **Persistent Storage**: Local storage of conversations, settings, and knowledge bases
- **Customizable Themes**: Light/dark/system themes with automatic title bar adaptation

### Developer Experience

- **Integrated Environment**: Unified interface for chatting, coding, and knowledge management
- **Context Awareness**: Maintains conversation history and document context
- **Extensible Architecture**: Plugin system for adding custom tools and integrations
- **Performance Monitoring**: Track token usage and performance metrics

## 👀 Preview

![chat](./docs/preview.png)

![chat-dark](./docs/preview-dark.png)

## 🏗️ Architecture

windflow follows a typical Electron multi-process architecture:

### Main Packages

The project is organized into several main packages:

#### @windflow/core

Core LLM logic and services for the application:

- **Message handling**: Context management, hooks, storage, and utilities for chat interactions
- **Models**: Core model management and utilities
- **Providers**: Integrations with multiple LLM providers (OpenAI, DeepSeek, SiliconFlow, VolcEngine, etc.)
- **Storage**: Comprehensive storage solutions for chats, embeddings, knowledge bases, MCP tools, models, presets, providers, RAG files, and settings
- **Types**: Type definitions for AI, chat, knowledge, provider, request, and storage systems

#### @windflow/markdown

Markdown processing and rendering utilities:

- **Vue integration**: Specialized caching, types, and utilities for Vue-based markdown rendering
- **Processing pipeline**: Powered by unified, remark, and rehype ecosystems
- **Features**: Supports math formulas, GFM (GitHub Flavored Markdown), emojis, HTML conversion, and more
- **Worker-based**: Includes dedicated worker for efficient markdown processing

### Renderer Process

- **Vue 3 Frontend**: Modern reactive UI built with Composition API
- **Pinia State Management**: Centralized state management for application data
- **Element Plus UI**: Feature-rich component library
- **Monaco Editor**: Advanced code editor with syntax highlighting

### Key Components

#### RAG (Retrieval-Augmented Generation) Service

The RAG service enables local knowledge base creation and querying:

- Document parsing for multiple formats (Word, PDF, CSV, Excel)
- Text chunking and vector embedding
- Local vector database using LanceDB
- Similarity search for context-aware responses

#### MCP (Model Context Protocol) Service

Extends AI capabilities through standardized protocols:

- Integration with external tools and services
- Standardized communication protocol for AI tools
- Support for stdio, HTTP, and SSE transports

#### Theme Service

Provides customizable UI appearance:

- Light, dark, and system themes
- Automatic title bar overlay adaptation
- Native theme change detection

## 🤝 Contributing

We welcome contributions to windflow! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows our coding standards and passes all tests.

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [lobe-icons](https://github.com/lobehub/lobe-icons.git) - LLM Providers Icons
- [iconify](https://iconify.design/) - SVG icon Sets
- [Electron](https://www.electronjs.org/) - Cross-platform desktop application framework
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [LanceDB](https://lancedb.com/) - Modern vector database for AI applications

## 💬 Support

For support, please open an issue on GitHub or contact the maintainers.
