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

const parseString = (key, value) => value;

const parseStringList = (key, value) => value.split(",");

const parseDefault = parseString;

const parsers = {
	boolean: parseBoolean,
	string: parseString,
	stringList: parseStringList
};

class ArgBuilder {
	constructor(schema) {
		this.parsers = Object.assign({}, parsers);
		this.schema = schema;
	}

	parse(input) {
		const result = {};

		for (const piece of input) {
			if (!piece.startsWith("--")) {
				// TODO: report this, maybe?
				continue;
			}

			let key, value;

			const setterMatch = piece.match(/^--([^=]+)=(.+)/);

			if (setterMatch) {
				[, key, value] = setterMatch;
			}

			if (!key) {
				const flagMatch = piece.match(/^--(.+)/);

				if (flagMatch) {
					key = flagMatch[1];
					value = "";
				}
			}

			if (!key) {
				// TODO: report this error?
				continue;
			}

			const parser = this.parsers[key] || parseDefault;

			result[key] = parser(key, value);
		}

		return result;
	}
}

module.exports = ArgBuilder;