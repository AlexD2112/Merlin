const { SlashCommandBuilder } = require('discord.js');
const shop = require('../../shop'); // Importing the database manager

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription('List shop items'),
	async execute(interaction) {
			const itemListString = await shop.shop();
			console.log("DATA");
			console.log(itemListString);
			await interaction.reply(itemListString);
	},
};