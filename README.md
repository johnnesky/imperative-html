
# imperative-html

*imperative-html* is a small JavaScript library for creating HTML (and SVG) elements in a web browser. It improves on the standard [`document.createElement()` API](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement), allowing you to create elements, assign attributes, and append children in a manner that resembles writing HTML but with JavaScript's syntax. 

For example, you could run this JavaScript expression:

```javascript
section(
  h2("Title"),
  img({src: "persuasive-diagram.png"}),
  p(
    "Claim. ",
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
  <img src="persuasive-diagram.png"/>
  <p>
    Claim.
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
  * [Updating Elements](#updating-elements)
  * [Naming Elements](#naming-elements)
  * [Nested Languages](#nested-languages)
  * [Translation](#translation)
  * [NPM Support](#npm-support)
  * [TypeScript Support](#typescript-support)
  * [Internet Explorer Support](#internet-explorer-support)
  * [About](#about)

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

As the name *imperative-html* [implies](https://en.wikipedia.org/wiki/Imperative_programming), it's not enough to declare elements, unlike HTML. You must also tell the browser what to do with them. You probably want to append them to an existing element in the [DOM](https://www.w3schools.com/js/js_htmldom.asp), like:

```javascript
document.body.appendChild(h1("Welcome."));
```

To make this easier, *imperative-html* also provides a function in the global scope called `replaceScriptWith()` that allows you to insert one or more elements into the DOM in place of the element that contains your code, like this:

```html
<p>
  Welcome back,
  <script>
    replaceScriptWith(
      a({href: "/user/" + username},
        img({src: "/avatar/" + username + ".jpg"}),
        displayName,
      ),
    );
  </script>
</p>
```

Of course, you can use JavaScript's powers of abstractions to define a reusable HTML widget inside a function and insert it wherever you want, like this:

```html
<p>
  Welcome back,
  <script>
    replaceScriptWith(makeUserLink());
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
    for (var i = 1; i <= 10; i++) {
      yield div(i * i);
    }
  },
)
```

If you pass a literal [{object}](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer) as an argument, instead of being appended to the element as a child, it will be used for setting attributes on the new element. Write the attribute names and values as you would in HTML:

```javascript
label({class: "box", for: "usernameInput", "data-size": 100})
```

You can always use strings for attribute values, but you can also provide other types for some attributes. The class attribute accepts arrays, the style attribute accepts literal {objects}, some attributes accept boolean values, event handlers accept functions, and you can use numbers in place of strings as long as you don't need a unit like "px" at the end:

```javascript
button({
  class: ["primary", "round"],
  style: {width: "100px", "line-height": 1.4},
  autofocus: true,
  onclick: () => alert("Hi!"),
})
```

## Updating Elements

*imperative-html* provides the global function `applyToElement` for applying additional arguments to existing elements, following the same rules as above:

```javascript
applyToElement(document.body,
  {contenteditable: true},
  "Now you're in control!",
);
```

For the sake of simplicity, *imperative-html* does not come with any mechanism to automatically update the display in response to changes in your data model. However, if you know that an element will need to be updated, you can assign it to a variable:

```javascript
var counter = 0;
var counterDisplay = span(counter);
function increment() {
  counter++;
  counterDisplay.textContent = counter;
}
setInterval(increment, 1000);
replaceScriptWith(
  p(
    "You have been looking at this page for ",
    counterDisplay,
    " seconds.",
  ),
);
```

## Naming Elements

All of the standard HTML and SVG element types are supported, and you can also create custom elements. Note that in HTML, [custom elements are supposed to have at least one hyphen in the name](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements), like `<my-element></my-element>`.  Unfortunately, JavaScript doesn't allow hyphens in names because they would be interpreted as minus signs, so instead *imperative-html* allows you to use camelCase or snake_case symbols, and it will automatically convert them to kebab-case for you:

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

Note that if your viewers are using Internet Explorer, attempting to create custom elements with *imperative-html* will not work, nor will it degrade gracefully. If you want to support Internet Explorer, or you just want to receive error messages if you mistype an element name, you can instead load a strict version of *imperative-html* that does not include support for custom elements:

```html
<script src="https://cdn.jsdelivr.net/npm/imperative-html@0.1/dist/global/elements-strict.min.js"></script>
```

## Nested Languages

In some cases, you may find it easier to write HTML without converting it to JavaScript, but you are already *in* JavaScript. In that case, you can directly call the `HTML` symbol as a function and pass in text formatted as HTML. It will return a [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment) that can be appended to any element:

```javascript
div(HTML(`
  <p>Here's some HTML I copied from the internet.</p>
`))
```

This allows you to get around a limitation of HTML, which is that HTML documents are generally not allowed to load HTML fragments from other files. Using *imperative-html*, however, you can easily share common HTML code across multiple web pages, which could be useful in simple static websites. For example, you can write some HTML footer code in a JavaScript file, and then load it at the bottom of every page on your site like this:

```javascript
// footer.js
replaceScriptWith(HTML(`
  <footer>©20XX Your Name</footer>
`));
```

```html
<script src="/footer.js"></script>
```

It is also possible to continue alternating languages as you go deeper, although you have to be careful about syntax:

```html
<script>
  // This whole script collapses into a text node!
  replaceScriptWith(
    HTML(`
      <script>
        replaceScriptWith(
          HTML.script(
            "replaceScriptWith('We need to go deeper!');"
          )
        );
      </scr` + /* avoid ending outer script early! */ `ipt>
    `)
  );
</script>
```

The `SVG` symbol can also be called as a function to convert SVG text to elements in the same way.

## Translation

Of course, if you ever want to convert elements that you created with *imperative-html* into a normal HTML string, you can always use [`.outerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML):

```javascript
input({type: "checkbox"}).outerHTML; // returns <input type="checkbox">
```

There's also a separate helper script you can load that provides a function to translate from HTML to *imperative-html* code:

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

*imperative-html* generally supports Internet Explorer, aside from custom element names [as noted above](#naming-elements). Future versions of *imperative-html* might not support Internet Explorer, but if you specify the current version number when you load the script [as instructed](#getting-started), then your page will continue to load this version and will be safe from breaking changes.

Note that many features of modern JavaScript do not work in Internet Explorer, including features used in the code samples here, so if you need to support it, make sure to transpile your own code using something like [Babel](https://babeljs.io/) or [TypeScript](https://www.typescriptlang.org/). Fortunately, only about 2% of all internet traffic still comes from Internet Explorer at this time, so if you're not a commercial business and you're not sure if you need to worry about it, you probably don't. 

## About

I originally created this library as part of my [BeepBox](https://github.com/johnnesky/beepbox) project, but I found it so useful, I wanted to be able to use it in other projects too. Frankly, something like it ought to be a standard JavaScript library, so I decided to clean it up, add testing and documentation, and publish it for all to use.

If you find *imperative-html* valuable and have the means, any gratuity via [PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=QZJTX9GRYEV9N&currency_code=USD) would be appreciated!
