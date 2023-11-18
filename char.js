const dbm = require('./database-manager'); // Importing the database manager
const shop = require ('./shop');
const axios = require('axios');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, createWebhook } = require('discord.js');

class char {
  // Function to add items
  static newChar(playerID, charName, charBio, charKingdom) {
    // Set the database name
    let fileName = 'characters.json';
    let data = dbm.load(fileName);

    if (data[playerID]) {
      data[playerID].name = charName;
      data[playerID].bio = charBio;
      data[playerID].kingdom = charKingdom;
    } else {
      data[playerID] = {
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
        shireID: 0
      };
    }
    
    dbm.save(fileName, data);

    // // Reload the data
    // data = dbm.load(fileName);

    // // Add the specified item with a quantity of 1 to the inventory
    // data[playerID].inventory["apples"] += 1;

    // // Save the updated data
    // dbm.save(fileName, data);
  }

  static async setAvatar(avatarURL, userID) {
    try {
      // Make a HEAD request to check if the URL leads to a valid image
      const response = await axios.head(avatarURL, { maxRedirects: 5 });
  
      // Check if the response status code indicates success (e.g., 200)
      if (response.status === 200) {
        let fileName = 'characters.json';
        let data = dbm.load(fileName);
  
        data[userID].icon = avatarURL;
  
        dbm.save(fileName, data);
  
        return "Avatar has been set";
      } else {
        return "Error: Avatar URL is not valid (HTTP status code " + response.status + ").";
      }
    } catch (error) {
      return "Unable to check the Avatar URL. " + error.message;
    }
  }

  static balance(userID) {
    let data = dbm.load('characters.json');
    if (data[userID]) {
      const charEmbed = {
        color: 0x36393e,
        author: {
          name: data[userID].name,
          icon_url: data[userID].icon ? data[userID].icon : 'https://images-ext-1.discordapp.net/external/xNBNeaCotnpdWVuj-r0wO8X87d34DAH4X58Bqs--vyQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1148265132791713802/a2637c14d39ff85a1ed89a6fa888ebbc.png',
        },
        description: ":coin: **" + data[userID].balance + "**",
      };
      return charEmbed;
    } else {
      return "You haven't made a character! Use /newchar first";
    }

  }

  static stats(userID) {
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

    let data = dbm.load('characters.json');
    if (data[userID]) {
      const prestige = data[userID].stats.Prestige;
      const martial = data[userID].stats.Martial;
      const intrigue = data[userID].stats.Intrigue;

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
          name: data[userID].name,
          icon_url: data[userID].icon ? data[userID].icon : 'https://images-ext-1.discordapp.net/external/xNBNeaCotnpdWVuj-r0wO8X87d34DAH4X58Bqs--vyQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1148265132791713802/a2637c14d39ff85a1ed89a6fa888ebbc.png',
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

  static me(userID) {
    let data = dbm.load('characters.json');
    if (data[userID]) {
      let bioString = data[userID].bio;

      const charEmbed = {
        color: 0x36393e,
        author: {
          name: data[userID].name,
          icon_url: data[userID].icon ? data[userID].icon : 'https://images-ext-1.discordapp.net/external/xNBNeaCotnpdWVuj-r0wO8X87d34DAH4X58Bqs--vyQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1148265132791713802/a2637c14d39ff85a1ed89a6fa888ebbc.png',
        },
        description: bioString,
        image: {
          url: data[userID].icon ? data[userID].icon : 'https://images-ext-1.discordapp.net/external/xNBNeaCotnpdWVuj-r0wO8X87d34DAH4X58Bqs--vyQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1148265132791713802/a2637c14d39ff85a1ed89a6fa888ebbc.png',
        },
      };
      return charEmbed;
    } else {
      return "You haven't made a character! Use /newchar first";
    }

  }

  static char(userID) {
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

    let data = dbm.load('characters.json');
    if (data[userID]) {
      let bioString = data[userID].bio;

      const prestige = data[userID].stats.Prestige;
      const martial = data[userID].stats.Martial;
      const intrigue = data[userID].stats.Intrigue;

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
          name: data[userID].name,
          icon_url: data[userID].icon ? data[userID].icon : 'https://images-ext-1.discordapp.net/external/xNBNeaCotnpdWVuj-r0wO8X87d34DAH4X58Bqs--vyQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1148265132791713802/a2637c14d39ff85a1ed89a6fa888ebbc.png',
        },
        description: bioString,
        fields: [
          {
            name: ":coin: Balance: " + data[userID].balance,
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

  //Create a webhook and send a message using it with character name, avatar and message in the channel the command was used in
  static async say(userID, message, channelID) {
    console.log(userID);
    let data = dbm.load('characters.json');
    if (data[userID]) {
      let webhookName = data[userID].name;
      //if data[userID].icon is undefined, set it to the default avatar
      let webhookAvatar = data[userID].icon ? data[userID].icon : 'https://images-ext-1.discordapp.net/external/xNBNeaCotnpdWVuj-r0wO8X87d34DAH4X58Bqs--vyQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1148265132791713802/a2637c14d39ff85a1ed89a6fa888ebbc.png';
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
    let fileName = 'characters.json';

    // Load the data
    let data = dbm.load(fileName);

    var now = new Date();
    now.setUTCDate(now.getUTCDate() + 1);
    now.setUTCHours(0, 0, 0, 0);

    let charIncomeData = data[userID].incomeList;
    let superstring = "";
    let afterString = "";
    let total = 0;
    for (let [key, value] of Object.entries(charIncomeData)) {
      superstring += (":coin: **" + key + "** : `" + String(value) + "`\n");
      if ((data[userID].incomeAvailable === true)) {
        afterString += (":coin: **" + key + "** : `+" + String(value) + "`\n");
      }
      total += value;
    }
    superstring += ":coin: **__Total :__** `" + total + "`\n\n";
    if ((data[userID].incomeAvailable === true)) {
      afterString += (":coin: **__Total :__** `+" + total + "`");
    }
    if (data[userID].incomeAvailable === false) {
      superstring += "You have already used income this income cycle!";
    } else {
      superstring += "Succesfully collected!"
    }
    superstring += "\nNext cycle  <t:" + (now.getTime()/1000) + ":R>"
    
    data[userID].incomeAvailable = false;
    data[userID].balance += total;

    dbm.save(fileName, data);
    
    const incomeEmbed = {
      color: 0x36393e,
      title: "**__Incomes__**",
      description: `<@${numericID}>\n\n${superstring}`,
    };
  
    return [incomeEmbed, afterString];
  }

  static async resetIncomeCD() {
    let fileName = 'characters.json';
    let data = dbm.load(fileName);
    for (let [_, charData] of Object.entries(data)) {
      charData.incomeAvailable = true;
    }
    dbm.save(fileName, data);
  }

  static async craft(charID, itemName) {
    itemName = await shop.findItemName(itemName);
    if (itemName === "ERROR") {
      return "Not a valid item";
    }
    const numToUse = 1;

    let returnEmbed = new EmbedBuilder();
    const charactersJSONName = 'characters.json';
    let charactersData = dbm.load(charactersJSONName);
    const shopJSONName = 'shop.json';
    let shopData = dbm.load(shopJSONName);

    if (!shopData[itemName].recipe) {
      return "No recipe";
    } else {
      returnEmbed.setTitle("**__Started Crafting:__" + shopData[itemName].icon + itemName + "**");
      if (shopData[itemName].recipe.countdown) {
        if (shopData[itemName].recipe.takes) {
          // Check crafting slots in charactersData[charID].cooldowns
          const craftSlots = charactersData[charID].cooldowns.craftSlots || {};

          if (Object.keys(craftSlots).length >= 3) {
              return "All crafting slots are in use.";
          }

          let takeString = "";

          // Remove items in recipe.takes
          for (let key in shopData[itemName].recipe.takes) {
            const val = shopData[itemName].recipe.takes[key] * numToUse;
            if (!charactersData[charID].inventory[key] || charactersData[charID].inventory[key] < val) {
                if (!charactersData[charID].inventory[key]) {
                  charactersData[charID].inventory[key] = 0;
                }
                return "Not enough **" + shopData[key].icon + key + "**! You need " + val + " and only have " + charactersData[charID].inventory[key] + ".";
            } else {
                charactersData[charID].inventory[key] -= val;
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
          charactersData[charID].cooldowns.craftSlots = craftSlots;

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
    dbm.save(charactersJSONName, charactersData);
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
    const charactersJSONName = 'characters.json';
    let charactersData = dbm.load(charactersJSONName);
    const shopJSONName = 'shop.json';
    let shopData = dbm.load(shopJSONName);

    if (!shopData[itemName].usageCase) {
      return "No usage case";
    } else {
      if (shopData[itemName].usageCase.countdown) {
        if (charactersData[charID].cooldowns[itemName]) {
          if (charactersData[charID].cooldowns[itemName] > Math.round(Date.now() / 1000)) {
            return "You have used this item recently! Can be used again <t:" + charactersData[charID].cooldowns[itemName] + ":R>";
          }
        } else if (!charactersData[charID].cooldowns) {
          charactersData[charID].cooldowns = {};
        }
        charactersData[charID].cooldowns[itemName] = Math.round(Date.now() / 1000) + shopData[itemName].usageCase.countdown;
        returnEmbed.addFields(
          { name: '**Can be used again:**', value: '<t:' + charactersData[charID].cooldowns[itemName] + ':R>'}
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
            if (!charactersData[charID].inventory[itemName] || charactersData[charID].inventory[itemName] < numToUse) {
              if (!charactersData[charID].inventory[itemName]) {
                charactersData[charID].inventory[itemName] = 0;
              }
              return "Not enough **" + shopData[itemName].icon + itemName + "**! You need " + numToUse + " and only have " + charactersData[charID].inventory[itemName] + ".";
            } else {
              charactersData[charID].inventory[itemName] -= numToUse;
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
                if (!charactersData[charID].stats[key]) {
                  charactersData[charID].stats[key] = 0;
                }
                charactersData[charID].stats[key] -= val;
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
              if (!charactersData[charID].stats[key]) {
                charactersData[charID].stats[key] = 0;
              }
              charactersData[charID].stats[key] += val;
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
            if (!charactersData[charID].inventory[itemName] || charactersData[charID].inventory[itemName] < numToUse) {
              if (!charactersData[charID].inventory[itemName]) {
                charactersData[charID].inventory[itemName] = 0;
              }
              return "Not enough **" + shopData[itemName].icon + itemName + "**! You need " + numToUse + " and only have " + charactersData[charID].inventory[itemName] + ".";
            } else {
              charactersData[charID].inventory[itemName] -= numToUse;
              takeString += "`   -" + numToUse + "` " + shopData[itemName].icon + " " + itemName + "\n";
            }
            for (let key in shopData[itemName].usageCase.takes) {
              let val = shopData[itemName].usageCase.takes[key];
              if (!charactersData[charID].inventory[key] || charactersData[charID].inventory[key] < val) {
                if (!charactersData[charID].inventory[key]) {
                  charactersData[charID].inventory[key] = 0;
                }
                return "Not enough **" + shopData[key].icon + key + "**! You need " + val + " and only have " + charactersData[charID].inventory[key] + ".";
              } else {
                charactersData[charID].inventory[key] -= val;
                takeString += "`   -" + val + "` " + shopData[key].icon + " " + key + "\n";
              }
            }
            let giveString = "";
            for (let key in shopData[itemName].usageCase.gives) {
              let val = shopData[itemName].usageCase.gives[key];
              charactersData[charID].incomeList[key] = val;
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
      if (!charactersData[charID].cooldowns) {
        charactersData[charID].cooldowns = {};
      }
      if (!charactersData[charID].cooldowns[itemName]) {
        charactersData[charID].cooldowns[itemName] = 0;
      }
      charactersData[charID].cooldowns[itemName] = Math.round(Date.now() / 1000) + shopData[itemName].usageCase.countdown;
      returnEmbed.addFields(
        { name: '**Can be used again:**', value: '<t:' + charactersData[charID].cooldowns[itemName] + ':R>'}
      );
    }
    dbm.save(charactersJSONName, charactersData);
    return returnEmbed;
  }
}

module.exports = char;