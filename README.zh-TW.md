# Disbase V4

Disbase 是一個使用 Discord 伺服器功能來讓您的生活更輕鬆的 Discord 機器人。

[English](README.md) | [简体中文](README.zh-CN.md) | 繁體中文

---

# 功能特色

* [x] 檔案上傳

  * 儲存方式

    * [x] Cloudreve：自架式
    * [ ] Discord：無限儲存系統
    * [ ] Google Drive
    * [ ] Telegram
    * [ ] 本地儲存
    * [ ] WebDAV
  * 應用程式

    * [ ] Discord 機器人應用
* [ ] 文字貼上

  * [ ] 程式碼貼上：上傳至線上程式碼服務
  * [ ] 加密器
* [ ] 短網址

  * [ ] 自架式
  * [ ] is.gd
  * [ ] v.gd
  * [ ] s.fury.tw
* [ ] 密碼管理器

  * [ ] 本地加密密碼保護
  * [ ] 備份碼
  * [ ] 1Password
  * [ ] 雙因素驗證產生器
* [ ] 提醒功能

  * [ ] 行事曆

    * [ ] Google
    * [ ] CalDAV
  * [ ] 待辦清單
* [ ] 組織工具

  * [ ] 訂閱管理器
  * [ ] 專案列表
* [ ] Midjourney

  * [ ] Discord 客戶端圖片生成

---

# 使用方式

## 檔案上傳功能

上傳任何檔案類型到 `UploadChannelId`。機器人會處理您的檔案，整理它們，並重新上傳到 `OutputChannel`。

輸出頻道將包含以下資訊：

* 原始檔案名稱
* 檔案類型
* 檔案大小
* 下載連結
* 上傳時間
* 檔案縮圖

在 Discord 中看起來像這樣：

![示範圖片](https://cloud.dragoncode.dev/f/8v6UY/NHp0-qqW7CbACFKnU-IeN8.png)

---

# 安裝 / 設定

> 此專案適用於 Node.js 版本 25。其他版本的相容性尚未測試。

> 由於快速開發，目前儲存方式僅支援 [Cloudreve API](https://github.com/cloudreve/Cloudreve)。未來將新增更多儲存方式，例如 S3、Discord、Telegram、本地儲存、Google Drive 等。

1. 使用以下命令複製此專案：

   ```bash
   git clone https://github.com/Whitedragon115/Disbase-V4.git
   ```

2. 將 `.env.example` 和 `config.json.example` 重新命名為 `.env` 和 `config.json`。您也可以執行以下命令：

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

3. 安裝相依套件：

   ```bash
   npm install
   ```

4. 使用您的 Discord 機器人令牌和儲存方式設定來配置 `.env` 和 `config.json` 檔案。

5. 執行資料庫遷移（您也可以將資料庫切換為 SQLite）：

   ```bash
   npx prisma migrate dev
   ```

6. 啟動機器人：

   ```bash
   node index.js
   ```

---

# 程式碼文件

本節說明檔案上傳工作流程及其運作方式。

## 上傳功能

### 上傳器處理流程

> `/utils/newUploader.js`

1. 當使用者上傳檔案到 `UploadChannel` 時，會觸發事件。處理流程會檢查訊息是否包含附件。
2. 解析附件資料，並使用並發處理來[下載檔案](#下載器處理流程)以降低遭遇速率限制的機會。
3. 使用已配置的儲存方式重新上傳使用者檔案。
4. 收集所有已上傳的檔案連結。
5. 將已上傳的檔案資訊傳送至 `SenderChannel`。

### 下載器處理流程

> `/utils/uploader/uploader.js`

1. 為檔案產生 UUID。
2. 將檔案資訊寫入資料庫。
3. 使用 [`thumbnailCreator`](#縮圖建立器) 函式產生檔案縮圖。
4. 使用使用者選擇的儲存方式重新上傳檔案。
5. 移除本地檔案。

### 縮圖建立器

> `/utils/uploader/thumbnail.js`

#### 圖片縮圖

1. 使用 `npm image-thumbnail` 產生 `128x128` 縮圖（`fix cover`、`percent 10`、`JPEG`）。
2. 將檔案上傳至 Discord `UploadLoggingChannel` 並取得附件網址。
3. 回傳附件網址。

#### 影片縮圖

1. 使用 `ffmpeg`、`ffmpeg-static` 和 `ffprobe-static` 產生 `128x128` 縮圖（`fix cover`、`PNG`）。
2. 將檔案上傳至 Discord `UploadLoggingChannel` 並取得附件網址。
3. 回傳附件網址。

#### 其他檔案

1. 從資料集回傳檔案圖示。

所有圖示都是從 [Iconify](https://iconify.design/docs/api/queries.html) 下載，轉換成圖片，並上傳到我的 CDN。

歡迎使用我的 CDN。如果您覺得速度慢，可以考慮使用位於 `/utils/uploader/data` 下的 AI 腳本。

#### 為什麼要上傳到 Discord

經過測試後，我發現使用外部連結會降低縮圖載入速度，有時甚至會完全失效。重新上傳檔案到 Discord 可以讓 Discord 使用其自己的媒體代理，這樣可以顯著提升縮圖載入速度。

---

### Cloudreve 上傳處理流程

> `/function/cloudreve.js`

#### 上傳檔案

1. 建立上傳會話並取得上傳會話 ID。
2. 使用取得的上傳會話 ID 上傳檔案。

#### 直接連結

1. 使用直接連結陣列請求檔案。
2. 回傳回應。

#### 存取令牌

1. 在初始化期間，使用使用者名稱和密碼取得新的存取令牌和重新整理令牌。
2. 如果上傳失敗，系統會自動嘗試重新整理存取令牌。

---

*本文件由 AI 翻譯*
