# README
Important notes about the node implementation of Prudens.

For more details regarding Prudens and its implementation, see [https://github.com/VMarkos/prudens-js/blob/main/README.md](here).

## Package Contents
The package contains three files, as follows:
* `prudens.js` contains all reasoning-related functionality regarding Prudens;
* `parsers.js` contains all parsing-related functionality to and from Prudens's declarative language;
* `prudensUtils.js` contains any utility functions used in the above two scripts.

## Exports
### `prudens` exports
`prudens.js` exposes the following functions:
* `forwardChaining`, which, given a KB object and a context object returns a graph object, as described [https://github.com/VMarkos/prudens-js/blob/main/README.md](here). Also, this funciton accepts an optional argument, regarding the priorities scheme used durng reasoning;
* `linearPriorities`, which is the default rule prioritization scheme;
* `specificityPriorities`, which is a broader prioritization scheme than the default one (see [https://github.com/VMarkos/prudens-js/releases/tag/v0.8.3](here) for more).

### `parsers` exports
`parsers.js` exposes the following functions:
* `parseKB`, which, given a policy string, returns the corresponding KB object;
* `parseContext`, which, given a context string, returns the corresponding context object. **Remark**: The `"context"` field of this function's output should be passes as an input to `forwardChaining` function and not the output JSON object itself;
* `literalToString`, given a literal JSON object, it returns the corresponding string representation;
* `kbToString`, given a policy JSON object, it returns the corresponding string representation;
* `listOfLiteralsToString`, given a list of literal JSON objects, it returns the corresponding string representation;
* `contextToString`, given a context JSON object, it returns the corresponding string representation;
* `graphToString`, given a graph JSON object, it returns the corresponding string representation;
* `dilemmasToString`, given a dilemmas JSON object, it returns the corresponding string representation.

For more on Prudens's data structure, see [https://github.com/VMarkos/prudens-js/blob/main/README.md](here).

### `prudensUtils` exports
`prudensUtils.js` exposes the following functions:
* `deepIncludes`, which, given a list and a JSON object decides whether the former contains the latter in terms of deep equality (i.e., all object parameters are recursively equal);
* `deepCopy`, which, given a JSON object returns a deep copy of it.

## Example Use
Below you may see a simple script that uses Prudens as a node package:
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