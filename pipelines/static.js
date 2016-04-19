"use strict";

const core = require("../core");
const loader = core.getLoader();
const $ = loader.store;

const gulp = require("gulp");
const merge = require("merge-stream");

loader.depend({
	path: "path",

	rename: "gulp-rename",
	gutil: "gulp-util"
});

core.buildTasks.push("build:static");

const verifyPipeline = pipeline => {
	let result = core.verifyPipeline(pipeline);

	if (result instanceof Error) {
		return result;
	}

	if (pipeline.rename != null && typeof pipeline.rename !== "string") {
		return new Error("Expected a string for the server pipeline 'rename' property.");
	}
};

const buildPipeline = (pipeline, input) => {
	$.gutil.log($.gutil.colors.green(core.getName(pipeline) + ": building..."));

	let buildPath = core.get("out", pipeline);

	let dest = $.path.join(buildPath, pipeline.output);

	let stream = gulp.src(input ? input : pipeline.input);

	if (pipeline.rename) {
		stream = stream.pipe($.rename(pipeline.rename));
	}

	stream = stream.pipe(gulp.dest(dest))
		.pipe(core.browserSync.stream())
		.pipe(core.getNotify(core.getName(pipeline) + ": done!"));

	return stream;
};

gulp.task("build:static", () => {
	const pipelines = core.getPipelines("static");
	let merged = merge();

	if (pipelines.length > 0) {
		loader.load();
	}

	for (let pipeline of pipelines) {
		let result = verifyPipeline(pipeline);

		if (result instanceof Error) {
			throw result;
		}

		merged.add(buildPipeline(pipeline));

		if (core.get("watch", pipeline)) {
			gulp.watch(pipeline.input, e => {
				buildPipeline(pipeline, e.path);
			});
		}
	}

	return merged;
});