// Copyright (C) John Nesky, distributed under the MIT license.

export function applyElementArgs<T extends HTMLElement | SVGElement | DocumentFragment>(element: T, args: Array<any>): T {
	for (const arg of args) {
		if (arg instanceof Node) {
			element.appendChild(arg);
		} else if (typeof arg === "string") {
			element.appendChild(document.createTextNode(arg));
		} else if (typeof arg === "function") {
			applyElementArgs(element, [arg()]);
		} else if (Array.isArray(arg)) {
			applyElementArgs(element, arg);
		} else if (arg && typeof Symbol !== "undefined" && typeof arg[Symbol.iterator] === "function") {
			applyElementArgs(element, [...arg]);
		} else if (arg && arg.constructor === Object && element instanceof Element) {
			// If the argument is a literal {} Object
			for (const key of Object.keys(arg)) {
				const value = arg[key];
				/*if (key === "classList") {
					if (typeof value === "string") {
						element.classList.add(...value.split(" "));
					} else if (Array.isArray(arg) || (value && typeof Symbol !== "undefined" && typeof value[Symbol.iterator] === "function")) {
						element.classList.add(...value);
					} else {
						console.warn("Invalid classList value \"" + value + "\" on " + element.tagName + " element.");
					}
				} else*/ if (key === "class" /* || key === "className" */) {
					if (typeof value === "string") {
						element.setAttribute("class", value);
					} else if (Array.isArray(arg) || (value && typeof Symbol !== "undefined" && typeof value[Symbol.iterator] === "function")) {
						element.setAttribute("class", [...value].join(" "));
					} else {
						console.warn("Invalid " + key + " value \"" + value + "\" on " + element.tagName + " element.");
					}
				} else if (key === "style") {
					if (value && value.constructor === Object) {
						for (const styleKey of Object.keys(value)) {
							if (styleKey in (<HTMLElement | SVGElement>element).style) {
								// In practice, camelCase and kebab-case properties both work as properties on CSSStyleDeclaration objects.
								(<any> element).style[styleKey] = value[styleKey];
							} else {
								// CSS variables start with -- and must be set with setProperty.
								(<HTMLElement | SVGElement>element).style.setProperty(styleKey, value[styleKey]);
							}
						}
					} else {
						element.setAttribute(key, value);
					}
				} else if (typeof(value) === "function") {
					// If value is a callback, set as a property instead trying to coerce to string.
					(<any>element)[key] = value;
				} else if (typeof(value) === "boolean") {
					// If value is boolean, set attribute if true, remove if false.
					if (value) element.setAttribute(key, "");
					else element.removeAttribute(key);
				} else {
					// Default to setting attribute, as if writing html directly.
					element.setAttribute(key, value);
				}
			}
		} else {
			// Just convert unrecognized objects to text and append them.
			element.appendChild(document.createTextNode(arg));
		}
	}
	return element;
}

export const svgNS: string = "http://www.w3.org/2000/svg";

export function parseHTML(...args: Array<any>): DocumentFragment {
	return document.createRange().createContextualFragment(args.join());
}

//let svgParser: SVGSVGElement | null = null;
export function parseSVG(...args: Array<any>): DocumentFragment {
	const fragment: DocumentFragment = document.createDocumentFragment();
	
	// Internet Explorer doesn't support the first method here, so I commented it out and used a slightly more complex one involving DOMParser below.
	/*
	if (svgParser === null) svgParser = <SVGSVGElement>document.createElementNS(svgNS, "svg");
	svgParser.innerHTML = args.join();
	while (svgParser.firstChild !== null) fragment.appendChild(svgParser.firstChild);
	*/
	const svgParser: Element = new DOMParser().parseFromString("<svg xmlns=\"http://www.w3.org/2000/svg\">" + args.join() + "</svg>", "image/svg+xml").documentElement;
	while (svgParser.firstChild !== null) {
		document.importNode(svgParser.firstChild, true);
		fragment.appendChild(svgParser.firstChild);
	}
	
	return fragment;
}

export function replaceScriptWith(...args: Array<any>): void {
	let currentScript: HTMLScriptElement | SVGScriptElement | null = document.currentScript;
	if (currentScript == null) { // double-equals to intentionally include undefined in Internet Explorer.
		
		// Internet Explorer doens't support currentScript, try this method instead:
		if (document.readyState === "loading") {
			const scripts: HTMLCollectionOf<HTMLScriptElement> = document.getElementsByTagName("script");
			currentScript = scripts[scripts.length - 1];
		}
		
		if (currentScript == null) {
			console.warn("Couldn't replace script because no script is currently being parsed and executed, maybe this is happening in a callback function or event handler instead?");
			return;
		}
	}
	if (currentScript.parentNode === null) {
		console.warn("Couldn't replace script element because it is not attached to a parent anymore, did you try to replace the same script more than once?");
		return;
	}
	currentScript.parentNode.replaceChild(applyElementArgs(document.createDocumentFragment(), args), currentScript);
}

export function applyToElement<T extends HTMLElement | SVGElement | DocumentFragment>(element: T, ...args: Array<any>): T {
	if (!(element instanceof Element || element instanceof DocumentFragment)) {
		console.warn("Couldn't apply to provided argument because it's not an element or DocumentFragment.");
		return element;
	}
	return applyElementArgs(element, args);
}
