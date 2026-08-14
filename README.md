# dsh-plugin-anydoc

一个 DeepSeek Harness (DSH) 插件，将 `@firecrawl/anydoc` 作为 `anydoc` 工具注册给 Agent，把多种文档格式转换为 GitHub-Flavored Markdown。

基于 [@firecrawl/anydoc](https://github.com/firecrawl/anydoc)（Rust 原生绑定，napi-rs），在 libuv 线程池中执行，不阻塞事件循环，也无需任何外部进程或 Python 环境。

## 支持的格式

| 类别 | 扩展名 |
| --- | --- |
| Word | `.doc` `.docx` `.docm` |
| PowerPoint | `.ppt` `.pps` `.pot` `.pptx` `.pptm` `.ppsx` `.ppsm` |
| Excel | `.xls` `.xlsx` `.xlsm` `.xlsb` |
| OpenDocument | `.odt` `.ods` `.odp` |
| Rich Text | `.rtf` |
| EPUB | `.epub` |
| CSV | `.csv` |
| PDF | `.pdf` |

> 不支持 HTML、JSON、XML、图片与音频。

## 环境要求

- Node.js >= 20
- pnpm
- Windows x64 / macOS (Intel/Apple Silicon) / Linux (glibc/musl)

## 目录结构

```
├── src/
│   └── index.ts          # 插件入口，注册 anydoc 工具
├── cordis.patch.yml      # bundle 配置层（安装时引用包名）
├── package.json
├── tsconfig.json
└── .gitignore
```

## 工具参数

`anydoc` 工具接收以下参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `filePath` | string | 是 | 要转换文件的绝对或相对路径 |
| `format` | string | 否 | 显式指定格式（如 `csv`）；缺省时根据文件内容自动检测 |
| `outputFilePath` | string | 否 | 将结果写入该文件并返回摘要，而非返回完整 Markdown |

## 开发

```sh
# 安装依赖
pnpm install

# 编译 TypeScript 到 lib/
pnpm build
```

### 本地加载（--patch 开发模式）

先构建 `lib/`，再通过 `--patch` 加载。开发用的 patch 文件需引用插件的绝对路径（安装用的 `cordis.patch.yml` 引用包名，两者不通用）。

在 `deepseek-harness` 源码根目录运行：

```sh
pnpm dsh web --patch "C:\path\to\dsh-plugin-anydoc\dev.cordis.patch.yml"
```

其中 `dev.cordis.patch.yml` 内容形如：

```yaml
- insert:
    - id: anydoc
      name: 'C:\path\to\dsh-plugin-anydoc\lib\index.js'
```

## 正式安装

在 `deepseek-harness` 源码根目录（或安装了 `dsh` CLI 的机器）运行：

```sh
# 源码模式
pnpm dsh plugin --profile web add "C:\path\to\dsh-plugin-anydoc"

# 或从 npm / git / tarball 安装
dsh plugin --profile web add dsh-plugin-anydoc
dsh plugin --profile web add github:you/dsh-plugin-anydoc
dsh plugin --profile web add ./dsh-plugin-anydoc-0.1.0.tgz
```

安装完成后，直接启动即可：

```sh
pnpm dsh web
# 或
dsh --profile web
```

### 卸载

```sh
dsh plugin --profile web remove dsh-plugin-anydoc
```

## 使用

启动 DSH Web 后，向 Agent 发送类似指令：

```
请将 C:\path\to\report.docx 转换为 Markdown
```

Agent 会调用 `anydoc` 工具，返回转换后的 Markdown 内容。

## 许可

MIT
