"use strict";

const pack = require("./package.json");
const System = require("./system");

const gulp = require("gulp");
const merge = require("merge-stream");

function fillConfig(config) {
	if (!config) {
		config = {};
	}

	if (!config.lanes) {
		config.lanes = [];
	}

	if (!config.pack) {
		config.pack = {
			name: "UNKNOWN",
			version: "0.0.0"
		};
	}

	if (config.notifyOnErrors == null) {
		config.notifyOnErrors = true;
	}
}

function getLaneArguments(config, lane) {
	return {
		id: lane.id,
		input: lane.input,
		output: lane.output,
		options: lane.options || {}
	};
}

function introText(config) {
	const system = new System(config);

	system.message(`Building ${ config.pack.name } v${ config.pack.version }`);
	system.message(`Using guh-core ${ pack.version }`);
}

function guh(config) {
	fillConfig(config);
	introText(config);

	const stream = merge();

	for (const lane of config.lanes) {
		const args = getLaneArguments(config, lane);
		const laneStream = lane.type(new System(config), args);
		stream.add(laneStream);
	}

	return stream;
}

guh.watch = function watch(config) {
	fillConfig(config);
	introText(config);

	for (const lane of config.lanes) {
		const args = getLaneArguments(config, lane);

		if (lane.watch) {
			gulp.watch(lane.watch, () => lane.type(new System(config), args));
		}
	}
};

module.exports = guh;