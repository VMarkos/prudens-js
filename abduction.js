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

/*
GreedyPropositionalAbduction(kb, target):
    Generate all abducibles;
    Initialize everything to unobserved;
    Let initProof = all unobserved;
    proofStack = stack containing initProof;
    proofs = [];
    While proofStack.length > 0:
        proof = proofStack.pop();
        if proof + kb implies target:
            proofs.push(proof);
            continue;
        for each a in proof that is unobserved:
            proofStack.push(proof + [a]);
            proofStack.push(proof + [-a]);
    return proofs;
*/

function greedyPropositionalAbduction(kbObject, context, targets) {
    const kb = kbObject["kb"];
    const abducibles = computeAbducibles(kb);
    // console.log(abducibles);
    const initProof = {};
    for (const abducible of abducibles) {
        initProof[literalToString(abducible)] = 0; // 0 = unobserved, 1 = true, 2 = false;
    }
    const proofStack = [initProof];
    const proofs = [];
    while (proofStack.length > 0) {
        const proof = proofStack.pop();
        const allFacts = extendContextByProof(context, proof);
        const inferences = forwardChaining(kbObject, allFacts);
        // console.log(target);
        // console.log(inferences);
        if (isSuperset(inferences["facts"], targets) && !deepIncludes(proof, proofs)) { // You are here...
        // if (deepIncludes(target, inferences["facts"]) && !deepIncludes(proof, proofs)) {
            // console.log("Proved?");
            // console.log(proof);
            proofs.push(proof);
            continue;
        }
        for (const abducible of abducibles) {
            const stringAbducible = literalToString(abducible);
            if (proof[stringAbducible] === 0) {
                const positiveProof = {};
                const negativeProof = {};
                for (const key of Object.keys(proof)) {
                    positiveProof[key] = proof[key];
                    negativeProof[key] = proof[key];
                }
                positiveProof[stringAbducible] = 1;
                negativeProof[stringAbducible] = 2;
                proofStack.push(positiveProof);
                proofStack.push(negativeProof);
            }
        }
    }
    return proofs;
}

function extendContextByProof(context, proof) {
    const allFacts = [...context];
    for (const key of Object.keys(proof)) {
        const literal = parseLiteral(key);
        if (proof[key] !== 0 && !deepIncludes(literal, allFacts)) {
            literal["sign"] = proof[key] === 1;
            allFacts.push(literal);
        }
    }
    return allFacts;
}

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

/*
Consideration about abductive proofs:
Consider the following KB:
@KnowledgeBase
R1 :: a implies z;
R4 :: -b implies -a;
// R2 :: b implies a;
R3 :: c, d implies a;

Also, let A = {b, c, d, -b} be the set of all abducibles.

In the above setting, [c; d; !b] is an abductive proof, while [c; d; -b;] is not since it triggers R4, which blocks a. Also, A is not conflict-free, so you have to distinguish between
which predicates you may or may not introduce in a possible extension of [c; d;] --- which is a minimal priority-blind abductive proof. Instead of the above, you may consider a 
DFS/backtracking search for all worth proofs. Namely:

0. Given kb, context and target, initialize a list, targets = [target];
Generate the inference graph given kb and all abducibles.
Starting from the target, walk backwards respecting priorities (easier said than done).
*/

/*
Heuristic approach:
Construct the inference graph starting from all abducibles and then search for the most fitting abductive proof e.g. using A*. Actually, it is not the inference graph on which search is
conducted, but a graph where each node is an abductive proof and each vertex connects proofs to targets (?).

Steps: determine a metric that estimates how "good" a proof is, given some observations, O. Let A be the set of all abducibles and let O be some observed facts and KB be some knowledge
base. Then, a good proof is one that can prove O given kb (hard constraint), while, at the same time is minimal (small size) as well as short (Occam's razor?). A typical 
approach would be as follows:

Algorithm:
Generate the Inference Graph of all possible inferences given KB and A.
Starting from target, find all rules that lead to it and rank them according to their head's distance from the abducibles (?)
Find any body literals that are not known and recursively repeat the above until a proof has been found.

Other algorithm, based on a game theoretic conception of abduction:
1. Given a target, find all rules that lead to it or its negation.
2. Then what?

Brainstorming:
1. You have an inference graph and want, starting from a target literal, find all abductive proofs. Actually, you have the following situation:
    a. For any non-conflicting rule that agrees, you want (recursively), all of their body literals to be included in the proof/be inferred if they are not abducible.
    b. For any conflicting rule of higher priority than some certain non-conflicting rule r, what we need is at least one of its body literals not to be inferred in some way --- either
       unobserved or not inferred.
    c. So, for any non-conflicting rule, r, and for any unobserved body literal of any higher priority rule we have another path of search --- corresponding to triggering r while not 
       triggering any higher priority conflicting rule in some way (exponentially large).
    d. Elaborating on this: You have two lists
        A. One containing all undesired combinations of literals - which is like a tree of the form (-a or -b or -c) and (-d or -e or -f) and ... while each -a may itself be an expression
           of this form --- since it may well be inferred by some class of rules (at this point, you need to consider counter-arguments so you may have a more complex expression).
        B. One containing all desired combinations or whatnot...
2. Heuristic search is not useless in the sense that it may speed up the computation of some certain proof, hopefully the most reasonable one. So, as a heuristic, e.g., in an A* search, 
   one may use any fitness heuristic (pffff...)
*/

function computeAbducibles(kb) {
    const abducibles = [];
    for (const rule of kb) {
        for (const literal of rule["body"]) {
            let isHead = false;
            for (const otherRule of kb) {
                if (deepEquals(otherRule["head"], literal)) {
                    isHead = true;
                    break;
                }
            }
            if (!isHead) {
                const positiveLiteral = {};
                for (const key of Object.keys(literal)) {
                    positiveLiteral[key] = literal[key];
                }
                positiveLiteral["sign"] = true;
                if (!deepIncludes(positiveLiteral, abducibles)) {
                    abducibles.push(positiveLiteral);
                }
            }
        }
    }
    return abducibles;
}

/*
1. Ask for the users to determine the values of each predicate's argument providing a json of the form:
{
    pred1: [
        [val01, val02, ...],
        [val11, val12, ...],
        ...,
    ],
    pred2: [...],
    ...
}
2. Missing abducible handling?
    a. Backpropagate variables --- actually, propagate variables, which means that you need to fix deduction so as to take into account ungrounded contexts as well.

Assuming that there are no missing abducibles:
greedRelationalAbduction(kb, context, target):
    abducibles = getAllAbducibles(...);
    unobservedStack = [];
    proofStack = [[]];
    proofs = [];
    while proofStack.length > 0:
        proof = proofStack.pop();
        literal = abducibles[proof.length];
        instances = generateInstances(literal, subs) --- subs are presumably stored somewhere...
        for instance in instances:
            if context + proof + kb infers target:
                proofs.push(proof);
            else:
                proofStack.push([proof + positive, proof + negative]);
    return proofs;
*/

function greedyRelationalAbduction(kbObject, context, target, predicateValues) {
    const kb = kbObject["kb"];
    const abducibles = getAllAbducibles(predicateValues);
    const initProof = [];
    for (const abducible of abducibles) {
        initProof[literalToString(abducible)] = 0; // Again, 0 = unobserved, 1 = true, 2 = false;
    }
    const proofStack = [initProof];
    const proofs = [];
    while (proofStack.length > 0) {
        const proof = proofStack.pop();
        const allFacts = extendContextByRelationalProof(context, proof);
        const inferences = forwardChaining(kbObject, allFacts);
        // console.log(target);
        // console.log(inferences);
        // debugger;
        if (deepIncludes(target, inferences["facts"])) { // You are here...
            // console.log("Proved?");
            // console.log(proof);
            proofs.push(proof);
            continue;
        }
        for (const abducible of abducibles) {
            const stringAbducible = literalToString(abducible);
            if (proof[stringAbducible] === 0) {
                const positiveProof = {};
                const negativeProof = {};
                for (const key of Object.keys(proof)) {
                    positiveProof[key] = proof[key];
                    negativeProof[key] = proof[key];
                }
                positiveProof[stringAbducible] = 1;
                negativeProof[stringAbducible] = 2;
                proofStack.push(positiveProof);
                proofStack.push(negativeProof);
                break;
            }
        }
    }
    return proofs;
    // SINCE you have propositionalised everything, you may follow the same logic as above (?)
    // while (proofStack.length > 0) {
    //     // console.log(proofStack);
    //     // debugger;
    //     const proof = proofStack.pop();
    //     // console.log(abducibles); // FIXME literal undefined...
    //     const literal = abducibles[proof.length];
    //     // console.log(predicateValues);
    //     // console.log(literal);
    //     const instances = generateInstances(literal["name"], predicateValues);
    //     const allFacts = extendContextByRelationalProof(context, proof);
    //     const inferences = forwardChaining(kb, allFacts);
    //     if (deepIncludes(target, inferences["facts"])) {
    //         proofs.push(proof);
    //         continue;
    //     }
    //     for (const instance of instances) {
    //         let positiveInstance = {};
    //         let negativeInstance = {};
    //         for (const key of Object.keys(instance)) {
    //             positiveInstance[key] = instance[key];
    //             negativeInstance = instance[key];
    //         }
    //         positiveInstance["sign"] = true;
    //         negativeInstance["sign"] = false;
    //         const positiveProof = [...proof];
    //         const negativeProof = [...proof];
    //         positiveProof.push(positiveInstance);
    //         negativeProof.push(negativeInstance);
    //         proofStack.push(positiveProof);
    //         proofStack.push(negativeProof);
    //     }
    // }
    // return proofs;
}

function extendContextByRelationalProof(context, proof) {
    const allFacts = [...context];
    for (const key of Object.keys(proof)) {
        const literal = parseLiteral(key);
        if (proof[key] !== 0 && !deepIncludes(literal, allFacts)) {
            literal["sign"] = proof[key] === 1;
            allFacts.push(literal);
        }
    }
    return allFacts;
}

function getAllAbducibles(predicateValues) {
    const abducibles = [];
    // console.log("PredVal");
    // console.log(predicateValues); // FIXME You are passing predvals while you need assignments!
    for (const key of Object.keys(predicateValues)) {
        instances = generateInstances(key, predicateValues);
        for (const instance of instances) {
            const negativeInstance = {};
            const positiveInstance = {};
            for (const key of Object.keys(instance)) {
                positiveInstance[key] = instance[key];
                negativeInstance[key] = instance[key];
            }
            positiveInstance["sign"] = true;
            negativeInstance["sign"] = false;
            if (!deepIncludes(positiveInstance, abducibles) && !deepIncludes(negativeInstance, abducibles)) {
                abducibles.push(positiveInstance);
            }
        }
        /* FIXME Points to check:
            1. Whether this works.
            2. Possible duplicates.
            3. Change the logic to a 0-1-2 logic as in the propositional case.
        */
    }
    return abducibles;
}

function generateInstances(literalName, predicateValues) { // FIXME You may merge this method with the one below...
    const instances = [];
    // console.log(literalName);
    // console.log(predicateValues);
    const assignments = generateAssignments(predicateValues[literalName]);
    for (const assignment of assignments) {
        instances.push(parseLiteral(literalName + "(" + assignmentToString(assignment) + ")"));
    }
    return instances;
}

function assignmentToString(assignment) {
    let assgnString = "";
    for (let i=0; i<assignment.length; i++) {
        if (i < assignment.length - 1) {
            assgnString += assignment[i] + ", ";
        } else {
            assgnString += assignment[i];
        }
    }
    return assgnString;
}

function generateAssignments(predicateValues) {
    const assignments = [];
    console.log(predicateValues);
    const assignmentsStack = [...Object.values(predicateValues)[0]];
    while (assignmentsStack.length > 0) {
        const assignment = assignmentsStack.pop();
        if (assignment.length === predicateValues.length) {
            assignments.push(assignment);
            continue;
        }
        // console.log(predicateValues);
        // console.log(assignment);
        for (const value of predicateValues[assignment.length]) {
            const tempCopy = [...assignment];
            tempCopy.push(value);
            assignmentsStack.push(tempCopy);
            // console.log(assignmentsStack);
            // debugger;
        }
    }
    // console.log(assignments);
    // debugger;
    return assignments;
}

function prioritizedPropositionalAbduction(kbObject, context, finalTarget) {
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
        // console.log("Targets");
        // console.log(graph["facts"]);
        // console.log(finalTarget);
        // debugger;
        if (deepIncludes(finalTarget, graph["facts"]) && !containsSubsets(successfulProofs, candidateProof)) {
            // console.log("pass");
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