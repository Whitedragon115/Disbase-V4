const { AttachmentBuilder } = require('discord.js');
const imageThumbnail = require('image-thumbnail')
const fs = require('fs');
const path = require('path');
const { sizeFormat } = require('../../function/tool');
const data = require('./data/icons.json')

const ffmpeg = require('fluent-ffmpeg');
const { mkdirSync, existsSync } = require('fs');
const logger = require('../../function/log');

ffmpeg.setFfmpegPath(require('ffmpeg-static'));
ffmpeg.setFfprobePath(require('ffprobe-static').path);

async function thumbnailCreator(filepath, attachment, channel) {
    const thumbnail = await imageThumbnail(filepath, {
        percentage: 10,
        responseType: 'buffer',
        jpegOptions: { force: true, quality: 100 },
        height: 128,
        width: 128,
        fit: 'cover'
    });

    fs.writeFileSync(filepath + '_thumb.jpeg', thumbnail);
    const thumb = fs.statSync(filepath + '_thumb.jpeg');
    const thumbnailAttachment = new AttachmentBuilder(filepath + '_thumb.jpeg');
    const thumbMsg = `- \`Name: ${attachment.name}\`\n- \`Size: ${sizeFormat(thumb.size)}\``;
    const thumbnailCdn = await channel.send({ content: thumbMsg, files: [thumbnailAttachment] })
    fs.unlinkSync(filepath + '_thumb.jpeg');
    return thumbnailCdn.attachments.first().url;
}

function findThumbnailLink(fileType) {
    return data.icons.fileTypes[fileType] || "https://cloud.dragoncode.dev/f/yBXCL/file.png";
}

async function videoThumbnailCreator(filepath, attachment, channel) {
    const thumb = await new Promise((resolve, reject) => {
        const outputPath = filepath + '_thumb.png';
        ffmpeg(filepath)
            .outputOptions('-vf', 'scale=128:128:force_original_aspect_ratio=increase,crop=128:128', '-frames:v', '1')
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', err => logger.error(`Error creating video thumbnail: ${err}`))
            .run();
    })

    const thumbnailAttachment = new AttachmentBuilder(thumb);
    const thumbStat = fs.statSync(thumb);
    const thumbMsg = `- \`Name: ${attachment.name}\`\n- \`Size: ${sizeFormat(thumbStat.size)}\``;
    const thumbnailCdn = await channel.send({ content: thumbMsg, files: [thumbnailAttachment] })
    fs.unlinkSync(thumb);
    return thumbnailCdn.attachments.first().url;
}

module.exports = {
    thumbnailCreator,
    findThumbnailLink,
    videoThumbnailCreator
}