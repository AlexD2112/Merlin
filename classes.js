const dbm = require('./database-manager'); // Importing the database manager

class Shop {
  // Function to add items/edit - additem(name, price)
  static addItem(itemName, itemPrice) {
    // Set the database name
    dbm.name = 'shop';
    // Run the update function with the changes needed
    dbm.update(dbm.name, itemName, itemPrice);
  }

  // Function to print item list
  static itemList() {
    // Load the data
    dbm.load('shop');
    // Log it to the console
    console.log(dbm.data);
    return dbm.data;
  }

  // Function to remove items - removeItem(name)
  static removeItem(itemName) {
    // Set the database name
    dbm.name = 'shop';
    // Try to remove the item, and if it doesn't exist, catch the error
    try {
      dbm.varDelete(itemName);
    } catch (error) {
      // Handle the error or do nothing
      // In JavaScript, you might want to handle errors differently
    }
  }

  static getItemPrice(itemName) {
    dbm.load('shop');
    const price = dbm.data[itemName];
    console.log(price);
    return price;
  }
}
