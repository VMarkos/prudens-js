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

// function abduce(target, kb, context) { // We assume that the rules in kb are ordered by descending priority --- otherwise, we may need to define a sorting function first.
//     let inFavour = false; // This flag determines whether we are looking for a proof in favour or against the target.
//     const abductiveProofs = [];
//     for (let i=0; i<kb.length; i++) {
//         const rule = kb[i];
//         const head = rule["head"];
//         if (target["name"] === head["name"] && target["sign"] === head["sign"] && target["arity"] === head["arity"]) {
//             const missingLiterals = getMissingLiterals(rule["body"], context, head, target);
//         }
//     }
// }

// function getMissingLiterals(body, context, head, target) {
//     const subs = []; // Get all the substitutions that satisfy the head of a rule, given a certain target.
//     const initSub = {};
//     for (let i=0; head["arguments"].length; i++) {
//         initSub[head["arguments"][i]["name"]] = target["arguments"][i]["value"];
//     }
//     subs.push(initSub);
//     for (let i=0; i<body.length; i++) {
//         const bodyLiteral = body[i];
//     }
// }

/////////////////////////////
/// Propositional version ///
/////////////////////////////

/* Algorithm:
1. Parse rules from highest to lowest priority --- when needed.
2. Find the first rule whose head, ignoring negation, matches the target.
3. If they have the same sign, flag = true, else flag = false.
4. Take the rule's body and:
    a. If the literals are all in the context, return;
    b. Else, push any literals that are not included into the context into the targets stack --- you need a stack here, DFS!
5. Pop the next element from the stack and then repeat 2. - 5. // This does not seem correct!

Comments:
1. At each point you find a rule of higher priority such that head is opposite to target, you could mark it down alongside with any rules such that are of lower priority and head === target (sign-wise) and then just verify
any proofs you have.
2. Actually, not, you can just generate any proofs for agreeing heads only and then simply check them one by one so as to see if they indeed happen to be proofs in the context of Prudens --- i.e. prioritized kbs.
*/

// function abduce(targets, kb, context) {
//     const target = targets.pop();
//     for (let i=0; i<kb.length; i++) {
//         const rule = kb[i];
//         const head = rule["head"];
//         if (!head["name"] === target["name"]) {
//             continue;
//         }
//         const headAgreesWithTarget = (head["sign"] === target["sign"]);
//         const unverifiedFacts = [];
//         for (const literal of rule["body"]) {
//             if (!deepIncludes(context, literal)) {
//                 unverifiedFacts.push(literal);
//             }
//         }
//         if (unverifiedFacts.length === 0) {
//             return;
//         }
//         let pushedNewTargets = false;
//         for (const literal of unverifiedFacts) {
//             if (!deepIncludes(targets, literal)) {
//                 targets.push(literal);
//                 pushedNewTargets = true;
//             }
//         }
//         if (!pushedNewTargets) {
//             return;
//         }
//         abduce(targets, kb, context);
//     }
// }

function propositionalAbduction(kb, context, finalTarget) {
    const targets = [finalTarget];
    const proofs = [];
    let target;
    const visited = [finalTarget];
    while (targets.length > 0) {
        target = targets.shift();
        let hasRule = false;
        for (const rule of kb) {
            if (rule["head"]["name"] !== target["name"]) {
                continue;
            }
            hasRule = true;
            for (const literal of rule["body"]) {
                if (!deepIncludes(literal, context) && !deepIncludes(literal, visited)) {
                    targets.push(literal);
                    visited.push(literal);
                }
            }
        }
        if (!hasRule && !deepIncludes(target, proofs)) {
            proofs.push(target);
            visited.push(target);
        }
    }
    if (proofs.length > 0) {
        return proofs;
    }
    return undefined;
}

/*
Iteratively remove an element from missing facts and if target is inferred, then remove another one. Repeat until target is not inferred from a set of missing facts.
*/

function prioritizedPropositionalAbduction(kb, context, finalTarget) {
    const missingFacts = propositionalAbduction(kb, context, finalTarget);
    const toBeRemoved = []; // Queue --- BFS
    for (let i=0; i<missingFacts.length; i++) {
        toBeRemoved.push([i]);
    }
    const sucessfulProofs = [];
    while (toBeRemoved.length > 0) {
        const next = toBeRemoved.shift();
        const candidateProof = [...missingFacts];
        for (const index of next.sort((a, b) => a - b)) {
            candidateProof.splice(index, 1);
        }
    }
}