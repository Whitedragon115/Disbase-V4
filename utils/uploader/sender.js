const { EmbedBuilder } = require("@discordjs/builders");
const { sizeFormat } = require("../../function/tool");

async function fileSender(data, directLinks, channel) {

    const fileName = data.attachment.name.length > 43 ? `${data.attachment.name.slice(0, 40)}...` : data.attachment.name;
    const fileType = data.attachment.contentType.split('/')[1];
    const fileSize = sizeFormat(data.attachment.size);
    const fileLink = directLinks.link;
    const thumbnailLink = data.thumbnail;
    const fileCreateTime = data.unixTime;

    const embed = new EmbedBuilder()
        .setTitle(fileName)
        .setThumbnail(thumbnailLink)
        .addFields(
            { name: 'File Type', value: `\`${fileType.toUpperCase()}\``, inline: true },
            { name: 'File Size', value: fileSize, inline: true },
            { name: 'Direct Link', value: `\`\`\`${fileLink}\`\`\`` },
            { name: 'Upload Time', value: `<t:${fileCreateTime}:F>`, inline: true },
            { name: 'Open', value: `[Click Here](${fileLink})`, inline: true },
        )

    return await channel.send({ embeds: [embed] })
}


module.exports = {
    fileSender
}