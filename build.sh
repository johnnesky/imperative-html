#!/bin/bash
set -e

# Compile .ts files from src/ into dist/esm/
npx tsc src/*.ts \
	--outDir ./dist/esm \
	--target es5 `# Internet Explorer doesn't support es6 features like for...of and ...spread.` \
	--module es6 `# Must be higher than es5 to output esm import/export symbols needed for rollup.` \
	--downlevelIteration true `# Required to include support for Symbol.iterator when targeting es5` \
	--moduleResolution node \
	--declaration true \
	--sourceMap true \
	--removeComments true \
	--strict true

# Transpile dist/esm/ files into dist/global/ files
npx rollup dist/esm/elements.js \
	--file dist/global/elements.js \
	--format iife \
	--output.name window \
	--output.extend true \
	--context exports \
	--plugin rollup-plugin-sourcemaps \
	--sourcemap
npx rollup dist/esm/elements-strict.js \
	--file dist/global/elements-strict.js \
	--format iife \
	--output.name window \
	--output.extend true \
	--context exports \
	--plugin rollup-plugin-sourcemaps \
	--sourcemap
npx rollup dist/esm/translator.js \
	--file dist/global/translator.js \
	--format iife \
	--output.name window \
	--output.extend true \
	--context exports \
	--plugin rollup-plugin-sourcemaps \
	--sourcemap

# Minify dist/global/ files
npx terser dist/global/elements.js \
	-o dist/global/elements.min.js \
	--source-map "content=dist/global/elements.js.map,url=elements.min.js.map" \
	--compress \
	--mangle
npx terser dist/global/elements-strict.js \
	-o dist/global/elements-strict.min.js \
	--source-map "content=dist/global/elements-strict.js.map,url=elements-strict.min.js.map" \
	--compress \
	--mangle
npx terser dist/global/translator.js \
	-o dist/global/translator.min.js \
	--source-map "content=dist/global/translator.js.map,url=translator.min.js.map" \
	--compress \
	--mangle
