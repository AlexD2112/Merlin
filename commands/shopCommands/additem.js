const { SlashCommandBuilder } = require('discord.js');
const shop = require('../../shop'); // Importing the database manager

module.exports = {
	data: new SlashCommandBuilder()
		.setName('additem')
		.setDescription('Add item to shop')
		.addStringOption((option) =>
		option.setName('itemname')
			.setDescription('The item name')
			.setRequired(true)
		)
		.addStringOption((option) =>
		option.setName('itemcost')
			.setDescription('The item cost')
			.setRequired(true)
		),
	execute(interaction) {
		const itemName = interaction.options.getString('itemname');
		const itemCost = interaction.options.getString('itemcost');

		(async () => {
			await interaction.reply(`Item '${itemName}' with cost '${itemCost}' has been added to the shop.`);
			// Call the addItem function from the Shop class
			shop.addItem(itemName, itemCost);
		})()
	},
};