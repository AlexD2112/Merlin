//Passes saleID to inspectSale function in marketplace.js

const { SlashCommandBuilder } = require('@discordjs/builders');
const marketplace = require('../../marketplace');
const dataGetters = require('../../dataGetters');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('showsales')
        .setDescription('Show a players sales')
        .addUserOption((option) =>
            option.setName('player')
                .setDescription('Player to show sales for')
                .setRequired(false)
        ),
    async execute(interaction) {
        let player = interaction.options.getUser('player');
        console.log(player);
        if (!player) {
            player = interaction.user;
        }

        player = await dataGetters.getCharFromNumericID(player.id);

        console.log(player);

        let replyString = await marketplace.showSales(player);
        //if embed, display embed, otherwise display string
        if (typeof (replyString) == 'string') {
            await interaction.reply(replyString);
        } else {
            await interaction.reply({ embeds: [replyString] });
        }
    },
};
