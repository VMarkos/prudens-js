function abductionWrapper(kbString, contextString, targetString) { // targetList = list of strings.
    const kbObject = parseKB(kbString);
    const contextObject = parseContext(contextString);
    const targetsObject = parseTarget(targetString);
    const output = greedyPropositionalAbduction(kbObject, contextObject["context"], targetsObject["targets"]);
    return output;
}

function deductionWrapper(kbString, contextString) {
    const kbObject = parseKB(kbString);
    const contextObject = parseContext(contextString);
    const output = forwardChaining(kbObject, contextObject["context"]);
    return output;
}