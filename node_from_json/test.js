const prudens = require("./prudensNode");
const fs = require("fs");
const toXML = require('xml-js');

function parsing() { // Just to showcase how to merely parse a policy from a string (without deducing anything).
    const policy = `@Knowledge
    R1 :: bird implies flies;
    R2 :: bird, penguin implies -flies;
    R3 :: bird, penguin, super implies flies;`;
    const context = "bird; penguin; super;";
    const policyJSON = prudens.parseKB(policy);
    const contextJSON = prudens.parseContext(context);
    fs.writeFileSync("policy.json", JSON.stringify(policyJSON, null, 2));
    fs.writeFileSync("context.json", JSON.stringify(contextJSON, null, 2));
}

function deduce() { // Reading policy and context from local files and writing deductions to a file.
    const policy = JSON.parse(fs.readFileSync("policy.json")); // Sync or async used as per the app's needs.
    const context = JSON.parse(fs.readFileSync("context.json"));
    const options = { compact: true, ignoreComment: true, spaces: 4 };
    const output = prudens.forwardChaining(policy, context["context"]);
    // TODO: any reason for using Sync instead of Async?
    fs.writeFileSync("output.xml", toXML.js2xml(output, options));
}

function main() {
    deduce();
}

main();