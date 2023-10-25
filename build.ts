import dts from "bun-plugin-dts";

await Bun.build({
	entrypoints: [
		"./src/Form.tsx",
		"./src/hooks.ts",
		"./src/responses.ts",
		"./src/routes.ts",
		"./src/Layout.tsx",
		"./cli/dev.ts",
		"./cli/prod.ts",
	],
	outdir: "./dist",
	plugins: [dts()],
	external: ["react", "react-dom"],
});
