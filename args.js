"use strict";

const core = require("./core");

const argTypes = {
	watch: "boolean",
	sourcemaps: "boolean",
	minify: "boolean",
	notify: "boolean",
	browsersync: "boolean",
	debug: "boolean",
	once: "boolean",
	dry: "boolean",

	white: "set",
	gray: "set",
	black: "set",

	preset: "string",
	out: "string"
};

const aliases = {
	"only": "white",
	"except": "black"
};

const toBoolean = (v) => {
	v = v.toLowerCase();

	if (v === "true" || v === "yes") {
		return true;
	}

	if (v === "false" || v === "no") {
		return false;
	}

	return true;
};

module.exports = (sourceArgs) => {
	// pull the process arguments we care about out
	let cmdArgs = [];

	for (let i = 0; i < sourceArgs.length; i++) {
		const arg = sourceArgs[i];

		if (arg.startsWith("--")) {
			cmdArgs = sourceArgs.slice(i);
			break;
		}
	}

	// black list: don't build these modules
	// white list: only build these modules
	// gray list: build these modules despite defaults
	let args = core.args = {
		white: null,
		gray: null,
		black: null,

		set once(value) {
			if (value) {
				this.browsersync = false;
				this.watch = false;
			}
		}
	};

	for (let arg of cmdArgs) {
		if (!arg.startsWith("--")) {
			console.error(`Unknown command line option '${ arg }'`);
			process.exit(1);
		}

		// Normalize and alias arguments
		arg = arg.slice(2).toLowerCase();
		arg = aliases[arg] || arg;

		let setter = arg.match(/^([^=]+)=(.+)/);

		// Flag, not a setter!
		if (!setter) {
			if (argTypes[arg]) {
				if (argTypes[arg] === "boolean") {
					args[arg] = true;
					continue;
				}

				console.warn(`Command line option '${ arg }' is used like a flag, but is not a flag. Skipping...`);
				continue;
			} else {
				console.error(`Unknown command line option '${ arg }'`);
				process.exit(1);
			}
		}

		let key = setter[1];
		let value = setter[2];

		key = aliases[key] || key;

		if (argTypes[key] === "set") {
			if (args[key] == null) {
				args[key] = {};
			}

			let list = value.split(",");
			for (let e of list) {
				args[key][e.toLowerCase()] = true;
			}

			continue;
		}

		if (argTypes[key] === "boolean") {
			args[key] = toBoolean(value);
			continue;
		}

		if (argTypes[key] === "string") {
			args[key] = value;
			continue;
		}
	}
};