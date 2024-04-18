const dbm = require('./database-manager'); // Importing the database manager
const axios = require('axios');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, createWebhook } = require('discord.js');

class char {
  static async initShireSelect(channelID) {
    //Get shire list from shires.json
    let shires = require('./shires.json');
    //Send an embed with the title Massalia and the text Capital: Massalia \n The city has the following colonies \n and than a list of the colonies. There will also be a menu you can click to choose which colony. The colonies will come out of the shires.json file.
    let embed = new EmbedBuilder()
      .setTitle("<:massalia:1229928006005559326> Massalia")
      .setDescription("Capital: :star: Massalia")
      .addField("Cities", shires.Massalia.join("\n"))
      .setFooter({ text: 'Select a city below to join', iconURL: 'https://images-ext-1.discordapp.net/external/zNN-s-f41tPGzag5FxItzlLKuLKnAXiirTy3ke0nG-k/https/cdn.discordapp.com/emojis/620697454928723971.gif' });
    let actionRow = new ActionRowBuilder();
    //Add a button for each city in the shires.json file
    Object.keys(shires).forEach(shire => {
      actionRow.addComponent(new ButtonBuilder()
        .setCustomId(shire)
        .setLabel(shire)
        .setStyle(ButtonStyle.PRIMARY));
    });
  }
}

module.exports = char;