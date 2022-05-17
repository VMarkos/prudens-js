/*
DATA STRUCTURE:
kb = [
    {
        name: "rule_0",
        "body": [
            {
                name: "fatherOf",
                sign: true,
                isJS: false,
                isEquality: false,
                isInequality: false,
                args: [
                    {
                        index: 0,
                        name: "Var1",
                        isAssigned: false,
                        value: undefined,
                        muted: false,
                    },
                    {
                        index: 1,
                        name: "Var2",
                        isAssigned: true,
                        value: "val",
                        muted: false,
                    }
                ],
                arity: 2,
            },
            { another literal },
        ],
        "head": {
            name: "head",
            sign: false,
            isAction: false,
            args: [ list of arguments ],
            arity: 1,
        },
    },
]
*/

/*
Get all substitutions:
1. For each literal in body:
    a. For each sub in substitutions:
        i. Apply sub to literal;
        ii. For each fact in facts that unifies with literal:
            A. Check if sub can be extended according to fact; // You are here!
            B. If yes, extend it, else continue;
        iii. If no extension is possible, delete this sub and proceed to next;
    b. If substitutions is empty and it is not the first iteration, return [];
*/

function getSubstitutions(body, facts, code) {
    let substitutions = [undefined]; // If it contains only undefined in the end, then all body literals are propositional symbols and are all included in facts.
    const jsLiterals = [];
    for (const literal of body) {
        if (literal["arity"] === 0 && !deepIncludes(literal, facts)) { // In case you have a propositional literal, check whether it is included in facts and if not return [].
            // console.log("Literal ", literal["name"], " not included in facts: ", facts);
            return [];
        }
        if (literal["arity"] === 0) {
            continue;
        }
        if (literal["isJS"]) {
            jsLiterals.push(literal);
            continue;
        }
        if (substitutions.includes(undefined)) {
            substitutions = extendByFacts(literal, facts);
        }
        // console.log("body:", body);
        const toBeRemoved = [];
        const toBePushed = [];
        for (const sub of substitutions) {
            // console.log("Sub:");
            // console.log(sub);
            const instance = {};
            for (const key of Object.keys(literal)) {
                instance[key] = literal[key];
                // console.log("key:", key, instance[key]);
            }
            // console.log("literal:", literal, "\n(pre-apply) body:", instance);
            instance["args"] = apply(sub, literal["args"]);
            // console.log("(post-apply) body:", instance);
            // let instance = {
            //     name: body[i]["name"],
            //     sign: body[i]["sign"],
            //     isJS: body[i]["isJS"],
            //     isEquality: body[i]["isEquality"],
            //     isInequality: body[i]["isInequality"],
            //     args: apply(sub, body[i]["args"]),
            //     arity: body[i]["arity"],
            // }
            // console.log("Substituted literal:");
            // console.log(instance);
            let extended = false;
            for (const fact of facts) {
                // console.log("literal/Fact:");
                // console.log(instance);
                // console.log(fact);
                const unifier = unify(instance, fact);
                // console.log("Unifier:");
                // console.log(unifier);
                if (unifier !== undefined) {
                    const extension = extend(sub, unifier);
                    // console.log("sub:", sub, "\nextension:", extension);
                    // debugger;
                    if (unifier !== undefined && extension !== undefined) {
                        toBePushed.push(extension);
                        extended = true;
                        if (!toBeRemoved.includes(sub)) {
                            toBeRemoved.push(sub);
                        }
                    }
                }
            }
            if (!extended) {
                toBeRemoved.push(sub);
            }
        }
        substitutions = removeAll(substitutions, toBeRemoved);
        substitutions.push(...toBePushed);
        if (substitutions.length === 0) {
            // console.log("Zero length");
            return [];
        }
    }
    const subs = [];
    for (const sub of substitutions) {
        const jsEval = jsEvaluation(jsLiterals, sub, code);
        if (jsEval["isValid"]) {
            subs.push(jsEval["sub"]);
        }
    }
    // console.log("subs:", subs);
    return subs;
}

function extendByFacts(literal, facts) {
    "use strict";
    const subs = [];
    for (const fact of facts) {
        if (fact["arity"] !== 0) {
            const unifier = unify(literal, fact);
            // console.log("unifier:", unifier);
            (unifier !== undefined) && subs.push(unifier);
        }
    }
    return subs;
}

// Substitution = {varname1: val1, varname2: val2, ...}

function apply(sub, args) { // FIXME Redefine apply so as to check whether a value is not a constant but actually another variable!
    "use strict";
    if (args === undefined) {
        return undefined;
    }
    // console.log(args);
    // console.log(sub);
    const localArguments = [];
    for (const argument of args) {
        if (!argument["isAssigned"] && Object.keys(sub).includes(argument["name"])) {
            let tempArg = argument["name"];
            let tempVal = sub[tempArg];
            const visitedArgs = [tempArg];
            while (isVarString(tempVal) && Object.keys(sub).includes(tempVal) && !visitedArgs.includes(tempVal)) { // While the sub maps a variable to a variable that is also in the sub...
                tempArg = tempVal; // ...move to the next variable.
                tempVal = sub[tempArg];
                visitedArgs.push(tempVal);
            }
            // if (visitedArgs.includes(tempVal)) { // In case we have an infinite loop like X/Y, Y/Z, Z/X...
            //     console.log("Messed up...");
            //     return undefined; // ...return undefined.
            // }
            if (isVarString(tempVal)) {
                localArguments.push({
                    index: argument["index"],
                    name: tempVal,
                    isAssigned: false,
                    value: undefined,
                    muted: argument["muted"],    
                });
            } else {
                localArguments.push({
                    index: argument["index"],
                    name: argument["name"],
                    isAssigned: true,
                    value: tempVal,
                    muted: argument["muted"],
                });
            }
        } else {
            localArguments.push(argument);
        }
    }
    return localArguments;
}

/*
List unification cases:
    1. Two unsplit lists unify if they contain the same elements at the very same positions.
    2. A split with an unsplit list unify if there is an assignment to the split one's variables that makes it equal to the unsplit one.
    3. Two split lists unify always trivially (?) or never (?).
*/

function listUnification(list1, list2, unifier) {
    if (!list1["isSplit"] && !list2["isSplit"]) {
        return undefined; // TODO Remember to catch this in unify(x, y).
    }
    if (!list1["isSplit"]) {
        // TODO See above.
    }
    return unifier;
}

function unify(x, y) { // x, y are literals. Assymetric unification since y is assumed to be known/part of some set of inferred facts!
    "use strict";
    if (x["name"] !== y["name"] || x["arity"] !== y["arity"] || x["sign"] !== y["sign"]) {
        return undefined;
    }
    const xArgs = x["args"];
    const yArgs = y["args"];
    const unifier = {};
    // console.log("x:", x, "\ny:", y);
    for (let i=0; i<x["arity"]; i++) {
        let xArg = xArgs[i];
        let yArg = yArgs[i];
        if (xArg["isAssigned"] && yArg["isAssigned"] && xArg["value"] !== yArg["value"]) {
            // console.log("Here?");
            // console.log(xArg);
            // console.log(yArg);
            // debugger;
            return undefined;
        }
        if (xArg["muted"] || yArg["muted"] || (xArg["name"] === undefined && yArg["name"] === undefined)) {
            // console.log("xArg:", xArg, "\nyArg:", yArg);
            continue;
        }
        if (Object.keys(unifier).length > 0 && Object.keys(unifier).includes(xArg["name"]) && yArg["isAssigned"] && (unifier[xArg["name"]] !== yArg["value"] || unifier[xArg["name"]] !== yArg["name"])) {
            return undefined;
        }
        if (Object.keys(unifier).includes(yArg["name"]) && xArg["isAssigned"] && (unifier[yArg["name"]] !== xArg["value"] || unifier[yArg["name"]] !== xArg["name"])) {
            return undefined;
        }
        // console.log("Here?");
        // console.log(xArg);
        // console.log(yArg);
        // debugger;
        if (!xArg["isAssigned"] && !yArg["isAssigned"]) {
            // console.log("Here!\nxArg:", xArg, "\nyArg:", yArg);
            unifier[xArg["name"]] = yArg["name"];
            // console.log("One", unifier);
            // console.log(unifier);
        } else if (xArg["isAssigned"] && !yArg["isAssigned"]) {
            unifier[yArg["name"]] = xArg["value"]; // TODO Does it work?
            // console.log("Two:", unifier);
        } else if (!xArg["isAssigned"] && yArg["isAssigned"]) {
            unifier[xArg["name"]] = yArg["value"];
            // console.log("Three", unifier);
        } else {
            // console.log("Four");
            unifier[yArg["name"]] = xArg["value"];
            // console.log("Four", unifier);
        }
    }
    return unifier;
}

/*
KNOWN BUG:
@KnowledgeBase
R :: f(X, Y) implies g(X, Y);

Context:
f(A, b); f(X, b)

Inferences: f(A, b); f(X, b); true; g(A, b); g(X, b);
Graph: {
g(A, b): [R :: f(X, Y) implies g(X, Y);]
g(X, b): [R :: f(X, Y) implies g(X, Y);]
}

This may not be a bug in the sense that if the developer has chosen different var names then they may want to highlight something.
*/

function extend(sub, unifier) {
    "use strict";
    // console.log("sub:", sub);
    // console.log("Unifier in extend():");
    // console.log(unifier);
    const extendedSub = deepCopy(sub);
    // console.log("Sub:");
    // console.log(extendedSub);
    for (const key of Object.keys(unifier)) {
        if (Object.keys(extendedSub).includes(key) && extendedSub[key] !== unifier[key] && !isVarString(extendedSub[key])) {
            // console.log("key:", key, "extendedSub[key]:", extendedSub[key]);
            // console.log("ext includes?", Object.keys(extendedSub).includes(key));
            // console.log("Var?", isVarString(extendedSub[key]));
            return undefined;
        } else if (!Object.keys(extendedSub).includes(key)) {
            extendedSub[key] = unifier[key];
        }
    }
    for (const key of Object.keys(extendedSub)) {
        // console.log("key:", key);
        if (isVarString(extendedSub[key]) && Object.keys(unifier).includes(extendedSub[key])) { // In case some variable is unified with another variable included in the unifier...
            let tempKey = key;
            let tempVal = extendedSub[key];
            const visitedKeys = [tempKey];
            while (isVarString(tempVal) && Object.keys(unifier).includes(tempVal) && !visitedKeys.includes(tempVal)) {
                tempKey = tempVal;
                tempVal = unifier[tempVal];
                visitedKeys.push(tempVal);
            }
            extendedSub[key] = tempVal;
        }
    }
    return extendedSub;
}

/*
Inference algorithm:
Facts = list of certain inferences;
NewFacts = list of new inferences;

1. For each rule, with descending priority:
    a. Infer anything that may be inferred using rule and add it to NewFacts;
    b. If any inference leads to a conflict with something in Facts, remove it from NewFacts;
    c. Add all remaining NewFacts to Facts // Are there any chances that you can delete a rule?
2. Repeat 1 until nothing is added to Facts.
*/

function applyToLiteral(sub, literal) {
    if (sub === undefined) {
        const output = {}
        for (const key of Object.keys(literal)) {
            output[key] = literal[key];
        }
        return output;
    }
    const subLiteral = deepCopy(literal);
    // console.log("Sub-Literal:");
    // console.log(subLiteral);
    subLiteral["args"] = apply(sub, literal["args"])
    return subLiteral;
}

function applyToRule(sub, rule) {
    const subRule = {
        name: rule["name"],
    }
    const newBody = [];
    for (const literal of rule["body"]) {
        // console.log(literal);
        newBody.push(applyToLiteral(sub, literal));
    }
    subRule["body"] = newBody;
    subRule["head"] = applyToLiteral(sub, rule["head"]);
    return subRule;
}

function getPriorities(kb) { // Linear order induced priorities.
    priorities = {};
    for (let i=0; i<kb.length; i++) {
        // console.log(kb);
        priorities[ruleToString(kb[i])] = kb.length - i - 1; // TODO Remember this is in reverse order!
    }
    return priorities;
}

/* Test case that fails!
@KnowledgeBase
R1 :: f(X), h(Y) implies z(X);
R2 :: g(X) implies f(X);
R3 :: h(X) implies -f(X);

Context: g(b); h(b);
*/

function updateGraph(inferredHead, newRule, graph, facts, priorities, deletedRules, sub, constraints) { //TODO You may need to store the substitution alongside each rule, in case one needs to count how many time a rule has been triggered or so.
    let inferred = false;
    // console.log("inferredHead:", inferredHead);
    // console.log("facts:", facts);
    // debugger;
    if (deepIncludes(inferredHead, facts)) {
        // console.log("Includes inferredHead");
        if (!Object.keys(graph).includes(literalToString(inferredHead))) {
            graph[literalToString(inferredHead)] = [newRule]; // TODO Newly added code, check for potentially unexpected behaviours!
            inferred = true;
        }
        if (!deepIncludes(newRule, graph[literalToString(inferredHead)]) && !deepIncludes(newRule, deletedRules)) {
            graph[literalToString(inferredHead)].push(newRule);
            inferred = true;
            // console.log("Includes head and not rule.");
        }
        return {
            graph: graph,
            facts: facts,
            inferred: inferred,
            deletedRules: deletedRules,
        };
    }
    const casualConflict = {}
    for (const key of Object.keys(inferredHead)) {
        casualConflict[key] = inferredHead[key];
    }
    casualConflict["sign"] = !casualConflict["sign"];
    const conflicts = [applyToLiteral(sub, casualConflict)];
    // console.log("constraints:", constraints);
    const key = ((inferredHead["sign"])? "": "-") + inferredHead["name"] + inferredHead["arity"];
    if (constraints.has(key)) {
        const keyObject = constraints.get(key)["keyObject"];
        for (const conflict of constraints.get(key)["constraints"]) {
            const constraintUnifier = unify(keyObject, inferredHead);
            conflicts.push(applyToLiteral(sub, applyToLiteral(constraintUnifier, conflict)));
        }
    }
    // console.log("key:", key, "\nconflicts:", conflicts);
    let includesConflict = false;
    for (const oppositeHead of conflicts) {
        // console.log("Here");
        if (deepIncludes(oppositeHead, facts, true)) {
            // console.log("indludes:", oppositeHead);
            includesConflict = true;
            const toBeRemoved = [];
            // console.log("facts:", facts);
            // console.log("graph:", graph);
            // console.log("lit:", oppositeHead);
            for (const rule of graph[literalToString(oppositeHead)]) {
                if (priorities[ruleToString(rule)] > priorities[ruleToString(newRule)]) {
                    toBeRemoved.push(rule);
                    if (!deepIncludes(rule, deletedRules)); {
                        deletedRules.push(rule);
                    }
                    inferred = true;
                    // console.log("Includes opposite head and not rule.");
                    // debugger;
                }
            }
            if (graph[literalToString(oppositeHead)].length === toBeRemoved.length) {
                // console.log("Delete opp");
                delete graph[literalToString(oppositeHead)];
                // console.log("graph:", graph);
                // debugger;
                graph[literalToString(inferredHead)] = [newRule];
                // console.log("Facts prior to pushing: ", facts);
                // debugger;
                facts.push(inferredHead);
                // console.log("Facts prior to splicing: ", facts, "\nIndex of opposite head: " + deepIndexOf(facts, oppositeHead));
                // debugger;
                // facts = facts.splice(deepIndexOf(facts, oppositeHead), 1); // FIXME .indexOf() returns -1 because, guess what, it does not work with lists of objects... Create a deep alternative.
                facts = removeAll(facts, [oppositeHead]);
                // console.log("Facts post splicing: ", facts);
                // debugger;
            } else {
                graph[literalToString(oppositeHead)] = removeAll(graph[literalToString(oppositeHead)], toBeRemoved);
            }
        }
    }
    if (!includesConflict) {
        // console.log("No conflict");
        facts.push(inferredHead);
        graph[literalToString(inferredHead)] = [newRule];
        inferred = true;
    }
    // console.log("Includes neither head nor rule.");
    // console.log("Deleted Rules: ", deletedRules);
    return {
        graph: graph,
        facts: facts,
        inferred: inferred,
        deletedRules: deletedRules,
    };
}

function forwardChaining(kbObject, context) { //FIXME Huge inconsistency with DOCS! You need to change that from [rule1, ...] to KBObject.
    let facts = deepCopy(context);
    facts.push({
        name: "true",
        sign: true,
        isJS: false,
        isEquality: false,
        isInequality: false,
        isAction: false,
        args: undefined,
        arity: 0,
    });
    const kb = kbObject["kb"];
    // console.log(facts);
    let inferred = false;
    let graph = {};
    let deletedRules = [];
    // console.log(kbObject);
    const code = kbObject["code"];
    const priorities = getPriorities(kb);
    // let i = 0;
    do {
        inferred = false;
        for (let i=0; i<kb.length; i++) {
            const rule = kb[i];
            if (deepIncludes(rule, deletedRules)) {
                continue;
            }
            // console.log(rule);
            // FIXME You have to fix the relational version in the same manner as the propositional!
            const subs = getSubstitutions(rule["body"], facts, code); // FIXME Not computing all substitutions --- actually none for: @KnowledgeBase
            // console.log(subs);
            // debugger;
            for (let i=0; i<subs.length; i++) {
                const sub = subs[i];
                // console.log(sub);
                // console.log(code);
                // console.log("Rule head:");
                // console.log(rule["head"]);
                const inferredHead = applyToLiteral(sub, rule["head"]);
                const updatedGraph = updateGraph(inferredHead, rule, graph, facts, priorities, deletedRules, sub, kbObject["constraints"]);
                // console.log(updatedGraph);
                graph = updatedGraph["graph"]; // You could probably push the entire graph Object!
                facts = updatedGraph["facts"];
                deletedRules = updatedGraph["deletedRules"];
                if (!inferred) {
                    inferred = updatedGraph["inferred"];
                }
                // console.log(graph);
            }
        }
        // i++;
        // console.log(i);
    } while (inferred);
    return {
        context: context,
        facts: facts,
        graph: graph,
    }
}

function isConfictingWithList(x, facts) { // x is literal, facts is a list of literals.
    for (const fact of facts) {
        if (isConflicting(x, fact)) {
            return true;
        }
    }
    return false;
}

function isConflicting(x, y) { // x and y are literals.
    if (x["name"] != y["name"] || x["arity"] != y["arity"] || x["sign"] === y["sign"]) {
        return false;
    }
    const xArgs = x["args"];
    const yArgs = y["args"];
    for (let i=0; i<x["arity"]; i++) {
        if (!xArgs[i]["isAssigned"] || !yArgs[i]["isAssigned"] || xArgs[i]["value"] != yArgs[i]["value"]) {
            return false;
        }
    }
    return true;
}

function jsEvaluation(body, sub, code) { // Checks whether, given a substitution, the corresponding JS predicates hold.
    let isValid = true;
    // console.log("Body:");
    // console.log(body);
    for (const literal of body) {
        if (literal["isEquality"]) {
            const equality = equalityCheck(literal, sub);
            // console.log("Equality:");
            // console.log(equality);
            if (equality["unifier"]) {
                sub = extend(sub, equality["unifier"]);
            }
            isValid = isValid && equality["isValid"];
        } else if (literal["isInequality"]) {
            isValid = isValid && inequalityCheck(literal, sub);
        } else { // On condition that only JS literals are passed here...
            // console.log("Hey!");
            // console.log(code);
            isValid = isValid && jsCheck(literal, sub, code);
        }
    }
    return {
        isValid: isValid,
        sub: sub,
    };
}

function equalityCheck(literal, sub) {
    let leftArg = literal["args"][0];
    let rightArg = literal["args"][1];
    const sign = literal["sign"];
    // console.log("Args:");
    // console.log(leftArg);
    // console.log(rightArg);
    // console.log(rightArg["name"].match(jsRE));
    if (!leftArg["isAssigned"] && Object.keys(sub).includes(leftArg["name"])) {
        leftArg = {
            index: leftArg["index"],
            name: leftArg["name"],
            isAssigned: true,
            value: sub[leftArg["name"]],
            muted: leftArg["muted"],
        };
        // console.log("Assgn left");
    }
    if (!rightArg["isAssigned"] && Object.keys(sub).includes(rightArg["name"])) {
        rightArg = {
            index: rightArg["index"],
            name: rightArg["name"],
            isAssigned: true,
            value: sub[rightArg["name"]],
            muted: rightArg["muted"],
        };
        // console.log("Assgn right");
    }
    // console.log(rightArg["name"]);
    if (!leftArg["isAssigned"] && !rightArg["isAssigned"]) {
        // console.log("What?");
        return {
            isValid: false,
            unifier: undefined,
        };
    }
    if (leftArg["isAssigned"] && rightArg["isAssigned"]) {
        // console.log(leftArg["value"] + " === " + rightArg["value"]);
        return {
            isValid: sign === numParser(evalExpression(leftArg, sub) + " === " + evalExpression(rightArg, sub)).call(), // TODO Consider unifying evalExpression() and applyToString() to a single function if it actually makes sense.
            unifier: undefined,
        };
    }
    if (leftArg["isAssigned"]) {
        const unifier = {};
        unifier[rightArg["name"]] = numParser(applyToString(leftArg["value"], sub)).call();
        // console.log(unifier);
        return {
            isValid: true,
            unifier: unifier,
        };
    }
    const unifier = {};
    // console.log("Here!");
    unifier[leftArg["name"]] = numParser(applyToString(rightArg["value"], sub)).call();
    // console.log("Equality sub:"); // TODO update equality so as to allow for operations with variables.
    // console.log(sub);
    // console.log(unifier);
    return {
        isValid: true,
        unifier: unifier,
    };
}

function inequalityCheck(literal, sub) {
    let leftArg = literal["args"][0];
    let rightArg = literal["args"][1];
    if (!leftArg["isAssigned"] && Object.keys(sub).includes(leftArg["name"])) {
        leftArg = {
            index: leftArg["index"],
            name: leftArg["name"],
            isAssigned: true,
            value: sub[leftArg["name"]],
            muted: leftArg["muted"],
        };
    }
    if (!rightArg["isAssigned"] && Object.keys(sub).includes(rightArg["name"])) {
        rightArg = {
            index: rightArg["index"],
            name: rightArg["name"],
            isAssigned: true,
            value: sub[rightArg["name"]],
            muted: rightArg["muted"],
        };
    }
    if (!leftArg["isAssigned"] || !rightArg["isAssigned"]) {
        return false;
    }
    return numParser(leftArg["value"] + " < " + rightArg["value"]).call();
}

/*
How is a JS predicate executed?
1. Split the code part to chunks, where each chunk is a corresponding javascript function
2. When you have a sub available, go get each JS literal, apply sub and execute the corresponding function.

Assume you have a function like the one below:
function foo(arg1, arg2) {
    // crazy stuff
}
What you actually need to do is replace anywhere in "crazy stuff" the values provided by your substitution and then just define a function with that strings --- which will be called.

!!! This blocks calling a function from another function --- you may need to allow for this in some next release.

In order to replace an argument's name, say arg1, with its value, say x, you have to find and replace any substring 'arg1' that is not preceded by some \w --- and, naturally, no \w 
precedes it.
*/

function jsCheck(literal, sub, code) {
    const name = literal["name"].substring(1, literal["name"].length);
    const functionObject = code[name];
    if (literal["args"].length !== functionObject["args"].length) {
        return false;
    }
    let source = functionObject["source"];
    for (let i=0; i<literal["args"].length; i++) {
        const variable = literal["args"][i];
        // console.log(variable);
        // console.log(sub);
        if (variable["isAssigned"]) {
            source = "let " + functionObject["args"][i] + ' = "' + variable["value"] + '";\n' + source;
            continue;
        }
        if (!Object.keys(sub).includes(variable["name"])) {
            // console.log("Here");
            return false;
        }
        // const varRE = RegExp(String.raw`((?<!\w)(` + functionObject["args"][i] + String.raw`))(?!\w)`, "g");
        // console.log(varRE);
        // console.log(sub[variable["name"]]);
        // source = source.replaceAll(varRE, '"' + sub[variable["name"]] + '"');
        source = "let " + functionObject["args"][i] + ' = "' + sub[variable["name"]] + '";\n' + source;
    }
    // console.log(source);
    // debugger;
    // console.log(literal);
    // debugger;
    return Function(source).call() == literal["sign"];
}

function numParser(string) {
    // console.log("numParser:", string);
    return Function('"use strict"; return (' + string + ');');
}

function applyToString(string, sub) {
    if (sub === undefined || Object.keys(sub).length === 0) {
        return "false";
    }
    string = string.trim();
    for (const variable of Object.keys(sub)) {
        const varRE = RegExp(String.raw`((?<!\w)(` + variable + String.raw`))(?!\w)`, "g");
        // const oldString = string; // TODO This as well?
        string = string.replaceAll(varRE, sub[variable]);
        // console.log("string in loop:", string);
        // if (string === oldString) { // TODO Why was this here?
        //     return "false";
        // }
    }
    // console.log("applyToString", string);
    return string;
}

function evalExpression(expression, sub) {
    if (!expression["isExpression"]) {
        return expression["value"];
    }
    // console.log("expression:", expression, "sub:", sub);
    return applyToString(expression["value"], sub);
}