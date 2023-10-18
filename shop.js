const dbm = require('./database-manager'); // Importing the database manager
class shop {
  // Function to add items
  static addItem(itemName, itemPrice, itemDescription) {
    // Set the database name
    let fileName = 'shop.json';
    let data = dbm.load(fileName);

    data[itemName] = {
      price: itemPrice,
      description: itemDescription,
    };
    
    dbm.save(fileName, data);
  }

  // Function to print item list
  static async shop() {
    // Load the data
    let data = dbm.load('shop.json');
    let superstring = ""
    for (let [key, value] of Object.entries(data)) {
      superstring = superstring + (key + " : " + String(value["price"]) + "\n");
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
      console.log(numToBuy);
      console.log(price);
      console.log(price * numToBuy);
      data[charID].balance -= (price * numToBuy);
      console.log(data[charID].balance);

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