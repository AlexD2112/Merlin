const dbm = require('./database-manager'); // Importing the database manager
const axios = require('axios');

class char {
  // Function to add items
  static newChar(playerID, charName, charBio, charKingdom) {
    // Set the database name
    let fileName = 'characters.json';
    let data = dbm.load(fileName);

    if (data[playerID]) {
      data[playerID] = {
        name: charName,
        bio: charBio,
        kingdom: charKingdom,
        balance: data[playerID].balance,
        inventory: data[playerID].inventory,
        incomeList: data[playerID].incomeList,
        incomeAvailable: incomeAvailable,
        stats: data[playerID].stats,
        shireID: 0
      };
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
}

module.exports = char;