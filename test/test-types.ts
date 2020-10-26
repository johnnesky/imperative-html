import {HTML, SVG, replaceScriptWith, applyToElement} from "../";

{let _: DocumentFragment = HTML();}
{let _: DocumentFragment = HTML("<div class=\"container\">Hello World!</div>");}
{let _: DocumentFragment = HTML("<div class=\"container\">", "Hello World!", "</div>");}
{let _: DocumentFragment = SVG();}
{let _: DocumentFragment = SVG("<g class=\"container\"/>");}
{let _: DocumentFragment = SVG("<g class=\"container\">", "<circle/>", "</g>");}

{let _: HTMLDivElement = HTML.div();}
{let _: HTMLAnchorElement = HTML.a();}
{let _: HTMLScriptElement = HTML.script();}
{let _: HTMLInputElement = HTML.input();}
{let _: SVGSVGElement = SVG.svg();}
{let _: SVGAElement = SVG.a();}
{let _: SVGFEComponentTransferElement = SVG.feComponentTransfer();}

{let _: HTMLElement = HTML.fakeelement();}
{let _: HTMLElement = HTML.customElement();}
{let _: SVGElement = SVG.fakeelement();}
{let _: SVGElement = SVG.camelCaseElement();}
{let _: SVGElement = SVG["kebab-case-element"]();}

{let _: HTMLDivElement = HTML.div(
	{class: "container"},
	HTML.hr,
	"Hello World!",
	function*() { yield 3; },
	["a", "b"],
	document.createElement("a"));}

replaceScriptWith(
	{class: "container"},
	HTML.hr,
	"Hello World!",
	function*() { yield 3; },
	["a", "b"],
	document.createElement("a"));
	
{let _: Node = applyToElement(
	HTML.div(),
	{class: "container"},
	HTML.hr,
	"Hello World!",
	function*() { yield 3; },
	["a", "b"],
	document.createElement("a"));}
	
{let _: HTMLElement = applyToElement(HTML.div());}
{let _: SVGElement = applyToElement(SVG.g());}
{let _: DocumentFragment = applyToElement(HTML());}
