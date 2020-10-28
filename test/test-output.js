const puppeteer = require("puppeteer");
const assert = require("assert").strict;
const fs = require("fs");

const elementsScript = fs.readFileSync("dist/global/elements.min.js", "utf8");
const strictElementsScript = fs.readFileSync("dist/global/elements-strict.min.js", "utf8");

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	
	let consoleWarnings = [];
	let consoleErrors = [];
	let pageErrors = [];
	page.on("console", event => {
		if (event.type() == "error") {
			consoleErrors.push(event.text());
		} else {
			consoleWarnings.push(event.text());
		}
	});
	page.on("pageerror", error => {
		pageErrors.push(error.message);
	});
	
	async function setup() {
		// Nothing?
	}
	async function teardown() {
		consoleWarnings = [];
		consoleErrors = [];
		pageErrors = [];
	}
	
	async function runScriptInBody(script, strict) {
		await page.setContent(
			"<!DOCTYPE html><meta charset='UTF-8'><script>" + 
			(strict ? strictElementsScript : elementsScript) + 
			"</script><body><script>" + 
			script + 
			"</script></body>"
		);
	}
	async function getBodyInnerHTML() {
		return await page.evaluate(() => document.body.innerHTML);
	}
	async function assertExpressionOutput(expression, expectedOutput) {
		await runScriptInBody("replaceScriptWith(" + expression + ");", false);
		assert.ok(pageErrors.length == 0, pageErrors);
		assert.equal(await getBodyInnerHTML(), expectedOutput);
	}
	async function assertStrictExpressionOutput(expression, expectedOutput) {
		await runScriptInBody("replaceScriptWith(" + expression + ");", true);
		assert.ok(pageErrors.length == 0, pageErrors);
		assert.equal(await getBodyInnerHTML(), expectedOutput);
	}
	function expectConsoleWarning(message) {
		const index = consoleWarnings.findIndex((warning) => warning == message);
		assert.ok(index != -1, "Didn't receive console warning:\n" + message + "\nInstead received:\n" + consoleWarnings);
		consoleWarnings.splice(index, 1);
	}
	function assertNoUnexpectedErrors() {
		assert.ok(consoleWarnings.length == 0, consoleWarnings);
		assert.ok(consoleErrors.length == 0, consoleErrors);
		assert.ok(pageErrors.length == 0, pageErrors);
	}
	
	const tests = {
		makeDiv: async function() {
			await assertExpressionOutput(
				`HTML.div("Hello world!")`,
				`<div>Hello world!</div>`);
		},
		makeFakeElement: async function() {
			await assertExpressionOutput(
				`HTML.fakeelement("Hello world!")`,
				`<fakeelement>Hello world!</fakeelement>`);
		},
		makeCustomElementCamelCase: async function() {
			await assertExpressionOutput(
				`HTML.myElement("Hello world!")`,
				`<my-element>Hello world!</my-element>`);
		},
		makeCustomElementSnakeCase: async function() {
			await assertExpressionOutput(
				`HTML.my_element("Hello world!")`,
				`<my-element>Hello world!</my-element>`);
		},
		makeCustomElementHandlesInitialCasing: async function() {
			await assertExpressionOutput(
				`HTML.MyElement("Hello world!")`,
				`<my-element>Hello world!</my-element>`);
		},
		makeCustomElementSnakeCase: async function() {
			await assertExpressionOutput(
				`HTML.my_element("Hello world!")`,
				`<my-element>Hello world!</my-element>`);
		},
		strictDoesSupportStandardElement: async function() {
			await assertStrictExpressionOutput(
				`HTML.div()`,
				`<div></div>`);
		},
		strictDoesNotSupportFakeElement: async function() {
			await assertStrictExpressionOutput(
				`typeof HTML.fakeelement`,
				`undefined`);
		},
		strictDoesNotSupportCamelCase: async function() {
			await assertStrictExpressionOutput(
				`typeof HTML.myElement`,
				`undefined`);
		},
		strictDoesNotSupportSnakeCase: async function() {
			await assertStrictExpressionOutput(
				`typeof HTML.my_element`,
				`undefined`);
		},
		handlesPlainString: async function() {
			await assertExpressionOutput(
				`"Hello world!"`,
				`Hello world!`);
		},
		callsFunctionArgs: async function() {
			await assertExpressionOutput(
				`HTML.div(HTML.p("Intro"), HTML.hr, HTML.p("Body"))`,
				`<div><p>Intro</p><hr><p>Body</p></div>`);
		},
		flattensArrays: async function() {
			await assertExpressionOutput(
				`HTML.div([HTML.p("Intro"), HTML.p("Body")])`,
				`<div><p>Intro</p><p>Body</p></div>`);
		},
		worksWithIterators: async function() {
			await assertExpressionOutput(
				`HTML.div([HTML.p("Intro"), HTML.p("Body")].values())`,
				`<div><p>Intro</p><p>Body</p></div>`);
		},
		worksWithArrayMap: async function() {
			await assertExpressionOutput(
				`HTML.div(["Intro", "Body"].map(text => HTML.p(text)))`,
				`<div><p>Intro</p><p>Body</p></div>`);
		},
		handlesGenerators: async function() {
			await assertExpressionOutput(
				`HTML.div(function*() {yield HTML.p("Intro"); yield HTML.p("Body");})`,
				`<div><p>Intro</p><p>Body</p></div>`);
		},
		worksWithStandardConstruction: async function() {
			await assertExpressionOutput(
				`HTML.div(document.createElement("p"))`,
				`<div><p></p></div>`);
		},
		/*classListString: async function() {
			await assertExpressionOutput(
				`HTML.div({classList: "hello world"})`,
				`<div class="hello world"></div>`);
		},
		classListArray: async function() {
			await assertExpressionOutput(
				`HTML.div({classList: ["hello", "world"]})`,
				`<div class="hello world"></div>`);
		},
		invalidClassListWarning: async function() {
			await assertExpressionOutput(
				`HTML.div({classList: 0})`,
				`<div></div>`);
			expectConsoleWarning(`Invalid classList value "0" on DIV element.`);
		},
		classNameString: async function() {
			await assertExpressionOutput(
				`HTML.div({className: "hello world"})`,
				`<div class="hello world"></div>`);
		},
		classNameArray: async function() {
			await assertExpressionOutput(
				`HTML.div({className: ["hello", "world"]})`,
				`<div class="hello world"></div>`);
		},
		invalidClassNameWarning: async function() {
			await assertExpressionOutput(
				`HTML.div({className: 0})`,
				`<div></div>`);
			expectConsoleWarning(`Invalid className value "0" on DIV element.`);
		},*/
		classString: async function() {
			await assertExpressionOutput(
				`HTML.div({class: "hello world"})`,
				`<div class="hello world"></div>`);
		},
		classArray: async function() {
			await assertExpressionOutput(
				`HTML.div({class: ["hello", "world"]})`,
				`<div class="hello world"></div>`);
		},
		invalidClassWarning: async function() {
			await assertExpressionOutput(
				`HTML.div({class: 0})`,
				`<div></div>`);
			expectConsoleWarning(`Invalid class value "0" on DIV element.`);
		},
		styleString: async function() {
			await assertExpressionOutput(
				`HTML.div({style: "font-family: sans-serif; --my-variable: 0;"})`,
				`<div style="font-family: sans-serif; --my-variable: 0;"></div>`);
		},
		styleObjectKebabCase: async function() {
			await assertExpressionOutput(
				`HTML.div({style: {"font-family": "sans-serif", "--my-variable": 0}})`,
				`<div style="font-family: sans-serif; --my-variable:0;"></div>`);
		},
		styleObjectCamelCase: async function() {
			await assertExpressionOutput(
				`HTML.div({style: {fontFamily: "sans-serif", "--my-variable": 0}})`,
				`<div style="font-family: sans-serif; --my-variable:0;"></div>`);
		},
		callbackAsString: async function() {
			await assertExpressionOutput(
				`HTML.button({id: "testButton", onclick: "console.warn('Hello world!')"})`,
				`<button id="testButton" onclick="console.warn('Hello world!')"></button>`);
			await page.evaluate(() => document.getElementById("testButton").click());
			expectConsoleWarning("Hello world!");
		},
		callbackAsFunction: async function() {
			await assertExpressionOutput(
				`HTML.button({id: "testButton", onclick: ()=>console.warn('Hello world!')})`,
				`<button id="testButton"></button>`);
			await page.evaluate(() => document.getElementById("testButton").click());
			expectConsoleWarning("Hello world!");
		},
		setAttributeToTrue: async function() {
			await assertExpressionOutput(
				`HTML.input({type: "checkbox", checked: true})`,
				`<input type="checkbox" checked="">`);
		},
		immediatelyResettingAttributeToFalseRemovesIt: async function() {
			await assertExpressionOutput(
				`HTML.input({id: "testInput", type: "checkbox", checked: true}, {checked: false})`,
				`<input id="testInput" type="checkbox">`);
		},
		laterResettingAttributeToFalseRemovesIt: async function() {
			await assertExpressionOutput(
				`HTML.input({id: "testInput", type: "checkbox", checked: true})`,
				`<input id="testInput" type="checkbox" checked="">`);
			await page.evaluate(() => applyToElement(document.getElementById("testInput"), {checked: false}));
			assert.equal(await getBodyInnerHTML(), `<input id="testInput" type="checkbox">`);
		},
		applyToElementAddsStuff: async function() {
			await assertExpressionOutput(
				`HTML.div({id: "testDiv"}, "Hello ")`,
				`<div id="testDiv">Hello </div>`);
			await page.evaluate(() => applyToElement(document.getElementById("testDiv"), {hidden: true}, "World!"));
			assert.equal(await getBodyInnerHTML(), `<div id="testDiv" hidden="">Hello World!</div>`);
		},
		applyToDocumentFragmentAddsStuff: async function() {
			await assertExpressionOutput(
				`applyToElement(HTML("Hello "), "World!")`,
				`Hello World!`);
		},
		applyToElementWarnsAboutType: async function() {
			await runScriptInBody("");
			await page.evaluate(() => applyToElement(0, "test"));
			expectConsoleWarning("Couldn't apply to provided argument because it's not an element or DocumentFragment.");
		},
		setAttributeToObject: async function() {
			await assertExpressionOutput(
				`HTML.div({"data-object": {}})`,
				`<div data-object="[object Object]"></div>`);
		},
		flattensAndConcatenatesChildren: async function() {
			await assertExpressionOutput(
				`HTML.div([0, [1]], 2, ()=>3, function*() { yield 4; })`,
				`<div>01234</div>`);
		},
		appendUnrecognizedChildrenAsText: async function() {
			await assertExpressionOutput(
				`HTML.div(null, undefined, 0, /^.*$/, {})`,
				`<div>nullundefined0/^.*$/</div>`);
		},
		objectArgsAddedAsChildOfFragmentInsteadOfAttributes: async function() {
			await assertExpressionOutput(
				`null, undefined, 0, /^.*$/, {}`,
				`nullundefined0/^.*$/[object Object]`);
		},
		svgElements: async function() {
			await assertExpressionOutput(
				`SVG.svg({viewBox: "0 0 1 1"}, SVG.circle({cx: 0, cy: 0, r: 1, fill: "black"}))`,
				`<svg viewBox="0 0 1 1"><circle cx="0" cy="0" r="1" fill="black"></circle></svg>`);
		},
		svgCamelCase: async function() {
			await assertExpressionOutput(
				`SVG.linearGradient()`,
				`<linearGradient></linearGradient>`);
		},
		svgKebabCase: async function() {
			await assertExpressionOutput(
				`SVG["color-profile"]()`,
				`<color-profile></color-profile>`);
		},
		svgSnakeCase: async function() {
			await assertExpressionOutput(
				`SVG.color_profile("Hello World!")`,
				`<color-profile>Hello World!</color-profile>`);
		},
		svgFakeElement: async function() {
			await assertExpressionOutput(
				`SVG.fakeelement()`,
				`<fakeelement></fakeelement>`);
		},
		strictSvgSupportsSnakeCase: async function() {
			await assertStrictExpressionOutput(
				`SVG.color_profile("Hello World!")`,
				`<color-profile>Hello World!</color-profile>`);
		},
		strictSvgDoesNotSupportFakeElement: async function() {
			await assertStrictExpressionOutput(
				`typeof SVG.fakeelement`,
				`undefined`);
		},
		svgComplexStructure: async function() {
			await assertExpressionOutput(
				`SVG.svg(
					SVG.defs(
						SVG.linearGradient({id: "myGradient"},
							SVG.stop({offset: "0%", "stop-color": "white"}),
							SVG.stop({offset: "100%", "stop-color": "black"}),
						),
					),
					SVG.circle({cx: 5, cy: 5, r: 4, fill: "url('#myGradient')"}),
				)`,
				`<svg>` +
					`<defs>` +
						`<linearGradient id="myGradient">` +
							`<stop offset="0%" stop-color="white"></stop>` +
							`<stop offset="100%" stop-color="black"></stop>` +
						`</linearGradient>` +
					`</defs>` +
					`<circle cx="5" cy="5" r="4" fill="url('#myGradient')"></circle>` +
				`</svg>`);
		},
		parsesHTML: async function() {
			await assertExpressionOutput(
				`HTML("<p id='intro'>Hello World!</p><hr>")`,
				`<p id="intro">Hello World!</p><hr>`);
		},
		parsesSVG: async function() {
			await assertExpressionOutput(
				`SVG("<svg viewBox='0 0 1 1'><circle cx='0' cy='0' r='1' fill='black'></circle></svg><svg/>")`,
				`<svg viewBox="0 0 1 1"><circle cx="0" cy="0" r="1" fill="black"></circle></svg><svg></svg>`);
		},
		checkHTMLFunctionNamespace: async function() {
			await runScriptInBody("");
			const namespaceURI = await page.evaluate(() => HTML.div().namespaceURI);
			assert.equal(namespaceURI, "http://www.w3.org/1999/xhtml");
		},
		checkHTMLParseNamespace: async function() {
			await runScriptInBody("");
			const namespaceURI = await page.evaluate(() => HTML("<div></div>").firstChild.namespaceURI);
			assert.equal(namespaceURI, "http://www.w3.org/1999/xhtml");
		},
		checkSVGFunctionNamespace: async function() {
			await runScriptInBody("");
			const namespaceURI = await page.evaluate(() => SVG.circle().namespaceURI);
			assert.equal(namespaceURI, "http://www.w3.org/2000/svg");
		},
		checkSVGParseNamespace: async function() {
			await runScriptInBody("");
			const namespaceURI = await page.evaluate(() => SVG("<circle/>").firstChild.namespaceURI);
			assert.equal(namespaceURI, "http://www.w3.org/2000/svg");
		},
		canNestSelectElements: async function () {
			// This caused problems earlier. Apparently select elements are iterable,
			// which means that the order of conditions in applyElementArgs matters.
			// Nodes (such as select elements) should prioritize being appended instead
			// of iterated over.
			await assertExpressionOutput(
				`HTML.div(HTML.select(HTML.option("File")))`,
				`<div><select><option>File</option></select></div>`);
		}
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
			//console.log("Testing " + testName + "...");
			await setup();
			await tests[testName]();
			assertNoUnexpectedErrors();
			//console.log("Passed!");
		} catch(e) {
			testsFailed++;
			console.error(consoleRed + testName + " failed." + consoleReset);
			//console.error(e.message);
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
