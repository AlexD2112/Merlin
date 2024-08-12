//Calls CHATGPT pope bot to generate a message

const { SlashCommandBuilder } = require('@discordjs/builders');
const chatGPT = require('../../chatGPT');
const dbm = require('../../database-manager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demetrios')
        .setDescription('Message Demetrios the Chronicler')
        .addStringOption((option) =>
            option.setName('message')
                .setDescription('Your message to Demetrios')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const message = interaction.options.getString('message');
        const userID = interaction.user.tag;
        const channelID = interaction.channelId;

        console.log(interaction.member.roles.cache);
        //Check if user has a certain role
        if (interaction.member.roles.cache.some(role => role.name === 'Oligarch')) {
            let demetrios = dbm.loadFile("gptMessages", "demetrios");
            let botSpoken = demetrios.quotas.userID;
            if (botSpoken == undefined) {
                botSpoken = 1;
            } else if (botSpoken >= 2) {
                await interaction.editReply("You can only speak to Demetrios twice for now!");
                return;
            } else {
                botSpoken++;
            }
            demetrios.quotas.userID = botSpoken;
            dbm.saveFile("gptMessages", "demetrios", demetrios);
        }

        let replyString = await chatGPT.demetrios(message, userID, channelID);
        //if embed, display embed, otherwise display string
        console.log(replyString);
        console.log(typeof (replyString));
        if (typeof (replyString) == 'string') {
            await interaction.editReply(replyString);
        } else {
            await interaction.editReply({ embeds: [replyString] });
        }
    },
};

