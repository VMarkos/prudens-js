# Prudens JS
A full implementation of Prudens in Javascript alongside a simple UI and the corresponding documentation.

For the corresponding UI: https://vmarkos.github.io/prudens-js/index.html

For the `npm` package documentation, see [here](https://github.com/VMarkos/prudens-js/blob/main/NODE_README.md).

# TL;DR
1. Deduction: see [this function](#forwardChainingkb-context).
2. Abduction: see [this function](#prioritizedPropositionalAbductionkb-context-finalTarget).
3. Induction: Update your knowledge base accordingly - see [here](#data-structure) for more on data structures in Prudens JS.

# Data Structure
All interaction within the scope of Prudens JS is conducted based on JSON representations of knowledge bases, rules, literals and variables. In this section we present in detail the properties of each of these separately.

## Variables
A variable is a JSON object of the following form:
```javascript
{
    index: i,
    name: "nameString",
    isAssignued: true/false,
    value: "valueString",
    muted: true/false,
    isExpression: true/false,
    isList: [beta feature],
    list: [beta feature],
}
```
In the above, `index` corresponds to the index in the arguments' list of a predicate in which the corresponding variable appears. `name` and `value` correspond to the strings that serve as the name and, possibly, the value of the variable, while `isAssigned` is a boolean field which is `true` in case `value` is not `undefined` or `null`. Lastly, `muted` is another boolean parameter which corresponds to whether a variable has been declared as redundant in some case - i.e., using the `_` symbol in Prudens's syntax.

## Literals
A literal is a JSON object of the following form:
```javascript
{
    name: "nameString",
    sign: true/false,
    isJS: true/false,
    isEquality: true/false,
    isInequality: true/false,
    isAction: true/false,
    args: [var1, var2,..., varN],
    arity: N,
}
```
In the above, `name` is the string corresponding to a predicate's name, `sign` is the lliteral's sign - i.e. `false` when negated, `true` otherwise - and `isJS`, `isEquality`, `isInequality`, `isAction` are boolean parameters indicating whether a predicate is declared as a javascript function, as an equality operator, as an inequality operator or as an action operator. `args` is a list of arguments, with each argument being a [variable]{#variables} as described above and `arity` is merely the length of `args`. In the case of a propositional literal, `args` is always `undefined` and `arity=0`.

## Rules
A rule is a JSON object of the following form:
```javascript
{
    name: "nameString",
    body: [lit1, lit2,..., litN],
    head: headLiteral,
}
```
In the above, `name` is a string containing the rule's name, `body` is a list of literals as described above and `head` is a single literal corresponding to the rule's head.

## Knowledge base
A knowledge base is JSON array of the following form:
```javascript
[rule1, rule2,..., ruleN]
```
In the above, each item in the list is a rule as described above.

## Substitutions
A substitution is a JSON object of the following form:
```javascript
{
    var1: val1,
    var2: val2,
    ...,
    varN: valN,
}
```
Both `val` and `var` are strings that correspond to the value and the name of a [variable](#variables) respectively.

## Graphs
A graph is a JSON object that corresponds to an Inference Graph and has the following form:
```javascript
{
    graph: {
        f1: [rule11, rule12,..., rule1n],
        f2: [rule21, rule22,..., rule2m],
        ...,
        fN: [ruleN1, ruleN2,..., ruleNz],
    },
    context: [lit1, lit2,..., litN],
    facts: [lit1, lit2,..., litN],
    dilemmas: [
        [rule11, rule12, sub1],
        [rule21, rule22, sub2],
        ...,
        [ruleN1, ruleN2, subN],
    ],
    defeatedRules: [
        {"defeated": rule11, "by": rule12, "sub": sub1},
        {"defeated": rule21, "by": rule22, "sub": sub2},
        ...,
        {"defeated": ruleN1, "by": ruleN2, "sub": subN},
    ],
}
```
In the above, `f`'s are all string representations of literals and each one of them is assigned a list of rules that infer them in an inference graph. Actually, the `graph` field of a graph is a dictionary representing a graph with its node's as keys and the directed edges terminating to these nodes as values. It is important to nore that rules in the aforementioned lists are included as strings and not as JSON objects &mdash; this may not persist through next releases.

Next, the `context` field correspond to the initial context provided to Prudens while `facts` correspond to the full list of inferred facts. `dilemmas` is an array of arrays of the form:

```javascript
[rule1, rule2, sub]
```

implying that `rule1` and `rule2`, when `sub` is applied, lead to a dilemma &mdash; of course, `sub` concerns only first order rules.

Finally, `defeatedRules` corresponds to a list of rules that have been activated and defeated by rules of higher priority during the reasoning process. Is is an array of JSON objects of the following form:

```javascript
{"defeated": rule1, "by": rule2, "sub": sub}
```

As indicated by the corresponding field names, the above is interpreted as "`rule2` defeats `rule1` under `sub`".

# Utility functions
`prudensUtils.js` provides a set of Prudens-specific functions that are used in most other scripts. Almost all of them allow for easier and more sound computations using Prudens's native data structures while they also provide some deeper level functionality that vanilla javascript does not support.

1. `deepCopy(object)`: This function accepts a javascript object and returns a deep copy of it. Since it is used in two very specific occasions, its implementation is not generic and returns a level 1 deep copy - i.e., in case a field of `object` is an object it self, its reference is copied and not the values of its fields. This function is planned to be deprecated in next versions of Prudens JS, so it is suggested no to build anything using it.
2. `removeAll(list, toBeRemoved)`: This function accepts as arguments two lists - `list` and `toBeRemoved` - and removes all elements of the second one from the first. It does not require that all elements of `toBeRemoved` are present in `list`, so it actually performs a set theoretic subtraction.
3. `deepEquals(x, y)`: This function accepts as arguments two objects or primitives (actually, anything in javascript's universe) and examines whether they are equal in a deep sense. That is, in case they are primitives, it returns `true` in case they have the same value while if they are not primitives, it recursively examines whether all their fields are equal in the sense defined above and returns `true` or `false` accordingly.
4. `arrayDeepEquals(x, y)`: Deprecated function that examines whether two arrays are equal in the sense `deepEquals` does - not used in this version, to be removed with next one.
5. `deepIncludes(object, list)`: Deep counterpart of javascript's native `Array.prototype.includes()`. It examines whether `list` contains `object` - which shall not necessarily be an object, but, if not, `Array.prototype.includes()` should be used instead - using `deepEquals`.

# Parsing
```diff
@@ Dependencies @@
! prudensUtils.js
! prudens.js
```
In this section we describe the functions that allow for string input to be parsed in the form described above. We also describe the functionality provided by Prudens JS so as to reconstruct a rule's/literal's string representation from the corresponding JSON object. All functions discussed below may be found in `parsers.js`.

## `parseContext(context)`
This function allows parsing a string, namely `context`, into a context Object - i.e., a JSON Object that represents a context within Prudens JS. The function may return either a valid context object or an error object.

### Valid contexts
In case `context` passes successfully all syntactical checks, `parseContext()` will return on object with the following struture:
```javascript
{
    type: "output",
    context: [literal1, literal2,..., literalN],
}
```
In the above, `literal1, literal2,..., literalN` are literals as described [here](#data-structure). Bear in mind that `parseContext` allows for **empty** lists to be considered valid contexts since there might be occasions - e.g., abduction, as we shall see further below - where empty contexts may be allowed. So, you may need to perform consistency checks regarding whether a context returned by `parseContext` is empty or not yourself.

### Invalid contexts
In case `context` fails to pass some syntactical check, the following object is returned:
```javascript
{
    type: "error",
    name: "ErrorName",
    message: "ErrorMessage",
}
```
The field `name` corresponds to the error's name and `message` contains a (usually) more detailed description of what has gone wrong.

## `parseTargets(targets)`
This function allows parsing a string, namely `targets`, which corresponds to a list of literals that are intended to be used as targets in some inference process. Its functionality is almost identical to `parseContext` with the execption that in this case, action literals are allowed - i.e., they pass all syntactical checks. Remarkably, this functions allows for negated action literals as well, in case they come in handy in some occasion.

### Valid targets
In case `targets` passes all syntactical checks, then an object like the following one is returned:
```javascript
{
    type: "output",
    targets: [target1, target2,..., targetN],
}
```
In the above, `target1, target2,..., targetN` are literals as described [here](#data-structure). As we have discussed above, a targets list may contain action literals, which is what differentiates it from a context.

### Invalid targets
In case `targets` fails to pass some syntactical check, the following object is returned:
```javascript
{
    type: "error",
    name: "ErrorName",
    message: "ErrorMessage",
}
```
The field `name` corresponds to the error's name and `message` contains a (usually) more detailed description of what has gone wrong.

## `parseKB(kb)`
This function allows parsing a string, namely `kb`, which corresponds to a list of rules as described [here](#Data-Structure), and returns the corresponding knowledge base, in case `kb` passess successfully all syntactical checks.

### Valid knowledge bases
In case `kb` passes all syntactical checks then an object like the following one is returned:
```javascript
{
    type: "output",
    kb: [rule1, rule2,..., ruleN],
    code: "codeString",
    imports: "importsString",
    warnings: [warning1, warning2,..., warningN],
}
```
In the above, `rule1, rule2,..., ruleN` are all rules as described [here](#data-structure). `codeString` is a string of javascript code (no validity checks are performed as far as this release is concerned) which may contain custom predicates and/or functions that are used for several reasons. Similarly, `importsString` is a string which contains any imports needed for some function(s) contained in `codeString`. Both `codeString` as well as `importsString` may well be empty in case no code is provided.

Regarding `warnings`, it is a list of warngings - see [below](#warnings) for more details on this. We should remark, however, that `warnings` may well be an empty list.

### Invalid knowledge bases
In case `kb` failse some syntcatical check, the following object is returned:
```javascript
{
    type: "error",
    name: "ErrorName",
    message: "ErrorMessage",
}
```
The field `name` corresponds to the error's name and `message` contains a (usually) more detailed description of what has gone wrong.

### Warnings
There are occasions when a knowledge base may pass successfully all syntactical checks, yet there might be non fatal errors - e.g., that no code/imports is included. In this case, a warning is returned along with the corresponding knowledge base object. Each warning has the following form:
```javascript
{
    type: "warning",
    name: "warningName",
    message: "warningMessage",
}
```
The field `name` corresponds to the warning's name and `message` contains a (usually) more detailed description of the warning.

## Other functions
Here we describe all the rest functions of `parsers.js` which support the functionalities described above. In all cases where it is applicable, the string input is assumed to be syntactically sound.
1. `kbToObject(kb)`: This function is usued within `parseKB` and is the function that actually transcribes a knowledge base from a string, here `kb`, to the corresponding JSON format. For more about the returned format, see [here](#data-structure).
2. `getRuleBody(bodyString)`: This function accepts as argument a string which corresponds to a rule's body and returns the corresponding list of literals. For more about the returned format, see [here](#data-structure). _To be deprecated in next versions_
3. `getRuleHead(headString)`: This function accepts as argument a string which corresponds to a rule's head and returns the corresponding literal. For more about the returned format, see [here](#data-structure). _To be deprecated in next versions_
4. `parseLiteral(literal)`: This function accepts as argument a string representing a literal and returns the corresponding literal. For more about the returned format, see [here](#data-structure).
5. `parseListOfLiterals(stringList)`: This function accepts as argument a list of strings and returns the corresponding list of literal objects.
6. `literalToString(literal)`: This function accepts as argument a JSON object which represents a literal and returns a string representation of that literal.
7. `ruleToString(rule)`: This function accepts as argument a JSON object which represents a rule and returns a string representation of that rule.
8. `kbToString(kb)`: This function accepts as argument a list of rules as JSON objects which represents a knowledge base and returns a string representation of that knowledge base.
9. `contextToString(context)`: This function accepts as argument a list of literals as JSON objects and returns a string representation of them. While its name is clearly related to contexts, it may be safely used with arbirtary lists of literals.
10. `contextToListOfStrings(context)`: This function accepts as argument a list of literals as JSON objects and returns a list of strings of these literals.
11. `listOfLiteralsToString(list)`: This function accepts as argument a list of literals _as strings_ and returns a string with each literal seperated from the rest by a semicolon, `;`.
12. `graphToString(graph)`: This function accepts as argument a graph JSON object - for more see [here](#deduction) - and returns a string representation of the graph as a dictionary with literals as keys and lists of rules that infer each literal.
13. `abductiveProofToString(proofs)`: This function accepts as argument a list of abductive proofs and returns a string with all abductive proofs, each contained in right-angle parentheses, `[`,`]`.

# Deduction
```diff
@@ Dependencies @@
! prudensUtils.js
! parsers.js
```

Regarding deduction, Prudens JS fully supports the reasoning mechanism as described [here](https://www.internetofus.eu/wp-content/uploads/sites/38/2021/05/Michael_2019_MachineCoaching.pdf). Below we present the functions of Prudens JS related to deduction, all found in `prudens.js`.

## Unification
Prior to presenting any functionality related to inference, we shall focus on the functions included in `prudens.js` that facilitate unification and any related operations.

### `unify(x, y)`
This function implements a simple unification check. That is, given two predicates, it examines if they are unifiable and, in case they are, it returns the most general unifier in the form of a substitution
```javascript
{
    var1: val1,
    var2: val2,
    ...,
    varN: valN,
}
```
If not it returns `undefined`. It is important to note that up to this version `unify` is *assymetric* in the sense that the second argument is assumed to be grounded - i.e., all it variables are assumed to be assigned. However, this is planned to change in future releases.

### `extendByFacts(literal, facts)`
Given a literal (grounded or not) and a set of grounded literals, it returns all the possible substitutions that could be constructed by unifying `literal` with all literals in `facts` - where unification is applicable. The output is always a list of substitutions - possibly empty - where each substitution has the following form:
```javascript
{
    var1: val1,
    var2: val2,
    ...,
    varN: valN,
}
```
In the above, all keys are some of the unassigned arguments of `x` - possibly all.

### `extend(sub, unifier)`
Given a substitution, `sub`, and a unifier, `unifier`, as returned from `unify`, it extends `sub` by appending to it any new substitutions, if any, appear in `unifier`. In case it successfully manages to do so, it returns an object of the form:
```javascript
{
    var1: val1,
    var2: val2,
    ...,
    varN: valN,
}
```
In case this is not possible - e.g., `sub` and `unifier` assign the same variable with a different value - it returns `undefined`.

### `apply(sub, args)`
Given a substitution, `sub`, and the _list of arguments_ of some predicate, `args`, it applies `sub` to any unassigned argument in `args` by assigning the corresponding values to them. In case `args` us `undefined`, it returns `undefined` while in any other case it returns a list of variables - possibly with no changes made, in case no variable of `sub` appears in `args`.

### `getSubstitutions(body facts)`
Given a list of predicates, `body`, and alist of grounded predicates, `facts`, it returns all substitutions that ground all literals in `body` and agree with some literals in `facts`. In case no such substitution exists, it returns an empty list, `[]`, while in any other case itr returns an object of the following form:
```javascript
{
    subs: [sub1, sub2,..., subN],
    propositions: [prop1, prop2,..., propN],
}
```
The first list, `subs`, contains all substitutions, while the second contains all propositional symbols that may appear in `body` - and to which, hence, one may not apply any substitution.

### Other functions
Here we present any other functions related to unification contained in `prudens.js`:
1. `applyToLiteral(sub, literal)`: This function, given a substitution, `sub`, and a literal, `literal`, applies `sub` to all its predicates and returns a *copy* of `literal` with altered arguments, as indicated by `sub`.
2. `applyToRule(sub, rule)`: This function, given a substitution, `sub` and a rule, `rule`, applies `sub` to all literals in `rule`'s body as well as its head. As with `applyToLtieral`, it returns a *copy* of the initial rule, thus not modifying it.
3. `filterBody(body)`: This function, given a list of literals - presumably, a rule's body, but not necessarily restricted to that - returns an object of the form `{propositions: [p1,..., pN], fols: [f1,..., fN]}`, where `propositions` is a list of propositional symbols that appear in `body` and `fols` is the list of predicates that appear in `body` - any of whom may well be empty in case no elements of one class appear in `body`.

## Inference
In this section we shall present any functions that are related to inference as discussed in [this paper](https://www.internetofus.eu/wp-content/uploads/sites/38/2021/05/Michael_2019_MachineCoaching.pdf).

### `getPriorities(kb)`
Given a list of rules, `kb`, this function returns a dictionary (JSON object) indexed by string representations of rules and with each value being the index of the corresponding rule in `kb`. This function is intended to be overwritten in case one desires some more complex or, in general, non-linear prioritisation of rules in a knowledge base - as for now, it simply sticks to the interaction protocol regarding Machine Coaching that is being presented [here](https://www.internetofus.eu/wp-content/uploads/sites/38/2021/05/Michael_2019_MachineCoaching.pdf). So, the output of `getPriorities` may have the following form:
```javascript
{
    rule1: 1,
    rule2: 0,
    rule3: 3,
    rule4: 2,
}
```
In fact, the above representation is the inverse of the input array, `kb`, in order to facilitate object search in O(1) time, given that all string representations of rules are pairwise different.

### `updateGraph(inferredHead, newRule, graph, previousFacts, factsToBeAdded, factsToBeRemoved, priorityFunction, deletedRules, sub, constraints, kbObject, dilemmas, defeatedRules, context)`
This function updates the inference graph structure with a new literal in case it conflicts some of the already inferred ones. Namely, given a literal to be examined, `inferredHead`, the rule that inferred that literal, `newRule`, an inference graph, `graph`, the list of previously inferred facts, `previousFacts` a list of facts that are to be added `factsToBeAdded`, a list of facts that are to be removed in this iteration, `factsToBeRemoved`, a priority function, `priorityFunction`, a list of all deleted rules so far, `deletedRules`, the current sub, `sub`, any compatibility constraints, `constraints`, a KB object, `kbObject`, an array of dilemmas, `dilemmas`, an array of defeated rules so far, `defeatedRules` and the current context, `context`,, it returns an updated version of the graph with all conflicts resolved. For more regarding the structure of the above, see [here](#data-structure).

### `forwardChaining(kb, context, priorityFunction?, logging?)`
Given a knowledge base, `kb`, and a set of grounded literals, `context`, this function deduces anything that may be deduced using the reasoning algorithm presented [here](https://www.internetofus.eu/wp-content/uploads/sites/38/2021/05/Michael_2019_MachineCoaching.pdf).


We shall note at this point that there are also two optional arguments that may be provided to this function, namely:
1. `priorityFunction`, which determines the priority function to be used. By default, this is set to `linearPriorities`. Another built-in option one could use is `specificityPriorities`, as explained [here](https://github.com/VMarkos/prudens-js/releases/tag/v0.8.3). 
2. `logging`, which determines whether logs of each iteration should be kept or not. By default, this is set to `true`.

# Induction
Regarding induction, we again adhere to the learning protocol declared [here](https://www.internetofus.eu/wp-content/uploads/sites/38/2021/05/Michael_2019_MachineCoaching.pdf), so induction within the context of Prudens JS consists to merely appending rules to a knowledge base taking care of updating priorities properly - hence, there are no built-in functionalities regarding induction.

# Known Bugs
- [ ] Relatively large and complex knowledge bases (e.g., about 460 rules large with an average body size of 10-15) fail to pass syntax checks. This is a known bug of the knowledge base parser (`parseKB()`) and is not related to knowledge bases that are passed diretly as JSON objects to the deduction or abduction functions.
