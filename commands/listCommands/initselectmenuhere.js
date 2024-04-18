const { SlashCommandBuilder } = require('discord.js');
const shop = require('../../shop'); // Importing the database manager

module.exports = {
	data: new SlashCommandBuilder()
		.setName('initselectmenuhere')
		.setDescription('Initialize a city select menu here')
		.setDefaultMemberPermissions(0),
	execute(interaction) {
		(async () => {
			//shop.editMenu returns an array with the first element being the replyEmbed and the second element being the rows
			shop.updateItemVersion(itemName);
            await interaction.reply({ content: "Set! Select menu should appear just below this message", ephemeral: true });
		})()
	},
};