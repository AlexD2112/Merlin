const { SlashCommandBuilder } = require('discord.js');
const clientManager = require('../../clientManager'); // Importing the database manager

module.exports = {
	data: new SlashCommandBuilder()
		.setName('createhouseforums')
		.setDescription('Create house forums')
        .setDefaultMemberPermissions(0),
	async execute(interaction) {
		try {
            await interaction.deferReply({ ephemeral: true });
            await clientManager.createHouseForums();
            await interaction.editReply({ content: "House forums created", ephemeral: true });
        } catch (error) {
            console.error("Failed to initialize select menu:", error);
            await interaction.reply({ content: "Failed to set the select menu. Please try again.", ephemeral: true });
        }
	},
};