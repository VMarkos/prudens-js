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
                arguments: [
                    {
                        index: 0,
                        name: "Var1",
                        isAssigned: false,
                        value: null,
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
            arguments: [ list of arguments ],
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
    let substitutions = extendByFacts(body[0], facts);
    // console.log(substitutions);
    // substitutions = substitutions.filter((element) => {return element !== null});
    // console.log("Subs Init:");
    // console.log(substitutions);
    for (let i=1; i<body.length; i++) {
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
                arguments: apply(sub, body[i]["arguments"]),
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
                if (unifier != null) {
                    const extension = extend(sub, unifier);
                    if (unifier != null && extension != null) {
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
        if (substitutions.length == 0) {
            return [];
        }
    }
    return substitutions;
}

function extendByFacts(literal, facts) {
    "use strict";
    const subs = [];
    for (const fact of facts) {
        const unifier = unify(literal, fact);
        (unifier != null) && subs.push(unifier);
    }
    // console.log("Ext by Facts:");
    // console.log(subs.filter(Boolean));
    // console.log(literal);
    // console.log(facts);
    // console.log("Un-Filtered");
    // console.log(subs);
    // const substitutions = subs.filter((element) => {return element !== null});
    // console.log("Subs in extendByFacts:");
    // console.log(subs.filter((element) => {return element !== null}));
    return subs;
}

// Substitution = {varname1: val1, varname2: val2, ...}

function apply(sub, args) {
    "use strict";
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
        return null;
    }
    const xArgs = x["arguments"];
    const yArgs = y["arguments"];
    const unifier = {};
    for (let i=0; i<x["arity"]; i++) {
        let xArg = xArgs[i];
        let yArg = yArgs[i];
        if (xArg["isAssigned"] && xArg["value"] != yArg["value"]) {
            return null;
        }
        if (Object.keys(unifier).length > 0 && Object.keys(unifier).includes(xArg["name"]) && unifier[xArg["name"]] != yArg["value"]) {
            return null;
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
            return null;
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
    subLiteral["arguments"] = apply(sub, literal["arguments"])
    return subLiteral;
}

function applyToRule(sub, rule) {
    const subRule = {
        name: rule["name"],
    }
    const newBody = [];
    for (const literal of rule["body"]) {
        console.log(literal);
        newBody.push(applyToLiteral(sub, literal));
    }
    subRule["body"] = newBody;
    subRule["head"] = applyToLiteral(sub, rule["head"]);
    return subRule;
}

function forwardChaining(kb, context) {
    const facts = context;
    let inferred = false;
    const graph = {};
    let i = 0;
    do {
        inferred = false;
        // console.log(kb);
        for (let i=0; i<kb.length; i++) {
            const rule = kb[i];
            // console.log(rule);
            const subs = getSubstitutions(rule["body"], facts);
            for (const sub of subs) {
                // console.log("Rule head:");
                // console.log(rule["head"]);
                const inferredHead = applyToLiteral(sub, rule["head"]);
                if (!isConfictingWithList(inferredHead, facts)) {
                    // console.log("Facts:");
                    // console.log(facts);
                    // console.log(inferredHead);
                    if (!deepIncludes(inferredHead, facts)) {
                        facts.push(inferredHead);
                        const literalString = literalToString(inferredHead);
                        if (Object.keys(graph).includes(literalString)) {
                            graph[literalString].push(applyToRule(sub, rule));
                        } else {
                            graph[literalString] = [applyToRule(sub, rule)];
                        }
                        // console.log("Head:");
                        // console.log(inferredHead);
                        inferred = true;
                    }
                }
            }
        }
        i++;
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
    const xArgs = x["arguments"];
    const yArgs = y["arguments"];
    for (let i=0; i<x["arity"]; i++) {
        if (!xArgs[i]["isAssigned"] || !yArgs[i]["isAssigned"] || xArgs[i]["value"] != yArgs[i]["value"]) {
            return false;
        }
    }
    return true;
}
