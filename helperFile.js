const dbm = require('./database-manager');
const shop = require('./shop');
const fs = require('node:fs');
const path = require('node:path');
const clientManager = require('./clientManager');
// Pull logs/2024-05-01 file, pull shop value, update shop values in shop

async function updateAllItemVersions() {
    let baseLogs = await dbm.loadFile("logs", "2024-05-01");
    //Get "shop" collection from "logs/2024-05-01" file
    let logs = baseLogs.shop;
    console.log(logs);

    await dbm.saveCollection("shop", logs);
}

// async function militaryToMartial() {
//     // Helper function to recursively update string fields in an object
//     function updateField(obj) {
//         for (let key in obj) {
//             if (typeof obj[key] === 'string') {
//                 // Replace 'Military' with 'Martial' considering case sensitivity
//                 obj[key] = obj[key].replace(/Military/g, 'Martial');
//                 obj[key] = obj[key].replace(/military/g, 'martial');
//             } else if (typeof obj[key] === 'object') {
//                 updateField(obj[key]);  // Recurse into nested objects
//             }
//         }
//     }

//     // Process each collection
//     const collections = ['characters', 'shop'];
//     for (let collectionName of collections) {
//         let data = await dbm.loadCollection(collectionName);
//         updateField(data);
//         await dbm.saveCollection(collectionName, data);
//     }
// }

//Save all data from keys/commandList to json named commandList.json
async function saveCommandList() {
    //Load from firebase
    let data = await dbm.loadFile("keys", "commandList");

    //Now save to json- saveFile won't work because that's firebase, there is no helper function for this
    let formattedData = JSON.stringify(data, null, 2);
    fs.writeFileSync('./commandList.json', formattedData);
}

async function fetchFirebaseCommands() {
    try {
        // Replace this with the actual call to fetch data from Firebase
        return await dbm.loadFile("keys", "commandList");
    } catch (error) {
        console.error("Failed to load command list from Firebase:", error);
        return {};
    }
}

async function compareAndSaveMismatchedCommands() {
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);
    const firebaseCommands = await fetchFirebaseCommands();

    let localCommands = {};

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                const cmdData = command.data.toJSON();
                localCommands[cmdData.name] = {
                    description: cmdData.description,
                    options: cmdData.options.reduce((acc, option) => {
                        acc[option.name] = option.description;
                        return acc;
                    }, {})
                };
            }
        }
    }

    let mismatches = {};
    for (let cmdName in localCommands) {
        const localCommand = localCommands[cmdName];
        const firebaseCommand = firebaseCommands[cmdName];

        // Check if the command exists in Firebase and if description and options match
        if (!firebaseCommand ||
            localCommand.description !== firebaseCommand.description ||
            !areOptionsEquivalent(localCommand.options, firebaseCommand.options)) {
            mismatches[cmdName] = localCommands[cmdName];
        }
    }

    // Save mismatches to commandList.json
    const commandListPath = path.join(__dirname, 'commandList.json');
    fs.writeFileSync(commandListPath, JSON.stringify(mismatches, null, 4));
}

function areOptionsEquivalent(localOptions, firebaseOptions) {
    const localKeys = Object.keys(localOptions);
    const firebaseKeys = Object.keys(firebaseOptions);
    if (localKeys.length !== firebaseKeys.length) return false;

    for (let key of localKeys) {
        if (!firebaseOptions[key] || localOptions[key] !== firebaseOptions[key]) {
            return false;
        }
    }

    return true;
}

function loadSaved() {
    let data = JSON.parse(fs.readFileSync('./itemsSAVED.json'));
    dbm.saveCollection("shop", data);
}

function loadShopFromFirebase() {
    //Load the items data from firebase and save to json
    dbm.loadCollection("shop").then((data) => {
        let formattedData = JSON.stringify(data, null, 2);
        fs.writeFileSync('./itemsSAVED.json', formattedData);
    });
}

function saveShopToFirebase() {
    //Load the items data from json and save to firebase, but don't overwrite anything
    let oldData = dbm.loadCollection("shop");
    let newData = JSON.parse(fs.readFileSync('./items.json'));
    for (let item in newData) {
        oldData[item] = newData[item];
    }

    dbm.saveCollection("shop", oldData);
}

function addHelpFieldToCommands() {
    const commandListPath = path.join(__dirname, 'commandList.json');
    if (fs.existsSync(commandListPath)) {
        let commandList = JSON.parse(fs.readFileSync(commandListPath, 'utf8'));

        // Add an empty 'help' field to each command if it doesn't already have one
        for (let commandName in commandList) {
            if (commandList[commandName].help === undefined) {
                commandList[commandName].help = "";  // Set the 'help' field to an empty string
            }
        }

        // Write the updated command list back to the file
        fs.writeFileSync(commandListPath, JSON.stringify(commandList, null, 4));
        console.log("Updated commandList.json with empty 'help' fields.");
    } else {
        console.log("commandList.json not found.");
    }
}

//This file goes in, grabs any commands from commandList.json and either adds them to the database or updates the values in the database. It doesn't delete or change files already in the database that aren't mentioned
async function updateCommandList() {
    let data = JSON.parse(fs.readFileSync('./commandList.json'));
    let origData = await dbm.loadFile("keys", "commandList");

    for (let command in data) {
        origData[command] = data[command];
    }

    await dbm.saveFile("keys", "commandList", origData);
}

async function addHousesToFirebase() {
    try {
        // Read the houses.json file
        const houses = JSON.parse(fs.readFileSync('./houses.json'));

        // Iterate through each house and add the emoji
        for (const houseName in houses) {
            if (houses.hasOwnProperty(houseName)) {
                const house = houses[houseName];
                house.emoji = await clientManager.getEmoji(houseName);
            }
        }

        // Save the updated data to Firebase
        await dbm.saveFile('keys', 'houses', houses);

        console.log('Houses data with emojis saved to Firebase successfully.');
    } catch (error) {
        console.error('Error adding houses to Firebase:', error);
    }
}

async function fixItemGivenComponentOfRecipes() {
    const recipes = await dbm.loadCollection('recipes');
    const shopData = await dbm.loadCollection('shop');

    //For each recipe, for every option that includes "Ingredient" or "Result", split it by spaces, concatenate with a space everything past the first value (which will be a number, i.e. "10 Wood" or "10 Bronze shield"), than use shop.findItemName to get the item name. each recipe includes a map (recipeOptions) of option names to values
    for (let recipe in recipes) { 
        for (let option in recipes[recipe].recipeOptions) {
            if (option.includes("Ingredient") || option.includes("Result")) {
                let splitOption = option.split(" ");
                let itemName = splitOption.slice(1).join(" ");
                let item = await shop.findItemName(itemName, shopData);
                if (item != "ERROR") {
                    recipes[recipe].recipeOptions[option] = item;
                } else {
                    console.log("Error finding item name for " + itemName);
                }
            }
        }
    }
    dbm.saveCollection('recipes', recipes);
}

async function fixItemGivenComponentOfIncomes() {
    //incomeList is a file in collection keys
    const incomes = await dbm.loadFile('keys', 'incomeList');
    const shop = await dbm.loadCollection('shop');

    //For each income, fix the option itemGiven
    for (let income in incomes) {
        let itemName = incomes[income].itemGiven;
        let item = await shop.findItemName(itemName, shop);
        if (item != "ERROR") {
            incomes[income].itemGiven = item;
        } else {
            console.log(incomes[income]);
            console.log("Error finding item name for " + itemName);
        }
    }
    console.log(incomes);
    dbm.saveFile('keys', 'incomeList', incomes);
}

async function saveAllCommands() {
    //Save all commands to a json file, formatted with the key as the command name, and several values ("help", and an array of "options")
    //Than, find any command that also exists in the database, and update teh json file with the database values
    let data = {};
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                const cmdData = command.data.toJSON();
                data[cmdData.name] = {
                    description: cmdData.description,
                    help: "",
                    options: cmdData.options.reduce((acc, option) => {
                        acc[option.name] = option.description;
                        return acc;
                    }, {})
                };
            }
        }
    }

    //Now, update the json file with the database values
    let origData = await dbm.loadFile("keys", "commandList");

    for (let command in origData) {
        data[command] = origData[command];
    }

    //Save json
    fs.writeFileSync('./commandList.json', JSON.stringify(data, null, 2));
}

saveAllCommands();