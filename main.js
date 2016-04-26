"use strict";

const pack = require("./package.json");

const core = require("./core");
require("./args")(process.argv);

const gulp = require("gulp");
const gutil = require("gulp-util");

const browserSync = require("browser-sync").create();
core.browserSync = browserSync;

const defaultTask = () => {
	console.log(`Building ${ core.projectName } v${ core.projectVersion }`);
	console.log(`Using guh-core ${ pack.version }`);
	console.log(`Loading dependencies`);

	for (const module of core.modules) {
		require("./" + module);
	}

	if (core.get("browsersync")) {
		let bsSettings = core.preset.browsersync != null ? core.preset.browsersync : core.conf.browsersync;

		if (bsSettings) {
			browserSync.init(bsSettings);
		} else {
			gutil.log(gutil.colors.yellow("In order to use, Browsersync, add a 'browsersync' entry in your guh config!"));
		}
	}

	return gulp.start(core.buildTasks);
};

module.exports = defaultTask;