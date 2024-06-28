const { SlashCommandBuilder } = require('discord.js');
const admin = require('../../admin'); // Importing the database manager

module.exports = {
	data: new SlashCommandBuilder()
		.setName('editmapmenu')
        .setDescription('Edit a map')
        .setDefaultMemberPermissions(0)
        .addStringOption((option) =>
            option.setName('map')
                .setDescription('The map to edit')
                .setRequired(true)
        ),
    async execute(interaction) {
        const role = interaction.options.getString('map');

        (async () => {
            //addIncome(roleID, incomeString)
            let reply = await admin.editMapMenu(role, interaction.user.tag);
            if (typeof(reply) == 'string') {
                await interaction.reply(reply);
            } else {
                await interaction.reply({ embeds: [reply] });
            }
            // Call the useItem function from the Shop class
        })()
    }
};