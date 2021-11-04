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
            if (rule["head"]["name"] !== target["name"] || rule["head"]["sign"] !== target["sign"]) {
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

function extendProofs(proofs, abducibles) {
    const extendedProofs = [];
    for (const proof of proofs) {
        for (const abducible of abducibles) {
            const negatedAbducible = {};
            for (const key of Object.keys(abducible)) {
                negatedAbducible = abducible[key];
            }
            negatedAbducible["sign"] = !negatedAbducible["sign"];
            if (!deepIncludes(abducible, proof) && !deepIncludes(negatedAbducible, proof)) {
                // Add a new proof here (or so).
                // Well, not exactly...
            }
        }
    }
}

/*
Given an abductive proof and all abducibles you need to check with all possible combinations of negations of abducibles that are not present in the proof whether you can still infer
your target.

Proof extension algorithm:
0. Initialize toBePopped = abducibles and frontier = proofs
1. For each proof in proofs:
    a. While new proofs are generated do:
        A. Pop a proof from frontier.
            1. Try all literals in toBePopped and for each one that leads to a successful proof, add the emerging proof to frontier and for each one that fails, remove it from toBePopped.
*/

function computeAbducibles(kb) {
    const abducibles = [];
    for (const rule of kb) {
        for (const literal of rule["body"]) {
            for (const otherRule of kb) {
                if (deepEquals(otherRule["head"], literal) && !deepIncludes(literal, abducibles)) {
                    abducibles.push(literal);
                }
            }
        }
    }
    return abducibles;
}

// TODO for any literal/propositional symbol that is not inlcuded in a proof, generate all versions with *unobserved* or -literal in them (or simply agree that they are silently implied).

/*
Instead of simply checking whether a predicate is included in facts, you generate any valid substitutions from all facts + rule's head (which is grounded) and then check which of these
facts are included in facts. These not included are pushed as targets and any not grounded variables are muted.

MAYBE extend unify(x, y) so as to unify variables as well? --- what implications will this have in deduction?

***
kb: R :: f(X), g(Y) implies z(X);
target: z(a);
context: empty;

Abductive proofs: {f(a); g(_)} for any value of _. So, returning _ will imply that this argument may be instantiated freely, in any way the user wants.
***
*/

function relationalAbduction(kb, context, finalTarget) {
    const targets = [finalTarget];
    const proofs = [];
    let target;
    const visited = [finalTarget];
    while (targets.length > 0) {
        target = targets.shift();
        let hasRule = false;
        for (const rule of kb) {
            if (rule["head"]["name"] !== target["name"] || rule["head"]["sign"] !== target["sign"]) {
                continue;
            }
            hasRule = true;
            for (const literal of rule["body"]) {
                const instance = applyToLiteral(unify(literal, rule["head"]), literal);
                if (!deepIncludes(literal, context) && !deepIncludes(literal, visited)) {
                    targets.push(literal);
                    visited.push(literal);
                }
            }
        }
    }
}

/*
Iteratively remove an element from missing facts and if target is inferred, then remove another one. Repeat until target is not inferred from a set of missing facts.
*/

function prioritizedPropositionalAbduction(kbObject, context, finalTarget) { //FIXME Something went wrong when returning back to JSONObjects from strings.
    const kb = kbObject["kb"];
    const missingFacts = propositionalAbduction(kb, context, finalTarget);
    // console.log(missingFacts);
    // debugger; 
    const toBeRemoved = [[]]; // Stack --- DFS
    // console.log(toBeRemoved);
    // debugger;
    let successfulProofs = [];
    while (toBeRemoved.length > 0) {
        const next = toBeRemoved.pop();
        const candidateProof = [];
        for (let i=0; i<missingFacts.length; i++) {
            if (!next.includes(i)) {
                candidateProof.push(missingFacts[i]);
            }
        }
        const allFacts = [...context];
        allFacts.push(...candidateProof);
        // console.log(allFacts);
        // debugger;
        graph = forwardChaining(kbObject, allFacts);
        console.log("Targets");
        console.log(graph["facts"]);
        // console.log(finalTarget);
        // debugger;
        if (deepIncludes(finalTarget, graph["facts"]) && !containsSubsets(successfulProofs, candidateProof)) {
            console.log("pass");
            if (containsSupersets(successfulProofs, candidateProof)) {
                successfulProofs = removeSupersets(successfulProofs, candidateProof);
            }
            successfulProofs.push(candidateProof);
            for (let i=0; i<missingFacts.length; i++) {
                if (!next.includes(i)) {
                    const newCandidateProof = [...next];
                    newCandidateProof.push(i);
                    toBeRemoved.push(newCandidateProof);
                }
            }
        }
    }
    return successfulProofs;
}