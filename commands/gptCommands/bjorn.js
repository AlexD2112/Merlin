//Calls CHATGPT pope bot to generate a message

const { SlashCommandBuilder } = require('@discordjs/builders');
const chatGPT = require('../../chatGPT');
const dbm = require('../../database-manager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bjorn')
        .setDescription('Message Bjorn Ketilsson, the Skald of Storms')
        .addStringOption((option) =>
            option.setName('message')
                .setDescription('Your message to Bjorn')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const message = interaction.options.getString('message');
        const numericID = interaction.user.id;
        const playerName = interaction.member.nickname;
        if (playerName == null) {
            playerName = interaction.user.username;
        }
        //make sure user is admin
        console.log(playerName);
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            await interaction.editReply("You must be an administrator to use this command!");
            return;
        }
        //Check if user has a certain role
        // if (interaction.member.roles.cache.some(role => role.name === 'Oligarch')) {
        //     let bjorn = await dbm.loadFile("gptMessages", "bjorn");
        //     console.log(bjorn);
        //     console.log(bjorn.quotas[userID]);
        //     let botSpoken = bjorn.quotas[userID];
        //     if (botSpoken == undefined) {
        //         botSpoken = 1;
        //     } else if (botSpoken >= 7) {
        //         await interaction.editReply("You can only speak to Bjorn seven times for now!");
        //         return;
        //     } else {
        //         botSpoken++;
        //     }
        //     bjorn.quotas[userID] = botSpoken;
        //     await dbm.saveFile("gptMessages", "bjorn", bjorn);
        // }

        let replyString = await chatGPT.bjorn(numericID, playerName, message);
        //if embed, display embed, otherwise display string
        if (typeof (replyString) == 'string') {
            await interaction.editReply(replyString);
        } else {
            await interaction.editReply({ embeds: [replyString] });
        }
    },
};

