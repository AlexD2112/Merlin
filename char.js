const dbm = require('./database-manager'); // Importing the database manager

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

  static async incomes(userID) {
    let fileName = 'characters.json';

    // Load the data
    let data = dbm.load(fileName);

    var now = new Date();
    now.setUTCDate(now.getUTCDate() + 1);
    now.setUTCHours(0, 0, 0, 0);
    if (data[userID].incomeAvailable === false) {
      return "You have already used income this income cycle. You can use income again <t:" + (now.getTime()/1000) + ":R>";
    }

    let charIncomeData = data[userID].incomeList;
    let superstring = ""
    let total = 0;
    for (let [key, value] of Object.entries(charIncomeData)) {
      superstring = superstring + (key + " : " + String(value) + "\n");
      total += value;
    }
    superstring = "Earned " + total + " shillings\n========\n" + superstring;
    superstring = superstring + ("========\nTotal Income : " + total);
    
    data[userID].incomeAvailable = false;
    data[userID].balance += total;

    dbm.save(fileName, data);
  
    return superstring;
  }

  static async incomeList(userID) {
    // Load the data
    let data = dbm.load('characters.json');
    let charIncomeData = data[userID].incomeList;
    let superstring = ""
    let total = 0;
    for (let [key, value] of Object.entries(charIncomeData)) {
      superstring = superstring + (key + " : " + String(value) + "\n");
      total += value;
    }
    superstring = "Your incomes are:\n========\n" + superstring;
    superstring = superstring + ("========\nTotal Income : " + total);
    return superstring;
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