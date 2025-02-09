//Admin command

const { SlashCommandBuilder } = require('discord.js');
const char = require('../../char'); // Importing the database manager

module.exports = {
    data: new SlashCommandBuilder()
        .setName('additemstorole')
        .setDescription('Adds items to a role')
        .setDefaultMemberPermissions(0)
        .addRoleOption(option => option.setName('role').setDescription('The role to add items to').setRequired(true))
        .addStringOption(option => option.setName('item').setDescription('The item to add').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('The amount of items to add').setRequired(true)),
    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const item = interaction.options.getString('item');
        const amount = interaction.options.getInteger('amount');

        console.log(role)
        const response = await char.addItemToRole(role, item, amount);

        if (typeof response == 'array') {
            return interaction.reply(response);
        } else {
            return interaction.reply(response);
        }
    },
};