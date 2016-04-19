"use strict";

const load = (path) => {
	try {
		return require(path);
	} catch(e) {
		console.log(`Couldn't load module "${path}", try running "npm install"`);
		throw e;
		process.exit();
	}
};

/**
 * Loads dependencies and stores them conveniently.
 * Alias Loader.store as '$' to follow convention.
 */
class Loader {
	constructor() {
		this.store = {};
		this.graph = {};
	}

	depend(graph) {
		Object.assign(this.graph, graph);
	}

	load() {
		const graph = this.graph;

		for (const key in graph) {
			if (!graph.hasOwnProperty(key)) {
				continue;
			}

			this.store[key] = load(graph[key]);
		}
	}
}

module.exports = Loader;