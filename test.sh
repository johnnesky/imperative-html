#!/bin/bash
set -e

# Check that the typescript compiler can understand the exported element types as intended.
npx tsc test/test-types.ts --noEmit --moduleResolution node --strict true

# Check that the exported element functions generate the expected output when run in the browser.
node test/test-output.js

# Check that the exported translator function generates the expected output when run in the browser.
node test/test-translator.js
