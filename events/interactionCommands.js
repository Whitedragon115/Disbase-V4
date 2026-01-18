const { Events, EmbedBuilder } = require('discord.js');
const logger = require('../function/log')

module.exports = {
	name: Events.InteractionCreate,

	/**
	 * @param {import('discord.js').Interaction} interaction
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {import('discord.js').Client} client
	 */

	async execute(interaction, client) {


		if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;

		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return logger.warn(`No command matching ${interaction.commandName} was found.`);

		try {

			if (interaction.isAutocomplete()) return await command.autocomplete(interaction, client);
			if (interaction.isChatInputCommand()) {
				return await command.execute(interaction, client);
			}

		} catch (error) {
			const replied = interaction.replied || interaction.deferred;

			logger.error(`Error executing command ${interaction.commandName}`)
			logger.error(error.stack);

			const embed = new EmbedBuilder()
				.setTitle('Error ❌')
				.setDescription('There was an error while executing this command.')
				.setColor(0xFF0000);

			return replied ?
				await interaction.editReply({ embeds: [embed] }) :
				await interaction.reply({ embeds: [embed], flags: 'Ephemeral' });

		}

	},
};