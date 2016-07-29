"use strict";

const gutil = require("gulp-util");
const notifier = require("node-notifier");

class System {
	constructor(config) {
		this.config = config;
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
		this.message(gutil.colors.yellow(title), body);
	}

	success(title, body) {
		this.message(gutil.colors.green(title), body);
	}
}

module.exports = System;