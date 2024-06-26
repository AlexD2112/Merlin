const { SlashCommandBuilder } = require('discord.js');
const admin = require('../../admin'); // Importing the database manager

module.exports = {
	data: new SlashCommandBuilder()
		.setName('allmaps')
		.setDescription('List all maps')
		.setDefaultMemberPermissions(0),
	async execute(interaction) {
        await interaction.deferReply();
		try {
            let reply = await admin.allMaps(interaction.channel);
            if (typeof(reply) == 'string') {
                await interaction.editReply(reply);
            } else {
                let embed = reply;
                await interaction.editReply(({ embeds: [embed]}));
            }
        } catch (error) {
            console.error("Failed to get incomes", error);
            await interaction.editReply({ content: "An error was caught. Contact Alex.", ephemeral: true });
        }
	},
};