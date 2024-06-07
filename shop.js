const dbm = require('./database-manager'); // Importing the database manager
const Discord = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const clientManager = require('./clientManager');
const dataGetters = require('./dataGetters');

class shop {
  //Declare constants for class 
  static infoOptions = ['Name', 'Icon', 'Category', 'Image', 'Description'];
  static shopOptions = ['Price (#)', 'Need Role', 'Give Role', 'Take Role', 'Quantity (#)', 'Channels'];
  static usageOptions = [
      'Is Usable (Y/N)', 'Removed on Use (Y/N)', 'Can Use Multiple (Y/N)', 'Need Any Of Roles', 'Need All Of Roles', 'Give Role', 'Take Role',
      'Show Image', 'Show Message', 'Give/Take Money (#)', 'Cooldown in Hours (#)',
      'Give Item', 'Give Item 2', 'Give Item 3', 'Give Item 4', 'Give Item 5',
      'Take Item', 'Take Item 2', 'Take Item 3', 'Take Item 4', 'Take Item 5',
      'Change Health (#)', 'Change Prestige (#)', 'Change Martial (#)', 'Change Intrigue (#)', 'Change Devotion (#)', 'Revive (Y/N)', 'Durability (#)'
    ];
  static recipeOptions = [
      'Name', 'Icon', 'Show Image', 'Show Message',
      'Ingredient 1', 'Ingredient 2', 'Ingredient 3', 'Ingredient 4', 'Ingredient 5',
      'Result 1', 'Result 2', 'Result 3', 'Result 4', 'Result 5',
      'Craft Time in Hours (#)', 'Need None Of Roles', 'Need All Of Roles', 'Need Any Of Roles', 'Is Public (Y/N)'
    ];

  // Function to find an item by name in the shop
  //THIS IS INEFFICIENT BECAUSE IT MEANS CALLING IT MEANS TWO CALLS TO THE DATABASE- FIX LATER
  static async findItemName(itemName) {
    let data = await dbm.loadCollection('shop');
    let dataKeys = Object.keys(data);
    for (let i = 0; i < dataKeys.length; i++) {
      if (dataKeys[i].toLowerCase() == itemName.toLowerCase()) {
        return dataKeys[i];
      }
    }
    return "ERROR";
  }

  static async convertToShopMap(rawShopLayoutData) {
    const arrayShopLayoutData = rawShopLayoutData.shopArray;
    //Turn shopArray, an array of fields of arrays, into map of category to items

    let shopLayoutData = {};
    // Iterate over the shopArray which is an array of objects
    for (let categoryObject of arrayShopLayoutData) {
      // Each object has keys which are the category names, and the values are arrays of items
      for (let [category, items] of Object.entries(categoryObject)) {
        // Assign the array of items to the corresponding category in the shopLayoutData map
        shopLayoutData[category] = items;
      }
    }

    return shopLayoutData;
  }

  // Function to add items to the shop
  static async addItem(itemName, givenData) {
    //Items include 4 arrays of maps, each map for a category of options. Make these 4, and make each value blank
    let itemData = {
      "infoOptions": this.infoOptions.reduce((acc, option) => {
        acc[option] = "";
        return acc;
      }
      , {}),
      "shopOptions": this.shopOptions.reduce((acc, option) => {
        acc[option] = "";
        return acc;
      }
      , {}),
      "usageOptions": this.usageOptions.reduce((acc, option) => {
        acc[option] = "";
        return acc;
      }
      , {}),
    };
    itemData.infoOptions.Name = itemName;
    //Given data is a map of some elements that have been set, though its unknown which option they are for. Iterate through and set the values
    for (let [key, value] of Object.entries(givenData)) {
      if (this.infoOptions.includes(key)) {
        itemData.infoOptions[key] = value;
      } else if (this.shopOptions.includes(key)) {
        itemData.shopOptions[key] = value;
      } else if (this.usageOptions.includes(key)) {
        itemData.usageOptions[key] = value;
      }
    }
    await dbm.saveFile('shop', itemName, itemData);
  }

  static async addRecipe(recipeName) {
    //Go into the recipes file. First check if another copy of this recipe exists. If it does, add a space and number to recipe name and check again
    let data = await dbm.loadCollection('recipes');
    let recipeNames = Object.keys(data);
    let i = 1;
    let newRecipeName = recipeName;
    while (recipeNames.includes(newRecipeName)) {
      newRecipeName = recipeName + " " + i;
      i++;
    }
    //Create a new recipe object with all fields blank
    let recipeData = {
      "recipeOptions": this.recipeOptions.reduce((acc, option) => {
        acc[option] = "";
        return acc;
      }
      , {}),
    };

    //Set option "Is Public (Y/N)" to No

    recipeData.recipeOptions["Is Public (Y/N)"] = "No";
    let itemName = await this.findItemName(newRecipeName);
    if (itemName != "ERROR") {
      let shopData = await dbm.loadCollection('shop');
      let itemData = shopData[itemName];
      newRecipeName = itemName;
      recipeData.recipeOptions.Name = itemName;
      recipeData.recipeOptions.Icon = itemData.infoOptions.Icon;
      recipeData.recipeOptions["Result 1"] = "1 " + itemName;
    } else {
      recipeData.recipeOptions.Name = newRecipeName;
      recipeData.recipeOptions.Icon = ":hammer:";
    }
    recipeData.recipeOptions["Craft Time in Hours (#)"] = 1;
    await dbm.saveFile('recipes', newRecipeName, recipeData); 

    return newRecipeName;
  }

  static async recipesEmbed(isPublic, page) {
    const itemsPerPage = 1000; // Number of recipes per page
    let data = await dbm.loadCollection('recipes');
    let publicRecipes = [];
    let privateRecipes = [];
  
    //Loop through data 
    for (let [key, value] of Object.entries(data)) {
      if (value.recipeOptions["Is Public (Y/N)"] == "Yes") {
        publicRecipes.push(value);
      } else {
        privateRecipes.push(value);
      }
    }


    let recipesToShow;
    if (isPublic) {
      recipesToShow = publicRecipes;
    } else {
      recipesToShow = publicRecipes.concat(privateRecipes);
    }
  
    // Pagination calculation
    const pageStart = (page - 1) * itemsPerPage;
    const pageEnd = pageStart + itemsPerPage;
    const totalPages = Math.ceil(recipesToShow.length / itemsPerPage);
  
    let returnEmbed = new Discord.EmbedBuilder()
      .setTitle(':hammer: Recipes')
      .setColor(0x36393e)
      .setFooter({ text: `Page ${page} of ${totalPages}` });

    let descriptionText = '';
    if (isPublic) {
      for (let i = pageStart; i < pageEnd && i < publicRecipes.length; i++) {
        descriptionText += (publicRecipes[i].recipeOptions.Icon ? publicRecipes[i].recipeOptions.Icon + " " : ":hammer: ") + publicRecipes[i].recipeOptions.Name + "\n";
      }
    } else {
      if (pageStart < publicRecipes.length) {
        descriptionText += "**Public Recipes**\n";
        let endIndex = Math.min(pageEnd, publicRecipes.length);
        for (let i = pageStart; i < endIndex; i++) {
          descriptionText += (publicRecipes[i].recipeOptions.Icon ? publicRecipes[i].recipeOptions.Icon + " " : ":hammer: ") + publicRecipes[i].recipeOptions.Name + "\n";
        }
      }
      if (pageEnd > publicRecipes.length) {
        descriptionText += "**Private Recipes**\n";
        let startPrivateIndex = Math.max(pageStart - publicRecipes.length, 0);
        let endPrivateIndex = Math.min(pageEnd - publicRecipes.length, privateRecipes.length);
        for (let i = startPrivateIndex; i < endPrivateIndex; i++) {
          descriptionText += (privateRecipes[i].recipeOptions.Icon ? privateRecipes[i].recipeOptions.Icon + " " : ":hammer: ") + privateRecipes[i].recipeOptions.Name + "\n";
        }
      }

      
    }
    if (descriptionText == '') {
      descriptionText = 'No recipes found!';
    }
    returnEmbed.setDescription(descriptionText);
  
    // Buttons for navigation
    const prevButton = new ButtonBuilder()
      .setCustomId('prev_page')
      .setLabel('<')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 1);
  
    const nextButton = new ButtonBuilder()
      .setCustomId('next_page')
      .setLabel('>')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === totalPages);
  
    let actionRow = new ActionRowBuilder().addComponents(prevButton, nextButton);
  
    return [returnEmbed, actionRow];
  }
  


  static async updateAllItemVersions() {
    //Update all item versions
    let data = await dbm.loadCollection('shop');
    let itemNames = Object.keys(data);
    for (let i = 0; i < itemNames.length; i++) {
      await this.updateItemVersion(itemNames[i]);
    }
    return "All items updated to the new version";
  }

  static async updateItemVersion(itemName) {
    // Convert all item data to the new options. Carry over whatever new options it has
    let itemData = await dbm.loadFile('shop', itemName);

    // Create a new itemData object with the new options
    let newItemData = {
      "infoOptions": this.infoOptions.reduce((acc, option) => {
        acc[option] = itemData.infoOptions[option] || "";
        return acc;
      }
      , {}),
      "shopOptions": this.shopOptions.reduce((acc, option) => {
        acc[option] = itemData.shopOptions[option] || "";
        return acc;
      }
      , {}),
      "usageOptions": this.usageOptions.reduce((acc, option) => {
        acc[option] = itemData.usageOptions[option] || "";
        return acc;
      }
      , {}),
    };

    await dbm.saveFile('shop', itemName, newItemData);

    //If no errors, return a success message
    if (newItemData != undefined) {
      return `Item \`${itemName}\` updated to the new version`;
    } else {
      return "Error updating item!";
    }
  }

  static async createShopEmbed(page) {
    page = Number(page);
    const itemsPerPage = 25;
    // Load data from shop.json and shoplayout.json
    const shopData = await dbm.loadCollection('shop');
    // Convert the shop data to a an array of maps of category to items
    let shopLayoutData = {};
    for (let [key, value] of Object.entries(shopData)) {
      let price = value.shopOptions["Price (#)"];
      //Turn price into number
      price = parseInt(price);
      if (!(price == undefined || price == "" || price == null || isNaN(price) || price == 0)) {
        if (!shopLayoutData[value.infoOptions.Category]) {
          shopLayoutData[value.infoOptions.Category] = [];
        }
        shopLayoutData[value.infoOptions.Category].push(key);
      }
    }

    let startIndices = [];
    startIndices[0] = 0;
    const shopCategories = Object.keys(shopLayoutData);

    //Sort categories alphabetically
    shopCategories.sort();

    let currIndice = 0;
    let currPageLength = 0;
    let i = 0;
    for (const category of shopCategories) {
      let length = shopLayoutData[category].length;
      currPageLength += length;
      if (currPageLength > itemsPerPage) {
        currPageLength = length;
        currIndice++;
        startIndices[currIndice] = i;
      }
      i++;
    }

    const pages = Math.ceil(startIndices.length);

    const pageItems = shopCategories.slice(
      startIndices[page-1],
      startIndices[page] ? startIndices[page] : undefined
    );

    const embed = new Discord.EmbedBuilder()
      .setTitle(clientManager.getEmoji("Talent") + ' Shop')
      .setColor(0x36393e);

    //If there are no items in the shop, set description as "No items have prices!" and return
    if (pageItems.length == 0) {
      embed.setDescription("No items have prices!");
      return [embed, []];
    }

    let descriptionText = '';
    for (const category of pageItems) {
      let endSpaces = "-";
      if ((20 - category.length - 2) > 0) {
        endSpaces = "-".repeat(20 - category.length - 2);
      }
      descriptionText += `**\`--${category}${endSpaces}\`**\n`;
      descriptionText += shopLayoutData[category]
        .map((item) => {
          const icon = shopData[item].infoOptions.Icon;
          const price = shopData[item].shopOptions["Price (#)"];

          let alignSpaces = ' '
          if ((30 - item.length - ("" + price).length) > 0) {
            alignSpaces = ' '.repeat(30 - item.length - ("" + price).length);
          }
          // Create the formatted line
          return `${icon} \`${item}${alignSpaces}${price}\` ${clientManager.getEmoji("Talent")}`;
        })
        .join('\n');
      descriptionText += '\n';
    }
    // Set the accumulated description
    embed.setDescription(descriptionText);

    if (pages > 1) {
      embed.setFooter({text: `Page ${page} of ${pages}`});
    }

    const rows = [];

    // Create a "Previous Page" button
    const prevButton = new ButtonBuilder()
      .setCustomId('switch_page' + (page-1))
      .setLabel('<')
      .setStyle(ButtonStyle.Secondary); // You can change the style to your preference

    // Disable the button on the first page
    if (page == 1) {
      prevButton.setDisabled(true);
    }

    const nextButton = new ButtonBuilder()
          .setCustomId('switch_page' + (page+1))
          .setLabel('>')
          .setStyle(ButtonStyle.Secondary); // You can change the style to your preference

    // Create a "Next Page" button if not on the last page
    if (page == pages) {
      nextButton.setDisabled(true);
    }
    rows.push(new ActionRowBuilder().addComponents(prevButton, nextButton));

    return [embed, rows];
  }

  static async renameCategory(oldCategory, newCategory) {
    let data = await dbm.loadCollection('shop');
    let itemNames = Object.keys(data);
    for (let i = 0; i < itemNames.length; i++) {
      if (data[itemNames[i]].infoOptions.Category == oldCategory) {
        data[itemNames[i]].infoOptions.Category = newCategory;
      }
    }
    await dbm.saveCollection('shop', data);
    return "Category renamed!";
  }

  static async createAllItemsEmbed(page) {
    page = Number(page);
    const itemsPerPage = 25;
    // Load data from shop.json and shoplayout.json
    const shopData = await dbm.loadCollection('shop');
    //Turn shopData into an array of keys
    let itemArray = Object.keys(shopData);
    //Put the array into an array of categories each containing all items in the category, alphabetically
    let itemCategories = {};
    for (let i = 0; i < itemArray.length; i++) {
      let category = shopData[itemArray[i]].infoOptions.Category;
      if (!itemCategories[category]) {
        itemCategories[category] = [];
      }
      itemCategories[category].push(itemArray[i]);
    }

    //Sort categories alphabetically
    itemCategories = Object.keys(itemCategories).sort().reduce((acc, key) => { 
      acc[key] = itemCategories[key];
      return acc;
    }, {});



    let startIndices = [];
    startIndices[0] = 0;

    let currIndice = 0;
    let currPageLength = 0;
    let i = 0;
    for (const category in itemCategories) {
      let length = itemCategories[category].length;
      currPageLength += length;
      if (currPageLength > itemsPerPage) {
        currPageLength = length;
        currIndice++;
        startIndices[currIndice] = i;
      }
      i++;
    }

    const pages = Math.ceil(startIndices.length);

    //Can't use slice because it's an object
    const pageItems = Object.keys(itemCategories).slice(
      startIndices[page-1],
      startIndices[page] ? startIndices[page] : undefined
    );

    const embed = new Discord.EmbedBuilder()
      .setTitle(':package: Items')
      .setColor(0x36393e);

    let descriptionText = '';

    for (const category of pageItems) {
      let endSpaces = "-";
      if ((20 - category.length - 2) > 0) {
        endSpaces = "-".repeat(20 - category.length - 2);
      }
      descriptionText += `**\`--${category}${endSpaces}\`**\n`;
      descriptionText += itemCategories[category]
        .map((item) => {
          const icon = shopData[item].infoOptions.Icon;
  
          // Create the formatted line
          return `${icon} ${item}`;
        })
        .join('\n');
      descriptionText += '\n';
    }
    // Set the accumulated description
    embed.setDescription(descriptionText);

    if (pages > 1) {
      embed.setFooter({text: `Page ${page} of ${pages}`});
    }

    const rows = [];

    // Create a "Previous Page" button
    const prevButton = new ButtonBuilder()
      .setCustomId('switch_alit' + (page-1))
      .setLabel('<')
      .setStyle(ButtonStyle.Secondary); // You can change the style to your preference

    // Disable the button on the first page
    if (page == 1) {
      prevButton.setDisabled(true);
    }

    const nextButton = new ButtonBuilder()
          .setCustomId('switch_alit' + (page+1))
          .setLabel('>')
          .setStyle(ButtonStyle.Secondary); // You can change the style to your preference

    // Create a "Next Page" button if not on the last page
    if (page == pages) {
      nextButton.setDisabled(true);
    }
    rows.push(new ActionRowBuilder().addComponents(prevButton, nextButton));

    return [embed, rows];
  }

  //function to create an embed of player inventory
  static async createInventoryEmbed(charID) {
    charID = await dataGetters.getCharFromNumericID(charID);
    // load data from characters.json and shop.json
    const charData = await dbm.loadCollection('characters');
    const shopData = await dbm.loadCollection('shop');

    // create a 2d of items in the player's inventory sorted by category. Remove items with 0 quantity
    let deleted = false;
    let inventory = [];
    for (const item in charData[charID].inventory) {
      if (charData[charID].inventory[item] == 0) {
        deleted = true;
        delete charData[charID].inventory[item];
        continue;
      }
      const category = shopData[item].infoOptions.Category;
      if (!inventory[category]) {
        inventory[category] = [];
      }
      inventory[category].push(item);
    }
    if (deleted) {
      await dbm.saveCollection('characters', charData);
    }
    // let inventory = [];
    // for (const item in charData[charID].inventory) {
    //   const category = shopData[item].category;
    //   if (!inventory[category]) {
    //     inventory[category] = [];
    //   }
    //   inventory[category].push(item);
    // }

    //create description text from the 2d array
    let descriptionText = '';
    for (const category in inventory) {
      let endSpaces = "-"
      if ((20 - category.length - 2)> 0) {
        endSpaces = "-".repeat(20 - category.length - 2);
      }
      descriptionText += `**\`--${category}${endSpaces}\`**\n`;
      descriptionText += inventory[category]
        .map((item) => {
          const icon = shopData[item].infoOptions.Icon;
          const quantity = charData[charID].inventory[item];

          let alignSpaces = ' ' 
          if ((30 - item.length - ("" + quantity).length) > 0){
            alignSpaces = ' '.repeat(30 - item.length - ("" + quantity).length);
          }
  
          // Create the formatted line
          return `${icon} \`${item}${alignSpaces}${quantity}\``;
        })
        .join('\n');
      descriptionText += '\n';
    }

    // create an embed
    const embed = new Discord.EmbedBuilder()
      .setTitle('Inventory')
      .setColor(0x36393e)
      .setDescription('**Items:** \n' + descriptionText);

    return embed;
  }

  // Function to print item list
  // static async shop() {
  //   // Load the data
  //   let data = await dbm.loadCollection('shop');
  //   let superstring = ""
  //   for (let [key, value] of Object.entries(data)) {
  //     superstring = superstring + (String(value["icon"]) + " " + key + " : " + String(value["price"]) + "\n");
  //   }
  //   return superstring;
  // }

  // Function to remove items - removeItem(name)
  static async removeItem(itemName) {
    // Set the database name
    let fileName = 'shop';
    itemName = await this.findItemName(itemName);
    if (itemName == "ERROR") {
      return "Error! Item not found! Make sure to include spaces and not include the emoji.";
    }
    // Try to remove the item, and if it doesn't exist, catch the error
    try {
      await dbm.docDelete(fileName, itemName);
    } catch (error) {
      console.log(error);
      // Handle the error or do nothing
      // In JavaScript, you might want to handle errors differently
    }
  }

  static async removeRecipe(recipeName) {
    let recipes = await dbm.loadCollection('recipes');
    if (!recipes[recipeName]) {
      return "Recipe not found! You must retype the recipe name exactly as it appears to delete it.";
    }
    await dbm.docDelete('recipes', recipeName);
  }

  static async removeIncome(incomeName) {
    let incomes = await dbm.loadFile('keys', 'incomeList');
    if (!incomes[incomeName]) {
      return "Income not found! You must retype the income name exactly as it appears to delete it.";
    }
    delete incomes[incomeName];
    await dbm.saveFile('keys', 'incomeList', incomes);
  }

  static async getItemPrice(itemName) {
    let data = await dbm.loadCollection('shop');
    var price;
    if (data[itemName]) {
      if (data[itemName].shopOptions["Price (#)"] == undefined) {
        return "No Price Item!";
      }
      price = data[itemName].shopOptions["Price (#)"];
    } else {
      return "ERROR";
    }
    return price;
  }

  static async getItemCategory(itemName) {
    let data = await dbm.loadCollection('shop');
    var category;
    if (data[itemName]) {
      category = data[itemName].infoOptions.Category;
    } else {
      return "ERROR";
    }
    return category;
  }

  static async getItemIcon(itemName) {
    let data = await dbm.loadCollection('shop');
    var icon;
    if (data[itemName]) {
      icon = data[itemName].infoOptions.Icon;
    } else {
      return "ERROR";
    }
    return icon;
  }

  static async inspect(itemName) {
    itemName = await this.findItemName(itemName);

    if (itemName == "ERROR") {
      return "Item not found!";
    }

    let data = await dbm.loadCollection('shop');
    let itemData = data[itemName];
    
    const inspectEmbed = new Discord.EmbedBuilder()
      .setTitle('**__Item:__ ' +  itemData.infoOptions.Icon + " " + itemName + "**")
      .setColor(0x36393e);

    if (itemData) {
      let aboutString = "";
      if (itemData.shopOptions["Price (#)"] != "") {
        aboutString = "Price: " + clientManager.getEmoji("Talent") + " " + itemData.shopOptions["Price (#)"] + "\n";
      }
      let descriptionString = "**Description:\n**" + itemData.infoOptions.Description;
      if (itemData.usageOptions["Is Usable"] == "Yes") {
        aboutString += "\nGives:";
        //Iterate through usageOptions to find any key that starts with "Give Item". If any exist, add them to the aboutString. The value will be a string "Number Name" that will have to be split (Name may contain spaces, such as Iron Spear)
        //Also search for anything starting with Change, which will be a change in prestige, Martial, or intrigue. If they're positive, add this. This value will just be an integer in string form
        for (let key in itemData.usageOptions) {
          //Check if value is blank
          if (itemData.usageOptions[key] == "") {
            continue;
          }
          if (key == "Give/Take Money") {
            if (itemData.usageOptions[key] > 0) {
              aboutString += ("\n`   `- " + clientManager.getEmoji("Talent") + " " + itemData.usageOptions[key]);
            }
          }
          if (key.startsWith("Give Item")) {
            let splitString = itemData.usageOptions[key].split(" ");
            let quantity = splitString[0];
            let name = splitString.slice(1).join(" ");
            let icon = data[name].infoOptions.Icon;
            aboutString += ("\n`   `- " + icon + " " + name + ": " + quantity);
          }
          if (key.startsWith("Change")) {
            let quantity = itemData.usageOptions[key];
            if (quantity > 0) {
              let icon = clientManager.getEmoji(key.split(" ")[1]);
              aboutString += ("\n`   `- " + icon + " " + key.split(" ")[1] + ": " + quantity);
            }
          }
          if (key == "Give Role") {
            let role = itemData.usageOptions[key];
            aboutString += ("\n" + role);
          }

          if (key == "Give/Take Money") {
            if (itemData.usageOptions[key] < 0) {
              aboutString += ("\n`   `- " + clientManager.getEmoji("Talent") + " " + itemData.usageOptions[key]);
            }
          }
          if (key.startsWith("Take Item")) {
            let splitString = itemData.usageOptions[key].split(" ");
            let quantity = splitString[0];
            let name = splitString.slice(1).join(" ");
            let icon = data[name].infoOptions.Icon;
            aboutString += ("\n`   `- " + icon + " " + name + ": " + quantity);
          }
          if (key.startsWith("Change")) {
            let quantity = itemData.usageOptions[key];
            if (quantity < 0) {
              let icon = clientManager.getEmoji(key.split(" ")[1]);
              aboutString += ("\n`   `- " + icon + " " + key.split(" ")[1] + ": " + quantity);
            }
          }
          if (key == "Take Role") {
            let role = itemData.usageOptions[key];
            aboutString += ("\n" + role);
          }
        }
      }

      let recipeEmbed = await this.inspectRecipe(itemName);
      let recipeString = ""
      if (recipeEmbed != "Recipe not found!") {
        recipeString += recipeEmbed.data.fields[0].value;
      }
      

      inspectEmbed.setDescription(descriptionString);
      
      if (aboutString.length > 0)
      {
        inspectEmbed.addFields({ name: '**About**', value: aboutString });
      }
      if (recipeString) { 
        inspectEmbed.addFields({ name: '**Recipe**', value: recipeString });
      }
      return inspectEmbed;
    } else {
      return "This is not an item in the shop! Make sure to include spaces and not include the emoji.";
    }
  }

  static async inspectRecipe(recipeName) {
    let recipeData = await dbm.loadCollection('recipes');
    if (!recipeData[recipeName]) {
      //Check if lower case version of recipeName exists
      let recipeNames = Object.keys(recipeData);
      for (let i = 0; i < recipeNames.length; i++) {
        if (recipeNames[i].toLowerCase() == recipeName.toLowerCase()) {
          recipeName = recipeNames[i];
          break;
        }
      }
      if (!recipeData[recipeName]) {
        return "Recipe not found!";
      }
    }

    const inspectEmbed = new Discord.EmbedBuilder()
      .setTitle('**__Recipe:__ ' + recipeData[recipeName].recipeOptions.Icon + " " + recipeName + "**")
      .setColor(0x36393e);

    let aboutString = "";

    //If its a private recipe, say so
    if (recipeData[recipeName].recipeOptions["Is Public (Y/N)"] == "No") {
      aboutString += "\n:warning: Private Recipe! Will not be craftable :warning:\n";
    }
    if (recipeData[recipeName].recipeOptions["Craft Time in Hours (#)"]) {
      aboutString = "\nCraft Time: :clock9:" + recipeData[recipeName].recipeOptions["Craft Time in Hours (#)"] + " hours\n";
    }
    aboutString += "\nIngredients:\n";
    for (let i = 1; i <= 5; i++) {
      let ingredient = recipeData[recipeName].recipeOptions["Ingredient " + i];
      if (ingredient) {
        let splitString = ingredient.split(" ");
        let quantity = splitString[0];
        let name = splitString.slice(1).join(" ");
        let icon = await shop.getItemIcon(name);
        if (icon == "ERROR") {
          icon = "";
        }
        aboutString += ("`   `- " + icon + " " + name + ": " + quantity + "\n");
      }
    }
    aboutString += "\nResults:\n";
    for (let i = 1; i <= 5; i++) {
      let result = recipeData[recipeName].recipeOptions["Result " + i];
      if (result) {
        let splitString = result.split(" ");
        let quantity = splitString[0];
        let name = splitString.slice(1).join(" ");
        let icon = await shop.getItemIcon(name);
        if (icon == "ERROR") {
          icon = "";
        }
        aboutString += ("`   `- " + icon + " " + name + ": " + quantity + "\n");
      }
    }

    if (recipeData[recipeName].recipeOptions["Show Message"]) {
      inspectEmbed.setDescription(recipeData[recipeName].recipeOptions["Show Message"]);
    }

    inspectEmbed.addFields({ name: '**About: **', value: aboutString });
    if (recipeData[recipeName].recipeOptions["Show Image"]) {
      inspectEmbed.setImage(recipeData[recipeName].recipeOptions["Show Image"]);
    }

    return inspectEmbed;
  }

  /**edititemmenu: Essentially, this returns a large embed with various fields describing aspects of the item. 
    The title of the embed will be the item icon and name
    At the bottom of each page will be a description describing what to do and the command to use (/editfield <field number> <new value>)
    The footer will tell you what page you are on
    Buttons will exist at the bottom to click to switch to the two other pages you are not currently on.
    Each field will have a number to the left of it that the user will be able to use in a separate command to edit that field.
    Below are all the pages and fields that exist
    Two pages, one for Info and Shop Options, one for Usage Options
    Page 1: Info and Shop Options- split between Info Options and Shop Options.
    Info Options: Name, Icon, Category, Image, Description
    Shop Options: Price, Need Role, Give Role, Take Role
    Page 2: Usage Options
    Usage Options: Is Usable, Removed on Use, Need Role, Give Role, Take Role, Show an Image, Show a Message, Give/Take Money, Cooldown, Give Item, Give Item 2, Give Item 3, Take Item, Take Item 2, Take Item 3, Give Item, Give Item 2, Give Item 3, Change Prestige, Change Martial, Change Intrigue
    */
  static async editItemMenu(itemName, pageNumber, tag) {
    pageNumber = Number(pageNumber);
    itemName = await this.findItemName(itemName);
    if (itemName == "ERROR") {
      return "Item not found!";
    }

    //Load user data, check if user has attribute "Item Edited" and if so change the value to the item name. If not, create the attribute
    let userData = await dbm.loadCollection('characters');
    if (!userData[tag].editingFields) {
      userData[tag].editingFields = {};
    }
    userData[tag].editingFields["Item Edited"] = itemName;
    await dbm.saveCollection('characters', userData);

    //Loatd item data
    let itemData = await dbm.loadFile('shop', itemName);

    const infoOptions = this.infoOptions;
    const shopOptions = this.shopOptions;
    const usageOptions = this.usageOptions;

    const infoOptionsStartingIndex = 0;
    const shopOptionsStartingIndex = infoOptions.length;
    const usageOptionsStartingIndex = shopOptionsStartingIndex + shopOptions.length;

    // Get item icon
    const itemIcon = itemData.infoOptions.Icon;
    // Construct the edit menu embed
    const embed = new Discord.EmbedBuilder()
      .setTitle("**" + itemIcon + " " + itemName + "**")
      .setDescription('Edit the fields using the command /edititemfield <field number> <new value>');
    
    switch (pageNumber) {
      case 1:
        // Add fields for Info Options and Shop Options
        embed.addFields({ name: '❓ Info Options', value: infoOptions.map((option, index) => `\`[${index + 1}] ${option}:\` ` + itemData.infoOptions[option]).join('\n') }, 
                        { name: '🪙 Shop Options', value: shopOptions.map((option, index) => `\`[${index + 1 + shopOptionsStartingIndex}] ${option}:\` ` + itemData.shopOptions[option]).join('\n') });
        embed.setFooter({text : 'Page 1 of 2, Info and Shop Options'});
        break;
      case 2:
        // Add fields for Usage Options
        embed.addFields({ name : '💥 Usage Options', value: usageOptions.map((option, index) => `\`[${index + 1 + usageOptionsStartingIndex}] ${option}:\` ` + itemData.usageOptions[option]).join('\n')});
        embed.setFooter({text : 'Page 2 of 2, Usage Options'});
        break;
      default:
        return "Invalid page number!";
    }

    //Create the buttons for the bottom of the embed
    const rows = new Discord.ActionRowBuilder();
    rows.addComponents(
      new Discord.ButtonBuilder()
        .setCustomId('switch_item1' + itemName)
        .setLabel('Info and Shop Options')
        .setStyle('Primary')
        .setDisabled(pageNumber === 1),
      new Discord.ButtonBuilder()
        .setCustomId('switch_item2' + itemName)
        .setLabel('Usage Options')
        .setStyle('Primary')
        .setDisabled(pageNumber === 2),
    );



    //Return an array including the embed and the buttons to put at the bottom 
    return [embed, rows];
  }

  static async editRecipeMenu(recipeName, tag) {
    // Load the recipe data
    let recipeData = await dbm.loadCollection('recipes', recipeName);

    if (recipeData[recipeName] == undefined) {
      for (let key in recipeData) {
        if (key.toLowerCase() == recipeName.toLowerCase()) {
          recipeName = key;
          break;
        }
      }
      if (recipeData[recipeName] == undefined) {
        return "Recipe not found!";
      }
    }

    recipeData = recipeData[recipeName];

    let userData = await dbm.loadCollection('characters');
    if (!userData[tag].editingFields) {
      userData[tag].editingFields = {};
    }
    userData[tag].editingFields["Recipe Edited"] = recipeName;
    await dbm.saveCollection('characters', userData);

    const recipeOptions = this.recipeOptions;

    // Construct the edit menu embed
    const embed = new Discord.EmbedBuilder()
      .setTitle("**" + recipeName + "**")
      .setDescription('Edit the fields using the command /editrecipefield <field number> <new value>');

    // Add fields for Recipe Options
    embed.addFields({ name: '📜 Recipe Options', value: recipeOptions.map((option, index) => `\`[${index + 1}] ${option}:\` ` + recipeData.recipeOptions[option]).join('\n') });
    embed.setFooter({text : 'Page 1 of 1, Recipe Options'});

    //Return an array including the embed and the buttons to put at the bottom 
    return embed;
  }

  static async editItemField(userTag, fieldNumber, newValue) {
    // Load user data
    let userData = await dbm.loadCollection('characters');
    let itemName;
    if (!userData[userTag].editingFields["Item Edited"]) {
      return "You are not currently editing any items!";
    } else {
      itemName = userData[userTag].editingFields["Item Edited"];
    }
    itemName = await this.findItemName(itemName);
    if (itemName == "ERROR") {
      return "Item not found!";
    }

    // Load the item data
    let itemData = await dbm.loadFile('shop', itemName);

    const infoOptions = this.infoOptions;
    const shopOptions = this.shopOptions;
    const usageOptions = this.usageOptions;

    const infoOptionsStartingIndex = 0;
    const shopOptionsStartingIndex = infoOptions.length;
    const usageOptionsStartingIndex = shopOptionsStartingIndex + shopOptions.length;

    // Determine which category the field number belongs to
    let category;
    if (fieldNumber >= 1 && fieldNumber <= infoOptions.length) {
      category = 'infoOptions';
    } else if (fieldNumber >= shopOptionsStartingIndex + 1 && fieldNumber <= shopOptionsStartingIndex + shopOptions.length) {
      category = 'shopOptions';
      fieldNumber -= shopOptionsStartingIndex;
    } else if (fieldNumber >= usageOptionsStartingIndex + 1 && fieldNumber <= usageOptionsStartingIndex + usageOptions.length) {
      category = 'usageOptions';
      fieldNumber -= usageOptionsStartingIndex;
    } else {
      return "Invalid field number!";
    }

    // Get the field name
    let fieldName;
    switch (category) {
      case 'infoOptions':
        fieldName = infoOptions[fieldNumber - 1];
        break;
      case 'shopOptions':
        fieldName = shopOptions[fieldNumber - 1];
        break;
      case 'usageOptions':
        fieldName = usageOptions[fieldNumber - 1];
        break;
    }

    let nullValue = false;
    if (newValue == null) {
      newValue = "";
      nullValue = true;
    }

    //If category contains #, convert newValue to number- if it's not a number, return an error
    if (fieldName.includes("#")) {
      let num = parseInt(newValue);
      if (isNaN(num)) {
        return "Invalid value for a number field!";
      }
      newValue = num;
    }

    if (fieldName.includes("Y/N")) {
      if (newValue.toLowerCase() == "y" || newValue.toLowerCase() == "yes" || newValue.toLowerCase() == "true") {
        newValue = "Yes";
      } else if (newValue.toLowerCase() == "n" || newValue.toLowerCase() == "no" || newValue.toLowerCase() == "false") {
        newValue = "No";
      } else {
        return "Invalid value for a Y/N field!";
      }
    }

    if (fieldName.includes("Give Item") || fieldName.includes("Take Item")) {
      //Should be in the form NUMBER ITEM NAME
      let splitString = newValue.split(" ");
      let num = parseInt(splitString[0]);
      if (isNaN(num)) {
        return "Invalid value for number! This should be given in the form <Number> <Item Name>";
      }
      //Check if item name is valid
      let itemName = splitString.slice(1).join(" ");
      if (await this.findItemName(itemName) == "ERROR") {
        return "Invalid value for item name! This should be given in the form <Number> <Item Name>";
      }
    }

    // Update the item data
    itemData[category][fieldName] = newValue;

    // If the item name has changed, save the new item and delete the old one
    if (fieldName == "Name") {
      //Save new item
      await dbm.saveFile('shop', newValue, itemData);
      //Delete old item
      await dbm.docDelete('shop', itemName);

      //Change the item name in the user's editingFields
      userData[userTag].editingFields["Item Edited"] = newValue;
      await dbm.saveCollection('characters', userData);

      return `Item name changed to ${newValue}`;
    } else {
      // Save the updated item data
      await dbm.saveFile('shop', itemName, itemData);
    }

    // Save the updated item data
    await dbm.saveFile('shop', itemName, itemData);

    if (nullValue) {
      return `Field ${fieldName} reset to blank for item ${itemName}`;
    }
    return `Field ${fieldName} updated to ${newValue} for item ${itemName}`;
  }

  static async editRecipeField(userTag, fieldNumber, newValue) {
    // Load user data
    let userData = await dbm.loadCollection('characters');
    let recipeName;
    if (!userData[userTag].editingFields["Recipe Edited"]) {
      return "You are not currently editing any recipes!";
    } else {
      recipeName = userData[userTag].editingFields["Recipe Edited"];
    }

    // Load the recipe data
    let recipeData = await dbm.loadFile('recipes', recipeName);

    const recipeOptions = this.recipeOptions;

    // Determine which category the field number belongs to
    let category;
    if (fieldNumber >= 1 && fieldNumber <= recipeOptions.length) {
      category = 'recipeOptions';
    } else {
      return "Invalid field number!";
    }

    // Get the field name
    let fieldName;
    switch (category) {
      case 'recipeOptions':
        fieldName = recipeOptions[fieldNumber - 1];
        break;
    }

    let nullValue = false;
    if (newValue == null) {
      newValue = "";
      nullValue = true;
    }

    if (nullValue) {
      recipeData[category][fieldName] = newValue;
      await dbm.saveFile('recipes', recipeName, recipeData);
      return `Field ${fieldName} reset to blank for recipe ${recipeName}`;
    }

    //If category contains #, convert newValue to number- if it's not a number, return an error
    if (fieldName.includes("#")) {
      let num = parseInt(newValue);
      if (isNaN(num)) {
        return "Invalid value for a number field!";
      }
      newValue = num;
    }

    if (fieldName.includes("Y/N")) {
      if (newValue.toLowerCase() == "y" || newValue.toLowerCase() == "yes" || newValue.toLowerCase() == "true") {
        newValue = "Yes";
      } else if (newValue.toLowerCase() == "n" || newValue.toLowerCase() == "no" || newValue.toLowerCase() == "false") {
        newValue = "No";
      } else {
        return "Invalid value for a Y/N field!";
      }
    }

    if (fieldName.includes("Ingredient") || fieldName.includes("Result")) {
      //Should be in the form NUMBER ITEM NAME
      let splitString = newValue.split(" ");
      let num = parseInt(splitString[0]);
      if (isNaN(num)) {
        return "Invalid value for number! This should be given in the form <Number> <Item Name>";
      }
      //Check if item name is valid
      let itemName = splitString.slice(1).join(" ");
      let foundItemName = await this.findItemName(itemName);
      if (foundItemName == "ERROR") {
        return "Invalid value for item name! This should be given in the form <Number> <Item Name>";
      } else {
        newValue = num + " " + foundItemName;
      } 
    }

    // Update the recipe data
    recipeData[category][fieldName] = newValue;

    // If there is now only one result (Result 1), and no other recipes exist with the name of that result, change the recipe name and icon to that result
    if (fieldName == "Result 1" && recipeName.includes("New Recipe") && recipeData.recipeOptions["Result 2"] == "" && recipeData.recipeOptions["Result 3"] == "" && recipeData.recipeOptions["Result 4"] == "" && recipeData.recipeOptions["Result 5"] == "") {
      let result = newValue.split(" ").slice(1).join(" ");

      if (!recipeData[result]) {
        let data = await dbm.loadCollection('shop');
        if (data[result]) {
          recipeData.recipeOptions["Name"] = result;
          recipeData.recipeOptions["Icon"] = data[result].infoOptions.Icon;
          
          //Save new recipe
          await dbm.saveFile('recipes', result, recipeData);
          //Delete old recipe
          await dbm.docDelete('recipes', recipeName);

          //Return
          return `This is now a recipe to craft ${result}, name and icon have been changed accordingly.`;
        }   
      }
    }

    // If the recipe name has changed, save the new recipe and delete the old one
    if (fieldName == "Name") {
      //Save new recipe
      await dbm.saveFile('recipes', newValue, recipeData);
      //Delete old recipe
      await dbm.docDelete('recipes', recipeName);

      //Change the recipe name in the user's editingFields
      userData[userTag].editingFields["Recipe Edited"] = newValue;
      await dbm.saveCollection('characters', userData);

      return `Recipe name changed to ${newValue}`;
    } else {
      // Save the updated recipe data
      await dbm.saveFile('recipes', recipeName, recipeData);
    }
    
    
    return `Field ${fieldName} updated to ${newValue} for recipe ${recipeName}`;
  } 

  static async buyItem(itemName, charID, numToBuy) {
    itemName = await this.findItemName(itemName);
    const price = await this.getItemPrice(itemName);
    if (price === "ERROR" || price === "No Price Item!" || price === undefined || price === null || price === NaN || !(price > 0)) {
      return "Not a valid item to purchase!";
    }
    let charCollection = 'characters';

    let returnString;
    let charData = await dbm.loadFile(charCollection, charID);
    if (charData.balance <= (price * numToBuy)) {
      returnString = "You do not have enough gold!";
      await dbm.saveFile(charCollection, charID, charData);
      return returnString;
    } else {
      charData.balance -= (price * numToBuy);

      if (!charData.inventory[itemName]) {
        charData.inventory[itemName] = 0;
      }
      charData.inventory[itemName] += numToBuy;

      returnString = "Succesfully bought " + numToBuy + " " + itemName;
      await dbm.saveFile(charCollection, charID, charData);
      return returnString;
    }
  }

  static async shopLayout(categoryToEdit, layoutString) {
    if (categoryToEdit === "GENERAL") {
      let shopMap = {};
      let currCategory = null;
      const lines = layoutString.split('\n');
    
      for (let line of lines) {
        line = line.trim(); // Remove leading/trailing whitespace
    
        if (line.startsWith("**")) {
          // This is a category line
          const categoryName = line.substring(2, line.length - 2); // Remove leading/trailing **
    
          if (shopMap[categoryName]) {
            return ("ERROR: Duplicate category " + categoryName + "\n\nSubmitted layout string: \n " + layoutString);
          }
          currCategory = categoryName;
          shopMap[categoryName] = [];
        } else if (line.endsWith(";")) {
          if (currCategory === null) {
            return ("ERROR: Item outside a category." + "\n\nSubmitted layout string: \n " + layoutString);
          }

          let item = line.slice(0, -1); // Remove the trailing semicolon
          item = await this.findItemName(item);

          if (await this.getItemPrice(item) == "ERROR") {
            return ("ERROR! Item " + item + " is not in shop" + "\n\nSubmitted layout string: \n " + layoutString);
          } else if (await this.getItemPrice(item) == "No Price Item!") {
            return ("ERROR! Item " + item + " has no price" + "\n\nSubmitted layout string: \n " + layoutString);
          }
    
          for (const category in shopMap) {
            if (shopMap[category].includes(item)) {
              return ("ERROR: Duplicate item " + item + " in category " + category + "\n\nSubmitted layout string: \n " + layoutString);
            }
          }
          shopMap[currCategory].push(item);
        } else if (line !== "") {
          return ("ERROR: Invalid line: " + line + "\n\nSubmitted layout string: \n " + layoutString);
        }
      }
      let shopData = await dbm.loadCollection("shop");
      for (const category in shopMap) {
        for (const item of shopMap[category]) {
          if (!shopData[item]) {
            return ("ERROR! Item " + item + " is not in shop" + "\n\nSubmitted layout string: \n " + layoutString);
          } else {
            shopData[item].category = category;
          }
        }
      }
      await dbm.saveCollection("shop", shopData);
      //Convert shopMap into an ordered array of its elements with a key to avoid alphabetizing
      let shopMapInMap = {};

      let shopArray = [];
      let key = 0;
      for (const category in shopMap) {
        shopArray[key] = {};
        shopArray[key][category] = shopMap[category];
        key++;
      }
      shopMapInMap.shopArray = shopArray;
      await dbm.saveFile("shoplayout", "shopLayout", shopMapInMap);

      let result = "Shop layout updated successfully. Categories and items added:\n";
      for (const category in shopMap) {
        result += `Category: ${category}\n`;
        for (const item of shopMap[category]) {
          result += `- ${item}\n`;
        }
      }
      return result;
    } else {
      let catMap = [];
      let onCategory = true;
    
      const lines = layoutString.split('\n');
    
      for (let line of lines) {
        line = line.trim();
    
        if (line.startsWith("**")) {
          // This is a category line
          const categoryMatch = line.match(/\*\*(.*?)\*\*/); // Extract the category name
          if (!categoryMatch) {
            return ("ERROR: Invalid category format." + "\n\nSubmitted layout string: \n " + layoutString);
          }
          const categoryName = categoryMatch[1];
    
          if (categoryName === categoryToEdit) {
            onCategory = true;
            catMap = [];
          } else {
            return ("ERROR: The provided category does not match the layout." + "\n\nSubmitted layout string: \n " + layoutString);
          }
        } else if (line.endsWith(";")) {
          // This is an item line
          if (!onCategory) {
            return ("ERROR: Items can only be within a category." + "\n\nSubmitted layout string: \n " + layoutString);
          }

          let item = line.slice(0, -1); // Remove the trailing semicolon
          item = await this.findItemName(item);

          if (await this.getItemPrice(item) == "ERROR") {
            return ("ERROR! Item " + item + " is not in shop" + "\n\nSubmitted layout string: \n " + layoutString);
          }

          catMap.push(item);
        } else if (line !== "") {
          return ("ERROR: Invalid line: " + line + "\n\nSubmitted layout string: \n " + layoutString);
        }
      }
      let shopData = await dbm.loadCollection("shop");
      for (const item of catMap) {
        if (!shopData[item]) {
          return ("ERROR! Item " + item + " is not in shop" + "\n\nSubmitted layout string: \n " + layoutString);
        } else {
          shopData[item].infoOptions.Category = categoryToEdit;
        }
      }
      await dbm.saveCollection("shop", shopData);

      let layoutData = await dbm.loadFile("shoplayout", "shopLayout");
      // if (!layoutData.organizedLayout) {
      //   layoutData.organizedLayout = {};
      // }

      // layoutData.organizedLayout[categoryToEdit] = catMap;
      let shopArray = layoutData.shopArray;
      
      for (let i = 0; i < shopArray.length; i++) {
        if (shopArray[i].hasOwnProperty(categoryToEdit)) {
          shopArray[i][categoryToEdit] = catMap;
        }
      }

      layoutData = {};
      layoutData.shopArray = shopArray;

      await dbm.saveFile("shoplayout", "shopLayout", layoutData);

      let result = `Category "${categoryToEdit}" updated successfully. Items added:\n`;
      for (const item of catMap) {
        result += `- ${item}\n`;
      }
      return result;
    }
  }

  static async editShopLayoutPlaceholders(categoryToEdit) {
    if (categoryToEdit == "GENERAL") {
      let layoutData = await dbm.loadFile("shoplayout", "shopLayout");
      
      layoutData = await this.convertToShopMap(layoutData);

      let returnArray = [];
      returnArray[0] = categoryToEdit;
      let returnString = "";
      for (const category in layoutData) {
        returnString += "**" + category + "**\n";
        for (const item of layoutData[category]) {
          returnString += item + ";\n";
        }
        returnString += "\n";
      }
      returnArray[1] = returnString;
      return returnArray;
    } else {
      let layoutData = await dbm.loadFile("shoplayout", "shopLayout");
      layoutData = await this.convertToShopMap(layoutData);
      if (!layoutData[categoryToEdit]) {
        return "ERROR";
      }
      let returnArray = [];
      returnArray[0] = categoryToEdit;
      let returnString = "";
      returnString += "**" + categoryToEdit + "**\n";
      for (const item of layoutData[categoryToEdit]) {
        returnString += item + ";\n";
      }
      returnArray[1] = returnString;
      return returnArray;
    }
  }

  // Retired use functions
  // Function to add a use case to an item
  // static async addUseCase(itemName, useType, gives) {
  //   itemName = await this.findItemName(itemName);

  //   // Validate the item
  //   if (await itemName == "ERROR") {
  //     return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME";
  //   }

  //   // Validate the useType
  //   if (!(useType == "INCOMEROLE" || useType == "STATBOOST")) {
  //     return "ERROR! USE PROPER CASE KEYWORD.";
  //   }

  //   // Initialize the giveMap
  //   let giveMap = {};
  //   let currKey = "";
  //   let onKey = true;

  //   // Loop through the gives string
  //   for (let i = 0; i < gives.length; i++) {
  //     switch (gives[i]) {
  //       case ":":
  //         if (!onKey) {
  //           return "ERROR IN GIVE SECTION";
  //         } else {
  //           if (useType == "STATBOOST") {
  //             if (!((currKey == "Martial") || (currKey == "Prestige") || (currKey == "Intrigue"))) {
  //               return 'ERROR! DOES NOT BOOST "Martial", "Prestige", OR "Intrigue"';
  //             }
  //           }
  //           onKey = false;
  //         }
  //         break;
  //       case ";":
  //         if (onKey) {
  //           return "ERROR IN GIVE SECTION";
  //         } else {
  //           if (parseInt(giveMap[currKey])) {
  //             giveMap[currKey] = parseInt(giveMap[currKey]);
  //           } else {
  //             return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
  //           }
  //           currKey = "";
  //           onKey = true;
  //         }
  //         break;
  //       default:
  //         if (onKey) {
  //           currKey += gives[i];
  //         } else {
  //           if (!giveMap[currKey]) {
  //             giveMap[currKey] = "";
  //           }
  //           giveMap[currKey] += gives[i];
  //         }
  //         break;
  //     }
  //   }

  //   // Load the item data
  //   let itemData = await dbm.loadFile('shop', itemName);

  //   // Assigning parsed data to itemData
  //   itemData.usageCase = { useType, gives: giveMap };

  //   // Save the updated item data
  //   await dbm.saveFile('shop', itemName, itemData);

  //   // Constructing the return string
  //   let returnString = "Added a " + useType + " usage case to " + itemName + "\n\n";
  //   returnString += "On use, this item will give:\n";
  //   for (let key in giveMap) {
  //     returnString += ('"' + key + '" : "' + giveMap[key] + '"' + "\n");
  //   }
  //   returnString += "\n";
  //   returnString += "On use, this item will take nothing, having no use cost";

  //   return returnString;
  // }

  // // Function to remove a use case from an item
  // static async removeUseCase(itemName) {
  //   // Find the correct item name considering case sensitivity
  //   itemName = await this.findItemName(itemName);

  //   // Load the item data
  //   let itemData = await dbm.loadFile('shop', itemName);

  //   // Check if the item already has a use case
  //   if (!itemData.usageCase) {
  //     return "ERROR! DOES NOT ALREADY HAVE A USE CASE. USE /addusecase FIRST";
  //   }

  //   // Remove the use case
  //   delete itemData.usageCase;

  //   // Save the updated item data
  //   await dbm.saveFile('shop', itemName, itemData);

  //   return "Removed the usage case from " + itemName;
  // }

  // // Function to edit use case placeholders
  // static async editUseCasePlaceholders(itemName) {
  //   // Find the correct item name considering case sensitivity
  //   itemName = await this.findItemName(itemName);

  //   // Load the item data
  //   let itemData = await dbm.loadFile('shop', itemName);

  //   // Check if the item already has a use case
  //   if (!itemData.usageCase) {
  //     return "ERROR! DOES NOT ALREADY HAVE A USE CASE. USE /addusecase FIRST";
  //   }

  //   // Construct return array with use case details
  //   let returnArray = [];
  //   returnArray[0] = itemName;
  //   returnArray[1] = itemData.usageCase.useType;
    
  //   // Construct givesString from the gives map
  //   let givesString = "";
  //   for (let key in itemData.usageCase.gives) {
  //     givesString += (key + ":" + itemData.usageCase.gives[key] + ";");
  //   }
  //   returnArray[2] = givesString;

  //   // Construct takesString if takes map is present
  //   if (itemData.usageCase.takes) {
  //     let takesString = "";
  //     for (let key in itemData.usageCase.takes) {
  //       takesString += (key + ":" + itemData.usageCase.takes[key] + ";");
  //     }
  //     returnArray[3] = takesString;
  //   } else {
  //     returnArray[3] = "";
  //   }

  //   // Add countdown details if present
  //   if (itemData.usageCase.countdown) {
  //     returnArray[4] = itemData.usageCase.countdown;
  //   } else {
  //     returnArray[4] = "";
  //   }

  //   return returnArray;
  // }

  // // Function to add a use case with countdown
  // static async addUseCaseWithCountdown(itemName, useType, gives, countdown) {
  //   itemName = await this.findItemName(itemName);

  //   // Validate the item
  //   if (itemName == "ERROR") {
  //     return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME";
  //   }

  //   // Validate the useType and countdown
  //   if (!(useType == "INCOMEROLE" || useType == "STATBOOST")) {
  //     return "ERROR! USE PROPER CASE KEYWORD.";
  //   }
  //   if (!parseInt(countdown)) {
  //     return "ERROR! Countdown not a number.";
  //   }

  //   // Initialize the giveMap
  //   let giveMap = {};
  //   let currKey = "";
  //   let onKey = true;

  //   // Loop through the gives string for parsing
  //   for (let i = 0; i < gives.length; i++) {
  //     switch (gives[i]) {
  //       case ":":
  //         if (!onKey) {
  //           return "ERROR IN GIVE SECTION";
  //         } else {
  //           if (useType == "STATBOOST") {
  //             if (!((currKey == "Martial") || (currKey == "Prestige") || (currKey == "Intrigue"))) {
  //               return 'ERROR! DOES NOT BOOST "Martial", "Prestige", OR "Intrigue"';
  //             }
  //           }
  //           onKey = false;
  //         }
  //         break;
  //       case ";":
  //         if (onKey) {
  //           return "ERROR IN GIVE SECTION";
  //         } else {
  //           if (parseInt(giveMap[currKey])) {
  //             giveMap[currKey] = parseInt(giveMap[currKey]);
  //           } else {
  //             return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
  //           }
  //           currKey = "";
  //           onKey = true;
  //         }
  //         break;
  //       default:
  //         if (onKey) {
  //           currKey += gives[i];
  //         } else {
  //           if (!giveMap[currKey]) {
  //             giveMap[currKey] = "";
  //           }
  //           giveMap[currKey] += gives[i];
  //         }
  //         break;
  //     }
  //   }

  //   // Load the item data
  //   let itemData = await dbm.loadFile('shop', itemName);

  //   // Setting the usage case with countdown
  //   itemData.usageCase = { useType: useType, gives: giveMap, countdown: parseInt(countdown) };

  //   // Save the updated item data
  //   await dbm.saveFile('shop', itemName, itemData);

  //   // Constructing the return string
  //   let returnString = "Added a " + useType + " usage case to " + itemName + "\n\n";
  //   returnString += "On use, this item will give:\n";
  //   for (let key in giveMap) {
  //     returnString += ('"' + key + '" : "' + giveMap[key] + '"' + "\n");
  //   }

  //   returnString += "\n";
  //   returnString += "On use, this item will take nothing, having no use cost";

  //   returnString += "\n";
  //   returnString += "This item can only be used once every " + parseInt(countdown) + " hours";

  //   return returnString;
  // }

  // // Overloaded version with takes
  // static async addUseCaseWithCost(itemName, useType, gives, takes) {
  //   itemName = await this.findItemName(itemName);

  //   if (itemName == "ERROR") {
  //     return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME"
  //   }
  //   if (!(useType == "INCOMEROLE"|| useType == "STATBOOST")) {
  //     return "ERROR! USE PROPER CASE KEYWORD.";
  //   }
  //   let giveMap = {};
  //   let currKey = "";
  //   let onKey = true;
  //   for (let i = 0; i < gives.length; i++) {
  //     switch (gives[i]) {
  //       case ":": 
  //         if (!onKey) {
  //           return "ERROR IN GIVE SECTION";
  //         } else {
  //           if (useType == "STATBOOST")  {
  //             if (!((currKey == "Martial") || (currKey == "Prestige") || (currKey == "Intrigue"))) {
  //               return 'ERROR! DOES NOT BOOST "Martial", "Prestige", OR "Intrigue"';
  //             }
  //           }
  //           onKey = false;
  //         }
  //         break;
  //       case ";":
  //         if (onKey) {
  //           return "ERROR IN GIVE SECTION";
  //         } else {
  //           if (parseInt(giveMap[currKey])) {
  //             giveMap[currKey] = parseInt(giveMap[currKey]);
  //           } else {
  //             return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
  //           }
  //           currKey = "";
  //           onKey = true;
  //         }
  //         break;
  //       default:
  //         if (onKey) {
  //           currKey += gives[i];
  //         } else {
  //           if (!giveMap[currKey]) {
  //             giveMap[currKey] = "";
  //           }
  //           giveMap[currKey] += gives[i];
  //         }
  //         break;
  //     }
  //   }
  //   let takesMap = {};
  //   currKey = "";
  //   onKey = true;
  //   for (let i = 0; i < takes.length; i++) {
  //     switch (takes[i]) {
  //       case "\n" :
  //         break;
  //       case ":": 
  //         if (!onKey) {
  //           return "ERROR IN TAKES SECTION";
  //         } else {
  //           if (useType == "INCOMEROLE")  {
  //             if (await this.getItemPrice(currKey) == "ERROR") {
  //               return "ERROR! DOES NOT TAKE A REAL ITEM";
  //             }
  //           } else if (useType == "STATBOOST")  {
  //             if (!((currKey == "Martial") || (currKey == "Prestige") || (currKey == "Intrigue"))) {
  //               return 'ERROR! DOES NOT REMOVE "Martial", "Prestige", OR "Intrigue"';
  //             }
  //           }
  //           onKey = false;
  //         }
  //         break;
  //       case ";":
  //         if (onKey) {
  //           return "ERROR IN TAKES SECTION";
  //         } else {
  //           if (parseInt(takesMap[currKey])) {
  //             takesMap[currKey] = parseInt(takesMap[currKey]);
  //           } else {
  //             return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
  //           }
  //           currKey = "";
  //           onKey = true;
  //         }
  //         break;
  //       default:
  //         if (onKey) {
  //           currKey += takes[i];
  //         } else {
  //           if (!takesMap[currKey]) {
  //             takesMap[currKey] = "";
  //           }
  //           takesMap[currKey] += takes[i];
  //         }
  //         break;
  //     }
  //   }

  //   let itemData = await dbm.loadFile('shop', itemName);
  //   itemData.usageCase = { useType: useType, gives: parseGives(gives), takes: parseTakes(takes) };
  //   await dbm.saveFile('shop', itemName, itemData);

  //   let returnString = "Added a " + useType + " usage case to " + itemName + "\n\n";
  //   if (useType != "CRAFTING") {
  //     returnString += "On use, this item will give:\n"
  //     for (let key in giveMap) {
  //       returnString += ('"' + key + '" : "' + giveMap[key] + '"' + "\n");
  //     }
  //     returnString += "\n";
  //     returnString += "On use, this item will take:\n"
  //     for (let key in takesMap) {
  //       returnString += ('"' + key + '" : "' + takesMap[key] + '"' + "\n");
  //     }
  //   } else {
  //     returnString += "To craft, this item will take:\n"
  //     for (let key in takesMap) {
  //       returnString += ('"' + key + '" : "' + takesMap[key] + '"' + "\n");
  //     }
  //   }

  //   return returnString;
  // }

  // //Version with countdown
  // static async addUseCaseWithCostAndCountdown(itemName, useType, gives, takes, countdown) {
  //   itemName = await this.findItemName(itemName);

  //   if (itemName == "ERROR") {
  //     return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME"
  //   }
  //   if (!(useType == "INCOMEROLE" || useType == "STATBOOST")) {
  //     return "ERROR! USE PROPER CASE KEYWORD.";
  //   }
  //   if (!parseInt(countdown)) {
  //     return "ERROR! Countdown not a number.";
  //   }
  //   let giveMap = {};
  //   let currKey = "";
  //   let onKey = true;
  //   for (let i = 0; i < gives.length; i++) {
  //     switch (gives[i]) {
  //       case ":": 
  //         if (!onKey) {
  //           return "ERROR IN GIVE SECTION";
  //         } else {
  //           if (useType == "STATBOOST")  {
  //             if (!((currKey == "Martial") || (currKey == "Prestige") || (currKey == "Intrigue"))) {
  //               return 'ERROR! DOES NOT BOOST "Martial", "Prestige", OR "Intrigue"';
  //             }
  //           }
  //           onKey = false;
  //         }
  //         break;
  //       case ";":
  //         if (onKey) {
  //           return "ERROR IN GIVE SECTION";
  //         } else {
  //           if (parseInt(giveMap[currKey])) {
  //             giveMap[currKey] = parseInt(giveMap[currKey]);
  //           } else {
  //             return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
  //           }
  //           currKey = "";
  //           onKey = true;
  //         }
  //         break;
  //       default:
  //         if (onKey) {
  //           currKey += gives[i];
  //         } else {
  //           if (!giveMap[currKey]) {
  //             giveMap[currKey] = "";
  //           }
  //           giveMap[currKey] += gives[i];
  //         }
  //         break;
  //     }
  //   }
  //   let takesMap = {};
  //   currKey = "";
  //   onKey = true;
  //   for (let i = 0; i < takes.length; i++) {
  //     switch (takes[i]) {
  //       case "\n" :
  //         break;
  //       case ":": 
  //         if (!onKey) {
  //           return "ERROR IN TAKES SECTION";
  //         } else {
  //           if (useType == "INCOMEROLE")  {
  //             if (await this.getItemPrice(currKey) == "ERROR") {
  //               return "ERROR! DOES NOT TAKE A REAL ITEM";
  //             }
  //           } else if (useType == "STATBOOST")  { 
  //             if (!((currKey == "Martial") || (currKey == "Prestige") || (currKey == "Intrigue"))) {
  //               return 'ERROR! DOES NOT REMOVE "Martial", "Prestige", OR "Intrigue"';
  //             }
  //           }
  //           onKey = false;
  //         }
  //         break;
  //       case ";":
  //         if (onKey) {
  //           return "ERROR IN TAKES SECTION";
  //         } else {
  //           if (parseInt(takesMap[currKey])) {
  //             takesMap[currKey] = parseInt(takesMap[currKey]);
  //           } else {
  //             return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
  //           }
  //           currKey = "";
  //           onKey = true;
  //         }
  //         break;
  //       default:
  //         if (onKey) {
  //           currKey += takes[i];
  //         } else {
  //           if (!takesMap[currKey]) {
  //             takesMap[currKey] = "";
  //           }
  //           takesMap[currKey] += takes[i];
  //         }
  //         break;
  //     }
  //   }
  //   let itemData = await dbm.loadFile('shop', itemName);
  //   itemData.usageCase = { useType, gives: parseGives(gives), takes: parseTakes(takes), countdown: parseInt(countdown) };
  //   await dbm.saveFile('shop', itemName, itemData);

  //   let returnString = "Added a " + useType + " usage case to " + itemName + "\n\n";
  //   returnString += "On use, this item will give:\n"
  //   for (let key in giveMap) {
  //     returnString += ('"' + key + '" : "' + giveMap[key] + '"' + "\n");
  //   }
  //   returnString += "\n";
  //   returnString += "On use, this item will take:\n"
  //   for (let key in takesMap) {
  //     returnString += ('"' + key + '" : "' + takesMap[key] + '"' + "\n");
  //   }

  //   returnString += "\n";
  //   returnString += "This item can only be used once every " + parseInt(countdown) + " hours";

  //   return returnString;
  // }

  // static async addRecipe(itemName, takes, countdown) {
  //   itemName = await this.findItemName(itemName);

  //   if (itemName == "ERROR") {
  //     return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME"
  //   }
  //   if (!parseInt(countdown)) {
  //     return "ERROR! Countdown not a number.";
  //   }

  //   let takesMap = {};
  //   let currKey = "";
  //   let onKey = true;
  //   for (let i = 0; i < takes.length; i++) {
  //     switch (takes[i]) {
  //       case "\n" :
  //         break;
  //       case ":": 
  //         if (!onKey) {
  //           return "ERROR IN TAKES SECTION";
  //         } else {
  //           if (await this.getItemPrice(currKey) == "ERROR") {
  //             return "ERROR! DOES NOT TAKE A REAL ITEM";
  //           }
  //           onKey = false;
  //         }
  //         break;
  //       case ";":
  //         if (onKey) {
  //           return "ERROR IN TAKES SECTION";
  //         } else {
  //           if (parseInt(takesMap[currKey])) {
  //             takesMap[currKey] = parseInt(takesMap[currKey]);
  //           } else {
  //             return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
  //           }
  //           currKey = "";
  //           onKey = true;
  //         }
  //         break;
  //       default:
  //         if (onKey) {
  //           currKey += takes[i];
  //         } else {
  //           if (!takesMap[currKey]) {
  //             takesMap[currKey] = "";
  //           }
  //           takesMap[currKey] += takes[i];
  //         }
  //         break;
  //     }
  //   }
  //   let data = await dbm.loadFile('shop', itemName);
  //   data.recipe = {};
  //   data.recipe.takes = takesMap;
  //   data.recipe.countdown = countdown;
  //   dbm.saveFile('shop', itemName, data);

  //   let returnString = "Added a recipe for " + itemName + "\n\n";
  //   returnString += "\n";
  //   returnString += "To create, this item will take:\n"
  //   for (let key in takesMap) {
  //     returnString += ('"' + key + '" : "' + takesMap[key] + '"' + "\n");
  //   }

  //   returnString += "\n";
  //   returnString += "This item will take " + parseInt(countdown) + " hours to use";

  //   return returnString;
  // }
  
  // static async editRecipePlaceholders(itemName) {
  //   itemName = await this.findItemName(itemName);

  //   let itemData = await dbm.loadFile('shop', itemName);

  //   //item takes must be restructured in form 'ITEM:AMOUNT;\nITEM2:AMOUNT2;'
  //   let takesString = "";
  //   for (let key in itemData.recipe.takes) {
  //     takesString += (key + ":" + itemData.recipe.takes[key] + ";");
  //   }
  //   let returnArray = [itemName, takesString, itemData.recipe.countdown];
  //   return returnArray;
  // }

  // static async addUseDescription(itemName, itemDescription) {
  //   itemName = await this.findItemName(itemName);

  //   let data = await dbm.loadCollection('shop');
  //   if (!data[itemName] || !data[itemName].usageCase) {
  //     return "ERROR! DOES NOT ALREADY HAVE A USE CASE. USE /addusecase FIRST"
  //   }
    
  //   data[itemName].usageCase.description = itemDescription
  //   dbm.saveCollection('shop', data);

  //   let returnString = "Added the following description to " + itemName + ":\n\n";
  //   returnString += itemDescription;

  //   return returnString;
  // }

  // static async addUseImage(itemName, avatarURL) {
  //   try {
  //     // Make a HEAD request to check if the URL leads to a valid image
  //     const response = await axios.head(avatarURL, { maxRedirects: 5 });
  
  //     // Check if the response status code indicates success (e.g., 200)
  //     if (response.status === 200) {
  //       let collectionName = 'shop';

  //       itemName = await this.findItemName(itemName);

  //       if (itemName == "ERROR") {
  //         return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME"
  //       }

  //       let data = await dbm.loadFile(collectionName, itemName);
  //       if (data.usageCase) {
  //         data.usageCase.image = avatarURL;
  
  //         dbm.saveFile(collectionName, fileName, data);
  //         return "Image has been set";
  //       } else {
  //         return "No item usage case existing";
  //       }
  //     } else {
  //       return "Error: Avatar URL is not valid (HTTP status code " + response.status + ").";
  //     }
  //   } catch (error) {
  //     return "Unable to check the Avatar URL. " + error.message;
  //   }
  // }
  // Function to edit item placeholders
  // static async editItemPlaceholders(itemName) {
  //   itemName = await this.findItemName(itemName);

  //   let itemData = await dbm.loadFile('shop', itemName);
  //   let returnArray = [itemName, itemData.icon, String(itemData.price), itemData.description, itemData.category];
  //   return returnArray;
  // }
}

module.exports = shop;
