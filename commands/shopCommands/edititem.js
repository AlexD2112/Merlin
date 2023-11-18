//ADMIN COMMAND
const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const shop = require('../../shop'); // Importing shop

module.exports = {
	data: new SlashCommandBuilder()
		.setName('edititem')
		.setDescription('Edit item in shop')
		.setDefaultMemberPermissions(0)
        .addStringOption((option) =>
			option.setName('itemname')
				.setDescription('The item name')
				.setRequired(true)
		),
	async execute(interaction) {
        let itemName = interaction.options.getString('itemname');
		//Get default values from shop.editUseCasePlaceholders
		const arrayPlaceholders = await shop.editItemPlaceholders(itemName);
		itemName = arrayPlaceholders[0];
		const itemIcon = arrayPlaceholders[1];
		const itemCost = arrayPlaceholders[2];
		const itemDescription = arrayPlaceholders[3];
		const itemCategory = arrayPlaceholders[4];

		// Create the modal
		const modal = new ModalBuilder()
			.setCustomId('additemmodal')
			.setTitle('Add Item to Shop');

		// Create the text input components
		const itemNameInput = new TextInputBuilder()
			.setCustomId('itemname')
			.setLabel('Item Name')
            .setValue(itemName)
			.setStyle(TextInputStyle.Short);
		
		const itemIconInput = new TextInputBuilder()
			.setCustomId('itemicon')
			.setLabel('Item Icon- Emoji to go before name in shop')
            .setValue(itemIcon)
			.setStyle(TextInputStyle.Short);

		const itemCostInput = new TextInputBuilder()
			.setCustomId('itemcost')
			.setLabel('Item Cost')
            .setValue(itemCost) 
			.setStyle(TextInputStyle.Short);

		const itemDescriptionInput = new TextInputBuilder()
			.setCustomId('itemdescription')
			.setLabel('Item Description')
            .setValue(itemDescription)
			.setStyle(TextInputStyle.Paragraph);

		const itemCategoryInput = new TextInputBuilder()
			.setCustomId('itemcategory')
			.setLabel('Item Category')
            .setValue(itemCategory)
			.setStyle(TextInputStyle.Short);

		// Create action rows for each input
		const nameActionRow = new ActionRowBuilder().addComponents(itemNameInput);
		const iconActionRow = new ActionRowBuilder().addComponents(itemIconInput);
		const costActionRow = new ActionRowBuilder().addComponents(itemCostInput);
		const descriptionActionRow = new ActionRowBuilder().addComponents(itemDescriptionInput);
		const categoryActionRow = new ActionRowBuilder().addComponents(itemCategoryInput);

		// Add the action rows to the modal
		modal.addComponents(nameActionRow, iconActionRow, costActionRow, descriptionActionRow, categoryActionRow);

		// Show the modal to the user
		await interaction.showModal(modal);
	},
};
