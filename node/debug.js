// debug.js

const prudens = require("./prudens");
const parsers = require("./parsers");

function main() {
	const policy = `@Knowledge
	E01 :: reject # approve;
	R01 :: a implies reject;
	R02 :: b implies iA;
	R03a :: c implies iAb;
	R03b :: iAb implies -iA;
	R04 :: iA, d implies iB;
	R05 :: e implies approve;
	R06 :: iB implies reject;`;

	const simplerPolicy = `@Knowledge
	E01 :: reject # approve;
	R01 :: a implies reject;
	R02 :: b implies iA;
	R03 :: c implies -iA;
	R04 :: iA, d implies iB;
	R05 :: e implies approve;
	R06 :: iB implies reject;`;

	const dilemmaPolicy = `@Knowledge
	E01 :: reject # approve;
	R01 :: a implies reject;
	R02 :: b implies iA | 0;
	R03a :: c implies iAb;
	R03b :: iAb implies -iA | 0;
	R04 :: iA, d implies iB;
	R05 :: e implies approve;
	R06 :: iB implies reject;`;
	const context = "a; b; c; d; e;";
	const kbObject = parsers.parseKB(dilemmaPolicy);
	const contextObject = parsers.parseContext(context)["context"];
	const output = prudens.forwardChaining(kbObject, contextObject);
	// console.log(JSON.stringify(output, null, 4));
	// console.log(output);
	console.log(output["facts"].map(parsers.literalToString));
}

main();
