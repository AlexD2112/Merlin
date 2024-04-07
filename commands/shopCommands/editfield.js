const { SlashCommandBuilder } = require('discord.js');
const shop = require('../../shop'); // Importing the database manager

///editfield <field number> <new value>
module.exports = {
	data: new SlashCommandBuilder()
        .setName('editfield')
        .setDescription('Edit a field in the shop')
        .setDefaultMemberPermissions(0)
        .addStringOption((option) =>
            option.setName('itemname')
                .setDescription('The item name')
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option.setName('fieldnumber')
                .setDescription('The field number')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('newvalue')
                .setDescription('The new value')
                .setRequired(true)
        ),
    async execute(interaction) {
        const itemName = interaction.options.getString('itemname');
        const fieldNumber = interaction.options.getInteger('fieldnumber');
        const newValue = interaction.options.getString('newvalue');

        let reply = await shop.editField(itemName, fieldNumber, newValue);
        await interaction.reply(reply);
    }
};