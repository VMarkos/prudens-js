// testbench.js

const tests = [
	{
		"policy": `@Knowledge
		E01 :: reject # approve;
		R01 :: a implies reject;
		R02 :: b implies iA;
		R03a :: c implies iAb;
		R03b :: iAb implies -iA;
		R04 :: iA, d implies iB;
		R05 :: e implies approve;
		R06 :: iB implies reject;`,
		"context": "a; b; c; d; e;",
	},
	{
		"policy": `@Knowledge
		E01 :: reject # approve;
		R01 :: a implies reject;
		R02 :: b implies iA;
		R03 :: c implies -iA;
		R04 :: iA, d implies iB;
		R05 :: e implies approve;
		R06 :: iB implies reject;`,
		"context": "a; b; c; d; e;",
	},
	{
		"policy": `@Knowledge
		E01 :: reject # approve;
		R01 :: a implies reject;
		R02 :: b implies iA | 0;
		R03a :: c implies iAb;
		R03b :: iAb implies -iA | 0;
		R04 :: iA, d implies iB;
		R05 :: e implies approve;
		R06 :: iB implies reject;`,
		"context": "a; b; c; d; e;",
	},
	{
		"policy": `@Knowledge
		E01 :: reject # approve;
		R10 :: suppose implies a | 0;
		R20 :: suppose implies b | 0;
		R30 :: a, b implies c | 70;
		R40 :: c implies reject | 20;
		R50 :: suppose implies -a | 0;
		R60 :: suppose implies d | 0;
		R70 :: d implies a | 100;`,
		"context": "suppose; perceive;",
	},
];

module.exports = {
	tests,
}
