  const dbm = require('./database-manager'); // Importing the database manager
  const axios = require('axios');
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, createWebhook, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
  const keys = require('./keys.json');
  const shop = require('./shop');
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
      console.log(shires);
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
      console.log(user);

      console.log(parseInt(char.shireID) != 0);
      console.log(parseInt(char.shireID));
      console.log(char.shireID);
      console.log(char);
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
  }

  module.exports = Admin;