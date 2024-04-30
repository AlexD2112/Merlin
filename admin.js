  const dbm = require('./database-manager'); // Importing the database manager
  const axios = require('axios');
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, createWebhook, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
  const keys = require('./keys.json');
  const shop = require('./shop');
  const fs = require('node:fs');
  const path = require('node:path');
  const emoji = require('./emoji');
  class Admin {
    static async initShireSelect(channel) {
      let shires = await dbm.loadFile("keys", "shires");
      //get shires from keys, where it is an array
      let shireNames = Object.keys(shires).map(key => "- " + emoji.getEmoji("Polis") + " " + shires[key].name  + " - " + shires[key].resource + " " + shires[key].resourceCode).join("\n");
      //Send an embed with the title Massalia and the text Capital: Massalia \n The city has the following colonies \n and than a list of the colonies. There will also be a menu you can click to choose which colony. The colonies will come out of the shires.json file.
      let embed = new EmbedBuilder()
        .setDescription("# " + emoji.getEmoji("Massalia") + " The League of Massalia" +
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
      if (parseInt(char.shireID) != 0) {
        await interaction.reply({ content: "You are already a member of a city! You cannot switch cities", ephemeral: true });
        return;
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

      await user.roles.add(role);
      char.shireID = selectedShire;
      await dbm.saveFile("characters", userTag, char);


      await interaction.reply({ 
        content: "You have selected " + shire.name + " with resource " + shire.resource, 
        ephemeral: true 
      });
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
              //put 
              //Check if the command is an admin command
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
  }

  module.exports = Admin;