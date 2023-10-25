const {clientId, GuildId, token} = require('./config.json');
const Discord = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const modalHandler = require('./modal-handler')
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const char = require('./char');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
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
	//client.user.setAvatar('https://images-ext-1.discordapp.net/external/xNBNeaCotnpdWVuj-r0wO8X87d34DAH4X58Bqs--vyQ/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1148265132791713802/a2637c14d39ff85a1ed89a6fa888ebbc.png');
});

//slash command handler
client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand()) {
		const command = client.commands.get(interaction.commandName);

		if (!command) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	}
	if (interaction.isModalSubmit()) {
		if (interaction.customId === 'additemmodal') {
			modalHandler.addItem(interaction);
			console.log("Submitted New Item")
		}
		if (interaction.customId === 'newcharmodal') {
			modalHandler.newChar(interaction);
			console.log("Submitted New Character")
		}
		if (interaction.customId === 'addusecasemodel') {
			modalHandler.addUseCase(interaction);
			console.log("Submitted New Use Case")
		}
		if (interaction.customId === 'shoplayoutmodal') {
			modalHandler.shopLayout(interaction);
			console.log("Submitted New Shop Layout")
		}
	}
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
		botMidnightLoop;
	}, msToMidnight);
	console.log(msToMidnight);
}
botMidnightLoop();

client.login(token);