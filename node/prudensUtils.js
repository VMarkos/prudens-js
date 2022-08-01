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
            if (parseFloat(val) !== parseFloat(yArg["value"])) {
                return undefined;
            }
            unifier[yArg["name"]] = val;
            continue;
        }
        val = numParser(applyToString(yArg["value"], extendedSub)).call();
        if (parseFloat(val) !== parseFloat(xArg["value"])) {
            return undefined;
        }
        unifier[xArg["name"]] = val;
    }
    return unifier;
}

function deepCopy(object) { // This is a level 1 deep copy --- i.e. if some value is itself another JS-object, it will be copied in a shallow manner.
    "use strict";
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

function deepIncludes(object, list, stringHash = false) { //Re-implementation of Array.prototype.includes() that checks at depth=1 for equal objects. 
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

module.exports = {
    deepIncludes,
    deepCopy,
    unify,
}