"use strict";

const defaultValues = {
	type: null, // required
	name: null,
	id: null, // an object!
	tags: []
};

class Pipeline {
	constructor(data) {
		this.data = Object.assign({}, defaultValues, data);
	}

	isValid() {
		if (typeof this.data.type !== "string") {
			return new Error(`"type" is required and must be of type string!`);
		}

		return true;
	}
}

module.exports = Pipeline;