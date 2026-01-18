# Disbase V4

Disbase 是一个使用 Discord 服务器功能来让您的生活更轻松的 Discord 机器人。

[English](README.md) | 简体中文 | [繁體中文](README.zh-TW.md)

---

# 功能特色

* [x] 文件上传

  * 存储方式

    * [x] Cloudreve：自托管
    * [ ] Discord：无限存储系统
    * [ ] Google Drive
    * [ ] Telegram
    * [ ] 本地存储
    * [ ] WebDAV
  * 应用程序

    * [ ] Discord 机器人应用
* [ ] 文本粘贴

  * [ ] 代码粘贴：上传到在线代码服务
  * [ ] 加密器
* [ ] 短链接

  * [ ] 自托管
  * [ ] is.gd
  * [ ] v.gd
  * [ ] s.fury.tw
* [ ] 密码管理器

  * [ ] 本地加密密码保护
  * [ ] 备份码
  * [ ] 1Password
  * [ ] 双因素认证生成器
* [ ] 提醒功能

  * [ ] 日历

    * [ ] Google
    * [ ] CalDAV
  * [ ] 待办清单
* [ ] 组织工具

  * [ ] 订阅管理器
  * [ ] 项目列表
* [ ] Midjourney

  * [ ] Discord 客户端图片生成

---

# 使用方式

## 文件上传功能

上传任何文件类型到 `UploadChannelId`。机器人会处理您的文件，整理它们，并重新上传到 `OutputChannel`。

输出频道将包含以下信息：

* 原始文件名称
* 文件类型
* 文件大小
* 下载链接
* 上传时间
* 文件缩略图

在 Discord 中看起来像这样：

![演示图片](https://cloud.dragoncode.dev/f/8v6UY/NHp0-qqW7CbACFKnU-IeN8.png)

---

# 安装 / 设置

> 此项目适用于 Node.js 版本 25。其他版本的兼容性尚未测试。

> 由于快速开发，目前存储方式仅支持 [Cloudreve API](https://github.com/cloudreve/Cloudreve)。未来将添加更多存储方式，例如 S3、Discord、Telegram、本地存储、Google Drive 等。

1. 使用以下命令克隆此项目：

   ```bash
   git clone https://github.com/Whitedragon115/Disbase-V4.git
   ```

2. 将 `.env.example` 和 `config.json.example` 重命名为 `.env` 和 `config.json`。您也可以执行以下命令：

   ```bash
   # Linux / macOS
   cp .env.example .env
   cp config.json.example config.json

   # Windows (PowerShell)
   Copy-Item .env.example .env
   Copy-Item config.json.example config.json

   # Windows (Command Prompt)
   copy .env.example .env
   copy config.json.example config.json
   ```

3. 安装依赖包：

   ```bash
   npm install
   ```

4. 使用您的 Discord 机器人令牌和存储方式设置来配置 `.env` 和 `config.json` 文件。

5. 运行数据库迁移（您也可以将数据库切换为 SQLite）：

   ```bash
   npx prisma migrate dev
   ```

6. 启动机器人：

   ```bash
   node index.js
   ```

---

# 代码文档

本节说明文件上传工作流程及其运作方式。

## 上传功能

### 上传器处理流程

> `/utils/newUploader.js`

1. 当用户上传文件到 `UploadChannel` 时，会触发事件。处理流程会检查消息是否包含附件。
2. 解析附件数据，并使用并发处理来[下载文件](#下载器处理流程)以降低遭遇速率限制的机会。
3. 使用已配置的存储方式重新上传用户文件。
4. 收集所有已上传的文件链接。
5. 将已上传的文件信息发送至 `SenderChannel`。

### 下载器处理流程

> `/utils/uploader/uploader.js`

1. 为文件生成 UUID。
2. 将文件信息写入数据库。
3. 使用 [`thumbnailCreator`](#缩略图创建器) 函数生成文件缩略图。
4. 使用用户选择的存储方式重新上传文件。
5. 删除本地文件。

### 缩略图创建器

> `/utils/uploader/thumbnail.js`

#### 图片缩略图

1. 使用 `npm image-thumbnail` 生成 `128x128` 缩略图（`fix cover`、`percent 10`、`JPEG`）。
2. 将文件上传至 Discord `UploadLoggingChannel` 并获取附件网址。
3. 返回附件网址。

#### 视频缩略图

1. 使用 `ffmpeg`、`ffmpeg-static` 和 `ffprobe-static` 生成 `128x128` 缩略图（`fix cover`、`PNG`）。
2. 将文件上传至 Discord `UploadLoggingChannel` 并获取附件网址。
3. 返回附件网址。

#### 其他文件

1. 从数据集返回文件图标。

所有图标都是从 [Iconify](https://iconify.design/docs/api/queries.html) 下载，转换成图片，并上传到我的 CDN。

欢迎使用我的 CDN。如果您觉得速度慢，可以考虑使用位于 `/utils/uploader/data` 下的 AI 脚本。

#### 为什么要上传到 Discord

经过测试后，我发现使用外部链接会降低缩略图加载速度，有时甚至会完全失效。重新上传文件到 Discord 可以让 Discord 使用其自己的媒体代理，这样可以显著提升缩略图加载速度。

---

### Cloudreve 上传处理流程

> `/function/cloudreve.js`

#### 上传文件

1. 创建上传会话并获取上传会话 ID。
2. 使用获取的上传会话 ID 上传文件。

#### 直接链接

1. 使用直接链接数组请求文件。
2. 返回响应。

#### 访问令牌

1. 在初始化期间，使用用户名和密码获取新的访问令牌和刷新令牌。
2. 如果上传失败，系统会自动尝试刷新访问令牌。

---

*本文档由 AI 翻译*
