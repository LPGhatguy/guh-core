"use strict";

// Modules to automatically load
const modules = ["pipelines/browser", "pipelines/server", "pipelines/styles", "pipelines/static"];

const Loader = require("./dep-loader");
const gutil = require("gulp-util");

const getValue = (name, base, core) => {
	// console.trace("deprecated");
	return core.getPrimitive(name, base);
};

const valueTypes = {
	browsersync: "primitive",
	preset: "primtive",
	watch: "primitive",
	sourcemaps: "primitive",
	minify: "primitive",
	notify: "primitive",

	preset: "primitive",
	out: "primitive",

	white: "list",
	gray: "list",
	black: "list"
};

const defaultValues = {
	browsersync: false,
	watch: false,
	sourcemaps: true,
	minify: false,
	notify: false,

	preset: "debug",
	out: "debug",

	white: null,
	gray: null,
	black: null
};

const core = {
	projectName: "",
	projectVersion: "0.0.0",

	version: "0.0.0",

	modules: modules,
	buildTasks: [],
	browserSync: null,

	conf: null,
	args: {},

	init(pack, conf) {
		this.conf = conf;

		this.projectName = pack.name;
		this.projectVersion = pack.version;

		let version = "UNKNOWN";
		if (pack.guh) {
			if (pack.guh.version) {
				version = pack.guh.version;
			}
		} else if (pack.name === "guh") {
			version = pack.version;
		}

		this.version = version;
	},

	get(key, pipeline) {
		if (valueTypes[key] === "primitive") {
			return core.getPrimitive(key, defaultValues[key], pipeline);
		} else if (valueTypes[key] === "list") {
			return core.getList(key, defaultValues[key], pipeline);
		}

		throw new Error(`Invalid configuration entry '${ key }'!`);
	},

	getPrimitive(name, fallback, pipeline) {
		if (core.args[name] != null) {
			return core.args[name];
		}

		if (core.preset[name] != null) {
			return core.preset[name];
		}

		if (core.conf[name] != null) {
			return core.conf[name];
		}

		if (pipeline && pipeline[name] != null) {
			return pipeline[name];
		}

		return fallback;
	},

	getList(name, pipeline) {
		let list = [];

		if (core.args[name] != null) {
			list.push(...core.args[name]);
		}

		if (core.preset[name] != null) {
			list.push(...core.preset[name]);
		}

		if (core.conf[name] != null) {
			list.push(...core.conf[name]);
		}

		if (pipeline && pipeline[name] != null) {
			list.push(...pipeline[name]);
		}

		return list;
	},

	get preset() {
		let name = core.args.preset || core.conf.preset;

		if (!core.conf.presets[name]) {
			console.error(`Couldn't find preset '${name}'!`);
			process.exit(1);
			return;
		}

		return core.conf.presets[name];
	},

	getLoader() {
		return new Loader();
	},

	getName(pipeline) {
		if (pipeline.name) {
			return pipeline.name;
		}

		return pipeline.type.charAt(0).toUpperCase() + pipeline.type.slice(1);
	},

	getPipelines(type) {
		let unfiltered = core.conf.pipelines.slice();

		if (core.preset.pipelines) {
			unfiltered.push(...core.preset.pipelines);
		}

		// Patch pipelines with overrides in presets
		let byID = new Map();
		let unID = [];

		for (let pipeline of unfiltered) {
			if (pipeline.id != null) {
				let existing = byID.get(pipeline.id);

				if (existing) {
					Object.assign(existing, pipeline);
				} else {
					byID.set(pipeline.id, pipeline);
				}
			} else {
				unID.push(pipeline);
			}
		}

		let pipelines = unID.slice();

		for (let pair of byID) {
			let pipeline = pair[1];
			pipelines.push(pipeline);
		}

		const objectHasOneOf = (map, names) => {
			for (let name of names) {
				if (map[name]) {
					return true;
				}
			}

			return false;
		}

		// Filter presets based on names and tags
		return pipelines.filter(pipeline => {
			if (type != null && pipeline.type !== type) {
				return false;
			}

			let names = [pipeline.id, pipeline.name, pipeline.type]
				.filter(v => v);

			if (pipeline.tags) {
				names.push(...pipeline.tags);
			}

			names = names.map(v => v.toLowerCase());

			if (core.args.black && objectHasOneOf(core.args.black, names)) {
				return false;
			}

			if (core.args.white && !objectHasOneOf(core.args.white, names)) {
				return false;
			}

			if (pipeline.disabled) {
				if (core.args.gray) {
					if (!objectHasOneOf(core.args.gray, names)) {
						return false;
					}
				} else {
					return false;
				}
			}

			return true;
		});
	},

	verifyPipeline(pipeline) {
		if (typeof pipeline !== "object") {
			return new Error("Expected a pipeline object.");
		}

		if (typeof pipeline.input !== "string") {
			return new Error("Expected a string for the pipeline 'input' property.");
		}

		if (typeof pipeline.output !== "string") {
			return new Error("Expected a string for the pipeline 'output' property.");
		}

		if (pipeline.name != null && typeof pipeline.name !== "string") {
			return new Error("Expected null or a string for the pipeline 'name' property.");
		}

		if (pipeline.config != null && typeof pipeline.config !== "object") {
			return new Error("Expected null or an object for the pipeline 'config' property.");
		}

		if (pipeline.tags != null && !Array.isArray(pipeline.tags)) {
			return new Error("Expected null or an array for the pipeline 'tags' property.");
		}

		return true;
	},

	error(err) {
		gutil.log(gutil.colors.red("Error: " + err.toString()));

		process.exit(1);
	},

	getErrorHandler(name) {
		return function(err) {
			if (core.notify) {
				require("gulp-notify").onError("Error: <%= error.message %>")(err);
			} else {
				gutil.log(gutil.colors.red(name + ": Build error!"));
				console.log(err.message);

				if (err.stack && core.conf.guhDebug) {
					gutil.log(gutil.colors.yellow(name + ": Stack trace:"));
					console.log(err.stack);
				}
			}

			this.emit("end");
		};
	},

	getNotify(msg) {
		let notify = require("gulp-notify");

		let notifier;

		if (!this.get("notify")) {
			notifier = (options, callback) => callback();
		}

		return notify({
			message: msg,
			onLast: true,
			notifier: notifier
		});
	}
};

module.exports = core;