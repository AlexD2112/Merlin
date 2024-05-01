const { SlashCommandBuilder } = require('discord.js');
const shop = require('../../shop'); // Importing the database manager

module.exports = {
	data: new SlashCommandBuilder()
		.setName('updateallitemversions')
		.setDescription('Update the version of all items')
		.setDefaultMemberPermissions(0),
	execute(interaction) {

		(async () => {
			//shop.editMenu returns an array with the first element being the replyEmbed and the second element being the rows
			let reply = await shop.updateAllItemVersions();
            interaction.reply(reply);
		})()
	},
};