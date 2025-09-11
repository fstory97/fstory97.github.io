# 教程介绍

**在 5 分钟内学会 Docusaurus**。

## 入门指南

通过 **创建新站点** 或 **向现有站点添加 Docusaurus** 来开始使用。

### 你需要准备的

- [Node.js](https://nodejs.org/en/download/) 版本 18.0 或更高版本：
  - 安装 Node.js 时，建议勾选所有与依赖项相关的复选框。

## 生成新站点

使用 **经典模板** 生成新的 Docusaurus 站点。

经典模板会作为 Docusaurus **CLI** 的一部分自动安装。

```bash
npm init docusaurus@latest my-website classic
```

您可以在以下位置键入此命令：

```bash
cd my-website
npm run start
```

`start` 命令在本地构建您的网站，并通过开发服务器为您提供服务，供您在 http://localhost:3000/ 上查看。

## 站点配置

编辑 `docusaurus.config.js` 并更改您站点的配置详细信息。

## 添加 Markdown 页面

在 `src/pages` 中添加 **Markdown 或 React** 文件以创建 **独立页面**：

- `src/pages/index.js` → `localhost:3000/`
- `src/pages/foo.md` → `localhost:3000/foo`
- `src/pages/foo/bar.js` → `localhost:3000/foo/bar`

## 创建第一个文档

在 `docs/hello.md` 创建一个 Markdown 文件：

```md title="docs/hello.md"
# 你好

这是我的**第一个 Docusaurus 文档**！
```

新文档现在可以在 `http://localhost:3000/docs/hello` 上使用。

## 配置侧边栏

Docusaurus 会从 **`docs` 文件夹** 自动**创建侧边栏**。

添加元数据以自定义侧边栏标签和位置：

```md title="docs/hello.md" {1-4}
---
sidebar_label: 'Hi!'
sidebar_position: 3
---

# 你好

这是我的**第一个 Docusaurus 文档**！
```

也可以在 `sidebars.js` 中显式创建您的侧边栏：

```js title="sidebars.js"
module.exports = {
  tutorialSidebar: [
    'intro',
    'hello',
    {
      type: 'category',
      label: '教程',
      items: ['tutorial-basics/create-a-document'],
    },
  ],
};
```