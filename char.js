const dbm = require('./database-manager'); // Importing the database manager
const shop = require ('./shop');
const axios = require('axios');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, createWebhook } = require('discord.js');

class char {
  // Function to add items
  static async newChar(playerID, charName, charBio, charKingdom, numericID) {
    // Set the collection name
    let collectionName = 'characters';

    // Load the player's character data (if it exists)
    let charData = await dbm.loadFile(collectionName, playerID);

    if (charData) {
      // If the character already exists, update the fields
      charData.name = charName;
      charData.bio = charBio;
      charData.kingdom = charKingdom;
    } else {
      // If the character does not exist, create a new character
      charData = {
        name: charName,
        bio: charBio,
        kingdom: charKingdom,
        balance: 0,
        inventory: {},
        incomeList: {
          Daily: 40
        },
        incomeAvailable: true,
        stats: {
          Martial: 0,
          Intrigue: 0,
          Prestige: 0
        },
        cooldowns: {},
        shireID: 0,
        numericID: numericID,
      };
    }

    // Save the character data
    dbm.saveFile(collectionName, playerID, charData);
  }

  //returns player name and bio from playerID
  static async editCharPlaceholders(playerID) {
    let collectionName = 'characters';
    let charData = await dbm.loadFile(collectionName, playerID);
    if (charData) {
      return [charData.name, charData.bio];
    } else {
      return "ERROR";
    }
  }  

  //Setavatar using new saveFile and loadFile
  static async setAvatar(avatarURL, userID) {
    try {
      // Make a HEAD request to check if the URL leads to a valid image
      const response = await axios.head(avatarURL, { maxRedirects: 5 });
  
      // Check if the response status code indicates success (e.g., 200)
      if (response.status === 200) {
        let collectionName = 'characters';
        let charData = await dbm.loadFile(collectionName, userID);
  
        charData.icon = avatarURL;
  
        dbm.saveFile(collectionName, userID, charData);
  
        return "Avatar has been set";
      } else {
        return "Error: Avatar URL is not valid (HTTP status code " + response.status + ").";
      }
    } catch (error) {
      return "Unable to check the Avatar URL. " + error.message;
    }
  }

  //New commands using saveFile, saveCollection, loadFile and loadCollection
  static async balance(userID) {
    let collectionName = 'characters';
    let charData = await dbm.loadFile(collectionName, userID);
    if (charData) {
      const charEmbed = {
        color: 0x36393e,
        author: {
          name: charData.name,
          icon_url: charData.icon ? charData.icon : 'https://images-ext-1.discordapp.net/external/xNBNeaCotnpdWVuj-r0wO8X87d34DAH4X58Bqs--vyQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1148265132791713802/a2637c14d39ff85a1ed89a6fa888ebbc.png',
        },
        description: ":coin: **" + charData.balance + "**",
      };
      return charEmbed;
    } else {
      return "You haven't made a character! Use /newchar first";
    }
  }

  static async stats(userID) {
    const PrestigeBar1Emoji = '<:PrestigeBar1:1165819978449158254>';
    const PrestigeBar2Emoji = '<:PrestigeBar2:1165819993552850944>';
    const PrestigeBar3Emoji = '<:PrestigeBar3:1165820399897034752>';
    const IntrigueBar1Emoji = '<:IntrigueBar1:1165816319459999775>';
    const IntrigueBar2Emoji = '<:IntrigueBar2:1165816373071585281>';
    const IntrigueBar3Emoji = '<:IntrigueBar3:1165819807690657883>';
    const MartialBar1Emoji = '<:MartialBar1:1165819832051191889>';
    const MartialBar2Emoji = '<:MartialBar2:1165819861461631096>';
    const MartialBar3Emoji = '<:MartialBar3:1165819900418330694>';
    const EmptyBar1Emoji = '<:EmptyBar1:1165822661369270342>';
    const EmptyBar2Emoji = '<:EmptyBar2:1165822682051387482>';
    const EmptyBar3Emoji = '<:EmptyBar3:1165822700938346607>';
    const PrestigeEmoji = '<:Prestige:1165722839228354610>';
    const MartialEmoji = '<:Martial:1165722873248354425>';
    const IntrigueEmoji = '<:Intrigue:1165722896522563715>';

    let collectionName = 'characters';
    let charData = await dbm.loadFile(collectionName, userID);
    if (charData) {
      const prestige = charData.stats.Prestige;
      const martial = charData.stats.Martial;
      const intrigue = charData.stats.Intrigue;

      const maxPrestige = prestige;
      const maxMartial = martial;
      const maxIntrigue = intrigue;
      
      let martialString = '';
      let prestigeString = '';
      let intrigueString = '';

      for (let i = 0; i < 6; i++) {
        if ((martial / maxMartial) > (i / 6)) {
          switch (i) {
            case 0:
              martialString += MartialBar1Emoji;
              break;
            case 5:
              martialString += MartialBar3Emoji;
              break;
            default:
              martialString += MartialBar2Emoji;
              break;
          }
        } else {
          switch (i) {
            case 0:
              martialString += EmptyBar1Emoji;
              break;
            case 5:
              martialString += EmptyBar3Emoji;
              break;
            default:
              martialString += EmptyBar2Emoji;
              break;
          }
        }
      }
      
      for (let i = 0; i < 6; i++) {
        if ((prestige / maxPrestige) > (i / 6)) {
          switch (i) {
            case 0:
              prestigeString += PrestigeBar1Emoji;
              break;
            case 5:
              prestigeString += PrestigeBar3Emoji;
              break;
            default:
              prestigeString += PrestigeBar2Emoji;
              break;
          }
        } else {
          switch (i) {
            case 0:
              prestigeString += EmptyBar1Emoji;
              break;
            case 5:
              prestigeString += EmptyBar3Emoji;
              break;
            default:
              prestigeString += EmptyBar2Emoji;
              break;
          }
        }
      }
    
      for (let i = 0; i < 6; i++) {
        if ((intrigue / maxIntrigue) > (i / 6)) {
          switch (i) {
            case 0:
              intrigueString += IntrigueBar1Emoji;
              break;
            case 5:
              intrigueString += IntrigueBar3Emoji;
              break;
            default:
              intrigueString += IntrigueBar2Emoji;
              break;
          }
        } else {
          switch (i) {
            case 0:
              intrigueString += EmptyBar1Emoji;
              break;
            case 5:
              intrigueString += EmptyBar3Emoji;
              break;
            default:
              intrigueString += EmptyBar2Emoji;
              break;
          }
        }
      }

      const charEmbed = {
        color: 0x36393e,
        author: {
          name: charData.name,
          icon_url: charData.icon ? charData.icon : 'https://images-ext-1.discordapp.net/external/xNBNeaCotnpdWVuj-r0wO8X87d34DAH4X58Bqs--vyQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1148265132791713802/a2637c14d39ff85a1ed89a6fa888ebbc.png',
        },
        description: "**`━━━━━━━Stats━━━━━━━`\n" + PrestigeEmoji + prestigeString + " " + prestige + "**/" + maxPrestige +  
              "\n**"+ MartialEmoji + martialString + " " + martial + "**/" + maxMartial +
              "\n**"+ IntrigueEmoji + intrigueString  + " " + intrigue + "**/" + maxIntrigue + 
              "\n**`━━━━━━━━━━━━━━━━━━━`**",
      };

      return charEmbed;
    } else {
      return "You haven't made a character! Use /newchar first";
    }
  }
  
  static async me(userID) {
    let collectionName = 'characters';
    let charData = await dbm.loadFile(collectionName, userID);
    if (charData) {
      let bioString = charData.bio;

      const charEmbed = {
        color: 0x36393e,
        author: {
          name: charData.name,
          icon_url: charData.icon ? charData.icon : 'https://images-ext-1.discordapp.net/external/xNBNeaCotnpdWVuj-r0wO8X87d34DAH4X58Bqs--vyQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1148265132791713802/a2637c14d39ff85a1ed89a6fa888ebbc.png',
        },
        description: bioString,
        image: {
          url: charData.icon ? charData.icon : 'https://images-ext-1.discordapp.net/external/xNBNeaCotnpdWVuj-r0wO8X87d34DAH4X58Bqs--vyQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1148265132791713802/a2637c14d39ff85a1ed89a6fa888ebbc.png',
        },
      };
      return charEmbed;
    } else {
      return "You haven't made a character! Use /newchar first";
    }
  }

  static async char(userID) {
    const PrestigeBar1Emoji = '<:PrestigeBar1:1165819978449158254>';
    const PrestigeBar2Emoji = '<:PrestigeBar2:1165819993552850944>';
    const PrestigeBar3Emoji = '<:PrestigeBar3:1165820399897034752>';
    const IntrigueBar1Emoji = '<:IntrigueBar1:1165816319459999775>';
    const IntrigueBar2Emoji = '<:IntrigueBar2:1165816373071585281>';
    const IntrigueBar3Emoji = '<:IntrigueBar3:1165819807690657883>';
    const MartialBar1Emoji = '<:MartialBar1:1165819832051191889>';
    const MartialBar2Emoji = '<:MartialBar2:1165819861461631096>';
    const MartialBar3Emoji = '<:MartialBar3:1165819900418330694>';
    const EmptyBar1Emoji = '<:EmptyBar1:1165822661369270342>';
    const EmptyBar2Emoji = '<:EmptyBar2:1165822682051387482>';
    const EmptyBar3Emoji = '<:EmptyBar3:1165822700938346607>';
    const PrestigeEmoji = '<:Prestige:1165722839228354610>';
    const MartialEmoji = '<:Martial:1165722873248354425>';
    const IntrigueEmoji = '<:Intrigue:1165722896522563715>';

    let collectionName = 'characters';
    let charData = await dbm.loadFile(collectionName, userID);
    if (charData) {
      let bioString = charData.bio;

      const prestige = charData.stats.Prestige;
      const martial = charData.stats.Martial;
      const intrigue = charData.stats.Intrigue;

      const maxPrestige = prestige;
      const maxMartial = martial;
      const maxIntrigue = intrigue;
      
      let martialString = '';
      let prestigeString = '';
      let intrigueString = '';

      for (let i = 0; i < 6; i++) {
        if ((martial / maxMartial) > (i / 6)) {
          switch (i) {
            case 0:
              martialString += MartialBar1Emoji;
              break;
            case 5:
              martialString += MartialBar3Emoji;
              break;
            default:
              martialString += MartialBar2Emoji;
              break;
          }
        } else {
          switch (i) {
            case 0:
              martialString += EmptyBar1Emoji;
              break;
            case 5:
              martialString += EmptyBar3Emoji;
              break;
            default:
              martialString += EmptyBar2Emoji;
              break;
          }
        }
      }
      
      for (let i = 0; i < 6; i++) {
        if ((prestige / maxPrestige) > (i / 6)) {
          switch (i) {
            case 0:
              prestigeString += PrestigeBar1Emoji;
              break;
            case 5:
              prestigeString += PrestigeBar3Emoji;
              break;
            default:
              prestigeString += PrestigeBar2Emoji;
              break;
          }
        } else {
          switch (i) {
            case 0:
              prestigeString += EmptyBar1Emoji;
              break;
            case 5:
              prestigeString += EmptyBar3Emoji;
              break;
            default:
              prestigeString += EmptyBar2Emoji;
              break;
          }
        }
      }
    
      for (let i = 0; i < 6; i++) {
        if ((intrigue / maxIntrigue) > (i / 6)) {
          switch (i) {
            case 0:
              intrigueString += IntrigueBar1Emoji;
              break;
            case 5:
              intrigueString += IntrigueBar3Emoji;
              break;
            default:
              intrigueString += IntrigueBar2Emoji;
              break;
          }
        } else {
          switch (i) {
            case 0:
              intrigueString += EmptyBar1Emoji;
              break;
            case 5:
              intrigueString += EmptyBar3Emoji;
              break;
            default:
              intrigueString += EmptyBar2Emoji;
              break;
          }
        }
      }

      const charEmbed = {
        color: 0x36393e,
        author: {
          name: charData.name,
          icon_url: charData.icon ? charData.icon : 'https://images-ext-1.discordapp.net/external/xNBNeaCotnpdWVuj-r0wO8X87d34DAH4X58Bqs--vyQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1148265132791713802/a2637c14d39ff85a1ed89a6fa888ebbc.png',
        },
        description: bioString,
        fields: [
          {
            name: ":coin: Balance: " + (charData.balance ? charData.balance : 0),
            value: "**`━━━━━━━Stats━━━━━━━`\n"+ PrestigeEmoji + prestigeString + " " + prestige + "**/" + maxPrestige +  
              "\n**"+ MartialEmoji + martialString + " " + martial + "**/" + maxMartial +
              "\n**"+ IntrigueEmoji + intrigueString  + " " + intrigue + "**/" + maxIntrigue + 
              "\n**`━━━━━━━━━━━━━━━━━━━`**",
          },
        ],
      };
      return charEmbed;
    } else {
      return "You haven't made a character! Use /newchar first";
    }
  }

  static async say(userID, message, channelID) {
    let charData = await dbm.loadFile('characters', userID);
    if (charData) {
      let webhookName = charData.name;
      //if charData.icon is undefined, set it to the default avatar
      let webhookAvatar = charData.icon ? charData.icon : 'https://images-ext-1.discordapp.net/external/xNBNeaCotnpdWVuj-r0wO8X87d34DAH4X58Bqs--vyQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1148265132791713802/a2637c14d39ff85a1ed89a6fa888ebbc.png';
      let webhookMessage = message;

      (async () => {
        // Create a webhook
        let webhook = await channelID.createWebhook({name: webhookName, avatar: webhookAvatar });
        
        // Send a message using the webhook
        await webhook.send({
            content: webhookMessage,
            username: webhookName,
            avatarURL: webhookAvatar
        });

        // Delete the webhook after sending the message
        await webhook.delete();
      })()

      return "Message sent!";
    } else {
      return "You haven't made a character! Use /newchar first";
    }
  }

  static async incomes(userID, numericID) {
    let collectionName = 'characters';

    // Load the data
    let charData = await dbm.loadFile(collectionName, userID);

    var now = new Date();
    now.setUTCDate(now.getUTCDate() + 1);
    now.setUTCHours(0, 0, 0, 0);

    let charIncomeData = charData.incomeList;
    let superstring = "";
    let afterString = "";
    let total = 0;
    for (let [key, value] of Object.entries(charIncomeData)) {
      superstring += (":coin: **" + key + "** : `" + String(value) + "`\n");
      if ((charData.incomeAvailable === true)) {
        afterString += (":coin: **" + key + "** : `+" + String(value) + "`\n");
      }
      total += value;
    }
    superstring += ":coin: **__Total :__** `" + total + "`\n\n";
    if ((charData.incomeAvailable === true)) {
      afterString += (":coin: **__Total :__** `+" + total + "`");
    }
    if (charData.incomeAvailable === false) {
      superstring += "You have already used income this income cycle!";
    } else {
      superstring += "Succesfully collected!"
    }
    superstring += "\nNext cycle  <t:" + (now.getTime()/1000) + ":R>"
    
    charData.incomeAvailable = false;
    charData.balance += total;

    dbm.saveFile(collectionName, userID, charData);
    
    const incomeEmbed = {
      color: 0x36393e,
      title: "**__Incomes__**",
      description: `<@${numericID}>\n\n${superstring}`,
    };
  
    return [incomeEmbed, afterString];
  }

  static async resetIncomeCD() {
    let collectionName = 'characters';
    let data = await dbm.loadCollection(collectionName);
    for (let [_, charData] of Object.entries(data)) {
      charData.incomeAvailable = true;
    }
    dbm.saveCollection(collectionName, data);
  }

  static async craft(charID, itemName) {
    itemName = await shop.findItemName(itemName);
    if (itemName === "ERROR") {
      return "Not a valid item";
    }
    const numToUse = 1;

    let returnEmbed = new EmbedBuilder();
    const charactersCollection = 'characters';
    let charData = await dbm.loadFile(charactersCollection, charID);
    const shopCollection = 'shop';
    let shopData = await dbm.loadCollection(shopCollection);

    if (!shopData[itemName].recipe) {
      return "No recipe";
    } else {
      returnEmbed.setTitle("**__Started Crafting:__" + shopData[itemName].icon + itemName + "**");
      if (shopData[itemName].recipe.countdown) {
        if (shopData[itemName].recipe.takes) {
          // Check crafting slots in charData.cooldowns
          const craftSlots = charData.cooldowns.craftSlots || {};

          if (Object.keys(craftSlots).length >= 3) {
              return "All crafting slots are in use.";
          }

          let takeString = "";

          // Remove items in recipe.takes
          for (let key in shopData[itemName].recipe.takes) {
            const val = shopData[itemName].recipe.takes[key] * numToUse;
            if (!charData.inventory[key] || charData.inventory[key] < val) {
                if (!charData.inventory[key]) {
                  charData.inventory[key] = 0;
                }
                return "Not enough **" + shopData[key].icon + key + "**! You need " + val + " and only have " + charData.inventory[key] + ".";
            } else {
                charData.inventory[key] -= val;
                takeString += "`   -" + val + "` " + shopData[key].icon + " " + key + "\n";
            }
          }

          // Find an available slot for crafting
          let slotKey = itemName;
          let slotCount = 1;
          while (craftSlots[slotKey]) {
              slotCount++;
              slotKey = `REPEAT_${slotCount}_${itemName}`;
          }

          // Set the crafting slot with the item and expiration time
          const expirationTime = Math.round(Date.now() / 1000) + shopData[itemName].recipe.countdown;
          craftSlots[slotKey] = expirationTime;

          // Update craftSlots in charactersData
          charData.cooldowns.craftSlots = craftSlots;

          returnEmbed.addFields(
            { name: '**Took:**', value: takeString },
            { name: '**Done:**', value: '<t:' + expirationTime + ':R>'}
          );
        } else {
          return "Item does not take an item. Likely an error in setup, ping Alex or Serski";
        }
      } else {
        return "Item does not have a crafting time. Likely an error in setup, ping Alex or Serski";
      }
    }
    dbm.saveFile(charactersCollection, charID, charData);
    return returnEmbed;
  }

  //Creates cooldowns embed
  static async craftingCooldowns(charID) {
    let returnEmbed = new EmbedBuilder();
    const charactersCollection = 'characters';
    let charData = await dbm.loadFile(charactersCollection, charID);
    const shopCollection = 'shop';
    let shopData = await dbm.loadCollection(shopCollection);
    let finishedCrafts = [];
    let finishedSlotKeys = [];
    let finishedField = "";

    if (!charData.cooldowns.craftSlots) {
      return "No crafting ongoing";
    } else {
      returnEmbed.setTitle("**__Crafting Timers**");
      let returnString = "";
      for (let key in charData.cooldowns.craftSlots) {
        //Key may start with: REPEAT_1_, REPEAT_2_, REPEAT_3_, etc. Remove this, i.e. REPEAT_1_Blah = Blah
        let oldKey = key;
        let val = charData.cooldowns.craftSlots[key];
        if (key.startsWith("REPEAT_")) {
          key = key.slice(9);
        }
        let icon = shopData[key].icon;
        returnString += "**" + icon + key + "**: <t:" + val + ":R>\n";
        if (val < Math.round(Date.now() / 1000)) {
          finishedCrafts.push(key);
          finishedSlotKeys.push(oldKey);
          finishedField += "**" + icon + key + "**\n";
        }
      }
      returnEmbed.setDescription(returnString);
    }

    if (finishedCrafts.length > 0) {
      returnEmbed.addFields(
        { name: '**Finished Crafting:**', value: finishedField}
      );

      for (let i = 0; i < finishedCrafts.length; i++) {
        let key = finishedCrafts[i];
        key = await shop.findItemName(key);

        if (key === "ERROR") {
          return "Somehow, this isn't a valid item. This is a problem. Contact Alex";
        }

        //Give the player the item, than delete it from the crafting slots
        if (!charData.inventory[key]) {
          charData.inventory[key] = 0;
        }
        charData.inventory[key] += 1;

        delete charData.cooldowns.craftSlots[finishedSlotKeys[i]];

        await dbm.saveFile(charactersCollection, charID, charData);
      }
    }

    return returnEmbed;
  }

  static async useItem(itemName, charID, numToUse) {
    if (!numToUse) {
      numToUse = 1;
    } else if (numToUse < 1) {
      return "Must use at least 1";
    }
    itemName = await shop.findItemName(itemName);
    if (itemName === "ERROR") {
      return "Not a valid item";
    }

    let returnEmbed = new EmbedBuilder();
    const charactersCollection = 'characters';
    let charData = await dbm.loadFile(charactersCollection, charID);
    const shopCollection = 'shop';
    let shopData = await dbm.loadCollection(shopCollection);

    if (!shopData[itemName].usageCase) {
      return "No usage case";
    } else {
      if (shopData[itemName].usageCase.countdown) {
        if (charData.cooldowns[itemName]) {
          if (charData.cooldowns[itemName] > Math.round(Date.now() / 1000)) {
            return "You have used this item recently! Can be used again <t:" + charData.cooldowns[itemName] + ":R>";
          }
        } else if (!charData.cooldowns) {
          charData.cooldowns = {};
        }
        charData.cooldowns[itemName] = Math.round(Date.now() / 1000) + shopData[itemName].usageCase.countdown;
        returnEmbed.addFields(
          { name: '**Can be used again:**', value: '<t:' + charData.cooldowns[itemName] + ':R>'}
        );
      }

      returnEmbed.setTitle("**__Used:__" + shopData[itemName].icon + "`" + numToUse + "` " + itemName + "**");
      if (shopData[itemName].usageCase.description) {
        returnEmbed.setDescription(shopData[itemName].usageCase.description);
      }
      switch (shopData[itemName].usageCase.useType) {
        case "STATBOOST":
          if (numToUse > 1) {
            return "You can only use one of this item! You will not get more stats by using more.";
          }
          if (!shopData[itemName].usageCase.countdown) {
            return "This item does not have a countdown. Likely an error in setup, ping Alex or Serski";
          }

          const PrestigeEmoji = '<:Prestige:1165722839228354610>';
          const MartialEmoji = '<:Martial:1165722873248354425>';
          const IntrigueEmoji = '<:Intrigue:1165722896522563715>';

          if (shopData[itemName].usageCase.gives) {
            let takeString = "";
            if (!charData.inventory[itemName] || charData.inventory[itemName] < numToUse) {
              if (!charData.inventory[itemName]) {
                charData.inventory[itemName] = 0;
              }
              return "Not enough **" + shopData[itemName].icon + itemName + "**! You need " + numToUse + " and only have " + charData.inventory[itemName] + ".";
            } else {
              charData.inventory[itemName] -= numToUse;
              takeString += "`   -" + numToUse + "` " + shopData[itemName].icon + " " + itemName + "\n";
            }
            if (shopData[itemName].usageCase.takes) {
              for (let key in shopData[itemName].usageCase.takes) {
                let val = shopData[itemName].usageCase.takes[key];
                let icon;
                switch (key) {
                  case "Prestige":
                    icon = PrestigeEmoji;
                    break;
                  case "Martial":
                    icon = MartialEmoji;
                    break;
                  case "Intrigue":
                    icon = IntrigueEmoji;
                    break;
                  default:
                    return "This use case includes an invalid stat name. Likely an error in setup, contact Alex or Serski";
                }
                if (!charData.stats[key]) {
                  charData.stats[key] = 0;
                }
                charData.stats[key] -= val;
                takeString += "`   -" + val + "` " + icon + " " + key + "\n";
              }
            }
            let giveString = "";
            for (let key in shopData[itemName].usageCase.gives) {
              let val = shopData[itemName].usageCase.gives[key];
              let icon;
              switch (key) {
                case "Prestige":
                  icon = PrestigeEmoji;
                  break;
                case "Martial":
                  icon = MartialEmoji;
                  break;
                case "Intrigue":
                  icon = IntrigueEmoji;
                  break;
                default:
                  return "This use case includes an invalid stat name. Likely an error in setup, contact Alex or Serski";
              }
              if (!charData.stats[key]) {
                charData.stats[key] = 0;
              }
              charData.stats[key] += val;
              giveString += "`   +" + val + "` " + icon + " " + key + "\n";
            }
            if (giveString && takeString) {
              returnEmbed.addFields(
                { name: '**Gave:**', value: giveString }, 
                { name: '**Took:**', value: takeString }
              );
            } else if (giveString) {
              returnEmbed.addFields(
                { name: '**Gave:**', value: giveString }
              );
            } else if (takeString) {
              returnEmbed.addFields(
                { name: '**Took:**', value: takeString }
              );
            }
          } else {
            return "Item does not give stats. Likely an error in setup, ping Alex or Serski";
          }
          break;
        case "INCOMEROLE":
          if (numToUse > 1) {
            return "You can only use one of this item! You will not get more income roles by using more.";
          }
          if (shopData[itemName].usageCase.gives) {
            let takeString = "";
            if (!charData.inventory[itemName] || charData.inventory[itemName] < numToUse) {
              if (!charData.inventory[itemName]) {
                charData.inventory[itemName] = 0;
              }
              return "Not enough **" + shopData[itemName].icon + itemName + "**! You need " + numToUse + " and only have " + charData.inventory[itemName] + ".";
            } else {
              charData.inventory[itemName] -= numToUse;
              takeString += "`   -" + numToUse + "` " + shopData[itemName].icon + " " + itemName + "\n";
            }
            for (let key in shopData[itemName].usageCase.takes) {
              let val = shopData[itemName].usageCase.takes[key];
              if (!charData.inventory[key] || charData.inventory[key] < val) {
                if (!charData.inventory[key]) {
                  charData.inventory[key] = 0;
                }
                return "Not enough **" + shopData[key].icon + key + "**! You need " + val + " and only have " + charData.inventory[key] + ".";
              } else {
                charData.inventory[key] -= val;
                takeString += "`   -" + val + "` " + shopData[key].icon + " " + key + "\n";
              }
            }
            let giveString = "";
            for (let key in shopData[itemName].usageCase.gives) {
              let val = shopData[itemName].usageCase.gives[key];
              charData.incomeList[key] = val;
              giveString += "`   +" + val + "` :coin: " + key + " per day\n";
            }
            if (giveString && takeString) {
              returnEmbed.addFields(
                { name: '**Gave:**', value: giveString }, 
                { name: '**Took:**', value: takeString }
              );
            } else if (giveString) {
              returnEmbed.addFields(
                { name: '**Gave:**', value: giveString }
              );
            } else if (takeString) {
              returnEmbed.addFields(
                { name: '**Took:**', value: takeString }
              );
            }
          }
          else {
            return "Item does not both give an income role and take an item. Likely an error in setup, ping Alex or Serski";
          }
          break;
        default:
          return "Incorrect usage case. Likely an error in setup, contact Alex or Serski";
      }
    }
    if (shopData[itemName].usageCase.countdown) {
      if (!charData.cooldowns) {
        charData.cooldowns = {};
      }
      if (!charData.cooldowns[itemName]) {
        charData.cooldowns[itemName] = 0;
      }
      charData.cooldowns[itemName] = Math.round(Date.now() / 1000) + shopData[itemName].usageCase.countdown;
      returnEmbed.addFields(
        { name: '**Can be used again:**', value: '<t:' + charData.cooldowns[itemName] + ':R>'}
      );
    }
    dbm.saveFile(charactersCollection, charID, charData);
    return returnEmbed;
  }

  static async setPlayerGold(player, gold) {
    let collectionName = 'characters';
    let charData;
    [player, charData] = await this.findPlayerData(player);
    if (!player) {
      return "Error: Player not found";
    }
    if (charData) {
      charData.balance = gold;
      dbm.saveFile(collectionName, player, charData);
      return true;
    } else {
      return false;
    }
  }

  static async addItemToPlayer(player, item, amount) {
    let collectionName = 'characters';
    item = await shop.findItemName(item);
    let charData;
    [player, charData] = await this.findPlayerData(player);
    if (!player) {
      return "Error: Player not found";
    }
    if (charData) {
      //If amount is positive, add items to player or set to amount if they have none of the item already. If amount is negative, remove items from player or set to 0 if they have none of the item already, or less than the amount.
      if (amount > 0) {
        if (charData.inventory[item]) {
          charData.inventory[item] += amount;
        } else {
          charData.inventory[item] = amount;
        }
      } else if (amount < 0) {
        if (charData.inventory[item]) {
          if (charData.inventory[item] + amount > 0) {
            charData.inventory[item] += amount;
          } else {
            charData.inventory[item] = 0;
          }
        } else {
          charData.inventory[item] = 0;
        }
      }
      dbm.saveFile(collectionName, player, charData);
      return true;
    } else {
      return false;
    }
  }

  static async findPlayerData(player) {
    let collectionName = 'characters';
    //Load collection
    let data = await dbm.loadCollection(collectionName);
    //Find if player can be found easily, if yes return player and charData
    if (data[player]) {
      return [player, data[player]];
    } else {
      //If not, try to find player by numeric ID
      //Player ID that would be passed is surrounded by <@{ID}>, so need to remove those to find id
      player = player.replace("<@", "");
      player = player.replace(">", "");
      for (let [key, value] of Object.entries(data)) {
        if (value.numericID === player) {
          return [key, value];
        }
      }
    }
    //If player cannot be found, return false
    return [false, false];
  }
}

module.exports = char;