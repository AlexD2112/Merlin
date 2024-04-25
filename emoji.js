class emoji {
    static initEmoji(client, guildID) {
        this.client = client;
        this.guildID = guildID;
    }

    static getEmoji(emojiName) {
        const guild = this.client.guilds.cache.get(this.guildID);
        if (!guild) {
            console.log("Guild not found")
            return null;
        }
        const foundEmoji = guild.emojis.cache?.find(emoji => emoji.name.toLowerCase() === emojiName.toLowerCase());
        if (!foundEmoji) {
            console.log("Emoji not found")
            return null;
        }
        return `<:${foundEmoji.name}:${foundEmoji.id}>`;
    }
}

module.exports = emoji;