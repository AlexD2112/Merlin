//Admin command

const { SlashCommandBuilder } = require('discord.js');
const char = require('../../char'); // Importing the database manager

module.exports = {
    data: new SlashCommandBuilder()
        .setName('takeitemsfromplayer')
        .setDescription('Take items from a player')
        .setDefaultMemberPermissions(0)
        .addStringOption(option => option.setName('player').setDescription('The player to take items from').setRequired(true))
        .addStringOption(option => option.setName('item').setDescription('The item to take').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('The amount of items to take').setRequired(true)),
    async execute(interaction) {
        const player = interaction.options.getString('player');
        const item = interaction.options.getString('item');
        const amount = interaction.options.getInteger('amount');
        const response = await char.addItemToPlayer(player, item, -amount);

        if (response == true) {
            return interaction.reply(`Took ${amount} ${item} from ${player}`);
        } else {
            return interaction.reply('Something went wrong');
        }
    },
};