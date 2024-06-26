class clientManager {
    static getEmoji(emojiName) {
        const bot = require('./bot');
        //Remove spaces
        emojiName = emojiName.replace(/\s/g, '');
        const client = bot.getClient();
        const guildID = bot.getGuildID();
        if (!client) {
            console.log("Client not found")
            return null;
        }
        const guild = client.guilds.cache.get(guildID);
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
        const bot = require('./bot');
        const client = bot.getClient();
        const guildID = bot.getGuildID();
        const guild = client.guilds.cache.get(guildID);
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

    static async deleteAllForums() {
        const bot = require('./bot');
        const dbm = require('./database-manager');
        const client = bot.getClient();
        const guildID = bot.getGuildID();
        const guild = client.guilds.cache.get(guildID);
        //Delete all forums under the category id 1244686293082964018 besides 1244706946255421531
        const category = guild.channels.cache.get('1244686293082964018');
        if (!category) {
            console.log("Category not found")
            return;
        }
        //CategoryChannel

        //CategoryChannel#children is no longer a Collection of channels the category contains. It is now a manager (CategoryChannelChildManager). This also means CategoryChannel#createChannel() has been moved to the CategoryChannelChildManager.
        //#
        //Channel
        category.children.cache.forEach(async channel => {
            if (channel.id !== '1244706946255421531') {
                try {
                    await channel.delete();
                } catch (error) {
                    console.error(`Failed to delete channel ${channel.id}:`, error);
                }
            }
        });
    }

    static async createHouseGeneralChat() {
        const bot = require('./bot');
        const dbm = require('./database-manager');
        const { ChannelType, PermissionsBitField } = require('discord.js');
        const client = bot.getClient();
        const guildID = bot.getGuildID();
        const guild = client.guilds.cache.get(guildID);
        if (!guild) {
            console.log("Guild not found")
            return;
        }
        const houses = await dbm.loadFile('keys', 'houses');
        if (!houses) {
            console.log("Houses not found")
            return;
        }
        //Find the category with ID 1244686293082964018
        const category = guild.channels.cache.get('1244686293082964018');
        if (!category) {
            console.log("Category not found")
            return;
        }
        //Create a general chat for each house, which is a thread in the already existing forum in the category

        for (const house in houses) {
            if (houses.hasOwnProperty(house)) {
                const houseData = houses[house];
                const forumID = houseData.forumID;
                const forum = guild.channels.cache.get(forumID);
                if (!forum) {
                    console.log("Forum not found")
                    return;
                }
                const generalChat = await forum.threads.create({
                    name: `The ${house} House General Chat`,
                    message: 'https://cdn.discordapp.com/attachments/1244760416354172969/1244760417570652219/Screenshot_2024-04-22_at_1.21.10_PM.png?ex=665648fa&is=6654f77a&hm=6fe9d49c623e98369bbe785d7cde07f4abb325228906f76787d84065b0a87a38&',
                    autoArchiveDuration: 60,
                });
            }
        }

        await dbm.saveFile('keys', 'houses', houses);
    }
    
    static async createHouseForums() {
        const bot = require('./bot');
        const dbm = require('./database-manager');
        const { ChannelType, PermissionsBitField } = require('discord.js');
        const client = bot.getClient();
        const guildID = bot.getGuildID();
        const guild = client.guilds.cache.get(guildID);
        if (!guild) {
            console.log("Guild not found")
            return;
        }
        const houses = await dbm.loadFile('keys', 'houses');
        if (!houses) {
            console.log("Houses not found")
            return;
        }
        //Find the category with ID 1244686293082964018
        const category = guild.channels.cache.get('1244686293082964018');
        if (!category) {
            console.log("Category not found")
            return;
        }
        //Create a forum for each house
        for (const house in houses) {
            if (houses.hasOwnProperty(house)) {
                const houseData = houses[house];
                const forumName = houseData.name;
                const roleCode = houseData.roleCode;
                const role = guild.roles.cache.get(roleCode);
                //Check if the forum already exists, if it does skip to the next house after making sure the forumID is saved in the database
                if (guild.channels.cache.find(channel => channel.name.toLowerCase() === forumName.toLowerCase())) {
                    if (!houseData.forumID) {
                        const forum = guild.channels.cache.find(channel => channel.name.toLowerCase() === forumName.toLowerCase());
                        houseData.forumID = forum.id;
                    }
                    continue;
                }

                //Get the emoji for the house. Cannot use getEmoji because that returns what you would send as a string, not the emoji object
                const emoji = guild.emojis.cache.find(emoji => emoji.name.toLowerCase() === forumName.toLowerCase());
                console.log(emoji);
                const forum = await guild.channels.create({
                    name: forumName,
                    type: ChannelType.GuildForum,
                    parent: category,
                    defaultReactionEmoji: emoji.id,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone,
                            deny: PermissionsBitField.Flags.ViewChannel,
                        },
                        {
                            id: role,
                            allow: PermissionsBitField.Flags.ViewChannel,
                        },
                    ],
                });
                houseData.forumID = forum.id;

                //Copy the available tags from 1244706946255421531
                const tags = guild.channels.cache.get('1244706946255421531').availableTags;
                await forum.setAvailableTags(tags);
                let announcementTag = tags.find(tag => tag.name === 'Announcement');
                let marketTag = tags.find(tag => tag.name === 'Trade');

                //Add post guidelines to each forum (channel topic)
                await forum.setTopic('The ' + house + ' House Forum');

                //Create two threads in each forum, one called "The X House Announcements" and one called "The X House Market", give the first one the Announcement tag and the second one the Market tag
                const marketThread = await forum.threads.create({
                    name: `The ${house} House Market`,
                    message: 'https://cdn.discordapp.com/attachments/1244710376554365019/1244710378168909895/Screenshot_2024-05-27_at_8.52.52_PM.png?ex=66561a5f&is=6654c8df&hm=f2ead3d481972f1c4de531ad959bdcbdea86c1c3bb0512252c461753561436ee&',
                    autoArchiveDuration: 60,
                    tags: [marketTag.id],
                    tag: marketTag.id,
                });
                const announcementThread = await forum.threads.create({
                    name: `The ${house} House Announcements`,
                    message: 'https://cdn.discordapp.com/attachments/1244708580582625514/1244708581572350002/Screenshot_2024-05-26_at_12.08.12_AM.png?ex=665618b3&is=6654c733&hm=1317e4be3098fd85b4d0d191cf3477e62be93b1aa07fe019639c8d672479a07a&',
                    autoArchiveDuration: 60,
                    tags: [announcementTag.id],
                    tag: announcementTag.id,
                });
                //Pin the announcement thread
                await announcementThread.pin();
            }
        }

        await dbm.saveFile('keys', 'houses', houses);
    }
}

module.exports = clientManager;