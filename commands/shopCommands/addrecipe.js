//ADMIN COMMAND
const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
//const shop = require('../../shop'); // Importing shop

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addrecipe')
        .setDefaultMemberPermissions(0)
        .setDescription('Add a recipe for the item')
        .setDefaultMemberPermissions(0),
    async execute(interaction) {
        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('addrecipemodal')
            .setTitle('Add A Recipe');

        // Create the text input components
        const itemNameInput = new TextInputBuilder()
            .setCustomId('itemname')
            .setLabel('Item Name')
            .setStyle(TextInputStyle.Short);
        
        const itemTakesInput = new TextInputBuilder()
            .setCustomId('itemtakes')
            .setLabel('What items are required to craft this item?')
            .setPlaceholder('ITEM:AMOUNT;\nITEM2:AMOUNT2;')
            .setStyle(TextInputStyle.Paragraph);
            
        const itemCrafttimeInput = new TextInputBuilder()
            .setCustomId('itemcrafttime')
            .setLabel('Item craft time in hours')
            .setStyle(TextInputStyle.Short);

        //Create action rows for each input
        const nameActionRow = new ActionRowBuilder().addComponents(itemNameInput);
        const takesActionRow = new ActionRowBuilder().addComponents(itemTakesInput);
        const crafttimeActionRow = new ActionRowBuilder().addComponents(itemCrafttimeInput);

        // Add the action rows to the modal
        modal.addComponents(nameActionRow, takesActionRow, crafttimeActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    },
};
