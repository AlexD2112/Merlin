//Calls CHATGPT pope bot to generate a message

const { SlashCommandBuilder } = require('@discordjs/builders');
const chatGPT = require('../../chatGPT');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('luis')
        .setDescription('Message King Luis of Aquitane')
        .addStringOption((option) =>
            option.setName('message')
                .setDescription('Your message to luis')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const message = interaction.options.getString('message');
        const userID = interaction.user.tag;

        let replyString = await chatGPT.luis(message, userID);
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

