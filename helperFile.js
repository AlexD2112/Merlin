const dbm = require('./database-manager');
const clientManager = require('./clientManager');

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

async function loadResourcesJSON() {
    const resources = await dbm.loadFile('keys', 'resources');
    
    //Save as json
    const fs = require('fs');
    fs.writeFileSync('resources.json', JSON.stringify(resources, null, 2));

    console.log("Resources saved to resources.json");
}

async function saveResourcesJSON() {
    const fs = require('fs');
    const resources = JSON.parse(fs.readFileSync('resources.json'));

    await dbm.saveFile('keys', 'resources', resources);
    console.log("Resources saved to database");
}

async function getResourceEmojis() {
    const resources = await dbm.loadFile('keys', 'resources');
    
    for (let resource in resources) {
        let emoji = clientManager.getEmoji(resource);
        if (!emoji || emoji == null) {
            console.log(`Resource ${resource} does not have an emoji`);
            continue;
        }
        resources[resource].emoji = emoji;
    }

    await dbm.saveFile('keys', 'resources', resources);
}

//export getResourceEmojis;

module.exports = {
    addNeedNoneOfRolesToShop,
    loadResourcesJSON,
    saveResourcesJSON,
    getResourceEmojis
}