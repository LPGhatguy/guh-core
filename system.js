"use strict";

const gutil = require("gulp-util");
const notifier = require("node-notifier");

const messages = {
	BuildStarted: (system, id) => {
		system.note(`Building ${ id }...`);
	},
	BuildCompleted: (system, id) => {
		system.success(`${ id } complete!`);
	},
	BuildFailed: (system, id, error) => {
		system.error(`Error building ${ id }:`, error);
	}
};

class System {
	constructor(config) {
		this.config = config;
		this.messages = messages;
	}

	message(...texts) {
		gutil.log(texts.filter(v => !!v).join("\n"));
	}

	error(title, body) {
		this.message(gutil.colors.red(title), body);

		if (this.config.notifyOnErrors) {
			notifier.notify({
				title: title,
				message: body
			});
		}
	}

	note(title, body) {
		this.message(gutil.colors.blue(title), body);
	}

	warning(title, body) {
		this.message(gutil.colors.yellow(title), body);
	}

	success(title, body) {
		this.message(gutil.colors.green(title), body);
	}

	event(event, ...args) {
		return this.messages[event](this, ...args);
	}
}

module.exports = System;