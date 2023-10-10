const { SlashCommandBuilder } = require('discord.js');
var thefuckingdata;
var thefuckingstring;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('findneareststoponroute')
		.setDescription('Replies with Pong!')
		.addStringOption(option =>
		option.setName('busid')
			.setDescription('The bus ID')
			.setRequired(true))
		.addStringOption(option =>
		option.setName('stopid')
			.setDescription('The stop ID')
			.setRequired(true)),
	execute(interaction) {
		const busID = interaction.options.getString('busid');
		const stopID = interaction.options.getString('stopid');
		(async () => {
			console.log(await getPrediction(Number(busID), Number(stopID)));
			return interaction.reply(thefuckingstring);
		})()
	},
};

async function getPrediction(busID, stopID) {
	busGet = await fetch(
	   `http://ctabustracker.com/bustime/api/v3/getpredictions?key=36g2hBZeY4H5xNTVu9EeGXJkF&rt=${busID}&stpid=${stopID}&format=json`
	).then(response => {
		console.log("RESPONSE")
		console.log(response)
		return response.json()
	}).then(data => {
		console.log("DATA")
		console.log(data)
		thefuckingdata = data;
		thefuckingstring = Object.values(Object.values(thefuckingdata)[0])[0][0]["prdtm"];
		//return data.json()
	}).catch(error => {
		console.log("ERROR")
		console.log(error);
	});
};