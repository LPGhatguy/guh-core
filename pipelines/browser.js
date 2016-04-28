"use strict";

const core = require("../core");
const loader = core.getLoader();
const $ = loader.store;

const gulp = require("gulp");
const merge = require("merge-stream");

loader.depend({
	path: "path",

	source: "vinyl-source-stream",
	buffer: "vinyl-buffer",

	browserify: "browserify",
	tsify: "tsify",
	watchify: "watchify",

	gutil: "gulp-util",
	sourcemaps: "gulp-sourcemaps",
	rename: "gulp-rename",
	uglify: "gulp-uglify"
});

core.buildTasks.push("build:browser");

const verifyPipeline = pipeline => {
	let result = core.verifyPipeline(pipeline);

	if (result instanceof Error) {
		return result;
	}

	if (pipeline.extraEntries != null && !Array.isArray(pipeline.extraEntries)) {
		return new Error("Expected an array for the browser pipeline 'extraEntries' property.");
	}

	if (pipeline.typescript != null && typeof pipeline.typescript !== "object") {
		return new Error("Expected an object for the browser pipeline 'typescript' property.");
	}

	if (pipeline.browserify != null && typeof pipeline.browserify !== "object") {
		return new Error("Expected an object for the browser pipeline 'browserify' property.");
	}
};

const buildPipeline = pipeline => {
	const shouldOutput = core.shouldPipelineOutput(pipeline);
	let buildPath = core.get("out", pipeline);

	let dest;
	let ppath;

	if (shouldOutput) {
		dest = $.path.join(buildPath, pipeline.output);
		ppath = $.path.parse(dest);
	}

	let entries = [pipeline.input];

	if (pipeline.extraEntries) {
		entries.push(...pipeline.extraEntries);
	}

	let args = $.watchify.args;
	args.extensions = [".ts", ".js"];
	args.entries = entries;
	args.debug = true;

	if (pipeline.config && pipeline.config.browserify) {
		Object.assign(args, pipeline.config.browserify);
	}

	let bundler = $.browserify(args);

	if (core.get("watch", pipeline)) {
		bundler = $.watchify(bundler);
	}

	bundler = bundler.plugin($.tsify, pipeline.config && pipeline.config.typescript);

	let rebundle = () => {
		$.gutil.log($.gutil.colors.green(core.getName(pipeline) + ": building..."));

		const handler = core.getErrorHandler(core.getName(pipeline));

		let stream = bundler.bundle()
			.on("error", handler)
			.pipe($.source(pipeline.input))
			.pipe($.buffer());

		if (core.get("sourcemaps", pipeline)) {
			stream = stream
				.pipe($.sourcemaps.init({ loadMaps: true }))
		}

		if (core.get("minify", pipeline)) {
			stream = stream
				.pipe($.uglify())
		}

		if (shouldOutput) {
			stream = stream
				.pipe($.rename(ppath.base));
		}

		if (core.get("sourcemaps", pipeline)) {
			stream = stream
				.pipe($.sourcemaps.write("./"));
		}

		if (shouldOutput) {
			stream = stream
				.pipe(gulp.dest(ppath.dir))
				.pipe(core.browserSync.stream());
		}

		stream = stream
			.pipe(core.getNotify(core.getName(pipeline) + ": done!"))
			.pipe(core.getCallback(pipeline));

		return stream;
	}

	if (core.get("watch", pipeline)) {
		bundler.on("update", rebundle);
	}

	return rebundle();
};

gulp.task("build:browser", () => {
	const pipelines = core.getPipelines("browser");
	const merged = merge();

	if (pipelines.length > 0) {
		loader.load();
	}

	for (let pipeline of pipelines) {
		let result = verifyPipeline(pipeline);

		if (result instanceof Error) {
			throw result;
		}

		merged.add(buildPipeline(pipeline));
	}

	return merged;
});