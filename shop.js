const dbm = require('./database-manager'); // Importing the database manager
const Discord = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class shop {
  // Function to add items
  static addItem(itemName, itemIcon, itemPrice, itemDescription) {
    // Set the database name
    let fileName = 'shop.json';
    let data = dbm.load(fileName);

    data[itemName] = {
      price: itemPrice,
      icon: itemIcon,
      description: itemDescription,
    };
    
    dbm.save(fileName, data);
  }
  
  static async addUseCase(itemName, useType, gives) {
    if (this.getItemPrice(itemName) == "ERROR") {
      return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME"
    }
    if (!(useType == "INCOMEROLE" || useType == "CRAFTING" || useType == "STATBOOST")) {
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
            if (useType == "CRAFTING")  {
              if (this.getItemPrice(currKey) == "ERROR") {
                return "ERROR! DOES NOT CRAFT A REAL ITEM";
              }
            }
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
    let data = dbm.load('shop.json');
    data[itemName].usageCase = {};
    data[itemName].usageCase.useType = useType;
    data[itemName].usageCase.gives = giveMap;
    dbm.save('shop.json', data);

    let returnString = "Added a " + useType + " usage case to " + itemName + "\n\n";
    returnString += "On use, this item will give:\n"
    for (let key in giveMap) {
      returnString += ('"' + key + '" : "' + giveMap[key] + '"' + "\n");
    }
    returnString += "\n";
    returnString += "On use, this item will take nothing, having no use cost";

    return returnString;
  }

  //Overloaded version with takes
  static async addUseCaseWithCost(itemName, useType, gives, takes) {
    console.log(this.getItemPrice(itemName));
    if (await this.getItemPrice(itemName) == "ERROR") {
      return "ERROR! NOT A REAL ITEM IN SHOP. DOUBLE CHECK NAME"
    }
    if (!(useType == "INCOMEROLE" || useType == "CRAFTING" || useType == "STATBOOST")) {
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
            if (useType == "CRAFTING")  {
              if (await this.getItemPrice(currKey) == "ERROR") {
                return "ERROR! DOES NOT CRAFT A REAL ITEM";
              }
            }
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
            if (useType == "CRAFTING" || useType == "INCOMEROLE")  {
              if (await this.getItemPrice(currKey) == "ERROR") {
                return "ERROR! DOES NOT TAKE A REAL ITEM";
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
    let data = dbm.load('shop.json');
    data[itemName].usageCase = {};
    data[itemName].usageCase.useType = useType;
    data[itemName].usageCase.gives = giveMap;
    data[itemName].usageCase.takes = takesMap;
    dbm.save('shop.json', data);

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

    return returnString;
  }

  
  static async createShopEmbed(page) {
    page = Number(page);
    const itemsPerPage = 26;
    // Load data from shop.json and shoplayout.json
    const shopData = dbm.load('shop.json');
    const shopLayoutData = dbm.load('shoplayout.json');

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
      startIndices[page] ? startIndices[page] - 1 : undefined
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

  // Function to print item list
  static async shop() {
    // Load the data
    let data = dbm.load('shop.json');
    let superstring = ""
    for (let [key, value] of Object.entries(data)) {
      superstring = superstring + (String(value["icon"]) + " " + key + " : " + String(value["price"]) + "\n");
    }
    return superstring;
  }

  // Function to remove items - removeItem(name)
  static removeItem(itemName) {
    // Set the database name
    let fileName = 'shop.json';
    // Try to remove the item, and if it doesn't exist, catch the error
    try {
      dbm.varDelete(fileName, itemName);
    } catch (error) {
      // Handle the error or do nothing
      // In JavaScript, you might want to handle errors differently
    }
  }

  static async getItemPrice(itemName) {
    let data = dbm.load('shop.json');
    var price;
    if (data[itemName]) {
      price = data[itemName].price;
    } else {
      return "ERROR";
    }
    return price;
  }

  static async inspect(itemName) {
    let data = dbm.load('shop.json');
    if (data[itemName]) {
      let aboutString = "Price: :coin: " + data[itemName].price;
      let descriptionString = "**Description:\n**" + data[itemName].description;
      if (data[itemName].usageCase) {
        descriptionString += ("\nUsage type: ");
        switch (data[itemName].usageCase.useType) {
          case "CRAFTING":
            descriptionString += "Crafting";
            break;
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
        if (data[itemName].usageCase.takes) {
          aboutString += "\nTakes:";
          for (let key in data[itemName].usageCase.takes) {
            aboutString += ("\n`   `- " + data[key].icon + " " + key + ": " + data[itemName].usageCase.takes[key]);
          }
        }
        aboutString += "\nGives:";
        for (let key in data[itemName].usageCase.gives) {
          aboutString += ("\n`   `- " + data[key].icon + " " + key + ": " + data[itemName].usageCase.gives[key]);
        }
      }
      const inspectEmbed = {
        color: 0x36393e,
        title: '**__Item:__ ' +  data[itemName].icon + " " + itemName + "**",
        description: descriptionString,
        fields: [
          {
            name: '**About**',
            value: aboutString,
          },
        ],
      };
      return inspectEmbed;
    } else {
      return "This is not an item in the shop! Make sure to include spaces and not include the emoji.";
    }

  }

  static async buyItem(itemName, charID, numToBuy) {
    const price = await this.getItemPrice(itemName);
    if (price === "ERROR") {
      return "Not a valid item";
    }
    let fileName = 'characters.json';

    let returnString;
    let data = dbm.load(fileName);
    if (data[charID].balance <= (price * numToBuy)) {
      returnString = "You do not have enough gold!";
      dbm.save(fileName, data);
      return returnString;
    } else {
      data[charID].balance -= (price * numToBuy);

      if (!data[charID].inventory[itemName]) {
        data[charID].inventory[itemName] = 0;
      }
      data[charID].inventory[itemName] += numToBuy;

      returnString = "Succesfully bought " + numToBuy + " " + itemName;
      dbm.save(fileName, data);
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
            return ("ERROR: Duplicate category " + categoryName);
          }
          currCategory = categoryName;
          shopMap[categoryName] = [];
        } else if (line.endsWith(";")) {
          if (currCategory === null) {
            return ("ERROR: Item outside a category.");
          }

          const item = line.slice(0, -1); // Remove the trailing semicolon

          if (await this.getItemPrice(item) == "ERROR") {
            return ("ERROR! Item " + item + " is not in shop");
          }
    
          for (const category in shopMap) {
            if (shopMap[category].includes(item)) {
              return ("ERROR: Duplicate item " + item + " in category " + category);
            }
          }
          shopMap[currCategory].push(item);
        } else if (line !== "") {
          return ("ERROR: Invalid line: " + line);
        }
      }
      let data = dbm.load("shoplayout.json");
      data = shopMap;
      dbm.save("shoplayout.json", data);

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
            return "ERROR: Invalid category format.";
          }
          const categoryName = categoryMatch[1];
    
          if (categoryName === categoryToEdit) {
            onCategory = true;
            catMap = [];
          } else {
            return "ERROR: The provided category does not match the layout.";
          }
        } else if (line.endsWith(";")) {
          // This is an item line
          if (!onCategory) {
            return "ERROR: Items can only be within a category.";
          }

          const item = line.slice(0, -1); // Remove the trailing semicolon

          if (await this.getItemPrice(item) == "ERROR") {
            return ("ERROR! Item " + item + " is not in shop");
          }

          catMap.push(item);
        } else if (line !== "") {
          return "ERROR: Invalid line: " + line;
        }
      }
      let data = dbm.load("shoplayout.json");
      data[categoryToEdit] = catMap;
      dbm.save("shoplayout.json", data);

      let result = `Category "${categoryToEdit}" updated successfully. Items added:\n`;
      for (const item of catMap) {
        result += `- ${item}\n`;
      }
      return result;
    }
  }
}

module.exports = shop;