const pack = require("./package.json");
const Config = require("./lib/Config");
const Loader = require("./lib/Loader");
const Pipeline = require("./lib/Pipeline");

module.exports = {
	Config: Config,
	Loader: Loader,
	Pipeline: Pipeline,

	version: pack.version,

	log(...args) {
		console.log(...args);
	},

	error(...args) {
		console.error(...args);
	},

	plugins(plugins) {
		plugins.forEach(f => f(this));
	}
};