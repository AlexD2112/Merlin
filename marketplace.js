const dbm = require('./database-manager'); // Importing the database manager
const shop = require('./shop'); // Importing the database manager
const char = require('./char'); // Importing the database manager
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
class marketplace {
  /**Function for a player to post a sale.
   * Will take the number of items, the item name, and the price they want to sell it for.
   * Will also be passed their user tag and ID
   * Will load the character.json file and check if they have enough of the item
   * If they do, it will take the items from their inventory and add them to the marketplace under a created unique ID
   * Items will be added to the marketplace according to their item name and category- i.e. all iron swords will be next to each other, and the iron swords will be next to steel swords
   * */ 
  static async postSale(numberItems, itemName, price, userTag, userID) {
    // Load the character.json and marketplace.json file
    let charData = await dbm.loadFile('characters', userTag);
    let marketData = await dbm.loadCollection('marketplace');
    // Find the item name using shop.findItemName
    itemName = await shop.findItemName(itemName);
    if (itemName == "ERROR") {
      return "That item doesn't exist!";
    }
    // Check if they have enough of the item
    if (!charData.inventory[itemName] || charData.inventory[itemName] < numberItems) {
      return "You don't have enough of that item to sell it!";
    }
    // Take the items from their inventory
    charData.inventory[itemName] -= numberItems;
    // Add them to the marketplace under a created unique ID, one greater than the last. The last will be under lastID in marketplace.json
    marketData = marketData || { idfile: {lastID: 1000}, marketplace: {} };
    marketData.idfile = marketData.idfile || {};
    marketData.idfile.lastID = marketData.idfile.lastID || 1000;
    let itemID = marketData.idfile.lastID + 1;
    marketData.idfile.lastID = itemID;
    // Add the item to the marketplace according to its item name and category. Category can be found in shop.getItemCategory
    let itemCategory = await shop.getItemCategory(itemName);
    marketData.marketplace = marketData.marketplace || {};
    marketData.marketplace[itemCategory] = marketData.marketplace[itemCategory] || {};
    marketData.marketplace[itemCategory][itemName] = marketData.marketplace[itemCategory][itemName] || {};

    marketData.marketplace[itemCategory][itemName][itemID] = {
      "seller": userTag,
      "price": price,
      "number": numberItems,
      "sellerID": userID
    }
    // Save the character.json file
    dbm.saveFile('characters', userTag, charData);
    dbm.saveCollection('marketplace', marketData);
    // Create an embed to return on success. Will just say @user listed **numberItems :itemIcon: itemName** to the **/sales** page for :coin:**price**.
    let embed = new EmbedBuilder();
    embed.setDescription(`<@${userID}> listed **${numberItems} ${await shop.getItemIcon(itemName)} ${itemName}** to the **/sales** page for :coin:**${price}**.`);
    return embed;
  }

  /**
   * Create a embed list of sales. Will take page number and return embed and action rows
   */
  static async createSalesEmbed(page) {
    page = Number(page);
    // Load the marketplace.json file
    let marketData = await dbm.loadCollection('marketplace');

    // Get the start indices of every page. Don't split items, but can split categories

    const maxItemsPerPage = 25;
    let currentPage = {};
    let allPages = [];
    let currentPageLength = 0;
    
    for (const category in marketData.marketplace) {
        const categoryItems = marketData.marketplace[category];
        for (const itemName in categoryItems) {
            const sales = categoryItems[itemName];
            const numberOfSales = Object.keys(sales).length;
    
            // Check if adding this item would exceed page size
            if (currentPageLength + numberOfSales > maxItemsPerPage) {
                // If the current page has items, start a new page
                if (currentPageLength > 0) {
                    allPages.push(currentPage);
                    currentPage = {};
                    currentPageLength = 0;
                }
            }
    
            currentPage[itemName] = sales;
            currentPageLength += numberOfSales;
    
            // If the current page is full, move to the next page
            if (currentPageLength === maxItemsPerPage) {
                allPages.push(currentPage);
                currentPage = {};
                currentPageLength = 0;
            }
        }
    }
    
    // Add any remaining items to the pages
    if (currentPageLength > 0) {
        allPages.push(currentPage);
    }
    
    const totalPages = allPages.length;
    const sales = allPages[page - 1];


    //Create embed
    let embed = new EmbedBuilder();
    embed.setTitle(':coin: Sales');
    embed.setColor(0x36393e);

    let descriptionText = '';

    
    // Create the formatted line. `ID` :icon: **`Number ItemName [ALIGNSPACES]`**`Price`**:coin:, with coin and price aligned to right side (alignSpaces used to separate them and ensure all the coins and prices are aligned )
    for (const itemName in sales) {
      const salesList = sales[itemName];
      for (const saleID in salesList) {
        const sale = salesList[saleID];
        const number = sale.number;
        const item = itemName;
        const icon = await shop.getItemIcon(itemName);
        const price = sale.price;
        const alignSpaces = ' '.repeat(30 - item.length - ("" + price).length);
        descriptionText += `\`${saleID}\` ${icon} **\`${number} ${item}${alignSpaces}${price}\`**:coin:\n`;
      }
    }
    
    descriptionText += '\n';
    // Set the accumulated description
    embed.setDescription(descriptionText);

    if (totalPages > 1) {
      embed.setFooter({text: `/buysale \nPage ${page} of ${totalPages}`});
    } else {
      embed.setFooter({text: `/buysale`});
    }

    const rows = [];

    // Create a "Previous Page" button
    const prevButton = new ButtonBuilder()
      .setCustomId('switch_sale' + (page-1))
      .setLabel('<')
      .setStyle(ButtonStyle.Secondary); // You can change the style to your preference

    // Disable the button on the first page
    if (page == 1) {
      prevButton.setDisabled(true);
    }

    const nextButton = new ButtonBuilder()
          .setCustomId('switch_sale' + (page+1))
          .setLabel('>')
          .setStyle(ButtonStyle.Secondary); // You can change the style to your preference

    // Create a "Next Page" button if not on the last page
    if (page == totalPages) {
      nextButton.setDisabled(true);
    }
    
    rows.push(new ActionRowBuilder().addComponents(prevButton, nextButton));

    return [embed, rows];
  }

  //Buy a sale. Send the money from the buyer to the seller, and give the buyer the items. If the seller is buying their own sale, merely give them back their items, no need to check their money- this functionality will exist for accidental sales
  static async buySale(saleID, userTag, userID) {
    // Load the character.json and marketplace.json file
    let charData = await dbm.loadCollection('characters');
    let marketData = await dbm.loadCollection('marketplace');
    // Search through marketData for the saleID
    const [foundCategory, foundItemName, sale] = await marketplace.getSale(saleID);
    // If the saleID doesn't exist, return an error
    if (!sale) {
      return "That sale doesn't exist!";
    }
    // If the buyer is the seller, merely give them back their items, no need to check their money- this functionality will exist for accidental sales
    if (sale.sellerID == userID) {
      // Give the buyer the items
      charData[userTag].inventory[foundItemName] += sale.number;
      // Remove the sale from the marketplace
      delete marketData.marketplace[foundCategory][foundItemName][saleID];
      // Save the character.json file
      dbm.saveCollection('characters', charData);
      // Save the marketplace.json file
      dbm.saveCollection('marketplace', marketData);
      // Create an embed to return on success. Will just say @user bought **numberItems :itemIcon: itemName** from @seller for :coin:**price**.
      let embed = new EmbedBuilder();
      embed.setDescription(`<@${userID}> bought **${sale.number} ${await shop.getItemIcon(foundItemName)} ${foundItemName}** back from themselves. It was listed for :coin:**${sale.price}**.`);
      return embed;
    }

    // Check if the buyer has enough money
    if (charData[userTag].balance < sale.price) {
      return "You don't have enough money to buy that!";
    }
    // Take the money from the buyer
    charData[userTag].balance -= sale.price;
    // Give the money to the seller
    charData[sale.seller].balance += sale.price;
    // Give the buyer the items
    charData[userTag].inventory[foundItemName] += sale.number;
    // Remove the sale from the marketplace
    delete marketData.marketplace[foundCategory][foundItemName][saleID];
    // Save the character.json file
    dbm.saveCollection('characters', charData);
    // Save the marketplace.json file
    dbm.saveCollection('marketplace', marketData);
    // Create an embed to return on success. Will just say @user bought **numberItems :itemIcon: itemName** from @seller for :coin:**price**.
    let embed = new EmbedBuilder();
    embed.setDescription(`<@${userID}> bought **${sale.number} ${await shop.getItemIcon(foundItemName)} ${foundItemName}** from <@${sale.sellerID}> for :coin:**${sale.price}**.`);
    return embed;
  }

  //Inspect a sale. Will take the saleID and return an embed with the sale information
  static async inspectSale(saleID) {
    // Search through marketData for the saleID
    const [itemCategory, itemName, sale] = await marketplace.getSale(saleID);
    // If the saleID doesn't exist, return an error
    if (!sale) {
      return "That sale doesn't exist!";
    }
    // Create an embed to return on success.
    let embed = new EmbedBuilder();
    embed.setTitle(`Sale ${saleID}`);
    embed.setColor(0x36393e);
    embed.setDescription(`**${sale.number} ${await shop.getItemIcon(itemName)} ${itemName}** for :coin:**${sale.price}**.`);
    embed.setFooter({text: `Seller: ${sale.seller}`});
    return embed;
  }

  //Get itemcategory, itemname and sale from saleID
  static async getSale(saleID) {
    // Load the marketplace.json file
    let marketData = await dbm.loadCollection('marketplace');
    // Search through marketData for the saleID
    let sale;
    let itemName;
    let itemCategory;
    for (const category in marketData.marketplace) {
      const categoryItems = marketData.marketplace[category];
      for (const item in categoryItems) {
        const sales = categoryItems[item];
        if (sales[saleID] != undefined) {
          sale = sales[saleID];
          itemName = item;
          itemCategory = category;
          break;
        }
        if (sale) {
          break;
        }
      }
      if (sale) {
        break;
      }
    }
    // If the saleID doesn't exist, return an error
    if (!sale) {
      return "That sale doesn't exist!";
    }
    return [itemCategory, itemName, sale];
  }
}

module.exports = marketplace;