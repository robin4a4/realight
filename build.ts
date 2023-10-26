import dts from "bun-plugin-dts";

await Bun.build({
	entrypoints: ["./index.ts", "./cli/index.ts"],
	outdir: "./dist",
	plugins: [dts()],
	splitting: true,
});
