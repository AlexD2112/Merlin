const { SlashCommandBuilder } = require('discord.js');
const char = require('../../char'); // Importing the database manager

module.exports = {
	data: new SlashCommandBuilder()
		.setName('myincomeslist')
		.setDescription('List your daily incomes'),
	async execute(interaction) {
        const userID = interaction.user.tag;
		var incomeListString = await char.incomeList(userID);
		incomeListString += "\n\n Warning: Your incomes have not been collected. Use /incomes for that";
		await interaction.reply(incomeListString);
	},
};