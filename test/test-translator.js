import puppeteer from 'puppeteer';
import {strict as assert} from "assert";
import * as fs from "fs";

const translatorScript = fs.readFileSync("dist/global/translator.min.js", "utf8");

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.setContent("<!DOCTYPE html><meta charset='UTF-8'><script>" + translatorScript + "</script><body></body>");
	
	let pageErrors = [];
	page.on("pageerror", error => {
		pageErrors.push(error.message);
	});
	
	async function setup() {
		// Nothing?
	}
	async function teardown() {
		pageErrors = [];
	}
	
	async function assertTranslationOutput(input, expectedOutput) {
		const output = await page.evaluate((input) => translateElementsToImperativeCode(input), input);
		assert.ok(pageErrors.length == 0, pageErrors);
		assert.equal(output, expectedOutput);
	}
	function assertNoUnexpectedErrors() {
		assert.ok(pageErrors.length == 0, pageErrors);
	}
	
	const tests = {
		handlesInstantiatedHTMLElement: async function() {
			assert.equal(
				await page.evaluate(() => translateElementsToImperativeCode(document.createElement("div"))),
				`HTML.div()`);
		},
		handlesInstantiatedSVGElement: async function() {
			assert.equal(
				await page.evaluate(() => translateElementsToImperativeCode(document.createElementNS("http://www.w3.org/2000/svg", "g"))),
				`SVG.g()`);
		},
		handlesInstantiatedTextNode: async function() {
			assert.equal(
				await page.evaluate(() => translateElementsToImperativeCode(document.createTextNode("Hello World!"))),
				`"Hello World!"`);
		},
		handlesInstantiatedDocumentFragment: async function() {
			assert.equal(
				await page.evaluate(() => {
					const fragment = document.createDocumentFragment();
					fragment.appendChild(document.createElement("div"));
					fragment.appendChild(document.createElement("p")).appendChild(document.createTextNode("Hello World!"));
					return translateElementsToImperativeCode(fragment);
				}),
				`HTML.div(),\n` + 
				`HTML.p("Hello World!")`
			);
		},
		hsesDefaultIndentation: async function() {
			assert.equal(
				await page.evaluate(() => {
					const div = document.createElement("div");
					div.appendChild(document.createElement("div"));
					return translateElementsToImperativeCode(div);
				}),
				`HTML.div(\n` + 
				`	HTML.div(),\n` + 
				`)`
			);
		},
		usesGivenIndentation: async function() {
			assert.equal(
				await page.evaluate(() => {
					const div = document.createElement("div");
					div.appendChild(document.createElement("div"));
					return translateElementsToImperativeCode(div, "  ");
				}),
				`HTML.div(\n` + 
				`  HTML.div(),\n` + 
				`)`
			);
		},
		textNode: async function() {
			await assertTranslationOutput(
				`Hello World!`,
				`"Hello World!"`);
		},
		htmlElement: async function() {
			await assertTranslationOutput(
				`<div></div>`,
				`HTML.div()`);
		},
		svgElement: async function() {
			await assertTranslationOutput(
				`<svg></svg>`,
				`SVG.svg()`);
		},
		multipleRootElements: async function() {
			await assertTranslationOutput(
				`<div></div><div></div>`,
				`HTML.div(),\n` +
				`HTML.div()`
			);
		},
		singleTextChildOnSingleLine: async function() {
			await assertTranslationOutput(
				`<p>Hello World!</p>`,
				`HTML.p("Hello World!")`);
		},
		attributesOnSingleLine: async function() {
			await assertTranslationOutput(
				`<div class="container"></div>`,
				`HTML.div({class: "container"})`);
		},
		childOnNextLine: async function() {
			await assertTranslationOutput(
				`<div><div></div></div>`,
				`HTML.div(\n` +
				`	HTML.div(),\n` +
				`)`
			);
		},
		attributesPushTextToNextLine: async function() {
			await assertTranslationOutput(
				`<div class="container">Hello World!</div>`,
				`HTML.div({class: "container"},\n` +
				`	"Hello World!",\n` +
				`)`
			);
		},
		attributesOnFirstLineChildOnNext: async function() {
			await assertTranslationOutput(
				`<div class="container"><div></div></div>`,
				`HTML.div({class: "container"},\n` +
				`	HTML.div(),\n` +
				`)`
			);
		},
		multipleAdjacentChildren: async function() {
			await assertTranslationOutput(
				`<div>Hello <b>Awesome</b> World!</div>`,
				`HTML.div(\n` +
				`	"Hello ",\n` +
				`	HTML.b("Awesome"),\n` +
				`	" World!",\n` +
				`)`
			);
		},
		indentsNestedChildren: async function() {
			await assertTranslationOutput(
				`<div><div><div></div></div></div>`,
				`HTML.div(\n` +
				`	HTML.div(\n` +
				`		HTML.div(),\n` +
				`	),\n`+
				`)`
			);
		},
		recognizesSVGChildren: async function() {
			await assertTranslationOutput(
				`<div><svg><a></a></svg><a></a></div>`,
				`HTML.div(\n` +
				`	SVG.svg(\n` +
				`		SVG.a(),\n` +
				`	),\n`+
				`	HTML.a(),\n`+
				`)`
			);
		},
		handlesMultilineTextNode: async function() {
			await assertTranslationOutput(
				`<p>Hello\n\tWorld!</p>`,
				`HTML.p(\n` +
				`	\`Hello\n` +
				`	World!\`,\n` +
				`)`
			);
		},
		handlesCharacterEntities: async function() {
			await assertTranslationOutput(
				`<p>&lt; &amp; &gt;</p>`,
				`HTML.p("< & >")`
			);
		},
		escapesDoubleQuotes: async function() {
			await assertTranslationOutput(
				`<p>"Hello World!"</p>`,
				`HTML.p("\\"Hello World!\\"")`
			);
		},
		escapesBackTicks: async function() {
			await assertTranslationOutput(
				`<p>Hello\n\t\`Awesome\` World!</p>`,
				`HTML.p(\n` +
				`	\`Hello\n` +
				`	\\\`Awesome\\\` World!\`,\n` +
				`)`
			);
		},
		handlesKebabCaseHTMLElementName: async function() {
			await assertTranslationOutput(
				`<custom-name></custom-name>`,
				`HTML.customName()`
			);
		},
		handlesReservedHTMLElementName: async function() {
			await assertTranslationOutput(
				`<var></var>`,
				`HTML["var"]()`
			);
		},
		handlesReservedSVGElementName: async function() {
			await assertTranslationOutput(
				`<svg><switch></switch></svg>`,
				`SVG.svg(\n` +
				`	SVG["switch"](),\n` +
				`)`
			);
		},
		handlesKebabCaseSVGElementName: async function() {
			await assertTranslationOutput(
				`<svg><color-profile></color-profile></svg>`,
				`SVG.svg(\n` +
				`	SVG.color_profile(),\n` +
				`)`
			);
		},
		handlesCamelCaseSVGElementName: async function() {
			await assertTranslationOutput(
				`<svg><linearGradient></linearGradient></svg>`,
				`SVG.svg(\n` +
				`	SVG.linearGradient(),\n` +
				`)`
			);
		},
		handlesInvalidIdentifierElementName: async function() {
			await assertTranslationOutput(
				`<fake*></fake*>`,
				`HTML["fake*"]()`
			);
		},
		handlesInvalidIdentifierAttributeName: async function() {
			await assertTranslationOutput(
				`<div data-test="test"></div>`,
				`HTML.div({"data-test": "test"})`
			);
		},
		handlesBooleanAttribute: async function() {
			await assertTranslationOutput(
				`<div hidden></div>`,
				`HTML.div({hidden: true})`
			);
		},
		handlesNumericAttribute: async function() {
			await assertTranslationOutput(
				`<input value="1"></input>`,
				`HTML.input({value: 1})`
			);
		},
		skipsWhitespaceTextNodes: async function() {
			await assertTranslationOutput(
				`\n\t <div>\n\t </div>\n\t `,
				`HTML.div()`
			);
		},
		trimsExtraWhitespace: async function() {
			await assertTranslationOutput(
				`<div>\n\t   Hello World!\n\t </div>`,
				`HTML.div(" Hello World! ")`
			);
		},
		handlesEventListener: async function() {
			await assertTranslationOutput(
				`<div onclick="alert('test')"></div>`,
				`HTML.div({onclick: "alert('test')"})`
			);
		},
		handlesMultipleAttributes: async function() {
			await assertTranslationOutput(
				`<div class="container" style="z-index: 1;" value="1" hidden onclick="alert('test')"></div>`,
				`HTML.div({class: "container", style: "z-index: 1;", value: 1, hidden: true, onclick: "alert('test')"})`
			);
		},
		handlesLabelFor: async function() {
			await assertTranslationOutput(
				`<label for="test"></div>`,
				`HTML.label({for: "test"})`
			);
		},
	};
	
	const consoleRed = "\x1b[31m";
	const consoleGreen = "\x1b[32m";
	const consoleReset = "\x1b[0m";
	
	let failed = false;
	let testsRun = 0;
	let testsFailed = 0;
	for (const testName of Object.keys(tests)) {
		try {
			testsRun++;
			await setup();
			await tests[testName]();
			assertNoUnexpectedErrors();
		} catch(e) {
			testsFailed++;
			console.error(consoleRed + testName + " failed." + consoleReset);
			console.error(e.stack);
			failed = true;
		}
		await teardown();
	}
	
	page.removeAllListeners();
	await browser.close();
	if (failed) {
		console.error(consoleRed + testsFailed + "/" + testsRun + " tests failed." + consoleReset);
	} else {
		console.log(consoleGreen + "Ran " + testsRun + "/" + testsRun + " tests successfully!" + consoleReset);
	}
	process.exit(failed ? 1 : 0)
})();
