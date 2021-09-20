/*
ABDUCTION
Given a target literal, t, a knowledge base, kb and a context, c, detect all sets of missing hypotheses that may be needed to infer target from kb + c:
1. Parse rules from top to bottom --- i.e., with descending priority whenever there is some conflict;
2. If a rule has an agreeing head to the target:
    a. If all literals in its body are satisfied through the context, return true --- consider properly using a flag here;
    b. Else, mark each literal that is not somehow supported and GOTO 1 --- again, beware of the flag;
3. If a rule has a conflicting head to the target:
    a. If all leterals in its body are satisfied through c, return false --- again, flags;
    b. Else, mar each unsatisfied literal and GOTO 1 --- again, flagging.
*/

function abduce(target, kb, context) { // We assume that the rules in kb are ordered by descending priority --- otherwise, we may need to define a sorting function first.
    let inFavour = false; // This flag determines whether we are looking for a proof in favour or against the target.
    const abductiveProofs = [];
    for (let i=0; i<kb.length; i++) {
        const rule = kb[i];
        const head = rule["head"];
        if (target["name"] === head["name"] && target["sign"] === head["sign"] && target["arity"] === head["arity"]) {
            const missingLiterals = getMissingLiterals(rule["body"], context, head, target);
        }
    }
}

function getMissingLiterals(body, context, head, target) {
    const subs = []; // Get all the substitutions that satisfy the head of a rule, given a certain target.
    const initSub = {};
    for (let i=0; head["arguments"].length; i++) {
        initSub[head["arguments"][i]["name"]] = target["arguments"][i]["value"];
    }
    subs.push(initSub);
    for (let i=0; i<body.length; i++) {
        const bodyLiteral = body[i];
    }
}