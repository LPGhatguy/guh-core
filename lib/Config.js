"use strict";

const defaultMerger = (a, b) => b;

class Config {
	constructor(schema, data, parent) {
		this.schema = schema;
		this.data = data;
		this.parent = parent;

		this.defaultMerger = defaultMerger;
	}

	getValue(key) {
		const meta = this.schema[key] || {};
		const merger = meta.merger || this.defaultMerger;
		let value;

		if (!this.parent && meta.default != null) {
			value = meta.default;
		}

		const parentValue = this.parent && this.parent.getValue(key);
		if (parentValue != null) {
			value = merger(value, parentValue);
		}

		if (this.data[key] != null) {
			value = this.data[key];
		}

		return value;
	}

	// TODO: actually check if valid
	validate() {
		return true;
	}
}

module.exports = Config;