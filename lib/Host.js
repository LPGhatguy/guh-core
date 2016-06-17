"use strict";

const Config = require("./Config");
const ArgBuilder = require("./ArgBuilder");
const defaultSchema = require("./defaultSchema");

class Host {
	constructor() {
		this.pipelineTypes = new Map();
		this.appliedPlugins = new Set();

		this.schema = defaultSchema();

		this.config = new Config(this.schema, {});
		this.argBuilder = new ArgBuilder(this.schema);
	}

	log(...args) {
		console.log(...args);

		return this;
	}

	error(...args) {
		console.error(...args);

		return this;
	}

	addPipelineType(name, pipeline) {
		this.pipelineTypes.set(name, pipeline);
	}

	applyPlugins(plugins) {
		for (const plugin of plugins) {
			if (!this.appliedPlugins.has(plugin)) {
				plugin(this);

				this.appliedPlugins.add(plugin);
			}
		}

		return this;
	}

	configure(config) {
		const wrapper = new Config(this.schema, config, this.config);

		const result = wrapper.validate();
		if (result !== true) {
			throw result;
		}

		this.config = wrapper;

		return this;
	}

	start() {
		const plugins = this.config.getValue("plugins")
			.map(v => {
				if (typeof v === "string") {
					return require(v);
				}

				return v;
			});

		this.applyPlugins(plugins);

		const thisPreset = this.config.getValue("preset");

		console.log("using preset", thisPreset);
	}
}

module.exports = Host;