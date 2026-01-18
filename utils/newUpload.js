const { Events, EmbedBuilder } = require("discord.js");
const { sleep } = require("../function/time");
const { uuid, sizeFormat } = require("../function/tool");
const { UploadChannelId, UploadConnurrency, ImageOutputChannelId, VideoOutputChannelId, OtherOutputChannelId, UploadLogginChannelId } = require('../config.json');
const { userUploade } = require("./uploader/uploader");
const logger = require("../function/log");
const { getDirectLink } = require("../function/cloudreve");
const { fileSender } = require("./uploader/sender");

module.exports = {
    name: Events.MessageCreate,

    /**
     * @param {import('discord.js').Message} message
     */

    async execute(message) {

        if (message.author.bot) return;
        if (message.channel.id !== UploadChannelId) return;

        if (message.attachments.size == 0) {
            await message.react('❌');
            return await message.reply({ content: 'No attachments found. Please attach images to upload.', allowedMentions: { repliedUser: false } }).then(msg => {
                setTimeout(() => {
                    msg.delete();
                    message.delete();
                }, 5000);
            });
        }

        await message.react('⏳');

        const loggingChannel = message.guild.channels.cache.get(UploadLogginChannelId)

        const attachments = message.attachments
        const concurrency = UploadConnurrency || 5;
        let index = 0;

        async function processAttachment() {
            const res = [];
            while (true) {
                try {
                    const curIndex = index++;
                    if (curIndex >= message.attachments.size) break

                    const att = attachments.at(curIndex)
                    res.push(await userUploade(att, loggingChannel));

                } catch (err) {
                    logger.error(`Error processing attachment: ${err}`);
                }
            }
            return res;
        }

        const workers = [];
        for (let i = 0; i < concurrency; i++) workers.push(processAttachment());
        const workerResults = (await Promise.all(workers)).flat();

        const links = await getDirectLink(workerResults.map(res => res.data.uri))

        await message.react('✅');
        await sleep(1500);
        await message.delete();

        // const embed = new EmbedBuilder()
        //     .setTitle('Uploaded Success')
        //     .addFields(
        //         { name: 'Images', value: `${imagesType}`, inline: true },
        //         { name: 'Videos', value: `${videosType}`, inline: true },
        //         { name: 'Others', value: `${otherType}`, inline: true },
        //         { name: 'Use Storage', value: sizeFormat(workerResults.reduce((acc, cur) => acc + (cur.attachment.size || 0), 0)), inline: true },
        //     )
        //     .setColor('#00FF00')

        // await message.channel.send({ embeds: [embed] }).then(msg => {
        //     setTimeout(() => {
        //         msg.delete();
        //     }, 5000);
        // });

        const imageSenderChannel = message.guild.channels.cache.get(ImageOutputChannelId);
        const videoSenderChannel = message.guild.channels.cache.get(VideoOutputChannelId);
        const otherSenderChannel = message.guild.channels.cache.get(OtherOutputChannelId);

        let i = 0;

        for (const res of workerResults) {
            switch (res.fileType) {
                case 'image':
                    await fileSender(res, links[i], imageSenderChannel);
                    break;
                case 'video':
                    await fileSender(res, links[i], videoSenderChannel);
                    break;
                case 'other':
                    await fileSender(res, links[i], otherSenderChannel);
                    break;
                default:
                    logger.warn(`Unknown file type: ${res.fileType} for file ${res.attachment.name}`);

            }

            i++;
        }
    }
}