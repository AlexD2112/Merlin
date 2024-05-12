const {clientId, guildId, token} = require('./config.json');
const Discord = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const interactionHandler = require('./interaction-handler')
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const char = require('./char');
const clientManager = require('./clientManager');
const dbm = require('./database-manager');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
});

//sets up usage of commands from command folder
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
	//client.user.setAvatar('https://cdn.discordapp.com/attachments/1165739006923919431/1232019050205417624/Mas_LOGO_copy.png?ex=662a91a7&is=66294027&hm=2b4f0dfdf37864b1dee3ac2967f0cac1227a49cfaa9c8253d045e1672c383061&');
});

//message handler
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Check for =say, if found send the message coming after =say and a space using char.say. If returned message is not Message sent! then send the returned message.
    if (message.content.startsWith('=say')) {
		const msg = message.content.slice(4);
		let reply = await char.say(message.author.tag, msg, message.channel);
		if (reply != "Message sent!") {
			message.channel.send(reply);
		}

		//Delete message
		message.delete();
    }
});

//interaction handler
client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand()) {
		const command = client.commands.get(interaction.commandName);
		if (!command) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error("THIS IS THE ERROR: " + error);
			console.error(error);
			console.error("BELOW IS THE REST OF THINGS");
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	} else {
		interactionHandler.handle(interaction);
	}
});

client.on('guildMemberAdd', member => {
    // Assuming 'newchar' is a function you've defined to handle the new character creation
	let memberID = member.id;
	let memberName = member.user.tag;
	let memberBio = "A new citizen of Massalia!";
	char.newChar(memberName, memberName, memberBio, memberID);
});

client.on('guildMemberRemove', member => {
	let memberID = member.id;
	console.log("Member ID: " + memberID);
});

//For commands that need to be run daily, and daily logging of infos and such
function botMidnightLoop() {
	var now = new Date();
	console.log(now);

	var msToMidnight = (24 * 60 * 60 * 1000) 
		- ((now.getUTCHours()) * 60 * 60 * 1000) 
		- ((now.getUTCMinutes()) * 60 * 1000) 
		- ((now.getUTCSeconds()) * 1000)
		- ((now.getUTCMilliseconds()));
	setTimeout(function() {
		char.resetIncomeCD();
		dbm.logData();
		initClientManager();
		botMidnightLoop();
	}, msToMidnight);
	console.log(msToMidnight);
}
botMidnightLoop();

function initClientManager(client, guildID) {
	clientManager.initClientManager(client, guildID);
}
initClientManager(client, guildId);

client.login(token);

function getClient() {
	return client;
}

function getGuildID() {
	return guildId;
}

module.exports = { getClient, getGuildID };

// process.on('uncaughtException', function (err){ 
// 	const channelID = "1163130565910868159";
// 	console.log('Caught exception: ' + err);
// 	try {
// 		client.channels.fetch(channelID).then(channel => {
// 			channel.send("Bot has faced a major error! Ping Alex repeatedly with messages of shame until he fixes it. Certain commands may not function.");
// 		});
// 	} catch (error) {
// 		console.log(error);
// 	}
// });