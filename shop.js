const dbm = require('./database-manager'); // Importing the database manager
const Discord = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

class shop {
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
  static async addItem(itemName, itemIcon, itemPrice, itemDescription, itemCategory) {
    let itemData = {
      price: itemPrice,
      icon: itemIcon,
      description: itemDescription,
      category: itemCategory
    };
    await dbm.saveFile('shop', itemName, itemData);
  }

  static async addNoCostItem(itemName, itemIcon, itemDescription, itemCategory) {
    let itemData = {
      icon: itemIcon,
      description: itemDescription,
      category: itemCategory
    };
    await dbm.saveFile('shop', itemName, itemData);
  }

  // Function to edit item placeholders
  static async editItemPlaceholders(itemName) {
    itemName = await this.findItemName(itemName);

    let itemData = await dbm.loadFile('shop', itemName);
    let returnArray = [itemName, itemData.icon, String(itemData.price), itemData.description, itemData.category];
    return returnArray;
  }

  // Function to add a use case to an item
  static async addUseCase(itemName, useType, gives) {
    itemName = await this.findItemName(itemName);

    // Validate the item
    if (await itemName == "ERROR") {
      return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME";
    }

    // Validate the useType
    if (!(useType == "INCOMEROLE" || useType == "STATBOOST")) {
      return "ERROR! USE PROPER CASE KEYWORD.";
    }

    // Initialize the giveMap
    let giveMap = {};
    let currKey = "";
    let onKey = true;

    // Loop through the gives string
    for (let i = 0; i < gives.length; i++) {
      switch (gives[i]) {
        case ":":
          if (!onKey) {
            return "ERROR IN GIVE SECTION";
          } else {
            if (useType == "STATBOOST") {
              if (!((currKey == "Martial") || (currKey == "Prestige") || (currKey == "Intrigue"))) {
                return 'ERROR! DOES NOT BOOST "Martial", "Prestige", OR "Intrigue"';
              }
            }
            onKey = false;
          }
          break;
        case ";":
          if (onKey) {
            return "ERROR IN GIVE SECTION";
          } else {
            if (parseInt(giveMap[currKey])) {
              giveMap[currKey] = parseInt(giveMap[currKey]);
            } else {
              return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
            }
            currKey = "";
            onKey = true;
          }
          break;
        default:
          if (onKey) {
            currKey += gives[i];
          } else {
            if (!giveMap[currKey]) {
              giveMap[currKey] = "";
            }
            giveMap[currKey] += gives[i];
          }
          break;
      }
    }

    // Load the item data
    let itemData = await dbm.loadFile('shop', itemName);

    // Assigning parsed data to itemData
    itemData.usageCase = { useType, gives: giveMap };

    // Save the updated item data
    await dbm.saveFile('shop', itemName, itemData);

    // Constructing the return string
    let returnString = "Added a " + useType + " usage case to " + itemName + "\n\n";
    returnString += "On use, this item will give:\n";
    for (let key in giveMap) {
      returnString += ('"' + key + '" : "' + giveMap[key] + '"' + "\n");
    }
    returnString += "\n";
    returnString += "On use, this item will take nothing, having no use cost";

    return returnString;
  }

  // Function to remove a use case from an item
  static async removeUseCase(itemName) {
    // Find the correct item name considering case sensitivity
    itemName = await this.findItemName(itemName);

    // Load the item data
    let itemData = await dbm.loadFile('shop', itemName);

    // Check if the item already has a use case
    if (!itemData.usageCase) {
      return "ERROR! DOES NOT ALREADY HAVE A USE CASE. USE /addusecase FIRST";
    }

    // Remove the use case
    delete itemData.usageCase;

    // Save the updated item data
    await dbm.saveFile('shop', itemName, itemData);

    return "Removed the usage case from " + itemName;
  }

  // Function to edit use case placeholders
  static async editUseCasePlaceholders(itemName) {
    // Find the correct item name considering case sensitivity
    itemName = await this.findItemName(itemName);

    // Load the item data
    let itemData = await dbm.loadFile('shop', itemName);

    // Check if the item already has a use case
    if (!itemData.usageCase) {
      return "ERROR! DOES NOT ALREADY HAVE A USE CASE. USE /addusecase FIRST";
    }

    // Construct return array with use case details
    let returnArray = [];
    returnArray[0] = itemName;
    returnArray[1] = itemData.usageCase.useType;
    
    // Construct givesString from the gives map
    let givesString = "";
    for (let key in itemData.usageCase.gives) {
      givesString += (key + ":" + itemData.usageCase.gives[key] + ";");
    }
    returnArray[2] = givesString;

    // Construct takesString if takes map is present
    if (itemData.usageCase.takes) {
      let takesString = "";
      for (let key in itemData.usageCase.takes) {
        takesString += (key + ":" + itemData.usageCase.takes[key] + ";");
      }
      returnArray[3] = takesString;
    } else {
      returnArray[3] = "";
    }

    // Add countdown details if present
    if (itemData.usageCase.countdown) {
      returnArray[4] = itemData.usageCase.countdown / 3600;
    } else {
      returnArray[4] = "";
    }

    return returnArray;
  }

  // Function to add a use case with countdown
  static async addUseCaseWithCountdown(itemName, useType, gives, countdown) {
    itemName = await this.findItemName(itemName);

    // Validate the item
    if (itemName == "ERROR") {
      return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME";
    }

    // Validate the useType and countdown
    if (!(useType == "INCOMEROLE" || useType == "STATBOOST")) {
      return "ERROR! USE PROPER CASE KEYWORD.";
    }
    if (!parseInt(countdown)) {
      return "ERROR! Countdown not a number.";
    }

    // Initialize the giveMap
    let giveMap = {};
    let currKey = "";
    let onKey = true;

    // Loop through the gives string for parsing
    for (let i = 0; i < gives.length; i++) {
      switch (gives[i]) {
        case ":":
          if (!onKey) {
            return "ERROR IN GIVE SECTION";
          } else {
            if (useType == "STATBOOST") {
              if (!((currKey == "Martial") || (currKey == "Prestige") || (currKey == "Intrigue"))) {
                return 'ERROR! DOES NOT BOOST "Martial", "Prestige", OR "Intrigue"';
              }
            }
            onKey = false;
          }
          break;
        case ";":
          if (onKey) {
            return "ERROR IN GIVE SECTION";
          } else {
            if (parseInt(giveMap[currKey])) {
              giveMap[currKey] = parseInt(giveMap[currKey]);
            } else {
              return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
            }
            currKey = "";
            onKey = true;
          }
          break;
        default:
          if (onKey) {
            currKey += gives[i];
          } else {
            if (!giveMap[currKey]) {
              giveMap[currKey] = "";
            }
            giveMap[currKey] += gives[i];
          }
          break;
      }
    }

    // Load the item data
    let itemData = await dbm.loadFile('shop', itemName);

    // Setting the usage case with countdown
    itemData.usageCase = { useType: useType, gives: giveMap, countdown: parseInt(countdown) * 3600 };

    // Save the updated item data
    await dbm.saveFile('shop', itemName, itemData);

    // Constructing the return string
    let returnString = "Added a " + useType + " usage case to " + itemName + "\n\n";
    returnString += "On use, this item will give:\n";
    for (let key in giveMap) {
      returnString += ('"' + key + '" : "' + giveMap[key] + '"' + "\n");
    }

    returnString += "\n";
    returnString += "On use, this item will take nothing, having no use cost";

    returnString += "\n";
    returnString += "This item can only be used once every " + parseInt(countdown) + " hours";

    return returnString;
  }

  // Overloaded version with takes
  static async addUseCaseWithCost(itemName, useType, gives, takes) {
    itemName = await this.findItemName(itemName);

    if (itemName == "ERROR") {
      return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME"
    }
    if (!(useType == "INCOMEROLE"|| useType == "STATBOOST")) {
      return "ERROR! USE PROPER CASE KEYWORD.";
    }
    let giveMap = {};
    let currKey = "";
    let onKey = true;
    for (let i = 0; i < gives.length; i++) {
      switch (gives[i]) {
        case ":": 
          if (!onKey) {
            return "ERROR IN GIVE SECTION";
          } else {
            if (useType == "STATBOOST")  {
              if (!((currKey == "Martial") || (currKey == "Prestige") || (currKey == "Intrigue"))) {
                return 'ERROR! DOES NOT BOOST "Martial", "Prestige", OR "Intrigue"';
              }
            }
            onKey = false;
          }
          break;
        case ";":
          if (onKey) {
            return "ERROR IN GIVE SECTION";
          } else {
            if (parseInt(giveMap[currKey])) {
              giveMap[currKey] = parseInt(giveMap[currKey]);
            } else {
              return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
            }
            currKey = "";
            onKey = true;
          }
          break;
        default:
          if (onKey) {
            currKey += gives[i];
          } else {
            if (!giveMap[currKey]) {
              giveMap[currKey] = "";
            }
            giveMap[currKey] += gives[i];
          }
          break;
      }
    }
    let takesMap = {};
    currKey = "";
    onKey = true;
    for (let i = 0; i < takes.length; i++) {
      switch (takes[i]) {
        case "\n" :
          break;
        case ":": 
          if (!onKey) {
            return "ERROR IN TAKES SECTION";
          } else {
            if (useType == "INCOMEROLE")  {
              if (await this.getItemPrice(currKey) == "ERROR") {
                return "ERROR! DOES NOT TAKE A REAL ITEM";
              }
            } else if (useType == "STATBOOST")  {
              if (!((currKey == "Martial") || (currKey == "Prestige") || (currKey == "Intrigue"))) {
                return 'ERROR! DOES NOT REMOVE "Martial", "Prestige", OR "Intrigue"';
              }
            }
            onKey = false;
          }
          break;
        case ";":
          if (onKey) {
            return "ERROR IN TAKES SECTION";
          } else {
            if (parseInt(takesMap[currKey])) {
              takesMap[currKey] = parseInt(takesMap[currKey]);
            } else {
              return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
            }
            currKey = "";
            onKey = true;
          }
          break;
        default:
          if (onKey) {
            currKey += takes[i];
          } else {
            if (!takesMap[currKey]) {
              takesMap[currKey] = "";
            }
            takesMap[currKey] += takes[i];
          }
          break;
      }
    }

    let itemData = await dbm.loadFile('shop', itemName);
    itemData.usageCase = { useType: useType, gives: parseGives(gives), takes: parseTakes(takes) };
    await dbm.saveFile('shop', itemName, itemData);

    let returnString = "Added a " + useType + " usage case to " + itemName + "\n\n";
    if (useType != "CRAFTING") {
      returnString += "On use, this item will give:\n"
      for (let key in giveMap) {
        returnString += ('"' + key + '" : "' + giveMap[key] + '"' + "\n");
      }
      returnString += "\n";
      returnString += "On use, this item will take:\n"
      for (let key in takesMap) {
        returnString += ('"' + key + '" : "' + takesMap[key] + '"' + "\n");
      }
    } else {
      returnString += "To craft, this item will take:\n"
      for (let key in takesMap) {
        returnString += ('"' + key + '" : "' + takesMap[key] + '"' + "\n");
      }
    }

    return returnString;
  }

  //Version with countdown
  static async addUseCaseWithCostAndCountdown(itemName, useType, gives, takes, countdown) {
    itemName = await this.findItemName(itemName);

    if (itemName == "ERROR") {
      return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME"
    }
    if (!(useType == "INCOMEROLE" || useType == "STATBOOST")) {
      return "ERROR! USE PROPER CASE KEYWORD.";
    }
    if (!parseInt(countdown)) {
      return "ERROR! Countdown not a number.";
    }
    let giveMap = {};
    let currKey = "";
    let onKey = true;
    for (let i = 0; i < gives.length; i++) {
      switch (gives[i]) {
        case ":": 
          if (!onKey) {
            return "ERROR IN GIVE SECTION";
          } else {
            if (useType == "STATBOOST")  {
              if (!((currKey == "Martial") || (currKey == "Prestige") || (currKey == "Intrigue"))) {
                return 'ERROR! DOES NOT BOOST "Martial", "Prestige", OR "Intrigue"';
              }
            }
            onKey = false;
          }
          break;
        case ";":
          if (onKey) {
            return "ERROR IN GIVE SECTION";
          } else {
            if (parseInt(giveMap[currKey])) {
              giveMap[currKey] = parseInt(giveMap[currKey]);
            } else {
              return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
            }
            currKey = "";
            onKey = true;
          }
          break;
        default:
          if (onKey) {
            currKey += gives[i];
          } else {
            if (!giveMap[currKey]) {
              giveMap[currKey] = "";
            }
            giveMap[currKey] += gives[i];
          }
          break;
      }
    }
    let takesMap = {};
    currKey = "";
    onKey = true;
    for (let i = 0; i < takes.length; i++) {
      switch (takes[i]) {
        case "\n" :
          break;
        case ":": 
          if (!onKey) {
            return "ERROR IN TAKES SECTION";
          } else {
            if (useType == "INCOMEROLE")  {
              if (await this.getItemPrice(currKey) == "ERROR") {
                return "ERROR! DOES NOT TAKE A REAL ITEM";
              }
            } else if (useType == "STATBOOST")  { 
              if (!((currKey == "Martial") || (currKey == "Prestige") || (currKey == "Intrigue"))) {
                return 'ERROR! DOES NOT REMOVE "Martial", "Prestige", OR "Intrigue"';
              }
            }
            onKey = false;
          }
          break;
        case ";":
          if (onKey) {
            return "ERROR IN TAKES SECTION";
          } else {
            if (parseInt(takesMap[currKey])) {
              takesMap[currKey] = parseInt(takesMap[currKey]);
            } else {
              return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
            }
            currKey = "";
            onKey = true;
          }
          break;
        default:
          if (onKey) {
            currKey += takes[i];
          } else {
            if (!takesMap[currKey]) {
              takesMap[currKey] = "";
            }
            takesMap[currKey] += takes[i];
          }
          break;
      }
    }
    let itemData = await dbm.loadFile('shop', itemName);
    itemData.usageCase = { useType, gives: parseGives(gives), takes: parseTakes(takes), countdown: parseInt(countdown) * 3600 };
    await dbm.saveFile('shop', itemName, itemData);

    let returnString = "Added a " + useType + " usage case to " + itemName + "\n\n";
    returnString += "On use, this item will give:\n"
    for (let key in giveMap) {
      returnString += ('"' + key + '" : "' + giveMap[key] + '"' + "\n");
    }
    returnString += "\n";
    returnString += "On use, this item will take:\n"
    for (let key in takesMap) {
      returnString += ('"' + key + '" : "' + takesMap[key] + '"' + "\n");
    }

    returnString += "\n";
    returnString += "This item can only be used once every " + parseInt(countdown) + " hours";

    return returnString;
  }

  static async addRecipe(itemName, takes, countdown) {
    itemName = await this.findItemName(itemName);

    if (itemName == "ERROR") {
      return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME"
    }
    if (!parseInt(countdown)) {
      return "ERROR! Countdown not a number.";
    }

    let takesMap = {};
    let currKey = "";
    let onKey = true;
    for (let i = 0; i < takes.length; i++) {
      switch (takes[i]) {
        case "\n" :
          break;
        case ":": 
          if (!onKey) {
            return "ERROR IN TAKES SECTION";
          } else {
            if (await this.getItemPrice(currKey) == "ERROR") {
              return "ERROR! DOES NOT TAKE A REAL ITEM";
            }
            onKey = false;
          }
          break;
        case ";":
          if (onKey) {
            return "ERROR IN TAKES SECTION";
          } else {
            if (parseInt(takesMap[currKey])) {
              takesMap[currKey] = parseInt(takesMap[currKey]);
            } else {
              return "ERROR! INTEGER VALUES NOT GIVEN FOR NUMBER";
            }
            currKey = "";
            onKey = true;
          }
          break;
        default:
          if (onKey) {
            currKey += takes[i];
          } else {
            if (!takesMap[currKey]) {
              takesMap[currKey] = "";
            }
            takesMap[currKey] += takes[i];
          }
          break;
      }
    }
    let data = await dbm.loadFile('shop', itemName);
    data.recipe = {};
    data.recipe.takes = takesMap;
    data.recipe.countdown = parseInt(countdown) * 3600;
    dbm.saveFile('shop', itemName, data);

    let returnString = "Added a recipe for " + itemName + "\n\n";
    returnString += "\n";
    returnString += "To create, this item will take:\n"
    for (let key in takesMap) {
      returnString += ('"' + key + '" : "' + takesMap[key] + '"' + "\n");
    }

    returnString += "\n";
    returnString += "This item will take " + parseInt(countdown) + " hours to use";

    return returnString;
  }
  
  static async editRecipePlaceholders(itemName) {
    itemName = await this.findItemName(itemName);

    let itemData = await dbm.loadFile('shop', itemName);

    //item takes must be restructured in form 'ITEM:AMOUNT;\nITEM2:AMOUNT2;'
    let takesString = "";
    for (let key in itemData.recipe.takes) {
      takesString += (key + ":" + itemData.recipe.takes[key] + ";");
    }
    let returnArray = [itemName, takesString, itemData.recipe.countdown];
    return returnArray;
  }

  static async addUseDescription(itemName, itemDescription) {
    itemName = await this.findItemName(itemName);

    let data = await dbm.loadCollection('shop');
    if (!data[itemName] || !data[itemName].usageCase) {
      return "ERROR! DOES NOT ALREADY HAVE A USE CASE. USE /addusecase FIRST"
    }
    
    data[itemName].usageCase.description = itemDescription
    dbm.saveCollection('shop', data);

    let returnString = "Added the following description to " + itemName + ":\n\n";
    returnString += itemDescription;

    return returnString;
  }

  static async addUseImage(itemName, avatarURL) {
    try {
      // Make a HEAD request to check if the URL leads to a valid image
      const response = await axios.head(avatarURL, { maxRedirects: 5 });
  
      // Check if the response status code indicates success (e.g., 200)
      if (response.status === 200) {
        let collectionName = 'shop';

        itemName = await this.findItemName(itemName);

        if (itemName == "ERROR") {
          return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME"
        }

        let data = await dbm.loadFile(collectionName, itemName);
        if (data.usageCase) {
          data.usageCase.image = avatarURL;
  
          dbm.saveFile(collectionName, fileName, data);
          return "Image has been set";
        } else {
          return "No item usage case existing";
        }
      } else {
        return "Error: Avatar URL is not valid (HTTP status code " + response.status + ").";
      }
    } catch (error) {
      return "Unable to check the Avatar URL. " + error.message;
    }
  }

  static async createShopEmbed(page) {
    page = Number(page);
    const itemsPerPage = 25;
    // Load data from shop.json and shoplayout.json
    const shopData = await dbm.loadCollection('shop');
    const rawShopLayoutData = await dbm.loadFile('shoplayout', 'shopLayout');
    const shopLayoutData = await this.convertToShopMap(rawShopLayoutData);

    let startIndices = [];
    startIndices[0] = 0;
    const shopCategories = Object.keys(shopLayoutData);

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
      .setTitle(':coin: Shop')
      .setColor(0x36393e);

      let descriptionText = '';

      for (const category of pageItems) {
        const endSpaces = "-".repeat(20 - category.length - 2);
        descriptionText += `**\`--${category}${endSpaces}\`**\n`;
        descriptionText += shopLayoutData[category]
          .map((item) => {
            const icon = shopData[item].icon;
            const price = shopData[item].price;

            const alignSpaces = ' '.repeat(30 - item.length - ("" + price).length);
    
            // Create the formatted line
            return `${icon} \`${item}${alignSpaces}${price}\` :coin:`;
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
      let category = shopData[itemArray[i]].category;
      if (!itemCategories[category]) {
        itemCategories[category] = [];
      }
      itemCategories[category].push(itemArray[i]);
    }



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

    console.log(itemCategories);

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
        const endSpaces = "-".repeat(20 - category.length - 2);
        descriptionText += `**\`--${category}${endSpaces}\`**\n`;
        descriptionText += itemCategories[category]
          .map((item) => {
            const icon = shopData[item].icon;
    
            // Create the formatted line
            console.log(`${icon} ${item}`);
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

  //function to create an embed of player inventory
  static async createInventoryEmbed(charID) {
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
      const category = shopData[item].category;
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
      const endSpaces = "-".repeat(20 - category.length - 2);
      descriptionText += `**\`--${category}${endSpaces}\`**\n`;
      descriptionText += inventory[category]
        .map((item) => {
          const icon = shopData[item].icon;
          const quantity = charData[charID].inventory[item];

          const alignSpaces = ' '.repeat(30 - item.length - ("" + quantity).length);
  
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
  static async shop() {
    // Load the data
    let data = await dbm.loadCollection('shop');
    let superstring = ""
    for (let [key, value] of Object.entries(data)) {
      superstring = superstring + (String(value["icon"]) + " " + key + " : " + String(value["price"]) + "\n");
    }
    return superstring;
  }

  // Function to remove items - removeItem(name)
  static removeItem(itemName) {
    // Set the database name
    let fileName = 'shop';
    itemName = this.findItemName(itemName);
    if (itemName == "ERROR") {
      return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME";
    }
    // Try to remove the item, and if it doesn't exist, catch the error
    try {
      dbm.docDelete(fileName, itemName);
    } catch (error) {
      // Handle the error or do nothing
      // In JavaScript, you might want to handle errors differently
    }
  }

  static async getItemPrice(itemName) {
    let data = await dbm.loadCollection('shop');
    var price;
    if (data[itemName]) {
      if (data[itemName].price == undefined) {
        return "No Price Item!";
      }
      price = data[itemName].price;
    } else {
      return "ERROR";
    }
    return price;
  }

  static async getItemCategory(itemName) {
    let data = await dbm.loadCollection('shop');
    var category;
    if (data[itemName]) {
      category = data[itemName].category;
    } else {
      return "ERROR";
    }
    return category;
  }

  static async getItemIcon(itemName) {
    let data = await dbm.loadCollection('shop');
    var icon;
    if (data[itemName]) {
      icon = data[itemName].icon;
    } else {
      return "ERROR";
    }
    return icon;
  }

  static async inspect(itemName) {
    const PrestigeEmoji = '<:Prestige:1165722839228354610>';
    const MartialEmoji = '<:Martial:1165722873248354425>';
    const IntrigueEmoji = '<:Intrigue:1165722896522563715>';
    itemName = await this.findItemName(itemName);

    if (itemName == "ERROR") {
      return "Item not found!";
    }

    let data = await dbm.loadCollection('shop');
    let itemData = data[itemName];
    
    const inspectEmbed = new Discord.EmbedBuilder()
      .setTitle('**__Item:__ ' +  itemData.icon + " " + itemName + "**")
      .setColor(0x36393e);

    if (itemData) {
      let aboutString = "";
      if (itemData.price) {
        aboutString = "Price: :coin: " + itemData.price;
      }
      let descriptionString = "**Description:\n**" + itemData.description;
      if (itemData.usageCase) {
        descriptionString += ("\nUsage type: ");
        switch (itemData.usageCase.useType) {
          case "INCOMEROLE":
            descriptionString += "Income Role";
            break;
          case "STATBOOST":
            descriptionString += "Statboost";
            break;
          default:
            descriptionString += "ERROR";
            break;
        }

        aboutString += "\nGives:";
        for (let key in itemData.usageCase.gives) {
          let icon;
          if (data[key]) {
            icon = data[key].icon;
          }
          else {
            switch (key) {
              case "Martial":
                icon = MartialEmoji;
                break;
              case "Prestige":
                icon = PrestigeEmoji;
                break;
              case "Intrigue":
                icon = IntrigueEmoji;
                break;
              default:
                icon = ":coin:";
                break;
            }
          }
          aboutString += ("\n`   `- " + icon + " " + key + ": " + itemData.usageCase.gives[key]);
        }

        if (itemData.usageCase.takes) {
          aboutString += "\nTakes:";
          for (let key in itemData.usageCase.takes) {
            let icon;
            if (data[key]) {
              icon = data[key].icon;
            }
            else {
              switch (key) {
                case "Martial":
                  icon = MartialEmoji;
                  break;
                case "Prestige":
                  icon = PrestigeEmoji;
                  break;
                case "Intrigue":
                  icon = IntrigueEmoji;
                  break;
                default:
                  icon = ":coin:";
                  break;
              }
            }
            aboutString += ("\n`   `- " + icon + " " + key + ": " + itemData.usageCase.takes[key]);
          }
        }
      }

      inspectEmbed.setDescription(descriptionString);
      
      if (aboutString.length > 0)
      {
        inspectEmbed.addFields({ name: '**About**', value: aboutString });
      }

      if (itemData.recipe) {
        let recipeString = "";
        if (itemData.recipe.takes) {
          recipeString += "\nTakes:";
          for (let key in itemData.recipe.takes) {
            let icon;
            if (data[key]) {
              icon = data[key].icon;
            } else {
              switch (key) {
                case "Martial":
                  icon = MartialEmoji;
                  break;
                case "Prestige":
                  icon = PrestigeEmoji;
                  break;
                case "Intrigue":
                  icon = IntrigueEmoji;
                  break;
                default:
                  icon = ":coin:";
                  break;
              }
            }
            recipeString += ("\n`   `- " + icon + " " + key + ": " + itemData.recipe.takes[key]);
          }
          inspectEmbed.addFields({ name: '**Recipe**', value: recipeString });
        }
      }
      return inspectEmbed;
    } else {
      return "This is not an item in the shop! Make sure to include spaces and not include the emoji.";
    }

  }

  static async buyItem(itemName, charID, numToBuy) {
    itemName = await this.findItemName(itemName);
    const price = await this.getItemPrice(itemName);
    if (price === "ERROR" || price === "No Price Item!") {
      return "Not a valid item to purchase!";
    }
    let charCollection = 'characters';

    let returnString;
    let charData = await dbm.loadFile(charCollection, charID);
    if (charData.balance <= (price * numToBuy)) {
      returnString = "You do not have enough gold!";
      dbm.saveFile(charCollection, charID, charData);
      return returnString;
    } else {
      charData.balance -= (price * numToBuy);

      if (!charData.inventory[itemName]) {
        charData.inventory[itemName] = 0;
      }
      charData.inventory[itemName] += numToBuy;

      returnString = "Succesfully bought " + numToBuy + " " + itemName;
      dbm.saveFile(charCollection, charID, charData);
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

          const item = line.slice(0, -1); // Remove the trailing semicolon

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

          const item = line.slice(0, -1); // Remove the trailing semicolon

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
          shopData[item].category = categoryToEdit;
        }
      }
      dbm.saveCollection("shop", shopData);

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

      dbm.saveFile("shoplayout", "shopLayout", layoutData);

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
}

module.exports = shop;