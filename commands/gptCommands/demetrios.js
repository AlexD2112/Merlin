//Calls CHATGPT pope bot to generate a message

const { SlashCommandBuilder } = require('@discordjs/builders');
const chatGPT = require('../../chatGPT');

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

