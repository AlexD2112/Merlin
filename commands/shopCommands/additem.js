const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const shop = require('../../shop'); // Importing the database manager

module.exports = {
	data: new SlashCommandBuilder()
		.setName('additem')
		.setDescription('Add item to shop'),
	async execute(interaction) {
		// Create the modal
		const modal = new ModalBuilder()
			.setCustomId('additemmodal')
			.setTitle('Add Item to Shop');

		// Create the text input components
		const itemNameInput = new TextInputBuilder()
			.setCustomId('itemname')
			.setLabel('Item Name')
			.setStyle(TextInputStyle.Short);

		const itemCostInput = new TextInputBuilder()
			.setCustomId('itemcost')
			.setLabel('Item Cost')
			.setStyle(TextInputStyle.Short);

		const itemDescriptionInput = new TextInputBuilder()
			.setCustomId('itemdescription')
			.setLabel('Item Description')
			.setStyle(TextInputStyle.Paragraph);

		// Create action rows for each input
		const nameActionRow = new ActionRowBuilder().addComponents(itemNameInput);
		const costActionRow = new ActionRowBuilder().addComponents(itemCostInput);
		const descriptionActionRow = new ActionRowBuilder().addComponents(itemDescriptionInput);

		// Add the action rows to the modal
		modal.addComponents(nameActionRow, costActionRow, descriptionActionRow);

		// Show the modal to the user
		await interaction.showModal(modal);
	},
};
