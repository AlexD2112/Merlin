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
            map = await admin.addMap(map, guild);
            
            // Respons with an ephemeral message saying that map should appear below
            await interaction.reply({ content: 'Map menu should appear below', ephemeral: true });

            // Show the map menu
            let reply = await admin.editMapMenu(map, interaction.user.tag);
            if (typeof(reply) == 'string') {
                await interaction.followUp(reply);
            } else {
                await interaction.followUp({ embeds: [reply]});
            }
        } catch (error) {
            console.error("Failed to add map menu:", error);
            await interaction.reply({ content: "Failed to add the map. Please try again.", ephemeral: true });
        }
	},
};