"use strict";

const parseDefault = (key, value) => value;

class ArgBuilder {
	constructor(schema) {
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

			const meta = this.schema[key];

			if (!meta) {
				// TODO: report?
				continue;
			}

			const parser = meta.parser || parseDefault;

			result[key] = parser(key, value);
		}

		console.log("Built", result);

		return result;
	}
}

module.exports = ArgBuilder;