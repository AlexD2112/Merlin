const dbm = require('./database-manager'); // Importing the database manager
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
    console.log(takes);
    for (let i = 0; i < takes.length; i++) {
      switch (takes[i]) {
        case "\n" :
          break;
        case ":": 
          if (!onKey) {
            return "ERROR IN TAKES SECTION";
          } else {
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
            console.log(currKey);
          } else {
            if (!takesMap[currKey]) {
              takesMap[currKey] = "";
            }
            takesMap[currKey] += takes[i];
            console.log(takesMap[currKey]);
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
      const inspectEmbed = {
        color: 0xFFB600,
        title: '**Item: ' +  data[itemName].icon + itemName + "**",
        description: "**" + data[itemName].description + "**",
        fields: [
          {
            name: 'Regular field title',
            value: 'Some value here',
          },
        ],
        image: {
          url: 'https://i.imgur.com/AfFp7pu.png',
        },
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Some footer text here',
          icon_url: 'https://i.imgur.com/AfFp7pu.png',
        },
      };
    } else {
      return "ERROR";
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
}

module.exports = shop;