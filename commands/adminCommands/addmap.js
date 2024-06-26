const { SlashCommandBuilder } = require('discord.js');
const admin = require('../../admin'); // Importing the database manager

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addmap')
		.setDescription('Add a map')
		.setDefaultMemberPermissions(0)
        .addStringOption(option =>
            option.setName('map')
                .setDescription('The name of the map')
                .setRequired(true)),
	async execute(interaction) {
		try {
            let map = interaction.options.getString('map');
            let guild = interaction.guild;
            // Call the method with the channel object directly
            let reply = await admin.addMap(map, guild);
            if (reply == "Map already exists") {
                await interaction.reply({ content: "Map " + map + " already exists", ephemeral: true });
            } else if (reply != null) {
                await interaction.reply({ content: reply, ephemeral: false });
            } else {
                await interaction.reply({ content: "An error has arisen", ephemeral: true });
            }
        } catch (error) {
            console.error("Failed to add map menu:", error);
            await interaction.reply({ content: "Failed to add the map. Please try again.", ephemeral: true });
        }
	},
};