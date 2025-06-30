// debug.js

const prudens = require("./prudens");
const parsers = require("./parsers");
const tests = require("./testbench");

function test(policyStr, contextStr) {
	const kbObject = parsers.parseKB(policyStr);
	const contextObject = parsers.parseContext(contextStr)["context"];
	const output = prudens.forwardChaining(kbObject, contextObject);
	return output;
}

function main() {
	tests.tests.forEach((t) => {
		p = t["policy"];
		c = t["context"];
		o = test(p, c);
		i = o["facts"].map(parsers.literalToString).join(", ");
		console.log(`Policy:\n${p}\n\nContext: ${c}\n\nInferences: ${i}`);
	});
}

main();
