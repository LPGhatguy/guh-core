"use strict";

const Config = require("./Config");
const ArgBuilder = require("./ArgBuilder");

const getSchema = () => ({
	"use-browsersync": {
		default: false,
		type: "boolean"
	}
});

class Host {
	constructor() {
		this.configuration = new Config({});
		this.schema = getSchema();

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

	plugins(plugins) {
		for (const plugin of plugins) {
			plugin(this);
		}

		return this;
	}

	configure(config) {
		const wrapper = new Config(config, this.configuration);

		const result = wrapper.validate();
		if (result !== true) {
			throw result;
		}

		this.configuration = wrapper;

		return this;
	}
}

module.exports = Host;