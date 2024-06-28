const { SlashCommandBuilder } = require('discord.js');
const admin = require('../../admin'); // Importing the database manager

module.exports = {
	data: new SlashCommandBuilder()
		.setName('removemap')
		.setDescription('Remove a map. This is destructive and cannot be undone.')
		.setDefaultMemberPermissions(0)
		.addStringOption((option) =>
		option.setName('map')
			.setDescription('The map name')
			.setRequired(true)
		),
	execute(interaction) {
		const mapName = interaction.options.getString('map');

		(async () => {
            let returnString = await admin.removeMap(mapName);

			if (returnString) {
				await interaction.reply(returnString);
			} else {
				await interaction.reply(`Map '${mapName}' has been removed.`);
			}
			// Call the addItem function from the Shop class
		})()
	},
};