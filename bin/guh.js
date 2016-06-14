#!/usr/bin/env node
"use strict";

const aliases = {
	"h": "help",
	"-h": "help",
	"/h": "help",

	"v": "version",
	"-v": "version",

	"b": "build"
};

const commandNames = ["build", "help", "version"];
const commands = {};

for (const command of commandNames) {
	commands[command] = require(`./guh-${ command }`);
	commands[command].name = command;
}

function main(args) {
	let command = args[0];

	if (command == null) {
		command = "help";
	}

	if (aliases.hasOwnProperty(command)) {
		command = aliases[command];
	}

	if (commands.hasOwnProperty(command)) {
		commands[command].run(args, commands);
	} else {
		console.log(`Unknown command "${ command }", try "guh help"`);
	}
}

main(process.argv.slice(2));