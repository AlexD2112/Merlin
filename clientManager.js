class clientManager {
    static initClientManager(client, guildID) {
        this.client = client;
        this.guildID = guildID;
    }

    static getEmoji(emojiName) {
        //Remove spaces
        emojiName = emojiName.replace(/\s/g, '');
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

    static async getUser(userID) {
        const guild = await this.client.guilds.cache.get(this.guildID);
        if (!guild) {
            console.log("Guild not found")
            return null;
        }
        const foundUser = await guild.members.fetch(userID);
        if (!foundUser) {
            console.log("User not found")
            return null;
        }
        return foundUser;
    }
    
}

module.exports = clientManager;