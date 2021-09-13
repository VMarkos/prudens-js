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
    const xArgs = x["arguments"];
    const yArgs = y["arguments"];
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
    subLiteral["arguments"] = apply(sub, literal["arguments"])
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

function forwardChaining(kb, context) {
    const facts = context;
    let inferred = false;
    const graph = {};
    // let i = 0;
    do {
        inferred = false;
        // console.log(kb);
        for (let i=0; i<kb.length; i++) {
            const rule = kb[i];
            // console.log(rule);
            const filteredBody = filterBody(rule["body"]);
            // console.log(filteredBody);
            if (filteredBody["fols"].length === 0) {
                let satisfied = true;
                for (const prop of filteredBody["propositions"]) {
                    if (!deepIncludes(prop, facts)) {
                        // console.log(prop);
                        satisfied = false;
                    }
                }
                const inferredHead = rule["head"];
                if (satisfied && !isConfictingWithList(inferredHead, facts)) {
                    if (Object.keys(graph).includes(inferredHead["name"])) {
                        if (!deepIncludes(rule, graph[inferredHead["name"]])) {
                            graph[literalString].push(rule);
                        }
                    } else {
                        graph[inferredHead["name"]] = [rule];
                    }
                    if (!deepIncludes(rule["head"], facts)) {
                        // console.log("Head:");
                        // console.log(rule["head"]);
                        facts.push(rule["head"]);
                        // console.log(facts);
                        inferred = true;
                    }
                }
            } else {
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
                    if (!isConfictingWithList(inferredHead, facts)) {
                        // console.log("Facts:");
                        // console.log(facts);
                        // console.log(inferredHead);
                        const literalString = literalToString(inferredHead);
                        if (Object.keys(graph).includes(literalString)) {
                            if (!deepIncludes(applyToRule(sub, rule), graph[literalString])) {
                                graph[literalString].push(applyToRule(sub, rule));
                            }
                        } else {
                            graph[literalString] = [applyToRule(sub, rule)];
                        }
                        if (!deepIncludes(inferredHead, facts)) {
                            facts.push(inferredHead);
                            // console.log("Head:");
                            // console.log(inferredHead);
                            inferred = true;
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
    const xArgs = x["arguments"];
    const yArgs = y["arguments"];
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
            console.log("Equality:");
            console.log(equality);
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
    let leftArg = literal["arguments"][0];
    let rightArg = literal["arguments"][1];
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
    let leftArg = literal["arguments"][0];
    let rightArg = literal["arguments"][1];
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
