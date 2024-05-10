const { SlashCommandBuilder } = require('discord.js');
const admin = require('../../admin'); // Importing the database manager

module.exports = {
	data: new SlashCommandBuilder()
		.setName('allincomes')
		.setDescription('List all incomes')
		.setDefaultMemberPermissions(0),
	async execute(interaction) {
		try {
            let reply = await admin.allIncomes();
            if (typeof(reply) == 'string') {
                await interaction.reply(reply);
            } else {
                await interaction.reply({ embeds: [reply] });
            }
        } catch (error) {
            console.error("Failed to get incomes", error);
            await interaction.reply({ content: "An error was caught. Contact Alex.", ephemeral: true });
        }
	},
};