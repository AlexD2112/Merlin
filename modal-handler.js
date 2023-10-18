const shop = require('./shop');
const char = require('./char')

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

exports.newChar = async (interaction) => {
  // Get the data entered by the user
  const userID = interaction.user.tag;
  const charName = interaction.fields.getTextInputValue('charname');
  const charBio = interaction.fields.getTextInputValue('charbio');

  const eastAngliaRole = interaction.guild.roles.cache.find(role => role.name === "East Anglia");
  const eastAngliaID = eastAngliaRole.id;
  const gwyneddRole = interaction.guild.roles.cache.find(role => role.name === "Gwynedd");
  const gwyneddID = gwyneddRole.id;
  const wessexRole = interaction.guild.roles.cache.find(role => role.name === "Wessex");
  const wessexID = wessexRole.id;

  var userKingdom = "Error";

  // Check the user's roles
  const userRoles = interaction.member.roles.cache;
  if (userRoles.has(eastAngliaID)) {
    userKingdom = "East Anglia";
  }
  if (userRoles.has(gwyneddID)) {
    if (userKingdom != "Error") {
      userKingdom = "WHY DO YOU HAVE TWO KINGDOMS? SERSKI THIS IS A PROBLEM WE DO NOT ALLOW DUAL CITIZENS HERE";
    } else {
      userKingdom = "Gwynedd";
    }
  } else if (userRoles.has(wessexID)) {
    if (userKingdom != "Error") {
      userKingdom = "WHY DO YOU HAVE TWO KINGDOMS? SERSKI THIS IS A PROBLEM WE DO NOT ALLOW DUAL CITIZENS HERE";
    } else {
      userKingdom = "Wessex";
    }
  }

  // Call the newChar function from the char class with the info
  if (charName && charBio) {
    char.newChar(userID, charName, charBio, userKingdom);
    await interaction.reply(`Character '${charName}' has been created in ${userKingdom}.`);
  } else {
    // Handle missing information
    await interaction.reply('Character creation failed. Please provide a name and bio.');
  }
};
