# Prudens JS
A full implementation of Prudens in Javascript alongside a simple UI and the corresponding documentation.

For the corresponding UI: https://vmarkos.github.io/prudens-js/index.html

# Data Structure
All interaction within the scope of Prudens JS is conducted based on JSON representations of knowledge bases, rules, literals and variables. In this section we present in detail the properties of each of these separately.

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
```javascrpit
{
    var1: val1,
    var2: val2,
    ...,
    varN: valN,
}
```
In the above, all keys are some of the unassigned arguments of `x` - possibly all.

# Abduction
Regarding abduction, the current version of Prudens JS supports only a propositional version which adheres to the deduction process described [here](https://www.internetofus.eu/wp-content/uploads/sites/38/2021/05/Michael_2019_MachineCoaching.pdf). That is, any abductive proof provided by Prudens JS consists of any missing facts that could lead to a given target, _t_, using the aforementioned deduction algorithm.

# Induction
Regarding induction, we again adhere to the learning protocol declared [here](https://www.internetofus.eu/wp-content/uploads/sites/38/2021/05/Michael_2019_MachineCoaching.pdf), so induction within the context of Prudens JS consists to merely appending rules to a knowledge base taking care of updating priorities properly.
