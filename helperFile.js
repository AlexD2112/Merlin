const dbm = require('./database-manager');

// Load the shop collection, add the "Need None Of Roles" field to each document's usageOptions, and save the collection back to the database
// This is a one-time script to add the "Need None Of Roles" field to each document's usageOptions
// Usage: node addNeedNoneOfRolesToShop.js
async function addNeedNoneOfRolesToShop() {
    // Load the shop collection
    const shopCollection = await dbm.loadCollection('shop');

    // Add the "Need None Of Roles" field to each document's usageOptions
    for (let shopItem in shopCollection) {
        shopItem = shopCollection[shopItem];
        shopItem.usageOptions["Need None Of Roles"] = "";
    }

    // Save the shop collection back to the database
    await dbm.saveCollection('shop', shopCollection);
}

addNeedNoneOfRolesToShop();