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
        const message = interaction.options.getString('message');
        const userTag = interaction.user.tag;
        const userID = interaction.user.id;
        let replyString = "The pope is sleeping right now. Please try again later.";
        //if embed, display embed, otherwise display string
        if (typeof (replyString) == 'string') {
            await interaction.reply(replyString);
        } else {
            await interaction.reply({ embeds: [replyString] });
        }
    },
};

