"use strict";

const core = require("../core");
const loader = core.getLoader();
const $ = loader.store;

const gulp = require("gulp");
const merge = require("merge-stream");

loader.depend({
	path: "path",

	gulpTypescript: "gulp-typescript",
	sourcemaps: "gulp-sourcemaps",
	gutil: "gulp-util",
	concat: "gulp-concat",
	insert: "gulp-insert",
	sort: "gulp-sort"
});

core.buildTasks.push("build:server");

/**
 * Prepares a string for use in a regular expression
 */
const escapeForRegEx = str => {
	return str.replace(/([\\*+?\[\].])/g, "\\$1");
};

/**
 * Sorts typings files so that the entrypoint is first.
 */
const sortTypings = pipeline => {
	const getRelevant = path => {
		const sourcedir = $.path.parse(pipeline.input).dir;
		const normalSource = $.path.normalize(sourcedir.replace(/\*/g, ""));
		const relevantMatcher = new RegExp(`^.+?${ escapeForRegEx(normalSource) }[/\\\\]?(.+)`);

		return path.match(relevantMatcher)[1];
	};

	const pipe = $.sort((a, b) => {
		let aR = getRelevant(a.path).replace(/\.d\.ts$/, ".ts");
		let bR = getRelevant(b.path).replace(/\.d\.ts$/, ".ts");

		if (aR === pipeline.moduleEntryPoint) {
			return 1;
		}

		if (bR === pipeline.moduleEntryPoint) {
			return -1;
		}

		return 0;
	});

	return pipe;
};

/**
 * A gulp transform that takes a list of .d.ts files and merges them.
 */
const mergeTypings = pipeline => {
	const sourcedir = $.path.parse(pipeline.input).dir;
	const normalSource = $.path.normalize(sourcedir.replace(/\*/g, ""));
	const moduleName = pipeline.moduleName;

	const pipe = $.insert.transform((contents, file) => {
		// Strip glob stars and normalize path

		// Find the relevant part of the path
		const relevantMatcher = new RegExp(`^.+?${ escapeForRegEx(normalSource) }[/\\\\]?(.+)`);
		const endName = file.path.match(relevantMatcher);

		if (!endName) {
			return contents;
		}

		// Strip the file extension off of the path
		const modulePath = endName[1].replace(/\.d\.ts$/, "");

		// Replace declarations like `export {default as X} from "x"`
		contents = contents.replace(/from "(.+?)"/g, (whole, path) => {
			const fullPath = $.path.join(moduleName, path);
			const normalized = $.path.normalize(fullPath)
				.replace(/\\/g, "/");

			return `from "${ normalized }"`;
		});

		// Remove ambient declarations that would be doubly ambient
		contents = contents.replace(/( ?)declare /g, (whole, space) => {
			return space;
		});

		// Indent blocks in to make them look nicer.
		contents = contents.replace(/\n/g, "\n\t").trim();

		let fileIdentifier = $.path.join(moduleName, modulePath)
			.replace(/\\/g, "/");

		if (modulePath === pipeline.moduleEntryPoint.replace(/\.[tj]s$/, "")) {
			fileIdentifier = moduleName;
		}

		return `declare module "${ fileIdentifier }" {\n\t${ contents }\n}`;
	});

	return pipe;
};

const verifyPipeline = pipeline => {
	let result = core.verifyPipeline(pipeline);

	if (result instanceof Error) {
		return result;
	}

	if (pipeline.extraEntries != null && !Array.isArray(pipeline.extraEntries)) {
		return new Error("Expected an array for the server pipeline 'extraEntries' property.");
	}

	if (pipeline.typingsOutput != null && typeof pipeline.typingsOutput !== "string") {
		return new Error("Expected a string for the server pipeline 'typingsOutput' property.");
	}

	if (pipeline.moduleName != null && typeof pipeline.moduleName !== "string") {
		return new Error("Expected a string for the server pipeline 'moduleName' property.");
	}

	if (pipeline.moduleEntryPoint != null && typeof pipeline.moduleEntryPoint !== "string") {
		return new Error("Expected a string for the server pipeline 'moduleEntryPoint' property.");
	}

	if (pipeline.typescript != null && typeof pipeline.typescript !== "object") {
		return new Error("Expected an object for the server pipeline 'typescript' property.");
	}
};

const buildPipeline = (pipeline, input) => {
	$.gutil.log($.gutil.colors.green(core.getName(pipeline) + ": building..."));

	const shouldOutput = core.shouldPipelineOutput(pipeline);
	const shouldOutputTypings = core.shouldPipelineOutput(pipeline, "typingsOutput");
	const buildPath = core.get("out", pipeline);

	let dest;

	if (shouldOutput) {
		dest = $.path.join(buildPath, pipeline.output);
	}

	const sourcedir = $.path.parse(pipeline.input).dir;

	const entries = [input ? input : pipeline.input];

	if (pipeline.extraEntries) {
		entries.push(...pipeline.extraEntries);
	}

	const config = {
		declaration: false
	};

	if (pipeline.typingsOutput != null) {
		config.declaration = true;
	}

	if (pipeline.config && pipeline.config.typescript) {
		Object.assign(config, pipeline.config.typescript);
	}

	const handler = core.getErrorHandler(core.getName(pipeline));

	let stream = gulp.src(entries)
		.pipe($.sourcemaps.init())
		.pipe(
			$.gulpTypescript(config)
			.on("error", e => {})
		);

	const streams = [];

	let js = stream.js;

	if (shouldOutput) {
		js = js
			.pipe($.sourcemaps.write("./"))
			.pipe(gulp.dest(dest));
	}

	js = js
		.pipe(core.getCallback(pipeline));

	streams.push(js);

	if (shouldOutputTypings) {
		let outDir = $.path.join(buildPath, pipeline.typingsOutput);

		let dts = stream.dts;

		if (pipeline.typingsOutputType == null || pipeline.typingsOutputType === "ambient") {
			outDir = $.path.join(buildPath, $.path.dirname(pipeline.typingsOutput));
			const outFileName = $.path.basename(pipeline.typingsOutput);

			dts = dts
				.pipe(sortTypings(pipeline))
				.pipe(mergeTypings(pipeline))
				.pipe($.concat(outFileName));
		} else if (pipeline.typingsOutputType === "module") {
			// Nothing necessary to transform
		}

		dts = dts
			.pipe(gulp.dest(outDir))
			.pipe(core.getCallback(pipeline));

		streams.push(dts);
	}

	stream = merge(streams)
		.pipe(core.getNotify(core.getName(pipeline) + ": done!"));

	return stream;
};

gulp.task("build:server", () => {
	const pipelines = core.getPipelines("server");
	const merged = merge();

	if (pipelines.length > 0) {
		loader.load();
	}

	for (const pipeline of pipelines) {
		let result = verifyPipeline(pipeline);

		if (result instanceof Error) {
			throw result;
		}

		merged.add(buildPipeline(pipeline));

		if (core.get("watch", pipeline)) {
			let watches = [
				pipeline.input
			];

			if (Array.isArray(pipeline.watches)) {
				watches = pipeline.watches.slice();
			}

			gulp.watch(watches, e => {
				if (pipeline.config && pipeline.config.partialRebuild) {
					buildPipeline(pipeline, e.path);
				} else {
					buildPipeline(pipeline);
				}
			});
		}
	}

	return merged;
});