# Disbase V4

Disbase is a Discord bot that uses Discord server features to make your life easier.

---

# Features

* [x] File Upload

  * Storage methods

    * [x] Cloudreve: self-hosted
    * [ ] Discord: infinite storage system
    * [ ] Google Drive
    * [ ] Telegram
    * [ ] Local
    * [ ] WebDAV
  * Apps

    * [ ] Discord bot apps
* [ ] Text Paster

  * [ ] Code Paste: upload to an online code service
  * [ ] Encrypter
* [ ] Short Link

  * [ ] Self-hosted
  * [ ] is.gd
  * [ ] v.gd
  * [ ] s.fury.tw
* [ ] Password Manager

  * [ ] Local encrypted password protection
  * [ ] Backup codes
  * [ ] 1Password
  * [ ] 2FA generator
* [ ] Reminder

  * [ ] Calendar

    * [ ] Google
    * [ ] CalDAV
  * [ ] To-do list
* [ ] Organizer

  * [ ] Subscription manager
  * [ ] Project list
* [ ] Midjourney

  * [ ] Discord client image generation

---

# Usage

## File Upload Feature

Upload any file type to `UploadChannelId`. The bot will process your files, organize them, and reupload them to the `OutputChannel`.

The output channel will include the following information:

* Original file name
* File type
* File size
* Download link
* Upload time
* File thumbnail

In Discord, it will look like this:
![](https://cloud.dragoncode.dev/f/8v6UY/NHp0-qqW7CbACFKnU-IeN8.png)

---

# Installation / Setup

> This project works on Node.js version 25. Compatibility with other versions has not been tested.

> Due to rapid development, the current storage method only supports the [Cloudreve API](https://github.com/cloudreve/Cloudreve). In the future, more storage methods will be added, such as S3, Discord, Telegram, Local storage, Google Drive, etc.

1. Clone this project using the following command:

   ```
   git clone https://github.com/Whitedragon115/Disbase-V4.git
   ```

2. Rename `.env.example` and `config.json.example` to `.env` and `config.json`. You can also run the commands below:

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

3. Install dependencies:

   ```bash
   npm install
   ```

4. Configure your `.env` and `config.json` files with your Discord bot token and storage method settings.

5. Run database migrations (you can also switch the database to SQLite):

   ```bash
   npx prisma migrate dev
   ```

6. Start the bot:

   ```bash
   node index.js
   ```

---

# Code Documentation

This section explains the file upload workflow and how it works.

## Upload Feature

### Uploader Process

> `/utils/newUploader.js`

1. When a user uploads files to the `UploadChannel`, an event is triggered. The process checks whether the message contains attachments.
2. Attachment data is parsed, and concurrent processing is used to [download files](#downloader-process) to reduce the chance of rate limiting.
3. User files are reuploaded using the configured storage method.
4. All uploaded file links are collected.
5. Uploaded file information is sent to the `SenderChannel`.

### Downloader Process

> `/utils/uploader/uploader.js`

1. Generate a UUID for the file.
2. Write file information to the database.
3. Generate a file thumbnail using the [`thumbnailCreator`](#thumbnail-creator) function.
4. Reupload the file using the user’s selected storage method.
5. Remove the local file.

### Thumbnail Creator

> `/utils/uploader/thumbnail.js`

#### Image Thumbnails

1. Generate a `128x128` thumbnail (`fix cover`, `percent 10`, `JPEG`) using `npm image-thumbnail`.
2. Upload the file to the Discord `UploadLoggingChannel` and retrieve the attachment URL.
3. Return the attachment URL.

#### Video Thumbnails

1. Generate a `128x128` thumbnail (`fix cover`, `PNG`) using `ffmpeg`, `ffmpeg-static`, and `ffprobe-static`.
2. Upload the file to the Discord `UploadLoggingChannel` and retrieve the attachment URL.
3. Return the attachment URL.

#### Other Files

1. Return a file icon from the dataset.

All icons were downloaded from [Iconify](https://iconify.design/docs/api/queries.html), converted into images, and uploaded to my CDN.

Feel free to use my CDN. If you find it slow, consider using the AI script located under `/utils/uploader/data`.

#### Why Upload to Discord

After testing, I found that using external links slows down thumbnail loading and can sometimes break entirely. Reuploading files to Discord allows Discord to use its own media proxy, which significantly improves thumbnail loading speed.

---

### Cloudreve Upload Process

> `/function/cloudreve.js`

#### Uploading Files

1. Create an upload session and obtain the upload session ID.
2. Upload the file using the obtained upload session ID.

#### Direct Link

1. Request files using the direct link array.
2. Return the response.

#### Access Token

1. During initialization, a new access token and refresh token are obtained using the username and password.
2. If an upload fails, the system attempts to refresh the access token automatically.

---

# To be fix
- Wrong logic in newUploader.js
  Not compactible with multiple storage system