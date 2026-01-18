const { Attachment, AttachmentBuilder, TextChannel } = require("discord.js")
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const { UploadStorageSystem } = require('../../config.json')

const { uuid, sizeFormat } = require("../../function/tool");
const logger = require("../../function/log");
const tmpDownloadPath = './tmp/'

const { upload } = require("../../function/cloudreve");
const { newFile } = require("../../function/prisma");
const { unixTimeStamp } = require("../../function/time");
const { thumbnailCreator, findThumbnailLink, videoThumbnailCreator } = require("./thumbnail");

async function downloader(url, filename) {
    const filepath = path.join(__dirname, tmpDownloadPath, uuid('xxxx') + path.extname(filename));

    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filepath));
        writer.on('error', reject);
    });
}

/**
 * @param {TextChannel} channel
 * @param {Attachment} attachment 
 */

async function userUploade(attachment, channel) {
    let data = {};
    const filepath = await downloader(attachment.url, attachment.name)

    const uuidStr = uuid('xxxx-xxxxxxxxxxxx-xxxx')
    const time = new Date();

    data.unixTime = unixTimeStamp(time.getTime())

    await newFile(uuidStr, {
        size: fs.statSync(filepath).size,
        name: attachment.name,
        time: time
    })

    if (!attachment.contentType) attachment.contentType = 'other/' + path.extname(attachment.name).substring(1).toUpperCase();
    if (attachment.contentType.startsWith('image/') || attachment.contentType.startsWith('video/')) {
        data.fileType = attachment.contentType.startsWith('image/') ? 'image' : 'video';
        if (data.fileType === 'image') {
            data.thumbnail = await thumbnailCreator(filepath, attachment, channel);
        } else if (data.fileType === 'video') {
            data.thumbnail = await videoThumbnailCreator(filepath, attachment, channel);
        }
    } else {
        data.thumbnail = findThumbnailLink(path.extname(attachment.name).substring(1).toLowerCase());
        data.fileType = 'other';
    }

    switch (UploadStorageSystem) {
        case 'cloudreve':
            data.data = await upload(filepath, attachment, uuidStr)
            data.attachment = attachment
            break;
        default:
            throw new Error(`Unsupported Upload Method: ${UploadStorageSystem}`);
    }

    if (!data.data.success) return logger.error(`Upload failed for ${attachment.name}`);
    fs.unlinkSync(filepath);

    return data;
}



module.exports = {
    userUploade
}