"use strict";

// Modules to automatically load
const modules = ["pipelines/browser", "pipelines/server", "pipelines/styles", "pipelines/static"];

const Loader = require("./dep-loader");
const gutil = require("gulp-util");

const objectHasOneOf = (map, names) => {
	for (const name of names) {
		if (map[name]) {
			return true;
		}
	}

	return false;
}

const valueTypes = {
	browsersync: "primitive",
	preset: "primtive",
	watch: "primitive",
	sourcemaps: "primitive",
	minify: "primitive",
	notify: "primitive",
	dry: "primitive",

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
	dry: false,

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
		const list = [];

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
		const name = core.args.preset || core.conf.preset;

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
		const unfiltered = core.conf.pipelines.slice();

		if (core.preset.pipelines) {
			unfiltered.push(...core.preset.pipelines);
		}

		// Patch pipelines with overrides in presets
		const byID = new Map();
		const unID = [];

		for (const pipeline of unfiltered) {
			if (pipeline.id != null) {
				const existing = byID.get(pipeline.id);

				if (existing) {
					Object.assign(existing, pipeline);
				} else {
					byID.set(pipeline.id, pipeline);
				}
			} else {
				unID.push(pipeline);
			}
		}

		const pipelines = unID.slice();

		for (const pair of byID) {
			const pipeline = pair[1];
			pipelines.push(pipeline);
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

		if (typeof pipeline.input !== "string" && !Array.isArray(pipeline.input)) {
			return new Error("Expected a string for the pipeline 'input' property.");
		}

		if (pipeline.output != null && typeof pipeline.output !== "string") {
			return new Error("Expected a string for the pipeline 'output' property if specified.");
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

		if (pipeline.watchPaths != null && !Array.isArray(pipeline.watchPaths)) {
			return new Error("Expected null or an array for the pipeline 'watchPaths' property.");
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
		const notify = require("gulp-notify");

		let notifier;

		if (!this.get("notify")) {
			notifier = (options, callback) => callback();
		}

		return notify({
			message: msg,
			onLast: true,
			notifier: notifier
		});
	},

	getCallback(pipeline) {
		const callback = pipeline.callback;
		const through = require("through2");

		return through.obj((file, enc, cb) => {
			if (callback) {
				callback(pipeline, file.path, file.contents.toString("utf8"));
			}

			cb(null, file);
		});
	},

	shouldPipelineOutput(pipeline, property) {
		if (property == null) {
			property = "output";
		}

		if (this.get("dry", pipeline)) {
			return false;
		}

		return pipeline[property] != null;
	}
};

module.exports = core;