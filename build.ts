import dts from "bun-plugin-dts";

await Bun.build({
	entrypoints: [
		"./src/Form.tsx",
		"./src/hooks.ts",
		"./src/responses.ts",
		"./cli/dev.ts",
		"./cli/prod.ts",
	],
	outdir: "./dist",
	plugins: [dts()],
	minify: true,
});
