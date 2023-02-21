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

const TRUE_PREDICATE = {
    name: "true",
    sign: true,
    isJS: false,
    isEquality: false,
    isInequality: false,
    isAction: false,
    args: undefined,
    arity: 0,
};

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
        // console.log("Subs, ln 74:", substitutions);
        // debugger;
        // console.log("body:", body);
        const toBeRemoved = [];
        const toBePushed = [];
        for (const sub of substitutions) {
            //console.log("Sub:");
            // console.log(sub);
            const instance = {};
            for (const key of Object.keys(literal)) {
                instance[key] = literal[key];
                // console.log("key:", key, instance[key]);
            }
            // console.log("literal:", literal, "\n(pre-apply) body:", instance);
            // instance["args"] = apply(sub, literal["args"]);
            // console.log("(post-apply) body:", instance);
            // debugger;
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
                const unifier = unify(instance, fact, sub);
                // console.log("Unifier:");
                // console.log(unifier);
                // debugger;
                if (unifier !== undefined) {
                    const extension = extend(sub, unifier);
                    // console.log("sub:", sub, "\nextension:", extension);
                    // extended = true;
                    // debugger;
                    if (extension !== undefined) {
                        toBePushed.push(extension);
                        extended = true; // This should be here and not outside that "if".
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

function unify(x, y, sub=undefined) { // x, y are literals. Assymetric unification since y is assumed to be known/part of some set of inferred facts!
    if (x["name"] !== y["name"] || x["arity"] !== y["arity"] || x["sign"] !== y["sign"]) {
        return undefined;
    }
    const xArgs = x["args"];
    const yArgs = y["args"];
    const unifier = {};
    const expressionIndices = [];
    let xArg, yArg;
    // console.log("x:", x, "\ny:", y);
    for (let i=0; i<x["arity"]; i++) {
        xArg = xArgs[i];
        yArg = yArgs[i];
        if (xArg["isExpression"] || yArg["isExpression"]) {
            expressionIndices.push(i);
            continue;
        }
        if (xArg["isAssigned"] && yArg["isAssigned"]) {
			if (xArg["value"] !== yArg["value"]) {
				// console.log("Here?");
				// console.log(xArg);
				// console.log(yArg);
				// debugger;
				return undefined;
			} else {
				continue;
			}
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
    if (expressionIndices.length === 0) {
        return unifier;
    }
    let extendedSub;
    if (sub === undefined) {
        extendedSub = unifier;
    } else {
        extendedSub = extend(sub, unifier);
    }
    let val;
    for (const i of expressionIndices) {
        xArg = xArgs[i];
        yArg = yArgs[i];
        if (xArg["isExpression"]) {
            val = numParser(applyToString(xArg["value"], extendedSub)).call();
            // console.log("val:", val);
            if (parseFloat(val) !== parseFloat(yArg["value"])) {
                return undefined;
            }
            // console.log("names:", xArg["name"], yArg["name"]);
            // unifier[yArg["name"]] = val;
            unifier[xArg["value"]] = val;
            continue;
        }
        val = numParser(applyToString(yArg["value"], extendedSub)).call();
        if (parseFloat(val) !== parseFloat(xArg["value"])) {
            return undefined;
        }
        // unifier[xArg["name"]] = val;
        unifier[yArg["value"]] = val;
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
    // console.log("Unifier (in extend):", unifier);
    const extendedSub = deepCopy(sub);
    // console.log("Sub (in extend):");
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

/*
 * IMPORTANT NOTE!
 * 		A priority function is supposed to return either boolean values or undefined. Namely, prior(x, y) should be true if
 * 		x > y, false if y < x and undefined in case x and y are incomparable.
 */

function linearPriorities(rule1, rule2, kbObject, sub) { // true if rule1 is of HIGHER priority than rule2.
    if (rule1["name"][0] === "$") {
        return true;
    }
    if (rule2["name"][0] === "$") {
        return false;
    }
    return kbObject["kb"].indexOf(rule1) > kbObject["kb"].indexOf(rule2);
}

function specificityPriorities(rule1, rule2, kbObject, sub) { // true if rule1 is of HIGHER priority than rule2.
    if (rule1["name"][0] === "$") {
        return true;
    }
    if (rule2["name"][0] === "$") {
        return false;
    }
    const body1 = rule1["body"];
    const body2 = rule2["body"];
    // console.log("body1:", body1, "body2:", body2, "sub:", sub);
    if (isMoreSpecific(body1, body2, sub)) {
		return true;
	}
    if (isMoreSpecific(body2, body1, sub)) {
		return false;
	}
	return undefined;
}

function isMoreSpecific(body1, body2, sub) { // true if body1 is more specific than body2, false otherwise.
	let included, unifiable;
	for (const literal2 of body2) {
        included = false;
        for (const literal1 of body1) {
            unifiable = unify(applyToLiteral(sub, literal1), applyToLiteral(sub, literal2), sub);
            // console.log("unifier:", unifiable);
            if (unifiable) {
				// console.log("Why here?");
                included = true;
                break;
            }
        }
        if (!included) {
			// console.log("false");
			return false;
        }
    }
    return true;
}

function customPrioritiesFunction(rule1, rule2, kbObject, sub) { // true if rule1 is of HIGHER priority than rule2.
    if (rule1["name"][0] === "$") {
        return true;
    }
    if (rule2["name"][0] === "$") {
        return false;
    }
    const priorities = kbObject["customPriorities"];
    if (!Object.keys(priorities).includes(rule1["name"]) || !Object.keys(priorities).includes(rule2["name"]) || priorities[rule1["name"]] === priorities[rule2["name"]]) {
        return undefined;
    }
    return priorities[rule1["name"]] > priorities[rule2["name"]];
}

/* Test case that fails!
@KnowledgeBase
R1 :: f(X), h(Y) implies z(X);
R2 :: g(X) implies f(X);
R3 :: h(X) implies -f(X);

Context: g(b); h(b);
*/

/*
 Dilemmas:
	* Existing rule, r1, that infers z and new rule, r2, that infers -z;
	* Current policy: Remove all rules that infer z and are of lower priority than r2;
	* In case r2 beats every rule that infers z, then -z and r2 are added to the graph ONLY IF r2 is indeed of higher priority than
		* all such rules. Otherwise, we merely keep track of the agent's dilemmas.
 * */

function updateGraph(inferredHead, newRule, graph, previousFacts, factsToBeAdded, factsToBeRemoved, priorityFunction, deletedRules, sub, constraints, kbObject, dilemmas, defeatedRules, context) { //TODO You may need to store the substitution alongside each rule, in case one needs to count how many time a rule has been triggered or so.
    let inferred = false;
    // console.log("inferredHead:", inferredHead);
    // console.log("facts:", facts);
    // debugger;
    const headInDilemma = isInDilemma(newRule, dilemmas)
    const facts = setConcat(previousFacts, factsToBeAdded);
    if (deepIncludes(inferredHead, facts) && !headInDilemma) {
        // console.log("Includes inferredHead");
        if (!Object.keys(graph).includes(literalToString(inferredHead))) {
            graph[literalToString(inferredHead)] = [newRule];
            inferred = true;
        }
        if (!deepIncludes(newRule, graph[literalToString(inferredHead)]) && !deepIncludes(newRule, deletedRules)) {
            graph[literalToString(inferredHead)].push(newRule);
            inferred = true;
            // console.log("Includes head and not rule.");
        }
        return {
            graph: graph,
            factsToBeRemoved: factsToBeRemoved,
            factsToBeAdded: factsToBeAdded,
            inferred: inferred,
            deletedRules: deletedRules,
            dilemmas: dilemmas,
            defeatedRules: defeatedRules,
        };
    }
    const casualConflict = {};
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
            const constraintUnifier = unify(keyObject, inferredHead, sub);
            conflicts.push(applyToLiteral(sub, applyToLiteral(constraintUnifier, conflict)));
        }
    }
    // console.log("key:", key, "\nconflicts:", conflicts);
    let includesConflict = false;
    let isPrior, beatsAll;
    for (const oppositeHead of conflicts) {
        // console.log("Here", oppositeHead);
        // console.log("context:", context);
        if (deepIncludes(oppositeHead, context)) { // Should we consider dilemmas in the case of contexts?
            // console.log("Context");
            // console.log(context, literalToString(inferredHead));
            defeatedRules.push({
                "defeated": newRule,
                "by": undefined, // Undefined means context.
                "sub": sub,
            });
            deletedRules.push(newRule);
            return {
                graph: graph,
                factsToBeRemoved: factsToBeRemoved,
                factsToBeAdded: factsToBeAdded,
                inferred: inferred,
                deletedRules: deletedRules,
                dilemmas: dilemmas,
                defeatedRules: defeatedRules,
            };
        }
        if (deepIncludes(oppositeHead, facts, true)) {
            // console.log("includes:", oppositeHead);
            includesConflict = true;
            const toBeRemoved = [];
            // console.log("facts:", facts);
            // console.log("graph:", graph);
            // console.log("lit:", oppositeHead);
            // debugger;
            beatsAll = true; // FIXME in case an ungrounded variable appears on the head (i.e., one that *DOES NOT* appear in the rule's body, it should throw a runtime error --- or, better, catch this on parsing?)
            if (!Object.keys(graph).includes(literalToString(oppositeHead))) {
                continue;
            }
            for (const rule of graph[literalToString(oppositeHead)]) {
				isPrior = priorityFunction(newRule, rule, kbObject, sub);
                // console.log(newRule, rule);
                // console.log("isPrior:", isPrior);
                // debugger;
                if (isPrior === undefined || isPrior) {
                    toBeRemoved.push(rule);
                    defeatedRules.push({
                        "defeated": rule,
                        "by": newRule,
                        "sub": sub,
                    });
                    if (!deepIncludes(rule, deletedRules)) {
                        deletedRules.push(rule);
                    }
                    inferred = true;
                    // console.log("Includes opposite head and not rule.");
                    // debugger;
                    if (isPrior === undefined) {
						if (!deepIncludes([rule, newRule, sub], dilemmas) && !deepIncludes([newRule, rule, sub])) {
							dilemmas.push([rule, newRule, sub]);
						}
						beatsAll = false;
						inferred = false;
					}
                } else { // TODO Check this again!
                    defeatedRules.push({
                        "defeated": newRule,
                        "by": rule,
                        "sub": sub,
                    });
                }
            }
            if (graph[literalToString(oppositeHead)].length === toBeRemoved.length) {
                // console.log("Delete opp");
                delete graph[literalToString(oppositeHead)];
                // console.log("graph:", graph);
                // debugger;
                if (beatsAll) {
					graph[literalToString(inferredHead)] = [newRule];
					// console.log("Facts prior to pushing: ", facts);
					// debugger;
					factsToBeAdded.push(inferredHead);
				}
                // console.log("Facts prior to splicing: ", facts, "\nIndex of opposite head: " + deepIndexOf(facts, oppositeHead));
                // debugger;
                // facts = facts.splice(deepIndexOf(facts, oppositeHead), 1); // FIXME .indexOf() returns -1 because, guess what, it does not work with lists of objects... Create a deep alternative.
                factsToBeAdded = removeAll(factsToBeAdded, [oppositeHead]);
                factsToBeRemoved.push(oppositeHead);
                // console.log("Facts post splicing: ", facts);
                // debugger;
            } else {
                graph[literalToString(oppositeHead)] = removeAll(graph[literalToString(oppositeHead)], toBeRemoved);
            }
        }
    }
    if (!includesConflict && !headInDilemma) {
        // console.log("No conflict");
        factsToBeAdded.push(inferredHead);
        graph[literalToString(inferredHead)] = [newRule];
        inferred = true;
    }
    // console.log("Includes neither head nor rule.");
    // console.log("Deleted Rules: ", deletedRules);
    return {
        graph: graph,
        factsToBeRemoved: factsToBeRemoved,
        factsToBeAdded: factsToBeAdded,
        inferred: inferred,
        deletedRules: deletedRules,
        dilemmas: dilemmas,
        defeatedRules: defeatedRules,
    };
}

function isInDilemma(rule, dilemmas) {
    if (dilemmas === undefined) {
        return false;
    }
	for (const dilemma of dilemmas) {
		if (deepIncludes(rule, dilemma.slice(1))) {
			return true;
		}
	}
	return false;
}

function initializeGraph(context) {
    const graph = {};
    let literal;
    for (let i = 0; i < context.length; i++) {
        literal = context[i]
        graph[literalToString(literal)] = [{name: `\$${i}`, head: literal, body: TRUE_PREDICATE}];
    }
    return graph;
}

function forwardChaining(kbObject, context, priorityFunction=linearPriorities, logging = true) { //FIXME Huge inconsistency with DOCS! You need to change that from [rule1, ...] to KBObject.
    let previousFacts = deepCopy(context);
    previousFacts.push(TRUE_PREDICATE);
    let factsToBeAdded = [], factsToBeRemoved = [];
    const kb = kbObject["kb"];
    // console.log(facts);
    let inferred = false;
    let graph = initializeGraph(context);
    let deletedRules = [];
    let defeatedRules = [];
    let dilemmas = [];
    // console.log(kbObject);
    const code = kbObject["code"];
    const customPriorities = kbObject["customPriorities"];
    kbObject["constraints"] = new Map(Object.entries(kbObject["constraints"]));
    const logs = [];
    if (logging) {
        logs.push({
            facts: deepCopy(previousFacts),
            graph: deepCopy(graph),
            dilemmas: deepCopy(dilemmas),
            defeatedRules: deepCopy(defeatedRules),
        });
    }
    if (Object.keys(customPriorities).length > 0) {
        priorityFunction = customPrioritiesFunction;
    }
    do {
        inferred = false;
        for (let i=0; i<kb.length; i++) {
            const rule = kb[i];
            if (deepIncludes(rule, deletedRules)) {
                continue;
            }
            const subs = getSubstitutions(rule["body"], previousFacts, code);
            // console.log("debug:", rule, subs, previousFacts);
            // debugger;
            for (let i=0; i<subs.length; i++) {
                const sub = subs[i];
                const inferredHead = applyToLiteral(sub, rule["head"]);
                const updatedGraph = updateGraph(inferredHead, rule, graph, previousFacts, factsToBeAdded, factsToBeRemoved, priorityFunction, deletedRules, sub, kbObject["constraints"], kbObject, dilemmas, defeatedRules);
                graph = updatedGraph["graph"]; // You could probably push the entire graph Object!
                // previousFacts = updatedGraph["previousFacts"];
                factsToBeAdded = updatedGraph["factsToBeAdded"];
                factsToBeRemoved = updatedGraph["factsToBeRemoved"];
                dilemmas = updatedGraph["dilemmas"];
                deletedRules = updatedGraph["deletedRules"];
                defeatedRules = updatedGraph["defeatedRules"];
                if (!inferred) {
                    inferred = updatedGraph["inferred"];
                }
            }
        }
        previousFacts = removeAll(previousFacts, factsToBeRemoved);
        previousFacts = setConcat(previousFacts, factsToBeAdded);
        if (logging) {
            logs.push({
                facts: deepCopy(previousFacts),
                graph: deepCopy(graph),
                dilemmas: deepCopy(dilemmas),
                defeatedRules: deepCopy(defeatedRules),
            });
        }
    } while (inferred);
    return {
        context: context,
        facts: previousFacts,
        graph: graph,
        dilemmas: dilemmas,
        defeatedRules: defeatedRules,
        logs: logs,
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
    // console.log("sub:", sub);   
    // console.log(rightArg["name"].match(jsRE));
    if (!leftArg["isAssigned"] && sub && Object.keys(sub).includes(leftArg["name"])) {
        leftArg = {
            index: leftArg["index"],
            name: leftArg["name"],
            isAssigned: true,
            value: sub[leftArg["name"]],
            muted: leftArg["muted"],
        };
        // console.log("Assgn left");
    }
    if (!rightArg["isAssigned"] && sub && Object.keys(sub).includes(rightArg["name"])) {
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
        // console.log(leftArg["value"] + " === " + rightArg["value"]);
        // console.log("Here!");
        return {
            isValid: sign === numParser(evalExpression(leftArg, sub) + " === " + evalExpression(rightArg, sub)).call(), // TODO Consider unifying evalExpression() and applyToString() to a single function if it actually makes sense.
            unifier: undefined,
        };
    }
    if (leftArg["isAssigned"]) {
        const unifier = {};
        unifier[rightArg["name"]] = numParser(evalExpression(leftArg, sub)).call();
        // console.log(unifier);
        return {
            isValid: true, // FIXME At this point, you should return a RUNTIME error in case sign === false (which is pointless).
            unifier: unifier,
        };
    }
    const unifier = {};
    // console.log("Here!");
    unifier[leftArg["name"]] = numParser(evalExpression(rightArg, sub)).call();
    // unifier[leftArg["name"]] = numParser(applyToString(rightArg["value"], sub)).call();
    // console.log("Equality sub:");
    // console.log(sub);
    // console.log(unifier);
    return {
        isValid: true, // FIXME At this point, you should return a RUNTIME error in case sign === false (which is pointless).
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
    return Function(`try {
            return ( ${string} );
        } catch (e) {
            console.log("JavaScript Error:\\n" + new Error().stack);
            return false;
        }`);
}

function applyToString(string, sub) {
    // console.log("applyToString:", string, sub);
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
    // console.log(expression["value"], sub);
    if (!expression["isExpression"]) {
        if (/[a-z]\w*/.test(expression["value"])) {
            return '"' + expression["value"] + '"';
        }
        return "" + expression["value"];
    }
    // console.log("expression:", expression, "sub:", sub);
    return applyToString(expression["value"], sub);
}

function deepCopy(object) { // This is a level 1 deep copy --- i.e. if some value is itself another JS-object, it will be copied in a shallow manner.
    "use strict";
    // console.log("deepCopy:", object);
    if (object === undefined) {
        return {}; // REMEMBER this always returns an object!
    }
    let copycat;
    if (Array.isArray(object)) {
        copycat = [];
        for (const element of object) {
            copycat.push(deepCopy(element));
        }
        return copycat;
    }
    copycat = {};
    for (const key of Object.keys(object)) {
        if (typeof object[key] === "object") {
            copycat[key] = deepCopy(object[key]);
        } else {
            copycat[key] = object[key];
        }
    }
    return copycat;
}

function dummyDeepCopy(object) {
    return JSON.parse(JSON.stringify(object));
}

function setConcat(X, Y) {
    const xORy = deepCopy(X);
    for (const y of Y) {
        // console.log(y, xORy);
        if (!deepIncludes(y, xORy)) {
            xORy.push(y);
        }
    }
    return xORy;
}

function removeAll(list, toBeRemoved) {
    "use strict";
    // console.log(list, toBeRemoved);
    if (toBeRemoved.length === 0) {
        return list;
    }
    for (let i=0; i<list.length; i++) {
        if (deepIncludes(list[i], toBeRemoved, true)) { // Shallow check, might need revision!
            // console.log("List pre-splice in removeAll: ", list, "\nList[i]: ", list[i]);
            list.splice(i, 1);
            // console.log("List post splicing: ", list);
            // debugger;
            i--;
        }
    }
    return list;
}

function deepIndexOf(list, item) { // Deep equivalent of Array.prototype.indexOf().
    for (let i=0; i<list.length; i++) {
        if (deepEquals(item, list[i])) {
            return i;
        }
    }
    return -1;
}

function deepEquals(x, y) { // x, y are objects --- possibly restricted version of deep equality for our purposes only!
    "use strict";
    // console.log("Equals?");
    // console.log(x);
    // console.log(y);
    if (typeof x != typeof y) {
        return false;
    }
    if (!(typeof x == "object")) {
        return x === y;
    }
    const xKeys = Object.keys(x);
    const yKeys = Object.keys(y);
    if (xKeys.length != yKeys.length) {
        return false;
    }
    for (let i=0; i<xKeys.length; i++) {
        let xi = x[xKeys[i]];
        let yi = y[yKeys[i]];
        if (xKeys[i] != yKeys[i] || (typeof xi !== "object" && xi != yi) || !deepEquals(xi, yi)) {
            return false;
        }
    }
    return true;
}

function arrayDeepEquals(x, y) { // x, y are arrays --- not used as of now!
    "use strict";
    if (x.length != y.length) {
        return false;
    }
    for (let i=0; i<x.length; i++) {
        if (!deepEquals(x[i], y[i])) {
            return false;
        }
    }
    return true;
}

function deepIncludes(object, list, stringHash = false) { // Re-implementation of Array.prototype.includes() that checks at depth=1 for equal objects. 
    // "use strict"; // TODO Consider rewriting this or somehow map each object to its (hashed) string representation (it seems that this is what you actually need).
    if (list === undefined) {
		return false;
	}
    if (stringHash) { // FIXME Too bad...
        // const stringLiteral = literalToString(object);
        // for (const entry of list) {
        //     if (literalToString(entry) == stringLiteral) {
        //         return true;
        //     }
        // }
        for (const entry of list) {
            if (unify(object, entry) !== undefined) {
                return true;
            }
        }
        return false;
    }
    for (const entry of list) {
        if (deepEquals(object, entry)) {
            return true;
        }
    }
    return false;
}

function isSuperset(list1, list2) {
    for (const item of list2) {
        if (!deepIncludes(item, list1)) {
            return false;
        }
    }
    return true;
}

function containsSupersets(listOfLists, list) {
    for (const item of listOfLists) {
        if (isSuperset(item, list)) {
            return true;
        }
    }
    return false;
}

function containsSubsets(listOfLists, list) {
    for (const item of listOfLists) {
        if (isSuperset(list, item)) {
            // console.log(list);
            // console.log(item);
            // debugger;
            return true;
        }
    }
    return false;
}

function removeSupersets(listOfLists, list) {
    const toBeRemoved = [];
    for (const item of listOfLists) {
        if (isSuperset(item, list)) {
            toBeRemoved.push(item);
        }
    }
    return removeAll(listOfLists, toBeRemoved);
}


function isVarString(string) { // Is this really needed?
    // console.log("string:", string);
    return /[A-Z]/.test(("" + string).charAt(0));
}

// TODO add to all items a 'string' field which will correspond to its string representation, so as to avoid all these conversion functions (is this useful?)

/*
Domains Syntax Exm:
pred1: {
    [\w+, \w+, ...],
    [\w+, \w+, ...],
}
pred2: {
    [\w+, \w+, ...],
    [\w+, \w+, ...],
}

@KnowledgeBase
R :: f(X, Y), g(X, Z) implies h(X);

Target: h(a);

Domains:
f: {[a, b, c], [a, b]}
g: {[a, b,c, d ], [a, c,d ]}
*/

function parseDomains(domainsString) {
    const syntaxCheck = /(\s*\w+\s*:\s*\{\s*(\[(\s*\w+\s*,)*\s*\s+\s*\]\s*,)*\[(\s*\w+\s*,)*\s*\s+\s*\]\s*\}\s*)*/;
    if (!syntaxCheck.test(domainsString)) {
        return {
            type: "error",
            name: "DomainSyntaxError",
            message: "There is some syntax error in some of the declared predicate domain(s).",
        };
    }
    const predicateDelim = /\s*}\s*/;
    const predicateDomainsArray = domainsString.split(predicateDelim);
    // console.log(predicateDomainsArray);
    const predicates = {};
    for (const predicateDomain of predicateDomainsArray) {
        if (predicateDomain === "") {
            continue;
        }
        const nameSplit = predicateDomain.trim().split(/\s*:\s*{\s*/);
        // console.log(nameSplit);
        predicates[nameSplit[0]] = parseValues(nameSplit[1]);
    }
    // console.log(predicates);
    return {
        type: "output",
        predicates: predicates,
    };
}

function parseValues(values) {
    const argDelim = /\s*(?<=\]\s*),\s*/;
    const argumentValuesArray = values.split(argDelim);
    // console.log(argumentValuesArray);
    const argumentValues = [];
    for (const argValues of argumentValuesArray) {
        argumentValues.push(argValues.substring(1,argValues.length - 1).trim().split(/\s*,\s*/));
    }
    return argumentValues;
}

function parseContext(context) { // FIXME There is some issue here, parsing seems to be way to lenient.
    "use strict";
    if (context === undefined || context === "") {
        return {
            type: "output", // TODO You may add some warning here?
            context: [],
        }
    }
    const spacingRe = /(\t|\r|\n|\v|\f|\s)*/;
    const varNameRe = /(([a-zA-Z0-9]\w*)|(-?\d+[.]?\d*)|(\[(\s*\w+,\s*)*\s*\w+\s*\]))/; // FIXME This has been altered recently, allowing for variables in contexts!
    const predicateNameRe = /-?[a-z]\w*/;
    const casualPredicateRe = RegExp(predicateNameRe.source + String.raw`\((\s*` + varNameRe.source + String.raw`\s*,)*\s*` + varNameRe.source + String.raw`\s*\)`);
    const propositionalPredicateRe = /-?[a-z]\w*/;
    const predicateRe = RegExp(String.raw`((` + casualPredicateRe.source + String.raw`)|(` + propositionalPredicateRe.source + String.raw`))`);
    const contextRE = RegExp(String.raw`(` + spacingRe.source + predicateRe.source + String.raw`\s*;\s*)+` + spacingRe.source);
    // const contextRE = /(\t|\r|\n|\v|\f|\s)*(-?[a-z]\w*\((\s*(([a-z0-9]\w*)|(\d+[.]?\d*))\s*,)*\s*(([a-z0-9]\w*)|(\d+[.]?\d*))\s*\)\s*;\s*)+(\t|\r|\n|\v|\f|\s)*/;
    if (!contextRE.test(context)) {
        return {
            type: "error",
            name: "ContextSyntaxError",
            message: "I found some syntax error in your context, however I am still in beta, so I cannot tell you more about that! :)",
        };
    }
    // console.log(context);
    const contextList = getRuleBody(context.trim());
    // console.log(contextList);
    return {
        type: "output",
        context: contextList,
    };
}

function parseTarget(targets) {
    "use strict";
    const spacingRe = /(\t|\r|\n|\v|\f|\s)*/;
    const varNameRe = /(([a-z0-9]\w*)|(\d+[.]?\d*))/;
    const predicateNameRe = /-?\!?[a-z]\w*/; // In targets you may also allow for actions to be included --- which is not true for contexts.
    const casualPredicateRe = RegExp(predicateNameRe.source + String.raw`\((\s*` + varNameRe.source + String.raw`\s*,)*\s*` + varNameRe.source + String.raw`\s*\)`);
    const propositionalPredicateRe = /-?[a-z]\w*/;
    const predicateRe = RegExp(String.raw`((` + casualPredicateRe.source + String.raw`)|(` + propositionalPredicateRe.source + String.raw`))`);
    const targetRE = RegExp(String.raw`(` + spacingRe.source + predicateRe.source + String.raw`\s*;\s*)+` + spacingRe.source);
    // const contextRE = /(\t|\r|\n|\v|\f|\s)*(-?[a-z]\w*\((\s*(([a-z0-9]\w*)|(\d+[.]?\d*))\s*,)*\s*(([a-z0-9]\w*)|(\d+[.]?\d*))\s*\)\s*;\s*)+(\t|\r|\n|\v|\f|\s)*/;
    if (!targetRE.test(targets)) {
        return {
            type: "error",
            name: "TargetSyntaxError",
            message: "I found some syntax error in your targets. Remember that only predicates with **all** their arguments instantiated (i.e. constants) should appear. Also, all predicates should be separated by a semicolon (;), including the last one.",
        };
    }
    // console.log(context);
    let targetList = getRuleBody(targets.trim());
    // console.log(contextList);
    return {
        type: "output",
        targets: targetList,
    };
}

/*
A list may have one of the following forms:
    1. [a, b, c, ...]
    2. [X, Y, ... | A]
    3. [X, Y, ... | [a, b, c, ...]]
*/

function getList(argument) {
    if (argument.includes("|")) {
        const listArray = argument.split("|");
        let tail;
        if (tail.includes("[")) {
            tail = parseList(listArray[1].trim().substring(1,length - 1));
        } else {
            tail = {
                name: listArray[1].trim(),
                value: undefined,
                isAssigned: false,
            };
        }
        return {
            isSplit: true,
            head: parseList(listArray[0].trim()),
            tail: tail,
            list: undefined,
        };
    }
    return {
        isSplit: false,
        head: undefined,
        tail: undefined,
        list: parseList(argument.trim().substring(1, length - 1)),
    };
}

function parseList(listString) { // Input is of the form arg1, arg2, ..., argN, where argi is variable or constant.
    return getLiteralArguments(listString); // TODO Just rename the function below and make sure everything is up to date.
}

function parseConflicts() { // TODO You are here!
    return;
}

function getLiteralArguments(argumentsString) {
    "use strict";
    const splitDelim = /(?<!(?:\[(?:\s*\w+\s*,)*\s*\w+\s*))(?:,)/;
    const argumentsArray = argumentsString.split(splitDelim);
    // console.log(argumentsArray);
    const args = [];
    for (let i=0; i<argumentsArray.length; i++) {
        let name;
        let value;
        let muted = false;
        const argument = argumentsArray[i].trim();
        const isVar = /[A-Z_]/;
        const isExpression = /[^\w]/.test(argument);
        const isAssigned = !isVar.test(argument.charAt(0)) || isExpression;
        const isList = /\[.+\]/.test(argument); // TODO This may need to be further specified.
        let list = undefined;
        if (isList) {
            list = argument.substring(1, argument.length - 1).split(/(?:\s*,\s*)/);
            list[0] = list[0].trim();
            list[list.length - 1] = list[list.length - 1].trim();
        }
        if (isAssigned) {
            name = undefined;
            value = argument;
        } else if (name === "_") {
            name = undefined;
            value = undefined;
            muted = true;
        } else {
            name = argument;
            value = undefined;
        }
        // console.log("name:", name, "\nargument:", argument);
        args.push({
            index: i,
            name: name,
            isAssigned: isAssigned,
            value: value,
            muted: muted,
            isList: isList,
            list: list,
            isExpression: isExpression,
        });
    }
    return args;
}

function getRuleBody(bodyString) {
    "use strict";
    // const delim = /((?<=(?:\)\s*))(?:,))|((?<!(?:\([a-zA-Z0-9_,\s]+\)))(?:,))|(?:;)/; //This is added for the context. Originally, only /,/ is needed!
    const delim = /(?:;)|((?<=(?:\)\s*))(?:,))|((?<!(?:\(.*))(?:,))/;
    const bodyArray = bodyString.trim().split(delim);
    if (bodyArray[bodyArray.length-1] === "") {
        bodyArray.pop();
    }
    // console.log(bodyArray);
    for (let i=0; i<bodyArray.length; i++) {
        const literal = bodyArray[i];
        if (literal === undefined || literal === "" || literal === "," || literal === ";") {
            bodyArray.splice(i, 1);
            i--;
        }
    }
    // console.log("Body array:");
    // console.log(bodyArray);
    const body = [];
    for (const literal of bodyArray) {
        // console.log(name);
        body.push(parseLiteral(literal));
    }
    // console.log("Body:");
    // console.log(body);
    return body;
}

function parseListOfLiterals(stringList) {
    const list = [];
    for (const item of stringList) {
        list.push(parseLiteral(item));
    }
    return list;
}

function parseLiteral(literal) {
    let name;
    let sign;
    const delimiter = /\(|\)/;
    const literalSplit = literal.trim().split(delimiter); // 0 - name, 1 - arguments.
    if (literalSplit[0].charAt(0) === "-") {
        name = literalSplit[0].substring(1);
        sign = false;
    } else {
        name = literalSplit[0];
        sign = true;
    }
    let args = undefined;
    let arity = 0;
    if (literalSplit.length > 1) {
        args = getLiteralArguments(literalSplit[1]);
        arity = args.length;
    }
    return {
        name: name,
        sign: sign,
        isJS: (name.charAt(0) === "?"),
        isEquality: (name === "?="),
        isInequality: (name === "?<"),
        isAction: (name.charAt(0) === "!"),
        args: args,
        arity: arity,
    }
}

function getRuleHead(headString) {
    "use strict";
    let name;
    let sign;
    const delimiter = /\(|\)/;
    const literalSplit = headString.trim().split(delimiter); // 0 - name, 1 - arguments.
    if (literalSplit[0].charAt(0) === "-") {
        name = literalSplit[0].substring(1);
        sign = false;
    } else {
        name = literalSplit[0];
        sign = true;
    }
    let args = undefined;
    let arity = 0;
    if (literalSplit.length > 1) {
        args = getLiteralArguments(literalSplit[1]);
        arity = args.length;
    }
    return {
        name: name,
        sign: sign,
        isJS: false,
        isEquality: false,
        isInequality: false,
        isAction: (name.charAt(0) === "!"),
        args: args,
        arity: arity,
    };
}

function kbToObject(kb) {
    "use strict";
    const rules = kb.split(";").filter(Boolean);
    const kbObject = [];
    for (const rule of rules){
        const delimiter = /(?:::)|(?:\simplies\s)/;
        const ruleSplit = rule.trim().split(delimiter); // 0 - name, 1 - body, 2 - head.
        const name = ruleSplit[0].trim();
        kbObject.push({
            name: name,
            body: getRuleBody(ruleSplit[1].trim()),
            head: getRuleHead(ruleSplit[2].trim()),
        });
    }
    
    return kbObject;
}

function parseKB(kbAll) {
    "use strict";
    const warnings = [];
    if (!kbAll.includes("@KnowledgeBase") && !kbAll.includes("@Knowledge")){
        return {
            type: "error",
            name: "KnowledgeBaseDecoratorNotFound",
            message: "I found no @Knowledge decorator. Enter a single @Knowledge below your imports (if any) and prior to your knowledge base's rules.",
        };
    }
    const kbNoCode = kbAll.split(/\@KnowledgeBase|\@Knowledge/);
    if (kbNoCode.length > 2){
        return {
            type: "error",
            name: "MultipleKnowledgeBaseDecorators",
            message: "Found more than two (2) @Knowledge decorators. Enter a single @Knowledge below your imports (if any) and prior to your knowledge base's rules.",
        };
    }
    const imports = kbNoCode[0].trim() //You need some exception handling here as well...
    const kbWithCode = kbNoCode[1].trim();
    let kb;
    let code;
    if (kbWithCode.includes("@Code") || kbWithCode.includes("@Procedures")) {
        const finalSplit = kbWithCode.split(/\@Code|\@Procedures/);
        kb = finalSplit[0].trim();
        code = finalSplit[1].trim();
        if (code.length === 0) {
            warnings.push({
                type: "warning",
                name: "CodeNotFound",
                message: "I found no code under the @Procedures decorator. While I have no issue with that, as a kind reminder, @Procedures is used strictly below your knowledge base's rules to declare any custom Javascript predicates."
            });
        }
    } else {
        kb = kbWithCode;
        code = undefined;
    }
    // const kbRe = RegExp(String.raw`(` + ruleName.source + String.raw`\s*::(\s*` + predicateRe.source + String.raw`\s*,)*\s*` + predicateRe.source + String.raw`\s+implies\s+` + headRe.source + String.raw`\s*;` + spacingRe.source + String.raw`)+`); // CHECKED!
    // const kbRe = /((\t|\r|\n|\v|\f|\s)*\w+\s*::(\s*((-?\??[a-z]\w*)|(\?=)|(\?<))\((\s*(([a-zA-z]\w*)|(\d+[.]?\d*)|_)\s*,)*\s*(([a-zA-z]\w*)|(\d+[.]?\d*)|_)\s*\)\s*,)*\s*((-?\??[a-z]\w*)|(\?=)|(\?<))\((\s*(([a-zA-z]\w*)|(\d+[.]?\d*)|_)\s*,)*\s*(([a-zA-z]\w*)|(\d+[.]?\d*)|_)\s*\)\s+implies\s+((-?!?[a-z]\w*))\((\s*(([a-zA-z]\w*)|(\d+[.]?\d*)|_)\s*,)*\s*(([a-zA-z]\w*)|(\d+[.]?\d*)|_)\s*\)\s*;(\t|\r|\n|\v|\f|\s)*)+/;
    // console.log(kbRe.source);
    // console.log(kb.match(kbRe));
    // console.log(kbToObject(kb));
    // if (!kb.match(kbRe) || kb.match(kbRe)[0] !== kb) {
    // TODO In order to allow for comments you have to simply wipe our anything in a line after {//} or between {/* */}
    // console.log("kb (pre):", kb);
    // const oldKb = kb;
    kb = stripeComments(kb);
    // console.log(oldKb, kb);
    // console.log("kb (post):", kb);
    // console.log(oldKb.length, kb.length);
    // console.log("equals?", kb === oldKb);
    const kbTest = kbCheck(kb);
    // console.log(kbTest);
    if (kbTest["type"] === "error") {
        return kbTest;
    }
    const duplicate = containsDuplicates(kbTest["rules"]);
    if (duplicate) {
        return {
            type: "error",
            name: "DuplicateRuleNamesError",
            message: `You have provided at least two rules with the same name (${duplicate}).`,
        };
    }
    return {
        type: "output",
        kb: kbToObject(kbTest["rules"]),
        constraints: parseConstraints(kbTest["constraints"]),
        code: codeToObject(code),
        customPriorities: kbTest["customPriorities"],
        imports: imports,
        warnings: warnings,
    };
}

function stripeComments(kbString) { // Stripes out anything after // or between /* */, including delimiters.
    const kbLines = kbString.match(/[^\r\n]+/g);
    // console.log(kbLines);
    let stripedLines = "";
    let multilineComment = false;
    for (const line of kbLines) {
        // console.log("line:", line);
        if (multilineComment) {
            if (line.includes("*/")) {
                // console.log("p:", stripedLines);
                stripedLines += line.substring(line.lastIndexOf("*/") + 2).trim();// + "\n";
                // console.log("P:", stripedLines);
                multilineComment = false;
            }
            continue;
        }
        if (line.includes("//")) {
            stripedLines += line.substring(0, line.indexOf("//")).trim();// + "\n";
            continue;
        }
        if (line.includes("/*")) {
            stripedLines += line.substring(0, line.indexOf("/*")).trim();// + "\n";
            multilineComment = true;
            continue;
        }
        stripedLines += line.trim();
    }
    // console.log("final:", stripedLines);
    if (stripedLines === "") {
        return kbString;
    }
    return stripedLines;
}

function kbCheck(kb) {
    const spacingRe = /\s*/; // CHECKED!
    const predicateNameRe = /(-?\??[a-z]\w*)/; // CHECKED!
    const mathPredicateRe = /\s*((-?\?=)|(-?\?<))\(.+,.+\)\s*/; // CHECKED!
    const headNameRe = /((-?!?[a-z]\w*))/; // CHECKED!
    const simpleListRe = /(\[(\s*\w+,\s*)*\s*\w+\s*\])/; // Syntactically, you have allowed for a (grounded?) list to contain variables. // CHECKED!
    const headTailListRe = RegExp(String.raw`(\[(\s*\w+\s*,)*\s*\w+\s*\|\s*(([A-Z_]\w*)|` + simpleListRe.source + String.raw`)\s*\])`); // CHECKED!
    const listRe = RegExp(String.raw`(` + simpleListRe.source + String.raw`|` + headTailListRe.source + String.raw`)`); // CHECKED!
    // const varNameRe = RegExp(String.raw`(([a-zA-z]\w*)|(\d+[.]?\d*)|_|` + listRe.source + String.raw`)`); // CHECKED!
    const varNameRe = RegExp(String.raw`(([a-zA-z]\w*)|(-?\d+[.]?\d*)|_|([\+\-\*\/\(\)\da-zA-Z]+))`); // FIXME Add more sophistication in the validity of mathematical expressions.
    const oldVarNameRe = RegExp(String.raw`(([a-zA-z]\w*)|(-?\d+[.]?\d*)|_)`);
    // const varNameRe = /(([a-zA-z]\w*)|(\d+[.]?\d*)|_|)/; // CHECKED!
    const ruleName = RegExp(spacingRe.source + String.raw`\w+`); // CHECKED!
    const casualPredicateRe = RegExp(String.raw`(` + predicateNameRe.source + String.raw`\((\s*` + varNameRe.source + String.raw`\s*,)*\s*` + varNameRe.source + String.raw`\s*\))`); // CHECKED!
    const oldCasualPredicateRe = RegExp(String.raw`(` + predicateNameRe.source + String.raw`\((\s*` + oldVarNameRe.source + String.raw`\s*,)*\s*` + oldVarNameRe.source + String.raw`\s*\))`);
    const propositionalPredicateRe = /(-?[a-z]\w*)/; // CHECKED!
    const predicateRe = RegExp(String.raw`((` + casualPredicateRe.source + String.raw`)|(` + mathPredicateRe.source + String.raw`)|(` + propositionalPredicateRe.source + String.raw`))`); // CHECKED!
    const oldPredicateRe = RegExp(String.raw`((` + oldCasualPredicateRe.source + String.raw`)|(` + mathPredicateRe.source + String.raw`)|(` + propositionalPredicateRe.source + String.raw`))`); // CHECKED!
    // console.log(predicateRe.source);
    const casualHeadRe = RegExp(headNameRe.source + String.raw`\((\s*` + varNameRe.source + String.raw`\s*,)*\s*` + varNameRe.source + String.raw`\s*\)`); // CHECKED!
    const propositionalHeadRe = /(-?!?[a-z]\w*)/; // CHECKED!
    const orListRe = RegExp(String.raw`(\s*\(\s*` + predicateRe.source + String.raw`\s+or\s+` + predicateRe.source + String.raw`(\s+or\s+` + predicateRe.source + String.raw`\s*)*` + String.raw`\s*\)\s*)`); // OR structure "(predicate or predicate or ... )"
    const bodyRe = RegExp(String.raw`((\s*` + String.raw`((` + predicateRe.source + String.raw`)|(` + orListRe.source + String.raw`))` + String.raw`\s*,)*\s*` + String.raw`(` + predicateRe.source  + String.raw`)|(` + orListRe.source + String.raw`))`); // CHECKED!
    // const bodyRe = RegExp(String.raw`(\s*` + predicateRe.source + String.raw`\s*,)*\s*` + String.raw`(` + predicateRe.source + String.raw`)`); // CHECKED!
    // console.log(bodyRe.source);
    const headRe = RegExp(String.raw`((` + casualHeadRe.source + String.raw`)|(` + propositionalHeadRe.source + String.raw`))`); // CHECKED!
    // console.log(headRe.source);
    const priorityRe = /(\s*\|\s*-?\d+)?/;
    // const kbRe = RegExp(String.raw`(` + ruleName.source + String.raw`\s+::\s+` + bodyRe.source + String.raw`\s+implies\s+` + headRe.source + String.raw`\s*;` + spacingRe.source + String.raw`)+`); // CHECKED!
    const ruleRe = RegExp(String.raw`(^` + ruleName.source + String.raw`\s*::\s*(` + bodyRe.source + String.raw`)?\s+implies\s+` + headRe.source + priorityRe.source + String.raw`\s*;` + spacingRe.source + String.raw`$)`);
    const constrainRe = RegExp(String.raw`(` + ruleName.source + String.raw`\s*::\s*(` + oldPredicateRe.source + String.raw`|` + headRe.source + String.raw`)\s+#\s+(` + oldPredicateRe.source + String.raw`|` + headRe.source + String.raw`)\s*;` + spacingRe.source + String.raw`)`, "i");
    const ruleStrings = kb.split(";").filter(Boolean);
    let rules = "", constraints = "", customPriorities = {}, rulesObject;
    // console.log(ruleStrings);
    for (let i=0; i<ruleStrings.length; i++) {
        const ruleString = ruleStrings[i].trim() + ";";
        const ruleMatch = ruleString.match(ruleRe);
        const constraintMatch = ruleString.match(constrainRe);
        if (ruleMatch && ruleMatch[0] === ruleString) {
            rulesObject = stripePriorityFromRule(ruleString);
            rules += rulesObject["rule"];
            if (rulesObject["priority"] !== undefined) {
                customPriorities[rulesObject["rule"].split("::")[0].trim()] = rulesObject["priority"];
            }
        }
        else if (constraintMatch && constraintMatch[0] === ruleString) {
            constraints += ruleString;
            // console.log("constraints:", constraints);
        }
        else {
            return {
                type: "error",
                name: "KnowledgeBaseSyntaxError",
                message: `Invalid syntax in rule "${ruleString}"`,
            };
        }
    }
    return {
        type: "valid", // FIXME Well, better phrasing would be... better.
        rules: rules,
        constraints: constraints,
        customPriorities: customPriorities,
    }
}

function stripePriorityFromRule(ruleString) {
    if (!ruleString.includes("|")) {
        return {rule: ruleString, priority: undefined};
    }
    const splitRule = ruleString.split("|").filter(Boolean);
    return {
        rule: splitRule[0].trim() + ";",
        priority: parseInt(splitRule[1].trim()),
    };
}

function containsDuplicates(kbString) {
    const ruleNames = [];
    for (const rule of kbString.split(";")) {
        const trimmedRule = rule.trim();
        const newRuleName = trimmedRule.substring(0, trimmedRule.indexOf("::")).trim();
        if (ruleNames.includes(newRuleName)) {
            return newRuleName;
        }
        ruleNames.push(newRuleName);
    }
    return undefined;
}

function parseConstraints(constraintsString) {
    const constraints = new Map();
    let item;
    for (const constraint of constraintsString.split(";").filter(Boolean)) {
        item = parseConstraint(constraint);
        if (constraints.has(item["key1"])) {
            constraints.get(item["key1"])["constraints"].push(item["constraint1"]);
        } else {
            constraints.set(item["key1"], {constraints: [item["constraint1"]], keyObject: item["constraint2"]});
        }
        if (constraints.has(item["key2"])) {
            constraints.get(item["key2"])["constraints"].push(item["constraint2"]);
        } else {
            constraints.set(item["key2"], {constraints: [item["constraint2"]], keyObject: item["constraint1"]});
        }
    }
    return constraints;
}

function parseConstraint(constraintString) {
    // console.log("constraintsString:", constraintString);
    const predicates = constraintString.split("::")[1].split("#");
    // console.log("predicates:", predicates);
    // .split("#");
    const leftPredicate = parseLiteral(predicates[0]);
    const rightPredicate = parseLiteral(predicates[1]);
    return {
        key1: ((leftPredicate["sign"])? "" : "-") + leftPredicate["name"] + leftPredicate["arity"],
        constraint1: rightPredicate,
        key2: ((rightPredicate["sign"])? "" : "-") + rightPredicate["name"] + rightPredicate["arity"],
        constraint2: leftPredicate,
    }
}

function codeToObject(code) { // TODO You need to take care of errors here like defining the same function twice etc and create appropriate messages!
    if (code === undefined || code.length === 0) {
        return undefined;
    }
    const listOfFunctions = {};
    const delim = "function";
    const codeArray = code.trim().split(delim);
    // console.log("Code array:");
    // console.log(codeArray);
    for (const func of codeArray) {
        if (func !== "") {
            const functionObject = parseJsFunction(func);
            listOfFunctions[functionObject["name"]] = {
                args: functionObject["args"],
                source: functionObject["source"],
            };
        }
    }
    // console.log("List:");
    // console.log(listOfFunctions);
    // debugger;
    return listOfFunctions;
}

function parseJsFunction(functionCode) {
    // console.log(functionCode);
    // debugger;
    functionCode = functionCode.trim();
    const functionHeader = functionCode.split("{")[0];
    const functionHeaderArray = functionHeader.split("(");
    const functionName = functionHeaderArray[0];
    // console.log(functionHeaderArray);
    // debugger;
    const argsArray = functionHeaderArray[1].trim().substring(0,functionHeaderArray[1].length - 1).split(",");
    // console.log(argsArray);
    argsArray[argsArray.length - 1] = argsArray[argsArray.length - 1].substring(0, argsArray[argsArray.length - 1].length - 1);
    // console.log(argsArray);
    for (let i=0; i<argsArray.length; i++) {
        argsArray[i] = argsArray[i].trim();
    }
    let functionSource = functionCode.trim().substring(functionCode.indexOf("{") + 1, functionCode.length);
    functionSource = functionSource.substring(0, functionSource.length - 1);
    return {
        name: functionName.trim(),
        args: argsArray,
        source: functionSource,
    };
}

/*
@KnowledgeBase
R :: f(X), g(Y), ?my_func(X, Y) implies h(X, Y);

@Code
function my_func(u, v) {
    u = u + "b";
    v = "b" + v;
    return u == v;
}
*/

// Object-to-string related methods

function literalToString(literal) {
    if (literal === undefined) {
        return undefined;
    }
    let literalString = literal["name"];
    if (!literal["sign"]) {
        literalString = "-" + literalString;
    }
    const args = literal["args"];
    if (args === undefined) {
        return literalString;
    }
    literalString += "(";
    for (let i=0; i<args.length; i++) {
        const arg = args[i];
        let val = arg["name"];
        if (arg["isAssigned"]) {
            val = arg["value"];
        }
        literalString += val;
        if (i < args.length - 1) {
            literalString += ", ";
        }
    }
    literalString += ")";
    return literalString;
}

function ruleToString(rule) {
    if (rule === undefined) {
        return undefined;
    }
    let ruleString = rule["name"] + " :: ";
    const body = rule["body"];
    // console.log(rule);
    // console.log(body);
    // debugger;
    for (let i=0; i<body.length; i++) {
        const literal = body[i];
        ruleString += literalToString(literal);
        // console.log(ruleString);
        if (i < body.length - 1) {
            ruleString += ", ";
        }
    }
    ruleString += " implies " + literalToString(rule["head"]) + ";";
    return ruleString;
}

function kbToString(kb) {
    if (kb === undefined) {
        return undefined;
    }
    let kbString = "";
    for (let i =0; i<kb.length; i++) {
        const rule = kb[i];
        kbString += ruleToString(rule);
        if (i < kb.length - 1) {
            kbString += ";\n";
        }
    }
    return kbString;
}

function contextToString(context) {
    if (context === undefined) {
        return undefined;
    }
    let contextString = "";
    for (let i=0; i<context.length; i++) {
        const literal = context[i];
        contextString += literalToString(literal) + ";"
        if (i < context.length - 1) {
            contextString += " ";
        }
    }
    return contextString;
}

function contextToListOfStrings(context) {
    if (context === undefined) {
        return undefined;
    }
    let list = [];
    for (const literal of context) {
        list.push(literalToString(literal));
    }
    return list;
}

function listOfLiteralsToString(list) {
    let output = "";
    for (const item of list) {
        output += item + "; ";
    }
    return output;
}

function graphToString(graph) {
    if (Object.keys(graph).length === undefined || Object.keys(graph).length === 0) {
        return "\{\}";
    }
    let graphString = "\{\n";
    for (const key of Object.keys(graph)) {
        // console.log(key);
        graphString += key + ": [";
        for (let i=0; i<graph[key].length; i++) {
            graphString += ruleToString(graph[key][i]);
            if (i < graph[key].length - 1) {
                graphString += " ";
            }
        }
        graphString += "]\n";
    }
    graphString += "}";
    return graphString;
}

function dilemmasToString(dilemmas) {
	if (dilemmas === undefined) {
		return "\{\}";
	}
	let dilemmasString = "\{\n";
	let dilemma;
	for (let i=0; i<dilemmas.length; i++) { // TODO define subToString!
		dilemma = dilemmas[i];
		dilemmasString += "[" + ruleToString(dilemma[0]) + ", " + ruleToString(dilemma[1]) + ", " + subToString(dilemma[2]) + "]\n";
	}
	return dilemmasString + "\}";
}

function subToString(sub) {
    if (sub === undefined) {
        return "\{\}";
    }
	let variable, subString = "\{";
	for (let i=0; i<Object.keys(sub).length; i++) {
		variable = Object.keys(sub)[i];
		if (variable === "undefined") {
			continue;
		}	
		subString += variable + " -> " + sub[variable] + ", ";
	}
	return subString.substring(0, subString.length - 2) + "}";
}

function abductiveProofsToString(proofs) {
    let proofString = "";
    for (const proof of proofs) {
        // proofString += "\n[" + contextToString(proof) + "]";
        proofString += "\n" + proofToString(proof) + ";";
    }
    return proofString;
}

function proofToString(proof) {
    let proofString = "[";
    for (const key of Object.keys(proof)) {
        if (proof[key] === 0) {
            proofString += "~" + key + "; ";
        } else if (proof[key] === 1) {
            proofString += key + "; ";
        } else {
            proofString += "-" + key + "; ";
        }
    }
    return proofString.substring(0, proofString.length - 1) + "]";
}

module.exports = {
    forwardChaining,
    parseKB,
    parseContext,
};