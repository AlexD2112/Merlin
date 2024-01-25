//Calls CHATGPT pope bot to generate a message

const { SlashCommandBuilder } = require('@discordjs/builders');
const chatGPT = require('../../chatGPT');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pope')
        .setDescription('Message the pope')
        .addStringOption((option) =>
            option.setName('message')
                .setDescription('Your message to the pope')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const message = interaction.options.getString('message');
        const userID = interaction.user.tag;

        let replyString = await chatGPT.pope(message, userID);
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

