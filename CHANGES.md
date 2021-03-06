# guh Changes

## 1.5.0
- Added `watchPaths` parameter to all pipelines

## 1.4.0
- Fixed typings not outputting with `typingsOutput` of empty string
- Added `typingsOutputType` parameter to choose output type
	- Defaults to `ambient`, which bundles all modules into a single ambient file
	- Also available is `module`, which puts typings files next to output JS.

## 1.3.3
- Fixed doubly-ambient declarations when building TS typings

## 1.3.2
- Added (missing) support for arrays in pipeline inputs

## 1.3.1
- Added `callback` parameter to pipelines to allow retrieving built file contents

## 1.3.0
- Added `--dry` parameter to disable outputting to the filesystem
- `output` in pipelines is no longer required
	- Omitting the property disables writing to the filesystem

## 1.2.1
- Fix incorrect behavior of `--once=no`, which is not valid

## 1.2.0
- Added support for guh `--debug` flag
- Added `--once` flag, which disables Browsersync and file watching

## 1.1.0
- guh-core no longer registers a Gulp task

## 1.0.0
- Initial release