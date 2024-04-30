const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const dbm = require('./database-manager');

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

let commandList = {};

//Load commandlist from commandlist.json
if (fs.existsSync('commandList.json')) {
	commandList = JSON.parse(fs.readFileSync('commandList.json'));
}

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		//Add this command to the list of commands with fields "name", "description" and "help"
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
			// Update commandList with the command's data, preserving existing "help" if available
			const cmdData = command.data.toJSON();
			if (!commandList[cmdData.name]) {
				commandList[cmdData.name] = {
					description: cmdData.description,
					options: {},
					help: "Further help info not added"  // Start with an empty help section
				};
				if (cmdData.options) {
					for (const option of cmdData.options) {
						commandList[cmdData.name].options[option.name] =  option.description;
					}
				}
			} else {
				commandList[cmdData.name].description = cmdData.description;
				if (cmdData.options) {
					commandList[cmdData.name].options = {};
					for (const option of cmdData.options) {
						commandList[cmdData.name].options[option.name] = option.description;
					}
				}
			}
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

console.log(commandList);
dbm.saveFile('keys', 'commandList', commandList, (err, result) => {
    if (err) {
        console.error('Failed to save command list:', err);
    } else {
        console.log('Command list saved successfully:', result);
    }
});

//Also save commandList to a local json
fs.writeFileSync('commandList.json', JSON.stringify(commandList, null, 2));

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		console.log(clientId, guildId);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	
})();