"use strict";

const defaultValues = {
	"use-browsersync": false,
	"use-watch": false,
	"use-notify": false,

	sourcemaps: true,
	minify: false,

	preset: "debug",
	outdir: "debug",

	only: null,
	except: null
};

const defaultMerger = (a, b) => b;
const arrayMerger = (a, b) => [...a, ...b];

const mergers = {
	only: arrayMerger,
	except: arrayMerger
};

class Config {
	constructor(data, parent) {
		this.data = data;
		this.parent = parent;

		this.defaultValues = Object.assign({}, defaultValues);
		this.defaultMerger = defaultMerger;
		this.mergers = Object.assign({}, mergers);
	}

	getValue(key) {
		const merger = this.mergers[key] || this.defaultMerger;
		let value;

		if (this.data[key] != null) {
			value = this.data[key];
		}

		const parentValue = this.parent.getValue(key);
		if (parentValue != null) {
			value = merger(value, parentValue);
		}

		if (defaultValues[key] != null) {
			value = merger(value, this.defaultValues[key]);
		}

		return value;
	}

	// TODO: actually check if valid
	validate() {
		return true;
	}
}

module.exports = Config;