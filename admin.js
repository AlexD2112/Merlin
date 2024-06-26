const dbm = require('./database-manager'); // Importing the database manager
const axios = require('axios');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, createWebhook, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const shop = require('./shop');
const fs = require('node:fs');
const path = require('node:path');
const clientManager = require('./clientManager');

const mapOptions = ["Name", "About", "Channels", "Image", "Emoji"]

class Admin {

  static async initShireSelect(channel) {
    let shires = await dbm.loadFile("keys", "shires");
    //get shires from keys, where it is an array
    let shireNames = Object.keys(shires).map(key => "- " + clientManager.getEmoji("Polis") + " " + shires[key].name  + " - " + shires[key].resource + " " + shires[key].resourceCode).join("\n");
    //Send an embed with the title Massalia and the text Capital: Massalia \n The city has the following colonies \n and than a list of the colonies. There will also be a menu you can click to choose which colony. The colonies will come out of the shires.json file.
    let embed = new EmbedBuilder()
      .setDescription("# " + clientManager.getEmoji("Massalia") + " The League of Massalia" +
        "\n- Capital: :star: Massalia" +
        "\n- The League of Massalia controls the following cities: " +
        "\n \u200B----------------------------------------" +
        "\n" + shireNames)
      .setFooter({ text: 'Select a city below to join', iconURL: 'https://images-ext-1.discordapp.net/external/zNN-s-f41tPGzag5FxItzlLKuLKnAXiirTy3ke0nG-k/https/cdn.discordapp.com/emojis/620697454928723971.gif' })
      .setImage('https://cdn.discordapp.com/attachments/1232087145557135380/1232426010604077056/MASSALIA_BANNER_NEW_copy.jpg?ex=662969aa&is=6628182a&hm=bf094becea2d4479e257fcdeb54b2b4055910a379fa8809d6c826e5c712cca2c&');
    let select = new StringSelectMenuBuilder().setCustomId('shireSelect').setPlaceholder('Select a city to join');
    //Add a select menu option for each city in the keys.json file
    Object.keys(shires).forEach(shire => {
      select.addOptions({
        label: shires[shire].name,
        value: shire
      });
    });

    let actionRow = new ActionRowBuilder().addComponents(select);
    
    await channel.send({ embeds: [embed], components: [actionRow] });
  }

  static async initTradeNodeSelect(channel) {
    let tradeNodes = await dbm.loadFile("keys", "tradeNodes");
    let shopData = await dbm.loadCollection("shop");
    //TradeNodes is a map of trade node names to trade node objects, where each trade node object has a name, and list of items that can be traded there, as well as a role code for the trade node. The role code may be blank, in which case it must be found.
    //Ex. trade node: " - <polis emoji> North Sea Waters - <Item1> <Item1Emoji>, <Item2> <Item2Emoji>"

    let tradeNodeNames = await Promise.all(
      Object.keys(tradeNodes).map(async key => {
        let itemsWithIcons = await Promise.all(
            tradeNodes[key].items.map(async item => {
                let icon = await shop.getItemIcon(item, shopData);
                return `${item} ${icon}`;
            })
        );
        return ` - ${clientManager.getEmoji("Polis")} ${tradeNodes[key].name} - ${itemsWithIcons.join(", ")}`;
      })
    );
  
    tradeNodeNames = tradeNodeNames.join("\n");
  
    //Send an embed with the title Trade Nodes of Massalia and the text The following trade nodes are available to trade in: and than a list of the trade nodes. There will also be a menu you can click to choose which trade node. The trade nodes will come out of the tradeNodes.json file.
    let embed = new EmbedBuilder()
      .setDescription("# " + clientManager.getEmoji("Massalia") + " Trade Node Selection" +
        "\n- Within the trade menu, you are afforded the opportunity to select only one (1) trade region to engage with. " +
        "\n- Eligibility for selection requires possession of the 'Trade Ship' role, symbolizing your maritime commercial capabilities." +
        "\n- Upon selection, you will be granted exclusive access to a specialized trade channel. This channel is a marketplace for unique resources and items, specific to your chosen trade region." +
        "\n- You can change your trade node by buying and using the item **Node Nullifier**" +
        "\n- To initiate your trade region selection, utilize the menu provided below." +
        "\n" + tradeNodeNames)
      .setFooter({ text: 'Select a trade node below to trade in', iconURL: 'https://images-ext-1.discordapp.net/external/zNN-s-f41tPGzag5FxItzlLKuLKnAXiirTy3ke0nG-k/https/cdn.discordapp.com/emojis/620697454928723971.gif' })
      .setImage('https://cdn.discordapp.com/attachments/1248563504772808736/1248646054384111707/Screenshot_2024-06-07_at_5.25.35_PM.png?ex=66646bc2&is=66631a42&hm=8a14092809ec776cc44e8950bd6b7f81f236d6c077d2bc91089dbfc0d5bc30bf&');

    let select = new StringSelectMenuBuilder().setCustomId('tradeNodeSelect').setPlaceholder('Select a trade node to trade in');
    //Add a select menu option for each trade node in the tradeNodes.json file
    Object.keys(tradeNodes).forEach(tradeNode => {
      select.addOptions({
        label: tradeNodes[tradeNode].name,
        value: tradeNode
      });
    });

    let actionRow = new ActionRowBuilder().addComponents(select);

    await channel.send({ embeds: [embed], components: [actionRow] });
  }

  static async initHouseSelect(channel) {
    let houses = await dbm.loadFile("keys", "houses");
    //Houses is a map of house names to house objects, where each house object has a name, emoji, political stance and motto
    let houseNames = Object.keys(houses).map(key => "- " + houses[key].emoji + " House " + houses[key].name + " - " + houses[key].stance).join("\n");
    //Send an embed with the title Houses of the Realm and the text The following houses are available to join: and than a list of the houses. There will also be a menu you can click to choose which house. The houses will come out of the houses.json file.

    let embed = new EmbedBuilder()
      .setDescription("# Houses of Massalia" +
        "\n- The following houses are available to join: " +
        "\n \u200B----------------------------------------" +
        "\n" + houseNames)
      .setFooter({ text: 'Select a house below to join', iconURL: 'https://images-ext-1.discordapp.net/external/zNN-s-f41tPGzag5FxItzlLKuLKnAXiirTy3ke0nG-k/https/cdn.discordapp.com/emojis/620697454928723971.gif' })
      .setImage('https://cdn.discordapp.com/attachments/1244030279199359077/1244034376757547070/Screenshot_2024-05-26_at_12.08.12_AM.png?ex=66544d8c&is=6652fc0c&hm=afbdf2cfd0776ca95946ddfc2a5cb4d3cf57b6f166b8623896bd873dc9ad0eae&');

    let select = new StringSelectMenuBuilder().setCustomId('houseSelect').setPlaceholder('Select a house to join');
    //Add a select menu option for each house in the houses.json file
    Object.keys(houses).forEach(house => {
      select.addOptions({
        label: houses[house].name,
        value: house
      });
    });

    let actionRow = new ActionRowBuilder().addComponents(select);

    await channel.send({ embeds: [embed], components: [actionRow] });
  }

  static async initPartySelect(channel) {
    let parties = await dbm.loadFile("keys", "parties");
    //Parties is a map of party names to party objects, where each party object has a name, emoji, political stance, roleID, motto and banner. All of that is irrelevant for this one, as we're just using the banner with a button underneath saying "Join [partyname]" for each party, i.e. multiple embeds and buttons

    for (const party in parties) {
      let partyData = parties[party];
      let embed = new EmbedBuilder()
        .setDescription("# " + partyData.emoji + " " + partyData.name + " (" + partyData.stance + ")" + 
          "\n> " + partyData.motto +
          "\n\n**Formation:** " + partyData.formation +
          "\n**Ideology:** " + partyData.ideology +
          "\n**Political Influence:** " + partyData.politicalInfluence)
        .setImage(partyData.banner);
      let button = new ButtonBuilder()
        .setCustomId('partySelect' + party)

        .setLabel('Join ' + partyData.name)
        .setStyle(ButtonStyle.Secondary);
      let actionRow = new ActionRowBuilder().addComponents(button);
      await channel.send({ embeds: [embed], components: [actionRow] });
    }
  }

  static async addShire(shireName, resource, guild) {
    console.log("Adding shire " + shireName + " with resource " + resource);
    let shires = await dbm.loadFile("keys", "shires");
    let shopData = await dbm.loadCollection("shop");
    resource = await shop.findItemName(resource, shopData);
    if (resource == "ERROR") {
      return "Item not found";
    }
    if (shires[shireName] != undefined) {
      if (shires[shireName].resource == resource) {
        return "Shire already exists";
      }
    }
    let roleID = "ERROR"
    if (guild.roles.cache.find(role => role.name === shireName) != undefined) {
      roleID = guild.roles.cache.find(role => role.name === shireName).id;
    } else {
      await guild.roles.create({
        name: shireName,
        color: '#FFFFFF',
        reason: 'Added role for shire from addshire command',
      }).then(role => {
        console.log("Role created");
        roleID = role.id;  // This will log the newly created role's ID
      }).catch(console.error);
    }
    let shire = {
      name: shireName,
      resource: resource,
      resourceCode: await shop.getItemIcon(resource, shopData),
      roleCode: roleID
    };
    shires[shireName] = shire;
    await dbm.saveFile("keys", "shires", shires);

    return "Shire " + shireName + " has been added with resource " + resource;
  }

  //addMap adds a new map to data, should be similar to addRecipe NOT to addShire
  static async addMap(mapName, guild) {
    // Load the maps collection
    let data = await dbm.loadFile('keys', 'maps');
    let mapNames = Object.keys(data);
    let i = 1;
    let newMapName = mapName;
  
    // Ensure the map name is unique by appending a number if necessary
    while (mapNames.includes(newMapName)) {
      newMapName = mapName + " " + i;
      i++;
    }
  
    // Create a new map object with all fields blank
    let mapData = {
      "mapOptions": mapOptions.reduce((acc, option) => {
        acc[option] = "";
        return acc;
      }, {}),
    };
    mapData.mapOptions.Name = newMapName;
    mapData.mapOptions.Emoji = ":map:";

    data[newMapName] = mapData;
  
    // Save the new map to the maps collection
    await dbm.saveFile('keys', 'maps', data); 
  
    return newMapName;
  }

  static async editMapMenu(mapName, tag) {
    // Load the map data
    let mapData = await dbm.loadFile('keys', 'maps');
  
    if (mapData[mapName] == undefined) {
      for (let key in mapData) {
        if (key.toLowerCase() == mapName.toLowerCase()) {
          mapName = key;
          break;
        }
      }
      if (mapData[mapName] == undefined) {
        return "Map not found!";
      }
    }
  
    mapData = mapData[mapName];
  
    let userData = await dbm.loadFile('characters', tag);
    if (!userData.editingFields) {
      userData.editingFields = {};
    }
    userData.editingFields["Map Edited"] = mapName;
    await dbm.saveFile('characters', tag, userData);
  
    // Construct the edit menu embed
    const embed = new EmbedBuilder()
      .setTitle("**" + mapName + "**")
      .setDescription('Edit the fields using the command /editmapfield <field number> <new value>');
    
    let emoji = mapData.mapOptions.Emoji;
  
    // Add fields for Map Options
    embed.addFields({ name: emoji + ' Map Options', value: mapOptions.map((option, index) => `\`[${index + 1}] ${option}:\` ` + mapData.mapOptions[option]).join('\n') });
    embed.setFooter({ text: 'Page 1 of 1, Map Options' });
  
    // Return the embed
    return embed;
  }

  static async allMaps() {
    let maps = await dbm.loadFile("keys", "maps");
    //Create an embed with the title ":map: All Maps", and than the description is a list of all maps in the form <Emoji> **<MapName>**
    let mapNames = Object.keys(maps).map(key => maps[key].mapOptions.Emoji + " **" + key + "**").join("\n");
    let embed = new EmbedBuilder()
      .setTitle("All Maps")
      .setDescription(mapNames);

    return embed;
  }
  

  static async selectShire(interaction) {
    const selectedShire = interaction.values[0];
    let shires = await dbm.loadFile("keys", "shires");
    let shire = shires[selectedShire];

    let guild = interaction.guild;
    let user = await guild.members.fetch(interaction.user.id);

    let userTag = interaction.user.tag;
    let char = await dbm.loadFile("characters", userTag);
    //Sort through user roles, see if they have any that match the shire roles. If they do, return an error message
    for (const role of user.roles.cache) {
      if (Object.values(shires).some(shire => shire.roleCode == role[1].id)) {
        await interaction.reply({ content: "You are already a member of a city! You cannot switch cities", ephemeral: true });
        return;
      }
    }

    let role = guild.roles.cache.find(role => role.name === shire.name);
    if (role == undefined) {
      role = await guild.roles.create({
        name: shire.name,
        color: '#FFFFFF',
        reason: 'Added role for shire from selectShire command',
      });

      shire.roleCode = role.id;
      shires[selectedShire] = shire;
      await dbm.saveFile("keys", "shires", shires);
    }

    //Make sure user has role for resource, and if it doesnt exist create it
    let resourceRole = guild.roles.cache.find(role => role.name === shire.resource);
    if (resourceRole == undefined) {
      resourceRole = await guild.roles.create({
        name: shire.resource,
        color: '#FFFFFF',
        reason: 'Added role for resource from selectShire command',
      });
    }

    await user.roles.add(role);
    await user.roles.add(resourceRole);
    await dbm.saveFile("characters", userTag, char);


    await interaction.reply({ 
      content: "You have selected " + shire.name + " with resource " + shire.resource, 
      ephemeral: true 
    });
  }

  static async selectTradeNode(interaction) {
    const selectedTradeNode = interaction.values[0];
    let tradeNodes = await dbm.loadFile("keys", "tradeNodes");
    let tradeNode = tradeNodes[selectedTradeNode];

    let guild = interaction.guild;
    let user = await guild.members.fetch(interaction.user.id);

    let userTag = interaction.user.tag;
    let char = await dbm.loadFile("characters", userTag);
    for (const role of user.roles.cache) {
      if (Object.values(tradeNodes).some(tradeNode => tradeNode.roleCode == role[1].id)) {
        await interaction.reply({ content: "You are already a member of a trade node! You cannot switch trade nodes", ephemeral: true });
        return;
      }
    }

    let role = guild.roles.cache.find(role => role.name === tradeNode.name);
    if (role == undefined) {
      role = await guild.roles.create({
        name: tradeNode.name,
        color: '#FFFFFF',
        reason: 'Added role for trade node from selectTradeNode command',
      });

      tradeNode.roleCode = role.id;
      tradeNodes[selectedTradeNode] = tradeNode;
      await dbm.saveFile("keys", "tradeNodes", tradeNodes);
    }

    await user.roles.add(role);
    char.tradeNodeID = selectedTradeNode;
    await dbm.saveFile("characters", userTag, char);

    await interaction.reply({ 
      content: "You have selected " + tradeNode.name + " as your trade node", 
      ephemeral: true 
    });
  }

  static async selectHouse(interaction) {
    const selectedHouse = interaction.values[0];
    let houses = await dbm.loadFile("keys", "houses");
    let house = houses[selectedHouse];

    let guild = interaction.guild;
    let user = await guild.members.fetch(interaction.user.id);

    let userTag = interaction.user.tag;
    let char = await dbm.loadFile("characters", userTag);
    for (const role of user.roles.cache) {
      if (Object.values(houses).some(house => house.roleCode == role[1].id)) {
        await interaction.reply({ content: "You are already a member of a house! You cannot switch houses", ephemeral: true });
        return;
      }
    }

    let role = guild.roles.cache.find(role => role.name === house.name);
    if (role == undefined) {
      role = await guild.roles.create({
        name: house.name,
        color: '#FFFFFF',
        reason: 'Added role for house from selectHouse command',
      });

      house.roleCode = role.id;
      houses[selectedHouse] = house;
      await dbm.saveFile("keys", "houses", houses);
    }

    await user.roles.add(role);
    char.houseID = selectedHouse;
    await dbm.saveFile("characters", userTag, char);

    await interaction.reply({ 
      content: "You have selected " + house.emoji + house.name + "\n\n" + house.motto, 
      ephemeral: true 
    });

    //Send welcome message to the house channel
    let houseForumID = house.forumID;
    let houseForum = guild.channels.cache.get(houseForumID);
    //Find house general chat- it's a thread in the forum that already exists
    const threads = await houseForum.threads.fetchActive();
    let generalChat;
    threads.threads.forEach(thread => {
      if (thread.name === "The " + house.name + " House General Chat") {
        generalChat = thread;
        // If found, stop searching
        return;
      }
    });

    if (!generalChat) {
      // If not found in active, search in archived
      const archivedThreads = await houseForum.threads.fetchArchived();
      archivedThreads.threads.forEach(thread => {
        if (thread.name === "The " + house.name + " House General Chat") {
          generalChat = thread;
          // If found, stop searching
          return;
        }
      });
    }


    let userPing = "<@" + user.id + ">";
    if (generalChat) {
      await generalChat.send("Welcome to " + house.emoji + house.name + ", " + userPing + "!");
    } else {
      console.log("General chat not found");
    }
  }

  static async selectParty(interaction) {
    const selectedParty = interaction.customId.replace("partySelect", "");
    let parties = await dbm.loadFile("keys", "parties");
    let party = parties[selectedParty];

    let guild = interaction.guild;
    let user = await guild.members.fetch(interaction.user.id);

    let userTag = interaction.user.tag;
    let char = await dbm.loadFile("characters", userTag);
    for (const role of user.roles.cache) {
      if (Object.values(parties).some(party => party.name.toLowerCase() == role[1].name.toLowerCase())) {
        await interaction.reply({ content: "You are already a member of a party! You cannot switch parties", ephemeral: true });
        return;
      }
    }

    let role = guild.roles.cache.find(role => role.name.toLowerCase() === party.name.toLowerCase());
    if (role == undefined) {
      console.log("ERROR! THIS IS A PROBLEM!")
    }

    await user.roles.add(role);
    char.partyID = selectedParty;
    await dbm.saveFile("characters", userTag, char);

    await interaction.reply({ 
      content: "You have selected " + party.emoji + party.name + "\n\n" + party.motto, 
      ephemeral: true 
    });

    //Send welcome message to the party channel
    let partyChatID = party.chatID;
    let partyChat = guild.channels.cache.get(partyChatID);
    let userPing = "<@" + user.id + ">";
    await partyChat.send("Welcome to " + party.emoji + party.name + ", " + userPing + "!");
  }

  static async generalHelpMenu(page, isAdminMenu) {
    page = Number(page);
    let folderToHelp = ""

    let embed = new EmbedBuilder()
      .setDescription("Use /help <command> to get help with a specific command");

    switch (page) {
      case 1:
        folderToHelp = "charCommands";
        embed.setTitle("Character Commands" + (isAdminMenu ? " (Admin)" : ""));
        break;
      case 2:
        folderToHelp = "shopCommands";
        embed.setTitle("Shop Commands" + (isAdminMenu ? " (Admin)" : ""));
        break;
      case 3:
        folderToHelp = "salesCommands";
        embed.setTitle("Sales Commands" + (isAdminMenu ? " (Admin)" : "")); 
        break;
      case 4:
        folderToHelp = "adminCommands";
        embed.setTitle("Admin Commands" + (isAdminMenu ? " (Admin)" : ""));
        break;
    }

    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
      if (folder == folderToHelp) {
        for (const file of commandFiles) {
          const filePath = path.join(commandsPath, file);
          const command = require(filePath);
          if ('data' in command && 'execute' in command) {
            if ((command.data.default_member_permissions == 0) == isAdminMenu) {
              let description = "";
              if (command.data.description != undefined) {
                description = command.data.description;
              }
              embed.addFields({ name: "/" + command.data.name, value: description });
            }
          }
        }
      }
    }

    const rows = [];
    // Create a "Previous Page" button
    let baseID = 'switch_help';
    if (isAdminMenu) {
      baseID += 'A';
      embed.setFooter({ text: 'Page ' + page + ' of ' + 4 });
    } else {
      baseID += 'R';
      embed.setFooter({ text: 'Page ' + page + ' of ' + 3 });
    }

    let prevID = baseID;
    if (page === 1) {
      if (isAdminMenu) {
        prevID += 4;
      } else {
        prevID += 3;
      }
    } else {
      prevID += page - 1;
    }

    const prevButton = new ButtonBuilder()
      .setCustomId(prevID)
      .setLabel('<')
      .setStyle(ButtonStyle.Secondary); // You can change the style to your preference

    let nextID = baseID;
    if (page === 4) { 
      if (isAdminMenu) {
        nextID += 1;
      }
    } else if (page === 3 && !isAdminMenu) {
      nextID += 1;
    } else {
      nextID += page + 1;
    }

    const nextButton = new ButtonBuilder()
          .setCustomId(nextID)
          .setLabel('>')
          .setStyle(ButtonStyle.Secondary); // You can change the style to your preference

    rows.push(new ActionRowBuilder().addComponents(prevButton, nextButton));

    return [embed, rows];
  }

  static async commandHelp(commandName) {
    //Send an embed with the title, description, options and "help" field of the command. Options should be horizontally aligned. Read from keys/commandList in firebase.
    let commandList = await dbm.loadFile("keys", "commandList");
    let command = commandList[commandName];
    if (command == undefined) {
      for (const cmd in commandList) {
        if (cmd.toLowerCase() == commandName.toLowerCase()) {
          command = commandList[cmd];
          commandName = cmd;
        }
      }
      if (command == undefined) {
        return null;
      }
    }
    let embed = new EmbedBuilder()
      .setDescription("## :hammer: </" + commandName + "> command");
    let options = command.options;
    embed.addFields({ name: "Basic Description: ", value: command.description, inline: false });
    //Options will be a bunch of inline field values, i.e. no optionstring will be made
    let optionsAdded = false;
    for (const option in options) {
      if (!optionsAdded) {
        embed.addFields({ name: "Options: ", value: " ", inline: false });
        optionsAdded = true;
      }
      embed.addFields({ name: "<" + option + ">", value: options[option], inline: true });
    }
    embed.addFields({ name: "Full info:", value: command.help });

    return embed;
  }

  static async addIncome(role, incomeString) {
    let roleID = role.id;
    let roleName = role.name;

    //Add an income to keys/incomeList
    let incomeList = await dbm.loadFile("keys", "incomeList");
    let shopData = await dbm.loadCollection("shop");
    //income string is either a number, or a phrase such as 10 Wood or 10 Package Horse.
    //Must be used to create a field with a name, usually based on the role name, and than a map of various values, including goldGiven, itemGiven and itemAmount. Will also have a list of roles that have this income under "Roles"
    let income = {
      delay: "1D",
      goldGiven: 0,
      itemGiven: "",
      itemAmount: 0,
      emoji: clientManager.getEmoji("Talent"),
      roles: []
    };
    let incomeSplit = incomeString.split(" ");
    if (incomeSplit.length == 1) {
      income.goldGiven = parseInt(incomeSplit[0]);
    } else {
      if (await shop.findItemName(income.itemGiven, shopData) == "ERROR") {
        return "Item not found";
      } else {
        income.itemGiven = await shop.findItemName(income.itemGiven, shopData);
      }
      income.itemGiven = await shop.findItemName(incomeSplit[1], shopData);
    }
    income.roles.push(roleID);
    incomeList[roleName] = income;

    await dbm.saveFile("keys", "incomeList", incomeList);

    return "Income added: " + incomeString + " income under name " + roleName + " <@&" + roleID + ">";
  }

  static async allIncomes(page = 1) {
    let maxLength = 10;
    let incomeList = await dbm.loadFile("keys", "incomeList");
    let shopData = await dbm.loadCollection("shop");
    if (Object.keys(incomeList).length == 0) {
      return "No incomes found";
    }

    let goldList = [];
    let itemList = [];
    let miscList = [];
    for (const income in incomeList) {
      let incomeValue = incomeList[income];
      let gold = incomeValue.goldGiven;
      let item = incomeValue.itemGiven;
      let amount = incomeValue.itemAmount;
      if (gold > 0 && item == "" && amount == 0) {
        goldList.push(income);
      } else if (gold == 0 && item != "" && amount > 0) {
        itemList.push(income);
      } else {
        miscList.push(income);
      }
    }
    //Sort goldList by gold given
    goldList.sort((a, b) => incomeList[a].goldGiven - incomeList[b].goldGiven);

    //Sort itemList by item given alphabetically, then by amount given, so that all items are grouped together but still sorted
    itemList.sort((a, b) => incomeList[a].itemGiven.localeCompare(incomeList[b].itemGiven) || incomeList[a].itemAmount - incomeList[b].itemAmount);  

    let incomes = [];
    let sortedIncomes = goldList.concat(itemList).concat(miscList);
    //Combine all lists into one list
    for (const income of sortedIncomes) {
      let incomeValue = incomeList[income];
      let emoji = incomeValue.emoji;
      let delay = incomeValue.delay;
      if (delay == undefined || delay == "") {
        delay = "1D";
      }
      let roles = incomeValue.roles;
      let rolesString = "";

      let justGold = false;
      let justItem = false;

      if (roles.length > 0) {
        rolesString = "<@&" + roles.join(">, <@&") + ">";
      }
      let givenString = "";
      if (incomeValue.goldGiven > 0) {
        givenString += clientManager.getEmoji("Talent");
        givenString += " " + incomeValue.goldGiven;
        givenString += " ";
      }
      if (incomeValue.itemGiven != "" && incomeValue.itemAmount != 0) {
        givenString += await shop.getItemIcon(incomeValue.itemGiven, shopData);
        givenString += " " + incomeValue.itemAmount + " " + incomeValue.itemGiven;
        if (!justGold) {
          justItem = true;
        }
        justGold = false;
      }

      let incomeEntry = emoji + " `" + delay + "` " + "**" + income + "**: " + rolesString + " " + givenString + "\n";
      incomes.push(incomeEntry);
    }

    // Calculate pagination
    let totalPages = Math.ceil(incomes.length / maxLength);
    page = Math.max(1, Math.min(page, totalPages));
    let start = (page - 1) * maxLength;
    let end = start + maxLength;

    let paginatedIncomes = incomes.slice(start, end).join('');
    let returnEmbed = new EmbedBuilder().setTitle("Incomes")
                                        .setDescription(paginatedIncomes)
                                        .setFooter({text: `Page ${page} of ${totalPages}`});

    let actionRow = new ActionRowBuilder();
    let prevButton = new ButtonBuilder()
      .setCustomId('switch_inco' + (page - 1))
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary);
    let nextButton = new ButtonBuilder()
      .setCustomId('switch_inco' + (page + 1))
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary);
    if (page <= 1) {
      prevButton.setDisabled(true);
    }
    if (page >= totalPages) {
      nextButton.setDisabled(true);
    }
    actionRow.addComponents(prevButton, nextButton);

    dbm.saveFile("keys", "incomeList", incomeList);

    return [returnEmbed, [actionRow]];
  }

  static async editIncomeMenu(income, charTag) {
    let incomeList = await dbm.loadFile("keys", "incomeList");
    let incomeValue = incomeList[income];
    if (incomeValue == undefined) {
      for (const incomeName in incomeList) {
        if (incomeName.toLowerCase() == income.toLowerCase()) {
          incomeValue = incomeList[incomeName];
          income = incomeName;
        }
      }
      if (incomeValue == undefined) {
        return "Income not found";
      }
    }
    let roles = incomeValue.roles;
    let rolesString = "";
    if (roles.length > 0) {
      rolesString = "<@&" + roles.join(">, <@&") + ">";
    }
    let delayString = "";
    if (incomeValue.delay == undefined || incomeValue.delay == "") {
      incomeValue.delay = "1D";
      delayString = "1 Day";
      dbm.saveFile("keys", "incomeList", incomeList);
    } else {
      let delayAmount = incomeValue.delay.match(/\d+/g);
      let delayUnit = incomeValue.delay.match(/[A-Za-z]+/g);
      delayString = "" + delayAmount;
      switch (delayUnit[0].toLowerCase()) {
        case "d":
          delayString += " Day";
          break;
        case "w":
          delayString += " Week";
          break;
        case "m":
          delayString += " Month";
          break;
        case "y":
          delayString += " Year";
          break;
      }
      if (delayAmount > 1) {
        delayString += "s";
      }
    }
    let returnEmbed = new EmbedBuilder()
      .setTitle("Income: " + income)
      //Description is name, emoji, roles, gold given, item given. Each should have a number coming before, starting at 0, enclosed as `[1] `. Codewise, this should be formatted on separate lines to be easy to read.
      .setDescription(
        "`[1] Name:         ` " + income + 
        //emoji below
        "\n`[2] Emoji:        ` " + incomeValue.emoji +
        "\n`[3] Roles:        ` " + rolesString + 
        "\n`[4] Gold Given:   ` " + incomeValue.goldGiven + 
        "\n`[5] Item Given:   ` " + incomeValue.itemGiven + 
        "\n`[6] Amount Given: ` " + incomeValue.itemAmount +
        "\n`[7] Income Delay: ` " + delayString
      );

    let userData = await dbm.loadFile("characters", charTag);
    if (!userData.editingFields) {
      userData.editingFields = {};
    }
    userData.editingFields["Income Edited"] = income;
    await dbm.saveFile("characters", charTag, userData);

    return returnEmbed;
  }

  static async editIncomeField(fieldNumber, charTag, newValue) {
    let userData = await dbm.loadFile("characters", charTag)
    let editingFields = userData.editingFields;
    let income = editingFields["Income Edited"];
    let incomeList = await dbm.loadFile("keys", "incomeList");
    let incomeValue = incomeList[income];
    let shopData = await dbm.loadCollection("shop");
    if (incomeValue == undefined) {
      return "Income not found";
    }
    switch (fieldNumber) {
      case 1:
        if (newValue == "DELETEFIELD") {
          delete incomeList[income];
          await dbm.saveFile("keys", "incomeList", incomeList);
          return "Income " + income + " deleted";
        }
        delete incomeList[income];
        income = newValue;
        break;
      case 2:
        if (newValue == "DELETEFIELD") {
          newValue = clientManager.getEmoji("Talent");
        }
        incomeValue.emoji = newValue;
        break;
      case 3:
        if (newValue == "DELETEFIELD") {
          incomeValue.roles = [];
          break;
        }
        //Find every series of numbers starting with <@& and ending with >, and add them to the roles array
        let roles = newValue.match(/<@&\d+>/g);
        if (roles == null) {
          return "No roles found";
        }
        let roleIDs = [];

        for (const role of roles) {
          roleIDs.push(role.substring(3, role.length - 1));
        }
        incomeValue.roles = roleIDs;
        break;
      case 4:
        if (newValue == "DELETEFIELD") {
          incomeValue.goldGiven = 0;
          break;
        }
        incomeValue.goldGiven = parseInt(newValue);
        if (isNaN(incomeValue.goldGiven)) {
          return "Gold must be a number";
        }
        break;
      case 5:
        if (newValue == "DELETEFIELD") {
          incomeValue.itemGiven = "";
          incomeValue.itemAmount = 0;
          break;
        }
        let newItemName = await shop.findItemName(newValue, shopData);
        if (newItemName == "ERROR") {
          return "Item not found";
        }
        incomeValue.itemGiven = newItemName;
        break;
      case 6:
        if (newValue == "DELETEFIELD") {
          incomeValue.itemAmount = 0;
          break;
        }
        incomeValue.itemAmount = parseInt(newValue);
        if (isNaN(incomeValue.itemAmount)) {
          return "Amount must be a number";
        }
        break;
      case 7:
        if (newValue == "DELETEFIELD") {
          incomeValue.delay = "1D";
          break;
        }
        incomeValue.delay = parseInt(newValue);
        //Options are [Number] [Unit], i.e. 1 d, 1 w, 1 m, 1 y, or 1 day, 1 week, 1 month, 1 year
        let delaySplit = newValue.split(" ");
        if (delaySplit.length != 2) {
          return "Invalid delay format- must be [Number] [Unit], i.e. 1 d, 1 w, 1 m, 1 y, or 1 day, 1 week, 1 month, 1 year";
        }
        let delayAmount = parseInt(delaySplit[0]);
        if (isNaN(delayAmount)) {
          return "Delay amount must be a number, and the number must be first. i.e. '1 Day' or '1 d' is acceptable, but 'daily' or 'd 1' is not.";
        }
        let delayUnit = delaySplit[1];
        let adjustedUnit = ""
        switch (delayUnit.toLowerCase()) {
          case "day":
          case "days":
          case "d":
            adjustedUnit = "D";
            break;
          case "week":
          case "weeks":
          case "w":
            adjustedUnit = "W";
            break;
          case "month":
          case "months":
          case "m":
            adjustedUnit = "M";
            break;
          case "year":
          case "years":
          case "y":
            adjustedUnit = "Y";
            break;
          default:
            return "Invalid delay unit- must be day/days/d, week/weeks/w, month/months/m, or year/years/y. The unit must be second, i.e. 1 day";
        }
        incomeValue.delay = delayAmount + adjustedUnit;
        break;
      default:
        return "Field not found";
    }
    incomeList[income] = incomeValue;
    await dbm.saveFile("keys", "incomeList", incomeList);

    return "Field " + fieldNumber + " changed to " + newValue;
  }
}

module.exports = Admin;