const defaultValues = {
	browsersync: false,
	watch: false,
	notify: false,

	sourcemaps: true,
	minify: false,

	preset: "debug",
	out: "debug",

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
	}

	getValue(key) {
		const merger = mergers[key] || defaultMerger;
		let value;

		if (this.data[key] != null) {
			value = this.data[key];
		}

		if (this.parent && this.parent[key] != null) {
			value = merger(value, this.parent[key]);
		}

		if (defaultValues[key] != null) {
			value = merger(value, defaultValues[key]);
		}

		return value;
	}

	// TODO: isValid actually checking if valid
	isValid() {
		return true;
	}
}

module.exports = Config;