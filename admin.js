  const dbm = require('./database-manager'); // Importing the database manager
  const axios = require('axios');
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, createWebhook, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
  const shop = require('./shop');
  const fs = require('node:fs');
  const path = require('node:path');
  const clientManager = require('./clientManager');

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
      resource = await shop.findItemName(resource);
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
        resourceCode: await shop.getItemIcon(resource),
        roleCode: roleID
      };
      shires[shireName] = shire;
      await dbm.saveFile("keys", "shires", shires);

      return "Shire " + shireName + " has been added with resource " + resource;
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
      console.log(partyChat);
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
      //income string is either a number, or a phrase such as 10 Wood or 10 Package Horse.
      //Must be used to create a field with a name, usually based on the role name, and than a map of various values, including goldGiven, itemGiven and itemAmount. Will also have a list of roles that have this income under "Roles"
      let income = {
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
        income.itemAmount = parseInt(incomeSplit[0]);
        income.itemGiven = incomeSplit[1];
        if (await shop.findItemName(income.itemGiven) == "ERROR") {
          return "Item not found";
        }
      }
      income.roles.push(roleID);
      incomeList[roleName] = income;

      await dbm.saveFile("keys", "incomeList", incomeList);

      return "Income added: " + incomeString + " income under name " + roleName + " <@&" + roleID + ">";
    }

    static async  allIncomes() {
      let returnEmbed = new EmbedBuilder();
      returnEmbed.setTitle("Incomes");
      let incomeList = await dbm.loadFile("keys", "incomeList");
      let incomeString = "";
      if (Object.keys(incomeList).length == 0) {
        return "No incomes found";
      }
      for (const income in incomeList) {
        let incomeValue = incomeList[income];
        let roles = incomeValue.roles;
        let rolesString = "";
        if (roles.length > 0) {
          rolesString = "<@&" + roles.join(">, <@&") + ">";
        }
        incomeString += "**" + income + "**: " + rolesString + "\n";
      }
      returnEmbed.setDescription(incomeString);
      return returnEmbed;
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
          "\n`[6] Amount Given: ` " + incomeValue.itemAmount
        );

      let userData = await dbm.loadCollection('characters');
      if (!userData[charTag].editingFields) {
        userData[charTag].editingFields = {};
      }
      userData[charTag].editingFields["Income Edited"] = income;
      await dbm.saveCollection('characters', userData);

      return returnEmbed;
    }

    static async editIncomeField(fieldNumber, charTag, newValue) {
      let userData = await dbm.loadCollection('characters');
      let editingFields = userData[charTag].editingFields;
      let income = editingFields["Income Edited"];
      let incomeList = await dbm.loadFile("keys", "incomeList");
      let incomeValue = incomeList[income];
      if (incomeValue == undefined) {
        return "Income not found";
      }
      switch (fieldNumber) {
        case 1:
          delete incomeList[income];
          income = newValue;
          break;
        case 2:
          incomeValue.emoji = newValue;
          break;
        case 3:
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
          incomeValue.goldGiven = parseInt(newValue);
          if (isNaN(incomeValue.goldGiven)) {
            return "Gold must be a number";
          }
          break;
        case 5:
          if (await shop.findItemName(newValue) == "ERROR") {
            return "Item not found";
          }
          incomeValue.itemGiven = await shop.findItemName(newValue);
          break;
        case 6:
          incomeValue.itemAmount = parseInt(newValue);
          if (isNaN(incomeValue.itemAmount)) {
            return "Amount must be a number";
          }
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