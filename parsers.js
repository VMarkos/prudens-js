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

function domainsParser() {
    const domains = document.getElementById(tab + "-domains").value;
    return parseDomains(domains);
}

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
        predicates[nameSplit[0]] = parseValues(nameSplit[1]); // FIXME
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
    console.log(argumentValuesArray);
    const argumentValues = [];
    for (const argValues of argumentValuesArray) {
        argumentValues.push(argValues.substring(1,argValues.length - 1).trim().split(/\s*,\s*/));
    }
    return argumentValues;
}

function contextParser() {
    const context = document.getElementById(tab + "-context").value;
    const contextList = parseContext(context);
    // console.log(contextList);
    contextList["context"].push({
        name: "true",
        sign: true,
        isJS: false,
        isEquality: false,
        isInequality: false,
        isAction: false,
        args: undefined,
        arity: 0,
    });
    return contextList;
}

function targetParser() {
    const targets = document.getElementById(tab + "-targets").value;
    return parseTarget(targets);
}

function kbParser() {
    const kbAll = document.getElementById(tab + "-kb").value;
    return parseKB(kbAll);
}

function parseContext(context) {
    "use strict";
    if (context === undefined || context === "") {
        return {
            type: "output", // TODO You may add some warning here?
            context: [],
        }
    }
    const spacingRe = /(\t|\r|\n|\v|\f|\s)*/;
    const varNameRe = /(([a-z0-9]\w*)|(\d+[.]?\d*))|(\[(\s*\w+,\s*)*\s*\w+\s*\])/;
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
            message: "I found some syntax error in your context. Remember that only predicates with **all** their arguments instantiated (i.e. constants) should appear. Also, all predicates should be separated by a semicolon (;), including the last one.",
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
        const isAssigned = !isVar.test(argument.charAt(0)) || /[^\w]/.test(argument);
        const isList = /\[(\s*\w+\s*,\s*)*\s*\w+\s*\]/.test(argument);
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
        args.push({
            index: i,
            name: name,
            isAssigned: isAssigned,
            value: value,
            muted: muted,
            isList: isList,
            list: list,
        });
    }
    return args;
}

function getRuleBody(bodyString) {
    "use strict";
    // const delim = /((?<=(?:\)\s*))(?:,))|((?<!(?:\([a-zA-Z0-9_,\s]+\)))(?:,))|(?:;)/; //This is added for the context. Originally, only /,/ is needed!
    const delim = /(?:;)|((?<=(?:\)\s*))(?:,))|((?<!(?:\(.*))(?:,))/;
    const bodyArray = bodyString.trim().split(delim);
    if (bodyArray[bodyArray.length-1] == "") {
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
    const rules = kb.split(";");
    rules.pop();
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
    if (!kbAll.includes("@KnowledgeBase")){
        return {
            type: "error",
            name: "KnowledgeBaseDecoratorNotFound",
            message: "I found no @KnowledgeBase decorator. Enter a single @KnowledgeBase below your imports (if any) and prior to your knowledge base's rules.",
        };
    }
    const kbNoCode = kbAll.split("@KnowledgeBase");
    if (kbNoCode.length > 2){
        return {
            type: "error",
            name: "MultipleKnowledgeBaseDecorators",
            message: "Found more than two (2) @KnowledgeBase decorators. Enter a single @KnowledgeBase below your imports (if any) and prior to your knowledge base's rules.",
        };
    }
    const imports = kbNoCode[0].trim() //You need some exception handling here as well...
    const kbWithCode = kbNoCode[1].trim();
    let kb;
    let code;
    if (kbWithCode.includes("@Code")) {
        const finalSplit = kbWithCode.split("@Code");
        kb = finalSplit[0].trim();
        code = finalSplit[1].trim();
        if (code.length === 0) {
            warnings.push({
                type: "warning",
                name: "CodeNotFound",
                message: "I found no code under the @Code decorator. While I have no issue with it, as a kind reminder, @Code is used strictly below your knowledge base's rules to declare any custom Javascript predicates."
            });
        }
    } else {
        kb = kbWithCode;
        code = undefined;
    }
    const spacingRe = /(\t|\r|\n|\v|\f|\s)*/; // CHECKED!
    const predicateNameRe = /(-?\??[a-z]\w*)/; // CHECKED!
    const mathPredicateRe = /\s*((-?\?=)|(-?\?<))\(.+,.+\)\s*/; // CHECKED!
    const headNameRe = /((-?!?[a-z]\w*))/; // CHECKED!
    const simpleListRe = /(\[(\s*\w+,\s*)*\s*\w+\s*\])/; // Syntactically, you have allowed for a (grounded?) list to contain variables. // CHECKED!
    const headTailListRe = RegExp(String.raw`(\[(\s*\w+\s*,)*\s*\w+\s*\|\s*(([A-Z_]\w*)|` + simpleListRe.source + String.raw`)\s*\])`); // CHECKED!
    const listRe = RegExp(String.raw`(` + simpleListRe.source + String.raw`|` + headTailListRe.source + String.raw`)`); // CHECKED!
    const varNameRe = RegExp(String.raw`(([a-zA-z]\w*)|(\d+[.]?\d*)|_|` + listRe.source + String.raw`)`); // CHECKED!
    // const varNameRe = /(([a-zA-z]\w*)|(\d+[.]?\d*)|_|)/; // CHECKED!
    const ruleName = RegExp(spacingRe.source + String.raw`\w+`); // CHECKED!
    const casualPredicateRe = RegExp(predicateNameRe.source + String.raw`\((\s*` + varNameRe.source + String.raw`\s*,)*\s*` + varNameRe.source + String.raw`\s*\)`); // CHECKED!
    const propositionalPredicateRe = /(-?[a-z]\w*)/; // CHECKED!
    const predicateRe = RegExp(String.raw`((` + casualPredicateRe.source + String.raw`)|(` + mathPredicateRe.source + String.raw`)|(` + propositionalPredicateRe.source + String.raw`))`); // CHECKED!
    const casualHeadRe = RegExp(headNameRe.source + String.raw`\((\s*` + varNameRe.source + String.raw`\s*,)*\s*` + varNameRe.source + String.raw`\s*\)`); // CHECKED!
    const propositionalHeadRe = /(-?!?[a-z]\w*)/; // CHECKED!
    const headRe = RegExp(String.raw`(` + casualHeadRe.source + String.raw`)|(` + propositionalHeadRe.source + String.raw`)`);
    const kbRe = RegExp(String.raw`(` + ruleName.source + String.raw`\s*::(\s*` + predicateRe.source + String.raw`\s*,)*\s*` + predicateRe.source + String.raw`\s+implies\s+` + headRe.source + String.raw`\s*;` + spacingRe.source + String.raw`)+`); // CHECKED!
    // const kbRe = /((\t|\r|\n|\v|\f|\s)*\w+\s*::(\s*((-?\??[a-z]\w*)|(\?=)|(\?<))\((\s*(([a-zA-z]\w*)|(\d+[.]?\d*)|_)\s*,)*\s*(([a-zA-z]\w*)|(\d+[.]?\d*)|_)\s*\)\s*,)*\s*((-?\??[a-z]\w*)|(\?=)|(\?<))\((\s*(([a-zA-z]\w*)|(\d+[.]?\d*)|_)\s*,)*\s*(([a-zA-z]\w*)|(\d+[.]?\d*)|_)\s*\)\s+implies\s+((-?!?[a-z]\w*))\((\s*(([a-zA-z]\w*)|(\d+[.]?\d*)|_)\s*,)*\s*(([a-zA-z]\w*)|(\d+[.]?\d*)|_)\s*\)\s*;(\t|\r|\n|\v|\f|\s)*)+/;
    // console.log(kbRe);
    if (!kbRe.test(kb)) {
        return {
            type: "error",
            name: "KnowledgeBaseSyntaxError",
            message: "I found some syntax error in your knowledge base's rules. However, I'm still in beta so I can't tell you more about this! :("
        }
    }
    return {
        type: "output",
        kb: kbToObject(kb),
        code: codeToObject(code),
        imports: imports,
        warnings: warnings,
    };
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
    let functionSource = functionCode.split("{")[1].trim();
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
            proofString += "!" + key + "; ";
        } else if (proof[key] === 1) {
            proofString += key + "; ";
        } else {
            proofString += "-" + key + "; ";
        }
    }
    return proofString.substring(0, proofString.length - 1) + "]";
}