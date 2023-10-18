const { SlashCommandBuilder } = require('discord.js');
const char = require('../../char'); // Importing the database manager

module.exports = {
	data: new SlashCommandBuilder()
		.setName('incomes')
		.setDescription('Collect your daily incomes'),
	async execute(interaction) {
        const userID = interaction.user.tag;
		var incomeListString = await char.incomes(userID);
		await interaction.reply(incomeListString);
	},
};