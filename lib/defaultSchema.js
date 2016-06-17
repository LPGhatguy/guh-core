"use strict";

const truthyStrings = new Set(["yes", "y", "true"]);
const parseBoolean = (key, value) => {
	value = value.toLowerCase();

	if (value.length === 0) {
		return true;
	}

	if (truthyStrings.has(value)) {
		return true;
	}

	return false;
};

const parseStringList = (key, value) => value.split(",");

const arrayMerger = (a, b) => {
	if (a != null && b != null) {
		return [...b, ...a];
	} else if (a != null) {
		return a;
	} else {
		return b;
	}
};

const defaultSchema = () => ({
	// "use-browsersync": {
	// 	default: false,
	// 	type: "boolean"
	// },
	"use-watch": {
		default: false,
		parser: parseBoolean
	},
	// "use-notify": {
	// 	default: false,
	// 	type: "boolean"
	// },

	sourcemaps: {
		default: true,
		parser: parseBoolean
	},
	minify: {
		default: null,
		parser: parseBoolean
	},

	preset: {
		default: "debug"
	},
	outdir: {
		default: "debug"
	},

	only: {
		default: null,
		parser: parseStringList,
		merger: arrayMerger
	},
	except: {
		default: null,
		parser: parseStringList,
		merger: arrayMerger
	},

	plugins: {
		default: [],
		parser: parseStringList,
		merger: arrayMerger
	},
	pipelines: {
		default: [],
		merger: arrayMerger
	}
});

module.exports = defaultSchema;