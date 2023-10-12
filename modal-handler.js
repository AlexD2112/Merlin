const shop = require('./shop');

// Save Function - save(UserName, DataToBeSaved)
exports.addItem = async (interaction) => {
  // Get the data entered by the user
  const itemName = interaction.fields.getTextInputValue('itemname');
  const itemCost = interaction.fields.getTextInputValue('itemcost');
  const itemDescription = interaction.fields.getTextInputValue('itemdescription');

  // Call the addItem function from the Shop class with the collected information
  if (itemName && parseInt(itemCost)) {
    shop.addItem(itemName, parseInt(itemCost), itemDescription);
    await interaction.reply(`Item '${itemName}' has been added to the shop.`);
  } else {
    // Handle missing information
    await interaction.reply('Item creation failed. Please provide a name and integer cost.');
  }
};
