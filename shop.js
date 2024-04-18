const dbm = require('./database-manager'); // Importing the database manager
const Discord = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

class shop {
  //Declare constants for class 
  static infoOptions = ['Name', 'Icon', 'Category', 'Image', 'Description'];
  static shopOptions = ['Price', 'Need Role', 'Give Role', 'Take Role', 'Quantity', 'Channels'];
  static usageOptions = [
      'Is Usable', 'Removed on Use', 'Need Role', 'Give Role', 'Take Role',
      'Show an Image', 'Show a Message', 'Give/Take Money', 'Cooldown',
      'Give Item', 'Give Item 2', 'Give Item 3', 'Give Item 4', 'Give Item 5',
      'Take Item', 'Take Item 2', 'Take Item 3', 'Take Item 4', 'Take Item 5',
      'Change Prestige', 'Change Martial', 'Change Intrigue', 'Revive', 'Durability'
    ];
  static recipeOptions = ['Ingredient 1', 'Ingreident 2', 'Ingredient 3', 'Ingredient 4', 'Ingredient 5', 'Ingredient 6',
      'Craft Time', 'Role Blacklist', 'Role Whitelist'
    ];
  //
  static statEmojis = {
    "Prestige": "<:Prestige:1165722839228354610>",
    "Martial": "<:Martial:1165722873248354425>",
    "Intrigue": "<:Intrigue:1165722896522563715>",
  }
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

    // Save the new item data
    await dbm.docDelete('shop', itemName);
    await dbm.saveFile('shop', itemName, newItemData);

    return `Item \`${itemName}\` updated to the new version`;
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
            const icon = shopData[item].infoOptions.Icon;
            const price = shopData[item].shopOptions.Price;

            const alignSpaces = ' '.repeat(30 - item.length - ("" + price).length);
            console.log(icon, item, price);
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
      let category = shopData[itemArray[i]].infoOptions.Category;
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
      const endSpaces = "-".repeat(20 - category.length - 2);
      descriptionText += `**\`--${category}${endSpaces}\`**\n`;
      descriptionText += inventory[category]
        .map((item) => {
          const icon = shopData[item].infoOptions.Icon;
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
      if (data[itemName].shopOptions.Price == undefined) {
        return "No Price Item!";
      }
      price = data[itemName].shopOptions.Price;
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
      if (itemData.shopOptions.Price) {
        aboutString = "Price: :coin: " + itemData.shopOptions.Price;
      }
      let descriptionString = "**Description:\n**" + itemData.infoOptions.Description;
      if (itemData.usageOptions["Is Usable"] == "Yes") {
        aboutString += "\nGives:";
        //Iterate through usageOptions to find any key that starts with "Give Item". If any exist, add them to the aboutString. The value will be a string "Number Name" that will have to be split (Name may contain spaces, such as Iron Spear)
        //Also search for anything starting with Change, which will be a change in prestige, martial, or intrigue. If they're positive, add this. This value will just be an integer in string form
        for (let key in itemData.usageOptions) {
          //Check if value is blank
          if (itemData.usageOptions[key] == "") {
            continue;
          }
          if (key == "Give/Take Money") {
            if (itemData.usageOptions[key] > 0) {
              aboutString += ("\n`   `- :coin: " + itemData.usageOptions[key]);
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
              let icon = this.statEmojis[key.split(" ")[1]];
              aboutString += ("\n`   `- " + icon + " " + key.split(" ")[1] + ": " + quantity);
            }
          }
          if (key == "Give Role") {
            let role = itemData.usageOptions[key];
            aboutString += ("\n" + role);
          }

          if (key == "Give/Take Money") {
            if (itemData.usageOptions[key] < 0) {
              aboutString += ("\n`   `- :coin: " + itemData.usageOptions[key]);
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
              let icon = this.statEmojis[key.split(" ")[1]];
              aboutString += ("\n`   `- " + icon + " " + key.split(" ")[1] + ": " + quantity);
            }
          }
          if (key == "Take Role") {
            let role = itemData.usageOptions[key];
            aboutString += ("\n" + role);
          }
        }
      }

      inspectEmbed.setDescription(descriptionString);
      
      if (aboutString.length > 0)
      {
        inspectEmbed.addFields({ name: '**About**', value: aboutString });
      }
      return inspectEmbed;
    } else {
      return "This is not an item in the shop! Make sure to include spaces and not include the emoji.";
    }

  }

  /**editMenu: Essentially, this returns a large embed with various fields describing aspects of the item. 
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
  static async editMenu(itemName, pageNumber) {
    pageNumber = Number(pageNumber);
    itemName = await this.findItemName(itemName);
    if (itemName == "ERROR") {
      return "Item not found!";
    }

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
      .setDescription('Edit the fields using the command /editfield <item name> <field number> <new value>');
    
    switch (pageNumber) {
      case 1:
        // Add fields for Info Options and Shop Options
        embed.addFields({ name: '❓ Info Options', value: infoOptions.map((option, index) => `\`[${index + 1}] ${option}:\` ` + itemData.infoOptions[option]).join('\n') }, 
                        { name: '🪙 Shop Options', value: shopOptions.map((option, index) => `\`[${index + 1 + shopOptionsStartingIndex}] ${option}:\` ` + itemData.shopOptions[option]).join('\n') });
        embed.setFooter({text : 'Page 1 of 3, Info and Shop Options'});
        break;
      case 2:
        // Add fields for Usage Options
        embed.addFields({ name : '💥 Usage Options', value: usageOptions.map((option, index) => `\`[${index + 1 + usageOptionsStartingIndex}] ${option}:\` ` + itemData.usageOptions[option]).join('\n')});
        embed.setFooter({text : 'Page 2 of 3, Usage Options'});
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

  static async editField(itemName, fieldNumber, newValue) {
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

    // Update the item data
    itemData[category][fieldName] = newValue;

    // Save the updated item data
    await dbm.saveFile('shop', itemName, itemData);

    return `Field \`${fieldName}\` updated to \`${newValue}\``;
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

          let item = line.slice(0, -1); // Remove the trailing semicolon
          item = this.findItemName(item);

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
          item = this.findItemName(item);

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