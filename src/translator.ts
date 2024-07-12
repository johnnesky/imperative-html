// Copyright (C) John Nesky, distributed under the MIT license.

// Simplified, but covers most cases I care about:
const validJavascriptIdentifier: RegExp = /^[a-z][a-zA-z0-9_]*$/;

const reservedJavascriptIdentifiers: {[key: string]: boolean} = {"abstract": true, "arguments": true, "await": true, "boolean": true, "break": true, "byte": true, "case": true, "catch": true, "char": true, "class": true, "const": true, "continue": true, "debugger": true, "default": true, "delete": true, "do": true, "double": true, "else": true, "enum": true, "eval": true, "export": true, "extends": true, "false": true, "final": true, "finally": true, "float": true, "for": true, "function": true, "goto": true, "if": true, "implements": true, "import": true, "in": true, "instanceof": true, "int": true, "interface": true, "let": true, "long": true, "native": true, "new": true, "null": true, "package": true, "private": true, "protected": true, "public": true, "return": true, "short": true, "static": true, "super": true, "switch": true, "synchronized": true, "this": true, "throw": true, "throws": true, "transient": true, "true": true, "try": true, "typeof": true, "var": true, "void": true, "volatile": true, "while": true, "with": true, "yield": true};

// Converts a text node to a string, trimming away leading and trailing whitespace.
// If the string contains tabs or newlines, wrap it in backticks, otherwise double quotes,
// and escape the contents appropriately. 
// Returns null for nodes that are entirely whitespace.
function convertTextNode(node: Node): (string | null) {
	let value: string = node.nodeValue!;
	if (/^\s+$/.test(value)) return null; // skip whitespace nodes.
	value = value.replace(/^(\t|\n|  )+/, "").replace(/\s+$/, " ");
	if (/[\t\n]/.test(value)) {
		return "`" + value.replace(/`/g, "\\`").replace(/\$\{/g, "\\${") + "`";
	} else {
		return JSON.stringify(value);
	}
}

// Recursively converts an element and all of its contents to a string of JavaScript code
// that would generate the same element hierarchy if executed. Attempts to format the code
// as a human might, collapsing functions with a single argument onto a single line but
// spreading more complex arguments across multiple indented lines using the provided
// indentType string.
function convertElementsRecursively(node: Element, indentLevel: number, indentType: string): string {
	let indentation = ""; // indentType.repeat(indentLevel) doesn't work in Internet Explorer...
	for (let i: number = 0; i < indentLevel; i++) indentation += indentType;
	
	let result: string = indentation;
	if (node instanceof HTMLElement) {
		result += "HTML";
		const elementName: string = node.tagName.toLowerCase();
		const camelCaseName: string = elementName.replace(/-[a-z]/, (c) => c.slice(1).toUpperCase()).replace(/-/g, "_");
		const validIdentifier: boolean = validJavascriptIdentifier.test(camelCaseName) && !reservedJavascriptIdentifiers[camelCaseName];
		result += validIdentifier ? ("." + camelCaseName) : ("[" + JSON.stringify(elementName) + "]");
	} else if (node instanceof SVGElement) {
		result += "SVG";
		const elementName: string = node.tagName;
		const snakeCaseName: string = elementName.replace(/-/g, "_");
		const validIdentifier: boolean = validJavascriptIdentifier.test(snakeCaseName) && !reservedJavascriptIdentifiers[snakeCaseName];
		result += validIdentifier ? ("." + snakeCaseName) : ("[" + JSON.stringify(elementName) + "]");
	} else {
		return indentation + "<Unrecognized node type>,\n";
	}
	
	const attributes: string[] = [];
	if (node.attributes.length > 0) {
		//for (const attribute of node.attributes) { // not backwards compatible with Internet Explorer.
		for (let i: number = 0; i < node.attributes.length; i++) { const attribute = node.attributes[i];
			if (!attribute.specified) continue;
			let name: string = attribute.name;
			if (!validJavascriptIdentifier.test(name)) name = JSON.stringify(name);
			let value: string = attribute.value;
			if (value === "") {
				value = "true";
			} else if (isNaN(<any>value) || String(parseFloat(value)) !== value) {
				value = JSON.stringify(value);
			}
			attributes.push(name + ": " + value);
		}
	}
	const hasAttributes: boolean = attributes.length > 0;
	
	const children: string[] = [];
	let collapseChildren: boolean = false;
	//for (const child of node.childNodes) { // not backwards compatible with Internet Explorer.
	for (let i: number = 0; i < node.childNodes.length; i++) { const child = node.childNodes[i];
		if (child instanceof Text) {
			const text = convertTextNode(child);
			if (text != null) {
				if (!hasAttributes && node.childNodes.length === 1 && !/[\n]/.test(text)) {
					children.push(text);
					// Don't add whitespace around single text node child:
					collapseChildren = true;
				} else {
					// Put text node on its own indented line followed by a comma.
					children.push(indentation + indentType + text + ",\n");
				}
			}
		} else if (child instanceof Element) {
			children.push(convertElementsRecursively(child, indentLevel + 1, indentType));
		}
	}
	const hasChildren: boolean = children.length > 0;
	
	result += "(";
	if (hasAttributes) {
		result += "{" + attributes.join(", ") + "}";
		if (hasChildren) result += ",";
	}
	if (collapseChildren) {
		result += children.join("");
	} else if (hasChildren) {
		result += "\n" + children.join("") + indentation;
	}
	result += ")";
	return result + ",\n";
}

/**
 * Converts an element and all of its contents to a string of JavaScript code that would
 * generate the same element hierarchy if executed using the imperative-html library,
 * attempting to format the code as a human might. The first argument can be an instantiated
 * element or a string of HTML code. There is an optional second argument to set the indentation
 * type; it defaults to a tab character but you may wish to set it to spaces. 
 */
export function translateElementsToImperativeCode(node: Node, indentType: string = "\t"): string {
	if (typeof node === "string") node = document.createRange().createContextualFragment(node);
	let result = "";
	if (node instanceof DocumentFragment) {
		//for (const child of node.childNodes) { // not backwards compatible with Internet Explorer.
		for (let i: number = 0; i < node.childNodes.length; i++) { const child = node.childNodes[i];
			if (child instanceof Text) {
				const text = convertTextNode(child);
				if (text != null) result += text + ",\n";
			} else if (child instanceof Element) {
				result += convertElementsRecursively(child, 0, indentType);
			}
		}
	} else if (node instanceof Text) {
		const text = convertTextNode(node);
		if (text != null) result += text + ",\n";
	} else if (node instanceof Element) {
		result += convertElementsRecursively(node, 0, indentType);
	}
	return result.replace(/,\n$/, "");
}
