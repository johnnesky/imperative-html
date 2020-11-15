
# imperative-html

*imperative-html* is a small JavaScript library for creating HTML (and SVG) elements in a web browser. It largely serves as a replacement for the standard [`document.createElement()` API](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement), allowing you to more easily create elements, assign attributes, and append children in a manner that resembles writing HTML but with JavaScript's syntax. 

For example, you could run this JavaScript expression:

```javascript
section(
  h2("Title"),
  p(
    "Claim. ",
    img({src: "persuasive-diagram.png"}),
    a({href: "https://example.com"},
      "Link to supporting evidence. ",
    ),
    "Conclusion. ",
  ),
)
```

And it would return a fully instantiated DOM element as if you had written:

```html
<section>
  <h2>Title</h2>
  <p>
    Claim.
    <img src="persuasive-diagram.png"/>
    <a href="https://example.com">
      Link to supporting evidence.
    </a>
    Conclusion.
  </p>
</section>
```

It doesn't take long to get used to writing HTML elements in JavaScript like this, and the advantage is that you can use all of JavaScript's language features to automate stuff that would be difficult to write by hand.

## Table of Contents
  * [Getting Started](#getting-started)
  * [Adding to the DOM](#adding-to-the-dom)
  * [Arguments](#arguments)
  * [Naming Convention](#naming-convention)
  * [Translation](#translation)
  * [NPM Support](#npm-support)
  * [TypeScript Support](#typescript-support)
  * [Internet Explorer Support](#internet-explorer-support)

## Getting Started

To use it, copy and paste this script near the top of your HTML page:

```html
<script src="https://cdn.jsdelivr.net/npm/imperative-html@0.1/dist/global/elements.min.js"></script>
```

The script adds the symbols `HTML` and `SVG` to the global scope, and you can call functions such as `HTML.div()` on them to create elements. If you want to create multiple similar elements and you don't want to have to write `HTML.` before each element name, you can easily make shortcuts [in modern JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) for whatever element names you plan to use like this:

```javascript
HTML.div(); // returns <div></div>
var {section, h1, h2, p, img, a, div} = HTML;
div();      // returns <div></div>
```

## Adding to the DOM

As the name *imperative-html* [implies](https://en.wikipedia.org/wiki/Imperative_programming), it's not enough to declare elements, unlike HTML. You must also tell the browser what to do with them. You probably want to append them to an existing element in the DOM, like:

```javascript
document.body.appendChild(h1("Welcome."));
```

To make this easier, *imperative-html* also provides a function in the global scope called `replaceScriptWith()` that allows you to insert one or more elements into the DOM in place of the element that contains your code, like this:

```html
<p>
  Welcome back,
  <script>
    replaceScriptWith(
      img({src: "/avatar/" + username + ".jpg"}),
      a({href: "/user/" + username}, displayName),
    );
  </script>
</p>
```

## Arguments

*imperative-html*'s element functions accept any number of arguments, and they will be appended as children to the new element in the provided order. If you pass string or number arguments, they will be converted to text nodes and appended. If you pass an array, everything in the array will be appended to the new element. If you pass a function, it will be called with no arguments and the result will be appended, which means you don't even need to put parentheses after a child element name if it's going to be empty:

```javascript
p("Hello...", br, br, br, "...World!")
```

 You can even use [generators in modern JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*):

```javascript
div(
  "The first 10 squares are: ",
  function*() {
    for (var i = 0; i < 10; i++) {
      yield div(i * i);
    }
  },
)
```

If you pass a literal {object} as an argument, instead of being appended to the element as a child, it will be used for setting attributes on the new element. Write the attribute names and values as you would in HTML:

```javascript
div({class: "box", id: "primaryBox", "data-size": 10})
```

The class attribute also accepts arrays of strings, the style attribute also accepts object literals, some attributes accept boolean values, and event handlers accept functions. 

```javascript
div({
  class: ["box", "round"],
  style: {background: "white"},
  hidden: true,
  onclick: () => alert("Hi!"),
})
```

*imperative-html* also provides a global function to apply arguments in the same manner to existing elements:

```javascript
applyToElement(document.body, "Now you're in control!", {contenteditable: true});
```

## Naming Convention

All of the standard HTML and SVG element types are supported, and you can also create custom elements. Note that in HTML, [custom elements are supposed to have at least one hyphen in the name](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements), like `<my-element></my-element>`.  Unfortunately, JavaScript doesn't allow hyphens in names because they would be interpreted as a minus sign, so instead *imperative-html* allows you to use camelCase or snake_case symbols, and it will automatically convert them to kebab-case for you:

```javascript
HTML["my-element"](); // returns <my-element></my-element>
HTML.myElement();     // returns <my-element></my-element>
HTML.my_element();    // returns <my-element></my-element>
```

Some standard SVG element names have capital letters or hyphens, so for those you should use the same capitalization and write underscores instead of hyphens:

```javascript
SVG.linearGradient(); // returns <linearGradient></linearGradient>
SVG.color_profile();  // returns <color-profile></color-profile>
```

There are also a couple standard element names that are reserved in JavaScript, but you can refer to them in various ways:

```javascript
// Calling the var method directly:
HTML.var(); // returns <var></var>

// Renaming it to a valid JavaScript symbol name:
var htmlVar = HTML.var;
htmlVar(); // returns <var></var>
// or via destructuring:
var {var: htmlVar} = HTML;
htmlVar(); // returns <var></var>

// The same options are available for SVG's switch:
SVG.switch(); // returns <switch></switch>
```

Note that if your viewers are using Internet Explorer, using *imperative-html* to create custom elements will not work, nor will it gracefully degrade. If you want to support Internet Explorer, or you just want to receive error messages if you mistype an element name, you can instead load a strict version of *imperative-html* that does not include support for custom elements:

```javascript
<script src="https://cdn.jsdelivr.net/npm/imperative-html@0.1/dist/global/elements-strict.min.js"></script>
```

## Translation

In some cases, you may find it easier to write HTML without converting it to JavaScript, but you are already *in* JavaScript. In that case, you can directly call the `HTML` symbol as a function and pass in text formatted as HTML. It will return a [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment) that can be appended to any element:

```javascript
div(HTML(`
  <p>Here's some HTML I copied from the internet.</p>
`))
```

There's also a separate helper script you can load that provides a function to translate from HTML to JavaScript:

```html
<script src="https://cdn.jsdelivr.net/npm/imperative-html@0.1/dist/global/translator.min.js"></script>
```

This script adds the function `translateElementsToImperativeCode()` to the global scope. You can pass either an HTML string or an instantiated element as the first argument, and optionally a whitespace indentation string as the second argument, and it'll return a string containing JavaScript code that would generate the same HTML:

```javascript
translateElementsToImperativeCode(div());
// -> "HTML.div()"
translateElementsToImperativeCode('<a href="#">Here</a>', "  ");
// -> `HTML.a({href: "#"},
//      "Here",
//    )`
```

## NPM Support

*imperative-html* requires a browser to run, so it can't be used as a server-side html template renderer. However, you may want to bundle it in your client-side code. You can add it to an [NPM](https://www.npmjs.com/) project like this:

```shell
npm install imperative-html
```

The code is distributed in the [ES module format](https://nodejs.org/api/esm.html), and you can import it like this:

```javascript
import {HTML, SVG, applyToElement} from "imperative-html";
// or:
import {HTML, SVG} from "imperative-html/dist/esm/elements-strict";
import {translateElementsToImperativeCode} from "imperative-html/dist/esm/translator";
```

## TypeScript Support

The NPM package includes type declarations for [TypeScript](https://www.typescriptlang.org/). You can import it in TypeScript using the same import statements as above. In fact, the code was written in TypeScript.

## Internet Explorer Support

*imperative-html* generally supports Internet Explorer, aside from custom element names [as noted above](#naming-convention). Future versions of *imperative-html* might not support Internet Explorer, but if you specify the current version number when you load the script [as instructed](#getting-started), then your page will continue to load this version and will be safe from breaking changes.

Note that many features of modern JavaScript do not work in Internet Explorer, including features used in the code samples here, so if you need to support it, make sure to transpile your own code using something like [Babel](https://babeljs.io/) or [TypeScript](https://www.typescriptlang.org/). Fortunately, only about 2% of all internet traffic still comes from Internet Explorer at this time, so if you're not a commercial business and you're not sure if you need to worry about it, you probably don't. 
