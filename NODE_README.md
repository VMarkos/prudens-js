# README
Important notes about `prudens` npm package.

## Installation
To install `prudens` for your current project, move to your project's root directory and run:
```
npm install prudens
```

## Policy Parsing
`prudens` provides two functions to parse contexts and policies from Prudens's language.

### `parseKB(policyString)`
Accepts a policy string and returns a policy JSON object of the following form:
```javascript
{
    type: "output",
    kb: kbObject,
    constraints: kbConstraints,
    code: kbCode,
    customPriorities: customPriorities,
    imports: imports,
    warnings: warnings,
}
```
in case the policy string is syntactically valid. Otherwise, it returns a JSON object as follows:
```javascript
{
    type: "error",
    name: "ErrorName",
    message: "ErrorMessage",
}
```
For more on Prudens's internal data structures, see [here](https://github.com/VMarkos/prudens-js#data-structure).

### `parseContext(contextString)`
Accepts a context string and returns a context JSON object of the following form:
```javascript
{
    type: "output",
    context: contextList,
}
```
in case the context string is syntactically valid. Otherwise, it returns a JSON object as follows:
```javascript
{
    type: "error",
    name: "ErrorName",
    message: "ErrorMessage",
}
```
Again, for more on Prudens's internal data structures, see [here](https://github.com/VMarkos/prudens-js#data-structure).

## Deduction
`prudens` provides one main forward reasoning function and two complementary functions, as described below.

### `forwardChaining(kbObject, context, priorityFunction=linearPriorities)`
Accepts a policy object, a context and optionally a rule prioritization function and returns as JSON object of 
the following form:
```javascript
{
    context: context,
    facts: facts,
    graph: graph,
    dilemmas: dilemmas,
    defeatedRules: defeatedRules,
}
```
In the above:
* `context` is the initially provided context;
* `facts` is a context-like shaped JSON object that contains the initial context and all facts that may have been inferred during the reasoning process;
* `graph` is a JSON object with `facts` (i.e., their string representations) as keys and lists of all rules that have led to each fact being inferred as values;
* `dilemmas` is a lists of lists, each of which contains three objects:
    - `rule1`, which is the first of the two rules leading to the dilemma;
    - `rule2`, which is the second of the two rules leading to the dilemma;
    - `sub`, which is the substitution used at the time of the dilemma (applies only to relational theories);
* `defeatedRules` is a list of all rules that have been defeated during the reasoning process by conflicting rules of higher priority.

### `linearPriorities(rule1, rule2, kbObject, sub)`
Accepts two rules, a policy object and a substitution object and returns `true` if and only if `rule1` appears after `rule2` in `kbObject`. This function is used as the default priority function in `forwardChaining`.

For more on custom priority functions, see [here](https://github.com/VMarkos/prudens-js/releases/tag/v0.8.3).

### `specificityPriorities(rule1, rule2, kbObject, sub)`
Accepts two rules, a policy object and a substitution object and returns `true` if and only if `rule1` has a more specific body that `rule2` under `sub`. If the inverse is true, it returns `false`, otherwise it returns `undefined`.

Again, for more on custom priority functions, see [here](https://github.com/VMarkos/prudens-js/releases/tag/v0.8.3).

## A Toy Example
The following script demonstrates a simple case of use of `prudens`'s basic functions:
```javascript
const prudens = require("./prudens");
const parsers = require("./parsers");

function main() {
    const policy = `@KnowledgeBase
        R1 :: a implies b;`;
    const context = "a;";
    const kbObject = parsers.parseKB(policy);
    const contextObject = parsers.parseContext(context)["context"];
    const output = prudens.forwardChaining(kbObject, contextObject);
    console.log(output);
}

main();
```

Assuming that the above is named `test.js` then `node test.js` would print on the terminal the followin:

```javascript
{
  context: [
    {
      name: 'a',
      sign: true,
      isJS: false,
      isEquality: false,
      isInequality: false,
      isAction: false,
      args: undefined,
      arity: 0
    }
  ],
  facts: [
    {
      name: 'a',
      sign: true,
      isJS: false,
      isEquality: false,
      isInequality: false,
      isAction: false,
      args: undefined,
      arity: 0
    },
    {
      name: 'true',
      sign: true,
      isJS: false,
      isEquality: false,
      isInequality: false,
      isAction: false,
      args: undefined,
      arity: 0
    },
    {
      name: 'b',
      sign: true,
      isJS: false,
      isEquality: false,
      isInequality: false,
      isAction: false,
      args: undefined,
      arity: 0
    }
  ],
  graph: { b: [ [Object] ] },
  dilemmas: [],
  defeatedRules: []
}
```
