const dbm = require('./database-manager'); // Importing the database manager

class shop {
  // Function to add items/edit - additem(name, price)
  static addItem(itemName, itemPrice) {
    // Set the database name
    let fileName = 'shop.json';
    // Run the update function with the changes needed
    dbm.update(fileName, itemName, itemPrice);
  }

  // Function to print item list
  static async itemList() {
    // Load the data
    let data = dbm.load('shop.json');
    let superstring = ""
    for (let [key, value] of Object.entries(data)) {
      superstring = superstring + (key + " : " + String(value) + "\n");
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

  static getItemPrice(itemName) {
    dbm.load('shop.json');
    const price = dbm.data[itemName];
    console.log(price);
    return price;
  }
}

module.exports = shop;