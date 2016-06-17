"use strict";

const pack = require("./package.json");

module.exports = {
	Config: require("./lib/Config"),
	Loader: require("./lib/Loader"),
	Pipeline: require("./lib/Pipeline"),
	ArgBuilder: require("./lib/ArgBuilder"),
	Host: require("./lib/Host"),

	version: pack.version
};