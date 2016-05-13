"use strict";

const core = require("../core");
const loader = core.getLoader();
const $ = loader.store;

const gulp = require("gulp");
const merge = require("merge-stream");

loader.depend({
	path: "path",

	sass: "gulp-sass",
	postcss: "gulp-postcss",
	syntaxSCSS: "postcss-scss",
	sassyImport: "postcss-sassy-import",
	autoprefixer: "autoprefixer",
	cssnano: "cssnano",
	stylelint: "stylelint",
	reporter: "postcss-reporter",

	rename: "gulp-rename",
	sourcemaps: "gulp-sourcemaps",
	gutil: "gulp-util"
});

core.buildTasks.push("build:styles");

const verifyPipeline = pipeline => {
	let result = core.verifyPipeline(pipeline);

	if (result instanceof Error) {
		return result;
	}

	if (pipeline.sass != null && typeof pipeline.sass !== "object") {
		return new Error("Expected a object for the server pipeline 'sass' property.");
	}

	if (pipeline.sassyImport != null && typeof pipeline.sassyImport !== "object") {
		return new Error("Expected a object for the server pipeline 'sassyImport' property.");
	}

	if (pipeline.autoprefixer != null && typeof pipeline.autoprefixer !== "object") {
		return new Error("Expected a object for the server pipeline 'autoprefixer' property.");
	}

	if (pipeline.stylelint != null && typeof pipeline.stylelint !== "object") {
		return new Error("Expected a object for the server pipeline 'stylelint' property.");
	}
};

const buildPipeline = pipeline => {
	$.gutil.log($.gutil.colors.green(core.getName(pipeline) + ": building..."));

	const shouldOutput = core.shouldPipelineOutput(pipeline);
	const buildPath = core.get("out", pipeline);

	let dest;
	let ppath;

	if (shouldOutput) {
		dest = $.path.join(buildPath, pipeline.output);
		ppath = $.path.parse(dest);
	}

	const sassConf = {};

	if (pipeline.config && pipeline.config.sass) {
		Object.assign(sassConf, pipeline.config.sass);
	}

	// Processors run before Sass
	const preProcessors = [];

	// Processors run after Sass
	const postProcessors = [];

	const sassyImportConfig = {};

	if (pipeline.config && pipeline.config.sassyImport) {
		Object.assign(sassyImportConfig, pipeline.config.sassyImport);
	}

	// This plugin drives our style imports
	preProcessors.push($.sassyImport(sassyImportConfig));

	// The linter!
	if (pipeline.config && pipeline.config.stylelint) {
		preProcessors.push($.stylelint(pipeline.config.stylelint));
	}

	// Autoprefixer for a great good!
	if (pipeline.config && pipeline.config.autoprefixer) {
		preProcessors.push($.autoprefixer(pipeline.config.autoprefixer));
	}

	// CSS minifier
	// cssnano comes with autoprefixer, which we handle ourselves
	if (core.get("minify", pipeline)) {
		postProcessors.push($.cssnano({ autoprefixer: false }));
	}

	// Plugin to report PostCSS warnings and errors, mostly from stylelint
	preProcessors.push($.reporter({
		clearMessages: true,
		throwError: true
	}));

	const handler = core.getErrorHandler(core.getName(pipeline));

	let stream = gulp.src(pipeline.input)
		.pipe($.sourcemaps.init())
		.pipe(
			$.postcss(preProcessors, { syntax: $.syntaxSCSS, sourcemap: true })
			.on("error", handler)
		)
		.pipe(
			$.sass(sassConf)
			.on("error", handler)
		)
		.pipe($.postcss(postProcessors), { sourcemap: true })

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
			.pipe(core.browserSync.stream({ match: "**/*.css" }));
	}

	stream = stream
		.pipe(core.getNotify(core.getName(pipeline) + ": done!"))
		.pipe(core.getCallback(pipeline));

	return stream;
};

gulp.task("build:styles", () => {
	const pipelines = core.getPipelines("styles");
	let merged = merge();

	if (pipelines.length > 0) {
		loader.load();
	}

	for (let pipeline of pipelines) {
		const result = verifyPipeline(pipeline);

		if (result instanceof Error) {
			throw result;
		}

		merged.add(buildPipeline(pipeline));

		const sourcedir = $.path.parse(pipeline.input).dir;

		if (core.get("watch", pipeline)) {
			gulp.watch(sourcedir + "/**/*.scss", e => {
				return buildPipeline(pipeline);
			});

			gulp.watch(sourcedir + "/**/*.json", e => {
				return buildPipeline(pipeline);
			});
		}
	}

	return merged;
});