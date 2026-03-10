const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../function/log');
const { refresh } = require('../../function/cloudreve');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cloudreve')
        .setDescription('Checks Cloudreve status')
        .addSubcommand(subcommand => subcommand
            .setName('refresh')
            .setDescription('Manually refresh Cloudreve access token')
        ),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @param {import('discord.js').Client & {rcon: import('rcon-client').Rcon}} client
     */

    async execute(interaction, client) {

        await interaction.deferReply({ ephemeral: true });

        await refresh().then(async (data) => {
            logger.info('Cloudreve access token refreshed successfully');
            await interaction.editReply({ content: 'Cloudreve access token refreshed successfully!' });
            await interaction.followUp({ content: `New Access Token: \`${data.data.access_token}\`\nNew Refresh Token: \`${data.data.refresh_token}\``, ephemeral: true });
        }).catch(async (err) => {
            logger.error(`Failed to refresh Cloudreve access token: ${err}`);
            await interaction.editReply({ content: 'Failed to refresh Cloudreve access token. Check logs for details.' });
        })

    }
}