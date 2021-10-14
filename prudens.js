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

function getSubstitutions(body, facts) {
    "use strict";
    // console.log(body);
    let substitutions = extendByFacts(body[0], facts);
    // console.log(substitutions);
    // substitutions = substitutions.filter((element) => {return element !== undefined});
    // console.log("Subs Init:");
    // console.log(substitutions);
    // debugger;
    const jsLiterals = [];
    const propositionalLiterals = [];
    for (let i=1; i<body.length; i++) {
        if (body[i]["isJS"]) {
            jsLiterals.push(body[i]);
            // console.log("JS Literals:");
            // console.log(jsLiterals);
            continue;
        }
        // console.log(i);
        if (body[i]["arity"] === 0) {
            propositionalLiterals.push(body[i]);
            // console.log("Props:");
            // console.log(propositionalLiterals);
            continue;
        }
        const toBeRemoved = [];
        const toBePushed = [];
        for (const sub of substitutions) {
            // console.log("Sub:");
            // console.log(sub);
            let literal = {
                name: body[i]["name"],
                sign: body[i]["sign"],
                isJS: body[i]["isJS"],
                isEquality: body[i]["isEquality"],
                isInequality: body[i]["isInequality"],
                args: apply(sub, body[i]["args"]),
                arity: body[i]["arity"],
            }
            // console.log("Substituted literal:");
            // console.log(literal);
            let extended = false;
            for (const fact of facts) {
                // console.log("literal/Fact:");
                // console.log(literal);
                // console.log(fact);
                const unifier = unify(literal, fact);
                // console.log("Unifier:");
                // console.log(unifier);
                if (unifier != undefined) {
                    const extension = extend(sub, unifier);
                    if (unifier != undefined && extension != undefined) {
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
    // console.log("subs:");
    // console.log(substitutions);
    return {
        "subs": substitutions,
        "propositions": propositionalLiterals,
    };
}

function extendByFacts(literal, facts) {
    "use strict";
    const subs = [];
    // console.log("Facts");
    // console.log(facts);
    for (const fact of facts) {
        if (fact["arity"] !== 0) {
            let unifier = {};
            if (literal["isJS"]) {
                const equality = equalityCheck(literal, unifier);
                unifier = equality["unifier"];
                // console.log("Unifier:");
                // console.log(unifier);
            } else {
                unifier = unify(literal, fact);
                // console.log("Unifier:");
                // console.log(unifier);
            }
            (unifier != undefined) && subs.push(unifier);
            // console.log(subs);
            // debugger;
        }
    }
    // console.log("Ext by Facts:");
    // console.log(subs.filter(Boolean));
    // console.log(literal);
    // console.log(facts);
    // console.log("Un-Filtered");
    // console.log(subs);
    // const substitutions = subs.filter((element) => {return element !== undefined});
    // console.log("Subs in extendByFacts:");
    // console.log(subs.filter((element) => {return element !== undefined}));
    return subs;
}

// Substitution = {varname1: val1, varname2: val2, ...}

function apply(sub, args) {
    "use strict";
    if (args === undefined) {
        return undefined;
    }
    const localArguments = [];
    for (const argument of args) {
        if (!argument["isAssigned"] && Object.keys(sub).includes(argument["name"])) {
            localArguments.push({
                index: argument["index"],
                name: argument["name"],
                isAssigned: true,
                value: sub[argument["name"]],
                muted: argument["muted"],
            });
        } else {
            localArguments.push(argument);
        }
    }
    return localArguments;
}

function unify(x, y) { // x, y are literals. Assymetric unification since y is assumed variable-free!
    "use strict";
    if (x["name"] != y["name"] || x["arity"] != y["arity"] || x["sign"] != y["sign"]) {
        return undefined;
    }
    const xArgs = x["args"];
    const yArgs = y["args"];
    const unifier = {};
    for (let i=0; i<x["arity"]; i++) {
        let xArg = xArgs[i];
        let yArg = yArgs[i];
        if (xArg["muted"] || yArg["muted"]) {
            continue;
        }
        if (xArg["isAssigned"] && xArg["value"] != yArg["value"]) {
            return undefined;
        }
        if (Object.keys(unifier).length > 0 && Object.keys(unifier).includes(xArg["name"]) && unifier[xArg["name"]] != yArg["value"]) {
            return undefined;
        }
        unifier[xArg["name"]] = yArg["value"];
    }
    return unifier;
}

function extend(sub, unifier) {
    "use strict";
    // console.log("Unifier:");
    // console.log(unifier);
    const extendedSub = deepCopy(sub);
    for (const key of Object.keys(unifier)) {
        if (Object.keys(extendedSub).includes(key) && extendedSub[key] != unifier[key]) {
            return undefined;
        } else if (!Object.keys(extendedSub).includes(key)) {
            extendedSub[key] = unifier[key];
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

function filterBody(body) {
    props = [];
    fols = [];
    for (let i=0; i<body.length; i++) {
        if (body[i].arity === 0) {
            props.push(body[i]);
        } else {
            fols.push(body[i]);
        }
    }
    return {
        propositions: props,
        fols: fols,
    };
}

function getPriorities(kb) { // Linear order induced priorities.
    priorities = {};
    for (let i=0; i<kb.length; i++) {
        // console.log(kb);
        priorities[ruleToString(kb[i])] = i
    }
    return priorities;
}

function updateGraph(newLiteralString, newLiteralRule, oldLiteralString, graph, priorities) {
    const toBeRemoved = [];
    // console.log(priorities);
    for (const rule of graph[oldLiteralString]) { // rule here is already stringified!
        // console.log(rule);
        // console.log(ruleToString(newLiteralRule));
        if (priorities[rule] > priorities[ruleToString(newLiteralRule)]) {
            toBeRemoved.push(rule);
        }
    }
    // console.log(toBeRemoved);
    // debugger;
    for (let i=0; i<graph[oldLiteralString].length; i++) {
        if (toBeRemoved.includes(graph[oldLiteralString][i])) {
            graph[oldLiteralString].splice(i, 1);
            i--;
        }
    }
    let isPrior = false;
    if (graph[oldLiteralString].length === 0) {
        graph[newLiteralString] = [ruleToString(newLiteralRule)];
        isPrior = true;
        delete graph[oldLiteralString];
        // console.log(graph);
    }
    return {
        graph: graph,
        isPrior: isPrior,
    };
}

function forwardChaining(kb, context) {
    let facts = context;
    let inferred = false;
    let graph = {};
    const priorities = getPriorities(kb);
    // let i = 0;
    do {
        inferred = false;
        for (let i=0; i<kb.length; i++) {
            const rule = kb[i];
            const filteredBody = filterBody(rule["body"]);
            if (filteredBody["fols"].length === 0) {
                let satisfied = true;
                for (const prop of filteredBody["propositions"]) {
                    if (!deepIncludes(prop, facts)) {
                        satisfied = false;
                    }
                }
                const inferredHead = rule["head"];
                if (satisfied) {
                    if (Object.keys(graph).includes(literalToString(inferredHead))) {
                        if (!graph[literalToString(inferredHead)].includes(ruleToString(rule))) {
                            graph[literalToString(inferredHead)].push(ruleToString(rule));
                        }
                    } else {
                        graph[literalToString(inferredHead)] = [ruleToString(rule)];
                    }
                    if (!deepIncludes(inferredHead, facts)) {
                        facts.push(inferredHead);
                        inferred = true;
                    }
                    const oppositeHead = {}
                    for (const key of Object.keys(inferredHead)) {
                        oppositeHead[key] = inferredHead[key];
                    }
                    oppositeHead["sign"] = !oppositeHead["sign"];
                    if (deepIncludes(oppositeHead, facts)) {
                        const updatedGraph = updateGraph(literalToString(inferredHead), rule, literalToString(oppositeHead), graph, priorities);
                        graph = updatedGraph["graph"];
                        if (updatedGraph["isPrior"]) {
                            facts = parseListOfLiterals(Object.keys(graph));
                        }
                    }
                }
            } else { // FIXME You have to fix the relational version in the same manner as the propositional!
                const subsObject = getSubstitutions(rule["body"], facts);
                const subs = subsObject["subs"];
                const props = subsObject["propositions"];
                // console.log("FOL");
                // console.log(props);
                if (props !== undefined) {
                    for (const prop of props) {
                        if (!deepIncludes(prop, facts)) {
                            continue;
                        }
                    } // FIXME When a var takes more than two values it throws an error.
                }
                // console.log(subs[0]);
                // debugger;
                if (subs === undefined) {
                    continue;
                }
                for (const sub of subs) {
                    // console.log(sub);
                    if (!jsEvaluation(rule["body"], sub)) {
                        continue;
                    }
                    // console.log("Rule head:");
                    // console.log(rule["head"]);
                    const inferredHead = applyToLiteral(sub, rule["head"]);
                    // console.log("Facts:");
                    // console.log(facts);
                    // console.log(inferredHead);
                    const literalString = literalToString(inferredHead);
                    if (Object.keys(graph).includes(literalString)) {
                        if (!graph[literalString].includes(ruleToString(applyToRule(sub, rule)))) {
                            graph[literalString].push(ruleToString(applyToRule(sub, rule)));
                        }
                    } else {
                        graph[literalString] = [ruleToString(applyToRule(sub, rule))];
                    }
                    if (!deepIncludes(inferredHead, facts)) {
                        facts.push(inferredHead);
                        // console.log("Head:");
                        // console.log(inferredHead);
                        inferred = true;
                    }
                    const oppositeHead = {}
                    for (const key of Object.keys(inferredHead)) {
                        oppositeHead[key] = inferredHead[key];
                    }
                    oppositeHead["sign"] = !oppositeHead["sign"];
                    if (deepIncludes(oppositeHead, facts)) {
                        const updatedGraph = updateGraph(literalToString(inferredHead), rule, literalToString(oppositeHead), graph, priorities);
                        graph = updatedGraph["graph"];
                        if (updatedGraph["isPrior"]) {
                            facts = parseListOfLiterals(Object.keys(graph));
                        }
                    }
                }
            }
        }
        // i++;
    } while (inferred);
    return {
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

function jsEvaluation(body, sub) { // Check whether, given a substitution, the corresponding JS predicates hold.
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
        } else if (literal["isJS"]){
            isValid = isValid && jsCheck(literal, sub);
        }
    }
    return isValid;
}

function equalityCheck(literal, sub) {
    let leftArg = literal["args"][0];
    let rightArg = literal["args"][1];
    // console.log("Args:");
    // console.log(leftArg);
    // console.log(rightArg);
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
    if (!leftArg["isAssigned"] && !rightArg["isAssigned"]) {
        return {
            isValid: false,
            unifier: undefined,
        };
    }
    if (leftArg["isAssigned"] && rightArg["isAssigned"]) {
        // const parser = ;
        // console.log(leftArg["value"] + " === " + rightArg["value"]);
        return {
            isValid: numParser(leftArg["value"] + " === " + rightArg["value"]).call(),
            unifier: undefined,
        };
    }
    if (leftArg["isAssigned"]) {
        const unifier = {};
        unifier[rightArg["name"]] = leftArg["value"];
        return {
            isValid: true,
            unifier: unifier,
        };
    }
    const unifier = {};
    unifier[leftArg["name"]] = rightArg["value"];
    // console.log("Equality sub:"); // TODO update equality so as to allow for operations with variables.
    // console.log(sub);
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

function jsCheck(literal, sub) {
    return;
}

function numParser(string) {
    return Function('"use strict"; return (' + string + ');');
}

function applyToString(string, sub) {
    // const delimiter = /[\s*+\-\*\/\(\)\%]/;
    // console.log("string");
    // console.log(string);
    string = string.trim();
    for (let variable of Object.keys(sub)) {
        let varRE = RegExp("((?<!\w)(" + variable + "))(?!\w)", "g");
        string.replaceAll(varRE, sub[variable]);
    }
    return string;
}
/*
Explanation detection algorithm:
1. For each literal in inferences:
    a. Find all rules that have that literal as head;
    b. 
*/
