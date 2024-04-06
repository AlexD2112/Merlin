//ADMIN COMMAND
const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const shop = require('../../shop'); // Importing shop

module.exports = {
	data: new SlashCommandBuilder()
		.setName('editrecipe')
		.setDescription('Edit recipe for an item')
		.setDefaultMemberPermissions(0)
        .addStringOption((option) =>
			option.setName('itemname')
				.setDescription('The item name')
				.setRequired(true)
		),
	async execute(interaction) {
    let itemName = interaction.options.getString('itemname');
    //Get default values from shop.editUseCasePlaceholders
    const arrayPlaceholders = await shop.editRecipePlaceholders(itemName);
    itemName = arrayPlaceholders[0];
    const itemTakes = arrayPlaceholders[1];
    const itemCrafttime = arrayPlaceholders[2];
        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('addrecipemodal')
            .setTitle('Add A Recipe');

        // Create the text input components
        const itemNameInput = new TextInputBuilder()
            .setCustomId('itemname')
            .setLabel('Item Name')
            .setValue(itemName)
            .setStyle(TextInputStyle.Short);
        
        const itemTakesInput = new TextInputBuilder()
            .setCustomId('itemtakes')
            .setLabel('What items are required to craft this item?')
            .setPlaceholder('ITEM:AMOUNT;\nITEM2:AMOUNT2;')
            .setValue(itemTakes)
            .setStyle(TextInputStyle.Paragraph);
            
        const itemCrafttimeInput = new TextInputBuilder()
            .setCustomId('itemcrafttime')
            .setLabel('Item craft time in hours')
            .setValue(itemCrafttime + "")
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
