const shop = require('./shop');
const char = require('./char')

// MODALS
exports.addItem = async (interaction) => {
  // Get the data entered by the user
  const itemName = interaction.fields.getTextInputValue('itemname');
  const itemIcon = interaction.fields.getTextInputValue('itemicon');
  const itemCost = interaction.fields.getTextInputValue('itemcost');
  const itemDescription = interaction.fields.getTextInputValue('itemdescription');
  
  colonCounter = 0;
  for (let i = 0; i < itemIcon.length; i++) {
    if (itemIcon[i] == ":") {
      console.log(itemIcon, i, colonCounter);
      console.log(itemIcon[i]);
      colonCounter++;
      if (colonCounter >= 3) {
        await interaction.reply(`Item creation failed. Only one icon allowed;`);
        return;
      }
    }
  }

  // Call the addItem function from the Shop class with the collected information
  if (itemName && parseInt(itemCost)) {
    shop.addItem(itemName, itemIcon, parseInt(itemCost), itemDescription);
    await interaction.reply(`Item '${itemName}' has been added to the item list. Use /shoplayout or ping Alex to add to shop.`);
  } else {
    // Handle missing information
    await interaction.reply('Item creation failed. Please provide a name and integer cost.');
  }
};

exports.addUseCase = async (interaction) => {
  // Get the data entered by the user
  const itemName = interaction.fields.getTextInputValue('itemname');
  const itemUseType = interaction.fields.getTextInputValue('itemusetype');
  const itemGives = interaction.fields.getTextInputValue('itemgives');
  let itemTakes;
  if (interaction.fields.getField("itemtakes").value) {
    itemTakes = interaction.fields.getTextInputValue('itemtakes');
  } else {
    itemTakes = "Empty Field";
  }

  // Call the addItem function from the Shop class with the collected information
  if (itemName && itemUseType && itemGives) {
    let toReturn;
    if (itemTakes != "Empty Field") {
      toReturn = await shop.addUseCaseWithCost(itemName, itemUseType, itemGives, itemTakes);
    } else {
      toReturn = await shop.addUseCase(itemName, itemUseType, itemGives);
    }
    interaction.reply(toReturn);
  } else {
    // Handle missing information
    await interaction.reply('Item use creation failed. Please give a name, use type and record what using the item gives.');
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

exports.shopLayout = async (interaction) => {
  const categoryToEdit = interaction.fields.getTextInputValue('categorytoedit');
  const layoutString = interaction.fields.getTextInputValue('layoutstring');

  await interaction.reply(await shop.shopLayout(categoryToEdit, layoutString));
}

//BUTTONS
exports.shopSwitch = async (interaction) => {
  let [edittedEmbed, rows] = await shop.createShopEmbed(interaction.customId[11]);
  await interaction.update({ embeds: [edittedEmbed], components: rows});
}
